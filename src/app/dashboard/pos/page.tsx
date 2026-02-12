"use client";

import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatCurrency } from "@/lib/utils";

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

    // Mobile State
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [isCartOpen, setCartOpen] = useState(false);

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
        setToast(`Added ${product.name}`);
        setTimeout(() => setToast(""), 1500);
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
                setCartOpen(false); // Close mobile cart
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

    const CartContent = () => (
        <div
            style={{
                background: "var(--bg-overlay)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                borderRadius: isMobile ? "24px 24px 0 0" : 24,
                border: isMobile ? "none" : "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2
                    style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.02em",
                        margin: 0,
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
                {isMobile && (
                    <button
                        onClick={() => setCartOpen(false)}
                        style={{ border: "none", background: "none", fontSize: 24, color: "var(--text-tertiary)" }}
                    >
                        ✕
                    </button>
                )}
            </div>

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
                                        {formatCurrency(item.price)} each
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
                                    {formatCurrency(item.price * item.quantity)}
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
                        Discount ({formatCurrency(0).charAt(0)})
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
                    <span style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "var(--text-tertiary)", fontSize: 14 }}>Tax (10%)</span>
                    <span style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 500 }}>{formatCurrency(tax)}</span>
                </div>
                {discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ color: "var(--success)", fontSize: 14 }}>Discount</span>
                        <span style={{ color: "var(--success)", fontSize: 14, fontWeight: 500 }}>−{formatCurrency(discount)}</span>
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
                        {formatCurrency(total)}
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
                {checkingOut ? "Processing..." : `Checkout — ${formatCurrency(total)}`}
            </button>
        </div>
    );

    return (
        <div style={{ display: "flex", gap: 32, minHeight: "calc(100vh - 64px)", flexDirection: isMobile ? "column" : "row", paddingBottom: isMobile ? 80 : 0 }}>
            {/* Product Area */}
            <div style={{ flex: 1 }}>
                <h1
                    style={{
                        fontSize: isMobile ? 24 : 28,
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
                <div className="pill-tabs" style={{ marginBottom: 24, display: "flex", overflowX: "auto", paddingBottom: 8, gap: 8 }}>
                    <button
                        className={`pill-tab ${selectedCategory === "all" ? "active" : ""}`}
                        onClick={() => setSelectedCategory("all")}
                        style={{ whiteSpace: "nowrap" }}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`pill-tab ${selectedCategory === cat.id ? "active" : ""}`}
                            onClick={() => setSelectedCategory(cat.id)}
                            style={{ whiteSpace: "nowrap" }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
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
                                    padding: 16,
                                    cursor: outOfStock ? "not-allowed" : "pointer",
                                    transition: "all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
                                    opacity: outOfStock ? 0.5 : 1,
                                    animationDelay: `${(i % 12) * 30}ms`,
                                    position: "relative",
                                }}
                                onMouseEnter={(e) => {
                                    if (!outOfStock && !isMobile) {
                                        e.currentTarget.style.transform = "translateY(-3px)";
                                        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.08)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isMobile) {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }
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
                                        {formatCurrency(product.price)}
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

            {/* Cart Panel — Sticky on Desktop, Drawer on Mobile */}
            {isMobile ? (
                <>
                    {/* Floating Bottom Bar (if cart has items or specifically if we want to show it always) */}
                    {cart.length > 0 && (
                        <div style={{
                            position: "fixed",
                            bottom: 20,
                            left: 20,
                            right: 20,
                            background: "var(--bg-card)",
                            borderRadius: 16,
                            padding: 16,
                            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            border: "1px solid var(--border)",
                            zIndex: 45,
                        }}>
                            <div>
                                <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>Total</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{formatCurrency(total)}</div>
                            </div>
                            <button
                                onClick={() => setCartOpen(true)}
                                style={{
                                    background: "var(--accent)",
                                    color: "white",
                                    border: "none",
                                    padding: "10px 20px",
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    fontSize: 15,
                                }}
                            >
                                View Cart ({cart.reduce((s, c) => s + c.quantity, 0)})
                            </button>
                        </div>
                    )}

                    {/* Mobile Cart Drawer/Modal */}
                    {isCartOpen && (
                        <div style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 50,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                        }}>
                            <div
                                onClick={() => setCartOpen(false)}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "rgba(0,0,0,0.5)",
                                    backdropFilter: "blur(4px)"
                                }}
                            />
                            <div style={{
                                position: "relative",
                                maxHeight: "85vh",
                                background: "var(--bg-card)",
                                borderRadius: "24px 24px 0 0",
                                display: "flex",
                                flexDirection: "column",
                                animation: "slideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
                                overflow: "hidden"
                            }}>
                                <CartContent />
                            </div>
                        </div>
                    )}
                </>
            ) : (
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
                    <CartContent />
                </div>
            )}

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
                            {formatCurrency(receipt.total)}
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
