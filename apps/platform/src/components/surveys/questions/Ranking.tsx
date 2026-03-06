"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SurveyQuestion } from "@/lib/surveys/types";

interface QuestionComponentProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  preview?: boolean;
}

interface SortableItemProps {
  id: string;
  label: string;
  rank: number;
  disabled?: boolean;
}

function SortableItem({ id, label, rank, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-shadow",
        isDragging && "shadow-lg ring-2 ring-cyan-500/30 z-10",
        disabled && "opacity-50",
      )}
    >
      <button
        type="button"
        className={cn(
          "touch-none text-muted-foreground hover:text-foreground transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
          disabled && "cursor-not-allowed",
        )}
        aria-label={`Drag to reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
        {rank}
      </span>
      <span className="text-sm font-medium flex-1">{label}</span>
    </div>
  );
}

export function Ranking({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionComponentProps) {
  const choices = question.choices ?? [];

  const getInitialOrder = useCallback((): string[] => {
    if (Array.isArray(value) && value.length === choices.length) {
      return value;
    }
    return choices.map((c) => c.id);
  }, [value, choices]);

  const [items, setItems] = useState<string[]>(getInitialOrder);

  useEffect(() => {
    if (Array.isArray(value) && value.length === choices.length) {
      setItems(value);
    }
  }, [value, choices.length]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onChange(newItems);
    }
  }

  const choiceMap = new Map(choices.map((c) => [c.id, c.label]));

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div
        className={cn(
          "space-y-2",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
        role="list"
        aria-label={question.title}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((id, index) => (
              <SortableItem
                key={id}
                id={id}
                label={choiceMap.get(id) ?? id}
                rank={index + 1}
                disabled={disabled}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
