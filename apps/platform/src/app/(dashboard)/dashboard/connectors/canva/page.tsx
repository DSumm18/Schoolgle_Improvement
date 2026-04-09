"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Palette, Search, ExternalLink, ArrowLeft, Filter,
  FileText, Newspaper, Image, Users, Building2,
  Mail, Sparkles, ChevronRight,
} from "lucide-react";

type TemplateCategory = "newsletter" | "letter" | "display" | "governor" | "estates";

interface CanvaTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  canvaUrl: string;
  thumbnailUrl?: string;
  isNew?: boolean;
}

const CATEGORY_CONFIG: Record<TemplateCategory, { label: string; icon: React.ReactNode; color: string; count?: number }> = {
  newsletter: { label: "Newsletters", icon: <Newspaper className="w-4 h-4" />, color: "#7D2AE8" },
  letter: { label: "Letters", icon: <FileText className="w-4 h-4" />, color: "#3B82F6" },
  display: { label: "Displays & Posters", icon: <Image className="w-4 h-4" />, color: "#F59E0B" },
  governor: { label: "Governor & Admin", icon: <Users className="w-4 h-4" />, color: "#10B981" },
  estates: { label: "Estates", icon: <Building2 className="w-4 h-4" />, color: "#EF4444" },
};

// Template library — add real Canva share links as they're created
const TEMPLATES: CanvaTemplate[] = [
  // Newsletters (6)
  {
    id: "nl-weekly",
    name: "Weekly Parent Newsletter",
    description: "Clean, modern A4 newsletter for weekly parent updates. Includes sections for news, dates, and celebrations.",
    category: "newsletter",
    canvaUrl: "",
    isNew: true,
  },
  {
    id: "nl-halfterm",
    name: "Half-Term Roundup",
    description: "Summarise the half term's achievements, events, and key dates for the next half term.",
    category: "newsletter",
    canvaUrl: "",
  },
  {
    id: "nl-endofyear",
    name: "End of Year Newsletter",
    description: "Celebrate the year's achievements with photos, stats, and farewell messages.",
    category: "newsletter",
    canvaUrl: "",
  },
  {
    id: "nl-send",
    name: "SEND Information Newsletter",
    description: "Inform parents about SEND provision, upcoming reviews, and support available.",
    category: "newsletter",
    canvaUrl: "",
  },
  {
    id: "nl-curriculum",
    name: "Curriculum Update",
    description: "Share curriculum news, topic overviews, and home learning suggestions by year group.",
    category: "newsletter",
    canvaUrl: "",
  },
  {
    id: "nl-welcome",
    name: "Welcome Back Newsletter",
    description: "New term welcome with staffing updates, uniform reminders, and key dates.",
    category: "newsletter",
    canvaUrl: "",
    isNew: true,
  },

  // Letters (6)
  {
    id: "lt-general",
    name: "General Parent Letter",
    description: "School letterhead template for any parent communication. Professional, clean layout.",
    category: "letter",
    canvaUrl: "",
    isNew: true,
  },
  {
    id: "lt-trip",
    name: "Trip Permission Slip",
    description: "Permission letter with tear-off reply slip. Includes medical info and emergency contact fields.",
    category: "letter",
    canvaUrl: "",
  },
  {
    id: "lt-absence",
    name: "Absence Follow-Up Letter",
    description: "Formal letter template for absence concerns. Meets DfE attendance guidance requirements.",
    category: "letter",
    canvaUrl: "",
  },
  {
    id: "lt-send-review",
    name: "SEND Review Invitation",
    description: "Invite parents to SEND review meetings. Warm, supportive tone with practical details.",
    category: "letter",
    canvaUrl: "",
  },
  {
    id: "lt-governor",
    name: "Governor Appointment Letter",
    description: "Formal appointment letter for new governors with role summary and next steps.",
    category: "letter",
    canvaUrl: "",
  },
  {
    id: "lt-report-cover",
    name: "End of Year Report Cover",
    description: "Cover letter to accompany annual pupil reports. Space for head teacher message.",
    category: "letter",
    canvaUrl: "",
  },

  // Displays & Posters (8)
  {
    id: "dp-safeguarding",
    name: "Safeguarding Display Board",
    description: "A3 safeguarding information display with DSL contacts, reporting procedures, and key numbers.",
    category: "display",
    canvaUrl: "",
    isNew: true,
  },
  {
    id: "dp-british-values",
    name: "British Values Display",
    description: "Colourful display of the 5 British Values with child-friendly explanations.",
    category: "display",
    canvaUrl: "",
  },
  {
    id: "dp-vision",
    name: "School Vision & Values",
    description: "Showcase your school's vision statement and core values. Editable colours and text.",
    category: "display",
    canvaUrl: "",
  },
  {
    id: "dp-antibullying",
    name: "Anti-Bullying Week Poster",
    description: "Eye-catching poster for Anti-Bullying Week with key messages and reporting guidance.",
    category: "display",
    canvaUrl: "",
  },
  {
    id: "dp-reading",
    name: "Reading Corner Display",
    description: "Inviting reading corner display with book recommendations and reading challenge tracker.",
    category: "display",
    canvaUrl: "",
  },
  {
    id: "dp-open-evening",
    name: "Open Evening Poster",
    description: "Professional poster to advertise school open evenings. Date, time, and key selling points.",
    category: "display",
    canvaUrl: "",
  },
  {
    id: "dp-sports",
    name: "Sports Day Poster",
    description: "Fun, energetic sports day poster with event schedule and team information.",
    category: "display",
    canvaUrl: "",
  },
  {
    id: "dp-stem",
    name: "STEM Week Poster",
    description: "Science, technology, engineering and maths week promotional poster.",
    category: "display",
    canvaUrl: "",
  },

  // Governor & Admin (5)
  {
    id: "gv-agenda",
    name: "Governor Meeting Agenda",
    description: "Professional meeting agenda template with standing items, timing, and action tracking.",
    category: "governor",
    canvaUrl: "",
    isNew: true,
  },
  {
    id: "gv-head-report",
    name: "Headteacher Report to Governors",
    description: "Structured report template covering all key areas governors need to scrutinise.",
    category: "governor",
    canvaUrl: "",
  },
  {
    id: "gv-visit",
    name: "Governor Visit Report",
    description: "Record governor monitoring visits with focus area, findings, and recommendations.",
    category: "governor",
    canvaUrl: "",
  },
  {
    id: "gv-statement",
    name: "Annual Governance Statement",
    description: "DfE-compliant annual governance statement template for your school website.",
    category: "governor",
    canvaUrl: "",
  },
  {
    id: "gv-skills",
    name: "Skills Audit Form",
    description: "Governor skills audit matrix covering finance, education, HR, legal, and safeguarding.",
    category: "governor",
    canvaUrl: "",
  },

  // Estates (5)
  {
    id: "es-fire",
    name: "Fire Evacuation Notice",
    description: "Clear fire evacuation procedure notice with assembly point details and emergency numbers.",
    category: "estates",
    canvaUrl: "",
    isNew: true,
  },
  {
    id: "es-hs",
    name: "H&S Information Poster",
    description: "Health and safety information poster with first aiders, fire marshals, and reporting procedures.",
    category: "estates",
    canvaUrl: "",
  },
  {
    id: "es-visitor",
    name: "Visitor Sign-In Notice",
    description: "Reception notice for visitors covering DBS, safeguarding, and emergency procedures.",
    category: "estates",
    canvaUrl: "",
  },
  {
    id: "es-firstaid",
    name: "First Aid Information Poster",
    description: "First aid poster with trained staff, kit locations, and emergency procedures.",
    category: "estates",
    canvaUrl: "",
  },
  {
    id: "es-rules",
    name: "Site Rules Poster",
    description: "Site rules and expectations for contractors, visitors, and deliveries.",
    category: "estates",
    canvaUrl: "",
  },
];

