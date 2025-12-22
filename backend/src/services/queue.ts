
import { Buffer } from 'buffer';
import { CloudTasksClient } from '@google-cloud/tasks';
import { ENV } from '../utils/env.js';

const client = new CloudTasksClient();

export async function enqueueRender(previewId: string) {
  const parent = client.queuePath(ENV.GOOGLE_PROJECT_ID, ENV.LOCATION, ENV.QUEUE_NAME);
  
  const url = `${ENV.BACKEND_URL}/internal/renderAndUpload`;
  const payload = JSON.stringify({ previewId });

  const task = {
    httpRequest: {
      httpMethod: 'POST' as const,
      url,
      // Fixed: Explicitly import Buffer to ensure global availability in Node.js ESM environment
      body: Buffer.from(payload).toString('base64'),
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': ENV.INTERNAL_TOKEN,
      },
    },
  };

  await client.createTask({ parent, task });
}
