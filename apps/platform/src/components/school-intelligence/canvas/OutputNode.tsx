"use client";

import { motion } from 'framer-motion';
import { FileText, Sparkles, Loader2 } from 'lucide-react';
import type { ReportTemplate } from './lib/templates';

interface OutputNodeProps {
  template: ReportTemplate;
  position: { x: number; y: number };
  canGenerate: boolean;
  missing: string[];
  generating: boolean;
  onGenerate: () => void;
}

export function OutputNode({ template, position, canGenerate, missing, generating, onGenerate }: OutputNodeProps) {
  const isReady = template.status === 'ready';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="absolute"
      style={{ width: 240 }}
    >
      <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/15 to-orange-500/10 shadow-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Output</div>
            <div className="text-xs font-bold text-foreground truncate">{template.title}</div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {template.description}
        </p>

        {!isReady && (
          <div className="mb-3 p-2 rounded-lg bg-muted/50 text-center">
            <div className="text-[9px] font-bold text-muted-foreground uppercase">Coming soon</div>
          </div>
        )}

        {isReady && missing.length > 0 && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="text-[9px] font-bold text-red-500 mb-0.5">Missing required:</div>
            <div className="text-[9px] text-red-400">{missing.join(', ')}</div>
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={!canGenerate || generating || !isReady}
          className={`w-full px-3 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
            canGenerate && isReady && !generating
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {generating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate via Guardian + Gemini
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
