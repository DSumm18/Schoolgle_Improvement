"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import Link from "next/link";
import {
  Eye,
  Rocket,
  Settings,
  Undo2,
  Redo2,
  MoreVertical,
  Save,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type {
  Survey,
  SurveyPage,
  SurveyQuestion,
  SurveyChoice,
  QuestionType,
  BuilderAction,
} from "@/lib/surveys/types";

import { QuestionPalette } from "./QuestionPalette";
import { BuilderCanvas } from "./BuilderCanvas";
import { QuestionSettings } from "./QuestionSettings";

// ---------------------------------------------------------------------------
// Props & helpers
// ---------------------------------------------------------------------------

export interface SurveyBuilderProps {
  surveyId: string;
  isToolbox?: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function generateId() {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  closed: "bg-red-100 text-red-700",
  archived: "bg-slate-100 text-slate-500",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SurveyBuilder({ surveyId, isToolbox }: SurveyBuilderProps) {
  // --- Remote data ---
  const { data, error, mutate } = useSWR<{ survey: Survey }>(
    `/api/surveys/${surveyId}`,
    fetcher,
  );

  // --- Local builder state ---
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [pages, setPages] = useState<SurveyPage[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Undo / Redo
  const [undoStack, setUndoStack] = useState<BuilderAction[]>([]);
  const [redoStack, setRedoStack] = useState<BuilderAction[]>([]);

  // Drag state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Auto-save timer
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Hydrate from SWR ---
  useEffect(() => {
    if (data?.survey && !survey) {
      setSurvey(data.survey);
      setPages(data.survey.pages ?? []);
    }
  }, [data, survey]);

  // --- DnD sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // --- Helpers ---
  const currentPage = pages[selectedPageIndex] ?? null;

  const selectedQuestion: SurveyQuestion | null = (() => {
    if (!selectedQuestionId) return null;
    for (const p of pages) {
      const q = p.questions?.find((q) => q.id === selectedQuestionId);
      if (q) return q;
    }
    return null;
  })();

  const markDirty = useCallback(() => {
    setIsDirty(true);
    // Reset debounce timer
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 5000);
  }, []);

  // --- Save ---
  const handleSave = useCallback(async () => {
    if (!survey) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ survey, pages }),
      });
      if (!res.ok) throw new Error("Save failed");
      setIsDirty(false);
      toast.success("Survey saved");
      mutate();
    } catch {
      toast.error("Failed to save survey");
    } finally {
      setIsSaving(false);
    }
  }, [survey, pages, surveyId, mutate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // --- Undo / Redo helpers ---
  const pushUndo = useCallback((action: BuilderAction) => {
    setUndoStack((prev) => [...prev.slice(-49), action]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    // Simplified undo: pop last action (full implementation would reverse the action)
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, action]);
    toast.info("Undo");
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, action]);
    toast.info("Redo");
  }, [redoStack]);

  // --- Question CRUD ---
  const handleAddQuestion = useCallback(
    (type: QuestionType) => {
      if (!currentPage) return;
      const newQuestion: SurveyQuestion = {
        id: generateId(),
        page_id: currentPage.id,
        survey_id: surveyId,
        question_type: type,
        title: "",
        description: null,
        is_required: false,
        sort_order: (currentPage.questions?.length ?? 0) + 1,
        settings: {},
        scoring: {},
        piping_source: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        choices: [],
      };

      setPages((prev) =>
        prev.map((p) =>
          p.id === currentPage.id
            ? { ...p, questions: [...(p.questions ?? []), newQuestion] }
            : p,
        ),
      );
      setSelectedQuestionId(newQuestion.id);
      pushUndo({
        type: "ADD_QUESTION",
        pageId: currentPage.id,
        question: newQuestion,
      });
      markDirty();
    },
    [currentPage, surveyId, pushUndo, markDirty],
  );

  const handleDeleteQuestion = useCallback(
    (questionId: string) => {
      setPages((prev) =>
        prev.map((p) => ({
          ...p,
          questions: (p.questions ?? []).filter((q) => q.id !== questionId),
        })),
      );
      if (selectedQuestionId === questionId) setSelectedQuestionId(null);
      pushUndo({ type: "DELETE_QUESTION", questionId });
      markDirty();
    },
    [selectedQuestionId, pushUndo, markDirty],
  );

  const handleUpdateQuestion = useCallback(
    (questionId: string, updates: Partial<SurveyQuestion>) => {
      setPages((prev) =>
        prev.map((p) => ({
          ...p,
          questions: (p.questions ?? []).map((q) =>
            q.id === questionId ? { ...q, ...updates } : q,
          ),
        })),
      );
      pushUndo({ type: "UPDATE_QUESTION", questionId, updates });
      markDirty();
    },
    [pushUndo, markDirty],
  );

  const handleUpdateChoices = useCallback(
    (questionId: string, choices: SurveyChoice[]) => {
      setPages((prev) =>
        prev.map((p) => ({
          ...p,
          questions: (p.questions ?? []).map((q) =>
            q.id === questionId ? { ...q, choices } : q,
          ),
        })),
      );
      markDirty();
    },
    [markDirty],
  );

  const handleReorderQuestions = useCallback(
    (pageId: string, questionIds: string[]) => {
      setPages((prev) =>
        prev.map((p) => {
          if (p.id !== pageId) return p;
          const questionsMap = new Map(
            (p.questions ?? []).map((q) => [q.id, q]),
          );
          const reordered = questionIds
            .map((id, idx) => {
              const q = questionsMap.get(id);
              return q ? { ...q, sort_order: idx + 1 } : null;
            })
            .filter(Boolean) as SurveyQuestion[];
          return { ...p, questions: reordered };
        }),
      );
      pushUndo({ type: "REORDER_QUESTIONS", pageId, questionIds });
      markDirty();
    },
    [pushUndo, markDirty],
  );

  // --- Page CRUD ---
  const handleAddPage = useCallback(() => {
    const newPage: SurveyPage = {
      id: generateId(),
      survey_id: surveyId,
      title: `Page ${pages.length + 1}`,
      description: null,
      sort_order: pages.length + 1,
      is_random: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: [],
    };
    setPages((prev) => [...prev, newPage]);
    setSelectedPageIndex(pages.length);
    pushUndo({ type: "ADD_PAGE", page: newPage });
    markDirty();
  }, [pages.length, surveyId, pushUndo, markDirty]);

  const handleDeletePage = useCallback(
    (pageId: string) => {
      setPages((prev) => {
        const filtered = prev.filter((p) => p.id !== pageId);
        if (selectedPageIndex >= filtered.length) {
          setSelectedPageIndex(Math.max(0, filtered.length - 1));
        }
        return filtered;
      });
      pushUndo({ type: "DELETE_PAGE", pageId });
      markDirty();
    },
    [selectedPageIndex, pushUndo, markDirty],
  );

  // --- Title editing ---
  const handleTitleChange = useCallback(
    (title: string) => {
      if (!survey) return;
      setSurvey({ ...survey, title });
      markDirty();
    },
    [survey, markDirty],
  );

  // --- Publish ---
  const handlePublish = useCallback(async () => {
    if (!survey) return;
    try {
      const res = await fetch(`/api/surveys/${surveyId}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Publish failed");
      setSurvey({ ...survey, status: "active" });
      toast.success("Survey published!");
      mutate();
    } catch {
      toast.error("Failed to publish survey");
    }
  }, [survey, surveyId, mutate]);

  // --- DnD handlers ---
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || !currentPage) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      if (activeId === overId) return;

      const questions = currentPage.questions ?? [];
      const oldIndex = questions.findIndex((q) => q.id === activeId);
      const newIndex = questions.findIndex((q) => q.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...questions];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      handleReorderQuestions(
        currentPage.id,
        reordered.map((q) => q.id),
      );
    },
    [currentPage, handleReorderQuestions],
  );

  // --- Loading / error states ---
  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-muted-foreground">Failed to load survey.</p>
      </div>
    );
  }

  if (!data || !survey) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen flex-col">
        {/* ---- Top bar ---- */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-b bg-white px-4 py-2"
        >
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <Input
                value={survey.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                className="h-8 w-64 border-cyan-300 text-lg font-semibold focus-visible:ring-cyan-500"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-semibold hover:text-cyan-600 transition-colors"
              >
                {survey.title || "Untitled Survey"}
              </button>
            )}

            <Badge
              className={cn(
                "text-xs capitalize",
                STATUS_COLORS[survey.status] ?? STATUS_COLORS.draft,
              )}
            >
              {survey.status}
            </Badge>

            {isDirty && (
              <span className="text-xs text-muted-foreground">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              Save
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href={`/surveys/${surveyId}/preview`} target="_blank">
                <Eye className="mr-1 h-4 w-4" />
                Preview
              </Link>
            </Button>

            <Button
              size="sm"
              onClick={handlePublish}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              disabled={survey.status === "active"}
            >
              <Rocket className="mr-1 h-4 w-4" />
              Publish
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Survey Settings
                </DropdownMenuItem>
                <DropdownMenuItem>Duplicate Survey</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Delete Survey
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.header>

        {/* ---- Main builder area ---- */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - Question Palette */}
          <aside className="w-64 shrink-0 overflow-y-auto border-r bg-gray-50/60">
            <QuestionPalette
              onAddQuestion={handleAddQuestion}
              isToolbox={isToolbox}
            />
          </aside>

          {/* Center - Canvas */}
          <main className="flex-1 overflow-y-auto bg-gray-100/50 p-6">
            <BuilderCanvas
              pages={pages}
              selectedPageIndex={selectedPageIndex}
              selectedQuestionId={selectedQuestionId}
              onSelectPage={setSelectedPageIndex}
              onSelectQuestion={setSelectedQuestionId}
              onReorderQuestions={handleReorderQuestions}
              onDeleteQuestion={handleDeleteQuestion}
              onAddPage={handleAddPage}
              onDeletePage={handleDeletePage}
            />
          </main>

          {/* Right sidebar - Question Settings */}
          <aside className="w-80 shrink-0 overflow-y-auto border-l bg-white">
            <QuestionSettings
              question={selectedQuestion}
              onUpdate={handleUpdateQuestion}
              onUpdateChoices={handleUpdateChoices}
            />
          </aside>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDragId && (
          <div className="rounded-xl border bg-white p-4 shadow-lg opacity-80">
            <span className="text-sm text-muted-foreground">
              Moving question...
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
