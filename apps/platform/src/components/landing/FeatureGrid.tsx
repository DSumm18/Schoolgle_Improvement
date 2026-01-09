"use client";

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FileSearch,
    Sparkles,
    BarChart3,
    ShieldCheck,
    Zap,
    Users
} from 'lucide-react';

interface FeatureCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    className?: string;
}

const FeatureCard = ({ icon: Icon, title, description, className = "" }: FeatureCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{
                '--mouse-x': `${mousePos.x}%`,
                '--mouse-y': `${mousePos.y}%`,
            } as React.CSSProperties}
            className={`bento-card p-8 flex flex-col gap-4 group ${className}`}
        >
            <div className="w-12 h-12 rounded-xl bg-lp-bg flex items-center justify-center border border-lp-border group-hover:bg-lp-accent/10 transition-colors">
                <Icon className="text-lp-accent" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-black text-lp-text outfit mb-2 tracking-tight">{title}</h3>
                <p className="text-lp-text-sec text-sm leading-relaxed font-medium">{description}</p>
            </div>

            {/* Decorative inner glow for bento look */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-lp-accent/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        </motion.div>
    );
};

const FeatureGrid = () => {
    return (
        <section id="features" className="py-32 px-6 bg-lp-bg relative overflow-hidden">
            <div className="container max-w-7xl mx-auto">
                <div className="mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-8"
                    >
                        <div className="max-w-xl">
                            <h2 className="text-4xl md:text-5xl font-black text-lp-text outfit tracking-tight leading-tight mb-6">
                                Engineered for <br /><span className="text-lp-accent">Operational Excellence.</span>
                            </h2>
                            <p className="text-lg text-lp-text-sec font-medium leading-relaxed">
                                We've built a suite of tools that work together to create a single source of truth for your school's compliance and improvement journey.
                            </p>
                        </div>
                        <div className="px-6 py-3 rounded-full border border-lp-border text-[10px] font-black uppercase tracking-widest text-lp-text-muted">
                            Framework v2.4.0
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={FileSearch}
                        title="Auto-Evidence Mapping"
                        description="Our AI scans your connected storage and automatically matches documents to Ofsted & SIAMS standards."
                        className="md:col-span-2 md:row-span-1 min-h-[300px] justify-center"
                    />
                    <FeatureCard
                        icon={Sparkles}
                        title="AI-Powered SEF Drafts"
                        description="Generate high-quality self-evaluation drafts based directly on your current evidence."
                    />
                    <FeatureCard
                        icon={Zap}
                        title="Real-time Gap Analysis"
                        description="Never be surprised by a gap again. Automated alerts notify you if key standards are lacking evidence."
                    />
                    <FeatureCard
                        icon={BarChart3}
                        title="Executive Dashboards"
                        description="High-level visibility for Trust leads and Governors across multiple school sites."
                    />
                    <FeatureCard
                        icon={ShieldCheck}
                        title="Single Central Register"
                        description="Integrated compliance checks that feed directly into your leadership and management evaluation."
                    />
                </div>
            </div>
        </section>
    );
};

export default FeatureGrid;
