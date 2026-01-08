"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Mail, Wrench, X, Layout } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';
import OrigamiParticles from '@/components/OrigamiParticles';
import ToolCard, { Tool } from '@/components/ToolCard';
import toolsData from '@/data/tools.json';

const CATEGORIES = ['All', 'Finance', 'SEND', 'Teaching', 'HR', 'Estates', 'Compliance', 'Admin', 'Data'] as const;
type Category = typeof CATEGORIES[number];

export default function ToolboxPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [freeOnly, setFreeOnly] = useState(false);

    const tools: Tool[] = toolsData.tools;

    // Filter tools based on search, category, and free toggle
    const filteredTools = useMemo(() => {
        return tools.filter((tool) => {
            // Category filter
            if (selectedCategory !== 'All' && tool.category !== selectedCategory) {
                return false;
            }

            // Free only filter
            if (freeOnly && tool.pricing !== 'Free') {
                return false;
            }

            // Search filter (name, summary, tags)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesName = tool.name.toLowerCase().includes(query);
                const matchesSummary = tool.summary.toLowerCase().includes(query);
                const matchesTags = tool.tags.some(tag => tag.toLowerCase().includes(query));
                const matchesNotes = tool.notes?.toLowerCase().includes(query);
                
                if (!matchesName && !matchesSummary && !matchesTags && !matchesNotes) {
                    return false;
                }
            }

            return true;
        });
    }, [tools, searchQuery, selectedCategory, freeOnly]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('All');
        setFreeOnly(false);
    };

    const hasActiveFilters = searchQuery || selectedCategory !== 'All' || freeOnly;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 relative">
            <OrigamiParticles text="Tools" opacity={0.12} shape="crane" position="top-left" size="medium" />

            <Navbar />

            <main className="relative z-10 bg-white dark:bg-gray-950">
                {/* Hero Section */}
                <section className="pt-24 pb-12">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center max-w-3xl mx-auto"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium mb-6">
                                <Wrench size={16} />
                                School Toolbox
                            </div>

                            <h1 className="text-4xl md:text-5xl font-medium text-gray-900 dark:text-gray-50 mb-6 tracking-tight">
                                Free tools for schools
                            </h1>

                            <p className="text-xl text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-2xl mx-auto">
                                A curated directory of free, external tools that schools can use immediately. 
                                No sign-up required. No Schoolgle account needed.
                            </p>
                            
                            <p className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                                We curate these tools because we know how hard it is to find reliable resources that actually work in UK schools. 
                                Each tool is tested and verified. Ed, our guide, can help you choose the right tool for your needs and explain how to use them effectively.
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <a
                                    href="mailto:admin@schoolgle.co.uk?subject=Tool%20Suggestion%20for%20Schoolgle%20Toolbox"
                                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <Mail size={16} />
                                    Suggest a tool
                                </a>
                                <Link
                                    href="/toolbox/workspace"
                                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <Layout size={16} />
                                    Open Workspace Mode
                                </Link>
                            </div>
                        </motion.div>

                        {/* Trust Notice */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="max-w-2xl mx-auto mt-8 space-y-2"
                        >
                            <p className="text-center text-sm text-gray-400 dark:text-gray-500">
                                All tools are external and free to use. Links go directly to third-party websites.
                            </p>
                            <p className="text-center text-sm text-gray-400 dark:text-gray-500">
                                Check your organisation's data protection rules before uploading personal data.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Filters Section */}
                <section className="py-8 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 sticky top-20 z-30">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            {/* Search */}
                            <div className="relative w-full lg:w-80">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search tools..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Category Tabs */}
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            selectedCategory === category
                                                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>

                            {/* Free Toggle + Clear */}
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={freeOnly}
                                        onChange={(e) => setFreeOnly(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-gray-900 dark:focus:ring-gray-100 bg-white dark:bg-gray-800"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Free only</span>
                                </label>

                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Results Section */}
                <section className="py-12">
                    <div className="max-w-7xl mx-auto px-6">
                        {/* Results count */}
                        <div className="mb-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {filteredTools.length === 0 
                                    ? 'No tools found' 
                                    : `Showing ${filteredTools.length} tool${filteredTools.length === 1 ? '' : 's'}`
                                }
                                {hasActiveFilters && ' (filtered)'}
                            </p>
                        </div>

                        {/* Tools Grid */}
                        {filteredTools.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {filteredTools.map((tool, index) => (
                                    <motion.div
                                        key={tool.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <ToolCard tool={tool} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Filter size={24} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    No tools found
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    {tools.length === 0 
                                        ? 'No tools have been added yet. Check back soon!'
                                        : 'Try adjusting your filters or search term.'
                                    }
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-50 mb-4">
                            Know a useful tool we've missed?
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            We're always looking to expand this directory with helpful, trustworthy resources for schools. 
                            Ed can help you find the right tool for your specific needs.
                        </p>
                        <a
                            href="mailto:admin@schoolgle.co.uk?subject=Tool%20Suggestion%20for%20Schoolgle%20Toolbox"
                            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <Mail size={16} />
                            Suggest a tool
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

