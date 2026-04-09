"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Link,
  Unlink,
  FileText,
  Filter,
  ChevronDown,
  Check,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SiamsStrandId,
  SiamsEvidenceMatch,
  STRAND_QUESTIONS,
} from "@/lib/siams";

interface SiamsEvidenceMatcherProps {
  organizationId: string;
  onRefresh?: () => void;
}

interface OfstedEvidenceItem {
  id: string;
  title: string;
  type: string;
  date: string;
  source: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
}

const STRAND_OPTIONS = [
  { value: "all", label: "All Strands" },
  { value: "vision", label: "Vision" },
  { value: "wisdom", label: "Wisdom" },
  { value: "character", label: "Character Development" },
  { value: "community", label: "Community" },
  { value: "dignity", label: "Dignity & Respect" },
  { value: "worship", label: "Worship" },
  { value: "re", label: "Religious Education" },
];

const CONFIDENCE_COLORS = {
  HIGH: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-slate-100 text-slate-500",
};

export default function SiamsEvidenceMatcher({
  organizationId,
  onRefresh,
}: SiamsEvidenceMatcherProps) {
  const [matches, setMatches] = useState<Record<string, SiamsEvidenceMatch[]>>(
    {},
  );
  const [allEvidence, setAllEvidence] = useState<OfstedEvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrand, setSelectedStrand] = useState<SiamsStrandId | "all">(
    "all",
  );
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  useEffect(() => {
    fetchEvidence();
  }, [organizationId, selectedStrand]);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ organizationId });
      if (selectedStrand !== "all") params.append("strand", selectedStrand);

      const response = await fetch(`/api/siams/evidence?${params}`);
      if (response.ok) {
        const data = await response.json();
        const matchesByQuestion: Record<string, SiamsEvidenceMatch[]> = {};

        data.evidence?.forEach((match: SiamsEvidenceMatch) => {
          if (!matchesByQuestion[match.question_id]) {
            matchesByQuestion[match.question_id] = [];
          }
          matchesByQuestion[match.question_id].push(match);
        });

        setMatches(matchesByQuestion);
        setAllEvidence(data.available_evidence || []);
      }
    } catch (error) {
      console.error("Failed to fetch evidence:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (questionId: string, evidenceId: string) => {
    setUnlinking(`${questionId}-${evidenceId}`);
    try {
      const response = await fetch("/api/siams/evidence", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          questionId,
          evidenceId,
        }),
      });

      if (response.ok) {
        setMatches((prev) => ({
          ...prev,
          [questionId]:
            prev[questionId]?.filter((m) => m.document_id !== evidenceId) || [],
        }));
        onRefresh?.();
      }
    } catch (error) {
      console.error("Failed to unlink evidence:", error);
    } finally {
      setUnlinking(null);
    }
  };

  const getAllQuestions = () => {
    if (selectedStrand === "all") {
      return (Object.keys(STRAND_QUESTIONS) as SiamsStrandId[]).flatMap(
        (strandId) =>
          STRAND_QUESTIONS[strandId].map((q) => ({
            ...q,
            strand_id: strandId,
          })),
      );
    }
    return (
      STRAND_QUESTIONS[selectedStrand]?.map((q) => ({
        ...q,
        strand_id: selectedStrand,
      })) || []
    );
  };

  const filteredEvidence = allEvidence.filter(
    (evidence) =>
      !searchQuery ||
      evidence.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const questionMatchCount = (questionId: string) =>
    matches[questionId]?.length || 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={selectedStrand}
                onValueChange={(value) => setSelectedStrand(value as any)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by strand" />
                </SelectTrigger>
                <SelectContent>
                  {STRAND_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search evidence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => setLinkDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Link Evidence
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions with Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {getAllQuestions().map((question) => {
          const questionMatches = matches[question.id] || [];
          const hasEvidence = questionMatches.length > 0;

          return (
            <Card
              key={question.id}
              className={`${hasEvidence ? "border-purple-200" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        {question.id}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {question.strand_id}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">
                      {question.question}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                    <Link className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-bold text-purple-700">
                      {questionMatches.length}
                    </span>
                  </div>
                </div>

                {questionMatches.length > 0 ? (
                  <div className="space-y-2">
                    {questionMatches.map((match) => (
                      <div
                        key={match.document_id}
                        className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group"
                      >
                        <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {match.document_link || "Untitled Evidence"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {match.confidence && (
                              <Badge
                                className={`text-[9px] ${CONFIDENCE_COLORS[match.confidence]}`}
                              >
                                {match.confidence}
                              </Badge>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {match.created_at &&
                                new Date(match.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleUnlink(question.id, match.document_id)
                          }
                          disabled={
                            unlinking === `${question.id}-${match.document_id}`
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Unlink className="w-4 h-4 text-rose-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No evidence linked</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Link Evidence Dialog */}
      <LinkEvidenceDialog
        isOpen={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onLinked={() => {
          setLinkDialogOpen(false);
          fetchEvidence();
          onRefresh?.();
        }}
        organizationId={organizationId}
        questions={getAllQuestions()}
      />
    </div>
  );
}

// Link Evidence Dialog
interface LinkEvidenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLinked: () => void;
  organizationId: string;
  questions: Array<{ id: string; question: string; strand_id: string }>;
}

function LinkEvidenceDialog({
  isOpen,
  onClose,
  onLinked,
  organizationId,
  questions,
}: LinkEvidenceDialogProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [evidenceIds, setEvidenceIds] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedQuestions(new Set());
      setEvidenceIds("");
      setError(null);
    }
  }, [isOpen]);

  const toggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleLink = async () => {
    if (selectedQuestions.size === 0) {
      setError("Please select at least one question");
      return;
    }
    if (!evidenceIds.trim()) {
      setError("Please enter at least one evidence ID");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const ids = evidenceIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      const response = await fetch("/api/siams/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          links: ids.flatMap((evidenceId) =>
            Array.from(selectedQuestions).map((questionId) => ({
              questionId,
              evidenceId,
              confidence: "MEDIUM",
            })),
          ),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to link evidence");
      }

      onLinked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link evidence");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Evidence to SIAMS Questions</DialogTitle>
          <DialogDescription>
            Connect evidence documents to specific SIAMS framework questions
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-lg">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Questions</label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded"
                >
                  <Checkbox
                    id={`q-${question.id}`}
                    checked={selectedQuestions.has(question.id)}
                    onCheckedChange={() => toggleQuestion(question.id)}
                  />
                  <label
                    htmlFor={`q-${question.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <span className="text-[10px] text-slate-400 mr-2">
                      {question.id}
                    </span>
                    {question.question}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {selectedQuestions.size} question
              {selectedQuestions.size !== 1 ? "s" : ""} selected
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="evidenceIds" className="text-sm font-medium">
              Evidence IDs
            </label>
            <Input
              id="evidenceIds"
              value={evidenceIds}
              onChange={(e) => setEvidenceIds(e.target.value)}
              placeholder="id1, id2, id3..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              Enter comma-separated evidence document IDs
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={saving || selectedQuestions.size === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving
              ? "Linking..."
              : `Link Evidence (${selectedQuestions.size} questions)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
