"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plug, Search, Palette, HardDrive, Database, Radio, Mail,
  BookOpen, ChevronRight, CheckCircle2, Clock, Lock,
  ExternalLink, Sparkles, Users, Settings,
} from "lucide-react";

type ConnectorStatus = "active" | "coming_soon" | "planned";

interface Connector {
  id: string;
  name: string;
  description: string;
  status: ConnectorStatus;
  icon: React.ReactNode;
  logoUrl?: string;
  color: string;
  stats?: string;
  href?: string;
  category: "productivity" | "data" | "communication" | "internal";
}

const CONNECTORS: Connector[] = [
  {
    id: "canva",
    name: "Canva",
    description: "Free, professionally designed templates for newsletters, letters, posters, and governance docs. One click opens in your Canva account.",
    status: "active",
    icon: <Palette className="w-6 h-6" />,
    color: "#7D2AE8",
    stats: "30 templates",
    href: "/dashboard/connectors/canva",
    category: "productivity",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Automatic document sync from your school's Google Drive. Evidence extraction and mapping to Ofsted/SIAMS frameworks.",
    status: "active",
    icon: <HardDrive className="w-6 h-6" />,
    color: "#4285F4",
    stats: "Document sync",
    href: "/dashboard/evidence",
    category: "data",
  },
  {
    id: "arbor",
    name: "Arbor MIS",
    description: "Import pupil data, attendance, and assessment records via CSV export from Arbor. Pseudonymised analysis with zero PII storage.",
    status: "coming_soon",
    icon: <Database className="w-6 h-6" />,
    color: "#00A98F",
    category: "data",
  },
  {
    id: "sims",
    name: "SIMS MIS",
    description: "Connect your SIMS data through CSV exports. Attendance, census, and assessment data for intelligence analysis.",
    status: "coming_soon",
    icon: <Database className="w-6 h-6" />,
    color: "#E6332A",
    category: "data",
  },
  {
    id: "bromcom",
    name: "Bromcom MIS",
    description: "Import data from Bromcom MIS. Supports pupil assessment, attendance, and workforce data formats.",
    status: "coming_soon",
    icon: <Database className="w-6 h-6" />,
    color: "#1B365D",
    category: "data",
  },
  {
    id: "notebooklm",
    name: "NotebookLM",
    description: "AI-powered research and training content generation. Create podcasts, summaries, and briefing packs from your school data.",
    status: "coming_soon",
    icon: <BookOpen className="w-6 h-6" />,
    color: "#EA4335",
    category: "productivity",
  },
  {
    id: "parentmail",
    name: "ParentMail",
    description: "Send communications to parents directly from Schoolgle. Letters, newsletters, and notifications synced to ParentMail.",
    status: "planned",
    icon: <Mail className="w-6 h-6" />,
    color: "#FF6B00",
    category: "communication",
  },
  {
    id: "dfe-apis",
    name: "DfE APIs",
    description: "Direct connection to Department for Education data services. School performance, workforce, and census data feeds.",
    status: "active",
    icon: <Radio className="w-6 h-6" />,
    color: "#003078",
    stats: "5 data feeds",
    href: "/dashboard/intelligence",
    category: "data",
  },
  {
    id: "staff-connectors",
    name: "Staff Connectors",
    description: "Track statutory roles, responsibilities, training compliance, and leaving impact analysis across your staff.",
    status: "active",
    icon: <Users className="w-6 h-6" />,
    color: "#6366F1",
    stats: "Role tracking",
    href: "/dashboard/connectors/staff",
    category: "internal",
  },
];

const STATUS_CONFIG: Record<ConnectorStatus, { label: string; icon: React.ReactNode; className: string }> = {
  active: {
    label: "Active",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  coming_soon: {
    label: "Coming Soon",
    icon: <Clock className="w-3.5 h-3.5" />,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  planned: {
    label: "Planned",
    icon: <Lock className="w-3.5 h-3.5" />,
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "productivity", label: "Productivity" },
  { id: "data", label: "Data & MIS" },
  { id: "communication", label: "Communication" },
  { id: "internal", label: "Internal" },
];

export default function ConnectorsHubPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = CONNECTORS.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeCount = CONNECTORS.filter((c) => c.status === "active").length;
  const totalCount = CONNECTORS.length;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Plug className="w-6 h-6 text-primary" />
              Connectors
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Integrate your school tools. {activeCount} active, {totalCount - activeCount} coming soon.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3 inline mr-1" />
              More connectors launching monthly
            </span>
          </div>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search connectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border w-fit">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat.id
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Connector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((connector, idx) => {
          const statusConfig = STATUS_CONFIG[connector.status];
          const isClickable = connector.status === "active" && connector.href;

          const Card = (
            <motion.div
              key={connector.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`group relative bg-card border border-border rounded-2xl p-5 transition-all ${
                isClickable
                  ? "hover:shadow-lg hover:border-primary/30 cursor-pointer"
                  : "opacity-80"
              }`}
            >
              {/* Status Badge */}
              <div className={`absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig.className}`}>
                {statusConfig.icon}
                {statusConfig.label}
              </div>

              {/* Logo & Title */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: connector.color }}
                >
                  {connector.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm">{connector.name}</h3>
                  {connector.stats && (
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {connector.stats}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {connector.description}
              </p>

              {/* Action */}
              <div className="flex items-center justify-between">
                {isClickable ? (
                  <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Open
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                ) : connector.status === "coming_soon" ? (
                  <span className="text-xs text-muted-foreground">Launching soon</span>
                ) : (
                  <span className="text-xs text-muted-foreground">In development</span>
                )}
              </div>
            </motion.div>
          );

          if (isClickable && connector.href) {
            return (
              <Link key={connector.id} href={connector.href} className="block">
                {Card}
              </Link>
            );
          }

          return Card;
        })}
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6 text-center"
      >
        <h3 className="font-bold text-sm mb-1">Need a connector we don&apos;t have?</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Tell us which tools your school uses and we&apos;ll prioritise them.
        </p>
        <a
          href="mailto:hello@schoolgle.co.uk?subject=Connector%20Request"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          Request a Connector
        </a>
      </motion.div>
    </div>
  );
}
