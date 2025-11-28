"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import SchoolgleAnimatedLogo from '@/components/SchoolgleAnimatedLogo';

interface MenuItem {
    headline: string;
    subhead: string;
    links: Array<{ title: string; href: string }>;
}

const menuItems: Record<string, MenuItem> = {
    Product: {
        headline: "Three core products to transform your school",
        subhead: "Choose the tools that fit your needs",
        links: [
            { title: 'Ed – Parent Chatbot', href: '/products/ed-parent' },
            { title: 'Ed – Staff Assistant', href: '/products/ed-staff' },
            { title: 'Schoolgle Improvement', href: '/products/improvement' },
        ]
    },
    Features: {
        headline: "Built to support every corner of school life",
        subhead: "Comprehensive tools for modern education",
        links: [
            { title: 'Browser Vision', href: '/features/vision' },
            { title: 'Natural Language', href: '/features/nlp' },
            { title: 'School-Safe Data', href: '/features/security' },
        ]
    },
    Resources: {
        headline: "Everything you need to stay up-to-date",
        subhead: "",
        links: [
            { title: 'Latest Blogs', href: '/resources/blog' },
            { title: 'Case Studies', href: '/resources/stories' },
            { title: 'Help Center', href: '/resources/help' },
        ]
    },
};

const Navbar = () => {
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-0 z-50 bg-white border-b border-gray-100"
            onMouseLeave={() => setHoveredTab(null)}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-20 bg-white">
                <Link href="/" className="flex items-center gap-2 mr-12 relative" style={{ minHeight: '96px' }}>
                    {/* Container for logo text - center point for orbits */}
                    <span className="text-xl font-semibold text-gray-900 whitespace-nowrap relative z-10">
                        Schoolgle
                    </span>
                    {/* Animated planets orbiting around the center of "Schoolgle" text */}
                    <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible pointer-events-none" 
                        style={{ 
                            width: 200, 
                            height: 200
                        }}
                    >
                        <SchoolgleAnimatedLogo size={200} showText={false} />
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-2 flex-1">
                    {Object.keys(menuItems).map((tab) => (
                        <div
                            key={tab}
                            className="relative"
                            onMouseEnter={() => setHoveredTab(tab)}
                        >
                            <button
                                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-500 ${
                                    hoveredTab === tab
                                        ? 'bg-gray-100 text-black'
                                        : 'text-gray-600 hover:text-black'
                                }`}
                            >
                                {tab}
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-500 ${hoveredTab === tab ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>
                    ))}
                    <Link href="#" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">Pricing</Link>
                    <Link href="#" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">Blog</Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
                        Sign In
                    </Link>
                    <Link href="/signup" className="px-6 py-2.5 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors">
                        Get Started
                    </Link>
                </div>
            </div>

            {/* Mega Menu Dropdown */}
            <AnimatePresence>
                {hoveredTab && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white border-t border-gray-100 overflow-hidden shadow-sm"
                    >
                        <div className="max-w-7xl mx-auto px-6 py-12">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={hoveredTab}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-12"
                                >
                                    {/* Left Column: Headline */}
                                    <div className="max-w-md">
                                        <h3 className="text-3xl font-medium text-gray-900 mb-4 leading-tight">
                                            {menuItems[hoveredTab].headline}
                                        </h3>
                                        {menuItems[hoveredTab].subhead && (
                                            <p className="text-gray-500 mb-6">
                                                {menuItems[hoveredTab].subhead}
                                            </p>
                                        )}
                                        {hoveredTab === 'Product' && (
                                            <Link href="/" className="inline-block px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-900 transition-colors">
                                                See overview
                                            </Link>
                                        )}
                                    </div>

                                    {/* Right Column: Links */}
                                    <div className="flex flex-col justify-center space-y-4">
                                        {menuItems[hoveredTab].links.map((link) => (
                                            <Link
                                                key={link.title}
                                                href={link.href}
                                                className="group flex items-center gap-2 text-lg text-gray-600 hover:text-black transition-colors w-fit"
                                                onClick={() => setHoveredTab(null)}
                                            >
                                                {link.title}
                                                <ChevronRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                                            </Link>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;

