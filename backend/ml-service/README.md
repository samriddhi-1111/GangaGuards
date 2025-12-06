# ML Service for GangaGuard

This folder contains the machine learning service that detects garbage incidents using YOLO and sends them to the backend API.

## Folder Structure

```
ml-service/
├── models/              # Your trained YOLO model files
│   ├── best.pt         # Primary YOLO model
│   └── best_old.pt     # Backup model (optional)
├── ml_service.py        # Core ML service class
├── video_detection.py   # Real-time camera detection script
├── detect.py           # Original detection script (reference)
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Setup Instructions

1. **Install Python dependencies:**
   ```bash
   cd backend/ml-service
   pip install -r requirements.txt
   ```

2. **Verify model files:**
   - Your `best.pt` model should already be in the `models/` folder
   - The service will automatically load `best.pt` if available

3. **Configure backend URL (optional):**
   - Default backend: `http://localhost:4000`
   - To change it, set environment variable: `BACKEND_API_URL=http://your-backend-url:port`
   - Or edit the `BACKEND_API_URL` in the scripts

4. **Make sure backend is running:**
   - Start the backend server first: `cd backend && npm run dev`
   - Backend should be accessible at `http://localhost:4000`

## Usage

### 1. Real-Time Video Detection

Run live camera detection:

```bash
cd backend/ml-service
python video_detection.py
```

This will:
- Open your webcam
- Detect garbage in real-time
- Send incidents to the backend API every 10 seconds (cooldown)
- Press 'q' to quit

You can customize in `video_detection.py`:
- `CAMERA_INDEX`: Change camera device (default: 0)
- `COOLDOWN_SECONDS`: Time between alerts (default: 10)
- Location info: `lat`, `lng`, `location_text`

### 2. Process Single Image

Use the ML service in Python:

```python
from ml_service import MLService
from pathlib import Path

# Initialize service
ml_service = MLService()

# Process an image
image_path = Path("path/to/image.jpg")
ml_service.process_image(
    image_path,
    lat=25.3176,
    lng=82.9739,
    location_text="Assi Ghat, Varanasi"
)
```

### 3. Process Image Folder

```python
from ml_service import MLService, process_image_folder
from pathlib import Path

ml_service = MLService()
folder_path = Path("path/to/images")
process_image_folder(folder_path, ml_service)
```

## API Integration

The service sends incidents to the backend endpoint: `POST /api/incidents/ml`

Payload format:
```json
{
  "image": "base64_encoded_image_string",
  "lat": 25.3176,
  "lng": 82.9739,
  "locationText": "Assi Ghat, Varanasi"
}
```

## Model Details

- **Framework**: Ultralytics YOLO
- **Model File**: `best.pt` (auto-loaded from `models/` folder)
- **Detection**: Real-time object detection for garbage items
- **Output**: Sends detected incidents to backend API automatically

## Troubleshooting

1. **Model not loading:**
   - Check that `best.pt` exists in `models/` folder
   - Verify ultralytics is installed: `pip install ultralytics`

2. **Camera not working:**
   - Try changing `CAMERA_INDEX` in `video_detection.py`
   - Check camera permissions

3. **Backend connection error:**
   - Ensure backend is running: `cd backend && npm run dev`
   - Check backend URL matches your setup
   - Verify backend endpoint: `POST /api/incidents/ml`

