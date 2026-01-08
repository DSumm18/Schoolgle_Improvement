"use client";

import React from 'react';
import { motion } from 'framer-motion';

const WhySchoolgle = () => {
    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight">
                        Why Schoolgle
                    </h2>
                </motion.div>

                <div className="max-w-4xl mx-auto space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <h3 className="text-2xl font-medium text-gray-900">The current reality: spreadsheets, folders, and panic</h3>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Most schools prepare for inspections using a combination of spreadsheets, shared folders, and memory. Evidence lives in different places. Tracking what's been done and what's outstanding requires manual cross-referencing. When inspection arrives, staff spend days—sometimes weeks—pulling together evidence that should already be organised.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Schoolgle replaces the spreadsheet-and-folder approach with a single platform that automatically organises evidence, tracks actions, and generates reports. Evidence is mapped to inspection frameworks from the moment it's created. Action plans are visible and trackable without manual updates. Reports generate themselves. Inspection readiness becomes a background process, not a crisis.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                    >
                        <h3 className="text-2xl font-medium text-gray-900">Why this is different to consultants</h3>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Consultants provide valuable expertise, but they're expensive and temporary. They come in, help you prepare, and leave. When the next inspection cycle begins, you're back to square one.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Schoolgle gives you the structure and tools consultants would set up, but it stays with your school permanently. It's a fraction of the cost of consultant support, and it improves over time as it learns your school's context. You get the benefits of expert-led inspection preparation without the ongoing consultancy fees.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <h3 className="text-2xl font-medium text-gray-900">Why this aligns with Ofsted expectations</h3>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Ofsted expects schools to have a clear understanding of their strengths and areas for improvement. They want to see evidence of continuous improvement, not last-minute preparation. Schoolgle supports this by making self-evaluation an ongoing process, not an annual scramble.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            The platform helps schools demonstrate the "quality of education" through organised evidence of curriculum intent, implementation, and impact. It supports "behaviour and attitudes" through clear tracking of policies and their implementation. It aids "personal development" and "leadership and management" through transparent action planning and progress tracking.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Schoolgle doesn't replace good leadership or teaching. It removes the administrative burden that prevents school leaders from focusing on what matters most.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default WhySchoolgle;

