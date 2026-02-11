"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ReportData {
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    salesByHour: { hour: string; revenue: number; orders: number }[];
    recentOrders: {
        id: string;
        orderNumber: string;
        total: number;
        items: { quantity: number; product: { name: string } }[];
        cashier: { name: string };
        createdAt: string;
    }[];
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [period, setPeriod] = useState("today");

    useEffect(() => {
        fetch(`/api/reports?period=${period}`)
            .then((r) => r.json())
            .then(setData);
    }, [period]);

    if (!data) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
                <p style={{ color: "var(--text-tertiary)", fontSize: 15 }}>Loading reports...</p>
            </div>
        );
    }

    const statCards = [
        { label: "Total Revenue", value: `$${data.totalRevenue.toFixed(2)}`, icon: "💰" },
        { label: "Total Orders", value: data.orderCount.toString(), icon: "📋" },
        { label: "Avg. Order Value", value: `$${data.avgOrderValue.toFixed(2)}`, icon: "📈" },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                    Reports
                </h1>
                <div className="pill-tabs">
                    {["today", "week", "month"].map((p) => (
                        <button
                            key={p}
                            className={`pill-tab ${period === p ? "active" : ""}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                {statCards.map((card, i) => (
                    <div key={card.label} className="stat-card animate-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="stat-label">
                            <span style={{ marginRight: 6 }}>{card.icon}</span>
                            {card.label}
                        </div>
                        <div className="stat-value">{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>
                        Revenue by Hour
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={data.salesByHour}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                                dataKey="hour"
                                fontSize={12}
                                tick={{ fill: "var(--text-tertiary)" }}
                                axisLine={{ stroke: "var(--border)" }}
                            />
                            <YAxis
                                fontSize={12}
                                tick={{ fill: "var(--text-tertiary)" }}
                                axisLine={{ stroke: "var(--border)" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 12,
                                    boxShadow: "var(--shadow-md)",
                                    fontSize: 13,
                                    color: "var(--text-primary)",
                                }}
                            />
                            <Bar dataKey="revenue" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>
                        Orders by Hour
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={data.salesByHour}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                                dataKey="hour"
                                fontSize={12}
                                tick={{ fill: "var(--text-tertiary)" }}
                                axisLine={{ stroke: "var(--border)" }}
                            />
                            <YAxis
                                fontSize={12}
                                tick={{ fill: "var(--text-tertiary)" }}
                                axisLine={{ stroke: "var(--border)" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 12,
                                    boxShadow: "var(--shadow-md)",
                                    fontSize: 13,
                                    color: "var(--text-primary)",
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="orders"
                                stroke="var(--success)"
                                strokeWidth={2.5}
                                dot={{ fill: "var(--success)", r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="table-container">
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>Recent Orders</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Cashier</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.recentOrders.map((order) => (
                            <tr key={order.id}>
                                <td>
                                    <span style={{ fontWeight: 600, color: "var(--accent)", fontSize: 13, fontFamily: "monospace" }}>
                                        {order.orderNumber}
                                    </span>
                                </td>
                                <td style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 300 }}>
                                    {order.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                                </td>
                                <td style={{ fontWeight: 700 }}>${order.total.toFixed(2)}</td>
                                <td style={{ color: "var(--text-secondary)" }}>{order.cashier.name}</td>
                                <td style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </td>
                            </tr>
                        ))}
                        {data.recentOrders.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}>
                                    No orders yet for this period
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
