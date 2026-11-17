import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

if (!model) {
  throw new Error("GEMINI_MODEL is not configured");
}

const ai = new GoogleGenAI({ apiKey });

export const generateGeminiResponse = async (
  prompt: string,
): Promise<string> => {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  const reply = response.text?.trim();

  if (!reply) {
    throw new Error("Gemini returned an empty response");
  }

  return reply;
};