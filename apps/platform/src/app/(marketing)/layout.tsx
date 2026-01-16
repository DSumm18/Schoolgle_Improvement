"use client";

import React from 'react';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';
import { OrbitBackground } from '@/components/effects';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background selection:bg-slate-900 dark:selection:bg-white selection:text-white dark:selection:text-slate-900 transition-colors duration-700 font-sans antialiased">
            <Navbar />

            <div className="fixed inset-0 z-0 pointer-events-none">
                <OrbitBackground variant="hero" density="sparse" speed="slow" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <div className="flex-1">
                    {children}
                </div>
                <Footer />
            </div>
        </div>
    );
}
