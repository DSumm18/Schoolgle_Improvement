"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';
import OrigamiParticles from '@/components/OrigamiParticles';
import { getPublishedInsights, getComingSoonInsights } from '@/data/insights';

export default function InsightsPage() {
    const publishedInsights = getPublishedInsights();
    const comingSoonInsights = getComingSoonInsights();

    return (
        <div className="min-h-screen bg-white relative">
            <OrigamiParticles text="Insights" opacity={0.15} shape="crane" position="top-left" size="medium" />
            
            <Navbar />

            <main className="relative z-10 bg-white">
                <section className="py-24">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-16"
                        >
                            <h1 className="text-5xl md:text-6xl font-medium text-gray-900 mb-6 tracking-tight">
                                Insights
                            </h1>
                            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                                We're sharing what we're learning as schools, trusts, and technology change.
                            </p>
                        </motion.div>

                        {/* Published Posts */}
                        {publishedInsights.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
                                {publishedInsights.map((insight, index) => (
                                    <motion.article
                                        key={insight.slug}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Link 
                                            href={`/insights/${insight.slug}`}
                                            className="block bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-colors group"
                                        >
                                            {insight.heroImage && (
                                                <div className="relative w-full h-48 overflow-hidden">
                                                    <Image
                                                        src={insight.heroImage}
                                                        alt={insight.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-8">
                                                <div className="flex items-start justify-between mb-4">
                                                    <span className="text-sm text-gray-400 font-medium">
                                                        {new Date(insight.date).toLocaleDateString('en-GB', { 
                                                            day: 'numeric', 
                                                            month: 'long', 
                                                            year: 'numeric' 
                                                        })}
                                                    </span>
                                                    <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                                                </div>
                                                <h2 className="text-xl font-medium text-gray-900 mb-3 leading-snug">
                                                    {insight.title}
                                                </h2>
                                                <p className="text-gray-500 leading-relaxed">
                                                    {insight.excerpt}
                                                </p>
                                            </div>
                                        </Link>
                                    </motion.article>
                                ))}
                            </div>
                        )}

                        {publishedInsights.length === 0 && comingSoonInsights.length === 0 && (
                            <div className="text-center py-16">
                                <p className="text-gray-400">No insights published yet. Check back soon.</p>
                            </div>
                        )}

                        {/* Coming Soon Section */}
                        {comingSoonInsights.length > 0 && (
                            <div className="mt-20">
                                <h2 className="text-2xl font-medium text-gray-900 mb-8 text-center">Coming Soon</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                    {comingSoonInsights.map((insight, index) => (
                                        <motion.article
                                            key={insight.slug}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: (publishedInsights.length + index) * 0.1 }}
                                        >
                                            <Link 
                                                href={`/insights/${insight.slug}`}
                                                className="block bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-colors group relative"
                                            >
                                                {insight.heroImage && (
                                                    <div className="relative w-full h-48 overflow-hidden">
                                                        <Image
                                                            src={insight.heroImage}
                                                            alt={insight.title}
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 100vw, 50vw"
                                                        />
                                                    </div>
                                                )}
                                                <div className="p-8">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <span className="text-sm text-gray-400 font-medium">Coming soon</span>
                                                        <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                                                    </div>
                                                    <h2 className="text-xl font-medium text-gray-900 mb-3 leading-snug">
                                                        {insight.title}
                                                    </h2>
                                                    <p className="text-gray-500 leading-relaxed">
                                                        {insight.excerpt}
                                                    </p>
                                                </div>
                                            </Link>
                                        </motion.article>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
