import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import textToSpeech from '@google-cloud/text-to-speech';
import { uploadBuffer } from './utils/storage.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * Clients
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const ttsClient = new textToSpeech.TextToSpeechClient();

/**
 * POST /generate-preview
 * Generates script + voice MP3
 */
router.post('/generate-preview', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const previewId = uuidv4();

    /**
     * 1) Generate script with Gemini
     */
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const geminiResult = await model.generateContent(prompt);
    const scriptText =
      geminiResult.response.text()?.trim() || '';

    if (!scriptText) {
      throw new Error('Gemini returned empty script');
    }

    /**
     * 2) Convert script → MP3 (NOT PCM)
     */
    const [ttsResponse] = await ttsClient.synthesizeSpeech({
      input: { text: scriptText },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Standard-C'
      },
      audioConfig: {
        audioEncoding: 'MP3'
      }
    });

    if (!ttsResponse.audioContent) {
      throw new Error('TTS returned no audio');
    }

    /**
     * 3) Upload MP3 to Cloud Storage
     */
    const voiceUrl = await uploadBuffer(
      `previews/${previewId}/voice.mp3`,
      Buffer.from(ttsResponse.audioContent as Uint8Array),
      'audio/mpeg'
    );

    /**
     * 4) Respond
     */
    res.json({
      previewId,
      script: scriptText,
      audioUrl: voiceUrl
    });

  } catch (err: any) {
    console.error('generate-preview error:', err);
    res.status(500).json({
      error: 'Failed to generate preview',
      details: err.message
    });
  }
});

export default router;
