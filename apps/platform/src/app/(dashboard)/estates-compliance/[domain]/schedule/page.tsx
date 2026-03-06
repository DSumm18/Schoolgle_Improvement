"use client";

/**
 * Domain Schedule Page
 *
 * Configure automated scheduling for compliance checks within a domain
 */

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Bell,
  Save,
  Plus,
  Trash2,
  Users,
  Check,
} from "lucide-react";
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  type ComplianceDomain,
  type StatutoryCheck,
} from "@/lib/estates-compliance/statutory-checks";

interface ScheduledCheck {
  checkId: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually";
  startDate: string;
  reminderDays: number;
  assignee?: string;
  autoCreate: boolean;
}

export default function DomainSchedulePage() {
  const params = useParams();
  const domainSlug = params.domain as ComplianceDomain;

  if (!domainSlug || !DOMAIN_METADATA[domainSlug]) {
    notFound();
  }

  const metadata = DOMAIN_METADATA[domainSlug];
  const checks = getChecksForDomain(domainSlug);

  const [schedules, setSchedules] = useState<Record<string, ScheduledCheck>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Initialize schedules for all checks
    const initialSchedules: Record<string, ScheduledCheck> = {};
    checks.forEach((check) => {
      initialSchedules[check.id] = {
        checkId: check.id,
        frequency: check.frequency as any,
        startDate: new Date().toISOString().split("T")[0],
        reminderDays: 7,
        autoCreate: true,
      };
    });
    setSchedules(initialSchedules);
  }, [checks]);

  const handleUpdateSchedule = (
    checkId: string,
    updates: Partial<ScheduledCheck>,
  ) => {
    setSchedules((prev) => ({
      ...prev,
      [checkId]: { ...prev[checkId], ...updates },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getNextDueDate = (schedule: ScheduledCheck) => {
    const start = new Date(schedule.startDate);
    let next = new Date(start);

    switch (schedule.frequency) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "annually":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getFrequencyColor = (freq: string) => {
    switch (freq) {
      case "daily":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700";
      case "weekly":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700";
      case "monthly":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-700";
      case "quarterly":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-700";
      case "annually":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/estates-compliance/${domainSlug}`}
              className="inline-flex items-center gap-1 text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {metadata.name}
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Schedule Compliance Checks
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure automated reminders and task scheduling for{" "}
            {metadata.name}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-teal-600 dark:border-teal-500 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:border-gray-400 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Schedule"}
            </>
          )}
        </button>
      </div>

      {/* Schedule Overview */}
      <div className="rounded-xl border-2 border-teal-300 dark:border-teal-700 bg-gradient-to-r from-teal-50 via-teal-50 to-cyan-50 dark:from-teal-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/50">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Schedule Overview
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {checks.length} checks configured for automated scheduling
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {Object.values(schedules).filter((s) => s.autoCreate).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
              Auto-Enabled
            </div>
          </div>
          <div className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {
                Object.values(schedules).filter((s) => s.reminderDays > 0)
                  .length
              }
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
              With Reminders
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Configuration */}
      <div className="space-y-4">
        {checks.map((check) => {
          const schedule = schedules[check.id];
          if (!schedule) return null;

          const nextDue = getNextDueDate(schedule);

          return (
            <div
              key={check.id}
              className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {check.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${getFrequencyColor(schedule.frequency)}`}
                      >
                        {schedule.frequency.charAt(0).toUpperCase() +
                          schedule.frequency.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {check.description}
                    </p>
                    {check.reference && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        📋 Ref: {check.reference}
                      </p>
                    )}
                  </div>
                  <div className="text-right bg-gray-50 dark:bg-gray-900/50 rounded-lg px-4 py-2 border-2 border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                      Next Due
                    </div>
                    <div className="text-sm font-bold text-teal-600 dark:text-teal-400">
                      {nextDue}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Frequency */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="w-4 h-4 text-teal-500" />
                      Frequency
                    </label>
                    <select
                      value={schedule.frequency}
                      onChange={(e) =>
                        handleUpdateSchedule(check.id, {
                          frequency: e.target
                            .value as ScheduledCheck["frequency"],
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 text-teal-500" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={schedule.startDate}
                      onChange={(e) =>
                        handleUpdateSchedule(check.id, {
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  {/* Reminder Days */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <Bell className="w-4 h-4 text-teal-500" />
                      Reminder (days before)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={schedule.reminderDays}
                      onChange={(e) =>
                        handleUpdateSchedule(check.id, {
                          reminderDays: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  {/* Auto Create Toggle */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <Plus className="w-4 h-4 text-teal-500" />
                      Auto-Create Tasks
                    </label>
                    <div className="h-10 flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schedule.autoCreate}
                          onChange={(e) =>
                            handleUpdateSchedule(check.id, {
                              autoCreate: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal-600 border-2 border-gray-400"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Assignee */}
                <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="w-4 h-4 text-teal-500" />
                    Default Assignee (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Site Manager, Caretaker, etc."
                    value={schedule.assignee || ""}
                    onChange={(e) =>
                      handleUpdateSchedule(check.id, {
                        assignee: e.target.value || undefined,
                      })
                    }
                    className="w-full sm:w-64 px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Actions */}
      <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
          Bulk Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const updated = { ...schedules };
              checks.forEach((check) => {
                updated[check.id] = { ...updated[check.id], autoCreate: true };
              });
              setSchedules(updated);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 border border-green-700 shadow-sm hover:shadow transition-all"
          >
            <Check className="w-4 h-4" />
            Enable All Auto-Create
          </button>
          <button
            onClick={() => {
              const updated = { ...schedules };
              checks.forEach((check) => {
                updated[check.id] = { ...updated[check.id], reminderDays: 7 };
              });
              setSchedules(updated);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 shadow-sm hover:shadow transition-all"
          >
            <Bell className="w-4 h-4" />
            Set All Reminders to 7 Days
          </button>
          <button
            onClick={() => {
              const updated = { ...schedules };
              checks.forEach((check) => {
                updated[check.id] = { ...updated[check.id], autoCreate: false };
              });
              setSchedules(updated);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 border border-red-700 shadow-sm hover:shadow transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Disable All Auto-Create
          </button>
        </div>
      </div>
    </div>
  );
}
