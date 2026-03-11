"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  FileText,
  Clock,
  Users,
  Shield,
  Star,
  Building2,
  ShieldCheck,
  BookOpen,
  Heart,
  Users2,
  Settings,
  Plus,
  X,
  Check,
  ChevronDown,
  Loader2,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import { StaffPicker } from "@/components/meetings";
import { TEMPLATE_CATEGORIES } from "@/lib/meetings/types";
import type { MeetingTemplate, TemplateCategory } from "@/lib/meetings/types";

// Map icon name strings from TEMPLATE_CATEGORIES to actual components
const ICON_MAP: Record<string, any> = {
  Users,
  Shield,
  Star,
  Building2,
  Building: Building2,
  ShieldCheck,
  BookOpen,
  Heart,
  Users2,
  Settings,
  Calendar,
  Plus,
};

// Color utilities for category accents
const COLOR_MAP: Record<
  string,
  { bg: string; border: string; text: string; ring: string; dot: string }
> = {
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    ring: "ring-blue-500",
    dot: "bg-blue-500",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    ring: "ring-purple-500",
    dot: "bg-purple-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    ring: "ring-amber-500",
    dot: "bg-amber-500",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    ring: "ring-cyan-500",
    dot: "bg-cyan-500",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    ring: "ring-red-500",
    dot: "bg-red-500",
  },
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    ring: "ring-green-500",
    dot: "bg-green-500",
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    ring: "ring-pink-500",
    dot: "bg-pink-500",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    ring: "ring-orange-500",
    dot: "bg-orange-500",
  },
  slate: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    text: "text-slate-400",
    ring: "ring-slate-500",
    dot: "bg-slate-500",
  },
  gray: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    text: "text-gray-400",
    ring: "ring-gray-500",
    dot: "bg-gray-500",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    text: "text-indigo-400",
    ring: "ring-indigo-500",
    dot: "bg-indigo-500",
  },
};

const HR_CATEGORIES: TemplateCategory[] = ["hr"];

const LOCATION_SUGGESTIONS = [
  "Head Teacher's Office",
  "Staff Room",
  "Meeting Room",
  "Virtual",
];

interface Attendee {
  staff_id: string | null;
  attendee_name: string;
  attendee_role: string;
  is_primary: boolean;
  email?: string;
}

