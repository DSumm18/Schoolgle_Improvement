"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ClipboardCheck,
  AlertTriangle,
  PoundSterling,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Filter,
  TrendingUp,
  Download,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  type ConditionElement,
  type ConditionGrade,
  type ElementCategory,
  calculateConditionSummary,
  calculateBacklogCost,
  getGradeColor,
  getGradeBgClass,
  getGradeLabel,
  getGradeDescription,
  getCategoryLabel,
  getPriorityLabel,
  getPriorityBgClass,
  shouldCreateRisk,
  projectBacklog,
  ALL_CATEGORIES,
  generateConditionReport,
} from "@/lib/condition-survey";
import { fetcher } from "@/lib/fetchers";
import { useAuth } from "@/context/SupabaseAuthContext";
import type { ConditionSurveyLocation } from "@/lib/estates/condition-survey-records";

// ── Grade distribution bar ─────────────────────────────────────

function GradeBar({
  byGrade,
  total,
}: {
  byGrade: Record<ConditionGrade, number>;
  total: number;
}) {
  const grades: ConditionGrade[] = ["A", "B", "C", "D"];
  return (
    <div className="w-full">
      <div className="flex h-8 rounded-lg overflow-hidden border border-gray-200">
        {grades.map((g) => {
          const pct = total > 0 ? (byGrade[g] / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={g}
              className="flex items-center justify-center text-xs font-semibold text-white transition-all"
              style={{ width: `${pct}%`, backgroundColor: getGradeColor(g) }}
              title={`Grade ${g}: ${byGrade[g]} (${pct.toFixed(0)}%)`}
            >
              {pct > 8 && `${g}: ${byGrade[g]}`}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        {grades.map((g) => (
          <div key={g} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: getGradeColor(g) }}
            />
            {getGradeLabel(g)} ({byGrade[g]})
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Summary card ───────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accent ? `${accent}18` : "#e0f2fe" }}
        >
          <Icon className="w-5 h-5" style={{ color: accent || "#0284c7" }} />
        </div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Grade badge ────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: ConditionGrade }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getGradeBgClass(grade)}`}
    >
      {grade} &mdash; {getGradeLabel(grade)}
    </span>
  );
}

// ── Backlog projection chart (simple ASCII bar) ────────────────

function BacklogProjection({ currentBacklog }: { currentBacklog: number }) {
  const projection = projectBacklog(currentBacklog, 0.05, 0);
  const max = Math.max(...projection.map((p) => p.backlog));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900">
          5-Year Backlog Projection
        </h3>
        <span className="text-xs text-gray-400 ml-auto">
          at 5% annual deterioration, no spend
        </span>
      </div>
      <div className="space-y-2">
        {projection.map((p) => {
          const pct = max > 0 ? (p.backlog / max) * 100 : 0;
          return (
            <div key={p.year} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-12 font-mono">
                {p.year}
              </span>
              <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      pct > 80 ? "#ef4444" : pct > 50 ? "#f97316" : "#f59e0b",
                  }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-24 text-right">
                £{p.backlog.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Add assessment form ────────────────────────────────────────

function AddAssessmentForm({
  locations,
  onSubmit,
  onCancel,
}: {
  locations: ConditionSurveyLocation[];
  onSubmit: (el: ConditionElement) => Promise<void>;
  onCancel: () => void;
}) {
  const [locationId, setLocationId] = useState("");
  const [manualLocationName, setManualLocationName] = useState("");
  const [category, setCategory] = useState<ElementCategory | "">("");
  const [element, setElement] = useState("");
  const [grade, setGrade] = useState<ConditionGrade | "">("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [priority, setPriority] = useState<ConditionElement["priority"] | "">(
    "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!locationId && !manualLocationName.trim()) ||
      !category ||
      !element ||
      !grade ||
      !description ||
      !priority
    )
      return;

    const loc = locations.find((l) => l.id === locationId);
    try {
      setSubmitting(true);
      setSubmitError(null);
      await onSubmit({
        id: "",
        locationId: locationId || "new-location",
        locationName: loc?.name || manualLocationName.trim(),
        category: category as ElementCategory,
        element,
        grade: grade as ConditionGrade,
        description,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        priority: priority as ConditionElement["priority"],
        surveyedBy: "Current User",
        surveyedAt: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save assessment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-teal-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-teal-600" />
          Add Condition Assessment
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          {locations.length > 0 ? (
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
            >
              <option value="">Select location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g. Plant Room, Main Hall, Playground"
              value={manualLocationName}
              onChange={(e) => setManualLocationName(e.target.value)}
              required
            />
          )}
          {locations.length === 0 && (
            <p className="mt-1 text-xs text-gray-400">
              This will create a live estate location for future surveys.
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            value={category}
            onChange={(e) => setCategory(e.target.value as ElementCategory)}
            required
          >
            <option value="">Select category...</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {getCategoryLabel(c)}
              </option>
            ))}
          </select>
        </div>

        {/* Element name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Element
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="e.g. Roof covering, Boiler, Window frames"
            value={element}
            onChange={(e) => setElement(e.target.value)}
            required
          />
        </div>

        {/* Grade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition Grade
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            value={grade}
            onChange={(e) => setGrade(e.target.value as ConditionGrade)}
            required
          >
            <option value="">Select grade...</option>
            {(["A", "B", "C", "D"] as ConditionGrade[]).map((g) => (
              <option key={g} value={g}>
                {g} - {getGradeLabel(g)}
              </option>
            ))}
          </select>
          {grade && (
            <p className="text-xs text-gray-400 mt-1">
              {getGradeDescription(grade as ConditionGrade)}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as ConditionElement["priority"])
            }
            required
          >
            <option value="">Select priority...</option>
            <option value="urgent">Urgent</option>
            <option value="essential">Essential</option>
            <option value="desirable">Desirable</option>
            <option value="cosmetic">Cosmetic</option>
          </select>
        </div>

        {/* Estimated cost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Cost (£)
          </label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="0"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
          />
        </div>

        {/* Description (full width) */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description / Notes
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            rows={2}
            placeholder="Describe the condition, defects observed, and recommended action..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-2 lg:col-span-3 flex gap-3 justify-end">
          {submitError && (
            <p className="mr-auto text-sm text-red-600">{submitError}</p>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save Assessment"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function ConditionSurveyPage() {
  const { organization, organizationId, loading: authLoading } = useAuth();
  const [elements, setElements] = useState<ConditionElement[]>([]);
  const [locations, setLocations] = useState<ConditionSurveyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  // Filters
  const [filterGrade, setFilterGrade] = useState<ConditionGrade | "all">("all");
  const [filterCategory, setFilterCategory] = useState<ElementCategory | "all">(
    "all",
  );
  const [filterRoom, setFilterRoom] = useState<string>("all");

  useEffect(() => {
    if (authLoading) return;

    async function loadConditionSurvey() {
      if (!organizationId) {
        setError("Select a school or trust before viewing condition surveys.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ organizationId });
        const data = await fetcher(
          `/api/estates/condition-survey?${params.toString()}`,
        );
        setElements(data.elements || []);
        setLocations(data.locations || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load condition survey data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadConditionSurvey();
  }, [authLoading, organizationId]);

  // Derived data
  const summary = useMemo(
    () => calculateConditionSummary(elements),
    [elements],
  );
  const backlog = useMemo(() => calculateBacklogCost(elements), [elements]);

  // Filtered elements
  const filtered = useMemo(() => {
    return elements.filter((el) => {
      if (filterGrade !== "all" && el.grade !== filterGrade) return false;
      if (filterCategory !== "all" && el.category !== filterCategory)
        return false;
      if (filterRoom !== "all" && el.locationId !== filterRoom) return false;
      return true;
    });
  }, [elements, filterGrade, filterCategory, filterRoom]);

  // Group by room
  const grouped = useMemo(() => {
    const map: Record<string, { name: string; elements: ConditionElement[] }> =
      {};
    for (const el of filtered) {
      if (!map[el.locationId]) {
        map[el.locationId] = { name: el.locationName, elements: [] };
      }
      map[el.locationId].elements.push(el);
    }
    return Object.entries(map).sort(([, a], [, b]) =>
      a.name.localeCompare(b.name),
    );
  }, [filtered]);

  // Unique rooms for filter
  const rooms = useMemo(() => {
    const set = new Map<string, string>();
    for (const el of elements) {
      set.set(el.locationId, el.locationName);
    }
    return Array.from(set.entries()).sort(([, a], [, b]) => a.localeCompare(b));
  }, [elements]);

  const toggleRoom = (id: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddElement = async (el: ConditionElement) => {
    if (!organizationId) throw new Error("Missing organization context.");

    const response = await fetcher("/api/estates/condition-survey", {
      method: "POST",
      body: JSON.stringify({
        organizationId,
      locationId: el.locationId,
      locationName: el.locationName,
        category: el.category,
        element: el.element,
        grade: el.grade,
        description: el.description,
        estimatedCost: el.estimatedCost,
        priority: el.priority,
        surveyedBy: el.surveyedBy,
      }),
    });

    setElements((prev) => [response.element, ...prev]);
    if (
      response.element?.locationId &&
      response.element?.locationName &&
      !locations.some((location) => location.id === response.element.locationId)
    ) {
      setLocations((prev) => [
        ...prev,
        {
          id: response.element.locationId,
          name: response.element.locationName,
          type: "room",
        },
      ]);
    }
    setShowForm(false);
  };

  const handleDownloadReport = () => {
    const report = generateConditionReport(
      elements,
      organization?.name ?? "Current school",
    );
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "condition-survey-report.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">
          Loading condition survey data...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Condition Survey
              </h1>
              <p className="text-sm text-gray-500">
                Building condition grading with DfE CDC methodology
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Assessment
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && elements.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          No live condition survey items have been recorded yet. Add an
          assessment to start building the school backlog, risk view, and estate
          strategy evidence trail.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={ClipboardCheck}
          label="Total Elements"
          value={summary.totalElements.toString()}
          sub="Across all locations"
          accent="#0d9488"
        />
        <SummaryCard
          icon={BarChart3}
          label="Grade Distribution"
          value={`${summary.byGrade.A + summary.byGrade.B} OK`}
          sub={`${summary.byGrade.C} poor, ${summary.byGrade.D} bad`}
          accent="#f59e0b"
        />
        <SummaryCard
          icon={PoundSterling}
          label="Maintenance Backlog"
          value={`£${backlog.toLocaleString()}`}
          sub="C + D grade items"
          accent="#f97316"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Urgent Items"
          value={summary.urgentItems.toString()}
          sub="Grade D — risk to H&S"
          accent="#ef4444"
        />
      </div>

      {/* Grade distribution bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">
          Overall Grade Distribution
        </h3>
        <GradeBar byGrade={summary.byGrade} total={summary.totalElements} />
      </div>

      {/* Add assessment form */}
      {showForm && (
        <AddAssessmentForm
          locations={locations}
          onSubmit={handleAddElement}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters:</span>
          </div>

          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            value={filterGrade}
            onChange={(e) =>
              setFilterGrade(e.target.value as ConditionGrade | "all")
            }
          >
            <option value="all">All Grades</option>
            {(["A", "B", "C", "D"] as ConditionGrade[]).map((g) => (
              <option key={g} value={g}>
                Grade {g} — {getGradeLabel(g)}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            value={filterCategory}
            onChange={(e) =>
              setFilterCategory(e.target.value as ElementCategory | "all")
            }
          >
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {getCategoryLabel(c)}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
          >
            <option value="all">All Locations</option>
            {rooms.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <span className="text-xs text-gray-400 ml-auto">
            Showing {filtered.length} of {elements.length} elements
          </span>
        </div>
      </div>

      {/* Elements grouped by room */}
      <div className="space-y-3">
        {grouped.map(([locId, { name, elements: roomEls }]) => {
          const isExpanded = expandedRooms.has(locId);
          const roomGrades = roomEls.map((e) => e.grade);
          const worstInRoom = roomGrades.includes("D")
            ? "D"
            : roomGrades.includes("C")
              ? "C"
              : roomGrades.includes("B")
                ? "B"
                : "A";
          const roomCost = roomEls
            .filter((e) => e.grade === "C" || e.grade === "D")
            .reduce((s, e) => s + (e.estimatedCost ?? 0), 0);

          return (
            <div
              key={locId}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Room header */}
              <button
                onClick={() => toggleRoom(locId)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-900 truncate">
                    {name}
                  </span>
                  <GradeBadge grade={worstInRoom as ConditionGrade} />
                  <span className="text-xs text-gray-400">
                    {roomEls.length} elements
                  </span>
                </div>
                {roomCost > 0 && (
                  <span className="text-sm font-medium text-orange-600 flex-shrink-0">
                    £{roomCost.toLocaleString()} backlog
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {/* Element rows */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-5 py-2 text-left">Element</th>
                        <th className="px-3 py-2 text-left">Category</th>
                        <th className="px-3 py-2 text-center">Grade</th>
                        <th className="px-3 py-2 text-left">Priority</th>
                        <th className="px-3 py-2 text-right">Est. Cost</th>
                        <th className="px-3 py-2 text-left">Surveyed</th>
                        <th className="px-3 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomEls.map((el) => (
                        <tr
                          key={el.id}
                          className="border-t border-gray-50 hover:bg-gray-50/50"
                        >
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-900">
                              {el.element}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                              {el.description}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            {getCategoryLabel(el.category)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <GradeBadge grade={el.grade} />
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityBgClass(el.priority)}`}
                            >
                              {getPriorityLabel(el.priority)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-gray-700">
                            {el.estimatedCost
                              ? `£${el.estimatedCost.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                            {el.surveyedAt}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {shouldCreateRisk(el) && (
                              <a
                                href="/dashboard/risk"
                                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"
                                title="Create risk register entry"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Create Risk
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {grouped.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            No elements match the current filters.
          </div>
        )}
      </div>

      {/* Backlog projection */}
      {backlog > 0 && <BacklogProjection currentBacklog={backlog} />}
    </div>
  );
}
