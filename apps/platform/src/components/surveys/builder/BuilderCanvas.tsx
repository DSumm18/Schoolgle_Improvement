"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { SurveyPage, SurveyQuestion } from "@/lib/surveys/types";
import { QUESTION_TYPE_META } from "@/lib/surveys/types";
import { PageManager } from "./PageManager";
import { QuestionRenderer } from "@/components/surveys/questions/QuestionRenderer";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BuilderCanvasProps {
  pages: SurveyPage[];
  selectedPageIndex: number;
  selectedQuestionId: string | null;
  onSelectPage: (index: number) => void;
  onSelectQuestion: (id: string) => void;
  onReorderQuestions: (pageId: string, questionIds: string[]) => void;
  onDeleteQuestion: (questionId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
}

// ---------------------------------------------------------------------------
// Sortable question card
// ---------------------------------------------------------------------------

function SortableQuestionCard({
  question,
  index,
  isSelected,
  onSelect,
  onDelete,
}: {
  question: SurveyQuestion;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = QUESTION_TYPE_META[question.question_type];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.03 }}
      className={cn(isDragging && "z-50")}
    >
      <Card
        onClick={onSelect}
        className={cn(
          "group relative cursor-pointer rounded-2xl border-2 p-4 transition-all",
          isSelected
            ? "border-cyan-500 shadow-md shadow-cyan-100"
            : "border-transparent hover:border-gray-200 hover:shadow-sm",
          isDragging && "opacity-50",
        )}
      >
        {/* Header row */}
        <div className="mb-3 flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none rounded p-0.5 text-gray-300 hover:text-gray-500 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-600">
            {index + 1}
          </span>

          <Badge variant="secondary" className="text-[10px] capitalize">
            {meta?.label ?? question.question_type}
          </Badge>

          {question.is_required && (
            <Badge
              variant="outline"
              className="text-[10px] text-red-500 border-red-200"
            >
              Required
            </Badge>
          )}

          <div className="flex-1" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
            title="Delete question"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Question title */}
        <div className="mb-2 text-sm font-medium text-gray-800">
          {question.title || (
            <span className="italic text-gray-400">Untitled question</span>
          )}
        </div>

        {/* Question preview */}
        <div className="pointer-events-none opacity-70">
          <QuestionRenderer
            question={question}
            value={null}
            onChange={() => {}}
            preview
          />
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BuilderCanvas({
  pages,
  selectedPageIndex,
  selectedQuestionId,
  onSelectPage,
  onSelectQuestion,
  onReorderQuestions,
  onDeleteQuestion,
  onAddPage,
  onDeletePage,
}: BuilderCanvasProps) {
  const currentPage = pages[selectedPageIndex] ?? null;
  const questions = currentPage?.questions ?? [];
  const questionIds = questions.map((q) => q.id);

  const handleRenamePage = useCallback((pageId: string, title: string) => {
    // Renaming is handled at the SurveyBuilder level via page updates
    // This is a passthrough stub; real impl propagated from parent
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Page tabs */}
      <PageManager
        pages={pages}
        selectedIndex={selectedPageIndex}
        onSelect={onSelectPage}
        onAdd={onAddPage}
        onDelete={onDeletePage}
        onRename={handleRenamePage}
      />

      {/* Questions list */}
      {currentPage ? (
        <SortableContext
          items={questionIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {questions.map((question, index) => (
                <SortableQuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  isSelected={question.id === selectedQuestionId}
                  onSelect={() => onSelectQuestion(question.id)}
                  onDelete={() => onDeleteQuestion(question.id)}
                />
              ))}
            </AnimatePresence>

            {questions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center"
              >
                <div className="mb-2 text-4xl text-gray-300">+</div>
                <p className="text-sm text-muted-foreground">
                  Drag a question type from the left panel or click to add
                </p>
              </motion.div>
            )}
          </div>
        </SortableContext>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center"
        >
          <p className="mb-4 text-sm text-muted-foreground">
            No pages yet. Add your first page to get started.
          </p>
          <Button
            onClick={onAddPage}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Page
          </Button>
        </motion.div>
      )}
    </div>
  );
}
