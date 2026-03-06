"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  ClipboardList,
  Sparkles,
  Users,
  GraduationCap,
  Shield,
  Heart,
  Calendar,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { SurveyTemplate, TemplateCategory } from "@/lib/surveys/types";

const CATEGORY_META: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  parent_satisfaction: {
    label: "Parent Satisfaction",
    icon: Users,
    color: "bg-blue-100 text-blue-700",
  },
  staff_wellbeing: {
    label: "Staff Wellbeing",
    icon: Heart,
    color: "bg-pink-100 text-pink-700",
  },
  student_voice: {
    label: "Student Voice",
    icon: GraduationCap,
    color: "bg-green-100 text-green-700",
  },
  governor_feedback: {
    label: "Governor Feedback",
    icon: Shield,
    color: "bg-purple-100 text-purple-700",
  },
  event_feedback: {
    label: "Event Feedback",
    icon: Calendar,
    color: "bg-orange-100 text-orange-700",
  },
  ofsted_prep: {
    label: "Ofsted Preparation",
    icon: Shield,
    color: "bg-red-100 text-red-700",
  },
  custom: {
    label: "General",
    icon: ClipboardList,
    color: "bg-slate-100 text-slate-700",
  },
};

export default function SurveyTemplatesPage() {
  const { organization, user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/surveys/templates");
      const data = await res.json();
      if (Array.isArray(data)) setTemplates(data);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  async function useTemplate(template: SurveyTemplate) {
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization?.id,
          userId: user?.id,
          title: template.title,
          audienceType: template.audience_type,
          surveyType: "standard",
        }),
      });

      if (!res.ok) throw new Error("Failed to create survey");
      const survey = await res.json();

      // TODO: Populate from template_data (pages + questions)
      toast.success("Survey created from template");
      router.push(`/dashboard/surveys/${survey.id}/edit`);
    } catch {
      toast.error("Failed to create survey from template");
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/surveys")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <div className="flex items-center gap-2 text-cyan-600 font-semibold text-xs uppercase tracking-wide">
            <Sparkles size={14} className="animate-pulse" />
            Survey Templates
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Template Library
          </h1>
        </div>
      </motion.div>

      <p className="text-slate-500 max-w-2xl">
        Start from a pre-built template designed specifically for UK schools.
        Each template includes appropriate question types, suggested logic, and
        sensible defaults.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template, i) => {
            const category =
              CATEGORY_META[template.category] || CATEGORY_META.custom;
            const questionCount =
              template.template_data?.pages?.reduce(
                (acc, p) => acc + (p.questions?.length || 0),
                0,
              ) || 0;

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl">
                        <category.icon className="w-5 h-5 text-cyan-600" />
                      </div>
                      <Badge className={category.color}>{category.label}</Badge>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {template.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 flex-1">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{questionCount} questions</span>
                        <span>{template.audience_type}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => useTemplate(template)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
