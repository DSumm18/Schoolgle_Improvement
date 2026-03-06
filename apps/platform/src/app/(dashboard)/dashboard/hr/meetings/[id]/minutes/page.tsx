"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";

export default function MeetingMinutesPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [minutes, setMinutes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [finalising, setFinalising] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!organizationId || !meetingId) return;
    fetch(`/api/meetings/${meetingId}/minutes?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => setMinutes(data.minutes))
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

  const handlePrint = () => {
    if (!minutes?.html) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(minutes.html);
      win.document.close();
      win.print();
    }
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
            <p className="text-sm text-slate-500">
              {isFinalised ? (
                <span className="text-green-600 font-semibold">Finalised</span>
              ) : (
                <span className="text-amber-600 font-semibold">Draft</span>
              )}
            </p>
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
            <Download size={14} />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Minutes preview */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {minutes.html ? (
          <iframe
            srcDoc={minutes.html}
            className="w-full min-h-[800px] border-0"
            title="Meeting Minutes Preview"
          />
        ) : (
          <div className="p-12 text-center text-slate-400">
            No content available
          </div>
        )}
      </div>
    </div>
  );
}
