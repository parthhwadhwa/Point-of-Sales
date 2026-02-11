"use client";

import { useEffect, useState } from "react";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    barcode: string | null;
    category: { id: string; name: string };
}

interface CartItem extends Product {
    quantity: number;
}

interface Category {
    id: string;
    name: string;
}

const PRODUCT_EMOJIS: Record<string, string> = {
    Smartphones: "📱",
    Laptops: "💻",
    Audio: "🎧",
    Accessories: "🔌",
    Wearables: "⌚",
};

const TAX_RATE = 0.1;

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [discount, setDiscount] = useState(0);
    const [toast, setToast] = useState("");
    const [receipt, setReceipt] = useState<{ orderNumber: string; total: number } | null>(null);
    const [checkingOut, setCheckingOut] = useState(false);

    useEffect(() => {
        fetch("/api/products").then((r) => r.json()).then(setProducts);
        fetch("/api/categories").then((r) => r.json()).then(setCategories);
    }, []);

    const filtered = products.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = selectedCategory === "all" || p.category.id === selectedCategory;
        return matchSearch && matchCat;
    });

    const addToCart = (product: Product) => {
        if (product.stock <= 0) return;
        setCart((prev) => {
            const existing = prev.find((c) => c.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev;
                return prev.map((c) => (c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
                .filter((c) => c.quantity > 0)
        );
    };

    const removeItem = (id: string) => {
        setCart((prev) => prev.filter((c) => c.id !== id));
    };

    const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax - discount;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setCheckingOut(true);
        try {
            const res = await fetch("/api/orders/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart.map((c) => ({
                        productId: c.id,
                        quantity: c.quantity,
                        unitPrice: c.price,
                    })),
                    subtotal,
                    tax,
                    discount,
                    total,
                    paymentMethod: "CASH",
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setReceipt({ orderNumber: data.orderNumber, total: data.total });
                setCart([]);
                setDiscount(0);
                fetch("/api/products").then((r) => r.json()).then(setProducts);
            } else {
                setToast(data.error || "Checkout failed");
                setTimeout(() => setToast(""), 3000);
            }
        } catch {
            setToast("Something went wrong");
            setTimeout(() => setToast(""), 3000);
        } finally {
            setCheckingOut(false);
        }
    };

    return (
        <div style={{ display: "flex", gap: 32, minHeight: "calc(100vh - 64px)" }}>
            {/* Product Area */}
            <div style={{ flex: 1 }}>
                <h1
                    style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.03em",
                        marginBottom: 24,
                    }}
                >
                    Point of Sale
                </h1>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-search"
                    style={{ marginBottom: 16 }}
                />

                {/* Category Pills */}
                <div className="pill-tabs" style={{ marginBottom: 24, display: "inline-flex" }}>
                    <button
                        className={`pill-tab ${selectedCategory === "all" ? "active" : ""}`}
                        onClick={() => setSelectedCategory("all")}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`pill-tab ${selectedCategory === cat.id ? "active" : ""}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: 14,
                    }}
                >
                    {filtered.map((product, i) => {
                        const emoji = PRODUCT_EMOJIS[product.category.name] || "📦";
                        const inCart = cart.find((c) => c.id === product.id);
                        const outOfStock = product.stock <= 0;
                        return (
                            <div
                                key={product.id}
                                onClick={() => !outOfStock && addToCart(product)}
                                className="animate-in"
                                style={{
                                    background: outOfStock ? "var(--bg-tertiary)" : "var(--bg-card)",
                                    border: inCart
                                        ? "2px solid var(--accent)"
                                        : "1px solid var(--border)",
                                    borderRadius: 16,
                                    padding: 18,
                                    cursor: outOfStock ? "not-allowed" : "pointer",
                                    transition: "all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
                                    opacity: outOfStock ? 0.5 : 1,
                                    animationDelay: `${(i % 12) * 30}ms`,
                                    position: "relative",
                                }}
                                onMouseEnter={(e) => {
                                    if (!outOfStock) {
                                        e.currentTarget.style.transform = "translateY(-3px)";
                                        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.08)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                {inCart && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: -6,
                                            right: -6,
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            background: "var(--accent)",
                                            color: "white",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {inCart.quantity}
                                    </div>
                                )}
                                <div style={{ fontSize: 32, marginBottom: 10, lineHeight: 1 }}>{emoji}</div>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                        marginBottom: 4,
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {product.name}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginTop: 8,
                                    }}
                                >
                                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                                        ${product.price.toFixed(2)}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: product.stock < 10 ? "var(--warning)" : "var(--text-tertiary)",
                                        }}
                                    >
                                        {outOfStock ? "Out" : `${product.stock} left`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cart Panel — Floating with Glassmorphism */}
            <div
                style={{
                    width: 360,
                    flexShrink: 0,
                    position: "sticky",
                    top: 32,
                    height: "calc(100vh - 64px)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        background: "var(--bg-overlay)",
                        backdropFilter: "blur(24px) saturate(180%)",
                        WebkitBackdropFilter: "blur(24px) saturate(180%)",
                        borderRadius: 24,
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-lg)",
                        padding: 24,
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        overflow: "hidden",
                    }}
                >
                    <h2
                        style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: 20,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        🛒 Cart
                        {cart.length > 0 && (
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "var(--text-tertiary)",
                                    marginLeft: 8,
                                }}
                            >
                                {cart.reduce((s, c) => s + c.quantity, 0)} items
                            </span>
                        )}
                    </h2>

                    {/* Cart Items */}
                    <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
                        {cart.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "48px 0",
                                    color: "var(--text-tertiary)",
                                }}
                            >
                                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🛒</div>
                                <p style={{ fontSize: 15, fontWeight: 500 }}>Cart is empty</p>
                                <p style={{ fontSize: 13, marginTop: 4 }}>Click products to add them</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {cart.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "12px 14px",
                                            background: "var(--bg-tertiary)",
                                            borderRadius: 14,
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                                                {item.name}
                                            </div>
                                            <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>
                                                ${item.price.toFixed(2)} each
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 8,
                                                    border: "1px solid var(--border-strong)",
                                                    background: "var(--bg-card)",
                                                    cursor: "pointer",
                                                    fontSize: 14,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                −
                                            </button>
                                            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: "center", color: "var(--text-primary)" }}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 8,
                                                    border: "1px solid var(--border-strong)",
                                                    background: "var(--bg-card)",
                                                    cursor: "pointer",
                                                    fontSize: 14,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", minWidth: 60, textAlign: "right" }}>
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "var(--danger)",
                                                cursor: "pointer",
                                                fontSize: 16,
                                                padding: 4,
                                                opacity: 0.7,
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Discount */}
                    {cart.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 6 }}>
                                Discount ($)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={discount || ""}
                                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                                className="input"
                                style={{ padding: "8px 12px", fontSize: 14 }}
                                placeholder="0.00"
                            />
                        </div>
                    )}

                    {/* Totals */}
                    <div
                        style={{
                            borderTop: "1px solid var(--border)",
                            paddingTop: 16,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ color: "var(--text-tertiary)", fontSize: 14 }}>Subtotal</span>
                            <span style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 500 }}>${subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ color: "var(--text-tertiary)", fontSize: 14 }}>Tax (10%)</span>
                            <span style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 500 }}>${tax.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ color: "var(--success)", fontSize: 14 }}>Discount</span>
                                <span style={{ color: "var(--success)", fontSize: 14, fontWeight: 500 }}>−${discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 12,
                                paddingTop: 12,
                                borderTop: "1px solid var(--border)",
                            }}
                        >
                            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Total</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                                ${total.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || checkingOut}
                        style={{
                            width: "100%",
                            marginTop: 20,
                            padding: "16px",
                            background: cart.length === 0 ? "var(--bg-tertiary)" : "var(--success)",
                            color: cart.length === 0 ? "var(--text-tertiary)" : "white",
                            border: "none",
                            borderRadius: 16,
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: cart.length === 0 ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {checkingOut ? "Processing..." : `Checkout — $${total.toFixed(2)}`}
                    </button>
                </div>
            </div>

            {/* Receipt Modal */}
            {receipt && (
                <div className="modal-overlay" onClick={() => setReceipt(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                            Order Complete!
                        </h2>
                        <p style={{ color: "var(--text-tertiary)", fontSize: 14, marginBottom: 4 }}>Order Number</p>
                        <p
                            style={{
                                color: "var(--accent)",
                                fontSize: 16,
                                fontWeight: 700,
                                marginBottom: 16,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {receipt.orderNumber}
                        </p>
                        <p style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginBottom: 24 }}>
                            ${receipt.total.toFixed(2)}
                        </p>
                        <button
                            onClick={() => setReceipt(null)}
                            className="btn btn-primary btn-lg"
                            style={{ width: "100%" }}
                        >
                            New Order
                        </button>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && <div className="toast">⚠️ {toast}</div>}
        </div>
    );
}
