"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Globe, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

const products = [
  {
    title: "Ed for Staff",
    desc: "On-the-job guidance across Arbor, SIMS, Bromcom, Every HR, Access, and PSF. Ed sees your screen and walks you through any process.",
    icon: Users,
    href: "/ed-staff",
  },
  {
    title: "Ed for Parents",
    desc: "A 24/7 chatbot for your school website. Answers admissions questions, term dates, uniform info, and routes messages safely.",
    icon: Globe,
    href: "/ed-parents",
  },
  {
    title: "Inspection Readiness",
    desc: "Make readiness routine. Map evidence, track actions, generate SEF narratives, and stay prepared year-round.",
    icon: BarChart3,
    href: "/inspection-readiness",
  },
];

const ProductsSection = () => {
  return (
    <section id="products" className="py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/20 mb-6">
            Our Solutions
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Simple, clear, purpose-built.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="space-y-6 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <product.icon size={22} className="text-primary" />
                </div>

                <div className="space-y-3 flex-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {product.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.desc}
                  </p>
                </div>

                <Link
                  href={product.href}
                  className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest group-hover:gap-3 transition-all"
                >
                  Learn more{" "}
                  <ArrowRight size={14} className="transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
