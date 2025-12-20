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
                        Join early access
                    </h2>
                    <p className="text-gray-400 mb-10 max-w-xl mx-auto">
                        We're working with a small group of schools to shape Schoolgle. Get updates and early access invitations.
                    </p>
                    
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
                                    Request access
                                </button>
                            </div>
                            <div className="text-sm text-gray-500 mt-4 space-y-1">
                                <p>No spam. Early access updates only.</p>
                                <p>Designed for UK schools and trusts.</p>
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

