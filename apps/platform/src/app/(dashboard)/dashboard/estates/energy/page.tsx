"use client";

import { Zap, TrendingDown, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ModulePageHeader,
  ModuleFeatureBanner,
  getModuleColors,
} from "@/components/ui/module-page-header";

export default function EnergyPage() {
  const colors = getModuleColors("estates");

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="estates"
        icon={Zap}
        label="Estates Management"
        title="Energy & Utilities"
        description="Monitor consumption, carbon footprint, and costs."
        badge="Preview"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 ${colors.iconBg} rounded-xl`}>
                <Zap className={`w-5 h-5 ${colors.iconText}`} />
              </div>
              <Badge
                variant="secondary"
                className="bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400"
              >
                Live Monitoring
              </Badge>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              £4,281.20
            </p>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
              Estimated billing this month
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <TrendingDown className="w-4 h-4" />
              -12% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              >
                Sustainability
              </Badge>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              14.2 Tons
            </p>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
              CO2 Footprint (Current Quarter)
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              Your school is performing 8% better than the regional average for
              energy efficiency.
            </p>
          </CardContent>
        </Card>
      </div>

      <ModuleFeatureBanner
        moduleId="estates"
        icon={Zap}
        title="Smart Meter Integration Coming Soon"
        description="Smart meter integration and billing automation tools are being finalized for the next release."
      />
    </div>
  );
}
