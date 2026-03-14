"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStaffing } from "@/store/staffingStore";
import { TopMetricsBar } from "./TopMetricsBar";
import { PayAssumptionsBar } from "./PayAssumptionsBar";
import { ScenarioTabs } from "./ScenarioTabs";
import { CanvasView } from "./Canvas/CanvasView";
import { ICFPMetricsView } from "./ICFPMetrics/ICFPMetricsView";
import { CurriculumFitView } from "./CurriculumFit/CurriculumFitView";
import { ForecastView } from "./Forecast/ForecastView";
import { MonthlyView } from "./MonthlyView";
import { AIAdvisorView } from "./AIAdvisor/AIAdvisorView";
import {
  LayoutGrid,
  BarChart3,
  GraduationCap,
  TrendingUp,
  Calendar,
  Sparkles,
} from "lucide-react";

const TABS = [
  { id: "canvas", label: "Staff Canvas", icon: LayoutGrid },
  { id: "icfp", label: "ICFP Metrics", icon: BarChart3 },
  { id: "curriculum", label: "Curriculum Fit", icon: GraduationCap },
  { id: "forecast", label: "3-Year Forecast", icon: TrendingUp },
  { id: "monthly", label: "Monthly View", icon: Calendar },
  { id: "advisor", label: "AI Advisor", icon: Sparkles },
] as const;

export function StaffingModeller() {
  const { state } = useStaffing();
  const [activeTab, setActiveTab] = useState<string>("canvas");

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-[#0F6E56] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Staff Budget Modeller
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ICFP staffing analysis &middot; drag to model scenarios
          </p>
        </div>
      </div>

      {/* Scenario selector */}
      <ScenarioTabs />

      {/* Pay assumptions */}
      <PayAssumptionsBar />

      {/* Top KPIs */}
      <TopMetricsBar />

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/50 h-auto p-1 flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="gap-1.5 data-[state=active]:bg-[#0F6E56] data-[state=active]:text-white"
            >
              <Icon className="h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="canvas">
          <CanvasView />
        </TabsContent>
        <TabsContent value="icfp">
          <ICFPMetricsView />
        </TabsContent>
        <TabsContent value="curriculum">
          <CurriculumFitView />
        </TabsContent>
        <TabsContent value="forecast">
          <ForecastView />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlyView />
        </TabsContent>
        <TabsContent value="advisor">
          <AIAdvisorView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
