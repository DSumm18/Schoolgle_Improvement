"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ComplianceApproval,
  ApprovalStage,
  ApprovalDecision,
} from "@/lib/compliance/types";

interface ApprovalWorkflowProps {
  organizationId: string;
  itemId: string;
  onApprovalChange: () => void;
}

const STAGE_LABELS: Record<ApprovalStage, string> = {
  author: "Author",
  slt_review: "SLT Review",
  trust_review: "Trust Review",
  governor_approval: "Governor Approval",
};

const STAGE_ORDER: ApprovalStage[] = [
  "author",
  "slt_review",
  "trust_review",
  "governor_approval",
];

const DECISION_CONFIG: Record<
  ApprovalDecision,
  { label: string; color: string; icon: any }
> = {
  pending: {
    label: "Pending",
    color: "bg-slate-100 text-slate-600",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-100 text-rose-700",
    icon: XCircle,
  },
};

export default function ApprovalWorkflow({
  organizationId,
  itemId,
  onApprovalChange,
}: ApprovalWorkflowProps) {
  const [approvals, setApprovals] = useState<ComplianceApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, [organizationId, itemId]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/compliance/approvals?organizationId=${organizationId}&itemId=${itemId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setApprovals(data.approvals || []);
      }
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentStage = (): ApprovalStage | null => {
    for (const stage of STAGE_ORDER) {
      const approval = approvals.find((a) => a.stage === stage);
      if (!approval || approval.decision === "pending") {
        return stage;
      }
      if (approval.decision === "rejected") {
        return stage;
      }
    }
    return null;
  };

  const handleDecision = async (decision: "approved" | "rejected") => {
    const stage = currentStage();
    if (!stage) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/compliance/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          itemId,
          stage,
          decision,
          decision_notes: notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit decision");
      }

      setNotes("");
      fetchApprovals();
      onApprovalChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
        </CardContent>
      </Card>
    );
  }

  const activeStage = currentStage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Approval Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline stages */}
        <div className="space-y-3">
          {STAGE_ORDER.map((stage, idx) => {
            const approval = approvals.find((a) => a.stage === stage);
            const decision = approval?.decision || "pending";
            const config = DECISION_CONFIG[decision];
            const StageIcon = config.icon;
            const isActive = stage === activeStage;

            return (
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3 rounded-lg border transition-all ${
                  isActive
                    ? "border-purple-300 bg-purple-50/50 dark:bg-purple-900/10"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${config.color}`}>
                      <StageIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {STAGE_LABELS[stage]}
                      </p>
                      {approval?.approver_role && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {approval.approver_role}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${config.color}`}>
                      {config.label}
                    </Badge>
                    {approval?.decided_at && (
                      <span className="text-[10px] text-slate-400">
                        {formatDate(approval.decided_at)}
                      </span>
                    )}
                  </div>
                </div>
                {approval?.decision_notes && (
                  <p className="text-xs text-slate-600 mt-2 pl-9 italic">
                    "{approval.decision_notes}"
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Action panel for current stage */}
        {activeStage && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-semibold">
              Your Decision - {STAGE_LABELS[activeStage]}
            </h4>

            {error && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-xs text-rose-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="approval_notes" className="text-xs">
                Notes (optional)
              </Label>
              <Textarea
                id="approval_notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any comments about your decision..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleDecision("approved")}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                onClick={() => handleDecision("rejected")}
                disabled={submitting}
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-300 hover:bg-rose-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Return for Changes
              </Button>
            </div>
          </div>
        )}

        {!activeStage && approvals.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">
              All approval stages complete
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
