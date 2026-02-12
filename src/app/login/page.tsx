"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const isMobile = useMediaQuery("(max-width: 480px)");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Invalid credentials");
            } else {
                router.push("/dashboard/pos");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-secondary)",
                padding: isMobile ? 16 : 20,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 420,
                    animation: "slideIn 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 40 }}>
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 18,
                            background: "linear-gradient(135deg, #0071e3, #5ac8fa)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 28,
                            marginBottom: 16,
                            boxShadow: "0 8px 30px rgba(0, 113, 227, 0.2)",
                        }}
                    >
                        ⚡
                    </div>
                    <h1
                        style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.03em",
                            marginBottom: 6,
                        }}
                    >
                        SwiftPOS
                    </h1>
                    <p style={{ color: "var(--text-tertiary)", fontSize: 15, fontWeight: 400 }}>
                        Sign in to your tech store
                    </p>
                </div>

                {/* Card */}
                <div
                    style={{
                        background: "var(--bg-card)",
                        borderRadius: 20,
                        padding: isMobile ? "24px 20px" : "36px 32px",
                        boxShadow: "var(--shadow-sm)",
                        border: "1px solid var(--border)",
                    }}
                >
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div
                                style={{
                                    padding: "12px 16px",
                                    background: "var(--danger-bg)",
                                    borderRadius: 12,
                                    color: "var(--danger)",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    marginBottom: 20,
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: 20 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    marginBottom: 8,
                                }}
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                                className="input"
                            />
                        </div>

                        <div style={{ marginBottom: 28 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    marginBottom: 8,
                                }}
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "14px",
                                background: loading ? "var(--text-tertiary)" : "var(--accent)",
                                color: "white",
                                border: "none",
                                borderRadius: 14,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: loading ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div style={{ marginTop: 24, textAlign: "center" }}>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                            Don't have an account?{" "}
                            <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>


            </div>
        </div>
    );
}
