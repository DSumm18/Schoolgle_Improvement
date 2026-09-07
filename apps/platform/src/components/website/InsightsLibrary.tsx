"use client";

import type { LucideIcon } from "lucide-react";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Lightbulb,
  Newspaper,
  FlaskConical,
} from "lucide-react";
import {
  getPublishedInsights,
  getFeaturedInsights,
  MODULE_COLORS,
  type Insight,
} from "@/data/insights";

const CATEGORY_META: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
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
                {insight.format === "briefing" ? "Report briefing" : cat.label}
              </span>
            )}
            {moduleInfo && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: `${moduleInfo.color}10`,
                  color: "var(--foreground)",
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground/60 font-medium">
              Reviewed{" "}
              {new Date(insight.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {insight.source && (
              <span className="text-[10px] text-muted-foreground font-semibold">
                {insight.source}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function ReadingGuide() {
  return (
    <aside className="rounded-2xl bg-primary/5 border border-primary/20 p-8 h-full flex flex-col justify-center">
      <p className="sg-eyebrow">The report, made useful</p>
      <h3 className="text-2xl font-semibold mb-4">
        What changed? What matters? What next?
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Each report briefing brings together the findings, the limits of the
        evidence and practical questions for your team. Original sources and
        their publication dates are included, so you can check the detail.
      </p>
      <a href="#insights-library" className="sg-text-link">
        Explore the briefings <ArrowRight size={16} />
      </a>
    </aside>
  );
}

export default function InsightsPage() {
  const [filterType, setFilterType] = useState<"category" | "module">("module");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [briefingsOnly, setBriefingsOnly] = useState(false);
  const publishedInsights = getPublishedInsights();
  const featuredInsights = getFeaturedInsights();
  const lead =
    publishedInsights.find(
      (i) => i.slug === "preparing-for-ofsted-2025" && i.format === "briefing",
    ) || featuredInsights[0];
  const briefingCount = publishedInsights.filter(
    (i) => i.format === "briefing",
  ).length;

  const moduleFilters = Object.entries(MODULE_COLORS);
  const categoryFilters = Object.entries(CATEGORY_META);

  const categoryInsights =
    filter === "all"
      ? publishedInsights
      : filterType === "module"
        ? publishedInsights.filter((i) => i.module === filter)
        : publishedInsights.filter((i) => i.category === filter);
  const query = search.trim().toLowerCase();
  const filteredInsights = categoryInsights.filter(
    (i) =>
      (!briefingsOnly || i.format === "briefing") &&
      (!query ||
        [i.title, i.excerpt, i.source, ...(i.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(query)),
  );

  return (
    <main className="min-h-screen">
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
              Reports worth your time.
              <br />
              <span className="text-primary">Ideas you can use.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              What the evidence says, what it doesn’t settle, and what your
              school could do next. Independent Schoolgle briefings and
              practical guides for leaders, business managers and teachers. Free
              to read.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured + Newsletter */}
      <section className="px-6 pb-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {lead && (
              <div className="lg:col-span-2">
                <Link
                  href={`/insights/${lead.slug}`}
                  className="group block h-full rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg p-8"
                >
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border text-primary bg-primary/10 border-primary/20 mb-4">
                    September briefing · {lead.readTime} read
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3 group-hover:text-primary transition-colors">
                    {lead.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {lead.excerpt}
                  </p>
                  {lead.summary && (
                    <ul className="space-y-2 text-sm text-muted-foreground mb-6 list-disc pl-5">
                      {lead.summary.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  )}
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                    Read the briefing
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </Link>
              </div>
            )}
            <div className="lg:col-span-1">
              <ReadingGuide />
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section
        id="insights-library"
        aria-label="Find an insight"
        className="px-6 py-4 border-y border-border scroll-mt-24"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-5">
            <label className="block w-full sm:max-w-md text-sm font-semibold">
              Search the notebook
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Try SEND, workforce or Ofsted"
                className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-base font-normal focus:outline-primary"
              />
            </label>
            <button
              aria-pressed={briefingsOnly}
              onClick={() => setBriefingsOnly(!briefingsOnly)}
              className="min-h-11 rounded-full border border-primary/30 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary"
            >
              {briefingsOnly ? "Showing report briefings" : "Report briefings"}{" "}
              ({briefingCount})
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Toggle between module and category view */}
            <div className="flex items-center gap-1 bg-foreground/5 rounded-full p-0.5 flex-shrink-0">
              <button
                aria-pressed={filterType === "module"}
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
                aria-pressed={filterType === "category"}
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
                aria-pressed={filter === "all"}
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
                      aria-pressed={filter === key}
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        filter === key
                          ? "border-current"
                          : "border-transparent hover:bg-foreground/5"
                      }`}
                      style={{
                        color: filter === key ? "var(--foreground)" : undefined,
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
                      aria-pressed={filter === key}
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
          <p role="status" className="mb-6 text-sm text-muted-foreground">
            {filteredInsights.length}{" "}
            {filteredInsights.length === 1 ? "article" : "articles"} ·{" "}
            {briefingsOnly
              ? "Report briefings"
              : "Briefings, practical guides and perspectives"}
          </p>
          {filteredInsights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInsights.map((insight, i) => (
                <InsightCard key={insight.slug} insight={insight} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                No articles match these filters. Try another topic or clear your
                search.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                  setBriefingsOnly(false);
                }}
                className="mt-4 min-h-11 px-5 py-3 rounded-lg border border-border text-sm font-semibold"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
