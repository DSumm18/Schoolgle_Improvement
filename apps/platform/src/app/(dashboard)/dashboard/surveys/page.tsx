"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  ClipboardList,
  Plus,
  Search,
  BarChart3,
  Users,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Link2,
  Sparkles,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type {
  Survey,
  SurveyStatus,
  SurveyType,
  AudienceType,
} from "@/lib/surveys/types";
import { getStatusColor, getStatusLabel } from "@/lib/surveys/survey-utils";

export default function SurveysDashboard() {
  const { organization, user } = useAuth();
  const router = useRouter();
  const orgId = organization?.id || "";

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<SurveyType>("standard");
  const [newAudience, setNewAudience] = useState<AudienceType>("mixed");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (orgId) fetchSurveys();
  }, [orgId]);

  async function fetchSurveys() {
    try {
      const res = await fetch(`/api/surveys?organizationId=${orgId}`);
      const data = await res.json();
      if (Array.isArray(data)) setSurveys(data);
    } catch (err) {
      console.error("Failed to fetch surveys:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createSurvey() {
    if (!newTitle.trim()) {
      toast.error("Please enter a survey title");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          userId: user?.id,
          title: newTitle,
          surveyType: newType,
          audienceType: newAudience,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Survey created");
        setShowCreateDialog(false);
        setNewTitle("");
        router.push(`/dashboard/surveys/${data.id}/edit`);
      } else {
        toast.error(data.error || "Failed to create survey");
      }
    } catch {
      toast.error("Failed to create survey");
    } finally {
      setCreating(false);
    }
  }

  async function deleteSurvey(id: string) {
    try {
      await fetch(`/api/surveys/${id}`, { method: "DELETE" });
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      toast.success("Survey deleted");
    } catch {
      toast.error("Failed to delete survey");
    }
  }

  const filtered = surveys.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: surveys.length,
    active: surveys.filter((s) => s.status === "active").length,
    responses: surveys.reduce(
      (acc, s) => acc + ((s as any).response_count || 0),
      0,
    ),
    draft: surveys.filter((s) => s.status === "draft").length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-100 dark:bg-cyan-900/20 rounded-2xl">
            <ClipboardList className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-cyan-600 font-semibold text-xs uppercase tracking-wide">
              <Sparkles size={14} className="animate-pulse" />
              Feedback & Surveys
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
              Surveys
            </h1>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Survey
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Surveys", value: stats.total, icon: ClipboardList },
          { label: "Active", value: stats.active, icon: BarChart3 },
          { label: "Total Responses", value: stats.responses, icon: Users },
          { label: "Drafts", value: stats.draft, icon: Clock },
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
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search surveys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Survey List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-slate-100 rounded w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {surveys.length === 0 ? "No surveys yet" : "No matching surveys"}
            </h3>
            <p className="text-slate-500 mb-4">
              {surveys.length === 0
                ? "Create your first survey to start collecting feedback."
                : "Try adjusting your search or filters."}
            </p>
            {surveys.length === 0 && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Survey
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((survey, i) => (
              <motion.div
                key={survey.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() =>
                    router.push(`/dashboard/surveys/${survey.id}/edit`)
                  }
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                          {survey.title}
                        </h3>
                        {survey.description && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {survey.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/surveys/${survey.id}/edit`,
                              );
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/surveys/${survey.id}/results`,
                              );
                            }}
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Results
                          </DropdownMenuItem>
                          {survey.slug && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/s/${survey.slug}`,
                                );
                                toast.success("Link copied");
                              }}
                            >
                              <Link2 className="w-4 h-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSurvey(survey.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={getStatusColor(survey.status)}
                      >
                        {getStatusLabel(survey.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {survey.survey_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {survey.audience_type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {(survey as any).response_count || 0} responses
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(survey.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                          },
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Survey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Survey Title</Label>
              <Input
                placeholder="e.g. Parent Satisfaction Survey 2026"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createSurvey()}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={newType}
                  onValueChange={(v) => setNewType(v as SurveyType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="nps">NPS</SelectItem>
                    <SelectItem value="pulse">Pulse</SelectItem>
                    <SelectItem value="poll">Poll</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="feedback_360">360 Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audience</Label>
                <Select
                  value={newAudience}
                  onValueChange={(v) => setNewAudience(v as AudienceType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parents</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="governor">Governors</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={createSurvey}
              disabled={creating}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {creating ? "Creating..." : "Create Survey"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
