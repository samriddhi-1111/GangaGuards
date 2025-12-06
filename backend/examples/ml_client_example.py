import base64
import requests


def send_incident():
  url = "http://localhost:4000/api/incidents/ml"
  with open("frame.jpg", "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode("utf-8")

  data = {
    "image": img_b64,
    "lat": 25.3176,
    "lng": 82.9739,
    "locationText": "Assi Ghat, Varanasi"
  }

  resp = requests.post(url, json=data, timeout=10)
  print(resp.status_code, resp.text)


if __name__ == "__main__":
  send_incident()


