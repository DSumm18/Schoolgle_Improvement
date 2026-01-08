"use client";

import React from 'react';
import { motion } from 'framer-motion';

const ProblemStatement = () => {
    return (
        <section className="py-32 bg-gray-50">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <p className="text-xl text-gray-500 leading-relaxed">
                        Most schools prepare for inspections using spreadsheets, shared folders, and memory. Evidence lives in different places. Tracking what's been done requires manual cross-referencing. When inspection arrives, staff spend days—sometimes weeks—pulling together evidence that should already be organised.
                    </p>
                    
                    <ul className="space-y-4">
                        <li className="flex gap-4 text-lg text-gray-700">
                            <span className="text-gray-400 font-medium">•</span>
                            <span>Evidence scattered across folders, drives, and filing cabinets</span>
                        </li>
                        <li className="flex gap-4 text-lg text-gray-700">
                            <span className="text-gray-400 font-medium">•</span>
                            <span>Action plans tracked in spreadsheets that quickly go out of date</span>
                        </li>
                        <li className="flex gap-4 text-lg text-gray-700">
                            <span className="text-gray-400 font-medium">•</span>
                            <span>Self-evaluation forms written from scratch each year, taking days of work</span>
                        </li>
                    </ul>
                </motion.div>
            </div>
        </section>
    );
};

export default ProblemStatement;

