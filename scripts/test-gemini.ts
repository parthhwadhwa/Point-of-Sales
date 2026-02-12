import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file in project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        console.error("❌ No GEMINI_API_KEY found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-2.0-flash";

    try {
        console.log(`\nAttempting to generate content using model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, confirm you are working with a short phrase.");
        const response = await result.response;
        console.log(`✅ Model ${modelName} is working!`);
        console.log("Response:", response.text());
    } catch (error: any) {
        console.error(`❌ Failed to use ${modelName}`);
        console.error("Error details:", error.message);
    }
}

testGemini();
