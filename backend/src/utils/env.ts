import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  // Gemini
  API_KEY: process.env.API_KEY || '',
  GEMINI_API_KEY: process.env.API_KEY || '',

  // Google Cloud
  GCS_BUCKET: process.env.GCS_BUCKET || '',
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
  GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID || '',

  // Cloud Tasks
  QUEUE_NAME: process.env.QUEUE_NAME || '',
  LOCATION: process.env.LOCATION || '',

  // Backend
  BACKEND_URL: process.env.BACKEND_URL || '',
  INTERNAL_TOKEN: process.env.INTERNAL_TOKEN || '',

  // YouTube
  YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID || '',
  YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET || '',
  YOUTUBE_REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN || '',
};
