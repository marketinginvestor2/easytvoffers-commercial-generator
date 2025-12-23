import { Buffer } from 'buffer';
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

import {
  generateCommercialContent,
  generateBackgroundImage,
  generateVoiceover,
  generateYoutubeMetadata
} from './services/gemini';

import { uploadBuffer } from './services/storage';
import { appendRow, updateRowByPreviewId } from './services/sheets';
import { enqueueRender } from './services/queue';
import { renderCommercial } from './services/render';
import { uploadToYoutube } from './services/youtube';
import { ENV } from './utils/env';

const router = Router();

/**
 * Generate preview commercial (AI)
 */
router.post('/generatePreview', async (req, res) => {
  try {
    const { businessName, businessType, offer, extraInfo, qrType, qrValue } = req.body;
    const previewId = uuidv4();

    // 1. Generate AI content
    const content = await generateCommercialContent({
      businessName,
      businessType,
      offer,
      extraInfo
    });

    const bgBase64 = await generateBackgroundImage(content.headline, businessType);
    const voiceBase64 = await generateVoiceover(content.script);

    // 2. Generate QR
    const qrBuffer = await QRCode.toBuffer(qrValue || ENV.DEFAULT_QR_URL);

    // 3. Upload assets
    const bgUrl = await uploadBuffer(
      `previews/${previewId}/bg.png`,
      Buffer.from(bgBase64, 'base64'),
      'image/png'
    );

    const qrUrl = await uploadBuffer(
      `previews/${previewId}/qr.png`,
      qrBuffer,
      'image/png'
    );

    const voiceUrl = await uploadBuffer(
      `previews/${previewId}/voice.pcm`,
      Buffer.from(voiceBase64, 'base64'),
      'application/octet-stream'
    );

    // 4. Log to Sheets
    await appendRow([
      previewId,
      new Date().toISOString(),
      businessName,
      businessType,
      offer,
      extraInfo || '',
      qrType || '',
      qrValue || '',
      content.script,
      content.headline,
      voiceUrl,
      bgUrl,
      qrUrl,
      '',
      '',
      '',
      'PREVIEWED',
      '',
      '',
      '',
      ''
    ]);

    res.json({
      previewId,
      script: content.script,
      visualHeadline: content.headline,
      audioUrl: voiceUrl,
      imageUrl: bgUrl,
      qrUrl
    });
  } catch (err: any) {
    console.error('generatePreview error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Capture lead + request final file
 */
router.post('/requestFile', async (req, res) => {
  try {
    const { previewId, leadName, leadEmail, leadPhone } = req.body;

    await updateRowByPreviewId(previewId, {
      lead_name: leadName,
      lead_email: leadEmail,
      lead_phone: leadPhone,
      status: 'LEAD_CAPTURED'
    });

    await enqueueRender(previewId);

    res.json({ ok: true });
  } catch (err: any) {
    console.error('requestFile error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Internal render + YouTube upload
 */
router.post('/internal/renderAndUpload', async (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== ENV.INTERNAL_TOKEN) {
    return res.status(403).send('Forbidden');
  }

  try {
    const { previewId } = req.body;

    const sheets = (req as any).app.locals.sheets;
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId: ENV.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:U'
    });

    const rows = sheetRes.data.values || [];
    const headers = rows[0];
    const row = rows.find((r: any) => r[0] === previewId);

    if (!row) throw new Error('Preview not found');

    const bizName = row[headers.indexOf('businessName')];
    const offer = row[headers.indexOf('offer')];
    const headline = row[headers.indexOf('visualHeadline')];

    // Render MP4
    const videoBuffer = await renderCommercial(previewId, headline, bizName);
    const mp4Url = await uploadBuffer(
      `renders/${previewId}/commercial.mp4`,
      videoBuffer,
      'video/mp4'
    );

    // Upload to YouTube
    const ytMeta = await generateYoutubeMetadata(bizName, offer);
    const ytResult = await uploadToYoutube(videoBuffer, ytMeta);

    await updateRowByPreviewId(previewId, {
      status: 'UPLOADED',
      mp4_url: mp4Url,
      youtube_video_id: ytResult.videoId,
      youtube_url: ytResult.url
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error('renderAndUpload error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
