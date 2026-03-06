"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Plus,
  Star,
  Users,
  Sparkles,
  ArrowRight,
  Lock,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { AudienceType } from "@/lib/surveys/types";

const FREE_TEMPLATES = [
  {
    title: "Quick Parent Feedback",
    description:
      "5-question parent satisfaction survey covering communication, safety, and overall experience.",
    audience: "Parents",
    questions: 5,
    icon: "star",
  },
  {
    title: "Staff Pulse Check",
    description:
      "Quick anonymous pulse survey for staff workload and wellbeing.",
    audience: "Staff",
    questions: 4,
    icon: "heart",
  },
  {
    title: "Student Voice",
    description:
      "Simple student survey about lessons, safety, and school life.",
    audience: "Students",
    questions: 6,
    icon: "smile",
  },
  {
    title: "Event Feedback",
    description:
      "Post-event feedback form for school events, performances, and open days.",
    audience: "Mixed",
    questions: 5,
    icon: "calendar",
  },
  {
    title: "Quick Poll",
    description:
      "Single-question pulse check for any audience. Perfect for quick decisions.",
    audience: "Mixed",
    questions: 2,
    icon: "chart",
  },
];

const PAID_FEATURES = [
  "Unlimited surveys & responses",
  "All 20 question types",
  "Advanced skip logic",
  "AI survey generation",
  "Branded surveys",
  "Email distribution",
  "Cross-tabulation analytics",
  "PDF/Excel exports",
];

export default function ToolboxSurveysPage() {
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAudience, setNewAudience] = useState<AudienceType>("mixed");
  const [creating, setCreating] = useState(false);

  async function createFreeSurvey() {
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
          title: newTitle,
          audienceType: newAudience,
          isToolbox: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Survey created!");
        router.push(`/toolbox/surveys/${data.id}/edit`);
      } else {
        toast.error(data.error || "Failed to create survey");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <ClipboardList className="w-4 h-4" />
            Free Survey Tool
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            School Survey Builder
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Create beautiful surveys for parents, staff, and students. Free for
            up to 3 surveys with 100 responses each. No login required to
            respond.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              size="lg"
              onClick={() => setShowCreateDialog(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Free Survey
            </Button>
          </div>
        </motion.div>

        {/* Free Limits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-12"
        >
          {[
            { label: "Free surveys", value: "3" },
            { label: "Responses each", value: "100" },
            { label: "Question types", value: "10" },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center p-3 bg-white rounded-xl shadow-sm"
            >
              <p className="text-2xl font-bold text-cyan-600">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Templates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Start with a Template
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {FREE_TEMPLATES.map((template, i) => (
              <motion.div
                key={template.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-cyan-50 rounded-xl">
                        <ClipboardList className="w-5 h-5 text-cyan-600" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {template.audience}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {template.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {template.questions} questions
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-cyan-600 hover:text-cyan-700"
                      >
                        Use template
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Upgrade CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-semibold uppercase tracking-wide opacity-90">
                      Schoolgle Pro
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    Unlock the Full Survey Platform
                  </h3>
                  <p className="text-cyan-100 mb-4">
                    Unlimited surveys, AI-powered analysis, custom branding, and
                    enterprise-grade distribution tools.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAID_FEATURES.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Zap className="w-3 h-3 text-cyan-200" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Button
                    size="lg"
                    className="bg-white text-cyan-700 hover:bg-cyan-50"
                    onClick={() => router.push("/pricing")}
                  >
                    View Plans
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Free Survey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Survey Title</Label>
              <Input
                placeholder="e.g. Parent Satisfaction Survey"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createFreeSurvey()}
                autoFocus
              />
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
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={createFreeSurvey}
              disabled={creating}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {creating ? "Creating..." : "Create Survey"}
            </Button>
            <p className="text-xs text-center text-slate-400">
              Free tier: 3 surveys, 15 questions each, 100 responses per survey
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
