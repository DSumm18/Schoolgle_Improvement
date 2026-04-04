"use client";

import React, { useState, useCallback } from "react";
import { ROOM_OUTLINES } from "./grove-house-3d-data";

interface RoomLabellingTableProps {
  roomLabels: Record<string, string>;
  onLabelChange: (systemId: string, label: string) => void;
}

export function RoomLabellingTable({
  roomLabels,
  onLabelChange,
}: RoomLabellingTableProps) {
  // Track in-progress edits so we don't fire onChange on every keystroke
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    (systemId: string, value: string) => {
      setDrafts((prev) => ({ ...prev, [systemId]: value }));
    },
    []
  );

  const handleCommit = useCallback(
    (systemId: string) => {
      const value = drafts[systemId];
      if (value !== undefined) {
        onLabelChange(systemId, value);
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[systemId];
          return next;
        });
      }
    },
    [drafts, onLabelChange]
  );

  const handleKeyDown = useCallback(
    (systemId: string, e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleCommit(systemId);
      }
    },
    [handleCommit]
  );

  return (
    <div className="overflow-auto max-h-full">
      <table className="w-full text-xs text-left">
        <thead className="sticky top-0 bg-slate-800 z-10">
          <tr className="border-b border-slate-700">
            <th className="px-3 py-2 font-semibold text-slate-400 w-20">
              System ID
            </th>
            <th className="px-3 py-2 font-semibold text-slate-400 w-16">
              PDF #
            </th>
            <th className="px-3 py-2 font-semibold text-slate-400 w-24">
              Block
            </th>
            <th className="px-3 py-2 font-semibold text-slate-400">
              Room Name
            </th>
          </tr>
        </thead>
        <tbody>
          {ROOM_OUTLINES.map((room) => {
            const currentValue =
              drafts[room.systemId] !== undefined
                ? drafts[room.systemId]
                : roomLabels[room.systemId] || "";

            return (
              <tr
                key={room.systemId}
                className="border-b border-slate-800 hover:bg-slate-800/50"
              >
                <td className="px-3 py-1.5 font-mono text-slate-300">
                  {room.systemId}
                </td>
                <td className="px-3 py-1.5 text-slate-500">
                  {room.pdfNumber || "—"}
                </td>
                <td className="px-3 py-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: room.color }}
                  />
                  <span className="text-slate-400">{room.block}</span>
                </td>
                <td className="px-1 py-0.5">
                  <input
                    type="text"
                    value={currentValue}
                    placeholder={room.label}
                    onChange={(e) =>
                      handleChange(room.systemId, e.target.value)
                    }
                    onBlur={() => handleCommit(room.systemId)}
                    onKeyDown={(e) => handleKeyDown(room.systemId, e)}
                    className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-amber-500 focus:bg-slate-800 rounded px-2 py-1 text-slate-200 placeholder:text-slate-600 outline-none transition-colors"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
