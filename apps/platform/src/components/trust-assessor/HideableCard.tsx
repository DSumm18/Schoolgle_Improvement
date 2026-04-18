"use client";

/**
 * HideableCard — wrapper that allows per-card hide/show in Trust Assessor edit mode.
 *
 * In edit mode: shows a small "Hide" button in the top-right corner.
 * Hidden cards show greyed out with "Hidden from final" badge.
 * In final (non-edit) mode: hidden cards are not rendered at all.
 *
 * Storage: via EditModeContext → localStorage (v1), Supabase (TODO v2)
 */

import { useEditMode } from "./EditableText";
import { EyeOff, Eye } from "lucide-react";

interface HideableCardProps {
  /** Unique stable ID for this card (used as localStorage key) */
  componentId: string;
  /** Card content */
  children: React.ReactNode;
  /** Extra classes on the wrapper */
  className?: string;
}

export function HideableCard({ componentId, children, className = "" }: HideableCardProps) {
  const { editMode, toggleHidden, isHidden } = useEditMode();
  const hidden = isHidden(componentId);

  // In final (non-edit) mode, don't render hidden cards at all
  if (!editMode && hidden) return null;

  return (
    <div className={`relative group ${className}`}>
      {/* Hide/show button — only visible in edit mode */}
      {editMode && (
        <button
          onClick={() => toggleHidden(componentId)}
          className={`absolute top-3 right-3 z-10 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors ${
            hidden
              ? "bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200"
              : "bg-white border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100"
          }`}
          title={hidden ? "Show on final report" : "Hide from final report"}
        >
          {hidden ? (
            <>
              <Eye size={10} />
              Restore
            </>
          ) : (
            <>
              <EyeOff size={10} />
              Hide
            </>
          )}
        </button>
      )}

      {/* Hidden state overlay */}
      {hidden && editMode ? (
        <div className="relative">
          <div className="opacity-30 pointer-events-none select-none">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-gray-700/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <EyeOff size={12} />
              Hidden from final report
            </span>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
