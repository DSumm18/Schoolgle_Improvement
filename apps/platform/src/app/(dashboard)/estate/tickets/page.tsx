"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  Plus,
  Search,
  Ticket,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HelpdeskTicket,
  TicketPriority,
  TicketStatus,
} from "@/types/estates-compliance";
import { useAuth } from "@/context/SupabaseAuthContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabMode = "all" | "open" | "in_progress" | "resolved" | "closed";

const TICKET_CATEGORIES = [
  "plumbing",
  "electrical",
  "heating",
  "roofing",
  "glazing",
  "cleaning",
  "security",
  "grounds",
  "pest_control",
  "fire_safety",
  "it",
  "other",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function priorityBadgeClass(priority: TicketPriority): string {
  const map: Record<TicketPriority, string> = {
    critical: "bg-red-100 text-red-700 border border-red-200",
    high: "bg-orange-100 text-orange-700 border border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    low: "bg-green-100 text-green-700 border border-green-200",
  };
  return map[priority] ?? "bg-gray-100 text-gray-700 border border-gray-200";
}

function statusBadgeClass(status: TicketStatus): string {
  const map: Record<TicketStatus, string> = {
    open: "bg-blue-100 text-blue-700",
    assigned: "bg-indigo-100 text-indigo-700",
    in_progress: "bg-amber-100 text-amber-700",
    awaiting_parts: "bg-orange-100 text-orange-700",
    awaiting_contractor: "bg-orange-100 text-orange-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-600",
    reopened: "bg-red-100 text-red-700",
    on_hold: "bg-purple-100 text-purple-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function statusIcon(status: TicketStatus) {
  switch (status) {
    case "open":
    case "reopened":
      return <AlertCircle className="w-3.5 h-3.5" />;
    case "in_progress":
    case "assigned":
      return <Clock className="w-3.5 h-3.5" />;
    case "resolved":
    case "closed":
      return <CheckCircle className="w-3.5 h-3.5" />;
    default:
      return <Clock className="w-3.5 h-3.5" />;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function humanLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EstateTicketsPage() {
  const router = useRouter();
  const { organizationId } = useAuth();

  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>("all");
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TicketPriority,
    category: "other",
    location: "",
  });

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchTickets = useCallback(async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/estates/helpdesk?${params.toString()}`, {
        headers: { "x-organization-id": organizationId },
      });
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setTickets(data.tickets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [organizationId, activeTab, priorityFilter, categoryFilter, search]);

  const fetchStats = useCallback(async () => {
    if (!organizationId) return;
    try {
      const res = await fetch("/api/estates/helpdesk/stats", {
        headers: { "x-organization-id": organizationId },
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          open: data.open ?? 0,
          inProgress: data.inProgress ?? 0,
          resolved: data.resolved ?? 0,
          closed: data.closed ?? 0,
        });
      }
    } catch {
      // non-critical
    }
  }, [organizationId]);

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  // ---------------------------------------------------------------------------
  // Create ticket
  // ---------------------------------------------------------------------------

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/estates/helpdesk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": organizationId,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          priority: form.priority,
          category: form.category,
          location: form.location,
          module: "estates",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create ticket");
      }
      toast.success("Ticket created successfully");
      setForm({
        title: "",
        description: "",
        priority: "medium",
        category: "other",
        location: "",
      });
      setShowCreateForm(false);
      fetchTickets();
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const TABS: { key: TabMode; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/estate" className="hover:text-[#9F1239] transition-colors font-medium">
          Estate
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Tickets &amp; Issues</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets &amp; Issues</h1>
          <p className="text-sm text-gray-500 mt-1">
            Report and track maintenance requests, faults, and repairs
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm((v) => !v)}
          className="gap-2 bg-[#9F1239] hover:bg-[#881030] text-white"
        >
          {showCreateForm ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Create Ticket
            </>
          )}
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open", value: stats.open, color: "text-blue-700 bg-blue-50 border-blue-200" },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-700 bg-amber-50 border-amber-200" },
          { label: "Resolved", value: stats.resolved, color: "text-green-700 bg-green-50 border-green-200" },
          { label: "Closed", value: stats.closed, color: "text-gray-600 bg-gray-50 border-gray-200" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-lg border px-4 py-3 text-center ${s.color}`}
          >
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create ticket form */}
      {showCreateForm && (
        <Card className="border-[#9F1239]/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#9F1239]">New Ticket</CardTitle>
            <CardDescription>Describe the issue and set its priority</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Leaking tap in Year 3 toilets"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide more detail about the issue..."
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value as TicketPriority })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  >
                    {TICKET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {humanLabel(c)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Block A, Room 12"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#9F1239] hover:bg-[#881030] text-white gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Ticket
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center bg-gray-50 border border-gray-200 rounded-lg p-3">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | "")}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
        >
          <option value="">All Categories</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {humanLabel(c)}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchTickets}
          className="border-[#9F1239] text-[#9F1239] hover:bg-[#9F1239]/5"
        >
          Apply
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0.5 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#9F1239] text-[#9F1239]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading tickets...</span>
        </div>
      ) : error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={fetchTickets}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-14 text-center">
          <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tickets found</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeTab === "all"
              ? "Create a ticket to report an issue."
              : `No ${humanLabel(activeTab)} tickets.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/estate/tickets/${ticket.id}`}
              className="block group"
            >
              <Card className="hover:border-[#9F1239]/40 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">
                          {ticket.ticket_number}
                        </span>
                        <Badge
                          className={`text-xs px-2 py-0.5 gap-1 ${statusBadgeClass(ticket.status)}`}
                        >
                          {statusIcon(ticket.status)}
                          {humanLabel(ticket.status)}
                        </Badge>
                        <Badge
                          className={`text-xs px-2 py-0.5 font-semibold ${priorityBadgeClass(ticket.priority)}`}
                        >
                          {humanLabel(ticket.priority)}
                        </Badge>
                      </div>
                      <p className="font-semibold text-gray-900 group-hover:text-[#9F1239] transition-colors">
                        {ticket.title}
                      </p>
                      {ticket.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                          {ticket.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        {ticket.category && (
                          <span>{humanLabel(ticket.category)}</span>
                        )}
                        {ticket.assigned_to && (
                          <span>Assigned: {ticket.assigned_to}</span>
                        )}
                        <span>{formatDate(ticket.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
