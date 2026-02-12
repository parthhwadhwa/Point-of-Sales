import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations";
import { generateOrderNumber } from "@/lib/utils";
import { Prisma, PaymentMethod } from "@prisma/client";

export const dynamic = "force-dynamic";

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

        // Use Prisma interactive transaction with Serializable isolation
        // This ensures stock checks + decrements are atomic  — no race conditions
        const order = await prisma.$transaction(
            async (tx) => {
                // Validate stock availability INSIDE the transaction
                for (const item of items) {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                    });

                    if (!product) {
                        throw new Error(`Product not found: ${item.productId}`);
                    }

                    if (product.stock < item.quantity) {
                        throw new Error(
                            `Insufficient stock for ${product.name}. Available: ${product.stock}`
                        );
                    }
                }

                // Create the order with order items
                const newOrder = await tx.order.create({
                    data: {
                        orderNumber: generateOrderNumber(),
                        subtotal,
                        tax,
                        discount,
                        total,
                        paymentMethod: paymentMethod as PaymentMethod,
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

                // Decrement stock atomically for each item
                for (const item of items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } },
                    });
                }

                return newOrder;
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                timeout: 10000, // 10 seconds max
            }
        );

        const safeOrder = {
            ...order,
            total: Number(order.total),
            subtotal: Number(order.subtotal),
            tax: Number(order.tax),
            discount: Number(order.discount),
            items: order.items.map((item) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
            })),
        };

        return NextResponse.json(safeOrder, { status: 201 });
    } catch (error) {
        console.error("Checkout error:", error);

        // Return user-friendly error for validation failures inside the transaction
        if (error instanceof Error) {
            const isValidationError =
                error.message.includes("Insufficient stock") ||
                error.message.includes("Product not found");

            if (isValidationError) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            { error: "Checkout failed. Please try again." },
            { status: 500 }
        );
    }
}
