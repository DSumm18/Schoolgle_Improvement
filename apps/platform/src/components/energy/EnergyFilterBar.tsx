"use client";

import { Calendar, Filter, ChevronDown } from "lucide-react";
import { useState } from "react";

export interface EnergyFilters {
  dateRange: "3m" | "6m" | "12m" | "13m" | "custom";
  customStart?: string;
  customEnd?: string;
  dayFilter:
    | "all"
    | "weekdays"
    | "weekends"
    | "mon"
    | "tue"
    | "wed"
    | "thu"
    | "fri"
    | "sat"
    | "sun";
  periodFilter: "all" | "term" | "holiday";
  fuelFilter: "combined" | "electricity" | "gas";
}

export const DEFAULT_FILTERS: EnergyFilters = {
  dateRange: "13m",
  dayFilter: "all",
  periodFilter: "all",
  fuelFilter: "combined",
};

const DATE_RANGES = [
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "13m", label: "13 months" },
  { value: "custom", label: "Custom range" },
] as const;

const DAY_FILTERS = [
  { value: "all", label: "All days" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
] as const;

const PERIOD_FILTERS = [
  { value: "all", label: "All periods" },
  { value: "term", label: "Term time" },
  { value: "holiday", label: "Holidays" },
] as const;

export function EnergyFilterBar({
  filters,
  onChange,
}: {
  filters: EnergyFilters;
  onChange: (filters: EnergyFilters) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date range */}
      <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
        {DATE_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => {
              onChange({
                ...filters,
                dateRange: r.value as EnergyFilters["dateRange"],
              });
              setShowCustom(r.value === "custom");
            }}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              filters.dateRange === r.value
                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {showCustom && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filters.customStart ?? ""}
            onChange={(e) =>
              onChange({ ...filters, customStart: e.target.value })
            }
            className="px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={filters.customEnd ?? ""}
            onChange={(e) =>
              onChange({ ...filters, customEnd: e.target.value })
            }
            className="px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>
      )}

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      {/* Day filter pills */}
      <div className="flex items-center gap-1">
        <Filter className="h-3.5 w-3.5 text-gray-400 mr-0.5" />
        {DAY_FILTERS.slice(0, 3).map((d) => (
          <button
            key={d.value}
            onClick={() =>
              onChange({
                ...filters,
                dayFilter: d.value as EnergyFilters["dayFilter"],
              })
            }
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
              filters.dayFilter === d.value
                ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                : "bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-teal-200"
            }`}
          >
            {d.label}
          </button>
        ))}
        {/* Individual day dropdown */}
        <select
          value={
            ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(
              filters.dayFilter,
            )
              ? filters.dayFilter
              : ""
          }
          onChange={(e) => {
            if (e.target.value) {
              onChange({
                ...filters,
                dayFilter: e.target.value as EnergyFilters["dayFilter"],
              });
            }
          }}
          className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-full bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400"
        >
          <option value="">Day...</option>
          {DAY_FILTERS.slice(3).map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      {/* Period filter */}
      {PERIOD_FILTERS.map((p) => (
        <button
          key={p.value}
          onClick={() =>
            onChange({
              ...filters,
              periodFilter: p.value as EnergyFilters["periodFilter"],
            })
          }
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
            filters.periodFilter === p.value
              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
              : "bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-purple-200"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
