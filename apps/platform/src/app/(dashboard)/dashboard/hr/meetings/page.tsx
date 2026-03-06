"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ClipboardCheck,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import { MeetingStatusBadge } from "@/components/meetings";
import type { Meeting } from "@/lib/meetings";

export default function MeetingsLandingPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    total: 0,
    scheduled: 0,
    in_progress: 0,
    completed: 0,
  });

  useEffect(() => {
    if (!organizationId) return;
    fetch(`/api/meetings?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => {
        setMeetings(data.meetings || []);
        setCounts(
          data.counts || {
            total: 0,
            scheduled: 0,
            in_progress: 0,
            completed: 0,
          },
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId]);

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
            <Sparkles size={14} className="animate-pulse" />
            HR & People
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Meeting Companion
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Guided HR meetings with compliance checklists and auto-generated
            minutes
          </p>
        </div>
        <Link href="/dashboard/hr/meetings/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2">
            <Plus size={16} />
            New Meeting
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: counts.total,
            icon: ClipboardCheck,
            color: "blue",
          },
          {
            label: "Scheduled",
            value: counts.scheduled,
            icon: Calendar,
            color: "blue",
          },
          {
            label: "In Progress",
            value: counts.in_progress,
            icon: Clock,
            color: "amber",
          },
          {
            label: "Completed",
            value: counts.completed,
            icon: CheckCircle2,
            color: "green",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className="text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Meetings list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Recent Meetings
          </h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck
              size={48}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
            />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              No meetings yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Create your first meeting to get started with guided HR
              conversations
            </p>
            <Link href="/dashboard/hr/meetings/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2">
                <Plus size={16} />
                New Meeting
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {meetings.map((meeting: any) => (
              <Link
                key={meeting.id}
                href={`/dashboard/hr/meetings/${meeting.id}`}
                className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {meeting.meeting_templates?.name || "Meeting"}
                    </h3>
                    <MeetingStatusBadge status={meeting.status} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {meeting.attendee_name}
                    {meeting.attendee_role && ` — ${meeting.attendee_role}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(meeting.scheduled_at).toLocaleDateString(
                      "en-GB",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                    {meeting.location && ` — ${meeting.location}`}
                  </p>
                </div>
                {meeting.compliance_score !== null && (
                  <div className="text-right ml-4">
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {meeting.compliance_score}%
                    </p>
                    <p className="text-xs text-slate-400">compliance</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
