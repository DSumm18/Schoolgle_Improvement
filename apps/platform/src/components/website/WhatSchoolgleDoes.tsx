"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  ClipboardList,
  PieChart,
  HeartHandshake,
  BookOpen,
  FileText,
  LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  label: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: MessageCircle,
    label: "Ed - Parent Chatbot",
    desc: "Fewer calls, clearer messages, happier families.",
  },
  {
    icon: UserCheck,
    label: "Ed - Staff Assistant",
    desc: "Your systems, finally easy to use.",
  },
  {
    icon: TrendingUp,
    label: "Schoolgle Improvement",
    desc: "Evidence, actions and SEF in one place.",
  },
  {
    icon: ShieldCheck,
    label: "Estates & Compliance",
    desc: "Checks, logs and reports without spreadsheets.",
  },
  {
    icon: ClipboardList,
    label: "HR & People",
    desc: "Reviews, objectives and return-to-work made simple.",
  },
  {
    icon: PieChart,
    label: "Finance & Business",
    desc: "From invoices to insights in a few clicks.",
  },
  {
    icon: HeartHandshake,
    label: "SEND & Inclusion",
    desc: "Scaffolds, plans and evidence that are easy to keep updated.",
  },
  {
    icon: BookOpen,
    label: "Teaching & Learning",
    desc: "Lesson planning, resources and curriculum alignment.",
  },
  {
    icon: FileText,
    label: "Governance & Trust",
    desc: "Instant reports and transparent progress for boards and MATs.",
  },
];

const WhatSchoolgleDoes = () => {
  return (
    <section className="py-24 md:py-32 bg-foreground/[0.02]">
      <div className="container mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/20 mb-6">
            The Platform
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Built for every team in your school
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Different roles, same problem: too much admin. Schoolgle supports
            everyone without adding yet another system to learn.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="group flex flex-col items-start gap-4 p-7 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <IconComponent size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1.5">
                    {feature.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhatSchoolgleDoes;
