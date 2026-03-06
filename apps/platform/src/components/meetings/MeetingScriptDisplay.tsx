"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface Props {
  title: string;
  paragraphs: string[];
}

export function MeetingScriptDisplay({ title, paragraphs }: Props) {
  const [copied, setCopied] = useState(false);

  const fullText = paragraphs.join("\n\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          {title}
        </h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-base leading-relaxed text-slate-700 dark:text-slate-200 italic"
          >
            &ldquo;{p}&rdquo;
          </p>
        ))}
      </div>
    </div>
  );
}
