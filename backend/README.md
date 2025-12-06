## GangaGuard Backend

Node.js + Express + TypeScript backend for the GangaGuard app.

### Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file:

```bash
MONGO_URI="your-mongodb-atlas-uri"
PORT=4000
CLIENT_ORIGIN="*"
STORAGE_PROVIDER="local" # or "cloudinary" (requires CLOUDINARY_URL)
UPLOADS_DIR="uploads"
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID="project-ganga-bebb7"
```

- Download your Firebase Admin SDK key as `firebase-service-account.json` (same folder).
- Ensure Email/Password auth + Firestore are enabled in Firebase.

3. Run in dev:

```bash
npm run dev
```

### Firebase-backed Auth endpoints

- `POST /api/auth/bootstrap` – called by the mobile app after Firebase login to create/update the user profile (name, role).
- `GET /api/auth/me` – returns the Mongo profile for the currently authenticated Firebase user.

All other endpoints expect a Firebase ID token in the `Authorization: Bearer <token>` header.

### Key Endpoints

- `POST /api/incidents/ml`
- `GET /api/incidents/nearby?lat=..&lng=..&radiusKm=..`
- `POST /api/incidents/:id/accept`
- `POST /api/incidents/:id/complete`
- `GET /api/incidents/my`
- `GET /api/leaderboard/weekly`
- `GET /api/leaderboard/monthly`

### ML Service Integration

The ML service is located in `ml-service/` folder. See `ml-service/README.md` for setup instructions.

The ML service detects garbage in images and automatically sends incidents to `/api/incidents/ml` endpoint.


