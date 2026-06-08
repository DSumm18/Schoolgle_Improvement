"use client";

import useSWR from "swr";
import { mutate } from "swr";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { fetcher } from "@/lib/fetchers";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

interface RiskControlRecommendation {
  id: string;
  title: string;
  description: string;
  domain: string;
  frequency: string;
  requiresPhoto: boolean;
  escalationIfFailed: string;
}

interface RiskControlDecision {
  recommendation_id: string;
  status: "accepted" | "declined";
}

interface RiskControlCheck {
  id: string;
  title: string;
  status: string;
  next_due_date: string;
}

interface RiskControlResponse {
  riskScore: number;
  suggestions: {
    domain: string;
    recommendations: RiskControlRecommendation[];
  };
  decisions: RiskControlDecision[];
  checks: RiskControlCheck[];
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export function RiskControlReviewPanel({ ticketId }: { ticketId: string }) {
  const apiUrl = `/api/estates/helpdesk/${ticketId}/risk-controls`;
  const { data, isLoading } = useSWR<RiskControlResponse>(apiUrl, fetcher);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(new Set());
  const [declinedReason, setDeclinedReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const decisionsById = new Map(
    (data?.decisions || []).map((decision) => [
      decision.recommendation_id,
      decision.status,
    ]),
  );

  function toggleAccepted(id: string) {
    setAcceptedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setDeclinedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function toggleDeclined(id: string) {
    setDeclinedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setAcceptedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  async function saveDecisions() {
    if (acceptedIds.size === 0 && declinedIds.size === 0) {
      toast.error("Choose at least one control to accept or decline");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          acceptedRecommendationIds: Array.from(acceptedIds),
          declinedRecommendationIds: Array.from(declinedIds),
          declinedReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to save Risk Control Checks");
        return;
      }

      setAcceptedIds(new Set());
      setDeclinedIds(new Set());
      setDeclinedReason("");
      await mutate(apiUrl);
      toast.success("Risk Control Check decisions saved");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Loading Risk Control suggestions...
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-orange-600" />
              AI Risk Control Suggestions
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Suggested temporary controls for this {data.suggestions.domain} risk.
              Accepting creates simple checks for the daily site list.
            </p>
          </div>
          <Badge className="bg-orange-100 text-orange-800">
            Risk {data.riskScore}/25
          </Badge>
        </div>

        <div className="space-y-3">
          {data.suggestions.recommendations.map((recommendation) => {
            const savedDecision = decisionsById.get(recommendation.id);
            const isAccepted =
              acceptedIds.has(recommendation.id) || savedDecision === "accepted";
            const isDeclined =
              declinedIds.has(recommendation.id) || savedDecision === "declined";

            return (
              <div
                key={recommendation.id}
                className="rounded-xl border bg-card p-3 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{recommendation.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recommendation.description}
                    </p>
                  </div>
                  <Badge variant="outline">{recommendation.frequency}</Badge>
                </div>
                <div className="text-xs text-orange-700 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {recommendation.escalationIfFailed}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className={
                      isAccepted
                        ? "bg-green-600 hover:bg-green-700 text-primary-foreground"
                        : ""
                    }
                    variant={isAccepted ? "default" : "outline"}
                    disabled={savedDecision === "accepted"}
                    onClick={() => toggleAccepted(recommendation.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {savedDecision === "accepted" ? "Accepted" : "Accept"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={isDeclined ? "destructive" : "outline"}
                    disabled={savedDecision === "declined"}
                    onClick={() => toggleDeclined(recommendation.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {savedDecision === "declined" ? "Declined" : "Decline"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {declinedIds.size > 0 && (
          <Textarea
            value={declinedReason}
            onChange={(event) => setDeclinedReason(event.target.value)}
            placeholder="Optional reason for declined controls. You can use voice typing on mobile."
            rows={2}
          />
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            onClick={saveDecisions}
            disabled={submitting || (acceptedIds.size === 0 && declinedIds.size === 0)}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ClipboardCheck className="h-4 w-4 mr-2" />
            )}
            Save Risk Controls
          </Button>
          {data.checks.length > 0 && (
            <Link
              href="/estates-compliance/risk-control-checks"
              className="text-sm text-teal-700 hover:underline"
            >
              View {data.checks.length} active Risk Control Check
              {data.checks.length === 1 ? "" : "s"}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
