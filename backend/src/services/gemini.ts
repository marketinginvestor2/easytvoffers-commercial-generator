
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ENV } from "../utils/env.js";

const ai = new GoogleGenAI({ apiKey: ENV.API_KEY });

export async function generateCommercialContent(biz: any) {
  const prompt = `Create a short, punchy TV commercial script (under 15 words) and a visual headline (under 5 words) for a business.
  Business: ${biz.businessName}
  Type: ${biz.businessType}
  Offer: ${biz.offer}
  Context: ${biz.extraInfo}
  Return as JSON with 'script' and 'headline'.`;

  // Use generateContent with string contents and responseSchema configuration
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          script: { type: Type.STRING },
          headline: { type: Type.STRING },
        },
        required: ["script", "headline"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function generateBackgroundImage(headline: string, bizType: string) {
  const prompt = `A cinematic, high-quality, professional background image for a TV commercial for a ${bizType} business. No text in the image. Vibrant and clean. Focus on the concept: ${headline}`;
  
  // Fixed: Use standard Content object with parts for image generation
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });

  for (const part of response.candidates[0].content.parts) {
    // Find the image part in the response
    if (part.inlineData) return part.inlineData.data; // Base64
  }
  throw new Error("No image generated");
}

export async function generateVoiceover(text: string) {
  // Fixed: use recommended TTS model and prompt structure
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data; // Base64 PCM
}

export async function generateYoutubeMetadata(bizName: string, offer: string) {
  const prompt = `Generate a YouTube title, description, and 5 tags for an unlisted commercial.
  Business: ${bizName}
  Offer: ${offer}
  Mentions "YouTube CTV" in description. No Hulu/Roku.
  Return JSON with 'title', 'description', 'tags'.`;

  // Use generateContent with string contents and responseSchema configuration
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "description", "tags"]
      }
    }
  });

  return JSON.parse(response.text);
}
