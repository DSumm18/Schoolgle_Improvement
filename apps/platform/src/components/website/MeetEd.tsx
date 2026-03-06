"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Monitor,
  MessageCircle,
  MousePointerClick,
  Globe,
  Shield,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const ED_FEATURES = [
  {
    icon: MessageCircle,
    title: "Ask Ed anything",
    desc: "Ed understands your school context. Ask about policies, deadlines, compliance requirements, or anything operational.",
  },
  {
    icon: Eye,
    title: "Ed can see your screen",
    desc: "Stuck in Arbor, SIMS, or Bromcom? Ed sees what you see and guides you step-by-step through any process.",
  },
  {
    icon: MousePointerClick,
    title: "Browser control",
    desc: "Ed can take the wheel. With your permission, Ed clicks, fills forms, and navigates third-party systems for you.",
  },
  {
    icon: Monitor,
    title: "Works with your systems",
    desc: "Arbor, SIMS, Bromcom, Every HR, Access, PSF — Ed bridges across them all without storing any of your data.",
  },
  {
    icon: Globe,
    title: "Ed for your website",
    desc: "Give parents instant answers 24/7. Ed handles admissions queries, term dates, uniform info, and routes messages safely.",
  },
  {
    icon: Shield,
    title: "Zero data stored",
    desc: "Ed sees, guides, and acts — but never stores your data. Screen captures are processed in-memory and immediately discarded.",
  },
];

const MeetEd = () => {
  return (
    <section id="meet-ed" className="py-24 md:py-32 relative overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/20 mb-6">
            Meet Ed
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[0.95]">
            Your AI assistant that{" "}
            <span className="text-primary">actually sees</span>
            <br />
            what you're doing.
          </h2>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Ed isn't just a chatbot. Ed sees your screen, understands your
            systems, and guides you through tasks across Arbor, SIMS, Bromcom,
            and more — without storing a single byte of your data.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ED_FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon size={22} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Link
            href="#early-access"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            Get Ed for your school
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default MeetEd;
