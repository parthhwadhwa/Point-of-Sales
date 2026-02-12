"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ name: string; role: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-secondary)" }}>
            <Sidebar user={user} />
            <main
                style={{
                    flex: 1,
                    marginLeft: 260,
                    padding: "32px 40px",
                    maxWidth: "100%",
                    transition: "margin-left 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
                }}
            >
                {children}
            </main>
        </div>
    );
}
