import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { productSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const parsed = productSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const product = await prisma.product.update({
            where: { id },
            data: parsed.data,
            include: { category: true },
        });

        return NextResponse.json(product);
    } catch {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        await prisma.product.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
}
