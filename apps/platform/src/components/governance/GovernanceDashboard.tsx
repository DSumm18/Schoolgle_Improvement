"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  BookOpen,
  FileText,
  ClipboardCheck,
  TrendingUp,
  Settings,
  Plus,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GovernorsList from "./GovernorsList";
import MeetingsCalendar from "./MeetingsCalendar";
import TrainingTracker from "./TrainingTracker";
import PolicyReviewList from "./PolicyReviewList";
import VisitScheduler from "./VisitScheduler";
import KPIsDashboard from "./KPIsDashboard";
import GovernorModal from "./GovernorModal";
import MeetingModal from "./MeetingModal";
import { GovernanceStatistics } from "@/lib/governance";

interface GovernanceDashboardProps {
  organizationId: string;
  refreshKey?: number;
}

export default function GovernanceDashboard({
  organizationId,
  refreshKey,
}: GovernanceDashboardProps) {
  const [statistics, setStatistics] = useState<GovernanceStatistics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [governorModalOpen, setGovernorModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, [organizationId, refreshKey]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `/api/governance/kpis?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.current);
      }
    } catch (error) {
      console.error("Failed to fetch governance statistics:", error);
      toast.error("Failed to load governance data");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Governors",
      value: statistics?.total_governors || 0,
      active: statistics?.active_governors || 0,
      vacancies: statistics?.vacant_positions || 0,
      icon: Users,
      color: "blue",
      trend: `${Math.round(((statistics?.active_governors || 0) / (statistics?.total_governors || 1)) * 100)}% active`,
    },
    {
      title: "Attendance Rate",
      value: `${statistics?.average_attendance_rate || 0}%`,
      icon: ClipboardCheck,
      color: "emerald",
      trend: "This term",
    },
    {
      title: "Policies",
      value: statistics?.statutory_policies || 0,
      active: statistics?.policies_current || 0,
      overdue: statistics?.policies_overdue || 0,
      icon: FileText,
      color: "violet",
      trend: `${statistics?.policies_need_review || 0} need review`,
    },
    {
      title: "Training",
      value: `${statistics?.training_completion_rate || 0}%`,
      expired: statistics?.expired_training_count || 0,
      icon: BookOpen,
      color: "amber",
      trend: `${statistics?.expired_training_count || 0} expired`,
    },
    {
      title: "Upcoming Meetings",
      value: statistics?.upcoming_meetings || 0,
      icon: Calendar,
      color: "rose",
      trend: "Next 30 days",
    },
    {
      title: "Visits This Term",
      value: statistics?.visits_completed || 0,
      scheduled: statistics?.visits_scheduled || 0,
      icon: TrendingUp,
      color: "indigo",
      trend: `${statistics?.visits_scheduled || 0} scheduled`,
    },
  ];

  const getStatCardStyles = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "from-blue-500/10 to-indigo-500/10 border-blue-200",
      emerald: "from-emerald-500/10 to-teal-500/10 border-emerald-200",
      violet: "from-violet-500/10 to-purple-500/10 border-violet-200",
      amber: "from-amber-500/10 to-orange-500/10 border-amber-200",
      rose: "from-rose-500/10 to-pink-500/10 border-rose-200",
      indigo: "from-indigo-500/10 to-blue-500/10 border-indigo-200",
    };
    return colorMap[color] || colorMap.blue;
  };

  const getIconColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "text-blue-600 bg-blue-100",
      emerald: "text-emerald-600 bg-emerald-100",
      violet: "text-violet-600 bg-violet-100",
      amber: "text-amber-600 bg-amber-100",
      rose: "text-rose-600 bg-rose-100",
      indigo: "text-indigo-600 bg-indigo-100",
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Governance Portal
          </h1>
          <p className="text-slate-500 mt-1">
            Manage governors, meetings, training, and compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className={`bg-gradient-to-br ${getStatCardStyles(stat.color)} border`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-black text-slate-900 mt-1">
                        {stat.value}
                      </p>
                      {stat.vacancies !== undefined && stat.vacancies > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-600">
                            {stat.vacancies} vacancies
                          </span>
                        </div>
                      )}
                      {stat.overdue !== undefined && stat.overdue > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          <span className="text-[10px] font-bold text-rose-600">
                            {stat.overdue} overdue
                          </span>
                        </div>
                      )}
                      {stat.expired !== undefined && stat.expired > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-600">
                            {stat.expired} expired
                          </span>
                        </div>
                      )}
                      {stat.trend && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {stat.trend}
                        </p>
                      )}
                    </div>
                    <div
                      className={`p-2 rounded-lg ${getIconColor(stat.color)}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex h-12">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="governors"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            Governors
          </TabsTrigger>
          <TabsTrigger
            value="meetings"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            Meetings
          </TabsTrigger>
          <TabsTrigger
            value="training"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            Training
          </TabsTrigger>
          <TabsTrigger
            value="policies"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            Policies
          </TabsTrigger>
          <TabsTrigger
            value="visits"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            Visits
          </TabsTrigger>
          <TabsTrigger
            value="kpis"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            KPIs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab statistics={statistics} />
        </TabsContent>

        <TabsContent value="governors" className="mt-6">
          <GovernorsList
            organizationId={organizationId}
            onRefresh={fetchStatistics}
          />
        </TabsContent>

        <TabsContent value="meetings" className="mt-6">
          <MeetingsCalendar
            organizationId={organizationId}
            onRefresh={fetchStatistics}
          />
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          <TrainingTracker
            organizationId={organizationId}
            onRefresh={fetchStatistics}
          />
        </TabsContent>

        <TabsContent value="policies" className="mt-6">
          <PolicyReviewList
            organizationId={organizationId}
            onRefresh={fetchStatistics}
          />
        </TabsContent>

        <TabsContent value="visits" className="mt-6">
          <VisitScheduler
            organizationId={organizationId}
            onRefresh={fetchStatistics}
          />
        </TabsContent>

        <TabsContent value="kpis" className="mt-6">
          <KPIsDashboard organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <GovernorModal
        isOpen={governorModalOpen}
        onClose={() => setGovernorModalOpen(false)}
        onSave={() => {
          setGovernorModalOpen(false);
          fetchStatistics();
        }}
        organizationId={organizationId}
      />

      <MeetingModal
        isOpen={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        onSave={() => {
          setMeetingModalOpen(false);
          fetchStatistics();
        }}
        organizationId={organizationId}
      />
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  statistics,
}: {
  statistics: GovernanceStatistics | null;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Plus className="w-4 h-4 mr-2" />
            Add New Governor
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <BookOpen className="w-4 h-4 mr-2" />
            Record Training
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Add Policy Review
          </Button>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Attention Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(statistics?.vacant_positions || 0) > 0 && (
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold">Governor Vacancies</p>
                  <p className="text-xs text-slate-500">
                    {statistics?.vacant_positions} positions unfilled
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Review
              </Button>
            </div>
          )}
          {(statistics?.policies_overdue || 0) > 0 && (
            <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-rose-600" />
                <div>
                  <p className="text-sm font-semibold">
                    Overdue Policy Reviews
                  </p>
                  <p className="text-xs text-slate-500">
                    {statistics?.policies_overdue} policies need attention
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Review
              </Button>
            </div>
          )}
          {(statistics?.expired_training_count || 0) > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm font-semibold">Expired Training</p>
                  <p className="text-xs text-slate-500">
                    {statistics?.expired_training_count} certificates expired
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Review
              </Button>
            </div>
          )}
          {!statistics?.vacant_positions &&
            !statistics?.policies_overdue &&
            !statistics?.expired_training_count && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">
                  All caught up! No urgent items.
                </p>
              </div>
          )}
        </CardContent>
      </Card>

      {/* Cross-module assurance */}
      <Card className="lg:col-span-2 overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 to-slate-50 dark:border-emerald-900 dark:from-emerald-950/30 dark:to-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Estates Assurance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
              Review the DfE GEMS estate assurance position: what is in place,
              what is partial, what is missing, and which gaps need trustee
              visibility or investment decisions.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Pulls evidence from estates compliance, assets, contractors,
              condition survey, SOPs, risk register, and estate strategy.
            </p>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/dashboard/estates/audit">
              Open GEMS Audit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
