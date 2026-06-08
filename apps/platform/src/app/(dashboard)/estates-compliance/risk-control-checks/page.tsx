"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Loader2,
  Mic,
  RefreshCw,
  XCircle,
} from "lucide-react";

interface RiskControlCheck {
  id: string;
  title: string;
  description: string;
  domain: string;
  frequency_required: string;
  evidence_prompt?: string;
  escalation_if_failed?: string;
  next_due_date: string;
  requires_photo: boolean;
  requires_notes: boolean;
  is_overdue: boolean;
  ticket_id: string;
  ticket?: {
    ticket_number: string;
    title: string;
    priority: string;
    risk_score?: number;
    location?: string;
  } | null;
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

function statusBadge(check: RiskControlCheck): {
  label: string;
  className: string;
} {
  if (check.is_overdue) {
    return {
      label: "Overdue",
      className: "bg-red-100 text-red-800 border-red-200",
    };
  }
  return {
    label: "Due today",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  };
}

export default function RiskControlChecksPage() {
  const [checks, setChecks] = useState<RiskControlCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null);
  const [notesByCheck, setNotesByCheck] = useState<Record<string, string>>({});
  const [photoUrlsByCheck, setPhotoUrlsByCheck] = useState<Record<string, string[]>>({});
  const [savingResult, setSavingResult] = useState<string | null>(null);

  async function loadChecks() {
    setLoading(true);
    try {
      const response = await fetch("/api/estates/risk-control-checks?due=today", {
        headers: await authHeaders(),
      });

      if (!response.ok) {
        toast.error("Failed to load Risk Control Checks");
        return;
      }

      const data = await response.json();
      setChecks(data.checks || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChecks();
  }, []);

  function handlePhoto(checkId: string, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const urls = Array.from(fileList).map((file) => URL.createObjectURL(file));
    setPhotoUrlsByCheck((current) => ({
      ...current,
      [checkId]: [...(current[checkId] || []), ...urls],
    }));
  }

  async function submitResult(check: RiskControlCheck, result: "ok" | "not_ok") {
    setSavingResult(`${check.id}:${result}`);
    try {
      const response = await fetch("/api/estates/risk-control-checks", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          checkId: check.id,
          result,
          notes: notesByCheck[check.id],
          photoUrls: photoUrlsByCheck[check.id] || [],
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to save check");
        return;
      }

      toast.success(result === "ok" ? "Risk control checked OK" : "Risk escalated for review");
      setActiveCheckId(null);
      await loadChecks();
    } finally {
      setSavingResult(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl p-3 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/estates-compliance"
            className="inline-flex items-center gap-1 text-sm text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Estates
          </Link>
          <Button variant="ghost" size="sm" onClick={loadChecks}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        <div className="rounded-2xl bg-card border p-4 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">
            Today&apos;s Risk Control Checks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quick site checks linked to live helpdesk risks. Keep it simple:
            check it, take a photo if needed, tap OK or Not OK.
          </p>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading checks...
          </div>
        ) : checks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
              <h2 className="font-semibold">No Risk Control Checks due</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Anything accepted from a live ticket will appear here when it is due.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {checks.map((check) => {
              const badge = statusBadge(check);
              const expanded = activeCheckId === check.id;
              const photos = photoUrlsByCheck[check.id] || [];

              return (
                <Card
                  key={check.id}
                  className={`overflow-hidden ${
                    check.is_overdue ? "border-red-300" : "border-amber-200"
                  }`}
                >
                  <CardContent className="p-0">
                    <button
                      type="button"
                      onClick={() => setActiveCheckId(expanded ? null : check.id)}
                      className="w-full text-left p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-base leading-tight">
                            {check.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {check.ticket?.ticket_number} · {check.ticket?.title}
                          </p>
                        </div>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-slate-700">{check.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{check.domain}</Badge>
                        <Badge variant="outline">{check.frequency_required}</Badge>
                        {check.ticket?.risk_score ? (
                          <Badge variant="outline">Risk {check.ticket.risk_score}/25</Badge>
                        ) : null}
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t bg-card p-4 space-y-4">
                        {check.evidence_prompt && (
                          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
                            {check.evidence_prompt}
                          </div>
                        )}

                        <label className="block">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Take or add photo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            className="mt-2 block w-full text-sm"
                            onChange={(event) => handlePhoto(check.id, event.target.files)}
                          />
                        </label>

                        {photos.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {photos.map((url) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={url}
                                src={url}
                                alt="Risk control evidence"
                                className="aspect-square rounded-lg object-cover border"
                              />
                            ))}
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-medium flex items-center gap-2 mb-2">
                            <Mic className="h-4 w-4" />
                            Note
                          </label>
                          <Textarea
                            value={notesByCheck[check.id] || ""}
                            onChange={(event) =>
                              setNotesByCheck((current) => ({
                                ...current,
                                [check.id]: event.target.value,
                              }))
                            }
                            placeholder="Optional note. Use your phone's microphone for voice typing."
                            rows={2}
                          />
                        </div>

                        {check.escalation_if_failed && (
                          <div className="text-xs text-orange-700 flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            {check.escalation_if_failed}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            className="h-14 bg-green-600 hover:bg-green-700 text-primary-foreground text-base"
                            onClick={() => submitResult(check, "ok")}
                            disabled={Boolean(savingResult)}
                          >
                            {savingResult === `${check.id}:ok` ? (
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 mr-2" />
                            )}
                            OK
                          </Button>
                          <Button
                            className="h-14 text-base"
                            variant="destructive"
                            onClick={() => submitResult(check, "not_ok")}
                            disabled={Boolean(savingResult)}
                          >
                            {savingResult === `${check.id}:not_ok` ? (
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="h-5 w-5 mr-2" />
                            )}
                            Not OK
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
