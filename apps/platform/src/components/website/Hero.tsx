"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Monitor, MessageCircle, Eye } from "lucide-react";
import SchoolgleAnimatedLogo from "@/components/SchoolgleAnimatedLogo";
import HeroShowcase from "@/components/website/HeroShowcase";
import Link from "next/link";

const ROTATING_WORDS = [
  "Inspection",
  "Compliance",
  "Governance",
  "Safeguarding",
];

const ED_CAPABILITIES = [
  { icon: MessageCircle, text: "Ask Ed anything about your school" },
  { icon: Eye, text: "Ed can see your screen and guide you" },
  { icon: Monitor, text: "Works with Arbor, SIMS, Bromcom & more" },
];

const Hero = () => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex flex-col items-center px-4 md:px-8 overflow-hidden">
      {/* Top section: Logo + Headline + CTAs */}
      <div className="container mx-auto max-w-6xl relative z-10 flex flex-col items-center pt-16 md:pt-24">
        {/* Animated Planet Logo - compact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <SchoolgleAnimatedLogo
            size={180}
            showText={false}
            className="mx-auto"
          />
        </motion.div>

        {/* Tagline badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built by school leaders, for school leaders
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground text-center leading-[0.95] max-w-5xl"
        >
          Always ready for{" "}
          <span className="relative inline-block">
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="text-primary inline-block"
              >
                {ROTATING_WORDS[wordIndex]}.
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-center leading-relaxed"
        >
          The AI-powered operations engine for UK schools. Meet{" "}
          <strong className="text-foreground">Ed</strong> — your assistant that
          works across every system, sees your screen, and keeps your school
          running smoothly.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="#early-access"
            className="group px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            Request Access
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
          <Link
            href="#meet-ed"
            className="px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-all"
          >
            Meet Ed
          </Link>
        </motion.div>

        {/* Ed capability pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {ED_CAPABILITIES.map((cap, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.2 + i * 0.15 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border text-sm text-muted-foreground"
            >
              <cap.icon size={14} className="text-primary" />
              <span>{cap.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Hero Showcase Player */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="container mx-auto max-w-6xl relative z-10 mt-16 mb-8 px-4"
      >
        <HeroShowcase />
      </motion.div>

      {/* Trust strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.8 }}
        className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 pb-16"
      >
        <span>UK Cloud Hosted</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
        <span>GDPR Compliant</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
        <span>DfE Aligned</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
        <span>No Data Stored by Ed</span>
      </motion.div>
    </section>
  );
};

export default Hero;
