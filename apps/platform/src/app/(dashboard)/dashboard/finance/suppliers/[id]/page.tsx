"use client";

import React, { useState, useCallback } from "react";
import {
  ArrowLeft,
  Building2,
  Star,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  PoundSterling,
  FileText,
  ShieldCheck,
  Pencil,
  Save,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Tag,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Hash,
  User,
  Send,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
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
  address: string | null;
  website: string | null;
  notes: string | null;
  vat_number: string | null;
  company_number: string | null;
  preferred_contact_method: string | null;
  total_spend_ytd: number | null;
  total_spend_last_year: number | null;
  transaction_count_ytd: number | null;
  avg_transaction_value: number | null;
  last_transaction_date: string | null;
  service_rating: number | null;
  service_notes: string | null;
  contract_start: string | null;
  contract_end: string | null;
  contract_value: number | null;
  payment_terms: string | null;
  is_framework_supplier: boolean;
  framework_name: string | null;
  tags: string[] | null;
  is_active: boolean;
  source_system: string | null;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  transaction_date: string;
  reference: string | null;
  description: string | null;
  cfr_code: string | null;
  amount: number;
  cost_centre: string | null;
}

interface MonthlyPoint {
  month: string;
  label: string;
  spend: number;
}

interface SupplierDetailResponse {
  supplier: Supplier;
  transactions: Transaction[];
  transactionPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  monthlyChart: MonthlyPoint[];
}

// ─── Helpers ────────────────────────────────────────────────

const GBP = (v: number | null | undefined) => {
  if (v == null) return "\u00A30";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
};

const GBP2 = (v: number | null | undefined) => {
  if (v == null) return "\u00A30.00";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
};

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function contractInfo(start: string | null, end: string | null) {
  if (!end)
    return { label: "No contract", color: "text-zinc-400", daysLeft: null };
  const now = new Date();
  const endDate = new Date(end);
  const daysLeft = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysLeft < 0)
    return { label: "Expired", color: "text-red-500", daysLeft };
  if (daysLeft < 90)
    return {
      label: `Expiring in ${daysLeft} days`,
      color: "text-amber-500",
      daysLeft,
    };
  return { label: "Active", color: "text-emerald-500", daysLeft };
}

// ─── Star Rating Component ──────────────────────────────────

