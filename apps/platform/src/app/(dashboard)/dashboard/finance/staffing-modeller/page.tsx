"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { StaffingProvider } from "@/store/staffingStore";
import { StaffingModeller } from "@/components/finance/staffing-modeller/StaffingModeller";
import {
  getSchoolSettings,
  getStaffPosts,
  getScenarios,
  getScenarioPosts,
  getPayAssumptions,
  createBaselineScenario,
} from "./actions";
import type {
  SchoolSettings,
  StaffPost,
  StaffingScenario,
  ScenarioPost,
  PayAssumption,
} from "@/types/staffing";

export default function StaffingModellerPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    schoolSettings: SchoolSettings | null;
    staffPosts: StaffPost[];
    scenarios: StaffingScenario[];
    activeScenarioId: string;
    scenarioPosts: (ScenarioPost & { staff_post: StaffPost })[];
    payAssumptions: PayAssumption[];
  } | null>(null);

  useEffect(() => {
    if (!orgId) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [schoolSettings, staffPosts, scenarios] = await Promise.all([
          getSchoolSettings(orgId!),
          getStaffPosts(orgId!),
          getScenarios(orgId!),
        ]);

        let activeScenarios = scenarios;
        if (activeScenarios.length === 0) {
          const baseline = await createBaselineScenario(orgId!, staffPosts);
          activeScenarios = [baseline];
        }

        const activeScenarioId = activeScenarios[0].id;

        const [scenarioPosts, payAssumptions] = await Promise.all([
          getScenarioPosts(activeScenarioId),
          getPayAssumptions(activeScenarioId),
        ]);

        setData({
          schoolSettings,
          staffPosts,
          scenarios: activeScenarios,
          activeScenarioId,
          scenarioPosts,
          payAssumptions,
        });
      } catch (err) {
        console.error("Failed to load staffing data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [orgId]);

  if (!orgId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-400">Loading organization...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-[#FFAA4C] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-400">{error}</p>
        <p className="text-sm text-slate-500">
          The staffing modeller tables may not be set up yet. Run the migration
          first.
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <StaffingProvider initialData={data}>
      <StaffingModeller />
    </StaffingProvider>
  );
}
