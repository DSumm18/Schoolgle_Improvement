"use client";

import React from 'react';
import { motion } from 'framer-motion';

const ProblemStatement = () => {
    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <p className="text-xl text-gray-500 leading-relaxed">
                        School leaders are stretched. Workload is high, expertise is fragmented, and systems don't talk to each other. Every day brings another judgment call with incomplete information.
                    </p>
                    
                    <ul className="space-y-4">
                        <li className="flex gap-4 text-lg text-gray-700">
                            <span className="text-gray-400 font-medium">•</span>
                            <span>Staff spend hours searching for answers that should take seconds</span>
                        </li>
                        <li className="flex gap-4 text-lg text-gray-700">
                            <span className="text-gray-400 font-medium">•</span>
                            <span>Critical decisions rely on whoever happens to know the answer</span>
                        </li>
                        <li className="flex gap-4 text-lg text-gray-700">
                            <span className="text-gray-400 font-medium">•</span>
                            <span>Inspection prep is frantic because evidence isn't already organised</span>
                        </li>
                    </ul>
                </motion.div>
            </div>
        </section>
    );
};

export default ProblemStatement;

