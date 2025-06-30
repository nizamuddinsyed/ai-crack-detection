# CrackDetect Pro - AI-Powered Crack Detection SaaS

A professional crack detection platform using YOLO deep learning models with a complete web interface for real-time analysis.

## Features

### Core Functionality
- **Real-time Crack Detection**: Upload images and get instant crack analysis using YOLO models
- **Interactive Results**: View detected cracks with bounding boxes and confidence scores
- **Batch Processing**: Process multiple images efficiently
- **Detection History**: Track all previous analyses with detailed results

### User Management
- **Secure Authentication**: JWT-based authentication system
- **Subscription Tiers**: Free tier (10 detections) and Pro tier (unlimited)
- **Usage Tracking**: Monitor API usage and limits
- **Account Dashboard**: Comprehensive user analytics

### Analytics & Insights
- **Detection Statistics**: Total detections, cracks found, processing times
- **Activity Charts**: Visualize detection patterns over time
- **Export Capabilities**: Download results and reports
- **Performance Metrics**: Confidence scores and processing analytics

## Technology Stack

### Backend (FastAPI)
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLite**: Lightweight database for development
- **YOLO (Ultralytics)**: State-of-the-art object detection model
- **JWT Authentication**: Secure token-based authentication
- **Async Processing**: Non-blocking image processing

### Frontend (React + TypeScript)
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **React Dropzone**: Drag-and-drop file uploads
- **Recharts**: Data visualization components

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Your trained YOLO model (`best.pt`)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
npm install
npm run dev
```

### Required Files
Make sure you have:
- `backend/best.pt` - Your trained YOLO model
- `backend/uploads/` - Directory for storing images

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Detection
- `POST /api/detect` - Upload image for crack detection
- `GET /api/detections` - Get detection history
- `GET /api/stats` - Get user statistics

### Images
- `GET /api/images/results/{filename}` - Serve result images
- `GET /api/images/original/{filename}` - Serve original images

## Business Model

### Free Tier
- 10 detections per month
- Basic detection results
- Standard processing speed
- Email support

### Pro Tier ($29/month)
- Unlimited detections
- Detailed analytics
- Priority processing
- Advanced export options
- Priority support

## Security Features

- JWT-based authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure file upload handling
- CORS configuration
- SQL injection prevention

## Performance Optimizations

- Async processing for non-blocking operations
- Image compression and optimization
- Database indexing for fast queries
- Caching of frequently accessed data
- Efficient memory management

## Deployment

### Production Considerations
- Use PostgreSQL instead of SQLite
- Add Redis for caching
- Implement proper logging
- Add monitoring and alerting
- Use environment variables for secrets
- Set up automated backups

### Scaling
- Horizontal scaling with load balancers
- Container deployment with Docker
- CDN for static assets
- Database read replicas
- Queue system for batch processing

## License

This project is proprietary software. All rights reserved.

## Support

For technical support or business inquiries, contact: support@crackdetectpro.com