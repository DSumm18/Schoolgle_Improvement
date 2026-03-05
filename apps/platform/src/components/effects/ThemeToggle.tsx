"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Only render after mount to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-lp-bg-sec border border-lp-border hover:border-lp-accent transition-colors relative h-10 w-10 flex items-center justify-center overflow-hidden"
        >
            {mounted ? (
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={theme}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {theme === 'dark' ? (
                            <Sun size={18} className="text-lp-amber" />
                        ) : (
                            <Moon size={18} className="text-lp-accent" />
                        )}
                    </motion.div>
                </AnimatePresence>
            ) : (
                // Placeholder to prevent layout shift
                <div className="w-[18px] h-[18px]" />
            )}
        </button>
    );
};

export default ThemeToggle;
