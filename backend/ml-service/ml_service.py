"""
ML Service for GangaGuard
Detects garbage incidents in images and sends them to the backend API.
"""
import os
import base64
import requests
from pathlib import Path
from typing import Optional, Dict, Any, Union
from PIL import Image
import numpy as np
import cv2
from ultralytics import YOLO

# Configuration
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:4000")
MODEL_DIR = Path(__file__).parent / "models"
API_ENDPOINT = f"{BACKEND_API_URL}/api/incidents/ml"


class MLService:
    """Main ML service class that handles YOLO model loading and inference."""
    
    def __init__(self, model_path: Optional[Path] = None):
        """
        Initialize the ML service with YOLO model.
        
        Args:
            model_path: Path to the trained model file. If None, looks in models/ folder.
        """
        self.model = None
        self.model_path = model_path or self._find_model()
        self._load_model()
    
    def _find_model(self) -> Optional[Path]:
        """Find model file in the models directory."""
        if not MODEL_DIR.exists():
            MODEL_DIR.mkdir(parents=True, exist_ok=True)
            print(f"⚠️  Created {MODEL_DIR} directory. Please add your trained model here.")
            return None
        
        # Look for YOLO model files (prefer best.pt over best_old.pt)
        best_model = MODEL_DIR / "best.pt"
        if best_model.exists():
            return best_model
        
        # Look for any .pt files
        pt_files = list(MODEL_DIR.glob("*.pt"))
        if pt_files:
            return pt_files[0]
        
        print(f"⚠️  No model file found in {MODEL_DIR}")
        return None
    
    def _load_model(self):
        """Load YOLO model."""
        if self.model_path is None:
            print("⚠️  No model to load.")
            return
        
        try:
            print(f"📦 Loading YOLO model from: {self.model_path}")
            self.model = YOLO(str(self.model_path))
            print(f"✅ Model loaded successfully!")
            print(f"   Classes: {list(self.model.names.values())}")
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            self.model = None
    
    def detect_garbage(self, image: Union[Image.Image, np.ndarray]) -> Dict[str, Any]:
        """
        Run YOLO inference on an image to detect garbage.
        
        Args:
            image: PIL Image object or numpy array
            
        Returns:
            Dictionary with detection results:
            {
                "has_garbage": bool,
                "confidence": float,
                "labels": list,  # Detected class labels
                "boxes": list,   # Bounding boxes
                "count": int     # Number of detections
            }
        """
        if self.model is None:
            return {
                "has_garbage": False,
                "confidence": 0.0,
                "labels": [],
                "boxes": [],
                "count": 0
            }
        
        try:
            # Convert PIL Image to numpy array if needed
            if isinstance(image, Image.Image):
                image_array = np.array(image)
            else:
                image_array = image
            
            # Run YOLO inference
            results = self.model(image_array, verbose=False)[0]
            
            # Extract detections
            boxes = results.boxes
            if len(boxes) == 0:
                return {
                    "has_garbage": False,
                    "confidence": 0.0,
                    "labels": [],
                    "boxes": [],
                    "count": 0
                }
            
            # Get labels and confidences
            labels = []
            confidences = []
            for box in boxes:
                class_id = int(box.cls[0])
                label = self.model.names[class_id]
                confidence = float(box.conf[0])
                labels.append(label)
                confidences.append(confidence)
            
            # Calculate average confidence
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            return {
                "has_garbage": True,
                "confidence": avg_confidence,
                "labels": labels,
                "boxes": boxes.data.tolist() if hasattr(boxes, 'data') else [],
                "count": len(labels)
            }
        except Exception as e:
            print(f"❌ Error during detection: {str(e)}")
            return {
                "has_garbage": False,
                "confidence": 0.0,
                "labels": [],
                "boxes": [],
                "count": 0
            }
    
    def process_image(self, image_path: Path, lat: Optional[float] = None, 
                     lng: Optional[float] = None, location_text: Optional[str] = None) -> bool:
        """
        Process an image file and send detected incidents to the backend.
        
        Args:
            image_path: Path to the image file
            lat: Latitude (optional)
            lng: Longitude (optional)
            location_text: Location description (optional)
            
        Returns:
            True if incident was successfully sent, False otherwise
        """
        try:
            # Load and process image
            image = Image.open(image_path)
            detection = self.detect_garbage(image)
            
            # Only send if garbage is detected
            if not detection.get("has_garbage", False):
                print(f"✅ No garbage detected in {image_path.name}")
                return False
            
            confidence = detection.get("confidence", 0.0)
            labels = detection.get("labels", [])
            count = detection.get("count", 0)
            
            print(f"🗑️  Garbage detected in {image_path.name}")
            print(f"   Detections: {count} objects")
            print(f"   Labels: {', '.join(set(labels))}")
            print(f"   Confidence: {confidence:.2%}")
            
            # Convert image to base64
            image_bytes = image_path.read_bytes()
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
            
            # Prepare data for API
            data = {
                "image": image_b64,
            }
            
            if lat is not None and lng is not None:
                data["lat"] = lat
                data["lng"] = lng
            
            if location_text:
                data["locationText"] = location_text
            
            # Send to backend API
            response = requests.post(API_ENDPOINT, json=data, timeout=10)
            
            if response.status_code == 201:
                print(f"✅ Successfully sent incident to backend!")
                incident = response.json()
                print(f"   Incident ID: {incident.get('_id', 'N/A')}")
                return True
            else:
                print(f"❌ Failed to send incident: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error processing {image_path.name}: {str(e)}")
            return False
    
    def process_frame(self, frame: np.ndarray, lat: Optional[float] = None,
                     lng: Optional[float] = None, location_text: Optional[str] = None) -> tuple[bool, Optional[np.ndarray]]:
        """
        Process a video frame and optionally send detected incidents to the backend.
        
        Args:
            frame: numpy array representing the video frame (BGR format from OpenCV)
            lat: Latitude (optional)
            lng: Longitude (optional)
            location_text: Location description (optional)
            
        Returns:
            Tuple of (should_send_alert: bool, annotated_frame: np.ndarray)
        """
        try:
            # Convert BGR to RGB for YOLO
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if len(frame.shape) == 3 else frame
            
            # Run detection
            detection = self.detect_garbage(frame_rgb)
            
            # Get annotated frame from YOLO
            if self.model:
                results = self.model(frame_rgb, verbose=False)[0]
                annotated_frame = results.plot()
                annotated_frame_bgr = cv2.cvtColor(annotated_frame, cv2.COLOR_RGB2BGR)
            else:
                annotated_frame_bgr = frame
            
            # Check if garbage was detected
            has_garbage = detection.get("has_garbage", False)
            
            return has_garbage, annotated_frame_bgr
            
        except Exception as e:
            print(f"❌ Error processing frame: {str(e)}")
            return False, frame


