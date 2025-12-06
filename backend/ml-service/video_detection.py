"""
Real-time video detection for GangaGuard
Uses YOLO model to detect garbage in live camera feed and sends incidents to backend API.
"""
import os
import base64
import time
import cv2
import requests
from pathlib import Path
from ml_service import MLService

# Configuration
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:4000")
API_ENDPOINT = f"{BACKEND_API_URL}/api/incidents/ml"
COOLDOWN_SECONDS = 10  # Minimum seconds between alerts
DETECTION_CAPTURE_DELAY = int(os.getenv("DETECTION_CAPTURE_DELAY", "2"))  # seconds after detection before sending
CAMERA_INDEX = 0  # Default camera (0 for webcam)


def send_incident(frame, labels: list, lat: float = None, lng: float = None, 
                 location_text: str = None):
    """
    Send detected incident to backend API.
    
    Args:
        frame: OpenCV frame (BGR format)
        labels: List of detected class labels
        lat: Latitude (optional)
        lng: Longitude (optional)
        location_text: Location description (optional)
    """
    try:
        # Encode frame to JPEG and convert to base64
        _, buffer = cv2.imencode('.jpg', frame)
        image_b64 = base64.b64encode(buffer).decode("utf-8")
        
        # Prepare payload
        payload = {
            "image": image_b64,
        }
        
        if lat is not None and lng is not None:
            payload["lat"] = lat
            payload["lng"] = lng
        
        if location_text:
            payload["locationText"] = location_text
        
        # Send to backend API
        response = requests.post(API_ENDPOINT, json=payload, timeout=10)
        
        if response.status_code == 201:
            incident = response.json()
            print(f"🚀 Alert sent! Incident ID: {incident.get('_id', 'N/A')}")
            print(f"   Detected objects: {', '.join(set(labels))}")
            return True
        else:
            print(f"❌ Backend Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error sending alert: {str(e)}")
        return False


def run_video_detection(camera_index: int = CAMERA_INDEX, 
                       cooldown: int = COOLDOWN_SECONDS,
                       lat: float = None,
                       lng: float = None,
                       location_text: str = None):
    """
    Run real-time video detection from camera feed.
    
    Args:
        camera_index: Camera device index (default: 0)
        cooldown: Seconds between alerts (default: 10)
        lat: Latitude for incidents (optional)
        lng: Longitude for incidents (optional)
        location_text: Location description (optional)
    """
    print("🚀 Starting GangaGuard Video Detection...")
    print(f"📡 Backend API: {BACKEND_API_URL}")
    print(f"📹 Camera: {camera_index}")
    print(f"⏱️  Alert cooldown: {cooldown} seconds")
    print("\nPress 'q' to quit\n")
    
    # Initialize ML service
    ml_service = MLService()
    
    if ml_service.model is None:
        print("❌ Failed to load ML model. Exiting.")
        return
    
    # Open camera
    cap = cv2.VideoCapture(camera_index)
    
    if not cap.isOpened():
        print(f"❌ Error: Could not open camera {camera_index}")
        return
    
    last_alert_time = 0
    detection_start_time = None
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Error: Failed to read frame from camera")
                break
            
            # Process frame with ML service
            has_garbage, annotated_frame = ml_service.process_frame(frame)
            
            # Display annotated frame
            cv2.imshow("GangaGuard - Garbage Detection (Press 'q' to quit)", annotated_frame)
            
            # Check if garbage detected and cooldown passed
            if has_garbage:
                # Get detection details
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                detection = ml_service.detect_garbage(frame_rgb)
                labels = detection.get("labels", [])

                current_time = time.time()
                time_since_last_alert = current_time - last_alert_time

                # Start a detection timer the first time we see garbage
                if detection_start_time is None:
                    detection_start_time = current_time

                elapsed_since_detection = current_time - detection_start_time

                if elapsed_since_detection >= DETECTION_CAPTURE_DELAY and time_since_last_alert >= cooldown:
                    print(
                        f"\n🗑️  Garbage confirmed ({len(labels)} objects). "
                        f"Sending frame after {DETECTION_CAPTURE_DELAY}s delay."
                    )
                    send_incident(annotated_frame, labels, lat, lng, location_text)
                    last_alert_time = current_time
                    detection_start_time = None  # reset for next detection window
                else:
                    wait_for = max(0, DETECTION_CAPTURE_DELAY - elapsed_since_detection)
                    remaining_cooldown = max(0, cooldown - time_since_last_alert)
                    print(
                        f"⏳ Waiting: {wait_for:.1f}s for capture, "
                        f"{remaining_cooldown:.1f}s for cooldown"
                    )
            else:
                # Reset timer if detection stops
                detection_start_time = None
            
            # Check for quit key
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("✅ Video detection stopped.")


if __name__ == "__main__":
    import sys
    
    # Allow location to be passed as command line arguments or use defaults
    # Usage: python video_detection.py [lat] [lng] [location_text]
    
    lat = None
    lng = None
    location_text = None
    
    if len(sys.argv) >= 3:
        try:
            lat = float(sys.argv[1])
            lng = float(sys.argv[2])
            if len(sys.argv) >= 4:
                location_text = sys.argv[3]
        except ValueError:
            print("⚠️  Invalid coordinates. Using defaults.")
    
    # Use defaults if not provided
    if lat is None or lng is None:
        # print("🌍 Attempting to detect device location...")
        # from location_helper import get_location_from_gps
        # lat, lng, location_text = get_location_from_gps()

        # FORCE ASSI GHAT (User Provided)
        lat = 25.285217
        lng = 82.790942
        location_text = "Assi Ghat, Varanasi"
        print(f"📍 Using Fixed Location: {location_text} ({lat}, {lng})")
        
    else:
        location_text = location_text or f"Location ({lat}, {lng})"
        print(f"📍 Using provided location: {location_text} ({lat}, {lng})")
    
    run_video_detection(
        camera_index=CAMERA_INDEX,
        cooldown=COOLDOWN_SECONDS,
        lat=lat,
        lng=lng,
        location_text=location_text
    )

