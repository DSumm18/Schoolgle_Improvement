"use client";

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ReconciliationResult } from '@/lib/smart-connectors/types';

export function ReconciliationBanner({ result }: { result: ReconciliationResult }) {
  const isClean = result.overallStatus === 'verified';
  const Icon = isClean ? CheckCircle2 : result.overallStatus === 'errors' ? XCircle : AlertTriangle;
  const borderColour = isClean ? 'border-emerald-500/30' : 'border-amber-500/30';
  const bgColour = isClean ? 'bg-emerald-500/5' : 'bg-amber-500/5';
  const iconColour = isClean ? 'text-emerald-500' : 'text-amber-500';

  return (
    <div className={`rounded-xl border ${borderColour} ${bgColour} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${iconColour}`} />
        <h3 className={`text-sm font-bold ${isClean ? 'text-emerald-400' : 'text-amber-400'}`}>
          Reconciliation: {result.verifiedCount} verified
          {result.warningCount > 0 && `, ${result.warningCount} need attention`}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {result.checks.map((check, i) => (
          <div key={i} className="rounded-lg bg-card border border-border p-3">
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
              {check.field} — {check.sourceA.name}
            </div>
            <div className={`text-xl font-extrabold mt-1 ${
              check.status === 'match' ? 'text-emerald-500' :
              check.status === 'discrepancy' ? 'text-amber-500' : 'text-muted-foreground'
            }`}>
              {String(check.sourceA.value)}{typeof check.sourceA.value === 'number' && check.field.includes('%') ? '%' : ''}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              vs {check.sourceB.name}: {String(check.sourceB.value)}{typeof check.sourceB.value === 'number' && check.field.includes('%') ? '%' : ''}
            </div>
            {check.explanation && (
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                {check.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
