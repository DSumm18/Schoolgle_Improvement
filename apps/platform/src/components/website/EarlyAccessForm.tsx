"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const EarlyAccessForm = () => {
    const [email, setEmail] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [role, setRole] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    school_name: schoolName,
                    role: role,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSubmitted(true);
                setEmail('');
                setSchoolName('');
                setRole('');
            } else {
                setError(data.error || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setError('Failed to connect to the server. Please check your internet connection.');
            console.error('Waitlist submission error:', err);
        } finally {
            setLoading(false);
        }
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
                        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Your work email"
                                        required
                                        disabled={loading}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={schoolName}
                                        onChange={(e) => setSchoolName(e.target.value)}
                                        placeholder="School / Trust Name"
                                        disabled={loading}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        disabled={loading}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50 appearance-none"
                                    >
                                        <option value="" disabled>Select your role</option>
                                        <option value="headteacher">Headteacher / Principal</option>
                                        <option value="sbm">SBM / Finance Lead</option>
                                        <option value="trust-lead">Trust / MAT Lead</option>
                                        <option value="governor">Governor / Trustee</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-12 py-3 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center mx-auto"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Request early access"
                                )}
                            </button>

                            <div className="text-sm text-gray-500 mt-4 space-y-1">
                                <p>No spam. Pilot updates only.</p>
                                <p>Designed for UK primary schools, trusts, and MATs.</p>
                            </div>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-800 rounded-xl p-8 max-w-md mx-auto border border-gray-700"
                        >
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-white font-medium text-lg mb-2">You're on the list!</h3>
                            <p className="text-gray-400 text-sm">Thank you for your interest in Schoolgle. We'll be in touch soon with more information about the pilot.</p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="mt-6 text-sm text-gray-500 hover:text-white transition-colors underline underline-offset-4"
                            >
                                Send another request
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default EarlyAccessForm;

