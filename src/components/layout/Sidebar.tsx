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

const Sidebar = ({
    user,
    isMobile,
    isMobileOpen,
    setMobileOpen,
    collapsed,
    setCollapsed,
}: SidebarProps) => {
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

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-screen border-r border-border/50 bg-sidebar/80 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                    w-[260px] ${collapsed ? "md:w-[72px]" : "md:w-[260px]"}
                    ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0 md:shadow-none"}
                    flex flex-col overflow-hidden supports-[backdrop-filter]:bg-sidebar/60
                `}
            >
                {/* Logo / Brand */}
                <div
                    className={`flex items-center gap-3 ${collapsed && !isMobile ? "p-6 px-4 justify-center" : "p-6"}`}
                >
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-text-inverse shadow-sm"
                    >
                        <span className="text-lg">⚡</span>
                    </div>
                    {(!collapsed || isMobile) && (
                        <div className="flex flex-col">
                            <span className="text-[15px] font-semibold text-text-primary leading-tight tracking-tight">
                                SwiftPOS
                            </span>
                        </div>
                    )}

                    {/* Mobile Close Button */}
                    {isMobile && (
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-bg-tertiary text-text-secondary hover:bg-bg-hover transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Collapse toggle (Desktop only) */}
                {!isMobile && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="my-3 mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-hover"
                    >
                        {collapsed ? "→" : "←"}
                    </button>
                )}

                {/* Navigation */}
                <nav className={`flex-1 ${collapsed && !isMobile ? "px-2.5" : "px-3"}`}>
                    <div className="flex flex-col gap-0.5">
                        {filteredNav.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-all duration-200 ease-out
                                        ${collapsed && !isMobile ? "justify-center px-2" : "justify-start"}
                                        ${isActive
                                            ? "bg-text-primary/5 text-text-primary font-medium"
                                            : "text-text-secondary hover:bg-text-primary/5 hover:text-text-primary"
                                        }
                                    `}
                                >
                                    <span className="text-lg opacity-80">{item.icon}</span>
                                    {(!collapsed || isMobile) && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Theme Toggle + User Info */}
                <div
                    className={`mt-auto flex flex-col gap-1 ${collapsed && !isMobile ? "p-4 px-2" : "p-4"}`}
                >
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`
                            flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium text-text-secondary transition-all duration-200 hover:bg-text-primary/5 hover:text-text-primary
                            ${collapsed && !isMobile ? "justify-center" : "justify-start"}
                        `}
                    >
                        <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
                        {(!collapsed || isMobile) && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`
                            flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium text-text-secondary transition-all duration-200 hover:bg-text-primary/5 hover:text-text-primary
                            ${collapsed && !isMobile ? "justify-center" : "justify-start"}
                        `}
                    >
                        <span className="text-lg">↪</span>
                        {(!collapsed || isMobile) && <span>Sign Out</span>}
                    </button>

                    {user && !collapsed && !isMobile && (
                        <div className="mt-4 flex items-center gap-3 px-2 pt-4 border-t border-border/50">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#5ac8fa] text-xs font-bold text-white shadow-sm">
                                {user.name.charAt(0)}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="truncate text-xs font-semibold text-text-primary">
                                    {user.name}
                                </span>
                                <span className="truncate text-[10px] uppercase font-medium text-text-tertiary">
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    )}

                    {user && collapsed && !isMobile && (
                        <div className="mt-2 flex justify-center pt-2 border-t border-border/50">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#5ac8fa] text-xs font-bold text-white shadow-sm">
                                {user.name.charAt(0)}
                            </div>
                        </div>
                    )}
                </div>
            </aside >
        </>
    );
}

export default Sidebar;
