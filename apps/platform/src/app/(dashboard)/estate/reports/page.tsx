"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  badgeClass?: string;
  comingSoon?: boolean;
}

// ---------------------------------------------------------------------------
// Report definitions
// ---------------------------------------------------------------------------

const REPORTS: ReportCard[] = [
  {
    id: "compliance-summary",
    title: "Compliance Summary",
    description:
      "RAG overview of all compliance domains — fire, legionella, asbestos, electrical, gas, and more. Identifies gaps and overdue checks at a glance.",
    icon: ShieldCheck,
    badge: "PDF",
    badgeClass: "bg-red-100 text-red-700",
  },
  {
    id: "governor-report",
    title: "Governor Report",
    description:
      "Termly estates compliance report formatted for governors and trustees. Covers statutory obligations, recent works, upcoming renewals, and budget overview.",
    icon: FileText,
    badge: "PDF",
    badgeClass: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "overdue-items",
    title: "Overdue Items",
    description:
      "Comprehensive list of all overdue compliance checks, inspections, and tasks. Includes responsible parties, days overdue, and RAG escalation status.",
    icon: AlertCircle,
    badge: "Live",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  {
    id: "cost-analysis",
    title: "Cost Analysis",
    description:
      "Breakdown of estates compliance costs by domain, contractor, and financial year. Compare planned vs actual spend with budget variance indicators.",
    icon: BarChart3,
    badge: "PDF",
    badgeClass: "bg-green-100 text-green-700",
  },
  {
    id: "annual-plan",
    title: "Annual Compliance Plan",
    description:
      "Full-year schedule of all statutory and recommended compliance activities, mapped to term dates. Ideal for governor reporting and audit preparation.",
    icon: Calendar,
    badge: "PDF",
    badgeClass: "bg-blue-100 text-blue-700",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EstateReportsPage() {
  function handleGenerate(reportId: string, reportTitle: string) {
    toast.info(`${reportTitle} — report generation coming soon`, {
      description:
        "This feature is in development. You will be notified when it is ready.",
    });
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link
          href="/estate"
          className="hover:text-[#9F1239] transition-colors font-medium"
        >
          Estate
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">Reports &amp; Governor Packs</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Reports &amp; Governor Packs
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate compliance summaries, governor reports, and annual plans for
          your estate
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-[#9F1239]/20 bg-[#9F1239]/5 p-4">
        <ClipboardList className="w-5 h-5 text-[#9F1239] mt-0.5 shrink-0" />
        <div className="text-sm text-[#9F1239]">
          <p className="font-semibold">Report generation coming soon</p>
          <p className="mt-0.5 text-[#9F1239]/80">
            These reports will pull live data from your compliance tasks, assets,
            contractor records, and budget to produce publish-ready documents.
            Click Generate on any report to be notified when it is available.
          </p>
        </div>
      </div>

      {/* Report cards grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.id}
              className="flex flex-col hover:shadow-md hover:border-[#9F1239]/30 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#9F1239]/10 shrink-0">
                      <Icon className="w-5 h-5 text-[#9F1239]" />
                    </div>
                    <div>
                      <CardTitle className="text-base leading-tight">
                        {report.title}
                      </CardTitle>
                      {report.badge && (
                        <Badge
                          className={`text-[10px] px-1.5 py-0 mt-1 ${report.badgeClass}`}
                        >
                          {report.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-4">
                <CardDescription className="text-sm text-gray-600 leading-relaxed">
                  {report.description}
                </CardDescription>
                <div className="mt-auto">
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-[#9F1239] hover:bg-[#881030] text-white"
                    onClick={() => handleGenerate(report.id, report.title)}
                  >
                    <Download className="w-4 h-4" />
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent reports placeholder */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Recent Reports
        </h2>
        <Card className="border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Previously generated reports will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
