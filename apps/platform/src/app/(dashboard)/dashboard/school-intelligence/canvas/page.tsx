"use client";

import Link from 'next/link';
import { ArrowLeft, Brain } from 'lucide-react';
import { LookerCanvas } from '@/components/school-intelligence/canvas/LookerCanvas';

export default function SchoolIntelligenceCanvasPage() {
  return (
    <div className="p-4 md:p-6 space-y-3 min-h-screen max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/school-intelligence"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
          <Brain className="w-4 h-4 text-purple-500" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground">Report Builder</h1>
          <p className="text-[10px] text-muted-foreground">
            Pick data sources, select fields, build your report. Like Google Looker for schools.
          </p>
        </div>
      </div>

      <LookerCanvas />
    </div>
  );
}
