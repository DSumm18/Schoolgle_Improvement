"use client";

import React from "react";
import { Eye, Download, Maximize2 } from "lucide-react";

export interface LessonPreviewProps {
  title: string;
  subject: string;
  yearGroup: string;
  objective: string;
  isGenerating: boolean;
}

export function LessonPreview({
  title,
  subject,
  yearGroup,
  objective,
  isGenerating,
}: LessonPreviewProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Lesson Preview</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Download SVG"
            disabled={isGenerating || !title}
          >
            <Download className="w-4 h-4 text-slate-400" />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Fullscreen"
            disabled={isGenerating || !title}
          >
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* SVG Preview Area */}
      <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center p-6">
        {isGenerating ? (
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-pink-200 dark:border-pink-800" />
              <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Generating lesson visualisation…</p>
          </div>
        ) : title ? (
          /* Placeholder SVG showing lesson structure */
          <svg
            viewBox="0 0 600 450"
            className="w-full h-full max-w-lg"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background card */}
            <rect x="20" y="20" width="560" height="410" rx="16" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />

            {/* Title bar */}
            <rect x="20" y="20" width="560" height="60" rx="16" fill="#fdf2f8" />
            <rect x="20" y="64" width="560" height="16" fill="#fdf2f8" />

            <text x="50" y="58" fill="#db2777" fontSize="16" fontWeight="600" fontFamily="Poppins, sans-serif">
              {title.length > 45 ? title.slice(0, 45) + "…" : title}
            </text>

            {/* Subject + Year badge */}
            <rect x="50" y="95" width="120" height="24" rx="12" fill="#fce7f3" />
            <text x="110" y="112" textAnchor="middle" fill="#db2777" fontSize="11" fontWeight="500" fontFamily="Poppins, sans-serif">
              {subject} · {yearGroup}
            </text>

            {/* Learning objective section */}
            <text x="50" y="148" fill="#64748b" fontSize="10" fontWeight="600" fontFamily="Poppins, sans-serif" letterSpacing="0.05em">
              LEARNING OBJECTIVE
            </text>
            <text x="50" y="168" fill="#334155" fontSize="12" fontFamily="Poppins, sans-serif">
              {(objective || "No objective set").length > 80 ? (objective || "No objective set").slice(0, 80) + "…" : objective || "No objective set"}
            </text>

            {/* Lesson phases */}
            <text x="50" y="210" fill="#64748b" fontSize="10" fontWeight="600" fontFamily="Poppins, sans-serif" letterSpacing="0.05em">
              LESSON PHASES
            </text>

            {/* Phase blocks */}
            {[
              { label: "Starter", color: "#f59e0b", x: 50 },
              { label: "Main", color: "#ec4899", x: 195 },
              { label: "Plenary", color: "#06b6d4", x: 340 },
            ].map((phase) => (
              <g key={phase.label}>
                <rect x={phase.x} y="222" width="130" height="70" rx="10" fill={phase.color} opacity={0.1} />
                <rect x={phase.x} y="222" width="130" height="4" rx="2" fill={phase.color} />
                <text x={phase.x + 12} y="250" fill={phase.color} fontSize="13" fontWeight="600" fontFamily="Poppins, sans-serif">
                  {phase.label}
                </text>
                <rect x={phase.x + 12} y="260" width="80" height="6" rx="3" fill={phase.color} opacity={0.2} />
                <rect x={phase.x + 12} y="272" width="60" height="6" rx="3" fill={phase.color} opacity={0.15} />
              </g>
            ))}

            {/* Differentiation section */}
            <text x="50" y="325" fill="#64748b" fontSize="10" fontWeight="600" fontFamily="Poppins, sans-serif" letterSpacing="0.05em">
              DIFFERENTIATION
            </text>
            {["Scaffold", "Core", "Deeper"].map((group, i) => (
              <g key={group}>
                <rect x={50 + i * 170} y="337" width="155" height="35" rx="8" fill="#f1f5f9" />
                <text x={50 + i * 170 + 12} y="359" fill="#64748b" fontSize="11" fontWeight="500" fontFamily="Poppins, sans-serif">
                  {group}
                </text>
              </g>
            ))}

            {/* Footer line */}
            <line x1="50" y1="390" x2="550" y2="390" stroke="#e2e8f0" strokeWidth="1" />
            <text x="50" y="410" fill="#cbd5e1" fontSize="9" fontFamily="Poppins, sans-serif">
              Generated by Schoolgle Lesson Studio
            </text>
          </svg>
        ) : (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Eye className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No lesson to preview</p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Fill in the form and click Generate to see a preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
