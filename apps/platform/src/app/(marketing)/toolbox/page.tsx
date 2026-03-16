"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Mail,
  Wrench,
  X,
  ExternalLink,
  Globe,
  Lock,
  Star,
  Crown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toolsData from "@/data/tools.json";

/* ── Apple-style motion config ── */

const spring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const staggerItem: import("framer-motion").Variants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

interface Tool {
  id: string;
  name: string;
  url: string;
  category: string;
  tags: string[];
  pricing: string;
  tier: "free" | "pro" | "premium";
  summary: string;
  notes?: string;
}

const CATEGORIES = [
  "All",
  "Finance",
  "SEND",
  "Teaching",
  "HR",
  "Estates",
  "Compliance",
  "Admin",
  "Data",
] as const;

const TIERS = [
  { id: "all", label: "All Tools" },
  { id: "free", label: "Free", icon: Globe },
  { id: "pro", label: "Pro", icon: Star },
  { id: "premium", label: "Premium", icon: Crown },
] as const;

const TIER_STYLES: Record<
  string,
  { badge: string; border: string; icon: React.ElementType }
> = {
  free: {
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    border: "hover:border-emerald-500/30",
    icon: Globe,
  },
  pro: {
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    border: "hover:border-blue-500/30",
    icon: Star,
  },
  premium: {
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    border: "hover:border-amber-500/30",
    icon: Crown,
  },
};

function ToolCard({ tool }: { tool: Tool }) {
  const [faviconError, setFaviconError] = useState(false);
  const tierStyle = TIER_STYLES[tool.tier];
  const isExternal = tool.url.startsWith("http");

  let faviconUrl = "";
  try {
    if (isExternal) {
      faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(tool.url).hostname)}&sz=32`;
    }
  } catch {
    // ignore
  }

  const CardContent = (
    <div
      className={`card-hover group h-full rounded-2xl bg-card/50 backdrop-blur-sm border border-border ${tierStyle.border} p-5 sm:p-6 flex flex-col transition-colors duration-200`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {faviconUrl && !faviconError ? (
            <Image
              src={faviconUrl}
              alt=""
              width={24}
              height={24}
              className="w-6 h-6"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <tierStyle.icon size={18} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors duration-200">
            {tool.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tool.category}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 ${tierStyle.badge}`}
        >
          <tierStyle.icon size={10} />
          {tool.tier === "free" ? tool.pricing : tool.tier}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1">
        {tool.summary}
      </p>

      {tool.notes && (
        <p className="text-[11px] text-muted-foreground/60 italic mb-4">
          {tool.notes}
        </p>
      )}

      {tool.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {tool.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-foreground/5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto">
        {tool.tier === "premium" ? (
          <span className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Lock size={12} />
            Premium — coming soon
          </span>
        ) : isExternal ? (
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary group-hover:gap-3 transition-all duration-200">
            Open tool
            <ExternalLink size={12} />
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary group-hover:gap-3 transition-all duration-200">
            Try this tool
            <ExternalLink size={12} />
          </span>
        )}
      </div>
    </div>
  );

  const isInternalTool = tool.url.startsWith("/toolbox/");

  if (isInternalTool) {
    return <Link href={`/toolbox/${tool.id}`}>{CardContent}</Link>;
  }

  if (isExternal) {
    return (
      <a href={tool.url} target="_blank" rel="noopener noreferrer">
        {CardContent}
      </a>
    );
  }

  return <Link href={tool.url}>{CardContent}</Link>;
}

export default function ToolboxPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTier, setSelectedTier] = useState("all");

  const tools: Tool[] = toolsData.tools as Tool[];

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      if (selectedCategory !== "All" && tool.category !== selectedCategory)
        return false;
      if (selectedTier !== "all" && tool.tier !== selectedTier) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          tool.name.toLowerCase().includes(query) ||
          tool.summary.toLowerCase().includes(query) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          tool.notes?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [tools, searchQuery, selectedCategory, selectedTier]);

  const freeCount = tools.filter((t) => t.tier === "free").length;
  const proCount = tools.filter((t) => t.tier === "pro").length;
  const premiumCount = tools.filter((t) => t.tier === "premium").length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-16 md:pt-24 pb-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/20 mb-6"
            >
              <Wrench size={14} />
              School Toolbox
            </motion.span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
              Free tools for
              <br />
              <span className="text-primary">UK schools.</span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              A curated directory of tools that actually work in schools.
              External free tools, plus Schoolgle Pro and Premium tools for
              subscribers.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Tier summary */}
      <section className="px-4 sm:px-6 pb-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto"
          >
            {[
              {
                tier: "free",
                count: freeCount,
                label: "Free External Tools",
                desc: "No account needed",
              },
              {
                tier: "pro",
                count: proCount,
                label: "Signal Pro Tools",
                desc: "Free with Signal subscription",
              },
              {
                tier: "premium",
                count: premiumCount,
                label: "Premium Tools",
                desc: "Schoolgle Premium",
              },
            ].map((item) => {
              const style = TIER_STYLES[item.tier];
              return (
                <motion.button
                  key={item.tier}
                  variants={staggerItem}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    setSelectedTier(
                      selectedTier === item.tier ? "all" : item.tier,
                    )
                  }
                  className={`btn-press p-3 sm:p-4 rounded-xl border text-center transition-colors duration-200 ${
                    selectedTier === item.tier
                      ? `${style.badge} border-current`
                      : "border-border hover:border-foreground/10"
                  }`}
                >
                  <div className="text-xl sm:text-2xl font-black text-foreground">
                    {item.count}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-foreground mt-1">
                    {item.label}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
                    {item.desc}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 sm:px-6 pb-4 sticky top-20 z-30 bg-background/80 backdrop-blur-xl py-4 border-b border-border safe-area-inset">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category pills — horizontal scroll on mobile */}
            <div className="flex gap-1.5 overflow-x-auto scroll-x-hidden w-full sm:w-auto pb-1 sm:pb-0 -mx-1 px-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`btn-press px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-transparent"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="px-4 sm:px-6 py-8 sm:py-12">
        <div className="container mx-auto max-w-6xl">
          <p className="text-xs text-muted-foreground mb-6">
            {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""}
            {selectedCategory !== "All" || selectedTier !== "all"
              ? " (filtered)"
              : ""}
          </p>

          {filteredTools.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              key={`${selectedCategory}-${selectedTier}-${searchQuery}`}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
            >
              {filteredTools.map((tool) => (
                <motion.div key={tool.id} variants={staggerItem}>
                  <ToolCard tool={tool} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Filter
                size={24}
                className="text-muted-foreground mx-auto mb-4"
              />
              <p className="text-muted-foreground mb-4">No tools found.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedTier("all");
                }}
                className="text-sm text-primary font-bold"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-16 bg-foreground/[0.02] border-t border-border">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-2xl font-black text-foreground mb-3">
              Know a useful tool we've missed?
            </h2>
            <p className="text-muted-foreground mb-6">
              We're always expanding this directory with helpful resources for
              UK schools. Ed can help you find the right tool for your needs.
            </p>
            <a
              href="mailto:admin@schoolgle.co.uk?subject=Tool%20Suggestion%20for%20Schoolgle%20Toolbox"
              className="btn-press inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              <Mail size={16} />
              Suggest a tool
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
