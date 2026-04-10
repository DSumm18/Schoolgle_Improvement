// ─── Data Connector Registry ────────────────────────────────────────
// Central registry for all external data connectors (GIAS, DfE warehouse, etc.)

export interface ConnectorDefinition {
  id: string;
  name: string;
  description: string;
  source: string;
  sourceUrl: string;
  dataFormat: "json" | "csv" | "xml" | "api";
  refreshRate: string;
  status: "active" | "beta" | "planned" | "deprecated";
  capabilities: string[];
  icon: string;
  color: string;
}

export const CONNECTORS: Record<string, ConnectorDefinition> = {
  gias: {
    id: "gias",
    name: "GIAS (Get Information About Schools)",
    description:
      "Official DfE school directory with establishment details, contact information, and classification data for all schools in England.",
    source: "Department for Education",
    sourceUrl: "https://get-information-schools.service.gov.uk",
    dataFormat: "json",
    refreshRate: "Daily",
    status: "active",
    capabilities: [
      "Lookup school by URN",
      "Search by name or postcode",
      "School type and phase classification",
      "Academy/MAT identification",
      "Contact details and location",
    ],
    icon: "School",
    color: "#1d70b8", // GOV.UK blue
  },
};

export function getConnector(id: string): ConnectorDefinition | undefined {
  return CONNECTORS[id];
}

export function listConnectors(
  status?: ConnectorDefinition["status"],
): ConnectorDefinition[] {
  const all = Object.values(CONNECTORS);
  if (status) return all.filter((c) => c.status === status);
  return all;
}
