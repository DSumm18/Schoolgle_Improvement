"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Send,
  FileText,
  Loader2,
  AlertCircle,
  ChevronDown,
  Settings,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";

interface TriggerRule {
  id: string;
  trigger_event: string;
  trigger_conditions: Record<string, any>;
  auto_generate: boolean;
  auto_send: boolean;
  is_active: boolean;
  notify_users: string[];
  last_triggered_at: string | null;
  created_at: string;
  document_templates?: {
    id: string;
    name: string;
    module: string;
    category: string;
    document_type: string;
  };
}

interface AvailableEvent {
  key: string;
  event: string;
  module: string;
  label: string;
}

const MODULE_COLORS: Record<string, string> = {
  sickness: "bg-blue-500/20 text-blue-400",
  meeting: "bg-purple-500/20 text-purple-400",
  estates: "bg-cyan-500/20 text-cyan-400",
  compliance: "bg-violet-500/20 text-violet-400",
  governance: "bg-amber-500/20 text-amber-400",
  staff: "bg-green-500/20 text-green-400",
};

export default function TriggersPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [rules, setRules] = useState<TriggerRule[]>([]);
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const [newEvent, setNewEvent] = useState("");
  const [newTemplateId, setNewTemplateId] = useState("");
  const [newAutoSend, setNewAutoSend] = useState(false);
  const [newConditions, setNewConditions] = useState("{}");

  useEffect(() => {
    if (!organizationId) return;
    Promise.all([
      fetch(`/api/documents/triggers?organizationId=${organizationId}`).then(
        (r) => r.json(),
      ),
      fetch(`/api/documents/templates?organizationId=${organizationId}`).then(
        (r) => r.json(),
      ),
    ])
      .then(([triggerData, templateData]) => {
        setRules(triggerData.rules || []);
        setAvailableEvents(triggerData.available_events || []);
        const tpls = Array.isArray(templateData)
          ? templateData
          : templateData.templates || templateData.data || [];
        setTemplates(tpls);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId]);

  const handleCreate = async () => {
    if (!newEvent || !newTemplateId) return;
    setSaving(true);

    let parsedConditions = {};
    try {
      parsedConditions = JSON.parse(newConditions);
    } catch {
      parsedConditions = {};
    }

    try {
      const res = await fetch("/api/documents/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          templateId: newTemplateId,
          triggerEvent: newEvent,
          triggerConditions: parsedConditions,
          autoSend: newAutoSend,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRules((prev) => [data, ...prev]);
        setShowCreate(false);
        setNewEvent("");
        setNewTemplateId("");
        setNewAutoSend(false);
        setNewConditions("{}");
      }
    } catch (err) {
      console.error("Failed to create trigger:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (ruleId: string, isActive: boolean) => {
    try {
      await fetch(`/api/documents/triggers/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, isActive: !isActive }),
      });
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, is_active: !isActive } : r)),
      );
    } catch (err) {
      console.error("Failed to toggle trigger:", err);
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await fetch(
        `/api/documents/triggers/${ruleId}?organizationId=${organizationId}`,
        {
          method: "DELETE",
        },
      );
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err) {
      console.error("Failed to delete trigger:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 size={18} className="animate-spin" />
        Loading triggers...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen max-w-[900px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap size={24} className="text-amber-400" />
              Document Triggers
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Auto-generate documents when events occur across the platform
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl gap-2"
        >
          <Plus size={16} />
          New Trigger
        </Button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-amber-500/30 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Create Trigger Rule
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Trigger Event *
                </label>
                <select
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <option value="">Select event...</option>
                  {availableEvents.map((ev) => (
                    <option key={ev.event} value={ev.event}>
                      [{ev.module}] {ev.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Document Template *
                </label>
                <select
                  value={newTemplateId}
                  onChange={(e) => setNewTemplateId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <option value="">Select template...</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      [{t.module}] {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                Conditions (JSON) — optional
              </label>
              <textarea
                value={newConditions}
                onChange={(e) => setNewConditions(e.target.value)}
                rows={2}
                placeholder='e.g. {"trigger_level": {"in": ["stage_1", "stage_2", "stage_3"]}}'
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Filter when the trigger fires. Supports: equals, gte, lte, in,
                not_equals, exists
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAutoSend}
                  onChange={(e) => setNewAutoSend(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Auto-send via email
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowCreate(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newEvent || !newTemplateId || saving}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Zap size={14} />
                )}
                Create Trigger
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested triggers */}
      {rules.length === 0 && !showCreate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800/30"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Suggested Triggers
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Set up these common automation rules to save time:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                event: "Bradford Factor Threshold",
                desc: "Auto-generate formal warning letter when Bradford score reaches Stage 1/2/3",
                icon: <AlertCircle size={16} className="text-red-400" />,
              },
              {
                event: "Return to Work",
                desc: "Auto-create RTW meeting letter when staff absence ends",
                icon: <FileText size={16} className="text-green-400" />,
              },
              {
                event: "Meeting Completed",
                desc: "Auto-draft follow-up letter after any HR meeting",
                icon: <FileText size={16} className="text-purple-400" />,
              },
              {
                event: "Contractor Certificate Expiry",
                desc: "Send reminder to contractor 30 days before certificate expires",
                icon: <Bell size={16} className="text-cyan-400" />,
              },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-amber-200/50 dark:border-slate-700"
              >
                <div className="flex items-center gap-2 mb-1">
                  {s.icon}
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {s.event}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Rules list */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border transition-all ${
              rule.is_active
                ? "border-slate-200 dark:border-slate-700"
                : "border-slate-200/50 dark:border-slate-700/50 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Zap
                    size={14}
                    className={
                      rule.is_active ? "text-amber-400" : "text-slate-400"
                    }
                  />
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      MODULE_COLORS[rule.trigger_event.split(".")[0]] ||
                      "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {rule.trigger_event}
                  </span>
                  {rule.auto_send && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400">
                      <Send size={8} className="inline mr-1" />
                      Auto-send
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {rule.document_templates?.name || "Unknown template"}
                </p>

                {Object.keys(rule.trigger_conditions).length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                    Conditions: {JSON.stringify(rule.trigger_conditions)}
                  </p>
                )}

                {rule.last_triggered_at && (
                  <p className="text-xs text-slate-400 mt-1">
                    Last triggered:{" "}
                    {new Date(rule.last_triggered_at).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(rule.id, rule.is_active)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title={rule.is_active ? "Disable" : "Enable"}
                >
                  {rule.is_active ? (
                    <ToggleRight size={20} className="text-green-400" />
                  ) : (
                    <ToggleLeft size={20} className="text-slate-400" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {rules.length === 0 && !showCreate && (
        <p className="text-center text-sm text-slate-400 py-8">
          No trigger rules configured yet. Click &quot;New Trigger&quot; to get
          started.
        </p>
      )}
    </div>
  );
}
