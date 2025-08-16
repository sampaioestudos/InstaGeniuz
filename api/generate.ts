
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import type { PostTypeId, ApiKeys } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    try {
        const { prompt, postType, aspectRatio, apiKeys } = req.body as { prompt: string; postType: PostTypeId; aspectRatio: string; apiKeys: ApiKeys };
        
        const GEMINI_API_KEY = apiKeys?.gemini || process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            throw new Error("Server configuration error: GEMINI_API_KEY is not set in the request or environment variables.");
        }

        if (!prompt || !postType || !aspectRatio) {
            return res.status(400).json({ error: 'Missing required parameters in request body.' });
        }
        
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        const fullPrompt = `Instagram post photo. Photorealistic, modern aesthetic, visually stunning, high quality. Subject: ${prompt}.`;
        const numberOfImages = postType === 'carousel' ? 5 : 1;

        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: fullPrompt,
            config: {
                numberOfImages,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio as "1:1" | "4:3" | "3:4" | "16:9" | "9:16",
            },
        });

        if (!response.generatedImages?.length) {
            throw new Error("The AI model did not generate any images. This could be due to a restrictive prompt. Please try rephrasing your prompt.");
        }

        const imageBases64 = response.generatedImages
            .map(img => img.image?.imageBytes)
            .filter((bytes): bytes is string => !!bytes);
        
        if (imageBases64.length === 0) {
            throw new Error("The AI model returned image data that could not be processed.");
        }

        return res.status(200).json({ imageBases64 });

    } catch (error) {
        console.error("Error in /api/generate:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during image generation.";
        return res.status(500).json({ error: errorMessage });
    }
}
