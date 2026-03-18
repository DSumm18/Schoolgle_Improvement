"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Search,
  Filter,
  ArrowLeft,
  UserCheck,
  FileWarning,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import { useRouter } from "next/navigation";

interface SCREntry {
  staff_id: string;
  name: string;
  job_title: string;
  role_category: string;
  start_date: string | null;
  identity_verified: boolean;
  dbs_type: string | null;
  dbs_status: string | null;
  dbs_date: string | null;
  dbs_certificate_number: string | null;
  dbs_update_service: boolean;
  dbs_next_check: string | null;
  dbs_overdue: boolean;
  barred_list_checked: boolean;
  children_barred_list: boolean;
  right_to_work_type: string | null;
  right_to_work_date: string | null;
  right_to_work_expiry: string | null;
  right_to_work_overdue: boolean;
  has_qts: boolean;
  has_teaching_qual: boolean;
  safeguarding_trained: boolean;
  safeguarding_expiry: string | null;
  safeguarding_overdue: boolean;
  prevent_trained: boolean;
  overseas_check_required: boolean;
  overseas_check_status: string | null;
  fully_compliant: boolean;
  issues: string[];
}

type FilterMode = "all" | "compliant" | "issues";

const ROLE_LABELS: Record<string, string> = {
  headteacher: "Headteacher",
  deputy_headteacher: "Deputy Head",
  assistant_headteacher: "Asst Head",
  class_teacher: "Teacher",
  subject_lead: "Subject Lead",
  phase_lead: "Phase Lead",
  sendco: "SENCO",
  business_manager: "Business Mgr",
  site_manager: "Site Manager",
  teaching_assistant: "TA",
  support_staff: "Support",
  governor: "Governor",
  other: "Other",
};

function StatusIcon({ ok, overdue }: { ok: boolean; overdue?: boolean }) {
  if (overdue) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  if (ok) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-black">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SCRPage() {
  const router = useRouter();
  const { organization } = useAuth();
  const organizationId = organization?.id || "";
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useSWR(
    organizationId ? `/api/staff/scr?organizationId=${organizationId}` : null,
    fetcher,
  );

  const scr: SCREntry[] = data?.scr || [];
  const summary = data?.summary || {
    total: 0,
    compliant: 0,
    issues: 0,
    dbs_overdue: 0,
    safeguarding_expired: 0,
    prevent_missing: 0,
  };

  const filtered = scr.filter((s) => {
    if (filter === "compliant" && !s.fully_compliant) return false;
    if (filter === "issues" && s.fully_compliant) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.job_title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
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
        icon={Shield}
        label="Safeguarding"
        title="Single Central Record"
        description="KCSIE 2025 compliant — Ofsted checks this on day one"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard
          label="Total Staff"
          value={summary.total}
          icon={UserCheck}
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <StatCard
          label="Fully Compliant"
          value={summary.compliant}
          icon={ShieldCheck}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
        <StatCard
          label="Has Issues"
          value={summary.issues}
          icon={ShieldAlert}
          color="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        />
        <StatCard
          label="DBS Overdue"
          value={summary.dbs_overdue}
          icon={FileWarning}
          color="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
        />
        <StatCard
          label="Safeguarding Expired"
          value={summary.safeguarding_expired}
          icon={AlertTriangle}
          color="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
        />
        <StatCard
          label="Prevent Missing"
          value={summary.prevent_missing}
          icon={XCircle}
          color="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {(
            [
              { label: "All", value: "all" },
              { label: "Compliant", value: "compliant" },
              { label: "Issues", value: "issues" },
            ] as { label: string; value: FilterMode }[]
          ).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === tab.value
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
      </div>

      {/* SCR Table */}
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">
                  Name
                </th>
                <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                  Role
                </th>
                <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                  ID
                </th>
                <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                  DBS
                </th>
                <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                  Barred
                </th>
                <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                  RTW
                </th>
                <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                  QTS
                </th>
                <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                  Safeguard
                </th>
                <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                  Prevent
                </th>
                <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                  Issues
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => (
                <motion.tr
                  key={entry.staff_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                    !entry.fully_compliant
                      ? "bg-red-50/30 dark:bg-red-900/5"
                      : ""
                  }`}
                  onClick={() =>
                    router.push(`/dashboard/hr/people/${entry.staff_id}`)
                  }
                >
                  <td className="py-2.5 px-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {entry.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.job_title}
                      </p>
                    </div>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
                      {ROLE_LABELS[entry.role_category] || entry.role_category}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <StatusIcon ok={entry.identity_verified} />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex flex-col items-center">
                      <StatusIcon
                        ok={entry.dbs_status === "clear"}
                        overdue={entry.dbs_overdue}
                      />
                      {entry.dbs_date && (
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(entry.dbs_date)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <StatusIcon ok={entry.barred_list_checked} />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <StatusIcon
                      ok={!!entry.right_to_work_type}
                      overdue={entry.right_to_work_overdue}
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <StatusIcon ok={entry.has_qts} />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <StatusIcon
                      ok={entry.safeguarding_trained}
                      overdue={entry.safeguarding_overdue}
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <StatusIcon ok={entry.prevent_trained} />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {entry.fully_compliant ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        {entry.issues.length}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2">
                    {entry.issues.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.issues.slice(0, 2).map((issue, j) => (
                          <span
                            key={j}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                          >
                            {issue}
                          </span>
                        ))}
                        {entry.issues.length > 2 && (
                          <span className="text-[10px] text-slate-400">
                            +{entry.issues.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ofsted note */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="p-4 flex gap-3">
          <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-300">
              KCSIE 2025 Compliance
            </p>
            <p className="text-blue-700 dark:text-blue-400 mt-1">
              The Single Central Record must include: identity checks, DBS
              (enhanced with barred list), right to work, qualifications (QTS
              for teachers), safeguarding training, and Prevent duty training
              for all staff, supply staff, and regular volunteers. Ofsted will
              check this is up to date during inspection.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
