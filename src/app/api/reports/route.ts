import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "today";

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case "week":
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case "month":
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            default: // today
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
        }

        const orders = await prisma.order.findMany({
            where: { createdAt: { gte: startDate } },
            include: {
                items: { include: { product: true } },
                cashier: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
        const orderCount = orders.length;
        const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

        // Sales by hour
        const salesByHour: Record<string, { revenue: number; orders: number }> = {};
        for (let h = 0; h < 24; h++) {
            const hourLabel = `${h.toString().padStart(2, "0")}:00`;
            salesByHour[hourLabel] = { revenue: 0, orders: 0 };
        }
        for (const order of orders) {
            const hour = new Date(order.createdAt).getHours();
            const hourLabel = `${hour.toString().padStart(2, "0")}:00`;
            salesByHour[hourLabel].revenue += Number(order.total);
            salesByHour[hourLabel].orders += 1;
        }

        const salesByHourArray = Object.entries(salesByHour).map(([hour, data]) => ({
            hour,
            revenue: Math.round(data.revenue * 100) / 100,
            orders: data.orders,
        }));

        // Recent orders (last 10)
        const recentOrders = orders.slice(0, 10).map((order) => ({
            ...order,
            total: Number(order.total),
            items: order.items.map((item) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
            })),
        }));

        return NextResponse.json({
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            orderCount,
            avgOrderValue: Math.round(avgOrderValue * 100) / 100,
            salesByHour: salesByHourArray,
            recentOrders,
        });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
