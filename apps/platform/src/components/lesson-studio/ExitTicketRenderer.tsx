"use client";

import React from "react";
import type { GeneratedResourcesJSON, ExitTicketQuestion } from "@/types/lesson-studio";

interface ExitTicketRendererProps {
  resources: GeneratedResourcesJSON;
  lessonTitle: string;
  subject: string;
}

export function ExitTicketRenderer({ resources, lessonTitle, subject }: ExitTicketRendererProps) {
  const questions = resources.exitTicket ?? [];

  if (!questions.length) {
    return (
      <div className="text-center text-sm text-slate-400 py-8">
        No exit ticket generated for this lesson.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 max-w-[148mm] mx-auto border-2 border-teal-400 rounded-xl print:shadow-none" id="exit-ticket">
      {/* Header */}
      <div className="text-center border-b border-teal-200 pb-3 mb-4">
        <div className="text-lg font-bold text-teal-700">🎫 Exit Ticket</div>
        <div className="text-xs text-slate-500">{subject} • {lessonTitle}</div>
      </div>

      {/* Name */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-slate-700">Name:</span>
        <div className="flex-1 border-b-2 border-dotted border-slate-300 h-5" />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {(questions as ExitTicketQuestion[]).map((q, i) => (
          <div key={i}>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-[10px] font-bold text-teal-700 flex items-center justify-center">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm text-slate-800">{q.q}</p>
                <div className="mt-1.5 border border-slate-200 rounded-lg h-16 bg-[repeating-linear-gradient(transparent,transparent_23px,#e2e8f0_23px,#e2e8f0_24px)]" />
                <div className="text-right mt-0.5">
                  <span className="text-[9px] text-slate-400">/{q.marks}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Self-assessment */}
      <div className="mt-4 pt-3 border-t border-teal-200">
        <div className="text-xs font-medium text-slate-600 mb-1">How confident do you feel?</div>
        <div className="flex gap-4 justify-center">
          {["😊 Got it!", "🤔 Nearly", "😟 Need help"].map((emoji) => (
            <div key={emoji} className="text-center">
              <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-lg cursor-pointer hover:bg-slate-50">
                {emoji.split(" ")[0]}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">{emoji.split(" ").slice(1).join(" ")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
