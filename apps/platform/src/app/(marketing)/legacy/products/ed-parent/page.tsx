"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Check, ArrowRight, X } from 'lucide-react';
import Footer from '@/components/website/Footer';
import Navbar from '@/components/website/Navbar';

const EdParent = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="bg-white pt-20">
                {/* Hero */}
                <section className="py-24 px-6 text-center max-w-5xl mx-auto">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-8">
                        <MessageSquare size={32} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-medium text-gray-900 mb-8 tracking-tight text-balance">
                        The smarter way for parents to engage with your school
                    </h1>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-12">
                        Your virtual receptionist – available 24/7, fluent in every language, always on message.
                    </p>
                    <div className="flex justify-center gap-4">
                        <a href="/signup" className="px-8 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
                            Get started with Ed
                        </a>
                        <button className="px-8 py-4 bg-gray-100 text-gray-900 rounded-full font-medium hover:bg-gray-200 transition-colors">
                            See a live example
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
                                        "Overloaded office staff",
                                        "Constant phone calls and walk-ins",
                                        "Repeating the same information",
                                        "Language barriers with families",
                                        "Forms not completed or returned",
                                        "Messages getting lost or delayed"
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
                                        "Understands any parent question in natural language",
                                        "Answers instantly with school-approved information",
                                        "Guides families through forms (FSM, admissions, trips, SEND)",
                                        "Sends messages to the right staff or team",
                                        "Books appointments with agreed rules and slots",
                                        "Works transparently in multiple languages",
                                        "Keeps a record of interactions where you need it"
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
                                "Your front desk, but automated",
                                "Never answer the same question twice",
                                "No more half-finished or missing forms",
                                "Clear communication, every time"
                            ].map((hook, i) => (
                                <div key={i} className="p-8 rounded-2xl bg-blue-50 border border-blue-100 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                    <p className="text-xl font-medium text-blue-900">{hook}</p>
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <p className="text-2xl text-gray-500 italic max-w-3xl mx-auto">
                                "Can I check what time pick-up is today?" – answered in seconds, not minutes on hold.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Dark Gradient Strip */}
                <section className="py-24 bg-black text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-blue-800/20 to-transparent pointer-events-none" />
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <h2 className="text-4xl md:text-5xl font-medium mb-8">Ready to transform parent engagement?</h2>
                        <a href="/signup" className="inline-block px-8 py-4 bg-white text-blue-900 rounded-full font-medium hover:bg-blue-50 transition-colors">
                            Get started with Ed
                        </a>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default EdParent;

