import { Buffer } from 'buffer';
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

import {
  generateCommercialContent,
  generateBackgroundImage,
  generateVoiceover,
  generateYoutubeMetadata,
} from './services/gemini.js';

// ✅ FIX: was './storage.js' — correct path is services/storage
import { uploadBuffer } from './services/storage.js';

import { appendRow, updateRowByPreviewId } from './services/sheets.js';
import { enqueueRender } from './services/queue.js';
import { renderCommercial } from './services/render.js';
import { uploadToYoutube } from './services/youtube.js';
import { ENV } from './utils/env.js';

const router = Router();

/**
 * Creates preview assets (script, bg, voice, qr) + logs to Google Sheet
 */
router.post('/generatePreview', async (req, res) => {
  try {
    const { businessName, businessType, offer, extraInfo, qrType, qrValue } = req.body;

    const previewId = uuidv4();

    // 1) Generate Content with AI
    const content = await generateCommercialContent({
      businessName,
      businessType,
      offer,
      extraInfo,
    });

    const bgBase64 = await generateBackgroundImage(content.headline, businessType);
    const voiceBase64 = await generateVoiceover(content.script);

    // 2) Generate QR
    const qrBuffer = await QRCode.toBuffer(String(qrValue || ''));

    // 3) Upload to GCS
    const bgUrl = await uploadBuffer(
      `previews/${previewId}/bg.png`,
      Buffer.from(bgBase64 || '', 'base64'),
      'image/png'
    );

    const qrUrl = await uploadBuffer(
      `previews/${previewId}/qr.png`,
      qrBuffer,
      'image/png'
    );

    const voiceUrl = await uploadBuffer(
      `previews/${previewId}/voice.pcm`,
      Buffer.from(voiceBase64 || '', 'base64'),
      'application/octet-stream'
    );

    // 4) Log to Sheets
    const row = [
      previewId,
      new Date().toISOString(),
      businessName,
      businessType,
      offer,
      extraInfo,
      qrType,
      qrValue,
      content.script,
      content.headline,
      voiceUrl,
      bgUrl,
      qrUrl,
      '', '', '', 'PREVIEWED', '', '', '', ''
    ];

    await appendRow(row);

    res.json({
      previewId,
      script: content.script,
      visualHeadline: content.headline,
      audioUrl: voiceUrl,
      imageUrl: bgUrl,
      qrUrl: qrUrl,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

/**
 * Captures lead details + triggers render queue
 */
router.post('/requestFile', async (req, res) => {
  try {
    const { previewId, leadName, leadEmail, leadPhone } = req.body;

    await updateRowByPreviewId(previewId, {
      lead_name: leadName,
      lead_email: leadEmail,
      lead_phone: leadPhone,
      status: 'LEAD_CAPTURED',
    });

    await enqueueRender(previewId);

    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

/**
 * Internal endpoint called by queue/worker to render MP4 + upload to YouTube
 * Protected by INTERNAL_TOKEN
 */
router.post('/internal/renderAndUpload', async (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== ENV.INTERNAL_TOKEN) return res.status(403).send('Forbidden');

  const { previewId } = req.body;

  try {
    // 1) Get Row Data
    const resSheets = await (req as any).app.locals.sheets.spreadsheets.values.get({
      spreadsheetId: ENV.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:U',
    });

    const rows: any[] = resSheets?.data?.values || [];
    if (!rows.length) throw new Error('Sheet is empty or unreadable');

    const headers = rows[0];
    const row = rows.find((r: any) => r?.[0] === previewId);
    if (!row) throw new Error(`PreviewId not found in sheet: ${previewId}`);

    const bizName = row[headers.indexOf('businessName')] || '';
    const offer = row[headers.indexOf('offer')] || '';
    const headline = row[headers.indexOf('visualHeadline')] || '';

    // 2) Render MP4
    const videoBuffer = await renderCommercial(previewId, headline, bizName);

    const mp4Url = await uploadBuffer(
      `renders/${previewId}/commercial.mp4`,
      videoBuffer,
      'video/mp4'
    );

    // 3) YouTube Meta & Upload
    const ytMeta = await generateYoutubeMetadata(String(bizName), String(offer));
    const ytResult = await uploadToYoutube(videoBuffer, ytMeta);

    // 4) Final Update
    await updateRowByPreviewId(previewId, {
      status: 'UPLOADED',
      mp4_url: mp4Url,
      youtube_video_id: ytResult.videoId,
      youtube_url: ytResult.url,
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Render error:', err);
    await updateRowByPreviewId(previewId, {
      status: 'ERROR',
      error: err?.message || 'Unknown error',
    });
    res.status(500).send(err?.message || 'Unknown error');
  }
});

export default router;
