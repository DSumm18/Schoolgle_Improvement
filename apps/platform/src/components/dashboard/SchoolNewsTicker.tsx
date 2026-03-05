"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X, Bell, Calendar, AlertTriangle, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NewsItem {
    id: string;
    title: string;
    message: string;
    type: "info" | "alert" | "event" | "success";
    priority: "low" | "medium" | "high";
    icon?: string;
    link?: string;
    created_at: string;
    expires_at?: string;
    organization_id?: string;
    created_by?: string;
}

interface SchoolNewsTickerProps {
    organizationId: string;
    userRole?: string;
}

export function SchoolNewsTicker({ organizationId, userRole }: SchoolNewsTickerProps) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        fetchNews();
        // Refresh news every 5 minutes
        const interval = setInterval(fetchNews, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [organizationId]);

    // Auto-cycle through news
    useEffect(() => {
        if (isPaused || isExpanded || news.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % news.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isPaused, isExpanded, news.length]);

    const fetchNews = async () => {
        try {
            const { data } = await supabase
                .from("school_news")
                .select("*")
                .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
                .gte("expires_at", new Date().toISOString())
                .order("created_at", { ascending: false })
                .limit(10);

            if (data) {
                setNews(data);
            }
        } catch (error) {
            console.error("Failed to fetch news:", error);
        }
    };

    const getCurrentNews = () => {
        if (news.length === 0) return null;
        return news[currentIndex];
    };

    const getTypeIcon = (type: string): React.ComponentType<{ className?: string }> => {
        switch (type) {
            case "alert":
                return AlertTriangle;
            case "event":
                return Calendar;
            case "success":
                return Bell;
            default:
                return Megaphone;
        }
    };

    const getTypeStyles = (type: string, priority: string) => {
        const base = "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ";
        if (type === "alert") {
            return base + "bg-rose-100 text-rose-700";
        }
        if (type === "event") {
            return base + "bg-blue-100 text-blue-700";
        }
        if (type === "success") {
            return base + "bg-emerald-100 text-emerald-700";
        }
        return base + "bg-slate-100 text-slate-600";
    };

    if (news.length === 0) {
        return null; // Don't show ticker if no news
    }

    const currentNews = getCurrentNews();
    if (!currentNews) return null;

    const Icon = getTypeIcon(currentNews.type);

    return (
        <div className="relative">
            {/* Collapsed ticker bar */}
            <motion.div
                layout
                className={`bg-slate-900 text-white overflow-hidden transition-all ${
                    isExpanded ? "rounded-t-xl" : "rounded-full"
                }`}
            >
                <div
                    className={`flex items-center ${
                        isExpanded ? "p-4" : "px-6 py-3"
                    } transition-all`}
                >
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        <div
                            className={`p-1.5 rounded-full ${
                                currentNews.type === "alert"
                                    ? "bg-rose-500 animate-pulse"
                                    : currentNews.type === "event"
                                    ? "bg-blue-500"
                                    : "bg-slate-700"
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentNews.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 min-w-0"
                            >
                                <span className="text-sm truncate block">
                                    <span
                                        className={`font-bold ${
                                            currentNews.type === "alert"
                                                ? "text-rose-300"
                                                : "text-slate-300"
                                        }`}
                                    >
                                        {currentNews.title}
                                    </span>
                                    <span className="mx-2 text-slate-500">•</span>
                                    <span className="text-slate-400 truncate">{currentNews.message}</span>
                                </span>
                            </motion.div>
                        </AnimatePresence>

                        {!isExpanded && (
                            <div className="flex items-center gap-2 shrink-0">
                                {news.length > 1 && (
                                    <div className="flex gap-0.5">
                                        {news.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                    i === currentIndex
                                                        ? "bg-white"
                                                        : "bg-slate-600"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsExpanded(true);
                                    }}
                                    className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </button>

                    {isExpanded && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(false);
                            }}
                            className="ml-2 p-1 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-slate-800 mt-3 pt-4 space-y-3 max-h-64 overflow-y-auto"
                    >
                        {news.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (item.link) {
                                        window.open(item.link, "_blank");
                                    }
                                }}
                                className={`w-full text-left p-3 rounded-lg hover:bg-slate-800 transition-colors ${
                                    idx === currentIndex ? "bg-slate-800" : ""
                                }`}
                                onMouseEnter={() => {
                                    setCurrentIndex(idx);
                                    setIsPaused(true);
                                }}
                                onMouseLeave={() => setIsPaused(false)}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`p-1.5 rounded-lg shrink-0 ${
                                            item.type === "alert"
                                                ? "bg-rose-500"
                                                : item.type === "event"
                                                ? "bg-blue-500"
                                                : item.type === "success"
                                                ? "bg-emerald-500"
                                                : "bg-slate-600"
                                        }`}
                                    >
                                        {React.createElement(getTypeIcon(item.type), { className: "w-3.5 h-3.5" })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-xs font-bold truncate">{item.title}</p>
                                            <span
                                                className={`text-[9px] uppercase tracking-wider ${getTypeStyles(
                                                    item.type,
                                                    item.priority
                                                )}`}
                                            >
                                                {item.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">{item.message}</p>
                                        {item.link && (
                                            <p className="text-[10px] text-blue-400 mt-1">Click to view →</p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
