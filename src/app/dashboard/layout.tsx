"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ name: string; role: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const isMobile = useMediaQuery("(max-width: 768px)");
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetch("/api/auth/me", { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => {
                if (data.user) {
                    setUser(data.user);
                } else {
                    router.push("/login");
                }
            })
            .catch(() => router.push("/login"))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-secondary)",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            background: "linear-gradient(135deg, #0071e3, #5ac8fa)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                            margin: "0 auto 16px",
                            animation: "shimmer 1s ease-in-out infinite alternate",
                        }}
                    >
                        ⚡
                    </div>
                    <p style={{ color: "var(--text-tertiary)", fontSize: 15, fontWeight: 500 }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-secondary)", flexDirection: isMobile ? "column" : "row" }}>
            <Sidebar
                user={user}
                isMobile={isMobile}
                isMobileOpen={isMobileMenuOpen}
                setMobileOpen={setMobileMenuOpen}
                collapsed={isSidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
            />

            {/* Mobile Header */}
            {isMobile && (
                <div style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "var(--bg-card)",
                    borderBottom: "1px solid var(--border)",
                    position: "sticky",
                    top: 0,
                    zIndex: 40,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: "linear-gradient(135deg, #0071e3, #5ac8fa)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 16,
                                color: "white",
                            }}
                        >
                            ⚡
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>SwiftPOS</span>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        style={{
                            background: "var(--bg-tertiary)",
                            border: "none",
                            borderRadius: 8,
                            width: 36,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                            color: "var(--text-primary)",
                            cursor: "pointer",
                        }}
                    >
                        ☰
                    </button>
                </div>
            )}

            <main
                style={{
                    flex: 1,
                    marginLeft: isMobile ? 0 : (isSidebarCollapsed ? 72 : 260),
                    padding: isMobile ? "20px 16px" : "32px 40px",
                    maxWidth: "100%",
                    transition: "margin-left 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    width: isMobile ? "100%" : "auto",
                }}
            >
                {children}
            </main>
        </div>
    );
}
