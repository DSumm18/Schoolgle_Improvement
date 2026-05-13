"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ClipboardCheck,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  ChevronRight,
  Filter,
  LayoutTemplate,
  ShieldCheck,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import { MeetingStatusBadge } from "@/components/meetings";
import { DEFAULT_MEETING_TEMPLATES } from "@/lib/meetings/meeting-template-catalog";
import { TEMPLATE_CATEGORIES } from "@/lib/meetings/types";
import type { MeetingTemplate } from "@/lib/meetings";

type TemplateLibraryView = "my" | "all";

type MeetingListItem = {
  id: string;
  attendee_name?: string | null;
  attendee_role?: string | null;
  status: string;
  scheduled_at: string;
  location?: string | null;
  compliance_score?: number | null;
  meeting_templates?: {
    name?: string | null;
  } | null;
};

function toFallbackTemplate(
  template: (typeof DEFAULT_MEETING_TEMPLATES)[number],
): MeetingTemplate {
  const slug = template.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    ...template,
    id: `default:${slug}`,
    is_custom: false,
    organization_id: null,
    created_by: null,
    created_at: "2026-04-27T00:00:00.000Z",
    updated_at: "2026-04-27T00:00:00.000Z",
  };
}

function getTemplateBadge(template: MeetingTemplate) {
  if (template.is_custom) {
    return {
      label: "School template",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
    };
  }

  return {
    label: "Schoolgle standard",
    className:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
  };
}

export default function MeetingsLandingPage() {
  const { organization, session } = useAuth();
  const organizationId = organization?.id || "";
  const accessToken = session?.access_token;
  const requestHeaders = useMemo(
    () =>
      accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    [accessToken],
  );

  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [search, setSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateLibraryView, setTemplateLibraryView] =
    useState<TemplateLibraryView>("my");
  const [templateCategory, setTemplateCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  useEffect(() => {
    if (!organizationId) return;
    fetch(`/api/meetings/templates?organizationId=${organizationId}`, {
      headers: requestHeaders,
    })
      .then((r) => r.json())
      .then((data) => {
        const fetchedTemplates = data.templates || [];
        setTemplates(
          fetchedTemplates.length > 0
            ? fetchedTemplates
            : DEFAULT_MEETING_TEMPLATES.map(toFallbackTemplate),
        );
      })
      .catch((error) => {
        console.error(error);
        setTemplates(DEFAULT_MEETING_TEMPLATES.map(toFallbackTemplate));
      })
      .finally(() => setLoadingTemplates(false));
  }, [organizationId, requestHeaders]);

  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch =
      !search ||
      (meeting.attendee_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (meeting.meeting_templates?.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || meeting.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTemplates = templates.filter((template) => {
    if (templateLibraryView === "my" && !template.is_custom) return false;
    if (templateCategory !== "all" && template.category !== templateCategory) {
      return false;
    }

    const normalisedSearch = templateSearch.trim().toLowerCase();
    if (!normalisedSearch) return true;

    return (
      template.name.toLowerCase().includes(normalisedSearch) ||
      (template.description || "").toLowerCase().includes(normalisedSearch) ||
      template.category.toLowerCase().includes(normalisedSearch)
    );
  });

  const pinnedTemplates = filteredTemplates.slice(0, 6);
  const myTemplateCount = templates.filter((template) => template.is_custom).length;

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
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl gap-2 shadow-lg shadow-blue-500/20">
            <Plus size={16} />
            New Meeting
          </Button>
        </Link>
      </motion.div>

      {/* Template Library */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/75 dark:shadow-black/20"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-[0.2em] mb-1">
              <LayoutTemplate size={15} />
              Template Library
            </div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              Start with your regular templates
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
              Your school templates appear first for speed. Browse all
              Schoolgle standards when you need a new starting point.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-300"
              />
              <input
                type="text"
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
              {[
                ["my", `My Templates (${myTemplateCount})`],
                ["all", `All Templates (${templates.length})`],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTemplateLibraryView(value as TemplateLibraryView)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    templateLibraryView === value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {templateLibraryView === "all" && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setTemplateCategory("all")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                templateCategory === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              All departments
            </button>
            {TEMPLATE_CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setTemplateCategory(category.value)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  templateCategory === category.value
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        )}

        {loadingTemplates ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Loading meeting templates...
          </div>
        ) : pinnedTemplates.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {templateLibraryView === "my" ? (
              <>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  No saved school templates yet.
                </p>
                <p className="mt-1">
                  Browse all templates, copy one you like, then it will appear
                  here for quicker reuse.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => setTemplateLibraryView("all")}
                >
                  Browse all templates
                </Button>
              </>
            ) : (
              "No templates found. Try clearing your search or department filter."
            )}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pinnedTemplates.map((template) => {
              const badge = getTemplateBadge(template);
              const checklist = template.compliance_items || [];
              const criticalCount = checklist.filter(
                (item) => item.is_critical,
              ).length;

              return (
                <div
                  key={template.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/35 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl dark:border-slate-700 dark:bg-slate-950/50 dark:shadow-black/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <h3 className="mt-3 text-base font-black text-slate-950 dark:text-white">
                        {template.name}
                      </h3>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      <ClipboardCheck size={20} />
                    </div>
                  </div>

                  {template.description && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/70">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Things to cover
                      </p>
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                        {checklist.length} items
                        {criticalCount > 0 ? ` · ${criticalCount} critical` : ""}
                      </span>
                    </div>
                    {checklist.length > 0 ? (
                      <ul className="space-y-1.5">
                        {checklist.slice(0, 3).map((item, index) => (
                          <li
                            key={`${item.phrase}-${index}`}
                            className="flex gap-2 text-xs text-slate-700 dark:text-slate-300"
                          >
                            <ShieldCheck
                              size={13}
                              className={
                                item.is_critical
                                  ? "mt-0.5 shrink-0 text-rose-500"
                                  : "mt-0.5 shrink-0 text-emerald-500"
                              }
                            />
                            <span className="line-clamp-1">{item.phrase}</span>
                          </li>
                        ))}
                        {checklist.length > 3 && (
                          <li className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            + {checklist.length - 3} more prompts in the template
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No checklist items yet — copy this template to add your
                        own prompts.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Button asChild className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500">
                      <Link href={`/dashboard/hr/meetings/new?templateId=${encodeURIComponent(template.id)}`}>
                        Use template
                        <ChevronRight size={15} className="ml-1" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 rounded-xl gap-2"
                    >
                      <Link href={`/dashboard/hr/meetings/new?templateId=${encodeURIComponent(template.id)}&mode=copy`}>
                        <Copy size={14} />
                        Copy/customise
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

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
            className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700${stat.value === 0 ? " opacity-50" : ""}`}
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by attendee or meeting type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="relative">
          <Filter
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
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
        ) : filteredMeetings.length === 0 && meetings.length > 0 ? (
          <div className="p-12 text-center">
            <Search
              size={48}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
            />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              No matching meetings
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : filteredMeetings.length === 0 ? (
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
            {filteredMeetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/dashboard/hr/meetings/${meeting.id}`}
                className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-md transition-all duration-150"
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
                <ChevronRight
                  size={16}
                  className="text-slate-300 dark:text-slate-600 ml-3 shrink-0"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
