"use client";

/**
 * EditableText — inline track-changes text editing for Trust Assessor report views.
 *
 * In edit mode: dashed underline on hover, contenteditable on click, saves diff to localStorage.
 * In final mode: shows edited text (or original if no edit).
 * Toggle original/edited via editMode + showOriginal props.
 *
 * Storage: localStorage key `report-edits-{orgId}-{urn}` (v1)
 * TODO v2: persist to Supabase `report_edits` table (orgId + urn + editorId + version)
 */

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Storage helpers ──────────────────────────────────────────────────────────

export interface ReportEdits {
  hiddenComponents: string[];
  textEdits: Record<string, string>;
  toneOverrides: Record<string, string>;
  lastEditedAt: string;
  version: number;
}

function storageKey(orgId: string, urn: string | number): string {
  return `report-edits-${orgId}-${urn}`;
}

export function loadEdits(orgId: string, urn: string | number): ReportEdits {
  if (typeof window === "undefined") return emptyEdits();
  try {
    const raw = localStorage.getItem(storageKey(orgId, urn));
    if (!raw) return emptyEdits();
    return JSON.parse(raw) as ReportEdits;
  } catch {
    return emptyEdits();
  }
}

export function saveEdits(orgId: string, urn: string | number, edits: ReportEdits): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    storageKey(orgId, urn),
    JSON.stringify({ ...edits, lastEditedAt: new Date().toISOString() })
  );
}

export function emptyEdits(): ReportEdits {
  return { hiddenComponents: [], textEdits: {}, toneOverrides: {}, lastEditedAt: "", version: 0 };
}

// ─── Context so child components can read/write edits ─────────────────────────

import { createContext, useContext } from "react";

interface EditModeContextValue {
  editMode: boolean;
  showOriginal: boolean;
  edits: ReportEdits;
  updateTextEdit: (id: string, text: string) => void;
  toggleHidden: (componentId: string) => void;
  isHidden: (componentId: string) => boolean;
  editCount: number;
}

const EditModeContext = createContext<EditModeContextValue>({
  editMode: false,
  showOriginal: false,
  edits: emptyEdits(),
  updateTextEdit: () => {},
  toggleHidden: () => {},
  isHidden: () => false,
  editCount: 0,
});

export function useEditMode(): EditModeContextValue {
  return useContext(EditModeContext);
}

interface EditModeProviderProps {
  orgId: string;
  urn: string | number;
  children: React.ReactNode;
}

