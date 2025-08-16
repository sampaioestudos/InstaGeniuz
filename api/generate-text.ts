
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server configuration error: GEMINI_API_KEY is not set." });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const { prompt, tone, length, imageBase64 } = req.body;

    if (!prompt || !tone || !length || !imageBase64) {
        return res.status(400).json({ error: 'Missing required parameters in request body.' });
    }
    
    try {
        const systemInstruction = `You are an expert Instagram content creator. Analyze the image and prompt to generate engaging content.
- Your response MUST be a valid JSON object.
- The root object must have two keys: "captionVariations" (an array of 2-3 caption objects) and "hashtags" (a single string).
- Each caption object must have two string keys: "caption" and "cta".
- "hashtags" should be a string of 10-20 relevant, space-separated hashtags (e.g., "#coffee #morningvibe #booklover").
- The generated text must be contextual to the image provided.
- Tone: ${tone}.
- Length: ${length}.`;
        
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
            },
        };

        const textPart = {
            text: `Generate content for this prompt: "${prompt}"`,
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        captionVariations: {
                            type: Type.ARRAY,
                            description: "An array of caption variations.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    caption: { type: Type.STRING, description: "The main caption text." },
                                    cta: { type: Type.STRING, description: "A call-to-action, e.g., 'Click the link in bio!'." }
                                },
                                required: ['caption', 'cta']
                            }
                        },
                        hashtags: {
                            type: Type.STRING,
                            description: "A single string of space-separated hashtags."
                        }
                    },
                    required: ['captionVariations', 'hashtags']
                }
            },
        });
        
        let parsedResponse;
        try {
            const responseText = response.text;
            if (!responseText || responseText.trim() === '') {
                throw new Error("The AI returned an empty response. Please try again.");
            }
            parsedResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse JSON response from Gemini:", response.text, parseError);
            throw new Error("The AI returned a response in an unexpected format. Please try rephrasing your prompt or try again.");
        }
        
        return res.status(200).json(parsedResponse);

    } catch (error) {
        console.error("Error in /api/generate-text:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return res.status(500).json({ error: `Text generation failed: ${errorMessage}` });
    }
}
