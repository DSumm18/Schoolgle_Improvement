"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import {
  ChevronDown,
  ChevronRight,
  CircleDot,
  CheckSquare,
  Type,
  AlignLeft,
  Star,
  Gauge,
  SlidersHorizontal,
  Grid3x3,
  ArrowUpDown,
  Calendar,
  Upload,
  Image,
  ToggleLeft,
  Hash,
  Calculator,
  ArrowLeftRight,
  User,
  FileText,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUESTION_TYPE_META,
  QUESTION_CATEGORIES,
  type QuestionType,
} from "@/lib/surveys/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QuestionPaletteProps {
  onAddQuestion: (type: QuestionType) => void;
  isToolbox?: boolean;
}

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CircleDot,
  CheckSquare,
  ChevronDown,
  Type,
  AlignLeft,
  Star,
  Gauge,
  SlidersHorizontal,
  Grid3x3,
  ArrowUpDown,
  Calendar,
  Upload,
  Image,
  ToggleLeft,
  Hash,
  Calculator,
  ArrowLeftRight,
  User,
  FileText,
};

// ---------------------------------------------------------------------------
// Draggable question type item
// ---------------------------------------------------------------------------

function DraggableQuestionType({
  type,
  onAddQuestion,
}: {
  type: QuestionType;
  onAddQuestion: (type: QuestionType) => void;
}) {
  const meta = QUESTION_TYPE_META[type];
  const Icon = ICON_MAP[meta.icon] ?? FileText;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type: "palette-item", questionType: type },
  });

  return (
    <motion.button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAddQuestion(type)}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm",
        "hover:bg-cyan-50 hover:text-cyan-700 transition-colors",
        "cursor-grab active:cursor-grabbing",
        "group",
        isDragging && "opacity-40",
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      <Icon className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-cyan-600" />
      <span className="truncate">{meta.label}</span>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuestionPalette({
  onAddQuestion,
  isToolbox,
}: QuestionPaletteProps) {
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(Object.fromEntries(QUESTION_CATEGORIES.map((c) => [c.id, true])));

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-3">
      <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Question Types
      </h3>

      <div className="space-y-1">
        {QUESTION_CATEGORIES.map((category) => {
          // Filter types for toolbox mode
          const types = category.types.filter((t) => {
            if (!isToolbox) return true;
            return QUESTION_TYPE_META[t as QuestionType]?.isToolboxAvailable;
          }) as QuestionType[];

          if (types.length === 0) return null;

          const isExpanded = expandedCategories[category.id] ?? true;

          return (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium",
                  "text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                {category.label}
                <span className="ml-auto text-[10px] text-gray-400">
                  {types.length}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-1 space-y-0.5 pb-1">
                      {types.map((type) => (
                        <DraggableQuestionType
                          key={type}
                          type={type}
                          onAddQuestion={onAddQuestion}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
