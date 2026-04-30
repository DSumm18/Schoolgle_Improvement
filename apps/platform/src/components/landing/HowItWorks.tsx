"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link2, ScanSearch, CheckCircle } from 'lucide-react';

interface StepProps {
    number: string;
    title: string;
    description: string;
    icon: React.ElementType;
    delay: number;
}

const Step = ({ number, title, description, icon: Icon, delay }: StepProps) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="flex-1 flex flex-col items-center text-center relative z-10 px-4"
    >
        <div className="w-20 h-20 rounded-[2rem] bg-lp-bg-sec border-2 border-lp-border flex items-center justify-center mb-10 group-hover:border-lp-accent transition-colors relative">
            <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-lp-bg border border-lp-border flex items-center justify-center text-lp-accent font-black text-xs outfit">
                {number}
            </div>
            <Icon className="text-lp-accent" size={32} />
        </div>
        <h3 className="text-2xl font-black text-lp-text outfit mb-4 tracking-tight">{title}</h3>
        <p className="text-lp-text-sec text-lg leading-relaxed font-medium">
            {description}
        </p>
    </motion.div>
);

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-32 px-6 bg-lp-bg-sec/30 border-y border-lp-border relative overflow-hidden">
            <div className="container max-w-7xl mx-auto relative">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black text-lp-text outfit tracking-tight leading-tight mb-6"
                    >
                        Three steps to <br /><span className="text-lp-accent">Seamless Readiness.</span>
                    </motion.h2>
                </div>

                <div className="relative flex flex-col md:flex-row gap-16 md:gap-4 items-start">
                    {/* Connecting Line (Horizontal on desktop) */}
                    <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-lp-border to-transparent">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '100%' }}
                            viewport={{ once: true }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="h-full bg-lp-accent"
                        />
                    </div>

                    <Step
                        number="01"
                        delay={0.1}
                        icon={Link2}
                        title="Connect Sources"
                        description="Securely link your school's existing storage—Google Drive, OneDrive, or local servers. We read everything, you upload nothing."
                    />
                    <Step
                        number="02"
                        delay={0.3}
                        icon={ScanSearch}
                        title="Scan & Map"
                        description="Our engine automatically categorizes every document according to Ofsted and SIAMS Framework requirements."
                    />
                    <Step
                        number="03"
                        delay={0.5}
                        icon={CheckCircle}
                        title="Always Ready"
                        description="Your dashboard displays real-time readiness. When inspection day comes, your evidence is already organized and verified."
                    />
                </div>

                {/* Action Button at the end of the process */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    className="mt-24 text-center"
                >
                    <div className="inline-block p-[1px] rounded-2xl bg-gradient-to-r from-lp-accent to-blue-500">
                        <button className="px-8 py-4 bg-lp-bg rounded-2xl text-lp-text font-black text-xs uppercase tracking-widest hover:bg-transparent transition-colors">
                            Begin Implementation Plan
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HowItWorks;
