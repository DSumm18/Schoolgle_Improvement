"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { organization, user } = useAuth();
  const organizationId = organization?.id || "";

  const [meeting, setMeeting] = useState<any>(null);
  const [minutes, setMinutes] = useState<any>(null);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalising, setFinalising] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!organizationId || !meetingId) return;
    Promise.all([
      fetch(`/api/meetings/${meetingId}?organizationId=${organizationId}`).then(
        (r) => r.json(),
      ),
      fetch(
        `/api/meetings/${meetingId}/minutes?organizationId=${organizationId}`,
      ).then((r) => r.json()),
    ])
      .then(([meetingData, minutesData]) => {
        setMeeting(meetingData.meeting);
        setMinutes(minutesData.minutes);
        setSignatures(minutesData.signatures || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId, meetingId]);

  const handleFinalise = async () => {
    setFinalising(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/minutes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/minutes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          ? user?.displayName || user?.email || "Meeting Leader"
          : meeting?.attendee_name || "Attendee";

      const res = await fetch(`/api/meetings/${meetingId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <div className="p-12 text-center text-slate-400">Loading minutes...</div>
    );
  }

  if (!minutes) {
    return (
      <div className="p-12 text-center text-slate-400">
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
  const leaderName = user?.displayName || user?.email || "Meeting Leader";
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
    <div className="p-6 md:p-8 min-h-screen max-w-[1000px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/hr/meetings/${meetingId}`}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Meeting Minutes
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {isFinalised ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <Check size={12} />
                  Finalised
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Draft
                </span>
              )}
              {bothSigned && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Check size={12} />
                  Signed by both parties
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isFinalised && (
            <>
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="rounded-xl gap-2"
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
            className="rounded-xl gap-2"
          >
            <Printer size={14} />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            className="rounded-xl gap-2"
          >
            <Download size={14} />
            PDF
          </Button>
        </div>
      </div>

      {/* Minutes preview */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {minutes.html ? (
          <iframe
            srcDoc={minutes.html}
            className="w-full min-h-[700px] border-0"
            title="Meeting Minutes Preview"
          />
        ) : (
          <div className="p-12 text-center text-slate-400">
            <FileText size={32} className="mx-auto mb-3 opacity-50" />
            No content available
          </div>
        )}
      </div>

      {/* Digital Signatures */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
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
  );
}