type Step = 1 | 2 | 3;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function NewMeetingPage() {
  const router = useRouter();
  const { user, organization } = useAuth();
  const organizationId = organization?.id || "";

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [selectedCategory, setSelectedCategory] =
    useState<TemplateCategory | null>(null);
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<MeetingTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<MeetingTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creating, setCreating] = useState(false);

  // Step 3 form fields
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [purpose, setPurpose] = useState("");

  const isHrTemplate = selectedCategory
    ? HR_CATEGORIES.includes(selectedCategory)
    : false;

  // Count templates per category from all templates
  const templateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTemplates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [allTemplates]);

  // Fetch all templates on mount for counts
  useEffect(() => {
    if (!organizationId) return;
    fetch(`/api/meetings/templates?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => setAllTemplates(data.templates || []))
      .catch(console.error);
  }, [organizationId]);

  // Fetch filtered templates when category is selected
  useEffect(() => {
    if (!selectedCategory || !organizationId) return;
    setLoadingTemplates(true);
    fetch(
      `/api/meetings/templates?organizationId=${organizationId}&category=${selectedCategory}`,
    )
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(console.error)
      .finally(() => setLoadingTemplates(false));
  }, [selectedCategory, organizationId]);

  const goToStep = (newStep: Step) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const handleSelectCategory = (cat: TemplateCategory) => {
    setSelectedCategory(cat);
    goToStep(2);
  };

  const handleSelectTemplate = (template: MeetingTemplate) => {
    setSelectedTemplate(template);
    setPurpose(template.description || "");
    setAttendees([]);
    goToStep(3);
  };

  const handleAddAttendee = (staff: {
    id: string;
    name: string;
    role: string;
    email?: string;
  }) => {
    const newAttendee: Attendee = {
      staff_id: staff.id.startsWith("external-") ? null : staff.id,
      attendee_name: staff.name,
      attendee_role: staff.role,
      is_primary: isHrTemplate ? true : attendees.length === 0,
      email: staff.email,
    };

    if (isHrTemplate) {
      // HR templates: single primary attendee (replace)
      setAttendees([newAttendee]);
    } else {
      setAttendees((prev) => [...prev, newAttendee]);
    }
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Ensure at least one is primary
      if (next.length > 0 && !next.some((a) => a.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!selectedTemplate || attendees.length === 0 || !scheduledDate) return;
    setCreating(true);

    try {
      const scheduledAt = new Date(
        `${scheduledDate}T${scheduledTime}`,
      ).toISOString();
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          templateId: selectedTemplate.id,
          attendees: attendees.map((a) => ({
            staff_id: a.staff_id,
            attendee_name: a.attendee_name,
            attendee_role: a.attendee_role,
            is_primary: a.is_primary,
          })),
          scheduledAt,
          location: location || undefined,
          purpose: purpose || undefined,
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

  const leaderName = user?.user_metadata?.full_name || user?.email || "You";
  const leaderRole = user?.user_metadata?.job_title || "Meeting Leader";

  const canCreate = attendees.length > 0 && scheduledDate;

  return (
    <div className="p-6 md:p-8 min-h-screen max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
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
            {step === 1 && "Choose a meeting category"}
            {step === 2 &&
              `${TEMPLATE_CATEGORIES.find((c) => c.value === selectedCategory)?.label || ""} — Select a template`}
            {step === 3 && `${selectedTemplate?.name} — Enter meeting details`}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                s === step
                  ? "bg-blue-600 text-white ring-4 ring-blue-600/20"
                  : s < step
                    ? "bg-blue-600/20 text-blue-400"
                    : "bg-slate-700 text-slate-500"
              }`}
            >
              {s < step ? <Check size={14} /> : s}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                s === step ? "text-blue-400" : "text-slate-500"
              }`}
            >
              {s === 1 ? "Category" : s === 2 ? "Template" : "Details"}
            </span>
            {s < 3 && (
              <div
                className={`w-8 h-px mx-1 ${
                  s < step ? "bg-blue-600/40" : "bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait" custom={direction}>
        {/* Step 1: Choose Category */}
        {step === 1 && (
          <motion.div
            key="step-1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon] || Calendar;
                const colors = COLOR_MAP[cat.color] || COLOR_MAP.gray;
                const count = templateCounts[cat.value] || 0;

                return (
                  <button
                    key={cat.value}
                    onClick={() => handleSelectCategory(cat.value)}
                    className={`group relative rounded-2xl border ${colors.border} ${colors.bg} p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]`}
                  >
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${colors.bg} ${colors.text} mb-3`}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div className="text-sm font-semibold text-slate-100 mb-1">
                      {cat.label}
                    </div>
                    <div className="text-xs text-slate-500">
                      {count} {count === 1 ? "template" : "templates"}
                    </div>
                    <ArrowRight
                      size={14}
                      className="absolute top-4 right-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 2: Choose Template */}
        {step === 2 && (
          <motion.div
            key="step-2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <button
              onClick={() => goToStep(1)}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-5 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to categories
            </button>

            {loadingTemplates ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Loading templates...
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => {
                  const checklistCount = template.compliance_items?.length || 0;
                  const catColors =
                    COLOR_MAP[
                      TEMPLATE_CATEGORIES.find(
                        (c) => c.value === template.category,
                      )?.color || "gray"
                    ] || COLOR_MAP.gray;

                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="group w-full text-left rounded-2xl border border-slate-700 bg-slate-800/50 p-5 hover:border-slate-600 hover:bg-slate-800 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-100 mb-1">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {checklistCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Check size={12} className={catColors.text} />
                                {checklistCount} checklist{" "}
                                {checklistCount === 1 ? "item" : "items"}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight
                          size={16}
                          className="text-slate-600 mt-1 group-hover:text-slate-400 transition-colors shrink-0"
                        />
                      </div>
                    </button>
                  );
                })}

                {templates.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No templates found in this category.
                  </div>
                )}

                {/* Custom template option */}
                <button
                  onClick={() => {
                    // Create a minimal custom template placeholder
                    handleSelectTemplate({
                      id: "",
                      name: "Custom Meeting",
                      category: selectedCategory || "custom",
                      description: "",
                      opening_script: [],
                      closing_script: [],
                      compliance_items: [],
                      preparation_guide: {
                        context_prompts: [],
                        documents_needed: [],
                        key_phrases: [],
                        policy_refs: [],
                      },
                      is_custom: true,
                      organization_id: organizationId,
                      created_by: user?.id || null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    });
                  }}
                  className="w-full text-left rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-5 hover:border-slate-500 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 text-slate-400">
                      <Plus size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-300">
                        Create custom meeting
                      </h3>
                      <p className="text-xs text-slate-500">
                        Start from scratch without a template
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Meeting Details */}
        {step === 3 && selectedTemplate && (
          <motion.div
            key="step-3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-5 max-w-2xl mx-auto"
          >
            <button
              onClick={() => goToStep(2)}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to templates
            </button>

            {/* Template summary */}
            {selectedTemplate.name !== "Custom Meeting" && (
              <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <FileText size={14} className="text-blue-400" />
                  {selectedTemplate.name}
                </div>
                {(selectedTemplate.compliance_items?.length || 0) > 0 && (
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    {selectedTemplate.compliance_items.length} compliance items
                    will be added to your checklist
                  </p>
                )}
              </div>
            )}

            {/* Form */}
            <div className="space-y-5 bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              {/* Attendees */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-3">
                  <Users size={14} className="text-blue-400" />
                  {isHrTemplate ? "Attendee *" : "Attendees *"}
                </label>

                {/* Selected attendees */}
                {attendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {attendees.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-lg bg-slate-700/50 border border-slate-600 px-3 py-2"
                      >
                        <User size={14} className="text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-200 truncate">
                            {att.attendee_name}
                          </div>
                          {att.attendee_role && (
                            <div className="text-xs text-slate-500 truncate">
                              {att.attendee_role}
                            </div>
                          )}
                        </div>
                        {att.is_primary && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0">
                            Primary
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveAttendee(idx)}
                          className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Staff Picker: show if HR and no attendee, or if not HR */}
                {(isHrTemplate && attendees.length === 0) || !isHrTemplate ? (
                  <StaffPicker
                    organizationId={organizationId}
                    onSelect={handleAddAttendee}
                    placeholder={
                      isHrTemplate
                        ? "Search for staff member..."
                        : "Add attendee..."
                    }
                    excludeIds={attendees
                      .map((a) => a.staff_id)
                      .filter((id): id is string => id !== null)}
                  />
                ) : null}
              </div>

              {/* Meeting Leader (read-only) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
                  <Star size={14} className="text-amber-400" />
                  Meeting Leader
                </label>
                <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 border border-slate-700 px-4 py-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 text-blue-400">
                    <User size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      {leaderName}
                    </div>
                    <div className="text-xs text-slate-500">{leaderRole}</div>
                  </div>
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                    You
                  </span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
                    <Calendar size={14} className="text-blue-400" />
                    Date *
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
                    <Clock size={14} className="text-blue-400" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
                  <MapPin size={14} className="text-blue-400" />
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowLocationSuggestions(false), 200)
                    }
                    placeholder="e.g. Head Teacher's Office"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />
                </div>
                {showLocationSuggestions && (
                  <div className="absolute z-40 mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
                    {LOCATION_SUGGESTIONS.filter(
                      (s) =>
                        !location ||
                        s.toLowerCase().includes(location.toLowerCase()),
                    ).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setLocation(suggestion);
                          setShowLocationSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Purpose */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
                  <FileText size={14} className="text-blue-400" />
                  Purpose
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Return to work after 3-day absence"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleCreate}
              disabled={!canCreate || creating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2 w-full h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Create Meeting
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
