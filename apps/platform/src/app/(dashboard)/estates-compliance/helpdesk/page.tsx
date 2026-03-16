"use client";

/**
 * Helpdesk Page
 *
 * Track and manage facilities issues, maintenance requests, and repairs.
 * Features filtering, sorting, and status tracking.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HelpdeskTicket,
  TicketStatus,
  TicketPriority,
} from "@/types/estates-compliance";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  ArrowUpDown,
  Filter,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
} from "lucide-react";

type TabMode = "all" | "open" | "in_progress" | "resolved" | "closed";
type SortField = "created_at" | "priority" | "status" | "ticket_number";
type SortOrder = "asc" | "desc";

export default function HelpdeskPage() {
  const { organizationId } = useAuth();
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>("all");
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filters, setFilters] = useState({
    priority: "" as TicketPriority | "",
    category: "",
    search: "",
  });

  useEffect(() => {
    if (organizationId) {
      fetchTickets();
      fetchStats();
    }
  }, [activeTab, organizationId]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (activeTab === "open") filters.status = "open";
      if (activeTab === "in_progress") filters.status = "in_progress";
      if (activeTab === "resolved") filters.status = "resolved";
      if (activeTab === "closed") filters.status = "closed";
      if (filters.priority) filters.priority = filters.priority;

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });

      const response = await fetch(
        `/api/estates/helpdesk?${params.toString()}`,
        {
          headers: {
            "x-organization-id": organizationId || "",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      const data = await response.json();
      let tickets = data.tickets || [];
      tickets = sortTickets(tickets);
      tickets = filterTickets(tickets);
      setTickets(tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/estates/helpdesk/stats", {
        headers: {
          "x-organization-id": organizationId || "",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch ticket stats:", err);
    }
  };

  const sortTickets = (tickets: HelpdeskTicket[]) => {
    return [...tickets].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "created_at":
          comparison =
            new Date(a.created_at || "").getTime() -
            new Date(b.created_at || "").getTime();
          break;
        case "priority":
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "ticket_number":
          comparison = a.ticket_number.localeCompare(b.ticket_number);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const filterTickets = (tickets: HelpdeskTicket[]) => {
    return tickets.filter((ticket) => {
      if (filters.priority && ticket.priority !== filters.priority)
        return false;
      if (
        filters.category &&
        !ticket.category.toLowerCase().includes(filters.category.toLowerCase())
      )
        return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !ticket.title.toLowerCase().includes(searchLower) &&
          !ticket.ticket_number.toLowerCase().includes(searchLower) &&
          !(
            ticket.description &&
            ticket.description.toLowerCase().includes(searchLower)
          )
        ) {
          return false;
        }
      }
      return true;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setTickets(sortTickets(tickets));
  };

  const getPriorityColor = (priority: TicketPriority) => {
    const colors = {
      critical: "bg-red-100 text-red-700 border-red-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      low: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[priority];
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-purple-600" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "closed":
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Link
              href="/estates-compliance"
              className="hover:text-gray-900 dark:hover:text-gray-200 font-medium"
            >
              Estates Compliance
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              Helpdesk
            </span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Helpdesk
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
            Report and track facilities issues, maintenance requests, and
            repairs
          </p>
        </div>
        <Link
          href="/estates-compliance/helpdesk/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
        >
          <Wrench className="w-4 h-4" />
          Report Issue
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total"
          value={stats.total}
          onClick={() => setActiveTab("all")}
          active={activeTab === "all"}
          variant="default"
        />
        <StatCard
          label="Open"
          value={stats.open}
          onClick={() => setActiveTab("open")}
          active={activeTab === "open"}
          variant="info"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          onClick={() => setActiveTab("in_progress")}
          active={activeTab === "in_progress"}
          variant="warning"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          onClick={() => setActiveTab("resolved")}
          active={activeTab === "resolved"}
          variant="success"
        />
        <StatCard
          label="Closed"
          value={stats.closed}
          onClick={() => setActiveTab("closed")}
          active={activeTab === "closed"}
          variant="default"
        />
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
            className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({
                ...filters,
                priority: e.target.value as TicketPriority | "",
              })
            }
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={fetchTickets}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {(
            ["all", "open", "in_progress", "resolved", "closed"] as TabMode[]
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </nav>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600 dark:text-gray-400 font-medium">
            Loading tickets...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400 font-medium">
            Error: {error}
          </p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-16 text-center bg-white dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <span className="text-3xl">🎫</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No tickets found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {activeTab === "all"
              ? "Report an issue to get started with the helpdesk."
              : `No ${activeTab.replace("_", " ")} tickets found.`}
          </p>
          {activeTab === "all" && (
            <Link
              href="/estates-compliance/helpdesk/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              <Wrench className="w-4 h-4" />
              Report Your First Issue
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("ticket_number")}
                      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Ticket
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("priority")}
                      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Priority
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3">Raised By</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Status
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Created
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {ticket.ticket_number}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {ticket.title}
                      </div>
                      {ticket.description && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                          {ticket.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700 dark:text-gray-300">
                        {getCategoryLabel(ticket.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {ticket.raised_by || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {ticket.assigned_to || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-gray-700 dark:text-gray-300 font-medium capitalize">
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/estates-compliance/helpdesk/${ticket.id}`}
                        className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  onClick?: () => void;
  active?: boolean;
  variant?: "default" | "info" | "warning" | "success";
}

function StatCard({
  label,
  value,
  onClick,
  active,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default:
      "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30",
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30",
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 transition-all text-left shadow-sm ${variantStyles[variant]} ${active ? "ring-2 ring-blue-500" : ""}`}
    >
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
        {value}
      </p>
    </button>
  );
}
