from ultralytics import YOLO

model = YOLO("best.pt")

# results = model.predict("crack-on-wall.jpg", save=True)
results = model.predict(
    source="uploads/original/1.jpg",
    save=True,
    project="uploads/",  # your custom directory
    exist_ok=True
)
