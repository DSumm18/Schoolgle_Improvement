"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, School, Zap } from 'lucide-react';

const differentiators = [
    {
        icon: Users,
        title: "Expert-led",
        description: "Built with senior school leaders and validated against real school practice."
    },
    {
        icon: School,
        title: "Sector-specific",
        description: "Understands UK school operations, not generic business processes."
    },
    {
        icon: Zap,
        title: "Built for real schools",
        description: "Works with the systems you already use, not against them."
    }
];

const Differentiation = () => {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight">
                        What makes Schoolgle different
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {differentiators.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center p-8"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                                    <IconComponent size={24} className="text-gray-700" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-gray-500 leading-relaxed">
                                    {item.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Differentiation;

