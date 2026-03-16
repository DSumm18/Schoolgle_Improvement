"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  Plus,
  ChevronRight,
  Users,
  Shield,
  Crown,
  Building2,
  GraduationCap,
  Heart,
  PoundSterling,
  Loader2,
  Mail,
  ClipboardList,
  Award,
  Newspaper,
  StickyNote,
  ScrollText,
  FileCheck,
  BookOpen,
} from "lucide-react";
import type {
  DocumentTemplate,
  DocumentModule,
  DocumentType,
} from "@/lib/document-engine/types";
import { MODULE_CONFIG } from "@/lib/document-engine/types";

interface TemplateBrowserProps {
  organizationId: string;
  module?: string;
  onSelect: (template: DocumentTemplate) => void;
  onCreateNew?: () => void;
}

const MODULE_ICONS: Record<
  DocumentModule,
  React.ComponentType<{
    size?: number;
    className?: string;
    style?: React.CSSProperties;
  }>
> = {
  hr: Users,
  compliance: Shield,
  governance: Crown,
  estates: Building2,
  teaching_learning: GraduationCap,
  send: Heart,
  finance: PoundSterling,
  general: FileText,
};

const DOC_TYPE_ICONS: Record<
  DocumentType,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  letter: Mail,
  notice: StickyNote,
  report: ClipboardList,
  certificate: Award,
  newsletter: Newspaper,
  minutes: ScrollText,
  memo: StickyNote,
  form: FileCheck,
  invitation: BookOpen,
  policy_extract: FileText,
};

const ALL_MODULES: DocumentModule[] = [
  "hr",
  "compliance",
  "governance",
  "estates",
  "teaching_learning",
  "send",
  "finance",
  "general",
];

export function TemplateBrowser({
  organizationId,
  module: initialModule,
  onSelect,
  onCreateNew,
}: TemplateBrowserProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<DocumentModule | "all">(
    (initialModule as DocumentModule) || "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);

    const url = new URL("/api/documents/templates", window.location.origin);
    url.searchParams.set("organizationId", organizationId);

    fetch(url.toString())
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load templates");
        return res.json();
      })
      .then((data) => {
        setTemplates(data.templates || data.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch templates:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [organizationId]);

  const moduleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      counts[t.module] = (counts[t.module] || 0) + 1;
    });
    return counts;
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (selectedModule !== "all") {
      result = result.filter((t) => t.module === selectedModule);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q),
      );
    }

    return result;
  }, [templates, selectedModule, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Module Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setSelectedModule("all")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            selectedModule === "all"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          All
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs ${
              selectedModule === "all"
                ? "bg-blue-500/30 text-blue-100"
                : "bg-slate-700 text-slate-500"
            }`}
          >
            {templates.length}
          </span>
        </button>

        {ALL_MODULES.map((mod) => {
          const config = MODULE_CONFIG[mod];
          const Icon = MODULE_ICONS[mod];
          const count = moduleCounts[mod] || 0;
          const isActive = selectedModule === mod;

          return (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon
                size={14}
                className="shrink-0"
                style={{ color: isActive ? config.color : undefined }}
              />
              {config.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  isActive
                    ? "bg-slate-600 text-slate-200"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 size={24} className="mb-3 animate-spin" />
          <p className="text-sm">Loading templates...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-300 underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FileText size={32} className="mb-3 opacity-50" />
          <p className="text-sm font-medium text-slate-300">
            No templates found
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery
              ? "Try a different search term"
              : "No templates available for this module"}
          </p>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              Create Template
            </button>
          )}
        </div>
      )}

      {/* Template Grid */}
      {!loading && !error && filteredTemplates.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedModule + searchQuery}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredTemplates.map((template) => {
              const modConfig = MODULE_CONFIG[template.module];
              const DocIcon =
                DOC_TYPE_ICONS[template.document_type] || FileText;

              return (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className="group relative rounded-2xl border border-slate-700 bg-slate-800/50 p-5 text-left transition-all hover:border-slate-600 hover:bg-slate-800 hover:shadow-lg hover:shadow-black/20"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${modConfig.color}15`,
                        color: modConfig.color,
                      }}
                    >
                      <DocIcon size={18} />
                    </div>
                    <ChevronRight
                      size={14}
                      className="mt-1 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>

                  <h3 className="mb-1 text-sm font-bold text-slate-100 line-clamp-1">
                    {template.name}
                  </h3>

                  {template.description && (
                    <p className="mb-3 text-xs text-slate-400 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${modConfig.color}15`,
                        color: modConfig.color,
                      }}
                    >
                      {template.category.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {template.document_type.replace(/_/g, " ")}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Create New Card */}
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-5 text-center transition-all hover:border-slate-500 hover:bg-slate-900/50"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                  <Plus size={18} />
                </div>
                <span className="text-sm font-bold text-slate-300">
                  Create new template
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  Start from scratch
                </span>
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
