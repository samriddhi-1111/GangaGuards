from ultralytics import YOLO
import cv2
import requests
import base64
import time

model = YOLO("best.pt")

cap = cv2.VideoCapture(0)

# Correct API endpoint
BACKEND_URL = "http://localhost:3000/api/incidents/ml"

COOLDOWN = 10
last_alert = 0
detection_start_time = None
REQUIRED_DETECTION_DURATION = 3 # seconds

def send_alert(frame, labels):
    _, buffer = cv2.imencode('.jpg', frame)
    encoded = base64.b64encode(buffer).decode("utf-8")

    payload = {
        "locationText": "Ganga Ghat Demo", # Matches backend field name
        "labels": labels,
        "image": encoded,
        # Optional: Add simulated lat/lng if needed
        "lat": 25.285217,
        "lng": 82.790942
    }

    try:
        print("🚀 Sending Alert to Backend...")
        res = requests.post(BACKEND_URL, json=payload)
        if res.status_code in [200, 201]:
             print("✅ Alert Sent & Saved!")
        else:
             print(f"⚠️ Backend returned {res.status_code}: {res.text}")
    except Exception as e:
        print("❌ Backend Error:", e)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)[0]
    labels = [model.names[int(box.cls[0])] for box in results.boxes]

    annotated = results.plot()
    
    # --- Detection Logic with 3-Second Delay ---
    if labels:
        if detection_start_time is None:
            detection_start_time = time.time() # Start timer
            print("👀 Garbage detected... waiting 3 seconds.")
        
        elapsed = time.time() - detection_start_time
        
        # Add visual countdown on screen
        cv2.putText(annotated, f"Capturing in: {max(0, 3 - elapsed):.1f}s", (10, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        if elapsed >= REQUIRED_DETECTION_DURATION:
            if time.time() - last_alert > COOLDOWN:
                print("📸 CAPTURING NOW!")
                send_alert(annotated, list(set(labels)))
                last_alert = time.time()
                detection_start_time = None # Reset
            else:
                 cv2.putText(annotated, "Cooldown...", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    else:
        if detection_start_time is not None:
             print("❌ Object lost. Timer reset.")
        detection_start_time = None # Reset if object leaves frame

    cv2.imshow("Ganga Garbage Detection - Live", annotated)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
