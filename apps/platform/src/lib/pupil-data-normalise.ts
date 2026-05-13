export function normalisePupilName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s'-])([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

export function normaliseYearGroup(value: string) {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "reception" || lower === "r") return "R";
  if (lower === "nursery" || lower === "n") return "N";
  const match = lower.match(/^y(?:ear)?\s*(\d+)$/);
  return match ? match[1] : trimmed.toUpperCase();
}

export function normaliseYearGroupLabel(value: string) {
  const normalised = normaliseYearGroup(value);
  if (normalised === "R") return "Reception";
  if (normalised === "N") return "Nursery";
  if (/^\d+$/.test(normalised)) return `Year ${normalised}`;
  return normalisePupilName(normalised);
}

export function yearGroupLabelToNumber(value: string) {
  const normalised = normaliseYearGroup(value);
  if (normalised === "N") return -1;
  if (normalised === "R") return 0;
  const parsed = Number.parseInt(normalised, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normaliseClassName(value: string) {
  const cleaned = value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  const lower = cleaned.toLowerCase();
  const excelTimeClassMatch = lower.match(/^(\d{1,2}):00\s*([ap])m$/);
  if (excelTimeClassMatch) return `${excelTimeClassMatch[1]}${excelTimeClassMatch[2].toUpperCase()}`;
  const yearClassMatch = lower.match(/^(?:year\s*)?([nr]|\d+)\s*([a-z])$/);
  if (yearClassMatch) return `${normaliseYearGroup(yearClassMatch[1])}${yearClassMatch[2].toUpperCase()}`;
  if (/^\d+[a-z]+$/i.test(cleaned)) return `${cleaned.slice(0, -1)}${cleaned.slice(-1).toUpperCase()}`;
  return normalisePupilName(cleaned);
}

export function normaliseGender(value: string | null | undefined) {
  const trimmed = value?.trim();
  const lower = trimmed?.toLowerCase();
  if (!lower) return null;
  if (["f", "female", "girl"].includes(lower)) return "F";
  if (["m", "male", "boy"].includes(lower)) return "M";
  if (["o", "other", "non-binary", "nonbinary"].includes(lower)) return "O";
  return lower.toUpperCase();
}

export function normaliseSendStatus(value: string | null | undefined) {
  const trimmed = value?.trim();
  const lower = trimmed?.toLowerCase();
  if (!lower) return null;
  if (["e", "ehcp", "education health care plan"].includes(lower)) return "E";
  if (["k", "sen support", "send support", "support"].includes(lower)) return "K";
  if (["n", "none", "no"].includes(lower)) return null;
  return lower.toUpperCase();
}
