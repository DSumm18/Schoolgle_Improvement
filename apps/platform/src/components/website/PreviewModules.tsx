"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  PoundSterling,
  Shield,
  Heart,
  BookOpen,
  Gavel,
  TrendingUp,
} from "lucide-react";

// Planet colours match the animated logo and navbar dropdown
const modules = [
  {
    icon: Users,
    title: "HR & People",
    desc: "Staff reviews, objectives, absence tracking",
    color: "#ADD8E6",
    status: "In development",
  },
  {
    icon: PoundSterling,
    title: "Finance & Business",
    desc: "Budgets, invoices, forecasting",
    color: "#FFAA4C",
    status: "Early access",
  },
  {
    icon: Building2,
    title: "Estates & Facilities",
    desc: "Compliance checks, maintenance logs",
    color: "#00D4D4",
    status: "In development",
  },
  {
    icon: Shield,
    title: "Compliance & Safety",
    desc: "Statutory checks, risk assessments",
    color: "#E6C3FF",
    status: "In development",
  },
  {
    icon: BookOpen,
    title: "Teaching & Learning",
    desc: "Lesson planning, curriculum, CPD",
    color: "#FFB6C1",
    status: "Early access",
  },
  {
    icon: Heart,
    title: "SEND & Inclusion",
    desc: "IEPs, scaffolds, evidence tracking",
    color: "#98FF98",
    status: "In development",
  },
  {
    icon: Gavel,
    title: "Governance & Trust",
    desc: "Board reports, MAT oversight, minutes",
    color: "#FFD700",
    status: "In development",
  },
  {
    icon: TrendingUp,
    title: "School Improvement",
    desc: "SEF, action plans, evidence mapping",
    color: "#0ea5e9",
    status: "In development",
  },
];

const PreviewModules = () => {
  return (
    <section id="preview" className="py-24 md:py-32 bg-foreground/[0.02]">
      <div className="container mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/20 mb-6">
            Modules
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            What we're building
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete operations platform for every part of school life — each
            module represented by a planet in the Schoolgle universe.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module, index) => {
            const IconComponent = module.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-opacity-50 transition-all duration-300 text-center"
                style={
                  {
                    "--module-color": module.color,
                  } as React.CSSProperties
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${module.color}40`;
                  e.currentTarget.style.boxShadow = `0 8px 30px ${module.color}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${module.color}15` }}
                >
                  <IconComponent size={22} style={{ color: module.color }} />
                </div>
                {/* Planet dot + name */}
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: module.color }}
                  />
                  <h3 className="font-bold text-foreground text-sm">
                    {module.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {module.desc}
                </p>
                <span
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${module.color}10`,
                    color: module.color,
                  }}
                >
                  {module.status}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PreviewModules;
