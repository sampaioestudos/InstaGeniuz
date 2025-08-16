
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';

// IMPORTANT: Set these environment variables in your Vercel project settings
const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    INSTAGRAM_USER_ID,
    INSTAGRAM_ACCESS_TOKEN
} = process.env;

// Configure Cloudinary SDK
if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true
    });
}

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

    const { imageBase64, caption } = req.body;

    if (!imageBase64 || !caption) {
        return res.status(400).json({ error: 'Missing required parameters: imageBase64 and caption.' });
    }

    try {
        const imageUrl = await uploadImageWithWatermark(imageBase64);
        const igPostId = await publishPost(imageUrl, caption);

        return res.status(200).json({ postId: igPostId, optimizedImageUrl: imageUrl });

    } catch (error) {
        console.error("Error in /api/publish:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return res.status(500).json({ error: `Publishing failed: ${errorMessage}` });
    }
}


// REAL FUNCTION: Uploads to Cloudinary with a dynamic watermark
async function uploadImageWithWatermark(imageBase64: string): Promise<string> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error("Server configuration error: Cloudinary environment variables are not properly set.");
    }

    console.log("Uploading to Cloudinary with watermark...");

    try {
        const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${imageBase64}`, {
            folder: "instagenius-ai", // Organize uploads in a specific folder
            transformation: [
                {
                    // Add a dynamic text watermark
                    overlay: {
                        font_family: "Arial",
                        font_size: 40,
                        font_weight: "bold",
                        text: "InstaGenius AI"
                    },
                    color: "#FFFFFF",
                    opacity: 60,
                    gravity: "south_east", // Position at the bottom-right
                    x: 20, // Margin from the edge
                    y: 20
                }
            ]
        });
        
        console.log("Upload successful. URL:", result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        // Throw a more specific error to be caught by the handler
        throw new Error("Failed to upload image to Cloudinary.");
    }
}


// MOCK FUNCTION: Simulates publishing to Instagram
async function publishPost(imageUrl: string, caption: string): Promise<string> {
    if (!INSTAGRAM_USER_ID || !INSTAGRAM_ACCESS_TOKEN) {
        throw new Error("Server configuration error: Instagram environment variables are not set.");
    }
    console.log(`Simulating Instagram post publication for user: ${INSTAGRAM_USER_ID}`);
    
    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const postId = `1234567890_${Date.now()}`;
    console.log("Post published successfully. Post ID:", postId);
    return postId;
}
