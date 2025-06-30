from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
import uuid
from datetime import datetime, timedelta
import json
import jwt
from typing import Optional, List
import hashlib
from pydantic import BaseModel, EmailStr
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import io
import base64
import sqlite3
from contextlib import contextmanager
import asyncio
import aiofiles

app = FastAPI(title="CrackDetect Pro", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

# Load YOLO model
model = YOLO("best.pt")

# Database setup
DATABASE_URL = "crackdetect.db"

def init_db():
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            subscription_tier TEXT DEFAULT 'free',
            api_calls_used INTEGER DEFAULT 0,
            api_calls_limit INTEGER DEFAULT 10,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Detections table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            filename TEXT NOT NULL,
            original_path TEXT NOT NULL,
            result_path TEXT NOT NULL,
            crack_count INTEGER DEFAULT 0,
            confidence_scores TEXT,
            processing_time REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # Create test user if it doesn't exist
    test_email = "test@test.com"
    test_password = "test"
    cursor.execute("SELECT id FROM users WHERE email = ?", (test_email,))
    if not cursor.fetchone():
        password_hash = hashlib.sha256(test_password.encode()).hexdigest()
        cursor.execute(
            "INSERT INTO users (email, password_hash, subscription_tier, api_calls_limit) VALUES (?, ?, ?, ?)",
            (test_email, password_hash, "pro", 1000)
        )
        print(f"✅ Test user created:")
        print(f"   Email: {test_email}")
        print(f"   Password: {test_password}")
        print(f"   Subscription: Pro (1000 API calls)")
    
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class DetectionResult(BaseModel):
    id: int
    filename: str
    crack_count: int
    confidence_scores: List[float]
    processing_time: float
    created_at: str
    result_image_url: str

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def create_access_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Ensure directories exist
os.makedirs("uploads/original", exist_ok=True)
os.makedirs("uploads/results", exist_ok=True)

# Initialize database
init_db()

# Auth endpoints
@app.post("/api/auth/register")
async def register(user: UserCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        password_hash = hash_password(user.password)
        cursor.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (user.email, password_hash)
        )
        user_id = cursor.lastrowid
        conn.commit()
        
        token = create_access_token(user_id, user.email)
        return {"access_token": token, "token_type": "bearer"}

@app.post("/api/auth/login")
async def login(user: UserLogin):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, password_hash FROM users WHERE email = ?", (user.email,))
        db_user = cursor.fetchone()
        
        if not db_user or not verify_password(user.password, db_user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_access_token(db_user["id"], user.email)
        return {"access_token": token, "token_type": "bearer"}

@app.get("/api/auth/me")
async def get_current_user(payload: dict = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, email, subscription_tier, api_calls_used, api_calls_limit FROM users WHERE id = ?",
            (payload["user_id"],)
        )
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return dict(user)

# Detection endpoints
@app.post("/api/detect")
async def detect_cracks(
    file: UploadFile = File(...),
    payload: dict = Depends(verify_token)
):
    start_time = datetime.now()
    
    # Check API limits
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT api_calls_used, api_calls_limit FROM users WHERE id = ?",
            (payload["user_id"],)
        )
        user = cursor.fetchone()
        
        if user["api_calls_used"] >= user["api_calls_limit"]:
            raise HTTPException(status_code=429, detail="API limit exceeded")
    
    # Validate file
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = file.filename.split(".")[-1]
    filename = f"{file_id}.{file_extension}"
    
    # Save original image
    original_path = f"uploads/original/{filename}"
    async with aiofiles.open(original_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    try:
        # Run YOLO detection
        results = model.predict(
            source=original_path,
            save=True,
            project="uploads/results",
            name=file_id,
            exist_ok=True,
            conf=0.5
        )
        
        # Process results
        result = results[0]
        boxes = result.boxes
        crack_count = len(boxes) if boxes is not None else 0
        confidence_scores = boxes.conf.tolist() if boxes is not None else []
        
        # Move result image to proper location
        result_filename = f"{file_id}_result.jpg"
        result_path = f"uploads/results/{result_filename}"
        
        # Copy the predicted image from YOLO's output
        yolo_output_path = f"uploads/results/{file_id}/{filename}"
        if os.path.exists(yolo_output_path):
            os.rename(yolo_output_path, result_path)
            # Clean up YOLO directory
            os.rmdir(f"uploads/results/{file_id}")
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Save to database
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO detections 
                   (user_id, filename, original_path, result_path, crack_count, confidence_scores, processing_time)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (payload["user_id"], filename, original_path, result_path, 
                 crack_count, json.dumps(confidence_scores), processing_time)
            )
            detection_id = cursor.lastrowid
            
            # Update API usage
            cursor.execute(
                "UPDATE users SET api_calls_used = api_calls_used + 1 WHERE id = ?",
                (payload["user_id"],)
            )
            conn.commit()
        
        return {
            "id": detection_id,
            "filename": filename,
            "crack_count": crack_count,
            "confidence_scores": confidence_scores,
            "processing_time": processing_time,
            "result_image_url": f"/api/images/results/{result_filename}"
        }
        
    except Exception as e:
        # Clean up files on error
        if os.path.exists(original_path):
            os.remove(original_path)
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.get("/api/detections")
async def get_detections(payload: dict = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT id, filename, crack_count, confidence_scores, processing_time, created_at, result_path
               FROM detections WHERE user_id = ? ORDER BY created_at DESC LIMIT 50""",
            (payload["user_id"],)
        )
        detections = cursor.fetchall()
        
        result = []
        for detection in detections:
            result_filename = os.path.basename(detection["result_path"])
            result.append({
                "id": detection["id"],
                "filename": detection["filename"],
                "crack_count": detection["crack_count"],
                "confidence_scores": json.loads(detection["confidence_scores"]),
                "processing_time": detection["processing_time"],
                "created_at": detection["created_at"],
                "result_image_url": f"/api/images/results/{result_filename}"
            })
        
        return result

@app.get("/api/stats")
async def get_stats(payload: dict = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Total detections
        cursor.execute("SELECT COUNT(*) as total FROM detections WHERE user_id = ?", (payload["user_id"],))
        total_detections = cursor.fetchone()["total"]
        
        # Total cracks found
        cursor.execute("SELECT SUM(crack_count) as total FROM detections WHERE user_id = ?", (payload["user_id"],))
        total_cracks = cursor.fetchone()["total"] or 0
        
        # Recent detections (last 7 days)
        cursor.execute(
            """SELECT DATE(created_at) as date, COUNT(*) as count 
               FROM detections 
               WHERE user_id = ? AND created_at >= date('now', '-7 days')
               GROUP BY DATE(created_at)
               ORDER BY date""",
            (payload["user_id"],)
        )
        recent_activity = [dict(row) for row in cursor.fetchall()]
        
        return {
            "total_detections": total_detections,
            "total_cracks": total_cracks,
            "recent_activity": recent_activity
        }

# Serve images
@app.get("/api/images/results/{filename}")
async def get_result_image(filename: str):
    file_path = f"uploads/results/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Image not found")

@app.get("/api/images/original/{filename}")
async def get_original_image(filename: str):
    file_path = f"uploads/original/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Image not found")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)