"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Check, X } from 'lucide-react';
import Footer from '@/components/website/Footer';
import Navbar from '@/components/website/Navbar';
import ImprovementFeatures from '@/components/website/ImprovementFeatures';

const SchoolgleImprovement = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="bg-white pt-20">
                {/* Hero */}
                <section className="py-24 px-6 text-center max-w-5xl mx-auto">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-8">
                        <TrendingUp size={32} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-medium text-gray-900 mb-8 tracking-tight text-balance">
                        Intelligent, evidence-led school improvement
                    </h1>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-12">
                        Your school improvement partner – analysing, planning and producing evidence with you, all year round.
                    </p>
                    <div className="flex justify-center gap-4">
                        <a href="/dashboard" className="px-8 py-4 bg-pink-600 text-white rounded-full font-medium hover:bg-pink-700 transition-colors">
                            Start improving
                        </a>
                        <button className="px-8 py-4 bg-gray-100 text-gray-900 rounded-full font-medium hover:bg-gray-200 transition-colors">
                            View sample reports
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
                                        "Disjointed documentation across drives and systems",
                                        "Scramble before Ofsted or trust reviews",
                                        "Unclear or competing priorities",
                                        "Actions written but not tracked",
                                        "Time-consuming SEF, PP, Sports Premium and SIAMS reports"
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
                                <h2 className="text-3xl font-medium text-gray-900 mb-8">What It Does</h2>
                                <ul className="space-y-6">
                                    {[
                                        "Scans your documents, folders, and cloud drives to automatically map evidence to framework areas",
                                        "Complete Ofsted and SIAMS self-assessments with AI-powered gap analysis",
                                        "Generates SEF drafts, Pupil Premium strategies, Sports Premium reports, and SDPs in seconds",
                                        "Tracks improvement actions with visual Gantt charts, assignees, and deadlines",
                                        "Records lesson and voice observations with AI-powered feedback and improvement suggestions",
                                        "AI Mock Inspector simulates real inspections and prepares you for tough questions",
                                        "Ed AI Coach provides instant guidance based on EEF research and inspection frameworks",
                                        "One-click reports for governors, trustees, and leadership teams",
                                        "Real-time dashboard showing assessment status, action progress, and evidence coverage"
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

                {/* Features Showcase */}
                <ImprovementFeatures />

                {/* Marketing Hooks */}
                <section className="py-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-8 mb-16">
                            {[
                                "Inspection readiness, all year round",
                                "Evidence at your fingertips",
                                "Improvement without overwhelm"
                            ].map((hook, i) => (
                                <div key={i} className="p-8 rounded-2xl bg-white border border-gray-100 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                    <p className="text-xl font-medium text-gray-900">{hook}</p>
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <p className="text-2xl text-gray-500 italic max-w-3xl mx-auto">
                                From "Where are we?" to "Here's our next step" – in minutes, not months.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Dark Gradient Strip */}
                <section className="py-24 bg-black text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-900/40 via-pink-800/20 to-transparent pointer-events-none" />
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <h2 className="text-4xl md:text-5xl font-medium mb-8">Take the stress out of improvement</h2>
                        <a href="/dashboard" className="inline-block px-8 py-4 bg-white text-pink-900 rounded-full font-medium hover:bg-pink-50 transition-colors">
                            Start improving
                        </a>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default SchoolgleImprovement;

