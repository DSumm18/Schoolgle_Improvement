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
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import { StaffPicker } from "@/components/meetings";
import {
  buildCustomMeetingTemplatePayload,
  cloneMeetingTemplateToCustomPayload,
} from "@/lib/meetings/custom-template-builder";
import { TEMPLATE_CATEGORIES } from "@/lib/meetings/types";
import type { MeetingTemplate, TemplateCategory } from "@/lib/meetings/types";

// Map icon name strings from TEMPLATE_CATEGORIES to actual components
const ICON_MAP: Record<string, LucideIcon> = {
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
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-500",
    dot: "bg-blue-500",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-500/10",
    border: "border-purple-200 dark:border-purple-500/30",
    text: "text-purple-700 dark:text-purple-300",
    ring: "ring-purple-500",
    dot: "bg-purple-500",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/30",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500",
    dot: "bg-amber-500",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-500/10",
    border: "border-cyan-200 dark:border-cyan-500/30",
    text: "text-cyan-700 dark:text-cyan-300",
    ring: "ring-cyan-500",
    dot: "bg-cyan-500",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-500/10",
    border: "border-red-200 dark:border-red-500/30",
    text: "text-red-700 dark:text-red-300",
    ring: "ring-red-500",
    dot: "bg-red-500",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-green-500",
    dot: "bg-green-500",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-500/10",
    border: "border-pink-200 dark:border-pink-500/30",
    text: "text-pink-700 dark:text-pink-300",
    ring: "ring-pink-500",
    dot: "bg-pink-500",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-500/10",
    border: "border-orange-200 dark:border-orange-500/30",
    text: "text-orange-700 dark:text-orange-300",
    ring: "ring-orange-500",
    dot: "bg-orange-500",
  },
  slate: {
    bg: "bg-slate-50 dark:bg-slate-500/10",
    border: "border-slate-200 dark:border-slate-500/30",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-500",
    dot: "bg-slate-500",
  },
  gray: {
    bg: "bg-zinc-50 dark:bg-zinc-500/10",
    border: "border-zinc-200 dark:border-zinc-500/30",
    text: "text-zinc-700 dark:text-zinc-300",
    ring: "ring-gray-500",
    dot: "bg-gray-500",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    border: "border-indigo-200 dark:border-indigo-500/30",
    text: "text-indigo-700 dark:text-indigo-300",
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

const isVirtualTemplate = (template: MeetingTemplate | null) =>
  Boolean(template?.id?.startsWith("default:"));

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

const panelClass =
  "rounded-[1.5rem] border border-white/70 bg-white/85 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/75 dark:shadow-black/20";
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400";
const labelClass =
  "flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2";

export default function NewMeetingPage() {
  const router = useRouter();
  const { user, session, organization } = useAuth();
  const organizationId = organization?.id || "";

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [selectedCategory, setSelectedCategory] =
    useState<TemplateCategory | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<
    TemplateCategory[]
  >([]);
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
  const [customTemplateName, setCustomTemplateName] = useState("Custom Meeting");
  const [customDiscussionItems, setCustomDiscussionItems] = useState("");
  const [customPolicyRefs, setCustomPolicyRefs] = useState("");
  const [customBaseTemplate, setCustomBaseTemplate] =
    useState<MeetingTemplate | null>(null);

  const activeTemplateCategory = selectedTemplate?.category || selectedCategory;
  const isHrTemplate = activeTemplateCategory
    ? HR_CATEGORIES.includes(activeTemplateCategory)
    : false;

  const requestHeaders = useMemo(
    () =>
      session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    [session?.access_token],
  );

  // Count templates per category from all templates
  const templateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTemplates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [allTemplates]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategories.length === 0) return allTemplates;
    return allTemplates.filter((template) =>
      selectedCategories.includes(template.category),
    );
  }, [allTemplates, selectedCategories]);

  // Fetch all templates on mount for counts
  useEffect(() => {
    if (!organizationId || !session?.access_token) return;
    setLoadingTemplates(true);
    fetch(`/api/meetings/templates?organizationId=${organizationId}`, {
      headers: requestHeaders,
    })
      .then((r) => r.json())
      .then((data) => setAllTemplates(data.templates || []))
      .catch(console.error)
      .finally(() => setLoadingTemplates(false));
  }, [organizationId, requestHeaders, session?.access_token]);

  // Fetch filtered templates when category is selected
  useEffect(() => {
    if (!selectedCategory || !organizationId || !session?.access_token) return;
    setLoadingTemplates(true);
    fetch(
      `/api/meetings/templates?organizationId=${organizationId}&category=${selectedCategory}`,
      { headers: requestHeaders },
    )
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(console.error)
      .finally(() => setLoadingTemplates(false));
  }, [selectedCategory, organizationId, requestHeaders, session?.access_token]);

  const goToStep = (newStep: Step) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const handleSelectCategory = (cat: TemplateCategory) => {
    setSelectedCategory(cat);
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((item) => item !== cat)
        : [...prev, cat],
    );
  };

  const handleSelectTemplate = (template: MeetingTemplate) => {
    setSelectedTemplate(template);
    setPurpose(template.description || "");
    setAttendees([]);
    if (template.id) {
      setCustomTemplateName("Custom Meeting");
      setCustomDiscussionItems("");
      setCustomPolicyRefs("");
      setCustomBaseTemplate(null);
    } else {
      setCustomTemplateName(template.name);
    }
    goToStep(3);
  };

  const handleCustomizeTemplate = (template: MeetingTemplate) => {
    setSelectedTemplate({
      ...template,
      id: "",
      name: `Copy of ${template.name}`,
      is_custom: true,
      organization_id: organizationId,
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setPurpose(template.description || "");
    setAttendees([]);
    setCustomBaseTemplate(template);
    setCustomTemplateName(`Copy of ${template.name}`);
    setCustomDiscussionItems(
      (template.compliance_items || []).map((item) => item.phrase).join("\n"),
    );
    setCustomPolicyRefs(
      (template.preparation_guide?.policy_refs || []).join("\n"),
    );
    goToStep(3);
  };

  const handleCreateBlankTemplate = () => {
    setCustomBaseTemplate(null);
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
      let templateId = selectedTemplate.id;

      if (!templateId || isVirtualTemplate(selectedTemplate)) {
        const templatePayload = customBaseTemplate
          ? cloneMeetingTemplateToCustomPayload({
              template: customBaseTemplate,
              name: customTemplateName,
              description: purpose,
              discussionItemsText: customDiscussionItems,
              policyRefsText: customPolicyRefs,
            })
          : isVirtualTemplate(selectedTemplate)
            ? {
                name: selectedTemplate.name,
                category: selectedTemplate.category,
                description: purpose || selectedTemplate.description || "",
                opening_script: selectedTemplate.opening_script || [],
                closing_script: selectedTemplate.closing_script || [],
                compliance_items: selectedTemplate.compliance_items || [],
                preparation_guide: selectedTemplate.preparation_guide || {
                  context_prompts: [],
                  documents_needed: [],
                  key_phrases: [],
                  policy_refs: [],
                },
                is_custom: true,
              }
          : buildCustomMeetingTemplatePayload({
              name: customTemplateName,
              category: selectedCategory || "custom",
              description: purpose,
              discussionItemsText: customDiscussionItems,
              policyRefsText: customPolicyRefs,
            });

        const templateRes = await fetch("/api/meetings/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...requestHeaders,
          },
          body: JSON.stringify({ ...templatePayload, organizationId }),
        });
        const templateData = await templateRes.json();

        if (!templateRes.ok || !templateData.template?.id) {
          console.error("Failed to create custom template:", templateData);
          return;
        }

        templateId = templateData.template.id;
      }

      const scheduledAt = new Date(
        `${scheduledDate}T${scheduledTime}`,
      ).toISOString();
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...requestHeaders,
        },
        body: JSON.stringify({
          organizationId,
          template_id: templateId,
          attendees: attendees.map((a) => ({
            staff_id: a.staff_id,
            attendee_name: a.attendee_name,
            attendee_role: a.attendee_role,
            is_primary: a.is_primary,
          })),
          scheduled_at: scheduledAt,
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
  const isCreatingCustomTemplate = selectedTemplate?.is_custom && !selectedTemplate.id;

  const canCreate =
    attendees.length > 0 &&
    scheduledDate &&
    (!isCreatingCustomTemplate ||
      (customTemplateName.trim().length > 0 &&
        customDiscussionItems.trim().length > 0));

  return (
    <div className="relative min-h-screen max-w-[1120px] mx-auto p-6 md:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 rounded-full bg-gradient-to-r from-blue-200/45 via-indigo-200/35 to-cyan-200/45 blur-3xl dark:from-blue-900/25 dark:via-indigo-900/20 dark:to-cyan-900/25" />
      {/* Header */}
      <div className={`${panelClass} mb-6 p-5`}>
      <div className="flex items-center gap-4">
        <Link href="/dashboard/hr/meetings">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl bg-white/70 text-slate-700 shadow-sm hover:bg-white dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
          <Calendar size={22} />
        </div>
        <div className="min-w-0">
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            Smart Meeting Companion
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white">
            New Meeting
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {step === 1 && "Filter departments, preview templates, then choose one"}
            {step === 2 &&
              `${TEMPLATE_CATEGORIES.find((c) => c.value === selectedCategory)?.label || ""} — Select a template`}
            {step === 3 && `${selectedTemplate?.name} — Enter meeting details`}
          </p>
        </div>
      </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 flex items-center justify-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        {[1, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                s === step
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white ring-4 ring-blue-600/20 shadow-lg shadow-blue-500/25"
                  : s < step
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {s < step ? <Check size={14} /> : s}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                s === step ? "text-blue-700 dark:text-blue-300" : "text-slate-500"
              }`}
            >
              {s === 1 ? "Template Library" : "Meeting Details"}
            </span>
            {s === 1 && (
              <div
                className={`w-8 h-px mx-1 ${
                  s < step ? "bg-blue-400/70" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait" custom={direction}>
        {/* Step 1: Choose Template */}
        {step === 1 && (
          <motion.div
            key="step-1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-5"
          >
            <div className={`${panelClass} p-5`}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    Pick departments, then choose a template
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Select one or more departments to reveal the meeting
                    templates. You can preview the prompts before using or
                    copying one.
                  </p>
                </div>
                {selectedCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedCategory(null);
                    }}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
                  >
                    Show all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon] || Calendar;
                const colors = COLOR_MAP[cat.color] || COLOR_MAP.gray;
                const count = templateCounts[cat.value] || 0;
                const isSelected = selectedCategories.includes(cat.value);

                return (
                  <button
                    key={cat.value}
                    onClick={() => handleSelectCategory(cat.value)}
                    className={`group relative overflow-hidden rounded-2xl border ${colors.border} p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] dark:shadow-black/20 ${
                      isSelected
                        ? `${colors.bg} ring-2 ${colors.ring} ring-offset-2 ring-offset-white dark:ring-offset-slate-950`
                        : "bg-white/90 dark:bg-slate-900/70"
                    }`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 ${colors.dot}`} />
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-white/0 to-slate-100 dark:to-white/5" />
                    <div
                      className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl ${colors.bg} ${colors.text} mb-4 ring-1 ring-inset ring-white/60 dark:ring-white/10`}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div className="text-base font-black text-slate-950 dark:text-slate-50 mb-1">
                      {cat.label}
                    </div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {count} {count === 1 ? "template" : "templates"}
                    </div>
                    <ArrowRight
                      size={14}
                      className={`absolute top-4 right-4 ${colors.text} ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      } transition-opacity`}
                    />
                  </button>
                );
              })}
              </div>
            </div>

            {loadingTemplates && allTemplates.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Loading templates...
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((template) => {
                  const checklist = template.compliance_items || [];
                  const checklistCount = checklist.length;
                  const criticalCount = checklist.filter(
                    (item) => item.is_critical,
                  ).length;
                  const catColors =
                    COLOR_MAP[
                      TEMPLATE_CATEGORIES.find(
                        (c) => c.value === template.category,
                      )?.color || "gray"
                    ] || COLOR_MAP.gray;

                  return (
                    <div
                      key={template.id}
                      className="group w-full text-left rounded-2xl border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-200/40 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/20 dark:hover:border-blue-500/30"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${catColors.bg} ${catColors.text}`}
                            >
                              {TEMPLATE_CATEGORIES.find(
                                (c) => c.value === template.category,
                              )?.label || template.category}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                                template.is_custom
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                              }`}
                            >
                              {template.is_custom
                                ? "School template"
                                : "Schoolgle standard"}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-slate-950 dark:text-slate-50 mb-1">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                              {template.description}
                            </p>
                          )}

                          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Prompts this meeting covers
                              </p>
                              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                                {checklistCount} items
                                {criticalCount > 0
                                  ? ` · ${criticalCount} critical`
                                  : ""}
                              </span>
                            </div>
                            {checklistCount > 0 ? (
                              <ul className="space-y-1.5">
                                {checklist.slice(0, 4).map((item, index) => (
                                  <li
                                    key={`${item.phrase}-${index}`}
                                    className="flex gap-2 text-xs text-slate-700 dark:text-slate-300"
                                  >
                                    <Check
                                      size={13}
                                      className={
                                        item.is_critical
                                          ? "mt-0.5 shrink-0 text-rose-500"
                                          : "mt-0.5 shrink-0 text-emerald-500"
                                      }
                                    />
                                    <span>{item.phrase}</span>
                                  </li>
                                ))}
                                {checklistCount > 4 && (
                                  <li className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    + {checklistCount - 4} more prompts in the
                                    meeting template
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                No prompts yet. Copy this template to add your
                                own checklist.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-40">
                          <button
                            type="button"
                            onClick={() => handleSelectTemplate(template)}
                            className="inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-indigo-500"
                          >
                            Use template
                            <ArrowRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCustomizeTemplate(template)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:text-indigo-300"
                          >
                            Copy & customise
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTemplates.length === 0 && (
                  <div className={`${panelClass} p-8 text-center text-slate-500 text-sm`}>
                    No templates found for that department selection.
                  </div>
                )}

                <button
                  onClick={handleCreateBlankTemplate}
                  className="w-full text-left rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-5 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 dark:border-blue-500/25 dark:bg-blue-500/10 dark:hover:border-blue-400/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-blue-600 shadow-sm dark:bg-blue-500/15 dark:text-blue-300">
                      <Plus size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Create custom meeting
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Start from scratch and choose a category for your own
                        reusable template.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}
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
              className="mb-5 flex items-center gap-1 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
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
                    <div
                      key={template.id}
                      className="group w-full text-left rounded-2xl border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-200/40 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/20 dark:hover:border-blue-500/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-black text-slate-950 dark:text-slate-50 mb-1">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {checklistCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Check size={12} className={catColors.text} />
                                {checklistCount} checklist{" "}
                                {checklistCount === 1 ? "item" : "items"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCustomizeTemplate(template)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:text-indigo-300"
                          >
                            Copy & customise
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectTemplate(template)}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-indigo-500"
                          >
                            Use template
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {templates.length === 0 && (
                  <div className={`${panelClass} p-8 text-center text-slate-500 text-sm`}>
                    No templates found in this category.
                  </div>
                )}

                {/* Custom template option */}
                <button
                  onClick={handleCreateBlankTemplate}
                  className="w-full text-left rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-5 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 dark:border-blue-500/25 dark:bg-blue-500/10 dark:hover:border-blue-400/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-blue-600 shadow-sm dark:bg-blue-500/15 dark:text-blue-300">
                      <Plus size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Create custom meeting
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Start from scratch or copy a Schoolgle template above
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
              onClick={() => goToStep(1)}
              className="flex items-center gap-1 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
            >
              <ArrowLeft size={14} />
              Back to templates
            </button>

            {/* Template summary */}
            {!isCreatingCustomTemplate && (
              <div className={`${panelClass} p-4`}>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <FileText size={14} className="text-blue-600 dark:text-blue-300" />
                  {selectedTemplate.name}
                </div>
                {(selectedTemplate.compliance_items?.length || 0) > 0 && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 ml-6">
                    {selectedTemplate.compliance_items.length} compliance items
                    will be added to your checklist
                  </p>
                )}
              </div>
            )}

            {/* Form */}
            <div className={`${panelClass} space-y-5 p-6`}>
              {isCreatingCustomTemplate && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 space-y-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
                  <div>
                    <label className={labelClass}>
                      <FileText size={14} className="text-indigo-600 dark:text-indigo-300" />
                      {customBaseTemplate
                        ? "Custom copy name *"
                        : "Custom template name *"}
                    </label>
                    <input
                      type="text"
                      value={customTemplateName}
                      onChange={(e) => setCustomTemplateName(e.target.value)}
                      placeholder="e.g. Annual asbestos assurance review"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Check size={14} className="text-indigo-600 dark:text-indigo-300" />
                      Things to cover and tick off *
                    </label>
                    <textarea
                      value={customDiscussionItems}
                      onChange={(e) => setCustomDiscussionItems(e.target.value)}
                      placeholder={"One per line, e.g.\nConfirm the register is current\nAgree actions, owners and due dates\nConfirm what evidence will be uploaded"}
                      rows={5}
                      className={fieldClass}
                    />
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      Each line becomes a live checklist item for the chair.
                      {customBaseTemplate
                        ? " Edit, remove, or add the local/provider points this school needs."
                        : ""}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Shield size={14} className="text-indigo-600 dark:text-indigo-300" />
                      Supporting policy, guidance, or local standard
                    </label>
                    <textarea
                      value={customPolicyRefs}
                      onChange={(e) => setCustomPolicyRefs(e.target.value)}
                      placeholder={"Optional, one per line, e.g.\nSchool asbestos management plan\nLocal authority compliance checklist"}
                      rows={3}
                      className={fieldClass}
                    />
                  </div>
                </div>
              )}

              {/* Attendees */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  <Users size={14} className="text-blue-600 dark:text-blue-300" />
                  {isHrTemplate ? "Attendee *" : "Attendees *"}
                </label>

                {/* Selected attendees */}
                {attendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {attendees.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-950/50"
                      >
                        <User size={14} className="text-blue-600 dark:text-blue-300 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {att.attendee_name}
                          </div>
                          {att.attendee_role && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                              {att.attendee_role}
                            </div>
                          )}
                        </div>
                        {att.is_primary && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded shrink-0 dark:text-blue-300 dark:bg-blue-500/10">
                            Primary
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveAttendee(idx)}
                          className="text-slate-500 hover:text-red-500 transition-colors shrink-0"
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
                <label className={labelClass}>
                  <Star size={14} className="text-amber-600 dark:text-amber-300" />
                  Meeting Leader
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-950/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    <User size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {leaderName}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{leaderRole}</div>
                  </div>
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded dark:text-slate-400 dark:bg-slate-800">
                    You
                  </span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <Calendar size={14} className="text-blue-600 dark:text-blue-300" />
                    Date *
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Clock size={14} className="text-blue-600 dark:text-blue-300" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="relative">
                <label className={labelClass}>
                  <MapPin size={14} className="text-blue-600 dark:text-blue-300" />
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
                    className={fieldClass}
                  />
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
                {showLocationSuggestions && (
                  <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
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
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Purpose */}
              <div>
                <label className={labelClass}>
                  <FileText size={14} className="text-blue-600 dark:text-blue-300" />
                  Purpose
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Return to work after 3-day absence"
                  className={fieldClass}
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleCreate}
              disabled={!canCreate || creating}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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
