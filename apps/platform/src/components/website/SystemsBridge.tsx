"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Puzzle,
  TrendingDown,
  Lightbulb,
  PoundSterling,
} from "lucide-react";
import Link from "next/link";

const SYSTEMS = [
  { name: "Arbor", type: "MIS" },
  { name: "SIMS", type: "MIS" },
  { name: "Bromcom", type: "MIS" },
  { name: "Every HR", type: "HR" },
  { name: "Access", type: "Finance" },
  { name: "PSF", type: "Finance" },
  { name: "ParentPay", type: "Payments" },
  { name: "CPOMS", type: "Safeguarding" },
];

const STATS = [
  {
    icon: TrendingDown,
    stat: "80%",
    label: "of software features are rarely or never used",
    source: "Pendo / Standish Research",
  },
  {
    icon: PoundSterling,
    stat: "£900m",
    label: "spent on edtech by UK schools every year",
    source: "DfE / BESA",
  },
  {
    icon: Lightbulb,
    stat: "30%",
    label: "of teachers say tech has reduced their workload",
    source: "DfE EdTech Survey",
  },
];

const SystemsBridge = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold uppercase tracking-widest border border-amber-500/20 mb-6">
            <Puzzle size={14} />
            Your Systems, Supercharged
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
            We don't replace your systems.
            <br />
            <span className="text-primary">We help you actually use them.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Schools pay for powerful software they barely scratch the surface
            of. Licences auto-renew, platforms gather digital dust, and staff
            default to spreadsheets because nobody showed them the better way.
            Ed changes that.
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {STATS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border text-center"
            >
              <item.icon size={20} className="text-amber-500 mx-auto mb-3" />
              <div className="text-4xl font-black text-foreground mb-1">
                {item.stat}
              </div>
              <p className="text-sm text-muted-foreground leading-snug">
                {item.label}
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-2 font-medium">
                {item.source}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Two-column: message + systems */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: the pitch */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              Ed works with what you've got
            </h3>
            <div className="space-y-4">
              {[
                {
                  title: "See your screen, guide your clicks",
                  desc: "Ed watches what you're doing in Arbor, SIMS, or any system and walks you through it step by step. No more Googling for help articles.",
                },
                {
                  title: "No data stored, ever",
                  desc: "Ed processes screen captures in-memory and discards them immediately. Your data stays in your systems where it belongs.",
                },
                {
                  title: "Unlock features you're already paying for",
                  desc: "That reporting tool you've never used? That bulk import you didn't know existed? Ed knows every feature and shows you how.",
                },
                {
                  title: "One assistant across all systems",
                  desc: "Instead of learning 6 different help centres, ask Ed. Whether it's HR, finance, or MIS — Ed speaks them all.",
                },
              ].map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <div>
                    <p className="font-bold text-foreground text-sm">
                      {point.title}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {point.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link
              href="#meet-ed"
              className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
            >
              See how Ed works
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </motion.div>

          {/* Right: system badges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 text-center">
                Ed works across all your existing systems
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SYSTEMS.map((system, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-foreground/[0.03] border border-border hover:border-primary/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs group-hover:bg-primary/20 transition-colors">
                      {system.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {system.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {system.type}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Ed learns new systems continuously.{" "}
                  <span className="text-primary font-semibold">
                    Your system not listed? We'll add it.
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SystemsBridge;
