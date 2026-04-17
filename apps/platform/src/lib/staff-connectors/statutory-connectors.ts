import type { ConnectorType } from "./types";

// Registry of all statutory connector types for UK primary/secondary schools.
// These are platform-defined and cannot be deleted by schools.
const STATUTORY_CONNECTORS: ConnectorType[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // SAFEGUARDING & CHILD PROTECTION
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "dsl",
    name: "Designated Safeguarding Lead (DSL)",
    category: "safeguarding",
    statutoryBasis: "KCSIE 2025",
    isStatutory: true,
    ratioRequirement: "Min 1, always available",
    trainingRenewalMonths: 24,
    modules: ["compliance", "safeguarding", "governance"],
  },
  {
    id: "deputy-dsl",
    name: "Deputy Designated Safeguarding Lead",
    category: "safeguarding",
    statutoryBasis: "KCSIE 2025",
    isStatutory: true,
    ratioRequirement: "Recommended 1+",
    trainingRenewalMonths: 24,
    modules: ["compliance", "safeguarding"],
  },
  {
    id: "prevent-lead",
    name: "Prevent Lead",
    category: "safeguarding",
    statutoryBasis: "Prevent Duty Guidance",
    isStatutory: true,
    ratioRequirement: "Min 1",
    trainingRenewalMonths: 12,
    modules: ["compliance", "safeguarding"],
  },
  {
    id: "online-safety-lead",
    name: "Online Safety Lead",
    category: "safeguarding",
    statutoryBasis: "KCSIE 2025",
    isStatutory: true,
    ratioRequirement: "Min 1",
    trainingRenewalMonths: 12,
    modules: ["compliance", "it"],
  },
  {
    id: "lac-designated-teacher",
    name: "Designated Teacher for Looked After Children",
    category: "safeguarding",
    statutoryBasis: "Children Act 2004 s.20",
    isStatutory: true,
    ratioRequirement: "Exactly 1",
    trainingRenewalMonths: 12,
    modules: ["send", "compliance"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SEND
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "senco",
    name: "Special Educational Needs Coordinator (SENCO)",
    category: "send",
    statutoryBasis: "SEND Code of Practice 2015",
    isStatutory: true,
    ratioRequirement: "Exactly 1 (must hold/be working towards NASENCo)",
    // NASENCo qualification — no fixed renewal, but CPD ongoing
    trainingRenewalMonths: undefined,
    modules: ["send", "compliance", "meetings", "finance"],
  },
  {
    id: "deputy-senco",
    name: "Deputy SENCO",
    category: "send",
    statutoryBasis: undefined,
    isStatutory: false,
    ratioRequirement: "Recommended 1",
    trainingRenewalMonths: 12,
    modules: ["send"],
  },
  {
    id: "mental-health-lead",
    name: "Senior Mental Health Lead",
    category: "send",
    statutoryBasis: "DfE Senior Mental Health Lead training",
    isStatutory: true,
    ratioRequirement: "Min 1",
    trainingRenewalMonths: 24,
    modules: ["send", "compliance", "hr"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HEALTH & SAFETY
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "first-aider",
    name: "First Aider",
    category: "health_safety",
    statutoryBasis: "Health & Safety (First Aid) Regs 1981",
    isStatutory: true,
    ratioRequirement: "1:100 (risk-assessed)",
    trainingRenewalMonths: 36,
    modules: ["compliance", "estates", "hr"],
  },
  {
    id: "paediatric-first-aider",
    name: "Paediatric First Aider",
    category: "health_safety",
    statutoryBasis: "EYFS Statutory Framework",
    isStatutory: true,
    ratioRequirement: "Min 1 per EYFS setting, always on site",
    trainingRenewalMonths: 36,
    modules: ["compliance", "estates", "hr"],
  },
  {
    id: "fire-marshal",
    name: "Fire Marshal",
    category: "health_safety",
    statutoryBasis: "Regulatory Reform (Fire Safety) Order 2005",
    isStatutory: true,
    ratioRequirement: "1 per floor/zone (risk-assessed)",
    trainingRenewalMonths: 12,
    modules: ["estates", "compliance"],
  },
  {
    id: "hs-lead",
    name: "Health & Safety Lead",
    category: "health_safety",
    statutoryBasis: "H&S at Work Act 1974",
    isStatutory: true,
    ratioRequirement: "Min 1",
    trainingRenewalMonths: undefined, // Ongoing CPD
    modules: ["estates", "compliance"],
  },
  {
    id: "evc",
    name: "Educational Visits Coordinator (EVC)",
    category: "health_safety",
    statutoryBasis: "DfE H&S advice",
    isStatutory: true,
    ratioRequirement: "Min 1",
    trainingRenewalMonths: 36,
    modules: ["compliance", "hr"],
  },
  {
    id: "radiation-protection-supervisor",
    name: "Radiation Protection Supervisor",
    category: "health_safety",
    statutoryBasis: "IRR 2017",
    isStatutory: true,
    ratioRequirement: "1 if applicable",
    trainingRenewalMonths: undefined, // Per regulations
    modules: ["estates", "compliance"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DATA & GOVERNANCE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "dpo",
    name: "Data Protection Officer (DPO)",
    category: "data_governance",
    statutoryBasis: "UK GDPR Art. 37",
    isStatutory: true,
    ratioRequirement: "Exactly 1 (can be external)",
    trainingRenewalMonths: 12,
    modules: ["compliance", "governance", "it"],
  },
  {
    id: "exam-officer",
    name: "Exam Officer",
    category: "data_governance",
    statutoryBasis: "JCQ regulations",
    isStatutory: true,
    ratioRequirement: "Min 1",
    trainingRenewalMonths: 12,
    modules: ["compliance"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CURRICULUM & STANDARDS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "eyfs-lead",
    name: "EYFS Lead",
    category: "curriculum",
    statutoryBasis: "EYFS Statutory Framework",
    isStatutory: true,
    ratioRequirement: "Min 1 (if school has EYFS)",
    trainingRenewalMonths: 12,
    modules: ["compliance", "teaching"],
  },
  {
    id: "careers-leader",
    name: "Careers Leader",
    category: "curriculum",
    statutoryBasis: "Baker Clause / Gatsby Benchmarks",
    isStatutory: true,
    ratioRequirement: "Min 1 (secondary)",
    trainingRenewalMonths: undefined, // Ongoing CPD
    modules: ["compliance"],
  },
  {
    id: "ect-mentor",
    name: "ECT Mentor",
    category: "curriculum",
    statutoryBasis: "ECF 2021",
    isStatutory: true,
    ratioRequirement: "1 per ECT",
    trainingRenewalMonths: undefined, // Per ECF programme
    modules: ["hr", "teaching"],
  },
  {
    id: "ect-induction-tutor",
    name: "ECT Induction Tutor",
    category: "curriculum",
    statutoryBasis: "ECF 2021",
    isStatutory: true,
    ratioRequirement: "Min 1",
    trainingRenewalMonths: undefined, // Per ECF programme
    modules: ["hr", "teaching"],
  },
];

/**
 * Returns all statutory connector types.
 */
export function getAllStatutoryConnectors(): ConnectorType[] {
  return STATUTORY_CONNECTORS;
}

/**
 * Returns statutory connectors filtered by category.
 */
export function getConnectorsByCategory(
  category: ConnectorType["category"],
): ConnectorType[] {
  return STATUTORY_CONNECTORS.filter((c) => c.category === category);
}

/**
 * Returns a single connector type by ID, or undefined if not found.
 */
export function getConnectorById(id: string): ConnectorType | undefined {
  return STATUTORY_CONNECTORS.find((c) => c.id === id);
}
