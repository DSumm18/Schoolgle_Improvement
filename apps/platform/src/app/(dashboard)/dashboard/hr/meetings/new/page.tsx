"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  User,
  MapPin,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import { MeetingTemplateCard } from "@/components/meetings";
import type { MeetingTemplate } from "@/lib/meetings";

type Step = "template" | "details";

export default function NewMeetingPage() {
  const router = useRouter();
  const { user, organization } = useAuth();
  const organizationId = organization?.id || "";

  const [step, setStep] = useState<Step>("template");
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<MeetingTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form fields
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeRole, setAttendeeRole] = useState("");
  const [purpose, setPurpose] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetch(`/api/meetings/templates?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId]);

  const handleSelectTemplate = (template: MeetingTemplate) => {
    setSelectedTemplate(template);
    setStep("details");
  };

  const handleCreate = async () => {
    if (!selectedTemplate || !attendeeName || !scheduledDate) return;
    setCreating(true);

    try {
      const scheduled_at = new Date(
        `${scheduledDate}T${scheduledTime}`,
      ).toISOString();
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          leaderId: user?.id,
          template_id: selectedTemplate.id,
          attendee_name: attendeeName,
          attendee_role: attendeeRole || undefined,
          purpose: purpose || undefined,
          scheduled_at,
          location: location || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.meeting) {
        router.push(`/dashboard/hr/meetings/${data.meeting.id}`);
      }
    } catch (err) {
      console.error("Failed to create meeting:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 min-h-screen max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/hr/meetings">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            New Meeting
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {step === "template"
              ? "Choose a meeting template"
              : `${selectedTemplate?.name} — Enter meeting details`}
          </p>
        </div>
      </div>

      {/* Step: Template selection */}
      {step === "template" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              Loading templates...
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <MeetingTemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelectTemplate}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Step: Meeting details */}
      {step === "details" && selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6 max-w-2xl"
        >
          <button
            onClick={() => setStep("template")}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft size={14} />
            Back to templates
          </button>

          {/* Template summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800">
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">
              {selectedTemplate.name}
            </h3>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
              {selectedTemplate.compliance_items?.length || 0} compliance items
              will be added to your checklist
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            {/* Attendee */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                <User size={14} />
                Attendee Name *
              </label>
              <input
                type="text"
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                <User size={14} />
                Attendee Role
              </label>
              <input
                type="text"
                value={attendeeRole}
                onChange={(e) => setAttendeeRole(e.target.value)}
                placeholder="e.g. Teaching Assistant, Office Manager"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                <FileText size={14} />
                Purpose / Reason
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Return to work after 3-day absence"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  <Calendar size={14} />
                  Date *
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  <Calendar size={14} />
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                <MapPin size={14} />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Head's Office, Meeting Room 2"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleCreate}
            disabled={!attendeeName || !scheduledDate || creating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2 w-full h-12 text-base"
          >
            {creating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Schedule Meeting
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
