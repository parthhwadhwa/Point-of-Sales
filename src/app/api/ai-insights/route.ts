import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const dynamic = 'force-dynamic'; // Ensure this route is not statically optimized

export async function GET(req: NextRequest) {
    try {
        // 1. Validate Environment Variables
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set" },
                { status: 500 }
            );
        }

        // 2. Check Cache (Rate Limiting logic)
        // Check if we have an insight generated today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const cachedInsight = await prisma.aIInsight.findFirst({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const { searchParams } = new URL(req.url);
        const forceRefresh = searchParams.get("refresh") === "true";

        if (cachedInsight && !forceRefresh) {
            console.log("Serving cached AI insight");
            return NextResponse.json(cachedInsight.content);
        }

        // 3. Fetch Summarized Data from Database
        const [
            totalRevenueAgg,
            totalOrders,
            products,
            lowStockProducts,
            orderItems
        ] = await Promise.all([
            prisma.order.aggregate({
                _sum: { total: true },
            }),
            prisma.order.count(),
            prisma.product.findMany({
                include: {
                    category: true
                }
            }),
            prisma.product.findMany({
                where: { stock: { lt: 10 } },
                select: { name: true, stock: true },
            }),
            prisma.orderItem.groupBy({
                by: ['productId'],
                _sum: {
                    quantity: true,
                    total: true
                },
                orderBy: {
                    _sum: {
                        quantity: 'desc'
                    }
                }
            })
        ]);

        const totalRevenue = totalRevenueAgg._sum.total || 0;

        // Process best selling and slow moving from orderItems and products
        const productSalesMap = new Map();
        orderItems.forEach(item => {
            productSalesMap.set(item.productId, {
                quantity: item._sum.quantity || 0,
                revenue: item._sum.total || 0
            });
        });

        const productsWithSales = products.map(p => {
            const sales = productSalesMap.get(p.id) || { quantity: 0, revenue: 0 };
            return {
                name: p.name,
                category: p.category.name,
                stock: p.stock,
                salesQuantity: sales.quantity,
                salesRevenue: sales.revenue
            };
        });

        // Sort for Gemini context
        const bestSelling = [...productsWithSales].sort((a, b) => Number(b.salesQuantity) - Number(a.salesQuantity)).slice(0, 5);
        const slowMoving = [...productsWithSales].sort((a, b) => Number(a.salesQuantity) - Number(b.salesQuantity)).slice(0, 5);

        // Prepare Data for Gemini
        const dataForAI = {
            totalRevenue,
            totalOrders,
            lowStock: lowStockProducts,
            bestSellingCandidates: bestSelling,
            slowMovingCandidates: slowMoving
        };

        // 4. Generate AI Insight
        const prompt = `
      Analyze this POS sales data and return business insights.
      Data: ${JSON.stringify(dataForAI, null, 2)}

      IMPORTANT: Format ALL monetary values in Indian Rupee (INR) using the '₹' symbol.

      Return ONLY valid JSON. Do not include markdown, explanation, or text outside JSON.
      Expected format:
      {
        "bestSelling": [{ "name": "Product Name", "insight": "Why it's selling well" }],
        "slowMoving": [{ "name": "Product Name", "insight": "Why it's slow/Action to take" }],
        "restock": [{ "name": "Product Name", "stock": 5, "urgency": "High/Medium" }],
        "summary": "A concise executive summary of business performance today. Use '₹' for all currency values."
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean response (remove markdown code blocks if present)
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Gemini response:", text);
            return NextResponse.json(
                { error: "Failed to parse AI response" },
                { status: 500 }
            );
        }

        // 5. Save to Database
        await prisma.aIInsight.create({
            data: {
                content: jsonResponse,
            },
        });

        return NextResponse.json(jsonResponse);

    } catch (error) {
        console.error("Error generating AI insights:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
