"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface AiInsights {
    bestSelling: { name: string; totalSold: number; revenue: number }[];
    slowMoving: { name: string; totalSold: number; stock: number }[];
    restock: { name: string; stock: number; avgDailySales: number; daysUntilOut: number }[];
    revenueGrowth: number;
    thisWeekRevenue: number;
    lastWeekRevenue: number;
    summary: string;
}

export default function InsightsPage() {
    const [data, setData] = useState<AiInsights | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/ai-insights")
            .then((r) => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 12, animation: "shimmer 1s ease-in-out infinite alternate" }}>✨</div>
                    <p style={{ color: "var(--text-tertiary)", fontSize: 15, fontWeight: 500 }}>Analyzing data...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const growthColor = data.revenueGrowth > 0 ? "var(--success)" : data.revenueGrowth < 0 ? "var(--danger)" : "var(--text-tertiary)";
    const growthPrefix = data.revenueGrowth > 0 ? "+" : "";

    return (
        <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
                AI Insights
            </h1>
            <p style={{ color: "var(--text-tertiary)", fontSize: 14, marginBottom: 28 }}>
                Powered by custom analytics engine — no paid APIs
            </p>

            {/* Summary Card */}
            <div
                className="card animate-in"
                style={{
                    padding: 28,
                    marginBottom: 24,
                    background: "linear-gradient(135deg, var(--accent-light), var(--info-bg))",
                    borderColor: "var(--accent-soft)",
                }}
            >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ fontSize: 28, lineHeight: 1 }}>💡</div>
                    <div>
                        <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                            Business Summary
                        </h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>
                            {data.summary}
                        </p>
                    </div>
                </div>
            </div>

            {/* Revenue Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <div className="stat-card animate-in" style={{ animationDelay: "50ms" }}>
                    <div className="stat-label">📊 This Week</div>
                    <div className="stat-value">{formatCurrency(data.thisWeekRevenue)}</div>
                </div>
                <div className="stat-card animate-in" style={{ animationDelay: "100ms" }}>
                    <div className="stat-label">📅 Last Week</div>
                    <div className="stat-value">{formatCurrency(data.lastWeekRevenue)}</div>
                </div>
                <div className="stat-card animate-in" style={{ animationDelay: "150ms" }}>
                    <div className="stat-label">📈 Growth</div>
                    <div className="stat-value" style={{ color: growthColor }}>
                        {growthPrefix}{data.revenueGrowth}%
                    </div>
                </div>
            </div>

            {/* Best Selling & Slow Moving */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                {/* Best Selling */}
                <div className="card animate-in" style={{ padding: 24, animationDelay: "200ms" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>
                        🏆 Best Selling
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {data.bestSelling.map((p, i) => (
                            <div
                                key={p.name}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    padding: "12px 16px",
                                    background: "var(--bg-tertiary)",
                                    borderRadius: 14,
                                }}
                            >
                                <div
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 10,
                                        background: i === 0 ? "var(--accent)" : i === 1 ? "var(--info)" : "var(--bg-active)",
                                        color: i < 2 ? "white" : "var(--text-secondary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                    }}
                                >
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1 }}>
                                        {p.totalSold} units sold
                                    </div>
                                </div>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                                    {formatCurrency(p.revenue)}
                                </span>
                            </div>
                        ))}
                        {data.bestSelling.length === 0 && (
                            <p style={{ color: "var(--text-tertiary)", textAlign: "center", padding: 20 }}>No sales data yet</p>
                        )}
                    </div>
                </div>

                {/* Slow Moving */}
                <div className="card animate-in" style={{ padding: 24, animationDelay: "250ms" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>
                        🐌 Slow Moving
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {data.slowMoving.map((p) => (
                            <div
                                key={p.name}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "12px 16px",
                                    background: "var(--bg-tertiary)",
                                    borderRadius: 14,
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1 }}>
                                        {p.totalSold} sold · {p.stock} in stock
                                    </div>
                                </div>
                                <span className="badge badge-orange">Slow</span>
                            </div>
                        ))}
                        {data.slowMoving.length === 0 && (
                            <p style={{ color: "var(--text-tertiary)", textAlign: "center", padding: 20 }}>All products are selling well</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Restock Suggestions */}
            {data.restock.length > 0 && (
                <div className="card animate-in" style={{ padding: 24, animationDelay: "300ms" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>
                        🔄 Restock Suggestions
                    </h3>
                    <div className="table-container" style={{ boxShadow: "none", border: "none" }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Current Stock</th>
                                    <th>Avg. Daily Sales</th>
                                    <th>Days Until Out</th>
                                    <th>Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.restock.map((item) => (
                                    <tr key={item.name}>
                                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                                        <td>
                                            <span className={`badge ${item.stock < 5 ? "badge-red" : "badge-orange"}`}>
                                                {item.stock}
                                            </span>
                                        </td>
                                        <td>{item.avgDailySales}</td>
                                        <td style={{ fontWeight: 600, color: item.daysUntilOut < 7 ? "var(--danger)" : "var(--text-secondary)" }}>
                                            {item.daysUntilOut === 999 ? "∞" : `${item.daysUntilOut} days`}
                                        </td>
                                        <td>
                                            <span className={`badge ${item.daysUntilOut < 3 ? "badge-red" : item.daysUntilOut < 7 ? "badge-orange" : "badge-gray"}`}>
                                                {item.daysUntilOut < 3 ? "Critical" : item.daysUntilOut < 7 ? "Soon" : "Monitor"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
