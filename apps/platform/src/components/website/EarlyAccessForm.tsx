"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const EarlyAccessForm = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Wire up to actual waitlist system
        console.log('Early access signup:', email);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setEmail('');
        }, 3000);
    };

    return (
        <section id="early-access" className="py-24 bg-gray-900">
            <div className="max-w-3xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
                        Join the Early Access Pilot
                    </h2>
                    <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                        We're working with a small group of UK primary schools, trusts, and MATs to shape Schoolgle's development.
                    </p>
                    <div className="text-gray-400 mb-10 max-w-2xl mx-auto space-y-4 text-left">
                        <div>
                            <h3 className="text-white font-medium mb-2">Who the pilot is for</h3>
                            <p className="text-sm">Headteachers and School Business Managers who understand the challenges of inspection readiness and are willing to provide honest feedback.</p>
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-2">What schools get</h3>
                            <p className="text-sm">Full access to Schoolgle Improvement at no cost during the pilot period, including automatic evidence mapping, SEF generation, action planning, and priority support.</p>
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-2">No risk, no commitment</h3>
                            <p className="text-sm">The pilot is completely free. There's no payment required, no long-term commitment, and no obligation to continue after the pilot period. Your data remains yours and can be exported at any time.</p>
                        </div>
                    </div>
                    
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your work email"
                                    required
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    Request early access
                                </button>
                            </div>
                            <div className="text-sm text-gray-500 mt-4 space-y-1">
                                <p>No spam. Pilot updates only.</p>
                                <p>Designed for UK primary schools, trusts, and MATs.</p>
                            </div>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-800 rounded-xl p-6 max-w-md mx-auto"
                        >
                            <p className="text-white font-medium">Thank you! We'll be in touch.</p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default EarlyAccessForm;

