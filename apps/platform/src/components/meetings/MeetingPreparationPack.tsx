"use client";

import { FileText, MessageSquare, BookOpen, Scale } from "lucide-react";
import type { PreparationGuide } from "@/lib/meetings";

interface Props {
  guide: PreparationGuide;
  templateName: string;
}

export function MeetingPreparationPack({ guide, templateName }: Props) {
  const sections = [
    {
      title: "Context & Preparation",
      icon: MessageSquare,
      items: guide.context_prompts,
      color: "indigo",
    },
    {
      title: "Documents Needed",
      icon: FileText,
      items: guide.documents_needed,
      color: "amber",
    },
    {
      title: "Key Phrases to Familiarise",
      icon: BookOpen,
      items: guide.key_phrases,
      color: "green",
    },
    {
      title: "Policy References",
      icon: Scale,
      items: guide.policy_refs,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800">
        <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-1">
          Preparation Pack
        </h3>
        <p className="text-xs text-indigo-500 dark:text-indigo-400">
          Review this before your {templateName} meeting
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon size={16} className="text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {section.title}
              </h4>
            </div>
            <ul className="space-y-2">
              {section.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  <span className="text-slate-400 mt-1 flex-shrink-0">
                    &bull;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
