"use client";

import Link from 'next/link';
import { ArrowLeft, Brain } from 'lucide-react';
import { Canvas } from '@/components/school-intelligence/canvas/Canvas';

export default function SchoolIntelligenceCanvasPage() {
  return (
    <div className="p-4 md:p-6 space-y-4 min-h-screen max-w-[1600px] mx-auto">
      <Link
        href="/dashboard/school-intelligence"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> School Intelligence
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">Report Builder</h1>
          <p className="text-xs text-muted-foreground">
            Pick a template, see what data feeds into it, then generate a real report via Guardian + Gemini.
          </p>
        </div>
      </div>

      <Canvas />
    </div>
  );
}
