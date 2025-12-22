
import { Buffer } from 'buffer';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { ENV } from '../utils/env.js';

const oauth2Client = new google.auth.OAuth2(
  ENV.YOUTUBE_CLIENT_ID,
  ENV.YOUTUBE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: ENV.YOUTUBE_REFRESH_TOKEN,
});

const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

// Fixed: Explicitly import Buffer to ensure type recognition in Node.js ESM environment
export async function uploadToYoutube(videoBuffer: Buffer, metadata: any) {
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: 'unlisted',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: Readable.from(videoBuffer),
    },
  });

  const videoId = res.data.id;
  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
