import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
            include: { _count: { select: { products: true } } },
        });

        return NextResponse.json(categories);
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
        const parsed = categorySchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const category = await prisma.category.create({ data: parsed.data });
        return NextResponse.json(category, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }
}
