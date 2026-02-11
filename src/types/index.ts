export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    stock: number;
}

export interface ProductWithCategory {
    id: string;
    name: string;
    price: number;
    stock: number;
    barcode: string | null;
    categoryId: string;
    category: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface OrderWithItems {
    id: string;
    orderNumber: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    cashierId: string;
    cashier: {
        name: string;
    };
    items: {
        id: string;
        quantity: number;
        unitPrice: number;
        total: number;
        product: {
            name: string;
        };
    }[];
    createdAt: string;
}

export interface AiInsights {
    bestSelling: { name: string; totalSold: number; revenue: number }[];
    slowMoving: { name: string; totalSold: number; stock: number }[];
    restock: { name: string; stock: number; avgDailySales: number; daysUntilOut: number }[];
    summary: string;
}

export interface ReportData {
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    salesByHour: { hour: string; revenue: number; orders: number }[];
    recentOrders: OrderWithItems[];
}
