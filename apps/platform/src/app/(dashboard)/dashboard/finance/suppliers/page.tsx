"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Star,
  Building2,
  PoundSterling,
  Users,
  ShieldCheck,
  LayoutGrid,
  LayoutList,
  Mail,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Tag,
  Phone,
  Globe,
  Filter,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";

// ─── Types ──────────────────────────────────────────────────

interface Supplier {
  id: string;
  supplier_name: string;
  display_name: string | null;
  supplier_ref: string | null;
  category: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  total_spend_ytd: number | null;
  total_spend_last_year: number | null;
  transaction_count_ytd: number | null;
  service_rating: number | null;
  contract_start: string | null;
  contract_end: string | null;
  contract_value: number | null;
  is_framework_supplier: boolean;
  framework_name: string | null;
  tags: string[] | null;
  is_active: boolean;
  last_transaction_date: string | null;
}

interface SuppliersResponse {
  suppliers: Supplier[];
  summary: {
    total_suppliers: number;
    total_spend_ytd: number;
    avg_spend_per_supplier: number;
    framework_count: number;
    category_count: number;
  };
  categories: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Helpers ────────────────────────────────────────────────

const GBP = (v: number | null | undefined) => {
  if (v == null) return "\u00A3 0";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
};

function contractStatus(end: string | null): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  if (!end) return { label: "No contract", color: "text-zinc-400", icon: null };
  const now = new Date();
  const endDate = new Date(end);
  const daysLeft = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysLeft < 0)
    return {
      label: "Expired",
      color: "text-red-500",
      icon: <AlertTriangle className="h-3 w-3" />,
    };
  if (daysLeft < 90)
    return {
      label: `${daysLeft}d left`,
      color: "text-amber-500",
      icon: <Clock className="h-3 w-3" />,
    };
  return {
    label: "Active",
    color: "text-emerald-500",
    icon: <CheckCircle2 className="h-3 w-3" />,
  };
}

