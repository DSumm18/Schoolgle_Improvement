"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Search,
  Plus,
  Calendar,
  User,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "./StatusBadge";
import {
  ComplianceItem,
  PolicyCategory,
  CATEGORY_LABELS,
} from "@/lib/compliance/types";

interface PolicyListProps {
  organizationId: string;
  onCreatePolicy: () => void;
  onSelectPolicy: (id: string) => void;
}

export default function PolicyList({
  organizationId,
  onCreatePolicy,
  onSelectPolicy,
}: PolicyListProps) {
  const [policies, setPolicies] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PolicyCategory | "all">(
    "all",
  );
  const [templateUpdates, setTemplateUpdates] = useState<
    Array<{
      item_id: string;
      template_name: string;
      template_source_reference: string | null;
    }>
  >([]);

  useEffect(() => {
    fetchPolicies();
    fetchTemplateUpdates();
  }, [organizationId]);

  const fetchTemplateUpdates = async () => {
    try {
      const res = await fetch(
        `/api/compliance/templates/updates?organizationId=${organizationId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setTemplateUpdates(data.updates || []);
      }
    } catch {
      // Non-critical, silently fail
    }
  };

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/compliance/items?organizationId=${organizationId}&type=policy`,
      );
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [policies, searchQuery, categoryFilter]);

  const overdueCount = useMemo(
    () =>
      policies.filter(
        (policy) =>
          policy.review_schedule?.next_review_date &&
          new Date(policy.review_schedule.next_review_date) < new Date(),
      ).length,
    [policies],
  );

  const publishedCount = useMemo(
    () => policies.filter((policy) => policy.status === "published").length,
    [policies],
  );

  const isOverdue = (policy: ComplianceItem) => {
    if (!policy.review_schedule?.next_review_date) return false;
    return new Date(policy.review_schedule.next_review_date) < new Date();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <Card className="overflow-hidden border-purple-100 bg-white/90 shadow-sm dark:border-purple-900/40 dark:bg-slate-950/80">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 via-white to-fuchsia-50 p-5 dark:border-purple-900/40 dark:from-purple-950/20 dark:via-slate-950 dark:to-fuchsia-950/10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-purple-700 ring-1 ring-purple-100 dark:bg-purple-950/40 dark:text-purple-200 dark:ring-purple-900/50">
                <ShieldCheck className="h-3.5 w-3.5" />
                Live policy library
              </div>
              <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                Policies in one place
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Search, review and improve the school’s policies without losing
                the Drive source of truth.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[24rem]">
              {[
                { label: "Total", value: policies.length },
                { label: "Published", value: publishedCount },
                { label: "Overdue", value: overdueCount },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/70 bg-white/80 p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <p className="text-xl font-black text-slate-950 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 p-4 lg:flex-row lg:items-center">
            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
              <div className="relative w-full sm:w-80">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>

            <Button
              onClick={onCreatePolicy}
              className="w-full bg-purple-600 shadow-sm hover:bg-purple-700 sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Policy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template update banner */}
      {templateUpdates.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  {templateUpdates.length} template update
                  {templateUpdates.length !== 1 ? "s" : ""} available
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Schoolgle has updated central templates with the latest
                  legislation. Review and apply updates to keep your policies
                  current.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {templateUpdates.slice(0, 5).map((u) => (
                    <Badge
                      key={u.item_id}
                      variant="outline"
                      className="text-[10px] border-amber-300 text-amber-700 cursor-pointer hover:bg-amber-100"
                      onClick={() => onSelectPolicy(u.item_id)}
                    >
                      {u.template_name}
                    </Badge>
                  ))}
                  {templateUpdates.length > 5 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-300 text-amber-600"
                    >
                      +{templateUpdates.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category filter tabs */}
      <Tabs
        value={categoryFilter}
        onValueChange={(v) => setCategoryFilter(v as any)}
      >
        <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <TabsTrigger
            value="all"
            className="rounded-xl px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            All ({policies.length})
          </TabsTrigger>
          {(Object.entries(CATEGORY_LABELS) as [PolicyCategory, string][]).map(
            ([key, label]) => {
              const count = policies.filter((p) => p.category === key).length;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="rounded-xl px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {label} ({count})
                </TabsTrigger>
              );
            },
          )}
        </TabsList>
      </Tabs>

      {/* Policy cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No policies found</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onCreatePolicy}
            >
              Create your first policy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((policy, idx) => (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card
                className={`group relative cursor-pointer overflow-hidden border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/70 dark:border-slate-800 dark:bg-slate-950 dark:hover:shadow-purple-950/20 ${
                  isOverdue(policy)
                    ? "border-rose-300 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20"
                    : ""
                }`}
                onClick={() => onSelectPolicy(policy.id)}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-400 to-emerald-400 opacity-80" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-3 inline-flex rounded-2xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
                        <FileText className="h-4 w-4" />
                      </div>
                      <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-950 dark:text-white">
                        {policy.title}
                      </h3>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={policy.status} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {policy.category && (
                      <StatusBadge category={policy.category} />
                    )}
                    {policy.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Review:{" "}
                          {formatDate(
                            policy.review_schedule?.next_review_date,
                          )}
                        </span>
                      </div>
                      {isOverdue(policy) ? (
                        <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                          <AlertTriangle className="w-3 h-3" />
                          Overdue
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          On radar
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {policy.owner_user_id ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <User className="w-3 h-3" />
                        Owner assigned
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-slate-400">
                        No owner assigned
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs font-black text-purple-600 opacity-0 transition group-hover:opacity-100 dark:text-purple-300">
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
