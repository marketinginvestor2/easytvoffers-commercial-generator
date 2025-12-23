import { GoogleGenAI } from "@google/genai";
import { ENV } from "../utils/env.js";

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") throw new Error(`Missing required env var: ${name}`);
  return value;
}

const apiKey = requireEnv("GEMINI_API_KEY", ENV.GEMINI_API_KEY);
const ai = new GoogleGenAI({ apiKey });

export async function generateCommercialContent(input: {
  businessName: string;
  businessType: string;
  offer: string;
  extraInfo?: string;
}) {
  const model = "gemini-2.0-flash";

  const prompt = `
Create a short local business TV commercial script and a bold visual headline.

Business Name: ${input.businessName}
Business Type: ${input.businessType}
Offer: ${input.offer}
Extra Info: ${input.extraInfo ?? ""}

Return JSON ONLY with:
{
  "headline": "...",
  "script": "..."
}
  `.trim();

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text =
    response?.candidates?.[0]?.content?.parts?.[0]?.text ??
    // Some SDK builds also expose response.text
    (response as any)?.text ??
    "";

  if (!text) throw new Error("Gemini returned an empty response");

  const cleaned = String(text).replace(/```json|```/g, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // fallback if Gemini didn't return JSON
    parsed = { headline: input.businessName, script: cleaned };
  }

  return {
    headline: String(parsed?.headline ?? input.businessName),
    script: String(parsed?.script ?? cleaned),
  };
}

// Keep these compiling even if you haven’t wired the full pipeline yet.
// Return base64 strings if/when implemented; for now return empty strings.
export async function generateBackgroundImage(_headline: string, _businessType: string) {
  return "";
}

export async function generateVoiceover(_script: string) {
  return "";
}

export async function generateYoutubeMetadata(businessName: string, offer: string) {
  const title = `${businessName} — ${offer}`.slice(0, 95);
  const description = `Preview commercial for ${businessName}. Offer: ${offer}`;
  return { title, description };
}
