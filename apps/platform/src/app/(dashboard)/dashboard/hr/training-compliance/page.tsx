"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  ShieldAlert,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import {
  getTrainingComplianceTone,
  summarizeTrainingCompliance,
} from "@/lib/hr/training-compliance";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TrainingCategory {
  category: string;
  label: string;
  refresh_months: number;
  total_staff: number;
  compliant: number;
  compliance_pct: number;
  expired_count: number;
  expiring_soon_count: number;
  never_completed_count: number;
  expired: Array<{ staff_id: string; name: string; job_title: string }>;
  expiring_soon: Array<{ staff_id: string; name: string; job_title: string }>;
  never_completed: Array<{ staff_id: string; name: string; job_title: string }>;
}

const toneStyles = {
  strong: "text-emerald-700 bg-emerald-50 border-emerald-200",
  watch: "text-amber-700 bg-amber-50 border-amber-200",
  risk: "text-red-700 bg-red-50 border-red-200",
};

function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  className: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${className}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrainingCompliancePage() {
  const router = useRouter();
  const { organization } = useAuth();
  const organizationId = organization?.id || "";
  const { data, isLoading } = useSWR(
    organizationId
      ? `/api/staff/training-compliance?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  const categories: TrainingCategory[] = data?.categories || [];
  const summary = summarizeTrainingCompliance(categories);
  const overallCompliance = data?.overall_compliance_pct || 0;

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/hr")}
        className="text-slate-600 dark:text-slate-400"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to HR
      </Button>

      <ModulePageHeader
        moduleId="hr"
        icon={GraduationCap}
        label="HR & People"
        title="Training Compliance"
        description="Track mandatory staff training, expiry risk and missing records across safeguarding, Prevent, fire safety, first aid, GDPR and health and safety."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Overall Compliance"
          value={`${overallCompliance}%`}
          icon={BookOpenCheck}
          className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <StatCard
          label="Compliant Records"
          value={summary.compliant}
          icon={CheckCircle2}
          className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
        <StatCard
          label="Expired"
          value={summary.expired}
          icon={ShieldAlert}
          className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        />
        <StatCard
          label="Expiring Soon"
          value={summary.expiringSoon}
          icon={Clock}
          className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
        />
        <StatCard
          label="Never Completed"
          value={summary.neverCompleted}
          icon={AlertTriangle}
          className="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
        />
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              No active staff found
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Add staff records before tracking mandatory training compliance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories.map((category, index) => {
            const tone = getTrainingComplianceTone(category.compliance_pct);
            const actionCount =
              category.expired_count +
              category.expiring_soon_count +
              category.never_completed_count;

            return (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="font-bold text-slate-900 dark:text-white">
                            {category.label}
                          </h2>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${toneStyles[tone]}`}
                          >
                            {category.compliance_pct}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Refresh every {category.refresh_months} months.{" "}
                          {category.compliant} of {category.total_staff} staff
                          currently compliant.
                        </p>
                        <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              tone === "strong"
                                ? "bg-emerald-500"
                                : tone === "watch"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${category.compliance_pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 lg:w-[360px]">
                        {[
                          ["Expired", category.expired_count, "text-red-600"],
                          [
                            "Soon",
                            category.expiring_soon_count,
                            "text-amber-600",
                          ],
                          [
                            "Missing",
                            category.never_completed_count,
                            "text-rose-600",
                          ],
                        ].map(([label, value, color]) => (
                          <div
                            key={label}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center"
                          >
                            <p className={`text-xl font-black ${color}`}>
                              {value}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {actionCount > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          ...category.expired,
                          ...category.expiring_soon,
                          ...category.never_completed,
                        ]
                          .slice(0, 6)
                          .map((staff) => (
                            <span
                              key={`${category.category}-${staff.staff_id}`}
                              className="text-xs rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300"
                            >
                              {staff.name}
                            </span>
                          ))}
                        {actionCount > 6 && (
                          <span className="text-xs rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-400">
                            +{actionCount - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
