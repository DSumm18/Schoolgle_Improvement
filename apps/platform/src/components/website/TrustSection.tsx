"use client";

import React from 'react';
import { motion } from 'framer-motion';

const TrustSection = () => {
    return (
        <section className="py-32 bg-white">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center space-y-6"
                >
                    <h2 className="text-3xl md:text-4xl font-medium text-gray-900 tracking-tight">
                        Built with UK primary schools, for UK primary schools
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                        Schoolgle is designed by school leaders who understand the pressure of inspection readiness. We're working with a small group of pilot schools to ensure the platform works in real school environments, not just in theory.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default TrustSection;

