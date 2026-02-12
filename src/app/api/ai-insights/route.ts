import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date(now);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        // --- Best Selling Products (last 30 days) ---
        const orderItems = await prisma.orderItem.findMany({
            where: { order: { createdAt: { gte: thirtyDaysAgo } } },
            include: { product: true },
        });

        const productSales: Record<string, { name: string; totalSold: number; revenue: number }> = {};
        for (const item of orderItems) {
            const pid = item.productId;
            if (!productSales[pid]) {
                productSales[pid] = { name: item.product.name, totalSold: 0, revenue: 0 };
            }
            productSales[pid].totalSold += item.quantity;
            productSales[pid].revenue += Number(item.total);
        }

        const bestSelling = Object.values(productSales)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 5)
            .map((p) => ({
                name: p.name,
                totalSold: p.totalSold,
                revenue: Math.round(p.revenue * 100) / 100,
            }));

        // --- Slow Moving Products ---
        const allProducts = await prisma.product.findMany();
        const soldProductIds = new Set(Object.keys(productSales));

        const slowMoving = allProducts
            .filter((p) => {
                const sales = productSales[p.id];
                return !sales || sales.totalSold <= 2;
            })
            .slice(0, 5)
            .map((p) => ({
                name: p.name,
                totalSold: productSales[p.id]?.totalSold || 0,
                stock: p.stock,
            }));

        // --- Revenue Trends ---
        const thisWeekOrders = await prisma.order.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
        });
        const lastWeekOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
            },
        });

        const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + Number(o.total), 0);

        const revenueGrowth =
            lastWeekRevenue > 0
                ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 * 100) / 100
                : thisWeekRevenue > 0
                    ? 100
                    : 0;

        // --- Restock Suggestions ---
        const LOW_STOCK_THRESHOLD = 10;
        const daysInPeriod = 30;

        const restock = allProducts
            .filter((p) => {
                const sales = productSales[p.id];
                const avgDailySales = sales ? sales.totalSold / daysInPeriod : 0;
                const daysUntilOut = avgDailySales > 0 ? p.stock / avgDailySales : 999;
                return p.stock < LOW_STOCK_THRESHOLD || daysUntilOut < 7;
            })
            .map((p) => {
                const sales = productSales[p.id];
                const avgDailySales = sales ? Math.round((sales.totalSold / daysInPeriod) * 100) / 100 : 0;
                const daysUntilOut = avgDailySales > 0 ? Math.round(p.stock / avgDailySales) : 999;
                return {
                    name: p.name,
                    stock: p.stock,
                    avgDailySales,
                    daysUntilOut,
                };
            })
            .sort((a, b) => a.daysUntilOut - b.daysUntilOut)
            .slice(0, 5);

        // --- Generate Summary ---
        const totalProducts = allProducts.length;
        const totalOrdersThisWeek = thisWeekOrders.length;
        const lowStockCount = allProducts.filter((p) => p.stock < LOW_STOCK_THRESHOLD).length;

        let trendText = "";
        if (revenueGrowth > 0) {
            trendText = `Revenue is up ${revenueGrowth}% compared to last week.`;
        } else if (revenueGrowth < 0) {
            trendText = `Revenue is down ${Math.abs(revenueGrowth)}% compared to last week.`;
        } else {
            trendText = "Revenue is stable compared to last week.";
        }

        const summary = `Your store has ${totalProducts} products with ${totalOrdersThisWeek} orders this week generating $${Math.round(thisWeekRevenue * 100) / 100} in revenue. ${trendText} ${lowStockCount} product(s) need restocking soon.${bestSelling.length > 0
            ? ` Top seller: ${bestSelling[0].name} with ${bestSelling[0].totalSold} units sold.`
            : ""
            }`;

        return NextResponse.json({
            bestSelling,
            slowMoving,
            restock,
            revenueGrowth,
            thisWeekRevenue: Math.round(thisWeekRevenue * 100) / 100,
            lastWeekRevenue: Math.round(lastWeekRevenue * 100) / 100,
            summary,
        });
    } catch (error) {
        console.error("AI Insights error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
