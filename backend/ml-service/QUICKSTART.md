# Quick Start Guide - ML Service Integration

## ✅ What's Been Set Up

Your YOLO model (`best.pt`) has been successfully integrated! Here's what's ready:

1. **Model Files**: 
   - ✅ `models/best.pt` - Your trained YOLO model
   - ✅ `models/best_old.pt` - Backup model

2. **ML Service**: Fully integrated YOLO detection service

3. **Video Detection**: Real-time camera detection script

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd backend/ml-service
pip install -r requirements.txt
```

### Step 2: Start Backend Server

In a separate terminal:

```bash
cd backend
npm run dev
```

The backend should start on `http://localhost:4000`

### Step 3: Run Video Detection

```bash
cd backend/ml-service
python video_detection.py
```

This will:
- Open your webcam
- Detect garbage in real-time
- Automatically send incidents to the backend when garbage is detected
- Show detection overlay on video feed
- Press 'q' to quit

## 📝 Usage Examples

### Process a Single Image

```python
from ml_service import MLService
from pathlib import Path

ml_service = MLService()
image_path = Path("path/to/your/image.jpg")
ml_service.process_image(
    image_path,
    lat=25.3176,
    lng=82.9739,
    location_text="Assi Ghat, Varanasi"
)
```

### Process All Images in a Folder

```python
from ml_service import MLService, process_image_folder
from pathlib import Path

ml_service = MLService()
folder = Path("path/to/images")
process_image_folder(folder, ml_service)
```

## ⚙️ Configuration

Edit `video_detection.py` to customize:

```python
COOLDOWN_SECONDS = 10  # Time between alerts (seconds)
CAMERA_INDEX = 0       # Camera device (0 = default webcam)

# Location info (optional)
lat = 25.3176          # Latitude
lng = 82.9739          # Longitude  
location_text = "Assi Ghat, Varanasi"
```

## 🔗 API Endpoint

The service sends incidents to:
- **Endpoint**: `POST http://localhost:4000/api/incidents/ml`
- **Format**: JSON with base64 encoded image

## 📁 File Structure

```
backend/ml-service/
├── models/
│   ├── best.pt        ← Your YOLO model (automatically loaded)
│   └── best_old.pt
├── ml_service.py      ← Core ML service class
├── video_detection.py ← Real-time video detection
├── detect.py          ← Original script (reference)
└── requirements.txt   ← Python dependencies
```

## 🎯 Next Steps

1. Test the video detection with your webcam
2. Adjust cooldown timing as needed
3. Set up location coordinates for your deployment
4. Consider adding GPS integration for automatic location detection

## 🐛 Troubleshooting

**Model not loading?**
- Check that `models/best.pt` exists
- Run: `pip install ultralytics`

**Backend connection error?**
- Make sure backend is running: `cd backend && npm run dev`
- Check backend URL in scripts matches your setup

**Camera not working?**
- Try changing `CAMERA_INDEX` to 1, 2, etc.
- Check camera permissions

