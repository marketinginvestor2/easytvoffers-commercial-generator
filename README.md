
# Easy TV Offers - Architecture & Deployment

## Architecture
- **Frontend**: React + Tailwind + Lucide Icons, hosted on Firebase.
- **Backend**: Node.js 20 Express on Google Cloud Run.
- **AI**: Gemini 3 Flash (Script/Logic), Gemini 2.5 Flash Image (Visuals), Gemini 2.5 Flash TTS (Audio).
- **Storage**: GCS for assets.
- **Tracking**: Google Sheets for leads and status.
- **Video**: FFmpeg in Cloud Run combining all assets into a 15s MP4.
- **Distribution**: YouTube Data API (Unlisted upload).

## Environment Variables (Cloud Run)
- `API_KEY`: Google Gemini API Key.
- `GCS_BUCKET`: Name of your GCS bucket.
- `GOOGLE_SHEET_ID`: ID of your lead tracking sheet.
- `GOOGLE_PROJECT_ID`: Your GCP project ID.
- `BACKEND_URL`: The Cloud Run service URL.
- `INTERNAL_TOKEN`: A secret string for task security.
- `YOUTUBE_CLIENT_ID`: OAuth2 Client ID.
- `YOUTUBE_CLIENT_SECRET`: OAuth2 Client Secret.
- `YOUTUBE_REFRESH_TOKEN`: Refresh token with `youtube.upload` scope.

## Deployment Steps

### 1. Backend (Cloud Run)
```bash
cd backend
# Build and Push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/easytv-backend
# Deploy to Cloud Run
gcloud run deploy easytv-backend \
  --image gcr.io/YOUR_PROJECT_ID/easytv-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "API_KEY=...,GCS_BUCKET=...,..."
```

### 2. Cloud Tasks Queue
```bash
gcloud tasks queues create commercial-render-queue --location=us-central1
```

### 3. Frontend (Firebase)
```bash
# Build frontend (outside backend folder)
npm run build
# Deploy
firebase deploy
```

## Google Sheets Columns
The sheet should have these headers in Row 1:
`previewId, createdAt, businessName, businessType, offer, extraInfo, qrType, qrValue, script, visualHeadline, asset_audio_url, asset_image_url, asset_qr_url, lead_name, lead_email, lead_phone, status, mp4_url, youtube_video_id, youtube_url, error`
