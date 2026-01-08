"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        function handleOnline() {
            setIsOffline(false);
            setShowReconnected(true);
            setTimeout(() => setShowReconnected(false), 5000);
        }

        function handleOffline() {
            setIsOffline(true);
        }

        if (typeof window !== "undefined") {
            setIsOffline(!navigator.onLine);
            window.addEventListener("online", handleOnline);
            window.addEventListener("offline", handleOffline);
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[999]"
                >
                    <div className="bg-rose-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-xl">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                            <WifiOff size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest">You are offline</span>
                            <span className="text-[10px] font-bold opacity-80">Some features may be limited</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {showReconnected && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[999]"
                >
                    <div className="bg-emerald-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-xl">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Wifi size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest">Connection Restored</span>
                            <span className="text-[10px] font-bold opacity-80">You're back online</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
