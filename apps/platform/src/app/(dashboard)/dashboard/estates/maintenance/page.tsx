"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import { supabase } from "@/lib/supabase";
import {
  Hammer,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  X,
  Loader2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Camera,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ModulePageHeader,
  getModuleColors,
} from "@/components/ui/module-page-header";

// ─── Constants ───────────────────────────────────────────

const CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "heating", label: "Heating / Boiler" },
  { value: "structural", label: "Structural / Building" },
  { value: "fire_alarm", label: "Fire Alarm" },
  { value: "fire_equipment", label: "Fire Equipment" },
  { value: "emergency_lighting", label: "Emergency Lighting" },
  { value: "security", label: "Security" },
  { value: "playground", label: "Playground" },
  { value: "cleaning", label: "Cleaning / Biohazard" },
  { value: "lifts", label: "Lifts" },
  { value: "gas", label: "Gas" },
  { value: "roofing", label: "Roofing" },
  { value: "general", label: "General / Other" },
];

const PRIORITY_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  critical: { bg: "bg-[#d32f2f]", text: "text-white", label: "Critical" },
  high: { bg: "bg-[#f57c00]", text: "text-white", label: "High" },
  medium: { bg: "bg-[#fbc02d]", text: "text-[#3e2723]", label: "Medium" },
  low: { bg: "bg-[#4caf50]", text: "text-white", label: "Low" },
};

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  open: {
    bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    label: "Open",
  },
  assigned: {
    bg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    label: "Assigned",
  },
  in_progress: {
    bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    label: "In Progress",
  },
  awaiting_parts: {
    bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    label: "Awaiting Parts",
  },
  awaiting_contractor: {
    bg: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    label: "Awaiting Contractor",
  },
  on_hold: {
    bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    label: "On Hold",
  },
  resolved: {
    bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    label: "Resolved",
  },
  closed: {
    bg: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    label: "Closed",
  },
  reopened: {
    bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    label: "Reopened",
  },
};

const RISK_BAND_COLORS: Record<string, string> = {
  critical: "bg-[#d32f2f] text-white",
  high: "bg-[#f57c00] text-white",
  medium: "bg-[#fbc02d] text-[#3e2723]",
  low: "bg-[#4caf50] text-white",
};

// ─── Helpers ─────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── New Ticket Modal ────────────────────────────────────

interface RiskAssessment {
  likelihood: number;
  impact: number;
  score: number;
  risk_band: string;
  risk_categories: string[];
  reasoning: string;
  suggested_mitigations: string[];
}

