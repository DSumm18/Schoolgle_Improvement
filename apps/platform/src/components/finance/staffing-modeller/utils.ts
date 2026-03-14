import type { Tier, ScenarioPostStatus } from "@/types/staffing";

// ─── Currency / percentage formatters ───────────────────────────────

export const fmt = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");
export const fk = (n: number) => "£" + Math.round(n / 1000) + "k";
export const pct = (n: number) => (Math.round(n * 10) / 10).toFixed(1) + "%";

// ─── Status constants ───────────────────────────────────────────────

export const SCENARIO_STATUS = {
  ACTIVE: "active" as ScenarioPostStatus,
  RELEASED: "released" as ScenarioPostStatus,
  ADDED: "added" as ScenarioPostStatus,
} as const;

export const DEFAULT_TIER: Tier = "support";

// ─── RAG rating helpers ─────────────────────────────────────────────

export type RAG = "green" | "amber" | "red";

export const RAG_COLORS: Record<RAG, string> = {
  green: "#3B6D11",
  amber: "#854F0B",
  red: "#A32D2D",
};

export function ragForStaffPct(val: number): RAG {
  return val < 80 ? "green" : val < 85 ? "amber" : "red";
}

export function ragForSltPct(val: number): RAG {
  return val < 15 ? "green" : val < 18 ? "amber" : "red";
}

export function ragForTaPct(val: number): RAG {
  return val < 12 ? "green" : val < 15 ? "amber" : "red";
}

export function ragForRange(val: number, lo: number, hi: number): RAG {
  if (val >= lo && val <= hi) return "green";
  if (Math.abs(val - (lo + hi) / 2) < 5) return "amber";
  return "red";
}

export function ragForAvgTeach(val: number): RAG {
  return val >= 30000 && val <= 48000 ? "green" : "amber";
}
