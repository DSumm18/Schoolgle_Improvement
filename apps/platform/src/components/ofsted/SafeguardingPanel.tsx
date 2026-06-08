"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  CheckCircle2,
  Circle,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SafeguardingStatus = "met" | "not_met" | "not_assessed";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  notes: string;
}

interface SafeguardingAssessment {
  status: SafeguardingStatus;
  items: ChecklistItem[];
  lastUpdated: string | null;
}

interface SafeguardingPanelProps {
  organizationId: string;
}

// ---------------------------------------------------------------------------
// Default checklist items aligned to the 2025 EIF framework
// ---------------------------------------------------------------------------

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "checked" | "notes">[] = [
  {
    id: "safeguarding-policy",
    label: "Safeguarding policy present, dated, references KCSIE 2025",
    description:
      "The school has a current safeguarding/child protection policy that is reviewed annually, dated, and explicitly references Keeping Children Safe in Education (KCSIE) 2025 and current Working Together guidance.",
  },
  {
    id: "scr-present",
    label: "Single Central Record (SCR) present with all required fields",
    description:
      "The SCR includes identity checks, barred list checks, DBS checks, prohibition checks, right to work, further checks for those who have lived outside the UK, and section 128 checks where applicable.",
  },
  {
    id: "dbs-dates",
    label: "DBS check dates not expired",
    description:
      "All staff, governors, and regular volunteers have valid enhanced DBS checks. Any DBS checks older than 3 years have been risk-assessed or renewed.",
  },
  {
    id: "dsl-training",
    label: "DSL training evidence present and within date (every 2 years)",
    description:
      "The Designated Safeguarding Lead (and any deputies) have completed inter-agency training within the last two years, with certificates on file.",
  },
  {
    id: "online-safety",
    label: "Online safety policy present and current",
    description:
      "The school has an up-to-date online safety / acceptable use policy that covers filtering and monitoring, and staff and pupils are aware of reporting routes.",
  },
  {
    id: "staff-training",
    label: "Staff safeguarding training records (annual KCSIE Part 1 sign-off)",
    description:
      "All staff have read and signed to confirm understanding of at least Part 1 (and Annex B where relevant) of KCSIE at the start of each academic year.",
  },
  {
    id: "whistleblowing",
    label: "Whistleblowing policy present",
    description:
      "A whistleblowing policy is in place and staff know how to raise concerns about poor or unsafe practice and potential failures in safeguarding.",
  },
  {
    id: "safer-recruitment",
    label: "Safer recruitment procedures documented",
    description:
      "At least one member of every interview panel has completed safer recruitment training. The school can evidence a consistent safer recruitment process.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveStatus(items: ChecklistItem[]): SafeguardingStatus {
  const anyChecked = items.some((i) => i.checked);
  const allChecked = items.every((i) => i.checked);
  if (allChecked) return "met";
  if (anyChecked) return "not_met";
  return "not_assessed";
}

const STATUS_CONFIG: Record<
  SafeguardingStatus,
  {
    label: string;
    gradient: string;
    border: string;
    textColor: string;
    icon: typeof ShieldCheck;
    badgeClass: string;
  }
> = {
  met: {
    label: "Met",
    gradient:
      "from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20",
    border: "border-emerald-300 dark:border-emerald-700",
    textColor: "text-emerald-700 dark:text-emerald-300",
    icon: ShieldCheck,
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  not_met: {
    label: "Not Met",
    gradient: "from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20",
    border: "border-rose-300 dark:border-rose-700",
    textColor: "text-rose-700 dark:text-rose-300",
    icon: ShieldAlert,
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
  },
  not_assessed: {
    label: "Not Assessed",
    gradient:
      "from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20",
    border: "border-slate-300 dark:border-slate-700",
    textColor: "text-slate-500 dark:text-slate-400",
    icon: ShieldQuestion,
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SafeguardingPanel({
  organizationId,
}: SafeguardingPanelProps) {
  const [items, setItems] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST.map((d) => ({ ...d, checked: false, notes: "" })),
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Derive status from checklist state
  const status = deriveStatus(items);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const checkedCount = items.filter((i) => i.checked).length;

  // -----------------------------------------------------------------------
  // Load persisted assessment
  // -----------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/ofsted/safeguarding?organizationId=${organizationId}`,
        );
        if (res.ok) {
          const data: SafeguardingAssessment = await res.json();
          if (!cancelled && data.items?.length) {
            // Merge persisted data with defaults (in case new items were added)
            const merged = DEFAULT_CHECKLIST.map((def) => {
              const saved = data.items.find((s) => s.id === def.id);
              return saved
                ? { ...def, checked: saved.checked, notes: saved.notes }
                : { ...def, checked: false, notes: "" };
            });
            setItems(merged);
            setLastSaved(data.lastUpdated);
          }
        }
      } catch {
        // Silently handle - component works offline with defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
    setDirty(true);
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item)),
    );
    setDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: SafeguardingAssessment = {
        status: deriveStatus(items),
        items,
        lastUpdated: new Date().toISOString(),
      };

      const res = await fetch("/api/ofsted/safeguarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          assessment: payload,
        }),
      });

      if (res.ok) {
        setLastSaved(payload.lastUpdated);
        setDirty(false);
      }
    } catch (error) {
      console.error("Failed to save safeguarding assessment:", error);
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span className="text-sm text-slate-500">
              Loading safeguarding assessment...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`bg-gradient-to-br ${config.gradient} ${config.border}`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  status === "met"
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : status === "not_met"
                      ? "bg-rose-100 dark:bg-rose-900/40"
                      : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <StatusIcon className={`w-7 h-7 ${config.textColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Safeguarding
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Binary assessment &mdash; all requirements must be met
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                className={`text-sm font-bold uppercase px-3 py-1 ${config.badgeClass}`}
              >
                {config.label}
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {checkedCount} of {items.length} requirements confirmed
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {Math.round((checkedCount / items.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-white/60 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  status === "met"
                    ? "bg-emerald-500"
                    : status === "not_met"
                      ? "bg-rose-500"
                      : "bg-slate-300"
                }`}
                initial={{ width: 0 }}
                animate={{
                  width: `${(checkedCount / items.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {items.map((item, idx) => {
              const isExpanded = expandedItem === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <div
                    className={`rounded-xl border transition-all ${
                      item.checked
                        ? "bg-white/80 dark:bg-slate-800/60 border-emerald-200 dark:border-emerald-800"
                        : "bg-white/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-3 p-3">
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full"
                        aria-label={`Toggle ${item.label}`}
                      >
                        {item.checked ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>

                      <span
                        className={`flex-1 text-sm font-medium ${
                          item.checked
                            ? "text-slate-700 dark:text-slate-300"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {item.label}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {item.notes && (
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedItem(isExpanded ? null : item.id)
                          }
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                          aria-label={
                            isExpanded ? "Collapse details" : "Expand details"
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-3 flex items-start gap-1.5">
                              <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                              {item.description}
                            </p>
                            <label className="block">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Notes
                              </span>
                              <textarea
                                value={item.notes}
                                onChange={(e) =>
                                  updateNotes(item.id, e.target.value)
                                }
                                placeholder="Add evidence references, dates, or observations..."
                                rows={2}
                                className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                              />
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/50">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {lastSaved ? (
                <>
                  Last saved:{" "}
                  {new Date(lastSaved).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              ) : (
                "Not yet saved"
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={`gap-2 ${
                dirty
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Assessment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
