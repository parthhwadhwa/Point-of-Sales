import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...\n");

    // ─── Users ───────────────────────────────────────────
    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.upsert({
        where: { email: "admin@pos.com" },
        update: {},
        create: {
            email: "admin@pos.com",
            password: adminPassword,
            name: "Admin User",
            role: Role.ADMIN,
        },
    });

    const cashierPassword = await bcrypt.hash("cashier123", 12);
    const cashier = await prisma.user.upsert({
        where: { email: "cashier@pos.com" },
        update: {},
        create: {
            email: "cashier@pos.com",
            password: cashierPassword,
            name: "Jane Cashier",
            role: Role.CASHIER,
        },
    });

    // ─── Categories ──────────────────────────────────────
    const categories = await Promise.all([
        prisma.category.upsert({ where: { name: "Smartphones" }, update: {}, create: { name: "Smartphones" } }),
        prisma.category.upsert({ where: { name: "Laptops" }, update: {}, create: { name: "Laptops" } }),
        prisma.category.upsert({ where: { name: "Audio" }, update: {}, create: { name: "Audio" } }),
        prisma.category.upsert({ where: { name: "Accessories" }, update: {}, create: { name: "Accessories" } }),
        prisma.category.upsert({ where: { name: "Wearables" }, update: {}, create: { name: "Wearables" } }),
    ]);

    const [smartphones, laptops, audio, accessories, wearables] = categories;

    // ─── Products ────────────────────────────────────────
    const products = [
        // Smartphones
        { name: "iPhone 16 Pro", price: 119900, stock: 25, barcode: "8800000001", categoryId: smartphones.id },
        { name: "iPhone 16", price: 79900, stock: 40, barcode: "8800000002", categoryId: smartphones.id },
        { name: "Samsung Galaxy S25", price: 74999, stock: 30, barcode: "8800000003", categoryId: smartphones.id },
        { name: "Google Pixel 9 Pro", price: 109999, stock: 20, barcode: "8800000004", categoryId: smartphones.id },
        // Laptops
        { name: "MacBook Air M3", price: 114900, stock: 15, barcode: "8800000005", categoryId: laptops.id },
        { name: 'MacBook Pro 14" M3', price: 169900, stock: 10, barcode: "8800000006", categoryId: laptops.id },
        { name: "Dell XPS 15", price: 145000, stock: 12, barcode: "8800000007", categoryId: laptops.id },
        { name: "ThinkPad X1 Carbon", price: 135000, stock: 8, barcode: "8800000008", categoryId: laptops.id },
        // Audio
        { name: "AirPods Pro 2", price: 24900, stock: 80, barcode: "8800000009", categoryId: audio.id },
        { name: "AirPods Max", price: 59900, stock: 15, barcode: "8800000010", categoryId: audio.id },
        { name: "Sony WH-1000XM5", price: 26900, stock: 25, barcode: "8800000011", categoryId: audio.id },
        { name: "JBL Flip 6 Speaker", price: 9999, stock: 35, barcode: "8800000012", categoryId: audio.id },
        // Accessories
        { name: "USB-C Hub 7-in-1", price: 4500, stock: 100, barcode: "8800000013", categoryId: accessories.id },
        { name: "MagSafe Charger", price: 3500, stock: 60, barcode: "8800000014", categoryId: accessories.id },
        { name: "USB-C Cable 2m", price: 1600, stock: 200, barcode: "8800000015", categoryId: accessories.id },
        { name: "Leather Phone Case", price: 4900, stock: 5, barcode: "8800000016", categoryId: accessories.id },
        // Wearables
        { name: "Apple Watch Ultra 2", price: 89900, stock: 12, barcode: "8800000017", categoryId: wearables.id },
        { name: "Apple Watch SE", price: 27900, stock: 30, barcode: "8800000018", categoryId: wearables.id },
        { name: "Samsung Galaxy Watch 6", price: 28900, stock: 3, barcode: "8800000019", categoryId: wearables.id },
        { name: "Fitbit Charge 6", price: 12500, stock: 45, barcode: "8800000020", categoryId: wearables.id },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { barcode: product.barcode },
            update: {},
            create: product,
        });
    }

    console.log("✅ Seed data created successfully!");
    console.log(`   Admin:    ${admin.email} / admin123`);
    console.log(`   Cashier:  ${cashier.email} / cashier123`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Products: ${products.length}`);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
