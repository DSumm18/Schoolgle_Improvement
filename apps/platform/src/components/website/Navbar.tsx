"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import SchoolgleAnimatedLogo from '@/components/SchoolgleAnimatedLogo';
import ThemeToggle from '@/components/effects/ThemeToggle';

const Navbar = () => {

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-20">
                <Link href="/" className="flex items-center gap-2 mr-12 relative h-full">
                    <SchoolgleAnimatedLogo size={200} showText={true} className="scale-[0.4] origin-left" />
                </Link>

                <div className="hidden md:flex items-center gap-2 flex-1">
                    <a href="/#preview" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">What we're building</a>
                    <Link href="/insights" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Insights</Link>
                    <Link href="/toolbox" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Toolbox</Link>
                    <a href="/#early-access" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Early access</a>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2">
                        Sign In
                    </Link>
                    <a href="#early-access" className="px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                        Request Access
                    </a>
                </div>
            </div>

        </motion.nav>
    );
};

export default Navbar;

