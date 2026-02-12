"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

interface SidebarProps {
    user: { name: string; role: string } | null;
    isMobile: boolean;
    isMobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

const navItems = [
    { href: "/dashboard/pos", label: "Point of Sale", icon: "💳", roles: ["ADMIN", "CASHIER"] },
    { href: "/dashboard/inventory", label: "Inventory", icon: "📦", roles: ["ADMIN"] },
    { href: "/dashboard/reports", label: "Reports", icon: "📊", roles: ["ADMIN", "CASHIER"] },
    { href: "/dashboard/insights", label: "AI Insights", icon: "✨", roles: ["ADMIN"] },
];

export default function Sidebar({
    user,
    isMobile,
    isMobileOpen,
    setMobileOpen,
    collapsed,
    setCollapsed,
}: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    // Close mobile sidebar on navigation
    useEffect(() => {
        if (isMobile) {
            setMobileOpen(false);
        }
    }, [pathname, isMobile, setMobileOpen]);

    const filteredNav = navItems.filter((item) =>
        user ? item.roles.includes(user.role) : false
    );

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    // Mobile Overlay
    if (isMobile && !isMobileOpen) return null;

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobile && isMobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(4px)",
                        zIndex: 49,
                        animation: "fadeIn 0.2s ease-out",
                    }}
                />
            )}

            <aside
                style={{
                    width: collapsed && !isMobile ? 72 : 260,
                    minHeight: "100vh",
                    background: "var(--bg-sidebar)",
                    borderRight: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    position: "fixed",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 50,
                    overflow: "hidden",
                    // Mobile specific styles
                    transform: isMobile && !isMobileOpen ? "translateX(-100%)" : "translateX(0)",
                    boxShadow: isMobile && isMobileOpen ? "0 0 40px rgba(0,0,0,0.2)" : "none",
                }}
            >
                {/* Logo / Brand */}
                <div
                    style={{
                        padding: collapsed && !isMobile ? "24px 16px" : "24px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        borderBottom: "1px solid var(--border)",
                    }}
                >
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: "linear-gradient(135deg, #0071e3, #5ac8fa)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            flexShrink: 0,
                        }}
                    >
                        ⚡
                    </div>
                    {(!collapsed || isMobile) && (
                        <div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                                SwiftPOS
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 500 }}>
                                Tech Store
                            </div>
                        </div>
                    )}

                    {/* Mobile Close Button */}
                    {isMobile && (
                        <button
                            onClick={() => setMobileOpen(false)}
                            style={{
                                marginLeft: "auto",
                                background: "transparent",
                                border: "none",
                                fontSize: 24,
                                color: "var(--text-tertiary)",
                                cursor: "pointer",
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Collapse toggle (Desktop only) */}
                {!isMobile && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            margin: "12px auto",
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-tertiary)",
                            fontSize: 16,
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                        {collapsed ? "→" : "←"}
                    </button>
                )}

                {/* Navigation */}
                <nav style={{ flex: 1, padding: collapsed && !isMobile ? "0 10px" : "0 12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {filteredNav.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: collapsed && !isMobile ? "12px 14px" : "10px 16px",
                                        borderRadius: 12,
                                        textDecoration: "none",
                                        fontSize: 15,
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? "var(--accent)" : "var(--text-secondary)",
                                        background: isActive ? "var(--accent-light)" : "transparent",
                                        transition: "all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)",
                                        justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = "var(--bg-hover)";
                                            e.currentTarget.style.color = "var(--text-primary)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = "transparent";
                                            e.currentTarget.style.color = "var(--text-secondary)";
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
                                    {(!collapsed || isMobile) && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Theme Toggle + User Info */}
                <div
                    style={{
                        padding: collapsed && !isMobile ? "16px 10px" : "16px 16px",
                        borderTop: "1px solid var(--border)",
                    }}
                >
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        style={{
                            width: "100%",
                            padding: "10px 16px",
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            color: "var(--text-secondary)",
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            marginBottom: 12,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-hover)";
                            e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--bg-tertiary)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                    >
                        {(collapsed && !isMobile) ? (theme === "dark" ? "☀️" : "🌙") : (theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode")}
                    </button>

                    {user && (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 12,
                            justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                        }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #0071e3, #5ac8fa)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                }}
                            >
                                {user.name.charAt(0)}
                            </div>
                            {(!collapsed || isMobile) && (
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                                        {user.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: "var(--accent)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {user.role}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        style={{
                            width: "100%",
                            padding: "10px 16px",
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            color: "var(--text-secondary)",
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-hover)";
                            e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                    >
                        {(collapsed && !isMobile) ? "↪" : "Sign Out"}
                    </button>
                </div>
            </aside>
        </>
    );
}
