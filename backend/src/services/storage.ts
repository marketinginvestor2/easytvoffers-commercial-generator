
import { Buffer } from 'buffer';
import { Storage } from '@google-cloud/storage';
import { ENV } from '../utils/env.js';

const storage = new Storage();
const bucket = storage.bucket(ENV.GCS_BUCKET);

// Fixed: Explicitly import Buffer to ensure type recognition in Node.js ESM environment
export async function uploadBuffer(path: string, buffer: Buffer, mimeType: string) {
  const file = bucket.file(path);
  await file.save(buffer, {
    metadata: { contentType: mimeType },
  });
  // Make public for preview purposes (or use Signed URLs)
  await file.makePublic();
  return `https://storage.googleapis.com/${ENV.GCS_BUCKET}/${path}`;
}

// Fixed: Explicitly import Buffer to ensure type recognition in Node.js ESM environment
export async function getBuffer(path: string): Promise<Buffer> {
  const [buffer] = await bucket.file(path).download();
  return buffer;
}
