"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const products = [
    {
        title: "Ed for Staff (Internal)",
        desc: "On-the-job guidance across your systems.",
        icon: Users,
        href: "/ed-staff",
        color: "blue"
    },
    {
        title: "Ed for Parents (Website)",
        desc: "Answers questions, reduces calls, routes messages safely.",
        icon: Globe,
        href: "/ed-parents",
        color: "purple"
    },
    {
        title: "Inspection Readiness (School Improvement)",
        desc: "Make readiness routine: roles, evidence, narrative.",
        icon: BarChart3,
        href: "/inspection-readiness",
        color: "indigo"
    }
];

const ProductsSection = () => {
    return (
        <section id="products" className="py-32 bg-slate-50/50 dark:bg-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Our Solutions</span>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 uppercase tracking-tighter">
                        Simple, clear, <br />
                        <span className="text-slate-400 dark:text-slate-600">purpose-built.</span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {products.map((product, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-white/10 hover:border-slate-900 dark:hover:border-white transition-all duration-500 shadow-sm hover:shadow-2xl"
                        >
                            <div className="space-y-8 h-full flex flex-col">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                                    <product.icon className="w-6 h-6 text-slate-400 group-hover:text-white dark:group-hover:text-slate-900 transition-colors" />
                                </div>

                                <div className="space-y-4 flex-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                                        {product.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        {product.desc}
                                    </p>
                                </div>

                                <Link
                                    href={product.href}
                                    className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-widest transition-colors"
                                >
                                    Learn more <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductsSection;