function StarRating({ rating }: { rating: number | null }) {
  const r = rating || 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= r
              ? "fill-amber-400 text-amber-400"
              : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  staffing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  utilities: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  premises:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  catering:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  curriculum:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  ict: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  insurance: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  professional:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function getCategoryBadge(cat: string | null) {
  if (!cat) return null;
  const key = cat.toLowerCase();
  const cls =
    CATEGORY_COLORS[key] ||
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {cat}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function SuppliersPage() {
  const { organization } = useAuth();
  const router = useRouter();
  const orgId = organization?.id;

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("total_spend_ytd");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddModal, setShowAddModal] = useState(false);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (orgId) params.set("organizationId", orgId);
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    params.set("sort", sortBy);
    params.set("dir", sortDir);
    params.set("page", String(page));
    params.set("limit", "48");
    return params.toString();
  }, [orgId, search, category, sortBy, sortDir, page]);

  const { data, error, isLoading, mutate } = useSWR<SuppliersResponse>(
    orgId ? `/api/finance/suppliers?${queryParams}` : null,
    fetcher,
  );

  const suppliers = data?.suppliers || [];
  const summary = data?.summary;
  const categories = data?.categories || [];
  const pagination = data?.pagination;

  const handleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortDir("desc");
      }
      setPage(1);
    },
    [sortBy],
  );

  // ─── Add Supplier ───────────────────────────────────

  const [newSupplier, setNewSupplier] = useState({
    supplier_name: "",
    display_name: "",
    category: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleAddSupplier = async () => {
    if (!newSupplier.supplier_name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/finance/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSupplier,
          organizationId: orgId,
        }),
      });
      setShowAddModal(false);
      setNewSupplier({
        supplier_name: "",
        display_name: "",
        category: "",
        contact_name: "",
        email: "",
        phone: "",
        website: "",
        notes: "",
      });
      mutate();
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Loading organization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
                <Link
                  href="/dashboard"
                  className="hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <Link
                  href="/dashboard/finance/monitor"
                  className="hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Finance
                </Link>
                <span>/</span>
                <span className="text-zinc-900 dark:text-white">Suppliers</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#FFAA4C]/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-[#FFAA4C]" />
                </div>
                Supplier Directory
              </h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFAA4C] text-white font-medium hover:bg-[#E69A3C] transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Supplier
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Summary Strip */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Suppliers",
                value: summary.total_suppliers.toLocaleString(),
                icon: <Users className="h-5 w-5 text-[#FFAA4C]" />,
                sub: `${summary.category_count} categories`,
              },
              {
                label: "Total Spend YTD",
                value: GBP(summary.total_spend_ytd),
                icon: <PoundSterling className="h-5 w-5 text-[#FFAA4C]" />,
                sub: "This financial year",
              },
              {
                label: "Avg per Supplier",
                value: GBP(summary.avg_spend_per_supplier),
                icon: <TrendingUp className="h-5 w-5 text-[#FFAA4C]" />,
                sub: "Active suppliers only",
              },
              {
                label: "Framework Suppliers",
                value: summary.framework_count.toLocaleString(),
                icon: <ShieldCheck className="h-5 w-5 text-[#FFAA4C]" />,
                sub: "DfE/CCS frameworks",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-[#FFAA4C]/10 flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {stat.label}
                  </span>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search suppliers by name, ref, or contact..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FFAA4C]/40 focus:border-[#FFAA4C]"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFAA4C]/40 appearance-none"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split(":");
                setSortBy(field);
                setSortDir(dir as "asc" | "desc");
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFAA4C]/40 appearance-none"
            >
              <option value="total_spend_ytd:desc">Spend (high-low)</option>
              <option value="total_spend_ytd:asc">Spend (low-high)</option>
              <option value="supplier_name:asc">Name (A-Z)</option>
              <option value="supplier_name:desc">Name (Z-A)</option>
              <option value="service_rating:desc">Rating (high-low)</option>
              <option value="last_transaction_date:desc">
                Recent activity
              </option>
              <option value="contract_end:asc">
                Contract expiry (soonest)
              </option>
            </select>

            <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 ${
                  viewMode === "grid"
                    ? "bg-[#FFAA4C]/10 text-[#FFAA4C]"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 ${
                  viewMode === "list"
                    ? "bg-[#FFAA4C]/10 text-[#FFAA4C]"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-[#FFAA4C] border-t-transparent animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
            Failed to load suppliers. Please try again.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && suppliers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#FFAA4C]/10 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-[#FFAA4C]" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
              No suppliers found
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              {search || category
                ? "Try adjusting your search or filters."
                : "Import financial data or add suppliers manually to get started."}
            </p>
          </div>
        )}

        {/* Grid View */}
        {!isLoading && viewMode === "grid" && suppliers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {suppliers.map((s, i) => {
                const status = contractStatus(s.contract_end);
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.02, duration: 0.25 }}
                    onClick={() =>
                      router.push(`/dashboard/finance/suppliers/${s.id}`)
                    }
                    className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 cursor-pointer hover:border-[#FFAA4C]/40 hover:shadow-lg hover:shadow-[#FFAA4C]/5 transition-all duration-200"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-900 dark:text-white truncate group-hover:text-[#FFAA4C] transition-colors">
                          {s.display_name || s.supplier_name}
                        </h3>
                        {s.display_name &&
                          s.display_name !== s.supplier_name && (
                            <p className="text-xs text-zinc-400 truncate">
                              {s.supplier_name}
                            </p>
                          )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {s.is_framework_supplier && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <ShieldCheck className="h-3 w-3" />
                            Framework
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category + Status */}
                    <div className="flex items-center gap-2 mb-4">
                      {getCategoryBadge(s.category)}
                      {status.label !== "No contract" && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      )}
                    </div>

                    {/* Spend */}
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className="text-xs text-zinc-400 mb-0.5">
                          Spend YTD
                        </p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                          {GBP(s.total_spend_ytd)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-400">Transactions</p>
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          {(s.transaction_count_ytd || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-between">
                      <StarRating rating={s.service_rating} />
                      {/* Tags */}
                      <div className="flex items-center gap-1 overflow-hidden max-w-[50%]">
                        {(s.tags || []).slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 truncate"
                          >
                            {t}
                          </span>
                        ))}
                        {(s.tags || []).length > 2 && (
                          <span className="text-[10px] text-zinc-400">
                            +{(s.tags || []).length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/finance/suppliers/${s.id}`);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      {s.email && (
                        <a
                          href={`mailto:${s.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/dashboard/finance/suppliers/${s.id}#edit`,
                          );
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* List View */}
        {!isLoading && viewMode === "list" && suppliers.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    {[
                      { key: "supplier_name", label: "Supplier" },
                      { key: "category", label: "Category" },
                      { key: "total_spend_ytd", label: "Spend YTD" },
                      { key: "transaction_count_ytd", label: "Txns" },
                      { key: "service_rating", label: "Rating" },
                      { key: "contract_end", label: "Contract" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 select-none"
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {suppliers.map((s, i) => {
                      const status = contractStatus(s.contract_end);
                      return (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.01 }}
                          onClick={() =>
                            router.push(`/dashboard/finance/suppliers/${s.id}`)
                          }
                          className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-white">
                                {s.display_name || s.supplier_name}
                              </p>
                              {s.supplier_ref && (
                                <p className="text-xs text-zinc-400">
                                  Ref: {s.supplier_ref}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {getCategoryBadge(s.category)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                            {GBP(s.total_spend_ytd)}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {s.transaction_count_ytd || 0}
                          </td>
                          <td className="px-4 py-3">
                            <StarRating rating={s.service_rating} />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}
                            >
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {s.email && (
                                <a
                                  href={`mailto:${s.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600"
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/dashboard/finance/suppliers/${s.id}`,
                                  );
                                }}
                                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} suppliers
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Add Supplier
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-5 w-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {[
                  {
                    key: "supplier_name",
                    label: "Supplier Name *",
                    placeholder: "e.g. Acme Supplies Ltd",
                  },
                  {
                    key: "display_name",
                    label: "Display Name",
                    placeholder: "Friendly name (optional)",
                  },
                  {
                    key: "category",
                    label: "Category",
                    placeholder: "e.g. Premises, Curriculum, ICT",
                  },
                  {
                    key: "contact_name",
                    label: "Contact Name",
                    placeholder: "Primary contact",
                  },
                  {
                    key: "email",
                    label: "Email",
                    placeholder: "accounts@supplier.co.uk",
                    type: "email",
                  },
                  {
                    key: "phone",
                    label: "Phone",
                    placeholder: "01onal 234567",
                    type: "tel",
                  },
                  {
                    key: "website",
                    label: "Website",
                    placeholder: "https://supplier.co.uk",
                    type: "url",
                  },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={(field as any).type || "text"}
                      value={
                        (newSupplier as Record<string, string>)[field.key] || ""
                      }
                      onChange={(e) =>
                        setNewSupplier((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FFAA4C]/40 focus:border-[#FFAA4C]"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newSupplier.notes}
                    onChange={(e) =>
                      setNewSupplier((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Any relevant notes..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FFAA4C]/40 focus:border-[#FFAA4C] resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSupplier}
                  disabled={!newSupplier.supplier_name.trim() || saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#FFAA4C] text-white hover:bg-[#E69A3C] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Adding..." : "Add Supplier"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
