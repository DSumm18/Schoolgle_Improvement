"use client";

import React from "react";
import { motion } from "framer-motion";

const problems = [
  "Evidence scattered across folders, drives, and filing cabinets",
  "Action plans tracked in spreadsheets that quickly go out of date",
  "Self-evaluation forms written from scratch each year",
  "Staff spending days pulling together information for inspections",
];

const ProblemStatement = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-10"
        >
          <div className="text-center">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold uppercase tracking-widest border border-destructive/20 mb-6">
              The Problem
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              Schools weren't built to run on spreadsheets.
            </h2>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
            Most schools prepare for inspections using spreadsheets, shared
            folders, and memory. When the call comes, staff spend days pulling
            together evidence that should already be organised.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {problems.map((problem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-5 rounded-xl bg-card/50 border border-border"
              >
                <span className="mt-1 w-2 h-2 rounded-full bg-destructive/60 flex-shrink-0" />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  {problem}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemStatement;
