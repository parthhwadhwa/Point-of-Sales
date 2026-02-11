import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const productSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    price: z.number().positive("Price must be positive"),
    stock: z.number().int().min(0, "Stock cannot be negative"),
    barcode: z.string().optional().nullable(),
    categoryId: z.string().min(1, "Category is required"),
});

export const categorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
});

export const checkoutSchema = z.object({
    items: z.array(
        z.object({
            productId: z.string().min(1),
            quantity: z.number().int().positive(),
            unitPrice: z.number().positive(),
        })
    ).min(1, "Cart cannot be empty"),
    subtotal: z.number().min(0),
    tax: z.number().min(0),
    discount: z.number().min(0),
    total: z.number().positive(),
    paymentMethod: z.string().default("CASH"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
