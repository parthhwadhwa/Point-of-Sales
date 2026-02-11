import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            include: {
                items: { include: { product: true } },
                cashier: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json(orders);
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
