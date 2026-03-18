"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Star,
  Link as LinkIcon,
  FileText,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SiamsStrandId,
  SiamsRating,
  SiamsQuestion,
  SiamsAssessment,
  STRAND_QUESTIONS,
  STRAND_INFO,
} from "@/lib/siams";

interface SiamsFrameworkViewProps {
  organizationId: string;
  onRefresh?: () => void;
  initialExpandedStrand?: SiamsStrandId;
}

const RATING_OPTIONS: { value: SiamsRating; label: string; color: string }[] = [
  {
    value: "excellent",
    label: "Excellent",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  {
    value: "good",
    label: "Good",
    color: "text-blue-700 bg-blue-50 border-blue-200",
  },
  {
    value: "requires_improvement",
    label: "Requires Improvement",
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  {
    value: "ineffective",
    label: "Ineffective",
    color: "text-rose-700 bg-rose-50 border-rose-200",
  },
];

export default function SiamsFrameworkView({
  organizationId,
  onRefresh,
  initialExpandedStrand,
}: SiamsFrameworkViewProps) {
  const [assessments, setAssessments] = useState<
    Record<string, SiamsAssessment>
  >({});
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [expandedStrands, setExpandedStrands] = useState<Set<SiamsStrandId>>(
    new Set(initialExpandedStrand ? [initialExpandedStrand] : []),
  );
  const [selectedQuestion, setSelectedQuestion] =
    useState<SiamsQuestion | null>(null);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, [organizationId]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/siams/assessments?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        const assessmentMap: Record<string, SiamsAssessment> = {};
        data.assessments?.forEach((a: SiamsAssessment) => {
          assessmentMap[a.question_id] = a;
        });
        setAssessments(assessmentMap);

        // Count evidence per question
        const counts: Record<string, number> = {};
        data.assessments?.forEach((a: SiamsAssessment) => {
          counts[a.question_id] = a.evidence_count || 0;
        });
        setEvidenceCounts(counts);
      }
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStrand = (strandId: SiamsStrandId) => {
    const newExpanded = new Set(expandedStrands);
    if (newExpanded.has(strandId)) {
      newExpanded.delete(strandId);
    } else {
      newExpanded.add(strandId);
    }
    setExpandedStrands(newExpanded);
  };

  const openAssessment = (question: SiamsQuestion) => {
    setSelectedQuestion(question);
    setAssessmentDialogOpen(true);
  };

  const saveAssessment = async (rating: SiamsRating, notes: string) => {
    if (!selectedQuestion) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/siams/assessments/${selectedQuestion.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            school_rating: rating,
            school_rationale: notes,
          }),
        },
      );

      if (response.ok) {
        setAssessments({
          ...assessments,
          [selectedQuestion.id]: {
            ...assessments[selectedQuestion.id],
            school_rating: rating,
            school_rationale: notes,
          } as any,
        });
        setAssessmentDialogOpen(false);
        onRefresh?.();
      }
    } catch (error) {
      console.error("Failed to save assessment:", error);
    } finally {
      setSaving(false);
    }
  };

  const getRatingBadge = (rating: SiamsRating | null | undefined) => {
    if (!rating) return null;

    const styles: Record<SiamsRating, string> = {
      excellent: "bg-emerald-100 text-emerald-700 border-emerald-200",
      good: "bg-blue-100 text-blue-700 border-blue-200",
      requires_improvement: "bg-amber-100 text-amber-700 border-amber-200",
      ineffective: "bg-rose-100 text-rose-700 border-rose-200",
      not_assessed: "bg-slate-100 text-slate-500 border-slate-200",
    };

    const scoreMap: Record<SiamsRating, number> = {
      excellent: 100,
      good: 75,
      requires_improvement: 50,
      ineffective: 25,
      not_assessed: 0,
    };

    return (
      <Badge
        className={`text-[10px] font-bold uppercase px-2 py-0.5 ${styles[rating]}`}
      >
        {rating.replace("_", " ")} ({scoreMap[rating]}%)
      </Badge>
    );
  };

  const allQuestions = useMemo(() => {
    return (Object.keys(STRAND_QUESTIONS) as SiamsStrandId[]).flatMap(
      (strandId) =>
        STRAND_QUESTIONS[strandId].map((q) => ({ ...q, strand_id: strandId })),
    );
  }, []);

  return (
    <div className="space-y-4">
      {/* Strand Cards */}
      {(Object.keys(STRAND_QUESTIONS) as SiamsStrandId[]).map((strandId) => {
        const info = STRAND_INFO[strandId];
        const questions = STRAND_QUESTIONS[strandId];
        const isExpanded = expandedStrands.has(strandId);

        // Calculate strand score
        const strandAssessments = questions.filter(
          (q) => !!assessments[q.id]?.school_rating,
        );
        const strandScore =
          strandAssessments.length > 0
            ? Math.round(
                strandAssessments.reduce((sum, q) => {
                  const r = assessments[q.id]?.school_rating;
                  if (r === "excellent") return sum + 100;
                  if (r === "good") return sum + 75;
                  if (r === "requires_improvement") return sum + 50;
                  if (r === "ineffective") return sum + 25;
                  return sum;
                }, 0) / strandAssessments.length,
              )
            : 0;

        return (
          <Card key={strandId} className="overflow-hidden">
            <button
              onClick={() => toggleStrand(strandId)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{info.icon}</div>
                <div>
                  <h3 className="font-bold text-lg">{info.name}</h3>
                  <p className="text-sm text-slate-500">{info.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {strandAssessments.length > 0 && (
                  <div className="text-right">
                    <p className="text-2xl font-black">{strandScore}%</p>
                    <p className="text-xs text-slate-500">
                      {strandAssessments.length}/{questions.length} assessed
                    </p>
                  </div>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t"
                >
                  <div className="p-4 space-y-3">
                    {questions.map((question) => {
                      const assessment = assessments[question.id];
                      const evidenceCount = evidenceCounts[question.id] || 0;

                      return (
                        <div
                          key={question.id}
                          className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-slate-400">
                                  {question.id}
                                </span>
                                {getRatingBadge(assessment?.school_rating)}
                              </div>
                              <h4 className="font-semibold text-sm mb-1">
                                {question.question}
                              </h4>
                              <p className="text-sm text-slate-600">
                                {question.guidance}
                              </p>

                              {assessment?.school_rationale && (
                                <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                                  <p className="text-xs text-slate-500 mb-1">
                                    Notes:
                                  </p>
                                  <p>{assessment.school_rationale}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {evidenceCount > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-blue-600 border-blue-200"
                                >
                                  <LinkIcon className="w-3 h-3 mr-1" />
                                  {evidenceCount}
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAssessment(question)}
                              >
                                {assessment?.school_rating ? (
                                  <>
                                    <Check className="w-4 h-4 mr-1 text-emerald-600" />
                                    Update
                                  </>
                                ) : (
                                  <>
                                    <Star className="w-4 h-4 mr-1" />
                                    Rate
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}

      {/* Assessment Dialog */}
      <AssessmentDialog
        isOpen={assessmentDialogOpen}
        onClose={() => setAssessmentDialogOpen(false)}
        onSave={saveAssessment}
        question={selectedQuestion}
        currentAssessment={
          selectedQuestion ? assessments[selectedQuestion.id] : undefined
        }
        saving={saving}
      />
    </div>
  );
}

// Assessment Dialog Component
interface AssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rating: SiamsRating, notes: string) => void;
  question: SiamsQuestion | null;
  currentAssessment?: SiamsAssessment;
  saving: boolean;
}

function AssessmentDialog({
  isOpen,
  onClose,
  onSave,
  question,
  currentAssessment,
  saving,
}: AssessmentDialogProps) {
  const [selectedRating, setSelectedRating] = useState<SiamsRating | null>(
    null,
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (question) {
      setSelectedRating(currentAssessment?.school_rating || null);
      setNotes(currentAssessment?.school_rationale || "");
    }
  }, [question, currentAssessment]);

  const handleSave = () => {
    if (selectedRating) {
      onSave(selectedRating, notes);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rate SIAMS Question</DialogTitle>
          {question && (
            <DialogDescription className="text-left">
              <span className="text-xs font-mono text-slate-500">
                {question.id}
              </span>
              <p className="font-medium text-slate-700 mt-2">
                {question.question}
              </p>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Self-Assessment Rating *</Label>
            <div className="grid grid-cols-2 gap-2">
              {RATING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedRating(option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedRating === option.value
                      ? `${option.color} border-current`
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{option.label}</span>
                    {selectedRating === option.value && (
                      <Check className="w-4 h-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Assessment Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about your self-assessment..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedRating || saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? "Saving..." : "Save Assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
