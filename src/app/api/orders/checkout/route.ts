import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = checkoutSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const { items, subtotal, tax, discount, total, paymentMethod } = parsed.data;

        // Validate stock availability
        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            });
            if (!product) {
                return NextResponse.json(
                    { error: `Product not found: ${item.productId}` },
                    { status: 404 }
                );
            }
            if (product.stock < item.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
                    { status: 400 }
                );
            }
        }

        // Use Prisma transaction for atomic checkout
        const order = await prisma.$transaction(async (tx) => {
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    subtotal,
                    tax,
                    discount,
                    total,
                    paymentMethod,
                    cashierId: user.id,
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            total: item.quantity * item.unitPrice,
                        })),
                    },
                },
                include: {
                    items: { include: { product: true } },
                    cashier: { select: { name: true } },
                },
            });

            // Decrement stock for each item
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            return newOrder;
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}
