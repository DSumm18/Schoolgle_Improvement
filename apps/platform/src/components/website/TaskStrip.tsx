"use client";

import React from "react";
import { motion } from "framer-motion";

const tasks = [
  "VDAR form",
  "Printer setup",
  "Risk assessment",
  "Helpdesk ticket",
  "Governor pack",
  "Audit prep",
  "Budget forecast",
  "Staff absence",
];

const TaskStrip = () => {
  return (
    <section className="py-10 bg-foreground/[0.03] overflow-hidden relative border-y border-border">
      <div className="container mx-auto max-w-7xl px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-shrink-0">
            <h2 className="text-base font-black text-foreground uppercase tracking-tight">
              Got a task you're stuck on?{" "}
              <span className="text-muted-foreground italic lowercase font-medium">
                Ed can fix that.
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-2">
            {tasks.map((task, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-foreground transition-all cursor-default"
              >
                {task}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaskStrip;
