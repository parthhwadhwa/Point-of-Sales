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
        <div className="flex min-h-screen bg-secondary flex-col md:flex-row">
            <Sidebar
                user={user}
                isMobile={isMobile}
                isMobileOpen={isMobileMenuOpen}
                setMobileOpen={setMobileMenuOpen}
                collapsed={isSidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
            />

            {/* Mobile Header */}
            <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-xl px-5 py-4 md:hidden">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0071e3] to-[#5ac8fa] text-base text-white">
                        ⚡
                    </div>
                    <span className="text-lg font-bold text-text-primary">SwiftPOS</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-none bg-tertiary text-xl text-text-primary cursor-pointer"
                >
                    ☰
                </button>
            </div>

            <main
                className={`flex-1 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] w-full p-5 md:p-10 ${isSidebarCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"}`}
            >
                {children}
            </main>
        </div>
    );
}
