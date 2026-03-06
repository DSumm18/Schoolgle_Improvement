"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Mail,
  FileText,
  Lightbulb,
  Newspaper,
  FlaskConical,
} from "lucide-react";
import {
  getPublishedInsights,
  getComingSoonInsights,
  getFeaturedInsights,
  MODULE_COLORS,
  type Insight,
} from "@/data/insights";

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  research: {
    label: "Research",
    icon: FlaskConical,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  guide: {
    label: "Guide",
    icon: BookOpen,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  opinion: {
    label: "Opinion",
    icon: Lightbulb,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  news: {
    label: "News",
    icon: Newspaper,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  "case-study": {
    label: "Case Study",
    icon: FileText,
    color: "text-pink-500 bg-pink-500/10 border-pink-500/20",
  },
};

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const cat = CATEGORY_META[insight.category || "guide"];
  const moduleInfo = insight.module ? MODULE_COLORS[insight.module] : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
    >
      <Link
        href={`/insights/${insight.slug}`}
        className="group block h-full rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
      >
        {insight.heroImage && (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={insight.heroImage}
              alt={insight.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {cat && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cat.color}`}
              >
                <cat.icon size={10} />
                {cat.label}
              </span>
            )}
            {moduleInfo && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: `${moduleInfo.color}10`,
                  color: moduleInfo.color,
                  borderColor: `${moduleInfo.color}25`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: moduleInfo.color }}
                />
                {moduleInfo.label}
              </span>
            )}
            {insight.readTime && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {insight.readTime}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
            {insight.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {insight.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60 font-medium">
              {new Date(insight.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {insight.source && (
              <span className="text-[10px] text-primary/60 font-semibold">
                {insight.source}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setEmail("");
  };

  return (
    <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8 h-full flex flex-col justify-center">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Mail size={22} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-1">
            The Schoolgle Signal
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Research + expert commentary on what it means for your school.
            Delivered weekly with exclusive tools and templates.
          </p>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your work email"
                required
                className="flex-1 px-4 py-2.5 rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:brightness-110 transition-all"
              >
                Subscribe
              </button>
            </form>
          ) : (
            <p className="text-sm text-primary font-semibold">
              You're in! Check your inbox.
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/50 mt-2">
            Free. No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [filterType, setFilterType] = useState<"category" | "module">("module");
  const [filter, setFilter] = useState<string>("all");
  const publishedInsights = getPublishedInsights();
  const comingSoonInsights = getComingSoonInsights();
  const featuredInsights = getFeaturedInsights();

  const moduleFilters = Object.entries(MODULE_COLORS);
  const categoryFilters = Object.entries(CATEGORY_META);

  const filteredInsights =
    filter === "all"
      ? publishedInsights
      : filterType === "module"
        ? publishedInsights.filter((i) => i.module === filter)
        : publishedInsights.filter((i) => i.category === filter);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-16 md:pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/20 mb-6">
              <FlaskConical size={14} />
              Research & Insights
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
              The latest thinking on
              <br />
              <span className="text-primary">school operations.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Evidence-backed research, practical guides, and informed opinion
              on running a modern UK school. Free to read. The newsletter tells
              you what it means.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured + Newsletter */}
      <section className="px-6 pb-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredInsights[0] && (
              <div className="lg:col-span-2">
                <Link
                  href={`/insights/${featuredInsights[0].slug}`}
                  className="group block h-full rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg p-8"
                >
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border text-primary bg-primary/10 border-primary/20 mb-4">
                    Featured
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3 group-hover:text-primary transition-colors">
                    {featuredInsights[0].title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {featuredInsights[0].excerpt}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                    Read article
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </Link>
              </div>
            )}
            <div className="lg:col-span-1">
              <NewsletterSignup />
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="px-6 pb-4 sticky top-20 z-30 bg-background/80 backdrop-blur-xl py-4 border-b border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Toggle between module and category view */}
            <div className="flex items-center gap-1 bg-foreground/5 rounded-full p-0.5 flex-shrink-0">
              <button
                onClick={() => {
                  setFilterType("module");
                  setFilter("all");
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filterType === "module"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                By Module
              </button>
              <button
                onClick={() => {
                  setFilterType("category");
                  setFilter("all");
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filterType === "category"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                By Type
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  filter === "all"
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "text-muted-foreground border-transparent hover:bg-foreground/5"
                }`}
              >
                All
              </button>

              {filterType === "module"
                ? moduleFilters.map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        filter === key
                          ? "border-current"
                          : "border-transparent hover:bg-foreground/5"
                      }`}
                      style={{
                        color: filter === key ? info.color : undefined,
                        backgroundColor:
                          filter === key ? `${info.color}15` : undefined,
                        borderColor:
                          filter === key ? `${info.color}30` : undefined,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                      {info.label}
                    </button>
                  ))
                : categoryFilters.map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        filter === key
                          ? `${meta.color} border-current`
                          : "text-muted-foreground border-transparent hover:bg-foreground/5"
                      }`}
                    >
                      {meta.label}
                    </button>
                  ))}
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="px-6 py-12">
        <div className="container mx-auto max-w-6xl">
          {filteredInsights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInsights.map((insight, i) => (
                <InsightCard key={insight.slug} insight={insight} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                No articles in this category yet. Check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Coming soon */}
      {comingSoonInsights.length > 0 && (
        <section className="px-6 py-16 bg-foreground/[0.02]">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-black text-foreground mb-8 text-center">
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {comingSoonInsights.map((insight, i) => (
                <motion.div
                  key={insight.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-card/50 border border-dashed border-border"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 block">
                    Coming Soon
                  </span>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {insight.excerpt}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
