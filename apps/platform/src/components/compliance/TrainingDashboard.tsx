"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TrainingCompletionModal from "./TrainingCompletionModal";
import {
  TrainingCourse,
  TrainingCompletion,
  TrainingRequirement,
  DEFAULT_TRAINING_ROLES,
} from "@/lib/compliance/types";

interface TrainingDashboardProps {
  organizationId: string;
}

interface TrainingStats {
  total_courses: number;
  compliance_rate: number;
  overdue_count: number;
  expiring_soon: number;
}

export default function TrainingDashboard({
  organizationId,
}: TrainingDashboardProps) {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
  const [requirements, setRequirements] = useState<TrainingRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, completionsRes, requirementsRes] = await Promise.all([
        fetch(
          `/api/compliance/training/courses?organizationId=${organizationId}`,
        ),
        fetch(
          `/api/compliance/training/completions?organizationId=${organizationId}`,
        ),
        fetch(
          `/api/compliance/training/requirements?organizationId=${organizationId}`,
        ),
      ]);

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }
      if (completionsRes.ok) {
        const data = await completionsRes.json();
        setCompletions(data.completions || []);
      }
      if (requirementsRes.ok) {
        const data = await requirementsRes.json();
        setRequirements(data.requirements || []);
      }
    } catch (error) {
      console.error("Failed to fetch training data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo<TrainingStats>(() => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const overdue = completions.filter((c) => {
      if (!c.expires_at) return false;
      return new Date(c.expires_at) < now;
    });

    const expiring = completions.filter((c) => {
      if (!c.expires_at) return false;
      const exp = new Date(c.expires_at);
      return exp >= now && exp <= thirtyDays;
    });

    const totalRequired = requirements.length;
    const met =
      totalRequired > 0
        ? completions.filter(
            (c) => !c.expires_at || new Date(c.expires_at) >= now,
          ).length
        : 0;

    return {
      total_courses: courses.length,
      compliance_rate:
        totalRequired > 0 ? Math.round((met / totalRequired) * 100) : 100,
      overdue_count: overdue.length,
      expiring_soon: expiring.length,
    };
  }, [courses, completions, requirements]);

  const overdueStaff = useMemo(() => {
    const now = new Date();
    return completions
      .filter((c) => c.expires_at && new Date(c.expires_at) < now)
      .map((c) => ({
        ...c,
        course_title: c.course?.title || "Unknown course",
      }));
  }, [completions]);

  const filteredCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [courses, searchQuery]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Courses"
          value={stats.total_courses}
          icon={BookOpen}
          color="purple"
        />
        <SummaryCard
          label="Compliance Rate"
          value={`${stats.compliance_rate}%`}
          icon={CheckCircle}
          color="emerald"
        />
        <SummaryCard
          label="Overdue"
          value={stats.overdue_count}
          icon={AlertTriangle}
          color="rose"
        />
        <SummaryCard
          label="Expiring Soon"
          value={stats.expiring_soon}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Course
              </Button>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setCompletionModalOpen(true)}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Record Completion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Courses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Required For</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No courses found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => {
                  const courseReqs = requirements.filter(
                    (r) => r.course_id === course.id,
                  );
                  return (
                    <TableRow key={course.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{course.title}</p>
                        {course.accreditation && (
                          <p className="text-xs text-slate-500">
                            {course.accreditation}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {course.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {course.provider_name || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {course.validity_days
                          ? `${Math.round(course.validity_days / 365)} year(s)`
                          : "No expiry"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {courseReqs.map((req) => {
                            const role = DEFAULT_TRAINING_ROLES.find(
                              (r) => r.key === req.role_key,
                            );
                            return (
                              <Badge
                                key={req.id}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {role?.label || req.role_key}
                              </Badge>
                            );
                          })}
                          {courseReqs.length === 0 && (
                            <span className="text-xs text-slate-400">
                              Optional
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Overdue staff */}
      {overdueStaff.length > 0 && (
        <Card className="border-rose-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              Overdue Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueStaff.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-rose-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-rose-500" />
                    <div>
                      <p className="text-sm font-semibold">{record.user_id}</p>
                      <p className="text-xs text-slate-500">
                        {record.course_title}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-rose-600 font-semibold">
                    Expired{" "}
                    {new Date(record.expires_at!).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <TrainingCompletionModal
        organizationId={organizationId}
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        onSave={() => {
          setCompletionModalOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}

function SummaryCard({
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
    purple: "bg-purple-100 text-purple-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500">
              {label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
