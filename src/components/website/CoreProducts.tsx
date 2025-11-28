"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, TrendingUp, ArrowRight, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface Product {
    id: string;
    title: string;
    hook: string;
    bullet: string;
    icon: LucideIcon;
    color: string;
    link: string;
}

const products: Product[] = [
    {
        id: "ed-parent",
        title: "Ed – Parent Chatbot",
        hook: "Your front desk, but automated – 24/7 and multilingual.",
        bullet: "Never answer the same question twice.",
        icon: MessageSquare,
        color: "bg-blue-50 text-blue-600",
        link: "/products/ed-parent"
    },
    {
        id: "ed-staff",
        title: "Ed – Staff Assistant",
        hook: "The colleague who always knows how the system works.",
        bullet: "Training without training sessions.",
        icon: User,
        color: "bg-purple-50 text-purple-600",
        link: "/products/ed-staff"
    },
    {
        id: "improvement",
        title: "Schoolgle Improvement",
        hook: "Inspection-ready, all year round – not just the week before.",
        bullet: "Generates SEF drafts with links back to your own evidence.",
        icon: TrendingUp,
        color: "bg-pink-50 text-pink-600",
        link: "/products/improvement"
    }
];

const CoreProducts = () => {
    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {products.map((product, index) => {
                        const IconComponent = product.icon;
                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group flex flex-col p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${product.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                                    <IconComponent size={28} />
                                </div>

                                <h3 className="text-2xl font-medium text-gray-900 mb-4 group-hover:text-black transition-colors">
                                    {product.title}
                                </h3>

                                <p className="text-lg font-medium text-gray-900 mb-4 leading-snug">
                                    {product.hook}
                                </p>

                                <div className="mt-auto pt-6 border-t border-gray-50">
                                    <p className="text-gray-500 text-sm mb-6 flex items-start gap-2">
                                        <span className="text-green-500 font-bold">✓</span>
                                        {product.bullet}
                                    </p>

                                    <Link href={product.link} className="inline-flex items-center gap-2 font-medium text-gray-900 hover:gap-3 transition-all">
                                        Learn more <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default CoreProducts;

