"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    barcode: string | null;
    categoryId: string;
    category: { id: string; name: string };
}

interface Category {
    id: string;
    name: string;
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [toast, setToast] = useState("");

    // Form state
    const [formName, setFormName] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [formStock, setFormStock] = useState("");
    const [formBarcode, setFormBarcode] = useState("");
    const [formCategory, setFormCategory] = useState("");

    const loadData = () => {
        fetch("/api/products").then((r) => r.json()).then(setProducts);
        fetch("/api/categories").then((r) => r.json()).then(setCategories);
    };

    useEffect(() => { loadData(); }, []);

    const filtered = products.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === "all" || p.category.id === filterCategory;
        return matchSearch && matchCat;
    });

    const lowStockCount = products.filter((p) => p.stock < 10).length;

    const openAddModal = () => {
        setEditProduct(null);
        setFormName("");
        setFormPrice("");
        setFormStock("");
        setFormBarcode("");
        setFormCategory(categories[0]?.id || "");
        setShowModal(true);
    };

    const openEditModal = (p: Product) => {
        setEditProduct(p);
        setFormName(p.name);
        setFormPrice(p.price.toString());
        setFormStock(p.stock.toString());
        setFormBarcode(p.barcode || "");
        setFormCategory(p.categoryId);
        setShowModal(true);
    };

    const handleSave = async () => {
        const body = {
            name: formName,
            price: parseFloat(formPrice),
            stock: parseInt(formStock),
            barcode: formBarcode || null,
            categoryId: formCategory,
        };

        const res = editProduct
            ? await fetch(`/api/products/${editProduct.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            : await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

        if (res.ok) {
            setShowModal(false);
            loadData();
            showToast(editProduct ? "Product updated" : "Product added");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
            loadData();
            showToast("Product deleted");
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                        Inventory
                    </h1>
                    <p style={{ color: "var(--text-tertiary)", fontSize: 14, marginTop: 4 }}>
                        {products.length} products
                        {lowStockCount > 0 && (
                            <span style={{ color: "var(--warning)", marginLeft: 12, fontWeight: 600 }}>
                                ⚠ {lowStockCount} low stock
                            </span>
                        )}
                    </p>
                </div>
                <button onClick={openAddModal} className="btn btn-primary">
                    + Add Product
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-search"
                    style={{ maxWidth: 400 }}
                />
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="input"
                    style={{ width: 200 }}
                >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Barcode</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => (
                            <tr key={p.id}>
                                <td style={{ fontWeight: 600 }}>{p.name}</td>
                                <td>
                                    <span className="badge badge-blue">{p.category.name}</span>
                                </td>
                                <td style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                                <td>
                                    {p.stock < 10 ? (
                                        <span className="badge badge-orange">Low: {p.stock}</span>
                                    ) : (
                                        <span className="badge badge-green">{p.stock}</span>
                                    )}
                                </td>
                                <td style={{ color: "var(--text-tertiary)", fontSize: 13, fontFamily: "monospace" }}>
                                    {p.barcode || "—"}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                        <button
                                            onClick={() => openEditModal(p)}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="btn btn-danger btn-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
                            {editProduct ? "Edit Product" : "Add Product"}
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                                    Name
                                </label>
                                <input className="input" value={formName} onChange={(e) => setFormName(e.target.value)} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                                        Price
                                    </label>
                                    <input className="input" type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                                        Stock
                                    </label>
                                    <input className="input" type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                                    Barcode
                                </label>
                                <input className="input" value={formBarcode} onChange={(e) => setFormBarcode(e.target.value)} placeholder="Optional" />
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                                    Category
                                </label>
                                <select className="input" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="btn btn-primary">
                                {editProduct ? "Save Changes" : "Add Product"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast">✓ {toast}</div>}
        </div>
    );
}
