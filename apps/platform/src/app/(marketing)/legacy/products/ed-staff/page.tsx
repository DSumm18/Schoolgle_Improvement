"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { User, Check, X } from 'lucide-react';
import Footer from '@/components/website/Footer';
import Navbar from '@/components/website/Navbar';

const EdStaff = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="bg-white pt-20">
                {/* Hero */}
                <section className="py-24 px-6 text-center max-w-5xl mx-auto">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-8">
                        <User size={32} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-medium text-gray-900 mb-8 tracking-tight text-balance">
                        Your school's digital systems expert
                    </h1>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-12">
                        Ed sits on top of the platforms you already use and shows staff exactly what to do, step by step.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button className="px-8 py-4 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors">
                            See Ed in action
                        </button>
                        <button className="px-8 py-4 bg-gray-100 text-gray-900 rounded-full font-medium hover:bg-gray-200 transition-colors">
                            Start with one system
                        </button>
                    </div>
                </section>

                {/* Problem / Solution */}
                <section className="py-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-16 items-start">
                            <div>
                                <h2 className="text-3xl font-medium text-gray-900 mb-8">The Problem</h2>
                                <ul className="space-y-6">
                                    {[
                                        "Staff only use a fraction of MIS and HR features",
                                        "Heavy reliance on \"that one person who knows how it works\"",
                                        "Repeated training sessions that don't stick",
                                        "IT tickets for simple \"how do I…?\" tasks",
                                        "Inconsistent use of systems between staff and schools"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 text-gray-600 text-lg">
                                            <div className="mt-1 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                                <X size={14} className="text-red-600" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
                                <h2 className="text-3xl font-medium text-gray-900 mb-8">What Ed Does</h2>
                                <ul className="space-y-6">
                                    {[
                                        "Sees what staff see on screen (browser vision)",
                                        "Explains which button to press and why",
                                        "Suggests quicker, better workflows inside existing systems",
                                        "Helps with Arbor, Bromcom, SIMS, HR, finance, safeguarding, estates tools and more",
                                        "Generates lesson plans, scaffolds and resources on request",
                                        "Recommends new tools and AI services when they genuinely help"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 text-gray-600 text-lg">
                                            <div className="mt-1 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <Check size={14} className="text-green-600" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Marketing Hooks */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                            {[
                                "Training without training sessions",
                                "Fewer \"how do I…?\" calls to the office",
                                "Make the most of the systems you already pay for",
                                "Confident staff, consistent processes"
                            ].map((hook, i) => (
                                <div key={i} className="p-8 rounded-2xl bg-purple-50 border border-purple-100 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                    <p className="text-xl font-medium text-purple-900">{hook}</p>
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <p className="text-2xl text-gray-500 italic max-w-3xl mx-auto">
                                Ed is like sitting next to the expert in the office – without having to wait for them to be free.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Dark Gradient Strip */}
                <section className="py-24 bg-black text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent pointer-events-none" />
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <h2 className="text-4xl md:text-5xl font-medium mb-8">Empower your staff today</h2>
                        <button className="px-8 py-4 bg-white text-purple-900 rounded-full font-medium hover:bg-purple-50 transition-colors">
                            See Ed in action
                        </button>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default EdStaff;

