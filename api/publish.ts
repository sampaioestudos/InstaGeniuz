
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';

const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    INSTAGRAM_USER_ID,
    INSTAGRAM_ACCESS_TOKEN
} = process.env;

// This function now just checks for keys, the main handler will configure
const configureCloudinary = () => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error("Server configuration error: One or more Cloudinary environment variables are not set.");
    }
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true
    });
};

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
        // Centralized check for all environment variables
        if (!INSTAGRAM_USER_ID || !INSTAGRAM_ACCESS_TOKEN) {
            throw new Error("Server configuration error: Instagram environment variables are not set.");
        }
        
        // Configure Cloudinary inside the handler to catch config errors
        configureCloudinary();

        const { imageBase64, caption } = req.body;
        if (!imageBase64 || !caption) {
            return res.status(400).json({ error: 'Missing required parameters: imageBase64 and caption.' });
        }

        const imageUrl = await uploadImageWithWatermark(imageBase64);
        const igPostId = await publishPost(imageUrl, caption);

        return res.status(200).json({ postId: igPostId, optimizedImageUrl: imageUrl });

    } catch (error) {
        console.error("Error in /api/publish:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during publishing.";
        return res.status(500).json({ error: errorMessage });
    }
}

async function uploadImageWithWatermark(imageBase64: string): Promise<string> {
    console.log("Uploading to Cloudinary with watermark...");
    try {
        const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${imageBase64}`, {
            folder: "instagenius-ai",
            transformation: [
                {
                    overlay: {
                        font_family: "Arial",
                        font_size: 40,
                        font_weight: "bold",
                        text: "InstaGenius AI"
                    },
                    color: "#FFFFFF",
                    opacity: 60,
                    gravity: "south_east",
                    x: 20,
                    y: 20
                }
            ]
        });
        console.log("Upload successful. URL:", result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw new Error("Failed to upload image to Cloudinary.");
    }
}

async function publishPost(imageUrl: string, caption: string): Promise<string> {
    console.log(`Simulating Instagram post publication for user: ${INSTAGRAM_USER_ID}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const postId = `1234567890_${Date.now()}`;
    console.log("Post published successfully. Post ID:", postId);
    return postId;
}
