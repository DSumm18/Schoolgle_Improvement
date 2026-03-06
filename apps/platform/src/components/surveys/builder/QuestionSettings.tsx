"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Plus,
  Trash2,
  Star,
  Heart,
  Smile,
  Settings2,
} from "lucide-react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type {
  SurveyQuestion,
  SurveyChoice,
  QuestionSettings as QSettings,
} from "@/lib/surveys/types";
import { QUESTION_TYPE_META, LIKERT_DEFAULTS } from "@/lib/surveys/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QuestionSettingsProps {
  question: SurveyQuestion | null;
  onUpdate: (questionId: string, updates: Partial<SurveyQuestion>) => void;
  onUpdateChoices: (questionId: string, choices: SurveyChoice[]) => void;
}

// ---------------------------------------------------------------------------
// Sortable choice row
// ---------------------------------------------------------------------------

function SortableChoiceRow({
  choice,
  onLabelChange,
  onDelete,
}: {
  choice: SurveyChoice;
  onLabelChange: (label: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: choice.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-0.5 text-gray-300 hover:text-gray-500 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Input
        value={choice.label}
        onChange={(e) => onLabelChange(e.target.value)}
        className="h-8 flex-1 text-sm"
        placeholder="Choice label"
      />
      <button
        onClick={onDelete}
        className="rounded p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Choices editor
// ---------------------------------------------------------------------------

function ChoicesEditor({
  question,
  onUpdateChoices,
}: {
  question: SurveyQuestion;
  onUpdateChoices: (questionId: string, choices: SurveyChoice[]) => void;
}) {
  const choices = question.choices ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAdd = () => {
    const newChoice: SurveyChoice = {
      id: `tmp_c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      question_id: question.id,
      label: `Option ${choices.length + 1}`,
      value: null,
      image_url: null,
      sort_order: choices.length + 1,
      is_other: false,
      score_value: null,
      created_at: new Date().toISOString(),
    };
    onUpdateChoices(question.id, [...choices, newChoice]);
  };

  const handleLabelChange = (choiceId: string, label: string) => {
    onUpdateChoices(
      question.id,
      choices.map((c) => (c.id === choiceId ? { ...c, label } : c)),
    );
  };

  const handleDelete = (choiceId: string) => {
    onUpdateChoices(
      question.id,
      choices.filter((c) => c.id !== choiceId),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = choices.findIndex((c) => c.id === active.id);
    const newIdx = choices.findIndex((c) => c.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = [...choices];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    onUpdateChoices(
      question.id,
      reordered.map((c, i) => ({ ...c, sort_order: i + 1 })),
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-500">Choices</label>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={choices.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {choices.map((choice) => (
              <SortableChoiceRow
                key={choice.id}
                choice={choice}
                onLabelChange={(label) => handleLabelChange(choice.id, label)}
                onDelete={() => handleDelete(choice.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button variant="ghost" size="sm" onClick={handleAdd} className="w-full">
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add Choice
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type-specific settings panels
// ---------------------------------------------------------------------------

function RatingSettings({
  question,
  onUpdate,
}: {
  question: SurveyQuestion;
  onUpdate: (updates: Partial<QSettings>) => void;
}) {
  const settings = question.settings;
  const ratingCount = settings.rating_count ?? 5;
  const ratingIcon = settings.rating_icon ?? "star";

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-500">
          Rating count
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={10}
            value={ratingCount}
            onChange={(e) =>
              onUpdate({ rating_count: parseInt(e.target.value) })
            }
            className="flex-1 accent-cyan-500"
          />
          <span className="w-6 text-center text-sm font-medium">
            {ratingCount}
          </span>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500">Icon</label>
        <div className="mt-1 flex gap-2">
          {(["star", "heart", "smiley"] as const).map((icon) => (
            <button
              key={icon}
              onClick={() => onUpdate({ rating_icon: icon })}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                ratingIcon === icon
                  ? "border-cyan-500 bg-cyan-50 text-cyan-600"
                  : "border-gray-200 text-gray-400 hover:border-gray-300",
              )}
            >
              {icon === "star" && <Star className="h-4 w-4" />}
              {icon === "heart" && <Heart className="h-4 w-4" />}
              {icon === "smiley" && <Smile className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TextSettings({
  question,
  onUpdate,
}: {
  question: SurveyQuestion;
  onUpdate: (updates: Partial<QSettings>) => void;
}) {
  const settings = question.settings;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-500">Input type</label>
        <Select
          value={settings.input_type ?? "text"}
          onValueChange={(v) =>
            onUpdate({ input_type: v as QSettings["input_type"] })
          }
        >
          <SelectTrigger className="mt-1 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="url">URL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500">Word limit</label>
        <Input
          type="number"
          value={settings.word_limit ?? ""}
          onChange={(e) =>
            onUpdate({
              word_limit: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          placeholder="No limit"
          className="mt-1 h-8"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500">
          Character limit
        </label>
        <Input
          type="number"
          value={settings.char_limit ?? ""}
          onChange={(e) =>
            onUpdate({
              char_limit: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          placeholder="No limit"
          className="mt-1 h-8"
        />
      </div>
    </div>
  );
}

function OpinionScaleSettings({
  question,
  onUpdate,
}: {
  question: SurveyQuestion;
  onUpdate: (updates: Partial<QSettings>) => void;
}) {
  const settings = question.settings;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-gray-500">Min</label>
          <Input
            type="number"
            value={settings.min ?? 0}
            onChange={(e) => onUpdate({ min: parseInt(e.target.value) || 0 })}
            className="mt-1 h-8"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Max</label>
          <Input
            type="number"
            value={settings.max ?? 10}
            onChange={(e) => onUpdate({ max: parseInt(e.target.value) || 10 })}
            className="mt-1 h-8"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500">Min label</label>
        <Input
          value={settings.min_label ?? ""}
          onChange={(e) => onUpdate({ min_label: e.target.value })}
          placeholder="e.g. Not at all likely"
          className="mt-1 h-8"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500">Max label</label>
        <Input
          value={settings.max_label ?? ""}
          onChange={(e) => onUpdate({ max_label: e.target.value })}
          placeholder="e.g. Extremely likely"
          className="mt-1 h-8"
        />
      </div>
    </div>
  );
}

function LikertSettings({
  question,
  onUpdate,
}: {
  question: SurveyQuestion;
  onUpdate: (updates: Partial<QSettings>) => void;
}) {
  const settings = question.settings;
  const scaleLabels = settings.scale_labels ?? {};
  const points =
    Object.keys(scaleLabels).length > 0
      ? Object.entries(scaleLabels).map(([k, v]) => ({ key: k, label: v }))
      : LIKERT_DEFAULTS.map((label, i) => ({
          key: String(i + 1),
          label,
        }));

  const handlePointChange = (index: number, label: string) => {
    const updated = { ...scaleLabels };
    updated[String(index + 1)] = label;
    onUpdate({ scale_labels: updated });
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-500">Scale points</label>
      {points.map((point, i) => (
        <Input
          key={point.key}
          value={point.label}
          onChange={(e) => handlePointChange(i, e.target.value)}
          className="h-8 text-sm"
          placeholder={`Point ${i + 1}`}
        />
      ))}
    </div>
  );
}

function StatementSettings({
  question,
  onUpdate,
}: {
  question: SurveyQuestion;
  onUpdate: (updates: Partial<QSettings>) => void;
}) {
  const settings = question.settings;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">
          Acknowledge checkbox
        </label>
        <Switch
          checked={settings.acknowledge_checkbox ?? false}
          onCheckedChange={(v) => onUpdate({ acknowledge_checkbox: v })}
        />
      </div>
      {settings.acknowledge_checkbox && (
        <div>
          <label className="text-xs font-medium text-gray-500">
            Acknowledge label
          </label>
          <Input
            value={settings.acknowledge_label ?? ""}
            onChange={(e) => onUpdate({ acknowledge_label: e.target.value })}
            placeholder="I have read and understood"
            className="mt-1 h-8"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function QuestionSettings({
  question,
  onUpdate,
  onUpdateChoices,
}: QuestionSettingsProps) {
  if (!question) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Settings2 className="mb-3 h-10 w-10 text-gray-200" />
        <p className="text-sm text-muted-foreground">
          Select a question to edit its settings
        </p>
      </div>
    );
  }

  const meta = QUESTION_TYPE_META[question.question_type];
  const hasChoices = meta?.hasChoices ?? false;
  const isText =
    question.question_type === "short_text" ||
    question.question_type === "long_text";
  const isRating = question.question_type === "rating";
  const isOpinionScale = question.question_type === "opinion_scale";
  const isLikert = question.question_type === "likert_scale";
  const isStatement = question.question_type === "statement";

  const handleSettingsUpdate = (updates: Partial<QSettings>) => {
    onUpdate(question.id, {
      settings: { ...question.settings, ...updates },
    });
  };

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Badge className="bg-cyan-50 text-cyan-700 text-[10px]">
          {meta?.label ?? question.question_type}
        </Badge>
      </div>

      <Separator />

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-gray-500">
          Question title
        </label>
        <Input
          value={question.title}
          onChange={(e) => onUpdate(question.id, { title: e.target.value })}
          placeholder="Enter question title..."
          className="mt-1"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-gray-500">
          Description{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={question.description ?? ""}
          onChange={(e) =>
            onUpdate(question.id, {
              description: e.target.value || null,
            })
          }
          placeholder="Add a description or help text..."
          rows={2}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
        />
      </div>

      {/* Required toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Required</label>
        <Switch
          checked={question.is_required}
          onCheckedChange={(v) => onUpdate(question.id, { is_required: v })}
        />
      </div>

      <Separator />

      {/* Type-specific settings */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Type Settings
        </h4>

        {hasChoices && (
          <ChoicesEditor
            question={question}
            onUpdateChoices={onUpdateChoices}
          />
        )}

        {isRating && (
          <RatingSettings question={question} onUpdate={handleSettingsUpdate} />
        )}

        {isText && (
          <TextSettings question={question} onUpdate={handleSettingsUpdate} />
        )}

        {isOpinionScale && (
          <OpinionScaleSettings
            question={question}
            onUpdate={handleSettingsUpdate}
          />
        )}

        {isLikert && (
          <LikertSettings question={question} onUpdate={handleSettingsUpdate} />
        )}

        {isStatement && (
          <StatementSettings
            question={question}
            onUpdate={handleSettingsUpdate}
          />
        )}

        {!hasChoices &&
          !isRating &&
          !isText &&
          !isOpinionScale &&
          !isLikert &&
          !isStatement && (
            <p className="text-xs text-muted-foreground">
              No additional settings for this question type.
            </p>
          )}
      </div>
    </motion.div>
  );
}
