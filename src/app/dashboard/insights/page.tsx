"use client";

import { useState, useEffect } from "react";

interface InsightData {
    bestSelling: { name: string; insight: string }[];
    slowMoving: { name: string; insight: string }[];
    restock: { name: string; stock: number; urgency: string }[];
    summary: string;
}

export default function AIInsightsPage() {
    const [data, setData] = useState<InsightData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [generating, setGenerating] = useState(false);

    const fetchInsights = async (forceRefresh = false) => {
        try {
            setLoading(true);
            if (forceRefresh) setGenerating(true);

            const url = forceRefresh ? "/api/ai-insights?refresh=true" : "/api/ai-insights";
            const res = await fetch(url);

            if (!res.ok) throw new Error("Failed to fetch insights");

            const jsonData = await res.json();
            setData(jsonData);
            setError("");
        } catch (err) {
            setError("Failed to load AI insights. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
            setGenerating(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);


    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        AI Business Intelligence
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Real-time insights powered by Gemini 2.5 Flash
                    </p>
                </div>
                <button
                    onClick={() => fetchInsights(true)}
                    disabled={generating || loading}
                    className={`
            px-6 py-2.5 rounded-full font-medium transition-all duration-300
            ${generating
                            ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                            : "bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-lg active:scale-95"
                        }
          `}
                >
                    {generating ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generating Analysis...
                        </span>
                    ) : (
                        "Generate New AI Report"
                    )}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-800">
                    {error}
                </div>
            )}

            {loading && !data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                    ))}
                </div>
            ) : data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                    {/* Executive Summary - Spans full width or large area */}
                    <div className="lg:col-span-6 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow duration-300">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Executive Summary
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                            {data.summary}
                        </p>
                    </div>

                    {/* Best Selling Products */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow duration-300 flex flex-col">
                        <h2 className="text-lg font-semibold mb-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 8.586 14.586 5H12z" clipRule="evenodd" />
                            </svg>
                            Best Performing
                        </h2>
                        <div className="space-y-4 flex-1">
                            {data.bestSelling?.map((item, idx) => (
                                <div key={idx} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                    <div className="font-medium text-emerald-900 dark:text-emerald-300">{item.name}</div>
                                    <div className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">{item.insight}</div>
                                </div>
                            ))}
                            {!data.bestSelling?.length && <p className="text-gray-400 italic">No data available</p>}
                        </div>
                    </div>

                    {/* Slow Moving */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow duration-300 flex flex-col">
                        <h2 className="text-lg font-semibold mb-4 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Slow Moving
                        </h2>
                        <div className="space-y-4 flex-1">
                            {data.slowMoving?.map((item, idx) => (
                                <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                    <div className="font-medium text-amber-900 dark:text-amber-300">{item.name}</div>
                                    <div className="text-sm text-amber-700 dark:text-amber-400 mt-1">{item.insight}</div>
                                </div>
                            ))}
                            {!data.slowMoving?.length && <p className="text-gray-400 italic">No data available</p>}
                        </div>
                    </div>

                    {/* Restock Alerts */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow duration-300 flex flex-col">
                        <h2 className="text-lg font-semibold mb-4 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Restock Alerts
                        </h2>
                        <div className="space-y-4 flex-1">
                            {data.restock?.map((item, idx) => (
                                <div key={idx} className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-100 dark:border-rose-800/30 flex justify-between items-center group">
                                    <div>
                                        <div className="font-medium text-rose-900 dark:text-rose-300">{item.name}</div>
                                        <div className="text-xs text-rose-700 dark:text-rose-400 mt-1 font-semibold uppercase tracking-wide">
                                            {item.urgency} Urgency
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-rose-800 dark:text-rose-300 font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                        {item.stock} left
                                    </div>
                                </div>
                            ))}
                            {!data.restock?.length && (
                                <div className="h-full flex items-center justify-center text-gray-400 italic">
                                    All stocks are healthy
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );

}
