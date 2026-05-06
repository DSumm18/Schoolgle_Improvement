"use client";

import { AlertCircle, Clock, Lock } from "lucide-react";
import type { SubscriptionState } from "@/lib/subscription/state";
import { APPS, MODULES } from "@/lib/modules/registry";

interface Props {
  state: SubscriptionState;
}

export default function SubscriptionBanner({ state }: Props) {
  // No subscription record at all — don't show anything (legacy users)
  if (state.status === "none") return null;

  // Expired / cancelled
  if (state.isExpired || state.status === "cancelled" || state.status === "expired") {
    return (
      <div className="w-full bg-red-500/10 border-b border-red-500/30 text-red-700 dark:text-red-300 px-6 py-3 flex items-center gap-3">
        <Lock size={18} />
        <div className="flex-1">
          <p className="font-semibold text-sm">
            Your Schoolgle {state.status === "cancelled" ? "subscription was cancelled" : "trial has ended"}
          </p>
          <p className="text-xs opacity-80">
            {state.effectiveEnd
              ? `Expired on ${new Date(state.effectiveEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. `
              : ""}
            Contact your Schoolgle account manager to renew.
          </p>
        </div>
      </div>
    );
  }

  // Trialing — countdown
  if (state.isTrialing && state.daysRemaining !== null) {
    const urgent = state.daysRemaining <= 2;
    const enabledLabels = state.enabledModules
      .filter((moduleId) => moduleId !== "toolbox")
      .map((moduleId) => APPS.find((app) => app.id === moduleId)?.name || MODULES.find((module) => module.id === moduleId)?.name || moduleId)
      .filter(Boolean);
    return (
      <div
        className={`w-full border-b px-6 py-3 flex items-center gap-3 ${
          urgent
            ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
            : "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300"
        }`}
      >
        {urgent ? <AlertCircle size={18} /> : <Clock size={18} />}
        <div className="flex-1">
          <p className="font-semibold text-sm">
            {state.daysRemaining} day{state.daysRemaining === 1 ? "" : "s"} remaining on your Schoolgle trial
          </p>
          <p className="text-xs opacity-80">
            Trial ends{" "}
            {state.effectiveEnd
              ? new Date(state.effectiveEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
              : "soon"}
            . Enabled product{enabledLabels.length === 1 ? "" : "s"}: {enabledLabels.join(", ") || "none"}.
          </p>
        </div>
      </div>
    );
  }

  // Active paid subscription — silent (no banner needed)
  return null;
}
