"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/effects/ThemeToggle';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: "/#preview", label: "What we're building" },
        { href: "/insights", label: "Insights" },
        { href: "/toolbox", label: "Toolbox" },
        { href: "/#early-access", label: "Early access" },
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 md:h-32 flex items-center justify-between relative z-20">
                    {/* Logo Section */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2 relative h-16 md:h-28 group transition-transform hover:scale-105 active:scale-95">
                            <Image
                                src="/schoolgle-logo-full.png"
                                alt="Schoolgle"
                                width={400}
                                height={120}
                                className="h-full w-auto object-contain"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden lg:flex items-center gap-1 mx-8 flex-1 justify-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all rounded-lg hover:bg-muted/50"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right-side Actions (Desktop) */}
                    <div className="hidden lg:flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mr-2">
                            Sign In
                        </Link>
                        <Link
                            href="#early-access"
                            className="px-6 py-3 text-sm font-black uppercase tracking-widest text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            Request Access
                        </Link>
                    </div>

                    {/* Mobile Toggle & Actions */}
                    <div className="flex lg:hidden items-center gap-3">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-foreground hover:bg-muted/50 rounded-xl transition-colors"
                            aria-label="Toggle Menu"
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="lg:hidden border-t border-border bg-background overflow-hidden"
                        >
                            <div className="px-6 py-8 space-y-6">
                                <div className="flex flex-col gap-4">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="text-lg font-bold text-muted-foreground hover:text-foreground transition-colors py-2 border-b border-border/50"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                                <div className="pt-4 space-y-4">
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block text-center text-lg font-bold text-muted-foreground hover:text-foreground"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="#early-access"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block w-full text-center px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-500/20"
                                    >
                                        Request Access
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </>
    );
};

export default Navbar;
