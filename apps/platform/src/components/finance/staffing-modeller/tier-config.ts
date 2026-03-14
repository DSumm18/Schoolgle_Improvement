import type { Tier } from "@/types/staffing";

export interface TierConfig {
  label: string;
  color: string;
  payGroup: "head" | "teacher" | "support";
  dfeCode: string;
  bg: string;
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  headteacher: { label: "Headteacher", color: "#534AB7", payGroup: "head", dfeCode: "E01a", bg: "#EEEDFE" },
  slt: { label: "Senior leadership", color: "#0F6E56", payGroup: "teacher", dfeCode: "E01b", bg: "#E1F5EE" },
  teachers: { label: "Teachers", color: "#185FA5", payGroup: "teacher", dfeCode: "E01c", bg: "#E6F1FB" },
  tas: { label: "Teaching assistants", color: "#3B6D11", payGroup: "support", dfeCode: "E04b", bg: "#EAF3DE" },
  support: { label: "Support staff", color: "#854F0B", payGroup: "support", dfeCode: "E05a", bg: "#FAEEDA" },
  volunteers: { label: "Volunteers", color: "#6B7280", payGroup: "support", dfeCode: "E05a", bg: "#F3F4F6" },
};

export const TIER_ORDER: Tier[] = ["headteacher", "slt", "teachers", "tas", "support"];

export const DFE_CODES = {
  E01a: { label: "Headteacher", col: "#534AB7", bg: "#EEEDFE" },
  E01b: { label: "SLT", col: "#0F6E56", bg: "#E1F5EE" },
  E01c: { label: "Teachers", col: "#185FA5", bg: "#E6F1FB" },
  E04b: { label: "TAs", col: "#3B6D11", bg: "#EAF3DE" },
  E05a: { label: "Support", col: "#854F0B", bg: "#FAEEDA" },
} as const;

export const CODE_ORDER = ["E01a", "E01b", "E01c", "E04b", "E05a"] as const;
export const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export const ROLE_LIBRARY = [
  { id: "l1", role: "ECT (MPR1)", tier: "teachers" as Tier, salary: 30000, oc: 0.428 },
  { id: "l2", role: "MPR3 teacher", tier: "teachers" as Tier, salary: 35000, oc: 0.428 },
  { id: "l3", role: "UPS3 teacher", tier: "teachers" as Tier, salary: 47673, oc: 0.428 },
  { id: "l4", role: "HLTA", tier: "tas" as Tier, salary: 28500, oc: 0.338 },
  { id: "l5", role: "TA level 2", tier: "tas" as Tier, salary: 19500, oc: 0.338 },
  { id: "l6", role: "Admin officer", tier: "support" as Tier, salary: 22000, oc: 0.338 },
  { id: "l7", role: "Site manager", tier: "support" as Tier, salary: 27000, oc: 0.338 },
  { id: "l8", role: "Deputy head", tier: "slt" as Tier, salary: 72000, oc: 0.428 },
  { id: "l9", role: "Asst. head", tier: "slt" as Tier, salary: 63000, oc: 0.428 },
  { id: "l10", role: "TA level 3", tier: "tas" as Tier, salary: 23000, oc: 0.338 },
];
