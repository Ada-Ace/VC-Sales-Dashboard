import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function listModels() {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No VITE_GEMINI_API_KEY found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // There isn't a direct listModels in the simple SDK, but we can try to hit the endpoint
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
