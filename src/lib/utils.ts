export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

export function generateOrderNumber(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
}

export function calculateTax(subtotal: number, taxRate: number = 0.1): number {
    return Math.round(subtotal * taxRate * 100) / 100;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(" ");
}
