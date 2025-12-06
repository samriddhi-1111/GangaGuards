from ultralytics import YOLO
import cv2
import requests
import base64
import time

model = YOLO("best.pt")

cap = cv2.VideoCapture(0)

BACKEND_URL = "http://localhost:3000/alert"   # later replace with ngrok for mobile app

COOLDOWN = 10
last_alert = time.time()

def send_alert(frame, labels):
    _, buffer = cv2.imencode('.jpg', frame)
    encoded = base64.b64encode(buffer).decode("utf-8")

    payload = {
        "location": "Ganga Ghat Demo",
        "labels": labels,
        "time": time.strftime("%H:%M:%S"),
        "image": encoded
    }

    try:
        requests.post(BACKEND_URL, json=payload)
        print("🚀 Alert Sent!")
    except Exception as e:
        print("❌ Backend Error:", e)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)[0]
    labels = [model.names[int(box.cls[0])] for box in results.boxes]

    annotated = results.plot()
    cv2.imshow("Ganga Garbage Detection - Live", annotated)

    if labels and (time.time() - last_alert > COOLDOWN):
        send_alert(annotated, list(set(labels)))
        last_alert = time.time()

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
