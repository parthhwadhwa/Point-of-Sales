import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { productSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const categoryId = searchParams.get("categoryId") || "";

        const where: Record<string, unknown> = {};
        if (search) {
            where.name = { contains: search, mode: "insensitive" as const };
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }

        const products = await prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: { name: "asc" },
        });

        const safeProducts = products.map((p) => ({
            ...p,
            price: Number(p.price),
        }));

        return NextResponse.json(safeProducts);
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = productSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const product = await prisma.product.create({
            data: parsed.data,
            include: { category: true },
        });

        return NextResponse.json(product, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
