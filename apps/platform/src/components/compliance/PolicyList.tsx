"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Plus,
  Calendar,
  User,
  AlertTriangle,
  RefreshCw,
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
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <Button
              onClick={onCreatePolicy}
              className="bg-purple-600 hover:bg-purple-700"
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
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
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
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((policy, idx) => (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card
                className={`cursor-pointer hover:shadow-md transition-all hover:border-purple-300 ${
                  isOverdue(policy) ? "border-rose-300 bg-rose-50/30" : ""
                }`}
                onClick={() => onSelectPolicy(policy.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2">
                      {policy.title}
                    </h3>
                    <StatusBadge status={policy.status} />
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
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

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Review:{" "}
                        {formatDate(policy.review_schedule?.next_review_date)}
                      </span>
                    </div>
                    {isOverdue(policy) && (
                      <span className="flex items-center gap-1 text-xs text-rose-600 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}
                  </div>

                  {policy.owner_user_id && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                      <User className="w-3 h-3" />
                      Owner assigned
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
