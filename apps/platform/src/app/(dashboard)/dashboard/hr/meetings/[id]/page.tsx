"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Play,
  FileText,
  Calendar,
  MapPin,
  User,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  MeetingStatusBadge,
  MeetingPreparationPack,
} from "@/components/meetings";
import type {
  Meeting,
  MeetingTemplate,
  MeetingChecklistItem,
} from "@/lib/meetings";

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [template, setTemplate] = useState<MeetingTemplate | null>(null);
  const [checklistItems, setChecklistItems] = useState<MeetingChecklistItem[]>(
    [],
  );
  const [minutes, setMinutes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [generatingMinutes, setGeneratingMinutes] = useState(false);

  useEffect(() => {
    if (!organizationId || !meetingId) return;
    fetch(`/api/meetings/${meetingId}?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => {
        setMeeting(data.meeting);
        setTemplate(data.template);
        setChecklistItems(data.checklist_items || []);
        setMinutes(data.minutes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId, meetingId]);

  const handleStartMeeting = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        router.push(`/dashboard/hr/meetings/${meetingId}/live`);
      }
    } catch (err) {
      console.error("Failed to start meeting:", err);
    } finally {
      setStarting(false);
    }
  };

  const handleGenerateMinutes = async () => {
    setGeneratingMinutes(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/minutes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        router.push(`/dashboard/hr/meetings/${meetingId}/minutes`);
      }
    } catch (err) {
      console.error("Failed to generate minutes:", err);
    } finally {
      setGeneratingMinutes(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">Loading meeting...</div>
    );
  }

  if (!meeting || !template) {
    return (
      <div className="p-12 text-center text-slate-400">Meeting not found</div>
    );
  }

  const tickedCount = checklistItems.filter((i) => i.manually_ticked).length;
  const totalCount = checklistItems.length;

  return (
    <div className="p-6 md:p-8 min-h-screen max-w-[1000px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/hr/meetings">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {template.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <MeetingStatusBadge status={meeting.status} />
            {meeting.compliance_score !== null && (
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {meeting.compliance_score}% compliance
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meeting info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
      >
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <User size={16} className="text-slate-400" />
            <span className="font-semibold">Attendee:</span>
            {meeting.attendee_name}
            {meeting.attendee_role && ` (${meeting.attendee_role})`}
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Calendar size={16} className="text-slate-400" />
            <span className="font-semibold">Date:</span>
            {new Date(meeting.scheduled_at).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          {meeting.location && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <MapPin size={16} className="text-slate-400" />
              <span className="font-semibold">Location:</span>
              {meeting.location}
            </div>
          )}
          {meeting.purpose && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <FileText size={16} className="text-slate-400" />
              <span className="font-semibold">Purpose:</span>
              {meeting.purpose}
            </div>
          )}
        </div>

        {/* Checklist summary for completed meetings */}
        {meeting.status === "completed" && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Checklist: {tickedCount}/{totalCount} items covered
              </span>
              <div className="w-32 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{
                    width: `${totalCount > 0 ? (tickedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Actions based on status */}
      {meeting.status === "scheduled" && (
        <>
          {/* Preparation pack */}
          <MeetingPreparationPack
            guide={template.preparation_guide}
            templateName={template.name}
          />

          {/* Start meeting button */}
          <Button
            onClick={handleStartMeeting}
            disabled={starting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2 w-full h-14 text-lg"
          >
            {starting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Play size={20} />
                Start Meeting
              </>
            )}
          </Button>
        </>
      )}

      {meeting.status === "in_progress" && (
        <Link href={`/dashboard/hr/meetings/${meetingId}/live`}>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl gap-2 w-full h-14 text-lg">
            <Play size={20} />
            Continue Meeting
          </Button>
        </Link>
      )}

      {meeting.status === "completed" && (
        <div className="flex gap-3">
          {minutes ? (
            <Link
              href={`/dashboard/hr/meetings/${meetingId}/minutes`}
              className="flex-1"
            >
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2 w-full h-12">
                <FileText size={18} />
                View Minutes
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleGenerateMinutes}
              disabled={generatingMinutes}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2 h-12"
            >
              {generatingMinutes ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FileText size={18} />
                  Generate Minutes
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
