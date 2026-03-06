"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import type { SurveyPage } from "@/lib/surveys/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PageManagerProps {
  pages: SurveyPage[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (pageId: string) => void;
  onRename: (pageId: string, title: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PageManager({
  pages,
  selectedIndex,
  onSelect,
  onAdd,
  onDelete,
  onRename,
}: PageManagerProps) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingPageId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPageId]);

  const handleDoubleClick = (page: SurveyPage) => {
    setEditingPageId(page.id);
    setEditValue(page.title ?? `Page ${pages.indexOf(page) + 1}`);
  };

  const commitRename = () => {
    if (editingPageId && editValue.trim()) {
      onRename(editingPageId, editValue.trim());
    }
    setEditingPageId(null);
  };

  const handleDeleteClick = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    const hasQuestions = (page?.questions?.length ?? 0) > 0;
    if (hasQuestions) {
      setDeleteConfirmId(pageId);
    } else {
      onDelete(pageId);
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 rounded-xl bg-white p-1.5 shadow-sm border">
        <AnimatePresence mode="popLayout">
          {pages.map((page, index) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              {editingPageId === page.id ? (
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditingPageId(null);
                  }}
                  className="h-8 w-28 text-xs"
                />
              ) : (
                <button
                  onClick={() => onSelect(index)}
                  onDoubleClick={() => handleDoubleClick(page)}
                  className={cn(
                    "group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    index === selectedIndex
                      ? "bg-cyan-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <span className="max-w-[100px] truncate">
                    {page.title ?? `Page ${index + 1}`}
                  </span>

                  {pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(page.id);
                      }}
                      className={cn(
                        "rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100",
                        index === selectedIndex
                          ? "hover:bg-cyan-600 text-white/70 hover:text-white"
                          : "hover:bg-gray-200 text-gray-400 hover:text-gray-600",
                      )}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon"
          onClick={onAdd}
          className="h-8 w-8 shrink-0 text-gray-400 hover:text-cyan-600"
          title="Add page"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete page?</DialogTitle>
            <DialogDescription>
              This page has questions. Deleting it will also remove all
              questions on this page. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
