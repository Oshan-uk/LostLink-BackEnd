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

const delay = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const generateGeminiResponse = async (
  prompt: string,
): Promise<string> => {
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const reply = response.text?.trim();

      if (!reply) {
        throw new Error("Gemini returned an empty response");
      }

      return reply;
    } catch (error) {
      const apiError = error as {
        status?: number;
        message?: string;
      };

      const isTemporaryError =
        apiError.status === 429 ||
        apiError.status === 500 ||
        apiError.status === 503;

      if (!isTemporaryError || attempt === maxRetries) {
        throw error;
      }

      const waitTime = 1000 * Math.pow(2, attempt);

      console.log(
        `Gemini temporarily unavailable. Retrying in ${waitTime / 1000} seconds...`,
      );

      await delay(waitTime);
    }
  }

  throw new Error("Gemini request failed after multiple attempts");
};