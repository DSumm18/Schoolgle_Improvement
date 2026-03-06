"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  ArrowLeft,
  Download,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type {
  Survey,
  SurveyResponse,
  SurveyQuestion,
} from "@/lib/surveys/types";
import {
  getStatusColor,
  getStatusLabel,
  calculateNPS,
} from "@/lib/surveys/survey-utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#06B6D4",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#6366F1",
  "#EC4899",
  "#14B8A6",
];

export default function SurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [surveyRes, responsesRes] = await Promise.all([
        fetch(`/api/surveys/${id}`),
        fetch(`/api/surveys/${id}/responses?limit=100`),
      ]);
      const surveyData = await surveyRes.json();
      const responsesData = await responsesRes.json();
      setSurvey(surveyData);
      setResponses(responsesData.responses || []);
    } catch (err) {
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  async function exportCSV() {
    if (!survey || !responses.length) return;

    const allQuestions: SurveyQuestion[] = [];
    for (const page of survey.pages || []) {
      for (const q of (page as any).survey_questions || page.questions || []) {
        allQuestions.push(q);
      }
    }

    const headers = [
      "Response ID",
      "Status",
      "Started",
      "Completed",
      ...allQuestions.map((q) => q.title),
    ];
    const rows = responses.map((r) => {
      const answers = r.answers || (r as any).survey_answers || [];
      const answerMap = new Map(answers.map((a: any) => [a.question_id, a]));
      return [
        r.id,
        r.status,
        r.started_at ? new Date(r.started_at).toLocaleString("en-GB") : "",
        r.completed_at ? new Date(r.completed_at).toLocaleString("en-GB") : "",
        ...allQuestions.map((q) => {
          const a = answerMap.get(q.id) as any;
          if (!a) return "";
          return (
            a.answer_text ||
            a.answer_numeric?.toString() ||
            a.answer_choices?.join(", ") ||
            ""
          );
        }),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${survey.title.replace(/\s+/g, "_")}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Survey not found</p>
      </div>
    );
  }

  const completedResponses = responses.filter((r) => r.status === "completed");
  const completionRate =
    responses.length > 0
      ? Math.round((completedResponses.length / responses.length) * 100)
      : 0;
  const avgTime =
    completedResponses.length > 0
      ? Math.round(
          completedResponses.reduce(
            (acc, r) => acc + (r.time_taken_seconds || 0),
            0,
          ) / completedResponses.length,
        )
      : 0;

  // Build question analytics
  const allQuestions: SurveyQuestion[] = [];
  for (const page of survey.pages || []) {
    for (const q of (page as any).survey_questions || page.questions || []) {
      allQuestions.push(q);
    }
  }

  function getQuestionAnalytics(question: SurveyQuestion) {
    const answers = responses.flatMap((r) => {
      const answerList = r.answers || (r as any).survey_answers || [];
      return answerList.filter((a: any) => a.question_id === question.id);
    });

    if (
      question.question_type === "multiple_choice" ||
      question.question_type === "checkbox" ||
      question.question_type === "dropdown"
    ) {
      const choices =
        (question as any).survey_choices || question.choices || [];
      const counts: Record<string, number> = {};
      for (const c of choices) counts[c.id] = 0;
      for (const a of answers) {
        const selected = a.answer_choices || [];
        for (const cId of selected) {
          counts[cId] = (counts[cId] || 0) + 1;
        }
      }
      return choices.map((c: any) => ({
        label: c.label,
        count: counts[c.id] || 0,
        percentage:
          answers.length > 0
            ? Math.round(((counts[c.id] || 0) / answers.length) * 100)
            : 0,
      }));
    }

    if (
      question.question_type === "rating" ||
      question.question_type === "opinion_scale" ||
      question.question_type === "likert_scale" ||
      question.question_type === "slider"
    ) {
      const nums = answers
        .filter((a: any) => a.answer_numeric !== null)
        .map((a: any) => a.answer_numeric);
      return {
        average:
          nums.length > 0
            ? (
                nums.reduce((a: number, b: number) => a + b, 0) / nums.length
              ).toFixed(1)
            : "N/A",
        count: nums.length,
      };
    }

    if (question.question_type === "nps") {
      const nums = answers
        .filter((a: any) => a.answer_numeric !== null)
        .map((a: any) => a.answer_numeric);
      return {
        npsScore: calculateNPS(nums),
        promoters: nums.filter((n: number) => n >= 9).length,
        passives: nums.filter((n: number) => n >= 7 && n <= 8).length,
        detractors: nums.filter((n: number) => n <= 6).length,
        count: nums.length,
      };
    }

    if (question.question_type === "yes_no") {
      const yes = answers.filter((a: any) => a.answer_text === "yes").length;
      const no = answers.filter((a: any) => a.answer_text === "no").length;
      return [
        {
          label: "Yes",
          count: yes,
          percentage:
            answers.length > 0 ? Math.round((yes / answers.length) * 100) : 0,
        },
        {
          label: "No",
          count: no,
          percentage:
            answers.length > 0 ? Math.round((no / answers.length) * 100) : 0,
        },
      ];
    }

    // Text responses
    return {
      responses: answers.map((a: any) => a.answer_text).filter(Boolean),
      count: answers.length,
    };
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/surveys")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {survey.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(survey.status)}>
                {getStatusLabel(survey.status)}
              </Badge>
              <span className="text-sm text-slate-500">
                {responses.length} responses
              </span>
            </div>
          </div>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Responses", value: responses.length, icon: Users },
          {
            label: "Completed",
            value: completedResponses.length,
            icon: CheckCircle,
          },
          {
            label: "Completion Rate",
            value: `${completionRate}%`,
            icon: BarChart3,
          },
          {
            label: "Avg. Time",
            value:
              avgTime > 0
                ? `${Math.floor(avgTime / 60)}m ${avgTime % 60}s`
                : "N/A",
            icon: Clock,
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl">
                <stat.icon className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Question Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {allQuestions
            .filter((q) => q.question_type !== "statement")
            .map((question, i) => {
              const analytics = getQuestionAnalytics(question);
              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-cyan-600">
                          Q{i + 1}
                        </span>
                        <CardTitle className="text-base">
                          {question.title}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {question.question_type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(analytics) ? (
                        <div className="space-y-2">
                          <ResponsiveContainer
                            width="100%"
                            height={Math.max(analytics.length * 40, 120)}
                          >
                            <BarChart
                              data={analytics}
                              layout="vertical"
                              margin={{ left: 100 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis
                                type="category"
                                dataKey="label"
                                width={100}
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip />
                              <Bar
                                dataKey="count"
                                fill="#06B6D4"
                                radius={[0, 4, 4, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            {analytics.map((item: any) => (
                              <div
                                key={item.label}
                                className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded"
                              >
                                <span className="text-slate-700 dark:text-slate-300">
                                  {item.label}
                                </span>
                                <span className="font-medium">
                                  {item.count} ({item.percentage}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : "npsScore" in (analytics as any) ? (
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-4xl font-bold text-cyan-600">
                              {(analytics as any).npsScore}
                            </p>
                            <p className="text-sm text-slate-500">NPS Score</p>
                          </div>
                          <div className="flex-1">
                            <ResponsiveContainer width="100%" height={120}>
                              <PieChart>
                                <Pie
                                  data={[
                                    {
                                      name: "Promoters",
                                      value: (analytics as any).promoters,
                                    },
                                    {
                                      name: "Passives",
                                      value: (analytics as any).passives,
                                    },
                                    {
                                      name: "Detractors",
                                      value: (analytics as any).detractors,
                                    },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={30}
                                  outerRadius={50}
                                  dataKey="value"
                                >
                                  <Cell fill="#10B981" />
                                  <Cell fill="#F59E0B" />
                                  <Cell fill="#EF4444" />
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : "average" in (analytics as any) ? (
                        <div className="flex items-center gap-4">
                          <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl">
                            <p className="text-3xl font-bold text-cyan-600">
                              {(analytics as any).average}
                            </p>
                            <p className="text-sm text-slate-500">Average</p>
                          </div>
                          <p className="text-sm text-slate-500">
                            {(analytics as any).count} responses
                          </p>
                        </div>
                      ) : "responses" in (analytics as any) ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {((analytics as any).responses as string[])
                            .slice(0, 20)
                            .map((text, j) => (
                              <div
                                key={j}
                                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300"
                              >
                                {text}
                              </div>
                            ))}
                          {(analytics as any).count > 20 && (
                            <p className="text-sm text-slate-500">
                              + {(analytics as any).count - 20} more responses
                            </p>
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          {responses.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center text-slate-500">
                No responses yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {responses.map((response, i) => (
                <Card key={response.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-500">
                          #{i + 1}
                        </span>
                        <Badge
                          className={
                            response.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {response.status}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {response.started_at &&
                            new Date(response.started_at).toLocaleString(
                              "en-GB",
                            )}
                        </span>
                        {response.time_taken_seconds && (
                          <span className="text-sm text-slate-400">
                            ({Math.floor(response.time_taken_seconds / 60)}m{" "}
                            {response.time_taken_seconds % 60}s)
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
