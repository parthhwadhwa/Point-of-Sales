import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Simple in-memory rate limiting (per server instance)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second (relaxed for testing)

export async function GET(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Basic Rate Limiting
        // Removed for development to prevent issues with React Strict Mode double-invocation
        /*
        const now = Date.now();
        if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment." },
                { status: 429 }
            );
        }
        lastRequestTime = now;
        */

        const apiKey = process.env.GEMINI_API_KEY?.trim();
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        // 1. Fetch Data
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        // Fetch Orders
        const thisWeekOrders = await prisma.order.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            include: { items: { include: { product: true } } },
        });

        const lastWeekOrders = await prisma.order.findMany({
            where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
        });

        const allProducts = await prisma.product.findMany();

        // 2. Summarize Data for AI
        const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const revenueGrowth = lastWeekOrders.length > 0
            ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
            : 100;

        const productSales: Record<string, number> = {};
        const productRevenue: Record<string, number> = {};

        thisWeekOrders.forEach(order => {
            order.items.forEach(item => {
                const pid = item.productId;
                productSales[pid] = (productSales[pid] || 0) + item.quantity;
                productRevenue[pid] = (productRevenue[pid] || 0) + Number(item.total);
            });
        });

        const topProducts = allProducts
            .map(p => ({
                name: p.name,
                sales: productSales[p.id] || 0,
                revenue: productRevenue[p.id] || 0,
                stock: p.stock
            }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 10);

        const lowStockProducts = allProducts
            .filter(p => p.stock < 10)
            .map(p => ({ name: p.name, stock: p.stock }));

        // 3. Construct Prompt
        const genAI = new GoogleGenerativeAI(apiKey);

        // Use gemini-1.5-flash as it is the most stable and cost-effective model for this use case
        const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];
        let model = null;
        let result = null;
        let lastError = null;

        const prompt = `
        Analyze this POS system sales data and provide business insights in STRICT JSON format.
        
        Data Summary:
        - Total Revenue (This Week): ${thisWeekRevenue}
        - Total Revenue (Last Week): ${lastWeekRevenue}
        - Total Orders (This Week): ${thisWeekOrders.length}
        - Top Selling Products: ${JSON.stringify(topProducts)}
        - Low Stock Items: ${JSON.stringify(lowStockProducts)}

        Required JSON Structure:
        {
          "bestSelling": [{ "name": string, "totalSold": number, "revenue": number }],
          "slowMoving": [{ "name": string, "totalSold": number, "stock": number }],
          "restock": [{ "name": string, "stock": number, "avgDailySales": number, "daysUntilOut": number }],
          "summary": "A concise, actionable business summary (max 2 sentences). Mention key trends and urgent actions."
        }

        Rules:
        - "bestSelling": Top 3 performing products.
        - "slowMoving": Identify products with low sales but high stock.
        - "restock": Prioritize low stock items with high sales velocity.
        - Output ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
        `;

        // 4. Call AI with Fallback
        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting to generate insights using model: ${modelName}`);
                model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                break; // If successful, exit loop
            } catch (error) {
                console.warn(`Failed with model ${modelName}:`, error);
                lastError = error;
                // Continue to next model
            }
        }

        if (!result) {
            console.error("All models failed. Last error:", lastError);
            throw lastError || new Error("Failed to generate content with available models");
        }

        const response = await result.response;
        const text = response.text();

        // 5. Parse and Return
        let jsonResponse;
        try {
            // Remove markdown code blocks if present
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            jsonResponse = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse AI response:", text);
            throw new Error("Invalid AI response");
        }

        // Add calculated standard metrics that AI might not calculate perfectly
        return NextResponse.json({
            ...jsonResponse,
            thisWeekRevenue,
            lastWeekRevenue,
            revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        });

    } catch (error) {
        console.error("AI Insights error:", error);
        return NextResponse.json(
            {
                error: "Failed to generate insights.",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