function EditableStarRating({
  rating,
  editable,
  onChange,
}: {
  rating: number;
  editable: boolean;
  onChange: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          disabled={!editable}
          onClick={() => editable && onChange(i)}
          onMouseEnter={() => editable && setHover(i)}
          onMouseLeave={() => setHover(0)}
          className={`${editable ? "cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              i <= (hover || rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-zinc-500">
        {rating > 0 ? `${rating}/5` : "Not rated"}
      </span>
    </div>
  );
}

// ─── Custom Tooltip ─────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs font-medium text-zinc-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
        {GBP2(payload[0].value)}
      </p>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function SupplierDetailPage() {
  const { organization } = useAuth();
  const params = useParams();
  const orgId = organization?.id;
  const supplierId = params?.id as string;

  const [txPage, setTxPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Supplier>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<SupplierDetailResponse>(
    orgId && supplierId
      ? `/api/finance/suppliers/${supplierId}?organizationId=${orgId}&txPage=${txPage}&txLimit=20`
      : null,
    fetcher,
  );

  const supplier = data?.supplier;
  const transactions = data?.transactions || [];
  const txPagination = data?.transactionPagination;
  const monthlyChart = data?.monthlyChart || [];

  const contract = supplier
    ? contractInfo(supplier.contract_start, supplier.contract_end)
    : null;

  // ─── Edit handlers ────────────────────────────────

  const startEditing = useCallback(() => {
    if (!supplier) return;
    setEditFields({
      display_name: supplier.display_name || "",
      contact_name: supplier.contact_name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      website: supplier.website || "",
      notes: supplier.notes || "",
      preferred_contact_method: supplier.preferred_contact_method || "email",
      service_rating: supplier.service_rating || 0,
      service_notes: supplier.service_notes || "",
      contract_start: supplier.contract_start || "",
      contract_end: supplier.contract_end || "",
      contract_value: supplier.contract_value || 0,
      payment_terms: supplier.payment_terms || "",
      is_framework_supplier: supplier.is_framework_supplier,
      framework_name: supplier.framework_name || "",
      category: supplier.category || "",
      tags: supplier.tags || [],
    });
    setEditing(true);
  }, [supplier]);

  const saveEdits = async () => {
    if (!supplier) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/finance/suppliers/${supplier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFields,
          organizationId: orgId,
        }),
      });
      if (res.ok) {
        setEditing(false);
        mutate();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Running total for transactions ───────────────

  let runningTotal = 0;
  const txWithRunning = transactions.map((tx) => {
    runningTotal += Math.abs(tx.amount || 0);
    return { ...tx, runningTotal };
  });

  // ─── Spend comparison ─────────────────────────────

  const spendYTD = supplier?.total_spend_ytd || 0;
  const spendLastYear = supplier?.total_spend_last_year || 0;
  const spendChange =
    spendLastYear > 0 ? ((spendYTD - spendLastYear) / spendLastYear) * 100 : 0;

  // ─── Render ───────────────────────────────────────

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Loading organization...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-[#FFAA4C] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Building2 className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
          Supplier not found
        </h2>
        <Link
          href="/dashboard/finance/suppliers"
          className="text-sm text-[#FFAA4C] hover:underline"
        >
          Back to Supplier Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/dashboard/finance/suppliers"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Suppliers
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[#FFAA4C]/10 flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7 text-[#FFAA4C]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {supplier.display_name || supplier.supplier_name}
                  </h1>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      supplier.is_active
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {supplier.is_active ? "Active" : "Inactive"}
                  </span>
                  {supplier.is_framework_supplier && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <ShieldCheck className="h-3 w-3" />
                      {supplier.framework_name || "Framework"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {supplier.category && (
                    <span className="text-sm text-zinc-500">
                      {supplier.category}
                    </span>
                  )}
                  {supplier.supplier_ref && (
                    <span className="text-sm text-zinc-400">
                      Ref: {supplier.supplier_ref}
                    </span>
                  )}
                  <EditableStarRating
                    rating={
                      editing
                        ? (editFields.service_rating as number) || 0
                        : supplier.service_rating || 0
                    }
                    editable={editing}
                    onChange={(r) =>
                      setEditFields((f) => ({ ...f, service_rating: r }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!editing ? (
                <button
                  onClick={startEditing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={saveEdits}
                    disabled={savingEdit}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFAA4C] text-white text-sm font-medium hover:bg-[#E69A3C] disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    {savingEdit ? "Saving..." : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top row: Contact + Contract + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
          >
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-[#FFAA4C]" />
              Contact Details
            </h3>
            <div className="space-y-3">
              {editing ? (
                <>
                  {[
                    { key: "contact_name", label: "Name", icon: User },
                    { key: "email", label: "Email", icon: Mail },
                    { key: "phone", label: "Phone", icon: Phone },
                    { key: "website", label: "Website", icon: Globe },
                    { key: "address", label: "Address", icon: MapPin },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-xs text-zinc-500 mb-1 block">
                        {f.label}
                      </label>
                      <input
                        type="text"
                        value={(editFields as Record<string, any>)[f.key] || ""}
                        onChange={(e) =>
                          setEditFields((prev) => ({
                            ...prev,
                            [f.key]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFAA4C]/40"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Preferred Contact
                    </label>
                    <select
                      value={
                        (editFields.preferred_contact_method as string) ||
                        "email"
                      }
                      onChange={(e) =>
                        setEditFields((f) => ({
                          ...f,
                          preferred_contact_method: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFAA4C]/40"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="post">Post</option>
                      <option value="portal">Portal</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {[
                    {
                      icon: User,
                      value: supplier.contact_name,
                      label: "Contact",
                    },
                    {
                      icon: Mail,
                      value: supplier.email,
                      label: "Email",
                      href: supplier.email
                        ? `mailto:${supplier.email}`
                        : undefined,
                    },
                    {
                      icon: Phone,
                      value: supplier.phone,
                      label: "Phone",
                      href: supplier.phone
                        ? `tel:${supplier.phone}`
                        : undefined,
                    },
                    {
                      icon: Globe,
                      value: supplier.website,
                      label: "Website",
                      href: supplier.website || undefined,
                      external: true,
                    },
                    {
                      icon: MapPin,
                      value: supplier.address,
                      label: "Address",
                    },
                  ]
                    .filter((item) => item.value)
                    .map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <item.icon className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-zinc-400">{item.label}</p>
                          {item.href ? (
                            <a
                              href={item.href}
                              target={item.external ? "_blank" : undefined}
                              rel={
                                item.external
                                  ? "noopener noreferrer"
                                  : undefined
                              }
                              className="text-sm text-[#FFAA4C] hover:underline flex items-center gap-1"
                            >
                              {item.value}
                              {item.external && (
                                <ExternalLink className="h-3 w-3" />
                              )}
                            </a>
                          ) : (
                            <p className="text-sm text-zinc-900 dark:text-white">
                              {item.value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  {supplier.preferred_contact_method && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs text-zinc-400">
                        Preferred:{" "}
                        <span className="text-zinc-600 dark:text-zinc-300 capitalize">
                          {supplier.preferred_contact_method}
                        </span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Contract Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
          >
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#FFAA4C]" />
              Contract
            </h3>
            {editing ? (
              <div className="space-y-3">
                {[
                  {
                    key: "contract_start",
                    label: "Start Date",
                    type: "date",
                  },
                  { key: "contract_end", label: "End Date", type: "date" },
                  {
                    key: "contract_value",
                    label: "Value (\u00A3)",
                    type: "number",
                  },
                  {
                    key: "payment_terms",
                    label: "Payment Terms",
                    type: "text",
                  },
                  {
                    key: "framework_name",
                    label: "Framework",
                    type: "text",
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={(editFields as Record<string, any>)[f.key] || ""}
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          [f.key]:
                            f.type === "number"
                              ? parseFloat(e.target.value) || 0
                              : e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFAA4C]/40"
                    />
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editFields.is_framework_supplier || false}
                    onChange={(e) =>
                      setEditFields((f) => ({
                        ...f,
                        is_framework_supplier: e.target.checked,
                      }))
                    }
                    className="rounded border-zinc-300"
                  />
                  <label className="text-sm text-zinc-700 dark:text-zinc-300">
                    Framework supplier
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {contract && (
                  <div className="flex items-center gap-2 mb-3">
                    {contract.label === "Expired" ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : contract.label === "Active" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={`text-sm font-medium ${contract.color}`}>
                      {contract.label}
                    </span>
                  </div>
                )}
                {[
                  {
                    label: "Start Date",
                    value: formatDate(supplier.contract_start),
                  },
                  {
                    label: "End Date",
                    value: formatDate(supplier.contract_end),
                  },
                  {
                    label: "Value",
                    value: supplier.contract_value
                      ? GBP(supplier.contract_value)
                      : "-",
                  },
                  {
                    label: "Payment Terms",
                    value: supplier.payment_terms || "-",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-zinc-400">{row.label}</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {row.value}
                    </span>
                  </div>
                ))}
                {supplier.vat_number && (
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400">VAT Number</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {supplier.vat_number}
                    </span>
                  </div>
                )}
                {supplier.company_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">
                      Company Number
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {supplier.company_number}
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Quick Actions + Service Quality */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Quick Actions */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {supplier.email && (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Send className="h-4 w-4 text-[#FFAA4C]" />
                    Send Email
                  </a>
                )}
                <button className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <ClipboardList className="h-4 w-4 text-[#FFAA4C]" />
                  Generate PO
                </button>
                <button className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <FileText className="h-4 w-4 text-[#FFAA4C]" />
                  View Contract
                </button>
              </div>
            </div>

            {/* Service Quality (read / edit) */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-[#FFAA4C]" />
                Service Quality
              </h3>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Service Notes
                    </label>
                    <textarea
                      value={(editFields.service_notes as string) || ""}
                      onChange={(e) =>
                        setEditFields((f) => ({
                          ...f,
                          service_notes: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFAA4C]/40 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={(editFields.tags as string[])?.join(", ") || ""}
                      onChange={(e) =>
                        setEditFields((f) => ({
                          ...f,
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFAA4C]/40"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {supplier.service_notes && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {supplier.service_notes}
                    </p>
                  )}
                  {(supplier.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(supplier.tags || []).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          <Tag className="h-3 w-3" />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {!supplier.service_notes &&
                    (supplier.tags || []).length === 0 && (
                      <p className="text-xs text-zinc-400">
                        No service notes or tags yet.
                      </p>
                    )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Spend Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-[#FFAA4C]" />
              Spend Overview
            </h3>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-zinc-400">YTD</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">
                  {GBP(spendYTD)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Last Year</p>
                <p className="text-lg font-bold text-zinc-600 dark:text-zinc-400">
                  {GBP(spendLastYear)}
                </p>
              </div>
              {spendLastYear > 0 && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    spendChange > 0
                      ? "text-red-500"
                      : spendChange < 0
                        ? "text-emerald-500"
                        : "text-zinc-400"
                  }`}
                >
                  {spendChange > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : spendChange < 0 ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : null}
                  {spendChange > 0 ? "+" : ""}
                  {spendChange.toFixed(1)}%
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-400">Transactions</p>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {(supplier.transaction_count_ytd || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Avg Value</p>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {GBP(supplier.avg_transaction_value)}
                </p>
              </div>
            </div>
          </div>

          {monthlyChart.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChart}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-zinc-200 dark:stroke-zinc-700"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    className="text-zinc-500"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-zinc-500"
                    tickFormatter={(v) =>
                      v >= 1000
                        ? `\u00A3${(v / 1000).toFixed(0)}k`
                        : `\u00A3${v}`
                    }
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="spend"
                    fill="#FFAA4C"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">
              No transaction data available for chart
            </div>
          )}
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Hash className="h-4 w-4 text-[#FFAA4C]" />
              Transaction History
            </h3>
            {txPagination && (
              <span className="text-xs text-zinc-400">
                {txPagination.total} transaction
                {txPagination.total !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      CFR
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Running Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {txWithRunning.map((tx, i) => (
                    <tr
                      key={tx.id || i}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">
                        {tx.reference || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-900 dark:text-white max-w-xs truncate">
                        {tx.description || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 text-xs font-mono">
                        {tx.cfr_code || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                        {GBP2(tx.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-500 whitespace-nowrap">
                        {GBP2(tx.runningTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-400 text-sm">
              No transactions found for this supplier
            </div>
          )}

          {/* Transaction Pagination */}
          {txPagination && txPagination.totalPages > 1 && (
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Page {txPagination.page} of {txPagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  disabled={txPage <= 1}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setTxPage((p) => Math.min(txPagination.totalPages, p + 1))
                  }
                  disabled={txPage >= txPagination.totalPages}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Notes section */}
        {supplier.notes && !editing && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
          >
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
              Notes
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
              {supplier.notes}
            </p>
          </motion.div>
        )}

        {/* Meta */}
        <div className="text-xs text-zinc-400 flex items-center gap-4">
          <span>Source: {supplier.source_system || "Unknown"}</span>
          <span>Created: {formatDate(supplier.created_at)}</span>
          <span>Updated: {formatDate(supplier.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}
