"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import SchoolgleAnimatedLogo from '@/components/SchoolgleAnimatedLogo';

const Navbar = () => {

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-0 z-50 bg-white border-b border-gray-100"
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
                    <a href="/#preview" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">What we're building</a>
                    <Link href="/insights" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">Insights</Link>
                    <Link href="/toolbox" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">Toolbox</Link>
                    <a href="/#early-access" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">Early access</a>
                </div>

                <div className="flex items-center gap-4">
                    <a href="#early-access" className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-colors">
                        Request early access
                    </a>
                </div>
            </div>

        </motion.nav>
    );
};

export default Navbar;