function NewTicketModal({
  organizationId,
  onClose,
  onCreated,
}: {
  organizationId: string;
  onClose: () => void;
  onCreated: (ticketId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // AI risk assessment state
  const [assessing, setAssessing] = useState(false);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [assessDebounce, setAssessDebounce] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Trigger AI assessment when title + description are filled
  useEffect(() => {
    if (assessDebounce) clearTimeout(assessDebounce);
    if (title.length < 5 || description.length < 10) {
      setAssessment(null);
      return;
    }
    const timer = setTimeout(async () => {
      setAssessing(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/estates/helpdesk/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            organizationId,
            title,
            description,
            category,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAssessment(data.assessment);
        }
      } catch {
        // Silent fail — assessment is optional
      } finally {
        setAssessing(false);
      }
    }, 1500);
    setAssessDebounce(timer);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const headers = await getAuthHeaders();

      // 1. Create the ticket
      const ticketRes = await fetch("/api/estates/helpdesk", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          organizationId,
          title: title.trim(),
          description: description.trim(),
          category,
          priority:
            assessment?.risk_band === "critical"
              ? "critical"
              : assessment?.risk_band === "high"
                ? "high"
                : assessment?.risk_band === "medium"
                  ? "medium"
                  : "medium",
          module: "estates",
          location_id: location || undefined,
        }),
      });

      if (!ticketRes.ok) {
        const err = await ticketRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create ticket");
      }

      const ticket = await ticketRes.json();
      const ticketId = ticket.id;

      // 2. Trigger AI risk assessment (async, don't block)
      if (ticketId) {
        fetch(`/api/estates/helpdesk/${ticketId}/risk`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ organizationId }),
        }).catch(() => {});
      }

      onCreated(ticketId);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const labelCls =
    "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-[10vh] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Report an Issue</h2>
                <p className="text-xs text-muted-foreground">
                  Raise a helpdesk ticket for the estates team
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className={labelCls}>What&apos;s the issue?</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fence blown down in playground"
                className={inputCls}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Describe the problem</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? Where exactly? Is anyone at risk?"
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className={labelCls}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className={labelCls}>Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. East playground, Year 3"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* AI Risk Assessment Preview */}
            <AnimatePresence mode="wait">
              {assessing && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30"
                >
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    AI assessing risk...
                  </span>
                </motion.div>
              )}

              {!assessing && assessment && (
                <motion.div
                  key="assessment"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  <div className="px-4 py-3 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        AI Risk Assessment
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${RISK_BAND_COLORS[assessment.risk_band] || "bg-muted"}`}
                      >
                        {assessment.risk_band.toUpperCase()} ({assessment.score}
                        )
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm">{assessment.reasoning}</p>

                    {/* Mini 5x5 indicator */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Likelihood:{" "}
                        <strong className="text-foreground">
                          {assessment.likelihood}/5
                        </strong>
                      </span>
                      <span>&times;</span>
                      <span>
                        Impact:{" "}
                        <strong className="text-foreground">
                          {assessment.impact}/5
                        </strong>
                      </span>
                      <span>=</span>
                      <span className="font-bold text-foreground">
                        {assessment.score}
                      </span>
                    </div>

                    {/* Suggested mitigations */}
                    {assessment.suggested_mitigations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                          Suggested Actions:
                        </p>
                        <ul className="space-y-1">
                          {assessment.suggested_mitigations.map((m, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Raise Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function MaintenancePage() {
  const { organization, organizationId } = useAuth();
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const colors = getModuleColors("estates");

  // Fetch tickets
  const ticketUrl = organizationId
    ? `/api/estates/helpdesk?organizationId=${organizationId}&pageSize=50`
    : null;
  const { data: ticketData, mutate: mutateTickets } = useSWR(
    ticketUrl,
    fetcher,
    {
      refreshInterval: 30000,
    },
  );

  // Fetch stats
  const statsUrl = organizationId
    ? `/api/estates/helpdesk/stats?organizationId=${organizationId}`
    : null;
  const { data: statsData, mutate: mutateStats } = useSWR(statsUrl, fetcher);

  const tickets = ticketData?.tickets || [];
  const stats = statsData || {
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };

  // Filter tickets
  const filteredTickets = tickets.filter((t: any) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.title?.toLowerCase().includes(q) &&
        !t.ticket_number?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const handleTicketCreated = (ticketId: string) => {
    setShowNewTicket(false);
    mutateTickets();
    mutateStats();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="estates"
        icon={Hammer}
        label="Estates Management"
        title="Maintenance & Helpdesk"
        description="Report issues, track repairs, and manage maintenance requests."
        actions={
          <Button
            onClick={() => setShowNewTicket(true)}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4" />
            Report Issue
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Open",
            value: stats.open,
            icon: AlertCircle,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/10",
            filter: "open",
          },
          {
            label: "In Progress",
            value: stats.in_progress || stats.inProgress || 0,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-900/10",
            filter: "in_progress",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/10",
            filter: "resolved",
          },
          {
            label: "Total",
            value: stats.total,
            icon: Hammer,
            color: colors.iconText,
            bg: colors.iconBg,
            filter: "",
          },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() =>
              setStatusFilter(s.filter === statusFilter ? "" : s.filter)
            }
            className={`text-left ${statusFilter === s.filter ? "ring-2 ring-primary" : ""}`}
          >
            <Card className="h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 ${s.bg} rounded-xl`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Ticket List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Helpdesk Tickets</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div
                className={`w-14 h-14 rounded-2xl ${colors.iconBg} flex items-center justify-center mb-4`}
              >
                <Hammer className={`w-7 h-7 ${colors.iconText}`} />
              </div>
              <p className="font-semibold text-foreground mb-1">
                {tickets.length === 0
                  ? "No tickets yet"
                  : "No matching tickets"}
              </p>
              <p className="text-muted-foreground text-sm max-w-sm mb-4">
                {tickets.length === 0
                  ? "Report an issue to create the first helpdesk ticket."
                  : "Try adjusting your search or filters."}
              </p>
              {tickets.length === 0 && (
                <Button
                  onClick={() => setShowNewTicket(true)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                  Report First Issue
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTickets.map((ticket: any) => {
                const priority =
                  PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.medium;
                const status =
                  STATUS_STYLES[ticket.status] || STATUS_STYLES.open;
                return (
                  <Link
                    key={ticket.id}
                    href={`/estates-compliance/helpdesk/${ticket.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Priority indicator */}
                    <div
                      className={`w-2 h-10 rounded-full ${priority.bg} shrink-0`}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono font-bold text-muted-foreground">
                          {ticket.ticket_number}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.bg}`}
                        >
                          {status.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${priority.bg} ${priority.text}`}
                        >
                          {priority.label}
                        </span>
                      </div>
                      <p className="font-semibold text-sm truncate text-foreground">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ticket.category && (
                          <span className="capitalize">
                            {ticket.category.replace(/_/g, " ")}
                          </span>
                        )}
                        {ticket.created_at && (
                          <span> &middot; {timeAgo(ticket.created_at)}</span>
                        )}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewTicket && organizationId && (
          <NewTicketModal
            organizationId={organizationId}
            onClose={() => setShowNewTicket(false)}
            onCreated={handleTicketCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
