"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Server, Lock, FileCheck } from "lucide-react";

const trustPoints = [
  { icon: Lock, label: "UK GDPR Compliant", detail: "Full data protection" },
  {
    icon: Server,
    label: "UK Cloud Hosted",
    detail: "Data stays in the UK",
  },
  {
    icon: Shield,
    label: "DfE Security Framework",
    detail: "Meeting national standards",
  },
  {
    icon: FileCheck,
    label: "No Data Stored by Ed",
    detail: "Screen data never persisted",
  },
];

const TrustSection = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-10"
        >
          <div>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/20 mb-6">
              Trust & Security
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              Built with UK schools,
              <br />
              for <span className="text-primary">UK schools.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Schoolgle is designed by school leaders who understand the
              pressure of inspection readiness. We're working with pilot schools
              to ensure the platform works in real school environments.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 border border-border"
              >
                <point.icon size={20} className="text-primary" />
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {point.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {point.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;