export default function CanvaConnectorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: TEMPLATES.length };
    TEMPLATES.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, []);

  const handleOpenTemplate = (template: CanvaTemplate) => {
    if (template.canvaUrl) {
      window.open(template.canvaUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/connectors"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Connectors
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#7D2AE8]/10 via-[#7D2AE8]/5 to-transparent border border-[#7D2AE8]/20 rounded-2xl p-6 md:p-8"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#7D2AE8] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#7D2AE8]/20">
              <Palette className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Canva Templates for Schools</h1>
              <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                Free, professionally designed templates built for UK schools. One click opens in your Canva account, ready to customise with your school&apos;s branding.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm shrink-0">
            <div className="text-center px-4 py-2 bg-card/80 rounded-xl border border-border">
              <div className="font-black text-lg text-[#7D2AE8]">{TEMPLATES.length}</div>
              <div className="text-[10px] text-muted-foreground font-medium">Templates</div>
            </div>
            <div className="text-center px-4 py-2 bg-card/80 rounded-xl border border-border">
              <div className="font-black text-lg text-[#7D2AE8]">{Object.keys(CATEGORY_CONFIG).length}</div>
              <div className="text-[10px] text-muted-foreground font-medium">Categories</div>
            </div>
            <div className="text-center px-4 py-2 bg-card/80 rounded-xl border border-border">
              <div className="font-black text-lg text-emerald-600">Free</div>
              <div className="text-[10px] text-muted-foreground font-medium">Always</div>
            </div>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#7D2AE8]/5 rounded-full blur-2xl" />
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#7D2AE8]/10 rounded-full blur-xl" />
      </motion.div>

      {/* Search & Category Filter */}
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
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-[#7D2AE8]/20"
          />
        </div>
      </motion.div>

      {/* Category Pills */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex flex-wrap gap-2"
      >
        <button
          onClick={() => setCategoryFilter("all")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            categoryFilter === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({categoryCounts.all})
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [TemplateCategory, typeof CATEGORY_CONFIG[TemplateCategory]][]).map(
          ([key, config]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                categoryFilter === key
                  ? "text-white border-transparent"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
              style={categoryFilter === key ? { backgroundColor: config.color } : undefined}
            >
              {config.icon}
              {config.label} ({categoryCounts[key] || 0})
            </button>
          )
        )}
      </motion.div>

      {/* Template Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template, idx) => {
            const catConfig = CATEGORY_CONFIG[template.category];
            const hasLink = !!template.canvaUrl;

            return (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.02 }}
                className={`group relative bg-card border border-border rounded-2xl overflow-hidden transition-all ${
                  hasLink ? "hover:shadow-lg hover:border-[#7D2AE8]/30 cursor-pointer" : ""
                }`}
                onClick={() => hasLink && handleOpenTemplate(template)}
              >
                {/* Thumbnail Placeholder */}
                <div
                  className="h-36 flex items-center justify-center relative"
                  style={{ backgroundColor: `${catConfig.color}08` }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center opacity-20"
                    style={{ backgroundColor: catConfig.color }}
                  >
                    <span className="text-white text-2xl">{catConfig.icon}</span>
                  </div>

                  {/* New Badge */}
                  {template.isNew && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#7D2AE8] text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      NEW
                    </span>
                  )}

                  {/* Category Tag */}
                  <span
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: catConfig.color }}
                  >
                    {catConfig.label}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1 group-hover:text-[#7D2AE8] transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {hasLink ? (
                      <span className="text-xs font-semibold text-[#7D2AE8] flex items-center gap-1 group-hover:gap-2 transition-all">
                        Open in Canva
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">
                        Template link coming soon
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No templates match your search.</p>
        </div>
      )}

      {/* Request CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-[#7D2AE8]/5 to-[#7D2AE8]/10 border border-[#7D2AE8]/20 rounded-2xl p-6 text-center"
      >
        <h3 className="font-bold text-sm mb-1">Need a template we don&apos;t have?</h3>
        <p className="text-xs text-muted-foreground mb-3 max-w-md mx-auto">
          Tell us what template your school needs and we&apos;ll design it. All templates are free forever.
        </p>
        <a
          href="mailto:hello@schoolgle.co.uk?subject=Template%20Request"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7D2AE8] text-white rounded-lg text-xs font-semibold hover:bg-[#7D2AE8]/90 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          Request a Template
        </a>
      </motion.div>
    </div>
  );
}