def process_image_folder(folder_path: Path, ml_service: MLService):
    """
    Process all images in a folder.
    
    Args:
        folder_path: Path to folder containing images
        ml_service: MLService instance
    """
    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".gif"}
    image_files = [f for f in folder_path.iterdir() 
                   if f.suffix.lower() in image_extensions]
    
    if not image_files:
        print(f"⚠️  No image files found in {folder_path}")
        return
    
    print(f"📁 Processing {len(image_files)} images from {folder_path}")
    
    for img_path in image_files:
        print(f"\n📸 Processing: {img_path.name}")
        ml_service.process_image(img_path)


def main():
    """Main entry point for the ML service."""
    print("🚀 Starting GangaGuard ML Service...")
    print(f"📡 Backend API: {BACKEND_API_URL}")
    
    # Initialize ML service
    ml_service = MLService()
    
    # Example usage:
    # 1. Process a single image
    # image_path = Path("path/to/image.jpg")
    # ml_service.process_image(image_path, lat=25.3176, lng=82.9739, location_text="Assi Ghat, Varanasi")
    
    # 2. Process all images in a folder
    # folder_path = Path("path/to/images")
    # process_image_folder(folder_path, ml_service)
    
    # 3. For real-time processing, you can set up a camera feed or file watcher here
    print("\n💡 To process images, uncomment the examples in main() or create your own processing logic.")


if __name__ == "__main__":
    main()

