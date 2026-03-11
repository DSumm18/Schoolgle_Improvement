"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Calendar,
  User,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PolicyModal from "./PolicyModal";
import {
  GovernancePolicyReviewWithOwner,
  PolicyCategory,
  PolicyReviewStatus,
} from "@/lib/governance";

interface PolicyReviewListProps {
  organizationId: string;
  onRefresh?: () => void;
}

export default function PolicyReviewList({
  organizationId,
  onRefresh,
}: PolicyReviewListProps) {
  const [policies, setPolicies] = useState<GovernancePolicyReviewWithOwner[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<PolicyCategory | "all">(
    "all",
  );
  const [filterStatus, setFilterStatus] = useState<PolicyReviewStatus | "all">(
    "all",
  );
  const [selectedPolicy, setSelectedPolicy] =
    useState<GovernancePolicyReviewWithOwner | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, [organizationId, filterCategory, filterStatus]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ organizationId });
      if (filterCategory !== "all")
        params.append("policy_category", filterCategory);
      if (filterStatus !== "all") params.append("review_status", filterStatus);
      params.append("include_overdue", "true");

      const response = await fetch(`/api/governance/policies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.policies || []);
      }
    } catch (error) {
      console.error("Failed to fetch policies:", error);
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (policyId: string) => {
    if (!confirm("Are you sure you want to delete this policy review?")) return;

    try {
      const response = await fetch(
        `/api/governance/policies?organizationId=${organizationId}&ids=${policyId}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        fetchPolicies();
        onRefresh?.();
      }
    } catch (error) {
      console.error("Failed to delete policy:", error);
      toast.error("Failed to delete policy");
    }
  };

  const handleMarkReviewed = async (
    policy: GovernancePolicyReviewWithOwner,
  ) => {
    const today = new Date().toISOString().split("T")[0];
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + policy.review_frequency_months);

    try {
      const response = await fetch(`/api/governance/policies`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          updates: [
            {
              id: policy.id,
              changes: {
                last_review_date: today,
                next_review_date: nextReview.toISOString().split("T")[0],
                review_status: "current" as PolicyReviewStatus,
              },
            },
          ],
        }),
      });

      if (response.ok) {
        fetchPolicies();
        onRefresh?.();
      }
    } catch (error) {
      console.error("Failed to mark as reviewed:", error);
      toast.error("Failed to mark policy as reviewed");
    }
  };

  const getStatusBadge = (status: PolicyReviewStatus) => {
    const styles: Record<PolicyReviewStatus, string> = {
      current: "bg-emerald-100 text-emerald-700 border-emerald-200",
      under_review: "bg-blue-100 text-blue-700 border-blue-200",
      outdated: "bg-amber-100 text-amber-700 border-amber-200",
      required: "bg-rose-100 text-rose-700 border-rose-200",
    };
    const labels: Record<PolicyReviewStatus, string> = {
      current: "Current",
      under_review: "Under Review",
      outdated: "Outdated",
      required: "Required",
    };
    return (
      <Badge
        className={`text-[10px] font-bold uppercase px-2 py-0.5 ${styles[status]}`}
      >
        {labels[status]}
      </Badge>
    );
  };

  const getCategoryBadge = (category: PolicyCategory) => {
    const styles: Record<PolicyCategory, string> = {
      statutory: "bg-violet-100 text-violet-700 border-violet-200",
      recommended: "bg-blue-100 text-blue-700 border-blue-200",
      custom: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
      <Badge
        className={`text-[10px] font-normal uppercase ${styles[category]}`}
      >
        {category.replace("_", " ")}
      </Badge>
    );
  };

  const getDueInfo = (policy: GovernancePolicyReviewWithOwner) => {
    const today = new Date();
    const nextReview = new Date(policy.next_review_date);
    const daysUntil = Math.ceil(
      (nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntil < 0) {
      return {
        text: `${Math.abs(daysUntil)} days overdue`,
        color: "text-rose-600",
        icon: AlertCircle,
      };
    }
    if (daysUntil === 0) {
      return {
        text: "Due today",
        color: "text-amber-600",
        icon: AlertTriangle,
      };
    }
    if (daysUntil <= 30) {
      return {
        text: `Due in ${daysUntil} days`,
        color: "text-amber-600",
        icon: AlertTriangle,
      };
    }
    return {
      text: nextReview.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      color: "text-slate-600",
      icon: Calendar,
    };
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchesSearch =
        !searchQuery ||
        policy.policy_name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [policies, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: policies.length,
      current: policies.filter((p) => p.review_status === "current").length,
      under_review: policies.filter((p) => p.review_status === "under_review")
        .length,
      overdue: policies.filter((p) => p.days_overdue > 0).length,
      statutory: policies.filter((p) => p.is_statutory).length,
    };
  }, [policies]);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Policies"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <StatCard
          label="Current"
          value={stats.current}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          label="Under Review"
          value={stats.under_review}
          icon={RefreshCw}
          color="blue"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertCircle}
          color="rose"
        />
        <StatCard
          label="Statutory"
          value={stats.statutory}
          icon={AlertTriangle}
          color="violet"
        />
      </div>

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
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <Select
                value={filterCategory}
                onValueChange={(value) => setFilterCategory(value as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="statutory">Statutory</SelectItem>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="outdated">Outdated</SelectItem>
                  <SelectItem value="required">Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => {
                setSelectedPolicy(null);
                setModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Policy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last Review</TableHead>
                <TableHead>Next Review</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-500 font-semibold">
                        No policies found
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPolicy(null);
                          setModalOpen(true);
                        }}
                      >
                        Add your first policy
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPolicies.map((policy) => {
                  const dueInfo = getDueInfo(policy);
                  const DueIcon = dueInfo.icon;

                  return (
                    <motion.tr
                      key={policy.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        policy.days_overdue > 0
                          ? "bg-rose-50/50 dark:bg-rose-900/10"
                          : ""
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {policy.is_statutory && (
                            <AlertTriangle
                              className="w-3.5 h-3.5 text-violet-500"
                              title="Statutory"
                            />
                          )}
                          <span className="font-medium text-sm">
                            {policy.policy_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(policy.policy_category)}
                      </TableCell>
                      <TableCell>
                        {policy.policy_owner_name ? (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm">
                              {policy.policy_owner_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {policy.last_review_date ? (
                          <span className="text-sm">
                            {new Date(
                              policy.last_review_date,
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`flex items-center gap-1.5 text-sm ${dueInfo.color}`}
                        >
                          <DueIcon className="w-3.5 h-3.5" />
                          {dueInfo.text}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          Every {policy.review_frequency_months} months
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(policy.review_status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {policy.days_overdue <= 0 &&
                            policy.review_status !== "under_review" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkReviewed(policy)}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Mark as reviewed"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPolicy(policy);
                              setModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(policy.id)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <PolicyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => {
          setModalOpen(false);
          fetchPolicies();
          onRefresh?.();
        }}
        organizationId={organizationId}
        initialData={selectedPolicy}
        governors={[]} // TODO: Fetch governors
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
    violet: "bg-violet-100 text-violet-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500">
              {label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
