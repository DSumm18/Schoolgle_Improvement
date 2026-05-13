"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building,
  TrendingUp,
  Target,
  School,
  ArrowRight,
} from "lucide-react";
import type { SchoolData } from "@/types/estates-audit";

interface AllSchoolsViewProps {
  schoolData: SchoolData[];
  onSelectSchool?: (school: SchoolData) => void;
}

export default function AllSchoolsView({
  schoolData,
  onSelectSchool,
}: AllSchoolsViewProps) {
  const totalAssessments = schoolData.reduce(
    (sum, school) =>
      sum +
      school.categories.reduce(
        (catSum, category) => catSum + category.assessments.length,
        0,
      ),
    0,
  );
  const averageScore =
    schoolData.length > 0
      ? Math.round(
          schoolData.reduce((sum, school) => sum + school.overallScore, 0) /
            schoolData.length,
        )
      : 0;
  const categoriesCount =
    schoolData.length > 0 ? schoolData[0].categories.length : 0;
  const schoolsCount = schoolData.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Overview Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 rounded-3xl p-8 text-white shadow-xl shadow-teal-500/20 border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 transition-colors uppercase tracking-wider text-[10px] font-bold px-3 py-1">
              Live Assurance
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight">
              GEMS Assurance Audit
            </h2>
            <p className="text-teal-100/80 max-w-md">
              Reviewing live estate evidence and DfE GEMS gaps across{" "}
              {schoolsCount} school{schoolsCount === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-center">
              <div className="text-4xl font-black">{averageScore}%</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-teal-200 mt-1">
                Assurance Score
              </div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span>Assurance</span>
                <span
                  className={
                    averageScore >= 80 ? "text-emerald-400" : "text-amber-400"
                  }
                >
                  {averageScore >= 80
                    ? "Optimal"
                    : averageScore >= 60
                      ? "Stable"
                      : "Critical"}
                </span>
              </div>
              <Progress
                value={averageScore}
                className="w-32 h-2 bg-white/20"
                color="white"
              />
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Schools",
            value: schoolsCount,
            icon: School,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "GEMS Checks",
            value: totalAssessments,
            icon: Target,
            color: "text-teal-600",
            bg: "bg-teal-50",
          },
          {
            label: "Assurance",
            value: `${averageScore}%`,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "GEMS Domains",
            value: categoriesCount,
            icon: Building,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-0 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} p-2.5 rounded-xl`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schools Section Header */}
      <div className="flex items-center justify-between mt-12 mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            School Assurance
          </h3>
          <p className="text-sm text-slate-500">
            Live evidence position and gaps by school
          </p>
        </div>
        <Button
          variant="outline"
          className="text-xs font-bold uppercase tracking-wider h-9 border-slate-200"
        >
          Filter Schools
        </Button>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schoolData.map((school) => {
          const schoolAssessments = school.categories.reduce(
            (sum, category) => sum + category.assessments.length,
            0,
          );
          const scoreColor =
            school.overallScore >= 80
              ? "text-emerald-600"
              : school.overallScore >= 60
                ? "text-amber-600"
                : "text-rose-600";
          const scoreBg =
            school.overallScore >= 80
              ? "bg-emerald-500/10"
              : school.overallScore >= 60
                ? "bg-amber-500/10"
                : "bg-rose-500/10";

          return (
            <Card
              key={school.id}
              className="group overflow-hidden border-0 shadow-md shadow-slate-200/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold group-hover:text-teal-600 transition-colors uppercase tracking-tight">
                      {school.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      {schoolAssessments} GEMS checks reviewed
                    </CardDescription>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl ${scoreBg} ${scoreColor} text-sm font-black`}
                  >
                    {school.overallScore}%
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Assurance Coverage
                    </span>
                  </div>
                  <Progress
                    value={school.overallScore}
                    className="h-2.5 bg-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Status
                    </div>
                    <div className={`text-xs font-bold ${scoreColor}`}>
                      {school.overallScore >= 80
                        ? "Optimal"
                        : school.overallScore >= 60
                          ? "Compliant"
                          : "Needs Review"}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Gaps
                    </div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      {school.gaps?.length ?? 0}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => onSelectSchool?.(school)}
                  variant="ghost"
                  className="w-full flex items-center justify-between group/btn hover:bg-teal-50 hover:text-teal-600 p-0 h-auto py-2"
                >
                  <span className="text-xs font-bold uppercase tracking-widest pl-2">
                    Open GEMS Report
                  </span>
                  <div className="bg-slate-100 group-hover/btn:bg-teal-100 p-2 rounded-lg transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Domain Performance */}
      <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">
              GEMS Domain Summary
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-teal-600 hover:text-teal-700 text-xs font-bold uppercase"
            >
              Download PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {schoolData.length > 0 &&
              schoolData[0].categories.map((category, categoryIdx) => {
                const categoryAverage = Math.round(
                  schoolData.reduce((sum, school) => {
                    const schoolCategory = school.categories.find(
                      (cat) => cat.categoryName === category.categoryName,
                    );
                    return sum + (schoolCategory?.average || 0);
                  }, 0) / schoolData.length,
                );

                return (
                  <div
                    key={categoryIdx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50/50 transition-colors gap-4"
                  >
                    <div className="flex gap-4 items-center">
                      <div
                        className={`p-3 rounded-2xl ${categoryAverage >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                      >
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          {category.categoryName}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          Built from live evidence in connected Schoolgle modules
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 min-w-[200px]">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <span>Score</span>
                          <span>{categoryAverage}%</span>
                        </div>
                        <Progress value={categoryAverage} className="h-1.5" />
                      </div>
                      <Badge
                        className={
                          categoryAverage >= 80
                            ? "bg-emerald-500"
                            : categoryAverage >= 60
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }
                      >
                        {categoryAverage >= 80
                          ? "Optimal"
                          : categoryAverage >= 60
                            ? "Satisfactory"
                            : "Critical"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
