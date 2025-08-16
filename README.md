
# InstaGenius AI 🤖✨

InstaGenius AI is a web application designed to automate and streamline your Instagram content creation workflow. By leveraging the power of Google's Gemini AI, it generates complete, ready-to-publish posts—including captions, hashtags, and images—from a single user prompt.

This project is built as a secure, serverless application, optimized for easy deployment on Vercel.

**[Live Demo Link Here]** <!-- Add your Vercel deployment link here -->

![InstaGenius AI Screenshot](https://raw.githubusercontent.com/vercel/next.js/canary/examples/ai-chatbot/public/screenshot.png) <!-- Replace with a real screenshot of your app -->

---

## 🚀 Core Features

-   **AI-Powered Content Generation**: Uses the Google Gemini API to generate engaging captions, relevant hashtags, and stunning images based on your ideas.
-   **Customizable Output**: Tailor the tone (Friendly, Professional, Witty, etc.) and length of your captions to perfectly match your brand voice.
-   **Format-Aware Image Generation**: Automatically generates images with the correct aspect ratio for different Instagram formats (Square, Portrait, Stories/Reels).
-   **Prompt Templates**: Get started quickly with pre-built prompt ideas for various post types.
-   **Post History**: Automatically saves your published posts to your browser for easy reference and reuse.
-   **Instant Preview & Editing**: Review the AI-generated content and make any necessary edits to the caption or hashtags before publishing.
-   **One-Click Publishing**: Uploads the final image to Cloudinary (with a dynamic watermark) and simulates publishing the post to Instagram with a single click.
-   **Secure Serverless Architecture**: All API keys and sensitive logic are handled securely in Vercel Serverless Functions, never exposing them on the client-side.

---

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **Backend**: Vercel Serverless Functions (API Routes) written in TypeScript
-   **Core APIs**:
    -   **Google Gemini API (`gemini-2.5-flash`, `imagen-3.0-generate-002`)**: For generating text and image content.
    -   **Cloudinary API**: For image hosting, optimization, and dynamic watermarking.
    -   **Instagram Graph API (Simulated)**: For content publishing.

---

## ⚙️ How It Works

The application follows a simple yet powerful multi-step workflow:

1.  **User Input**: The user enters a prompt (e.g., "a cozy coffee shop on a rainy day") and selects the desired post type, caption tone, and length.
2.  **Image Generation**: The frontend sends a request to the `/api/generate` serverless function. This backend function securely calls the Google Gemini API (`imagen-3.0-generate-002`) to generate one or more image options based on the prompt.
3.  **Image Selection**: The generated images are displayed to the user, who selects their favorite one.
4.  **Contextual Text Generation**: The frontend sends a new request to the `/api/generate-text` function, including the original prompt and the chosen image. The backend uses the Gemini vision model (`gemini-2.5-flash`) to analyze the image and generate highly relevant, contextual captions and hashtags.
5.  **Review & Publish**: The user can review and edit the generated text. When ready, they click "Publish," which sends the final content to the `/api/publish` serverless function.
6.  **Deployment Flow**: This backend function executes the full publishing flow:
    -   It uploads the image to Cloudinary, applying a dynamic watermark transformation.
    -   It simulates publishing the post to the Instagram Graph API.
    -   It returns a success message and the final Cloudinary URL.

---

## 🚀 Deployment to Vercel

This project is optimized for a seamless deployment on Vercel.

### Step 1: Push to a Git Repository

Push the project code to a GitHub, GitLab, or Bitbucket repository.

### Step 2: Create a Vercel Project

1.  Log in to your [Vercel](https://vercel.com/) account.
2.  Click "Add New..." -> "Project".
3.  Import the Git repository you just created.
4.  Vercel will automatically detect the project settings. No framework preset is needed.

### Step 3: Configure Environment Variables

This is the most important step. The application relies on server-side environment variables to function securely.

In your Vercel project dashboard, go to **Settings -> Environment Variables**. Add the following variables:

| Variable Name              | Service     | Description                                               |
| -------------------------- | ----------- | --------------------------------------------------------- |
| `GEMINI_API_KEY`           | Gemini      | **Required**. For all content and image generation.       |
| `CLOUDINARY_CLOUD_NAME`    | Cloudinary  | **Required**. Your Cloudinary cloud name.                 |
| `CLOUDINARY_API_KEY`       | Cloudinary  | **Required**. Your Cloudinary API key.                    |
| `CLOUDINARY_API_SECRET`    | Cloudinary  | **Required**. Your Cloudinary API secret.                 |
| `INSTAGRAM_USER_ID`        | Instagram   | Required for the simulated publishing flow.               |
| `INSTAGRAM_ACCESS_TOKEN`   | Instagram   | Required for the simulated publishing flow.               |

### Step 4: Deploy

Once the environment variables are set, trigger a deployment from your Vercel project dashboard. Vercel will build the API routes and deploy your site.

---

## 🔒 Privacy Policy

This application is designed with user privacy and security as a top priority.

-   **No User Data Storage**: The application is stateless and does not store any personal information, user prompts, or API keys in any database. All processing is done ephemerally. Generated post history is stored **only in your browser's local storage** and is never sent to a server.
-   **API Key Security**: Your API keys are **never** exposed to the client-side (browser). They are configured as Environment Variables within the Vercel platform and are only accessible by the secure, server-side Serverless Functions.
-   **Third-Party Services**: Your prompts are sent to the Google Gemini API to generate content. Your usage is subject to [Google's Privacy Policy](https://policies.google.com/privacy). No other personal data is shared with third parties.
-   **Local Development**: For local development, API keys are stored in a `.env.local` file, which is explicitly listed in the `.gitignore` file to prevent it from ever being committed to a Git repository.

---

## 🖥️ Local Development

While the app is designed for Vercel, you can run it locally for development using the Vercel CLI.

1.  **Clone the repository:**
    ```bash
    git clone [your-repository-url]
    cd instagenius-ai-vercel
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up local environment variables:**
    -   Create a file named `.env.local` in the root of the project.
    -   Add the required environment variables from the table above to this file:
        ```
        GEMINI_API_KEY="your_gemini_key"
        CLOUDINARY_CLOUD_NAME="your_cloud_name"
        # ... and so on
        ```

4.  **Run the development server:**
    -   Install the Vercel CLI: `npm i -g vercel`
    -   Start the development server:
        ```bash
        vercel dev
        ```
    -   This will start a local server that mimics the Vercel environment, allowing you to test the API routes.

---

## 📂 Project Structure

```
.
├── api/
│   ├── generate.ts      # Serverless function for AI image generation using Imagen 3.
│   ├── generate-text.ts # Serverless function for AI caption/hashtag generation using Gemini.
│   └── publish.ts       # Serverless function for Cloudinary upload and Instagram simulation.
├── components/
│   ├── Header.tsx
│   ├── ImageSelector.tsx
│   ├── Loader.tsx
│   ├── PostForm.tsx
│   ├── PostHistory.tsx  # <-- New: Renders saved posts from localStorage.
│   ├── PreviewCard.tsx
│   ├── PrivacyPolicy.tsx
│   └── SettingsModal.tsx
├── App.tsx              # Main application component and state management.
├── index.html           # Entry point HTML.
├── index.tsx            # React root renderer.
├── package.json         # Project dependencies.
├── README.md            # You are here!
└── tsconfig.json        # TypeScript configuration.
```

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
