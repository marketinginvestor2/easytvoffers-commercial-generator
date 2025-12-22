
import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  API_KEY: process.env.API_KEY || '', // Gemini API
  GCS_BUCKET: process.env.GCS_BUCKET || '',
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
  GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID || '',
  QUEUE_NAME: process.env.QUEUE_NAME || 'commercial-render-queue',
  LOCATION: process.env.LOCATION || 'us-central1',
  BACKEND_URL: process.env.BACKEND_URL || '', // URL for internal callbacks
  INTERNAL_TOKEN: process.env.INTERNAL_TOKEN || 'change-me-123',
  YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID || '',
  YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET || '',
  YOUTUBE_REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN || '',
};

const required = ['API_KEY', 'GCS_BUCKET', 'GOOGLE_SHEET_ID', 'YOUTUBE_REFRESH_TOKEN'];
for (const key of required) {
  if (!ENV[key as keyof typeof ENV]) {
    console.warn(`Missing required environment variable: ${key}`);
  }
}
