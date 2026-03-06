"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { MeetingNote } from "@/lib/meetings";

interface Props {
  notes: MeetingNote[];
  onAddNote: (note: MeetingNote) => void;
}

export function MeetingNotesInput({ notes, onAddNote }: Props) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (!text.trim()) return;
    onAddNote({ timestamp: new Date().toISOString(), text: text.trim() });
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Meeting Notes
      </h3>

      {/* Existing notes */}
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700"
            >
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {note.text}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(note.timestamp).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* New note input */}
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note... (Enter to save)"
          rows={2}
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="self-end bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
