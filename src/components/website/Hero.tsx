"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import Link from 'next/link';

interface Particle {
    left: number;
    top: number;
    duration: number;
}

const Hero = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Generate particles only on client to avoid hydration mismatch
        const generatedParticles: Particle[] = Array.from({ length: 20 }, () => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            duration: 2 + Math.random() * 3
        }));
        setParticles(generatedParticles);
    }, []);
    return (
        <section className="relative min-h-screen flex flex-col pt-12 px-4 md:px-8 pb-20 overflow-hidden">
            <div className="container mx-auto max-w-7xl relative z-10">

                {/* Header Text */}
                <div className="text-center mb-20 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center justify-center gap-2 mb-6"
                    >
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                            Built with UK schools, for UK schools
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-7xl font-medium tracking-tight text-gray-900 text-balance leading-[1.1]"
                    >
                        A smarter, simpler way <br />
                        <span className="text-gray-500">to run your school</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed"
                    >
                        Schoolgle is the AI operating system for schools – cutting admin, unlocking your systems and giving staff time back for what actually matters.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col items-center gap-4 pt-6"
                    >
                        <div className="flex items-center justify-center gap-4">
                            <Link href="/signup" className="px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all flex items-center gap-2">
                                Get started with Schoolgle
                            </Link>
                            <button className="px-8 py-4 bg-gray-100 text-gray-900 rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                                <Play size={18} fill="currentColor" />
                                Watch a 2-minute overview
                            </button>
                        </div>
                        <span className="text-sm text-gray-400 font-medium">No long setup. Pilot in a single school first.</span>
                    </motion.div>
                </div>

                {/* Dark Video Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="relative w-full aspect-video bg-[#050505] rounded-[2.5rem] overflow-hidden shadow-2xl mx-auto max-w-6xl"
                >
                    {/* Simulated Video Content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-6 max-w-2xl px-6">
                            <div className="flex flex-col items-center justify-center gap-6 mb-8">
                                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                                    S
                                </div>
                                <h2 className="text-5xl font-medium text-white tracking-tight">Meet Schoolgle</h2>
                            </div>

                            <p className="text-lg text-gray-400 leading-relaxed">
                                Schoolgle brings together chat, automation and browser vision into one platform that actually understands school life.
                            </p>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                From attendance calls and parent forms to SEFs, risk assessments and curriculum planning – Schoolgle quietly takes work off your plate.
                            </p>

                            <div className="pt-4">
                                <span className="px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium backdrop-blur-sm">
                                    Trusted by leaders, teachers, office staff, site teams and governors.
                                </span>
                            </div>

                            {/* Abstract Particles - Client-side only to avoid hydration mismatch */}
                            {particles.length > 0 && (
                                <div className="absolute inset-0 opacity-30 pointer-events-none">
                                    {particles.map((particle, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-1 h-1 bg-white rounded-full"
                                            style={{
                                                left: `${particle.left}%`,
                                                top: `${particle.top}%`,
                                                animation: `pulse ${particle.duration}s infinite`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default Hero;

