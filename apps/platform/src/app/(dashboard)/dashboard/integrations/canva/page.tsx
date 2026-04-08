"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Palette,
  Search,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Newspaper,
  FileText,
  Monitor,
  Users,
  Building2,
  MessageCircle,
} from "lucide-react";
import {
  ModulePageHeader,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";

// ─── Template Types ──────────────────────────────────────────

type TemplateCategory =
  | "Newsletter"
  | "Letter"
  | "Display"
  | "Governor"
  | "Estate";

interface CanvaTemplate {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  canvaUrl: string;
  thumbnail: string;
}

const CATEGORY_CONFIG: Record<
  TemplateCategory,
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  Newsletter: {
    icon: Newspaper,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/20",
  },
  Letter: {
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  Display: {
    icon: Monitor,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
  },
  Governor: {
    icon: Users,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/20",
  },
  Estate: {
    icon: Building2,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/20",
  },
};

// ─── Placeholder Templates (30 across 5 categories) ──────────

const TEMPLATES: CanvaTemplate[] = [
  // Newsletters (6)
  { id: "nl-01", title: "Weekly School Newsletter", description: "Clean layout for weekly updates, dates, and celebrations.", category: "Newsletter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "nl-02", title: "Half-Term Roundup", description: "End-of-term highlights with photo gallery sections.", category: "Newsletter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "nl-03", title: "EYFS Newsletter", description: "Colourful early years newsletter with learning journal highlights.", category: "Newsletter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "nl-04", title: "PTA Newsletter", description: "Parent-teacher association updates, events, and fundraising.", category: "Newsletter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "nl-05", title: "Staff Bulletin", description: "Internal weekly staff briefing with CPD and diary dates.", category: "Newsletter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "nl-06", title: "Holiday Activity Newsletter", description: "Holiday clubs, summer reading challenges, and community events.", category: "Newsletter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },

  // Letters (6)
  { id: "lt-01", title: "General Parent Letter", description: "Standard headed letter template with school branding.", category: "Letter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "lt-02", title: "Trip Permission Letter", description: "School trip details with consent slip tear-off.", category: "Letter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "lt-03", title: "Attendance Concern Letter", description: "Sensitive attendance letter following DfE guidance.", category: "Letter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "lt-04", title: "Welcome to School Letter", description: "New starter welcome pack cover letter.", category: "Letter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "lt-05", title: "SEN Review Invitation", description: "EHCP annual review or SEN support meeting invitation.", category: "Letter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "lt-06", title: "End of Year Report Letter", description: "Cover letter for annual pupil reports.", category: "Letter", canvaUrl: "#", thumbnail: "/placeholder-template.png" },

  // Displays (6)
  { id: "dp-01", title: "Values Display Board", description: "School values poster set for corridors and classrooms.", category: "Display", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "dp-02", title: "British Values Display", description: "Democracy, rule of law, respect, tolerance display set.", category: "Display", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "dp-03", title: "Reading Corner Banner", description: "Inviting reading area display with book recommendations.", category: "Display", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "dp-04", title: "Attendance Tracker Display", description: "Class attendance thermometer and celebration board.", category: "Display", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "dp-05", title: "Anti-Bullying Week Display", description: "Anti-bullying awareness posters and pledge wall.", category: "Display", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "dp-06", title: "Curriculum Map Display", description: "Year group curriculum overview for classroom walls.", category: "Display", canvaUrl: "#", thumbnail: "/placeholder-template.png" },

  // Governor (6)
  { id: "gv-01", title: "Governor Visit Report", description: "Structured governor monitoring visit report template.", category: "Governor", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "gv-02", title: "Board Meeting Agenda", description: "Formal governing body meeting agenda with standing items.", category: "Governor", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "gv-03", title: "Chair's Annual Report", description: "Annual report from the chair of governors to parents.", category: "Governor", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "gv-04", title: "Governor Induction Pack", description: "New governor welcome pack with key information.", category: "Governor", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "gv-05", title: "Skills Audit Form", description: "Governor skills matrix for board composition analysis.", category: "Governor", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "gv-06", title: "Strategic Plan Summary", description: "One-page school strategic vision for governor reference.", category: "Governor", canvaUrl: "#", thumbnail: "/placeholder-template.png" },

  // Estate (6)
  { id: "es-01", title: "Fire Evacuation Poster", description: "Fire assembly point map and evacuation instructions.", category: "Estate", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "es-02", title: "COSHH Safety Sign", description: "Chemical storage hazard signage for cleaning cupboards.", category: "Estate", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "es-03", title: "Visitor Welcome Sign", description: "Reception area welcome sign with safeguarding info.", category: "Estate", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "es-04", title: "Room Booking Display", description: "Room availability and booking instructions poster.", category: "Estate", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "es-05", title: "Energy Saving Poster", description: "Eco-friendly reminders for lights, heating, and water.", category: "Estate", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
  { id: "es-06", title: "Site Safety Induction", description: "Contractor and visitor site safety rules summary.", category: "Estate", canvaUrl: "#", thumbnail: "/placeholder-template.png" },
];

const ALL_CATEGORIES: TemplateCategory[] = [
  "Newsletter",
  "Letter",
  "Display",
  "Governor",
  "Estate",
];

// ─── Page Component ──────────────────────────────────────────

export default function CanvaTemplatesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    TemplateCategory | "All"
  >("All");

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchesCategory =
        activeCategory === "All" || t.category === activeCategory;
      const matchesSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: TEMPLATES.length };
    for (const t of TEMPLATES) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/integrations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Connectors
      </Link>

      <ModulePageHeader
        moduleId="integrations"
        icon={Palette}
        label="Canva Templates"
        title="Template Library"
        description="School-branded Canva templates ready to use. Click any template to open it in Canva and customise with your school's colours and logo."
        badge={`${TEMPLATES.length} templates`}
      />

      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-8 text-white"
      >
        {/* Yarn/wool decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 200" fill="none">
            <path d="M0 100 Q50 20 100 100 T200 100 T300 100 T400 100" stroke="white" strokeWidth="2" fill="none" />
            <path d="M0 130 Q50 50 100 130 T200 130 T300 130 T400 130" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M0 70 Q50 -10 100 70 T200 70 T300 70 T400 70" stroke="white" strokeWidth="1" fill="none" />
            <circle cx="100" cy="100" r="30" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
            <circle cx="300" cy="80" r="20" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
          </svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Design like a pro, in minutes
          </h2>
          <p className="text-white/80 max-w-xl leading-relaxed">
            Every template is crafted for UK schools. Just add your logo and school
            colours in Canva — the layout, typography, and spacing are already sorted.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm">
              <Palette className="w-4 h-4" />
              {ALL_CATEGORIES.length} categories
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm">
              <FileText className="w-4 h-4" />
              {TEMPLATES.length} templates
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border w-fit">
          <button
            onClick={() => setActiveCategory("All")}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeCategory === "All"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({categoryCounts.All})
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const CatIcon = config.icon;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" />
                {cat} ({categoryCounts[cat] || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template, i) => {
            const config = CATEGORY_CONFIG[template.category];
            const CatIcon = config.icon;

            return (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                whileHover={{ y: -2 }}
                className="group cursor-pointer"
              >
                <div className="h-full rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 overflow-hidden">
                  {/* Thumbnail placeholder */}
                  <div
                    className={`h-36 ${config.bgColor} flex items-center justify-center relative overflow-hidden`}
                  >
                    {/* Decorative yarn circles */}
                    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full border-2 border-current opacity-10" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full border-2 border-current opacity-5" />
                    <CatIcon
                      className={`w-10 h-10 ${config.color} opacity-40 group-hover:opacity-60 transition-opacity`}
                    />
                  </div>

                  <div className="p-4">
                    {/* Category badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}
                      >
                        <CatIcon className="w-3 h-3" />
                        {template.category}
                      </span>
                    </div>

                    {/* Title + Description */}
                    <h3 className="text-sm font-bold text-foreground mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {template.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {template.description}
                    </p>

                    {/* Open in Canva button */}
                    <a
                      href={template.canvaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in Canva
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-foreground">
            No templates found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different search or category filter.
          </p>
        </motion.div>
      )}

      {/* Request a Template CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/20 dark:via-violet-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800 p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 bg-white dark:bg-card rounded-xl shadow-sm">
            <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-300">
              Can&apos;t find what you need?
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Request a custom template and our design team will create it with
              your school&apos;s branding. Most requests are turned around within
              48 hours.
            </p>
          </div>
          <button className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <Sparkles className="w-4 h-4" />
            Request a Template
          </button>
        </div>
      </motion.div>
    </div>
  );
}
