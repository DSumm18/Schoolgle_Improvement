"use client";

import { SourceBadge } from './SourceBadge';

interface ComparisonRow {
  subject: string;
  schoolValue: number;
  nationalAvg: number;
  laAvg: number;
  higherStandard?: number;
  scaledScore?: number;
}

interface ComparisonTableProps {
  title: string;
  rows: ComparisonRow[];
  sourceColour: string;
  sourceName: string;
  laName: string;
}

export function ComparisonTable({ title, rows, sourceColour, sourceName, laName }: ComparisonTableProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <div className="ml-auto flex items-center gap-2">
          <SourceBadge name={sourceName} colour={sourceColour} verified />
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] text-muted-foreground uppercase tracking-wider">
            <th className="text-left py-2 px-3">Subject</th>
            <th className="text-left py-2 px-3">School</th>
            <th className="text-left py-2 px-3">National</th>
            <th className="text-left py-2 px-3">Diff</th>
            <th className="text-left py-2 px-3">{laName}</th>
            <th className="text-left py-2 px-3">Diff</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const diffNat = Math.round((row.schoolValue - row.nationalAvg) * 10) / 10;
            const diffLa = Math.round((row.schoolValue - row.laAvg) * 10) / 10;
            return (
              <tr key={row.subject} className="border-t border-border/50 hover:bg-accent/5">
                <td className="py-2 px-3 font-semibold">{row.subject}</td>
                <td className="py-2 px-3 font-bold text-purple-400">{row.schoolValue}%</td>
                <td className="py-2 px-3 text-muted-foreground">{row.nationalAvg}%</td>
                <td className={`py-2 px-3 font-semibold ${diffNat >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {diffNat >= 0 ? '+' : ''}{diffNat}pp
                </td>
                <td className="py-2 px-3 text-muted-foreground">{row.laAvg}%</td>
                <td className={`py-2 px-3 font-semibold ${diffLa >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {diffLa >= 0 ? '+' : ''}{diffLa}pp
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
