"use client";

import { useState, useCallback } from "react";

const MONTH_OPTIONS = [
  { label: "Apr", value: 3 },
  { label: "Sept", value: 8 },
];

interface PaySlider {
  id: string;
  label: string;
  framework: string;
  color: string;
  defaultRate: number;
  defaultMonth: number;
}

const SLIDERS: PaySlider[] = [
  { id: "ht", label: "HT (HTPR)", framework: "HTPR", color: "#534AB7", defaultRate: 5.5, defaultMonth: 8 },
  { id: "teachers", label: "Teachers (STPCD)", framework: "STPCD", color: "#185FA5", defaultRate: 5.5, defaultMonth: 8 },
  { id: "support", label: "Support (NJC)", framework: "NJC", color: "#854F0B", defaultRate: 4.0, defaultMonth: 3 },
];

export interface PayRates {
  head: { rate: number; mo: number };
  teacher: { rate: number; mo: number };
  support: { rate: number; mo: number };
}

interface PayAssumptionsBarProps {
  onPayChange?: (pay: PayRates) => void;
  onNonPayrollChange?: (value: number) => void;
}

export function PayAssumptionsBar({ onPayChange, onNonPayrollChange }: PayAssumptionsBarProps) {
  const [rates, setRates] = useState<Record<string, number>>({
    ht: 5.5,
    teachers: 5.5,
    support: 4.0,
  });
  const [months, setMonths] = useState<Record<string, number>>({
    ht: 8,
    teachers: 8,
    support: 3,
  });
  const [nonPayroll, setNonPayroll] = useState(15000);

  const handleRateChange = useCallback(
    (id: string, val: number) => {
      setRates((prev) => {
        const next = { ...prev, [id]: val };
        onPayChange?.({
          head: { rate: next.ht / 100, mo: months.ht },
          teacher: { rate: next.teachers / 100, mo: months.teachers },
          support: { rate: next.support / 100, mo: months.support },
        });
        return next;
      });
    },
    [months, onPayChange],
  );

  const handleMonthChange = useCallback(
    (id: string, val: number) => {
      setMonths((prev) => {
        const next = { ...prev, [id]: val };
        onPayChange?.({
          head: { rate: rates.ht / 100, mo: next.ht },
          teacher: { rate: rates.teachers / 100, mo: next.teachers },
          support: { rate: rates.support / 100, mo: next.support },
        });
        return next;
      });
    },
    [rates, onPayChange],
  );

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 flex-wrap">
      {SLIDERS.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2">
          {idx > 0 && (
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          )}
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {s.label}
          </span>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={rates[s.id]}
            onChange={(e) => handleRateChange(s.id, parseFloat(e.target.value))}
            className="w-14 accent-[#0F6E56]"
          />
          <span className="text-xs font-medium min-w-[32px]">
            {rates[s.id].toFixed(1)}%
          </span>
          {s.id !== "ht" && (
            <select
              value={months[s.id]}
              onChange={(e) => handleMonthChange(s.id, parseInt(e.target.value))}
              className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {MONTH_OPTIONS.map((mo) => (
                <option key={mo.value} value={mo.value}>
                  {mo.label}
                </option>
              ))}
            </select>
          )}
          {s.id === "ht" && (
            <span className="text-[10px] text-slate-400">Sept</span>
          )}
        </div>
      ))}

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-[10px] text-slate-500 dark:text-slate-400">Non-payroll:</span>
        <input
          type="number"
          value={nonPayroll}
          onChange={(e) => {
            const v = parseInt(e.target.value) || 0;
            setNonPayroll(v);
            onNonPayrollChange?.(v);
          }}
          className="w-16 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
        />
        <span className="text-[10px] text-slate-400">/yr</span>
      </div>
    </div>
  );
}
