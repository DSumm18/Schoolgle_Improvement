"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  RefreshCw,
  FileText,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import { MeetingSignaturePad } from "@/components/meetings";

export default function MeetingMinutesPage() {
  const params = useParams();
  const meetingId = params.id as string;
  const { organization, session, user } = useAuth();
  const organizationId = organization?.id || "";

  const [meeting, setMeeting] = useState<any>(null);
  const [minutes, setMinutes] = useState<any>(null);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalising, setFinalising] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [signing, setSigning] = useState(false);

  const requestHeaders = useMemo(
    () =>
      session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    [session?.access_token],
  );

  useEffect(() => {
    if (!organizationId || !meetingId || !session?.access_token) return;
    Promise.all([
      fetch(`/api/meetings/${meetingId}?organizationId=${organizationId}`, {
        headers: requestHeaders,
      }).then((r) => r.json()),
      fetch(
        `/api/meetings/${meetingId}/minutes?organizationId=${organizationId}`,
        { headers: requestHeaders },
      ).then((r) => r.json()),
    ])
      .then(([meetingData, minutesData]) => {
        setMeeting(meetingData.meeting);
        setMinutes(minutesData.minutes);
        setSignatures(minutesData.signatures || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId, meetingId, requestHeaders, session?.access_token]);

  const handleFinalise = async () => {
    setFinalising(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/minutes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...requestHeaders },
        body: JSON.stringify({ organizationId, status: "finalised" }),
      });
      if (res.ok) {
        const data = await res.json();
        setMinutes(data.minutes);
      }
    } catch (err) {
      console.error("Failed to finalise minutes:", err);
    } finally {
      setFinalising(false);
    }
  };

  const handleReopenDraft = async () => {
    setReopening(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/minutes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...requestHeaders },
        body: JSON.stringify({ organizationId, status: "draft" }),
      });
      if (res.ok) {
        const data = await res.json();
        setMinutes(data.minutes);
      }
    } catch (err) {
      console.error("Failed to reopen minutes:", err);
    } finally {
      setReopening(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/minutes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...requestHeaders },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMinutes(data.minutes);
      }
    } catch (err) {
      console.error("Failed to regenerate minutes:", err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSign = async (
    role: "leader" | "attendee",
    signatureData: string,
  ) => {
    setSigning(true);
    try {
      const signerName =
        role === "leader"
          ? (user as any)?.displayName || user?.email || "Meeting Leader"
          : meeting?.attendee_name || "Attendee";

      const res = await fetch(`/api/meetings/${meetingId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...requestHeaders },
        body: JSON.stringify({
          organizationId,
          signer_name: signerName,
          signer_role: role,
          signature_data: signatureData,
          signature_method: "canvas",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSignatures((prev) => [...prev, data.signature]);
      }
    } catch (err) {
      console.error("Failed to save signature:", err);
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    if (!minutes?.html) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(minutes.html);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  };

  const handleDownloadPdf = () => {
    // Use print dialog with "Save as PDF" option
    handlePrint();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-12 text-center text-slate-500 dark:bg-slate-950 dark:text-slate-300">
        Loading minutes...
      </div>
    );
  }

  if (!minutes) {
    return (
      <div className="min-h-screen bg-slate-50 p-12 text-center text-slate-500 dark:bg-slate-950 dark:text-slate-300">
        No minutes generated yet.{" "}
        <Link
          href={`/dashboard/hr/meetings/${meetingId}`}
          className="text-indigo-500 hover:underline"
        >
          Go back
        </Link>
      </div>
    );
  }

  const isFinalised = minutes.status === "finalised";
  const leaderName =
    (user as any)?.displayName || user?.email || "Meeting Leader";
  const attendeeName = meeting?.attendee_name || "Attendee";
  const existingSignatureSlots = signatures.map((s: any) => ({
    name: s.signer_name,
    role: s.signer_role,
    signed: true,
    signatureData: s.signature_data,
    signedAt: s.signed_at,
  }));

  const bothSigned =
    existingSignatureSlots.some((s: any) => s.role === "leader") &&
    existingSignatureSlots.some((s: any) => s.role === "attendee");

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:px-8">
      <div className="mx-auto max-w-[1100px] space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/95 md:flex md:items-center md:justify-between md:p-5">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/hr/meetings/${meetingId}`}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Meeting Minutes
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {isFinalised ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Check size={12} />
                  Finalised
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  Draft
                </span>
              )}
              {bothSigned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Check size={12} />
                  Signed by both parties
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
          {isFinalised ? (
            <Button
              variant="outline"
              onClick={handleReopenDraft}
              disabled={reopening}
              className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 gap-2"
            >
              <RefreshCw
                size={14}
                className={reopening ? "animate-spin" : ""}
              />
              Reopen draft
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 gap-2"
              >
                <RefreshCw
                  size={14}
                  className={regenerating ? "animate-spin" : ""}
                />
                Regenerate
              </Button>
              <Button
                onClick={handleFinalise}
                disabled={finalising}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2"
              >
                {finalising ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Finalise
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 gap-2"
          >
            <Printer size={14} />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 gap-2"
          >
            <Download size={14} />
            PDF
          </Button>
        </div>
      </div>

      {/* Minutes preview */}
      <div className="rounded-3xl border border-slate-200 bg-slate-200/70 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {minutes.html ? (
          <iframe
            srcDoc={minutes.html}
            className="min-h-[760px] w-full rounded-2xl border-0 bg-white shadow-inner"
            title="Meeting Minutes Preview"
          />
        ) : (
          <div className="rounded-2xl bg-white p-12 text-center text-slate-400 dark:bg-slate-900 dark:text-slate-500">
            <FileText size={32} className="mx-auto mb-3 opacity-50" />
            No content available
          </div>
        )}
      </div>

      {/* Digital Signatures */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <MeetingSignaturePad
          leaderName={leaderName}
          attendeeName={attendeeName}
          onSign={handleSign}
          existingSignatures={existingSignatureSlots}
          disabled={signing}
        />
      </div>

      {/* Finalise + Sign summary */}
      {bothSigned && !isFinalised && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5 text-center">
          <Check size={24} className="mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
            Both parties have signed
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-4">
            Finalise the minutes to lock them and prevent further changes.
          </p>
          <Button
            onClick={handleFinalise}
            disabled={finalising}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
          >
            {finalising ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Finalise Minutes
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}
