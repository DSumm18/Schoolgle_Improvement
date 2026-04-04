"use client";

import { TrendingDown, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface SavingsBannerProps {
  savingGbp: number;
  savingPct: number;
  unitSavingGbp?: number | null;
  unitSavingPct?: number | null;
}

export function SavingsBanner({
  savingGbp,
  savingPct,
  unitSavingGbp,
  unitSavingPct,
}: SavingsBannerProps) {
  const [displayGbp, setDisplayGbp] = useState(0);
  const showUnitSaving = unitSavingGbp && unitSavingGbp > 0 && unitSavingPct;

  useEffect(() => {
    const target = showUnitSaving ? unitSavingGbp : savingGbp;
    const duration = 800;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayGbp(target * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [savingGbp, unitSavingGbp, showUnitSaving]);

  if (savingGbp <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-green-600" />
          </div>
          <div>
            {showUnitSaving ? (
              <>
                <p className="text-sm font-medium text-green-800">Best per-item saving</p>
                <p className="text-xs text-green-600">
                  Pack price: Save £{savingGbp.toFixed(2)} ({savingPct.toFixed(1)}% less)
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-green-800">Best saving found</p>
                <p className="text-xs text-green-600">Across all matching suppliers</p>
              </>
            )}
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <div>
            <p className="text-3xl font-bold text-green-700">
              £{displayGbp.toFixed(2)}
            </p>
            <p className="text-sm text-green-600">
              {showUnitSaving
                ? `${unitSavingPct.toFixed(1)}% less per item`
                : `${savingPct.toFixed(1)}% less`}
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-yellow-500" />
        </div>
      </div>
    </div>
  );
}
