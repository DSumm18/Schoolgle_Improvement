"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ShieldAlert,
  Lock,
  Calendar,
  User,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LowLevelConcernsLogProps {
  organizationId: string;
}

interface LowLevelConcern {
  id: string;
  date: string;
  person_of_concern: string;
  reported_by: string;
  description: string;
  status: "open" | "reviewed" | "closed" | "escalated";
  escalated: boolean;
  dsl_review_notes?: string;
  dsl_review_date?: string;
  dsl_reviewer?: string;
}

const STATUS_CONFIG: Record<
  LowLevelConcern["status"],
  { label: string; color: string }
> = {
  open: { label: "Open", color: "bg-amber-100 text-amber-700" },
  reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-700" },
  closed: { label: "Closed", color: "bg-slate-100 text-slate-700" },
  escalated: { label: "Escalated", color: "bg-rose-100 text-rose-700" },
};

export default function LowLevelConcernsLog({
  organizationId,
}: LowLevelConcernsLogProps) {
  const [concerns, setConcerns] = useState<LowLevelConcern[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewStatus, setReviewStatus] =
    useState<LowLevelConcern["status"]>("reviewed");
  const [newConcern, setNewConcern] = useState({
    person_of_concern: "",
    reported_by: "",
    description: "",
  });

  useEffect(() => {
    fetchConcerns();
  }, [organizationId]);

  const fetchConcerns = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/compliance/low-level-concerns?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setConcerns(data.concerns || []);
      }
    } catch (error) {
      console.error("Failed to fetch concerns:", error);
    } finally {
      setLoading(false);
    }
  };

  const patternAlerts = useMemo(() => {
    const personCounts: Record<string, number> = {};
    concerns.forEach((c) => {
      const name = c.person_of_concern.toLowerCase().trim();
      personCounts[name] = (personCounts[name] || 0) + 1;
    });
    return Object.entries(personCounts)
      .filter(([, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));
  }, [concerns]);

  const handleCreateConcern = async () => {
    if (!newConcern.person_of_concern.trim() || !newConcern.description.trim())
      return;
    try {
      const response = await fetch(
        `/api/compliance/low-level-concerns?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newConcern),
        },
      );
      if (response.ok) {
        setModalOpen(false);
        setNewConcern({
          person_of_concern: "",
          reported_by: "",
          description: "",
        });
        fetchConcerns();
      }
    } catch (error) {
      console.error("Failed to create concern:", error);
    }
  };

  const handleSubmitReview = async (concernId: string) => {
    try {
      await fetch(
        `/api/compliance/low-level-concerns/${concernId}?organizationId=${organizationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: reviewStatus,
            dsl_review_notes: reviewNotes,
            escalated: reviewStatus === "escalated",
          }),
        },
      );
      setExpandedId(null);
      setReviewNotes("");
      setReviewStatus("reviewed");
      fetchConcerns();
    } catch (error) {
      console.error("Failed to submit review:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confidential Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-rose-600 text-white rounded-lg p-3 flex items-center gap-3"
      >
        <Lock className="w-5 h-5 shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-sm">CONFIDENTIAL - DSL ACCESS ONLY</p>
          <p className="text-xs text-rose-100">
            This log contains sensitive safeguarding information. Access is
            restricted to the Designated Safeguarding Lead.
          </p>
        </div>
      </motion.div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-600" />
            Low-Level Concerns Log
          </h2>
          <p className="text-slate-500 mt-1">
            Record and review low-level safeguarding concerns
          </p>
        </div>
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Concern
        </Button>
      </div>

      {/* Pattern Detection Alert */}
      {patternAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-amber-800 dark:text-amber-200">
                    Pattern Detected
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    The following individuals appear in multiple concerns:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {patternAlerts.map((alert) => (
                      <li
                        key={alert.name}
                        className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2"
                      >
                        <span className="font-semibold capitalize">
                          {alert.name}
                        </span>
                        <Badge className="bg-amber-200 text-amber-800 text-[10px]">
                          {alert.count} concerns
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(
          Object.entries(STATUS_CONFIG) as [
            LowLevelConcern["status"],
            { label: string; color: string },
          ][]
        ).map(([status, config]) => {
          const count = concerns.filter((c) => c.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <Badge className={`text-[10px] mt-1 ${config.color}`}>
                  {config.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Concerns List */}
      {concerns.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No concerns recorded</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {concerns.map((concern, idx) => {
            const isExpanded = expandedId === concern.id;
            return (
              <motion.div
                key={concern.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className={`transition-all ${
                    concern.escalated ? "border-rose-300" : ""
                  } ${isExpanded ? "ring-1 ring-purple-200" : "hover:border-purple-300"}`}
                >
                  <CardContent className="p-4">
                    <div
                      className="flex items-start justify-between gap-4 cursor-pointer"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : concern.id)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={`text-[10px] font-bold uppercase ${STATUS_CONFIG[concern.status].color}`}
                          >
                            {STATUS_CONFIG[concern.status].label}
                          </Badge>
                          {concern.escalated && (
                            <Badge className="bg-rose-100 text-rose-700 text-[10px]">
                              <ArrowUpRight className="w-3 h-3 mr-0.5" />
                              Escalated
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(concern.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {concern.person_of_concern}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 line-clamp-2">
                          {concern.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>

                    {/* Expanded DSL Review Section */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t"
                      >
                        <div className="space-y-4">
                          {/* Full description */}
                          <div>
                            <p className="text-xs font-bold uppercase text-slate-500 mb-1">
                              Full Description
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {concern.description}
                            </p>
                          </div>

                          {/* Reported by */}
                          <div>
                            <p className="text-xs font-bold uppercase text-slate-500 mb-1">
                              Reported By
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {concern.reported_by || "Not specified"}
                            </p>
                          </div>

                          {/* Existing review notes */}
                          {concern.dsl_review_notes && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                              <p className="text-xs font-bold uppercase text-purple-600 mb-1">
                                DSL Review Notes
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {concern.dsl_review_notes}
                              </p>
                              {concern.dsl_review_date && (
                                <p className="text-xs text-slate-400 mt-2">
                                  Reviewed on{" "}
                                  {formatDate(concern.dsl_review_date)}
                                  {concern.dsl_reviewer &&
                                    ` by ${concern.dsl_reviewer}`}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Review Form */}
                          {concern.status === "open" && (
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
                              <p className="text-xs font-bold uppercase text-slate-500">
                                DSL Review
                              </p>
                              <div className="space-y-2">
                                <Label>Review Notes</Label>
                                <Textarea
                                  placeholder="Enter your review notes..."
                                  rows={3}
                                  value={reviewNotes}
                                  onChange={(e) =>
                                    setReviewNotes(e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Outcome</Label>
                                <Select
                                  value={reviewStatus}
                                  onValueChange={(val) =>
                                    setReviewStatus(
                                      val as LowLevelConcern["status"],
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="reviewed">
                                      Reviewed - No Further Action
                                    </SelectItem>
                                    <SelectItem value="closed">
                                      Closed
                                    </SelectItem>
                                    <SelectItem value="escalated">
                                      Escalate to Formal Concern
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700"
                                  onClick={() => handleSubmitReview(concern.id)}
                                >
                                  Submit Review
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Concern Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Low-Level Concern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="person_of_concern">Person of Concern</Label>
              <Input
                id="person_of_concern"
                placeholder="Name of the individual"
                value={newConcern.person_of_concern}
                onChange={(e) =>
                  setNewConcern({
                    ...newConcern,
                    person_of_concern: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reported_by">Reported By</Label>
              <Input
                id="reported_by"
                placeholder="Name of the reporter"
                value={newConcern.reported_by}
                onChange={(e) =>
                  setNewConcern({
                    ...newConcern,
                    reported_by: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concern_description">Description</Label>
              <Textarea
                id="concern_description"
                placeholder="Describe the concern in detail..."
                rows={4}
                value={newConcern.description}
                onChange={(e) =>
                  setNewConcern({
                    ...newConcern,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleCreateConcern}
              >
                Record Concern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
