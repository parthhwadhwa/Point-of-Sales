import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updatePrices() {
    console.log("🔄 Updating product prices to INR...");

    const updates = [
        // Smartphones
        { barcode: "8800000001", price: 119900 }, // iPhone 16 Pro
        { barcode: "8800000002", price: 79900 },  // iPhone 16
        { barcode: "8800000003", price: 74999 },  // Samsung Galaxy S25
        { barcode: "8800000004", price: 109999 }, // Google Pixel 9 Pro
        // Laptops
        { barcode: "8800000005", price: 114900 }, // MacBook Air M3
        { barcode: "8800000006", price: 169900 }, // MacBook Pro 14" M3
        { barcode: "8800000007", price: 145000 }, // Dell XPS 15
        { barcode: "8800000008", price: 135000 }, // ThinkPad X1 Carbon
        // Audio
        { barcode: "8800000009", price: 24900 },  // AirPods Pro 2
        { barcode: "8800000010", price: 59900 },  // AirPods Max
        { barcode: "8800000011", price: 26900 },  // Sony WH-1000XM5
        { barcode: "8800000012", price: 9999 },   // JBL Flip 6 Speaker
        // Accessories
        { barcode: "8800000013", price: 4500 },   // USB-C Hub 7-in-1
        { barcode: "8800000014", price: 3500 },   // MagSafe Charger
        { barcode: "8800000015", price: 1600 },   // USB-C Cable 2m
        { barcode: "8800000016", price: 4900 },   // Leather Phone Case
        // Wearables
        { barcode: "8800000017", price: 89900 },  // Apple Watch Ultra 2
        { barcode: "8800000018", price: 27900 },  // Apple Watch SE
        { barcode: "8800000019", price: 28900 },  // Samsung Galaxy Watch 6
        { barcode: "8800000020", price: 12500 },  // Fitbit Charge 6
    ];

    for (const update of updates) {
        try {
            await prisma.product.update({
                where: { barcode: update.barcode },
                data: { price: update.price },
            });
            console.log(`✅ Updated ${update.barcode} to ₹${update.price}`);
        } catch (error) {
            console.error(`❌ Failed to update ${update.barcode}:`, error);
        }
    }

    console.log("\n🎉 Price update complete!");
}

updatePrices()
    .catch((e) => {
        console.error("Error updating prices:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
