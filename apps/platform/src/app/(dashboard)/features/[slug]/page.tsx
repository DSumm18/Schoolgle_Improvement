"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';

const GenericFeaturePage = () => {
    const params = useParams();
    const slug = params?.slug as string;

    // Extract title from path (e.g., "vision" -> "Vision")
    const title = slug?.replace(/-/g, ' ') || 'Feature';
    const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1);

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />
            <div className="pt-32 px-6 min-h-screen flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lp-bg-sec/50 border border-lp-border text-lp-accent text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        Feature Spotlight
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-lp-text outfit">
                        {capitalizedTitle}
                    </h1>

                    <p className="text-xl md:text-2xl text-lp-text-sec max-w-2xl mx-auto font-medium leading-relaxed">
                        The ultimate operations engine for this feature is currently launching. <br />
                        <span className="text-lp-text">The future of readiness is almost here.</span>
                    </p>

                    <div className="pt-8">
                        <Link
                            href="/#early-access"
                            className="px-10 py-5 bg-lp-accent text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20"
                        >
                            Get Notified
                        </Link>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default GenericFeaturePage;

