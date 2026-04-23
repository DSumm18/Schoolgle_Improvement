"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Shield,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  PieChart as PieChartIcon,
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

/**
 * Pupil Intelligence Dashboard
 *
 * DYNAMIC dashboard that renders based on CONNECTOR DATA.
 * NO hardcoded values — everything comes from the database.
 */

interface PupilData {
  totalPupils: number;
  censusDate?: string;
  sen: {
    count: number;
    percentage: number;
  };
  fsm: {
    count: number;
    percentage: number;
  };
  eal: {
    count: number;
    percentage: number;
  };
  assessmentYears?: string[];
}

export default function PupilIntelligencePage() {
  const { organizationId } = useAuth();
  const [selectedYear, setSelectedYear] = useState<string>("");

  const { data: pupilData, isLoading, error } = useSWR<PupilData>(
    organizationId ? `/api/intelligence/pupils?organizationId=${organizationId}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !pupilData) {
    return (
      <div className="p-6">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold mb-2">No Data Available</h2>
          <p className="text-muted-foreground mb-4">
            Connect your school census data to view the pupil intelligence dashboard.
          </p>
          <a
            href="/dashboard/intelligence"
            className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90"
          >
            Set Up Data Connection
          </a>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const demographicsData = [
    { name: 'SEN', value: pupilData.sen.count, percentage: pupilData.sen.percentage },
    { name: 'FSM', value: pupilData.fsm.count, percentage: pupilData.fsm.percentage },
    { name: 'EAL', value: pupilData.eal.count, percentage: pupilData.eal.percentage },
  ];

  const nonSen = 100 - pupilData.sen.percentage;
  const senData = [
    { name: 'Non-SEN', value: nonSen },
    { name: 'SEN', value: pupilData.sen.percentage },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-black mb-2">Pupil Intelligence Dashboard</h1>
        {pupilData.censusDate && (
          <p className="text-muted-foreground">
            Data from census taken on {new Date(pupilData.censusDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <OverviewCard
          title="Total Pupils"
          value={pupilData.totalPupils.toLocaleString()}
          icon={Users}
          color="blue"
        />
        <OverviewCard
          title="SEN"
          value={`${pupilData.sen.percentage.toFixed(1)}%`}
          subtext={`${pupilData.sen.count} pupils`}
          icon={Shield}
          color="purple"
        />
        <OverviewCard
          title="FSM Eligible"
          value={`${pupilData.fsm.percentage.toFixed(1)}%`}
          subtext={`${pupilData.fsm.count} pupils`}
          icon={CheckCircle2}
          color="green"
        />
        <OverviewCard
          title="EAL"
          value={`${pupilData.eal.percentage.toFixed(1)}%`}
          subtext={`${pupilData.eal.count} pupils`}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SEN Breakdown Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold mb-4">SEN Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={senData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell key="non-sen" fill="#10b981" />
                <Cell key="sen" fill="#ef4444" />
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Demographics Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold mb-4">Key Demographics</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={demographicsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${props.payload.percentage.toFixed(1)}%`,
                  'Percentage'
                ]}
              />
              <Bar dataKey="percentage" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Detailed Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold mb-4">Pupil Cohort Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BreakdownCard
            title="SEN Pupils"
            count={pupilData.sen.count}
            percentage={pupilData.sen.percentage}
            color="purple"
          >
            <p className="text-sm text-muted-foreground mt-2">
              This includes pupils with SEN Support and those with EHCPs.
            </p>
          </BreakdownCard>
          <BreakdownCard
            title="FSM Eligible"
            count={pupilData.fsm.count}
            percentage={pupilData.fsm.percentage}
            color="green"
          >
            <p className="text-sm text-muted-foreground mt-2">
              Pupils eligible for free school meals or ever 6 FSM.
            </p>
          </BreakdownCard>
          <BreakdownCard
            title="EAL"
            count={pupilData.eal.count}
            percentage={pupilData.eal.percentage}
            color="orange"
          >
            <p className="text-sm text-muted-foreground mt-2">
              Pupils with English as an additional language.
            </p>
          </BreakdownCard>
        </div>
      </motion.div>

      {/* Source Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-muted/50 rounded-2xl p-4 text-sm"
      >
        <p className="text-muted-foreground">
          <strong>Data Source:</strong> This dashboard is generated from your connected school census data.
          All figures are based on pupils on roll at the time of the census.
        </p>
      </motion.div>
    </div>
  );
}

function OverviewCard({
  title,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon: any;
  color: "blue" | "purple" | "green" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400",
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black">{value}</div>
      </div>
      <div className="text-sm font-medium">{title}</div>
      {subtext && (
        <div className="text-xs text-muted-foreground mt-1">{subtext}</div>
      )}
    </div>
  );
}

function BreakdownCard({
  title,
  count,
  percentage,
  color,
  children,
}: {
  title: string;
  count: number;
  percentage: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-xl p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="text-3xl font-black mb-1">{count}</div>
      <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}% of roll</div>
      {children}
    </div>
  );
}
