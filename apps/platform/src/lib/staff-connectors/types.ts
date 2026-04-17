export interface ConnectorType {
  id: string;
  name: string;
  category:
    | "safeguarding"
    | "send"
    | "health_safety"
    | "data_governance"
    | "curriculum"
    | "custom";
  statutoryBasis?: string; // e.g. "KCSIE 2025"
  isStatutory: boolean;
  ratioRequirement?: string; // e.g. "Min 1, always available" or "1:100"
  trainingRenewalMonths?: number; // e.g. 24 for "every 2 years"
  modules: string[]; // which platform modules this surfaces in
}

export interface StaffConnector {
  id: string;
  organization_id: string;
  staff_id: string; // FK to staff_directory
  connector_type_id: string;
  staff_name: string;
  status: "active" | "expiring" | "expired" | "pending";
  training_expires_at?: string; // ISO date
  assigned_at: string;
  notes?: string;
}

export interface ConnectorGap {
  connectorType: ConnectorType;
  severity: "critical" | "warning" | "info";
  message: string;
  affectedArea?: string; // e.g. "EYFS", "Block A"
  currentHolders: string[];
  requiredCount: number;
}

export interface LeavingImpact {
  staffName: string;
  connectors: Array<{
    connector: ConnectorType;
    severity: "critical" | "warning";
    message: string;
    alternatives: string[]; // names of staff who could cover
  }>;
}
