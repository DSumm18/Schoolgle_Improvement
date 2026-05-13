"use client";

import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Database,
  Info,
  ShieldCheck,
  ClipboardCheck,
  FileSearch,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import { useGemsAuditData } from "@/hooks/estates-audit/useGemsAuditData";
import SchoolDetailView from "@/components/estates-audit/dashboard/SchoolDetailView";
import AllSchoolsView from "@/components/estates-audit/dashboard/AllSchoolsView";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function DashboardContent() {
  const { organization } = useAuth();
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("demo") === "1";
  const { data, schoolData, loading, error } = useGemsAuditData({
    organizationId: organization?.id,
    demo: demoMode,
  });
  const [selectedSchoolId, setSelectedSchoolId] = useState("all");

  const selectedSchool = useMemo(() => {
    if (selectedSchoolId === "all") {
      return undefined;
    }
    return schoolData.find((school) => school.id === selectedSchoolId);
  }, [schoolData, selectedSchoolId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600 animate-pulse" />
        </div>
        <div className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Building GEMS assurance view...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {error && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-amber-950 dark:text-amber-100">
                  Unable to build live GEMS audit
                </h2>
                <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200">
                  {error}. The page will not show sample schools unless demo
                  mode is explicitly requested with <code>?demo=1</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {demoMode && (
        <div className="relative overflow-hidden bg-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-200">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-sm">
                  Demo mode: viewing sample GEMS audit data
                </span>
                <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mt-0.5">
                  This mode is only for visual checks and is never used by default
                </p>
              </div>
            </div>
          </div>
          {/* Decorative */}
          <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-white/10 to-transparent skew-x-12 transform translate-x-32" />
        </div>
      )}

      {/* Modern Sub-Header / Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              GEMS Audit
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {data?.organization?.name
                ? `${data.organization.name} · live DfE Good Estate Management assurance`
                : "DfE Good Estate Management assurance check"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
              Context:
            </span>
            <Select
              value={selectedSchoolId}
              onValueChange={setSelectedSchoolId}
            >
              <SelectTrigger className="w-[240px] h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-sm">
                <SelectValue placeholder="Select context" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-bold">
                  Portfolio Overview
                </SelectItem>
                {schoolData.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <h2 className="text-base font-black text-slate-950 dark:text-slate-100">
            What this audits
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Checks whether the school has the estate policies, compliance
            routines, asset data, condition evidence, risks, and strategy that
            DfE GEMS expects to see.
          </p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <FileSearch className="h-5 w-5" />
          </div>
          <h2 className="text-base font-black text-slate-950 dark:text-slate-100">
            How Schoolgle uses it
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            It should review evidence already created in compliance checks,
            contractors, assets, condition surveys, SOPs, and the estate
            strategy before asking users for more work.
          </p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <h2 className="text-base font-black text-slate-950 dark:text-slate-100">
            Governance output
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Governors and trustees get an assurance view: what is in place,
            what is partial, what is missing, and which gaps need actions or
            new mini-app workflows.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {!loading && schoolData.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:bg-slate-900">
            <h2 className="text-xl font-black text-slate-950 dark:text-slate-100">
              No live school data found
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              The audit is connected to the current organisation, but no
              school records were returned. Once Grove House or the Pennine
              trust schools are present in the organisation structure, their
              evidence gaps will appear here.
            </p>
          </div>
        ) : selectedSchoolId === "all" ? (
          <AllSchoolsView
            schoolData={schoolData}
            onSelectSchool={(school) => setSelectedSchoolId(school.id)}
          />
        ) : (
          <SchoolDetailView
            school={selectedSchool!}
            onBack={() => setSelectedSchoolId("all")}
          />
        )}
      </div>
    </div>
  );
}

export default function EstatesAuditDashboard() {
  return <DashboardContent />;
}
