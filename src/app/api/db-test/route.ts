import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Test raw connection
        const result = await prisma.$queryRaw<
            { version: string }[]
        >`SELECT version()`;

        // Get table counts
        const [userCount, productCount, categoryCount, orderCount] =
            await Promise.all([
                prisma.user.count(),
                prisma.product.count(),
                prisma.category.count(),
                prisma.order.count(),
            ]);

        return NextResponse.json({
            status: "connected",
            database: "PostgreSQL",
            version: result[0]?.version ?? "unknown",
            counts: {
                users: userCount,
                products: productCount,
                categories: categoryCount,
                orders: orderCount,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Database connection test failed:", error);
        return NextResponse.json(
            {
                status: "disconnected",
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown database error",
            },
            { status: 500 }
        );
    }
}
