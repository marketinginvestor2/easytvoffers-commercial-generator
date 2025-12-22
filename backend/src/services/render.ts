
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getBuffer } from './storage.js';

const execAsync = promisify(exec);

export async function renderCommercial(previewId: string, headline: string, bizName: string) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'render-'));
  
  const audioPath = path.join(tmpDir, 'audio.pcm');
  const imagePath = path.join(tmpDir, 'bg.png');
  const qrPath = path.join(tmpDir, 'qr.png');
  const outputPath = path.join(tmpDir, 'final.mp4');

  // Download assets from GCS to local temp
  const audioBuf = await getBuffer(`previews/${previewId}/voice.pcm`);
  const imageBuf = await getBuffer(`previews/${previewId}/bg.png`);
  const qrBuf = await getBuffer(`previews/${previewId}/qr.png`);

  fs.writeFileSync(audioPath, audioBuf);
  fs.writeFileSync(imagePath, imageBuf);
  fs.writeFileSync(qrPath, qrBuf);

  // FFmpeg command:
  // 1. Convert PCM to valid audio
  // 2. Overlay Headline & Biz Name
  // 3. Overlay QR code
  // 4. Pad 5 seconds
  const cmd = `ffmpeg -f s16le -ar 24000 -ac 1 -i ${audioPath} -loop 1 -i ${imagePath} -i ${qrPath} \
    -filter_complex "[1:v]scale=1920:1080[bg]; \
    [2:v]scale=250:250[qr]; \
    [bg][qr]overlay=W-300:50[v1]; \
    [v1]drawtext=text='${headline.toUpperCase()}':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=h-200:shadowcolor=black:shadowx=2:shadowy=2[v2]; \
    [v2]drawtext=text='${bizName}':fontcolor=yellow:fontsize=40:x=(w-text_w)/2:y=h-100:shadowcolor=black:shadowx=2:shadowy=2" \
    -c:v libx264 -t 15 -pix_fmt yuv420p -shortest ${outputPath}`;

  await execAsync(cmd);
  
  const finalVideo = fs.readFileSync(outputPath);
  
  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
  
  return finalVideo;
}
