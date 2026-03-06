"use client";

import { Hammer, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ModulePageHeader,
  getModuleColors,
} from "@/components/ui/module-page-header";

export default function MaintenancePage() {
  const colors = getModuleColors("estates");

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="estates"
        icon={Hammer}
        label="Estates Management"
        title="Maintenance & Helpdesk"
        description="Manage reactive repairs and planned preventative maintenance."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Tasks
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              12
            </p>
            <p className="text-xs text-slate-500 mt-1">4 high priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 ${colors.iconBg} rounded-xl`}>
                <Clock className={`w-5 h-5 ${colors.iconText}`} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active PPM
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              18
            </p>
            <p className="text-xs text-slate-500 mt-1">Scheduled this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              45
            </p>
            <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Reactive Maintenance Log
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Recent helpdesk tickets and repair requests.
              </p>
            </div>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              Raise New Ticket
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div
              className={`w-14 h-14 rounded-2xl ${colors.iconBg} flex items-center justify-center`}
            >
              <Clock className={`w-7 h-7 ${colors.iconText}`} />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">
              Coming Soon
            </p>
            <p className="text-slate-500 text-sm max-w-sm">
              We're building an advanced school maintenance helpdesk. Stay tuned
              for the pilot.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
