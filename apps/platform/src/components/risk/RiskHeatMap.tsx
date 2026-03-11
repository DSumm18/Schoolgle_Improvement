"use client";

import { LIKELIHOOD_SCALE, IMPACT_SCALE } from "@/lib/risk-engine";

interface RiskHeatMapProps {
  matrix: number[][];
  onCellClick?: (likelihood: number, impact: number) => void;
}

function getCellColor(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score >= 17) return "bg-rose-500 text-white hover:bg-rose-600";
  if (score >= 10) return "bg-orange-400 text-white hover:bg-orange-500";
  if (score >= 5) return "bg-yellow-300 text-yellow-900 hover:bg-yellow-400";
  return "bg-emerald-300 text-emerald-900 hover:bg-emerald-400";
}

export function RiskHeatMap({ matrix, onCellClick }: RiskHeatMapProps) {
  // Render rows top-to-bottom: row 4 (Almost Certain) at top, row 0 (Rare) at bottom
  const reversedRows = [...matrix].reverse();
  const likelihoodLabels = [...LIKELIHOOD_SCALE].reverse();
  const impactLabels = IMPACT_SCALE;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 overflow-hidden">
      <h3 className="font-bold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
        Risk Heat Map
      </h3>

      <div className="flex gap-1">
        {/* Y-axis labels */}
        <div className="flex flex-col gap-1 pr-2 justify-center">
          {likelihoodLabels.map((l) => (
            <div key={l.score} className="h-14 flex items-center justify-end">
              <span className="text-[10px] font-semibold text-muted-foreground leading-tight text-right max-w-[80px]">
                {l.label}
              </span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-1">
            {reversedRows.map((row, rowIdx) => {
              const likelihoodScore = 5 - rowIdx; // 5 at top, 1 at bottom
              return row.map((count, colIdx) => {
                const impactScore = colIdx + 1;
                return (
                  <button
                    key={`${rowIdx}-${colIdx}`}
                    onClick={() => onCellClick?.(likelihoodScore, impactScore)}
                    className={`h-14 rounded-lg flex items-center justify-center font-black text-lg transition-colors cursor-pointer ${getCellColor(likelihoodScore, impactScore)} ${count === 0 ? "opacity-50" : ""}`}
                    title={`L${likelihoodScore} x I${impactScore} = ${likelihoodScore * impactScore} (${count} risk${count !== 1 ? "s" : ""})`}
                  >
                    {count > 0 ? count : ""}
                  </button>
                );
              });
            })}
          </div>

          {/* X-axis labels */}
          <div className="grid grid-cols-5 gap-1 mt-2">
            {impactLabels.map((imp) => (
              <div key={imp.score} className="text-center">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {imp.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Axis titles */}
      <div className="flex justify-between mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        <span>Likelihood &rarr;</span>
        <span>Impact &rarr;</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <span className="text-[10px] font-semibold text-muted-foreground">
          Key:
        </span>
        {[
          { label: "Low (1-4)", color: "bg-emerald-300" },
          { label: "Medium (5-9)", color: "bg-yellow-300" },
          { label: "High (10-16)", color: "bg-orange-400" },
          { label: "Critical (17-25)", color: "bg-rose-500" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${item.color}`} />
            <span className="text-[10px] text-muted-foreground font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
