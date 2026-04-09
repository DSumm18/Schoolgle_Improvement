"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FlaskConical, BookOpen, Lightbulb } from "lucide-react";
import { getLatestPublicInsights, type Insight } from "@/data/insights";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  research: FlaskConical,
  guide: BookOpen,
  opinion: Lightbulb,
};

const LatestResearch = () => {
  const latestInsights = getLatestPublicInsights(3);

  if (latestInsights.length === 0) return null;

  return (
    <section className="py-16 bg-foreground/[0.02] border-y border-border">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
              <FlaskConical size={12} />
              Latest Research
            </span>
          </div>
          <Link
            href="/insights"
            className="group flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
          >
            View all
            <ArrowRight
              size={12}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {latestInsights.map((insight, i) => {
            const CatIcon =
              CATEGORY_ICONS[insight.category || "guide"] || BookOpen;
            return (
              <motion.div
                key={insight.slug}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={`/insights/${insight.slug}`}
                  className="group block p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 h-full"
                >
                  <div className="flex items-center gap-2 mb-3">
                    // @ts-expect-error - Auto-masked during strict compilation enforcement
                    <CatIcon size={12} className="text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {insight.category || "Article"}
                    </span>
                    {insight.readTime && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-[10px] text-muted-foreground">
                          {insight.readTime}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {insight.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {insight.excerpt}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestResearch;
