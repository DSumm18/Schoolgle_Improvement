"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { GetTeamWorkloadResponse, TeamWorkload } from "@/lib/tasks";

interface WorkloadViewProps {
  organizationId: string;
}

export default function WorkloadView({ organizationId }: WorkloadViewProps) {
  const [workloadData, setWorkloadData] =
    useState<GetTeamWorkloadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"tasks" | "hours" | "name">("tasks");

  useEffect(() => {
    fetchWorkload();
  }, [organizationId]);

  const fetchWorkload = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/teams/workload?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setWorkloadData(data);
      }
    } catch (error) {
      console.error("Failed to fetch workload:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkload = workloadData?.workload || [];

  const sortedWorkload = [...filteredWorkload].sort((a, b) => {
    if (sortBy === "hours") {
      return (b.total_actual_hours || 0) - (a.total_actual_hours || 0);
    }
    if (sortBy === "name") {
      return a.user_name?.localeCompare(b.user_name || "") || 0;
    }
    return (b.total_tasks || 0) - (a.total_tasks || 0);
  });

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return "bg-rose-500";
    if (utilization > 80) return "bg-amber-500";
    if (utilization > 50) return "bg-blue-500";
    return "bg-emerald-500";
  };

  const getCapacityStatus = (user: TeamWorkload) => {
    const utilization = user.total_estimated_hours
      ? (user.total_actual_hours / user.total_estimated_hours) * 100
      : 0;

    if (utilization > 100)
      return { status: "Overutilized", color: "text-rose-600 bg-rose-50" };
    if (utilization > 80)
      return { status: "At Capacity", color: "text-amber-600 bg-amber-50" };
    if (utilization > 50)
      return { status: "Available", color: "text-blue-600 bg-blue-50" };
    return { status: "Underutilized", color: "text-emerald-600 bg-emerald-50" };
  };

  const summary = workloadData?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Team Workload</h2>
          <p className="text-sm text-slate-500">
            View task distribution and capacity across team members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as any)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tasks">Most Tasks</SelectItem>
              <SelectItem value="hours">Most Hours</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Team Members"
            value={summary.total_users || 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Total Tasks"
            value={summary.total_tasks || 0}
            icon={TrendingUp}
            color="emerald"
          />
          <StatCard
            label="Total Hours"
            value={`${summary.total_hours_allocated?.toFixed(1) || 0}h`}
            icon={Clock}
            color="amber"
          />
          <StatCard
            label="Completion Rate"
            value={`${Math.round((summary.total_hours_spent / (summary.total_hours_allocated || 1)) * 100)}%`}
            icon={CheckCircle}
            color="violet"
          />
        </div>
      )}

      {/* Workload List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Member Workload</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : sortedWorkload.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No team members found</p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedWorkload.map((user, idx) => {
                const capacity = getCapacityStatus(user);
                const utilization = user.total_estimated_hours
                  ? Math.round(
                      (user.total_actual_hours / user.total_estimated_hours) *
                        100,
                    )
                  : 0;

                return (
                  <motion.div
                    key={user.user_id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                        {(user.user_name || "U").charAt(0).toUpperCase()}
                      </div>

                      {/* Name & Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {user.user_name || "Unknown"}
                          </span>
                          <Badge className={`text-[10px] ${capacity.color}`}>
                            {capacity.status}
                          </Badge>
                        </div>
                        {(user as any).team_name && (
                          <p className="text-xs text-slate-500">
                            {(user as any).team_name}
                          </p>
                        )}
                      </div>

                      {/* Task Count */}
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {user.total_tasks || 0}
                        </p>
                        <p className="text-[10px] uppercase text-slate-500">
                          Tasks
                        </p>
                      </div>

                      {/* Hours Bar */}
                      <div className="flex-1 min-w-[150px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">
                            {user.total_actual_hours?.toFixed(1) || 0}h
                          </span>
                          <span className="text-slate-400">
                            {user.total_estimated_hours
                              ? `${user.total_estimated_hours}h`
                              : "No cap"}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getUtilizationColor(utilization)} transition-all`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {utilization.toFixed(0)}% utilized
                        </p>
                      </div>

                      {/* Overdue Indicator */}
                      {user.overdue_tasks > 0 && (
                        <div className="text-center">
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                          <p className="text-xs text-rose-600 font-medium mt-0.5">
                            {user.overdue_tasks} overdue
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    violet: "bg-violet-100 text-violet-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">
              {label}
            </p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
