"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getLatestPublicInsights } from '@/data/insights';

const InsightsSection = () => {
    const insights = getLatestPublicInsights(2);

    return (
        <section id="insights" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight">
                        Our thinking
                    </h2>
                    <p className="text-lg text-gray-500 max-w-3xl mx-auto mb-2">
                        We're sharing what we're learning as schools, trusts, and technology change.
                    </p>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                        Ideas and perspectives on where school operations are heading
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {insights.map((insight, index) => (
                        <motion.article
                            key={insight.slug}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link 
                                href={`/insights/${insight.slug}`}
                                className="block bg-gray-50 rounded-2xl p-8 hover:bg-gray-100 transition-colors group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-sm text-gray-400 font-medium">
                                        {insight.status === 'published' 
                                            ? new Date(insight.date).toLocaleDateString('en-GB', { 
                                                day: 'numeric', 
                                                month: 'long', 
                                                year: 'numeric' 
                                            })
                                            : 'Coming soon'
                                        }
                                    </span>
                                    <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-3 leading-snug">
                                    {insight.title}
                                </h3>
                                <p className="text-gray-500 leading-relaxed">
                                    {insight.excerpt}
                                </p>
                            </Link>
                        </motion.article>
                    ))}
                </div>

                {insights.length > 0 && (
                    <div className="text-center mt-12">
                        <Link 
                            href="/insights" 
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                        >
                            View all insights
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default InsightsSection;

