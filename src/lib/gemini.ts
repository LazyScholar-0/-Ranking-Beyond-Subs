import { GoogleGenAI, Type } from "@google/genai";

// Ensure we have access to the Gemini API locally via process.env
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface TrueWebScoreModel {
  title: string;
  type: "channel" | "video";
  score: number;
  sentiment: string;
  tags: string[];
  subscriberCount: number;
  isActive?: boolean;
  uploadFrequency?: string;
  contentLength?: string;
}

export const analyzeYouTubeEntity = async (query: string): Promise<TrueWebScoreModel> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Use Pro since we are analyzing sentiment/culture
      contents: `You are an expert pop-culture and internet culture analyst. The user wants to know the true online sentiment for the following YouTube creator, video, or concept: "${query}".
Calculate a "TrueWeb Score" out of 10 based explicitly on their reception online OUTSIDE of YouTube (e.g., Reddit, Twitter, news, forums, external blogs). Ignore inflated YouTube subscriber/like counts. 
Ensure you ONLY analyze individual creators, creator groups, or independent YouTubers. Do not analyze corporate brands, VEVO music labels, or TV networks. Treat highly respected, educational, or universally loved creators (like Veritasium, Kurzgesagt, LEMMiNO) extremely favorably (9.0+).
Also estimate the entity's subscriber count or view count if it's a video (use best approximation in numbers, e.g. 15000000).
Return a JSON object with:
- title: The proper name of the creator or video.
- type: "channel" or "video".
- score: A number out of 10 (1 decimal place).
- sentiment: A 2-3 sentence summary of the general online sentiment outside of YouTube. Why do they get this score?
- tags: 3-4 descriptive tags.
- subscriberCount: The estimated numeric subscriber/view count (do not use strings like 1.5M, use 1500000).
- isActive: Boolean indicating if they are currently actively uploading (true) or on hiatus/retired (false).
- uploadFrequency: A short 1-3 word phrase describing their average upload schedule (e.g., "Weekly", "Daily", "Monthly", "Sporadic").
- contentLength: A short 1-3 word phrase describing their average video length (e.g., "10-15 mins", "1-2 hours", "Under 5 mins").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING },
            score: { type: Type.NUMBER },
            sentiment: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            subscriberCount: { type: Type.NUMBER },
            isActive: { type: Type.BOOLEAN },
            uploadFrequency: { type: Type.STRING },
            contentLength: { type: Type.STRING }
          },
          required: ["title", "type", "score", "sentiment", "tags", "subscriberCount", "isActive", "uploadFrequency", "contentLength"]
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    const data = JSON.parse(jsonStr) as TrueWebScoreModel;
    return data;
  } catch (error) {
    console.error("Error analyzing entity:", error);
    throw new Error("Failed to analyze the YouTube entity. Please try again.");
  }
};