export function EditModeProvider({ orgId, urn, children }: EditModeProviderProps) {
  const [editMode, setEditMode] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [edits, setEdits] = useState<ReportEdits>(() => loadEdits(orgId, urn));
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const updateTextEdit = useCallback((id: string, text: string) => {
    setEdits((prev) => {
      const next: ReportEdits = {
        ...prev,
        textEdits: { ...prev.textEdits, [id]: text },
        version: prev.version + 1,
      };
      saveEdits(orgId, urn, next);
      return next;
    });
  }, [orgId, urn]);

  const toggleHidden = useCallback((componentId: string) => {
    setEdits((prev) => {
      const already = prev.hiddenComponents.includes(componentId);
      const next: ReportEdits = {
        ...prev,
        hiddenComponents: already
          ? prev.hiddenComponents.filter((id) => id !== componentId)
          : [...prev.hiddenComponents, componentId],
        version: prev.version + 1,
      };
      saveEdits(orgId, urn, next);
      return next;
    });
  }, [orgId, urn]);

  const isHidden = useCallback((componentId: string) => {
    return edits.hiddenComponents.includes(componentId);
  }, [edits.hiddenComponents]);

  const editCount = Object.keys(edits.textEdits).length + edits.hiddenComponents.length;

  const handleSave = () => {
    saveEdits(orgId, urn, edits);
    setToastMsg(`Saved v${edits.version}`);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleReset = () => {
    const fresh = emptyEdits();
    saveEdits(orgId, urn, fresh);
    setEdits(fresh);
    setToastMsg("Reset to original");
    setTimeout(() => setToastMsg(null), 2000);
  };

  return (
    <EditModeContext.Provider
      value={{ editMode, showOriginal, edits, updateTextEdit, toggleHidden, isHidden, editCount }}
    >
      {children}

      {/* Floating edit toolbar — bottom-right, subtle */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Toast */}
        {toastMsg && (
          <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg animate-fade-in">
            {toastMsg}
          </div>
        )}

        {/* Toolbar */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-lg text-xs transition-colors ${
            editMode
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-card border-border text-foreground"
          }`}
        >
          {editMode && (
            <>
              <button
                onClick={() => setShowOriginal((v) => !v)}
                className="font-medium hover:underline"
                title="Toggle between original and edited text"
              >
                {showOriginal ? "Show edits" : "Show original"}
              </button>
              <span className="text-muted-foreground">|</span>
              {editCount > 0 && (
                <>
                  <span className="font-semibold text-amber-700">{editCount} edit{editCount !== 1 ? "s" : ""}</span>
                  <span className="text-muted-foreground">|</span>
                </>
              )}
              <button onClick={handleSave} className="font-semibold text-sky-600 hover:underline">Save</button>
              <span className="text-muted-foreground">|</span>
              <button onClick={handleReset} className="text-red-500 hover:underline">Reset all</button>
              <span className="text-muted-foreground">|</span>
            </>
          )}
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`font-semibold px-2 py-0.5 rounded-md transition-colors ${
              editMode ? "bg-amber-200 text-amber-900" : "bg-sky-500 text-white"
            }`}
          >
            {editMode ? "Exit editing" : "Edit mode"}
          </button>
        </div>
      </div>
    </EditModeContext.Provider>
  );
}

// ─── EditableText component ───────────────────────────────────────────────────

interface EditableTextProps {
  /** Unique stable ID for this piece of text (used as localStorage key) */
  id: string;
  /** The original text (always preserved in data-original) */
  originalText: string;
  /** Tailwind classes to apply to the wrapper span */
  className?: string;
  /** Override: render as a specific tag */
  as?: "p" | "span" | "h1" | "h2" | "h3" | "h4" | "div";
}

export function EditableText({
  id,
  originalText,
  className = "",
  as: Tag = "span",
}: EditableTextProps) {
  const { editMode, showOriginal, edits, updateTextEdit } = useEditMode();
  const ref = useRef<HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const currentEdit = edits.textEdits[id];
  const displayText = showOriginal
    ? originalText
    : (currentEdit ?? originalText);

  const hasEdit = !!currentEdit && currentEdit !== originalText;

  // Sync DOM when display text changes externally
  useEffect(() => {
    if (ref.current && !isEditing) {
      ref.current.textContent = displayText;
    }
  }, [displayText, isEditing]);

  const handleClick = () => {
    if (!editMode) return;
    setIsEditing(true);
    setTimeout(() => {
      if (ref.current) {
        ref.current.contentEditable = "true";
        ref.current.focus();
        // Move cursor to end
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };

  const handleBlur = () => {
    if (ref.current) {
      ref.current.contentEditable = "false";
      const newText = ref.current.textContent ?? "";
      if (newText !== originalText) {
        updateTextEdit(id, newText);
      } else {
        // Reverted to original — clear the edit
        updateTextEdit(id, originalText);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      // Cancel — restore previous text
      if (ref.current) {
        ref.current.textContent = currentEdit ?? originalText;
        ref.current.contentEditable = "false";
        (ref.current as HTMLElement).blur();
      }
      setIsEditing(false);
    }
  };

  const editStyles = editMode
    ? `cursor-text hover:outline-dashed hover:outline-1 hover:outline-sky-400 hover:bg-sky-50/30 rounded transition-colors ${
        hasEdit && !showOriginal ? "underline decoration-dashed decoration-amber-400 underline-offset-2" : ""
      } ${isEditing ? "outline-dashed outline-1 outline-sky-500 bg-sky-50/50 rounded" : ""}`
    : "";

  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement & { contentEditable: string }>}
      className={`${className} ${editStyles}`}
      data-original={originalText}
      data-edit-id={id}
      onClick={handleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      title={editMode && hasEdit && !showOriginal ? `Original: ${originalText}` : undefined}
      suppressContentEditableWarning
    >
      {displayText}
    </Tag>
  );
}
