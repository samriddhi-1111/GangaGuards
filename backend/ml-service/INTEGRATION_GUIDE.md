# Complete Integration Guide - ML Detection to Mobile App

This guide explains how the complete flow works from ML detection to displaying incidents in the mobile app.

## 🔄 Complete Flow

```
ML Model Detects Garbage
    ↓
Takes Screenshot/Image
    ↓
Sends to Backend API (/api/incidents/ml)
    ↓
Backend Stores Image & Creates Incident in Database
    ↓
Backend Emits Socket.io Event (incident:new)
    ↓
Mobile App Receives Real-time Notification
    ↓
App Fetches Nearby Incidents
    ↓
Displays Image to Nearest Users
```

## 📋 Setup Checklist

### 1. Backend Setup ✅

- [x] Backend server running on port 4000
- [x] MongoDB connected
- [x] Images stored in `uploads/` folder
- [x] Static file serving enabled for `/uploads/`
- [x] Socket.io configured for real-time updates
- [x] Absolute URLs returned for images

### 2. ML Service Setup ✅

- [x] YOLO model (`best.pt`) in `models/` folder
- [x] Python dependencies installed
- [x] Location configured

### 3. Mobile App Setup ✅

- [x] App configured with backend API URL
- [x] Location permissions granted
- [x] Socket.io connected for real-time updates

## 🚀 Running the Complete System

### Step 1: Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend should be running at `http://localhost:4000`

### Step 2: Configure ML Service Location

**Option A: Use Location Helper**
```bash
cd backend/ml-service
python location_helper.py --gps  # Try GPS first
# OR
python location_helper.py        # Manual input
```

**Option B: Direct Input**
```bash
cd backend/ml-service
python video_detection.py <latitude> <longitude> "<location name>"
```

Example:
```bash
python video_detection.py 25.3176 82.9739 "Assi Ghat, Varanasi"
```

### Step 3: Run ML Detection

```bash
cd backend/ml-service
python video_detection.py
```

This will:
- Open webcam
- Detect garbage in real-time
- Send incidents to backend when detected
- Wait 10 seconds between alerts (cooldown)

### Step 4: Start Mobile App

```bash
cd mobile
npm install
npm start
```

Then:
- Open Expo Go app on your phone
- Scan QR code
- Grant location permissions
- Navigate to "Nearby Tasks" screen

## 📱 What Users See

When ML detects garbage:

1. **Backend stores the incident:**
   - Image saved to `backend/uploads/incident-before-*.jpg`
   - Incident created in MongoDB with:
     - Image URL (absolute)
     - Location coordinates
     - Status: PENDING
     - Timestamp

2. **Real-time notification:**
   - Socket.io emits `incident:new` event
   - All connected mobile apps receive notification
   - Apps automatically refresh nearby incidents

3. **Users see in app:**
   - Image of detected garbage
   - Location name/address
   - Distance from their location
   - "Accept Task" button

4. **User accepts task:**
   - Status changes to CLAIMED
   - Task appears in "My Tasks" screen
   - User can complete and upload "after" photo

## 🗄️ Database Storage

Incidents are stored in MongoDB with this structure:

```javascript
{
  _id: ObjectId,
  imageBeforeUrl: "http://localhost:4000/uploads/incident-before-123456.jpg",
  location: {
    type: "Point",
    coordinates: [82.9739, 25.3176]  // [lng, lat]
  },
  addressText: "Assi Ghat, Varanasi",
  status: "PENDING",  // or "CLAIMED" or "CLEANED"
  createdAt: ISODate,
  updatedAt: ISODate
}
```

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/gangaguard
PORT=4000
CLIENT_ORIGIN=*
STORAGE_PROVIDER=local
UPLOADS_DIR=uploads
BASE_URL=http://localhost:4000
```

### ML Service Environment Variables

Set `BACKEND_API_URL` if backend is on different host:

```bash
export BACKEND_API_URL=http://192.168.1.100:4000
python video_detection.py
```

## 📸 Image Storage

- **Storage Path**: `backend/uploads/`
- **Naming**: `incident-before-<timestamp>.jpg`
- **URL Format**: `http://<backend-host>:4000/uploads/incident-before-<timestamp>.jpg`
- **Static Serving**: Automatically served via Express static middleware

## 🎯 Key Features

✅ **Automatic Detection**: ML model automatically detects garbage  
✅ **Location Tracking**: GPS coordinates stored with each incident  
✅ **Real-time Updates**: Socket.io broadcasts new incidents instantly  
✅ **Nearby Filtering**: Only shows incidents within 3km radius  
✅ **Image Storage**: All images stored in backend and database  
✅ **Absolute URLs**: Full URLs ensure images load on mobile devices  

## 🐛 Troubleshooting

### Images not showing in app?

1. Check backend is running: `curl http://localhost:4000`
2. Verify image exists: `curl http://localhost:4000/uploads/<filename>`
3. Check image URL in database is absolute (starts with `http://`)
4. Verify mobile app can reach backend (check network)

### ML not sending incidents?

1. Check backend is accessible: `curl http://localhost:4000/api/incidents/ml`
2. Verify model is loaded (should see "Model loaded successfully")
3. Check camera permissions
4. Verify location is provided (lat/lng)

### Real-time updates not working?

1. Check Socket.io connection in backend logs
2. Verify mobile app is connected to socket
3. Check `incident:new` event is being emitted

## 📝 Next Steps

- [ ] Add reverse geocoding for better location names
- [ ] Implement GPS module in ML service
- [ ] Add image compression for faster uploads
- [ ] Set up Cloudinary for cloud storage
- [ ] Add push notifications for new incidents

