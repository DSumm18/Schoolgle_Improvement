/**
 * Canvas Field Registry — defines every queryable field per data source.
 *
 * This is the backbone of the report builder. The UI reads this to show
 * available fields, and the query API uses it to validate + build queries.
 */

// ─── Types ──────────────────────────────────────────────────

export type FieldType = "dimension" | "metric";
export type DataType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "percentage"
  | "currency";
export type Aggregation =
  | "count"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "count_distinct";
export type DateBin = "day" | "week" | "month" | "term" | "year";

export interface FieldDefinition {
  field: string;
  label: string;
  fieldType: FieldType;
  dataType: DataType;
  aggregations?: Aggregation[];
  dateBinOptions?: DateBin[];
  filterOptions?: string[] | "dynamic";
  description?: string;
  /** If true, field is used as the default dimension */
  defaultDimension?: boolean;
  /** If true, field is used as the default metric */
  defaultMetric?: boolean;
}

export interface DataSourceDefinition {
  id: string;
  table: string;
  label: string;
  icon: string; // lucide icon name
  color: string;
  category: "school" | "dfe";
  fields: FieldDefinition[];
  /** Default chart type for this source */
  defaultChartType: "bar" | "line" | "pie" | "area";
  /** Organization-scoped (school data) or global (DfE) */
  orgScoped: boolean;
}

// ─── School Data Sources ────────────────────────────────────

const STAFF_DIRECTORY: DataSourceDefinition = {
  id: "staff",
  table: "staff_directory",
  label: "Staff Directory",
  icon: "Users",
  color: "#ADD8E6",
  category: "school",
  defaultChartType: "bar",
  orgScoped: true,
  fields: [
    {
      field: "role_category",
      label: "Role",
      fieldType: "dimension",
      dataType: "text",
      defaultDimension: true,
      filterOptions: [
        "Leadership",
        "Class Teacher",
        "Teaching Assistant",
        "Support Staff",
        "Business Manager",
        "Site Manager",
        "Admin",
        "SENDCO",
        "Other",
      ],
    },
    {
      field: "job_title",
      label: "Job Title",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: "dynamic",
    },
    {
      field: "is_active",
      label: "Active",
      fieldType: "dimension",
      dataType: "boolean",
      filterOptions: ["true", "false"],
    },
    {
      field: "start_date",
      label: "Start Date",
      fieldType: "dimension",
      dataType: "date",
      dateBinOptions: ["month", "year"],
    },
    {
      field: "id",
      label: "Headcount",
      fieldType: "metric",
      dataType: "number",
      aggregations: ["count"],
      defaultMetric: true,
    },
  ],
};

const FINANCE_TRANSACTIONS: DataSourceDefinition = {
  id: "finance",
  table: "finance_transactions",
  label: "Finance",
  icon: "PoundSterling",
  color: "#FFAA4C",
  category: "school",
  defaultChartType: "bar",
  orgScoped: true,
  fields: [
    {
      field: "cfr_description",
      label: "Category (CFR)",
      fieldType: "dimension",
      dataType: "text",
      defaultDimension: true,
      filterOptions: "dynamic",
    },
    {
      field: "cost_centre",
      label: "Cost Centre",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: "dynamic",
    },
    {
      field: "supplier_name",
      label: "Supplier",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: "dynamic",
    },
    {
      field: "transaction_type",
      label: "Transaction Type",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: "dynamic",
    },
    {
      field: "is_income",
      label: "Income/Expenditure",
      fieldType: "dimension",
      dataType: "boolean",
      filterOptions: ["Income", "Expenditure"],
    },
    {
      field: "transaction_date",
      label: "Date",
      fieldType: "dimension",
      dataType: "date",
      dateBinOptions: ["month", "term", "year"],
    },
    {
      field: "financial_year",
      label: "Financial Year",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: "dynamic",
    },
    {
      field: "gross_amount",
      label: "Amount (Gross)",
      fieldType: "metric",
      dataType: "currency",
      aggregations: ["sum", "avg", "min", "max"],
      defaultMetric: true,
    },
    {
      field: "net_amount",
      label: "Amount (Net)",
      fieldType: "metric",
      dataType: "currency",
      aggregations: ["sum", "avg", "min", "max"],
    },
    {
      field: "id",
      label: "Transaction Count",
      fieldType: "metric",
      dataType: "number",
      aggregations: ["count"],
    },
  ],
};

const ATTENDANCE_REGISTERS: DataSourceDefinition = {
  id: "attendance",
  table: "attendance_registers",
  label: "Attendance",
  icon: "CalendarCheck",
  color: "#0ea5e9",
  category: "school",
  defaultChartType: "line",
  orgScoped: true,
  fields: [
    {
      field: "register_date",
      label: "Date",
      fieldType: "dimension",
      dataType: "date",
      dateBinOptions: ["day", "week", "month", "term"],
      defaultDimension: true,
    },
    {
      field: "year_group",
      label: "Year Group",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: [
        "Reception",
        "Year 1",
        "Year 2",
        "Year 3",
        "Year 4",
        "Year 5",
        "Year 6",
      ],
    },
    {
      field: "class_name",
      label: "Class",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: "dynamic",
    },
    {
      field: "session",
      label: "Session",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: ["AM", "PM"],
    },
    {
      field: "mark",
      label: "Mark",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: [
        "/",
        "\\",
        "B",
        "C",
        "D",
        "H",
        "I",
        "L",
        "M",
        "N",
        "O",
        "U",
        "X",
        "Y",
      ],
    },
    {
      field: "id",
      label: "Marks Count",
      fieldType: "metric",
      dataType: "number",
      aggregations: ["count"],
      defaultMetric: true,
    },
  ],
};

const SEND_REGISTER: DataSourceDefinition = {
  id: "send",
  table: "send_register",
  label: "SEND",
  icon: "Heart",
  color: "#98FF98",
  category: "school",
  defaultChartType: "bar",
  orgScoped: true,
  fields: [
    {
      field: "year_group",
      label: "Year Group",
      fieldType: "dimension",
      dataType: "text",
      defaultDimension: true,
      filterOptions: [
        "Reception",
        "Year 1",
        "Year 2",
        "Year 3",
        "Year 4",
        "Year 5",
        "Year 6",
      ],
    },
    {
      field: "sen_status",
      label: "SEN Status",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: ["K", "E", "monitoring", "removed"],
    },
    {
      field: "primary_need",
      label: "Primary Need",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: [
        "SPLD",
        "MLD",
        "SLD",
        "PMLD",
        "SEMH",
        "SLCN",
        "HI",
        "VI",
        "MSI",
        "PD",
        "ASD",
        "OTH",
      ],
    },
    {
      field: "has_ehcp",
      label: "Has EHCP",
      fieldType: "dimension",
      dataType: "boolean",
      filterOptions: ["true", "false"],
    },
    {
      field: "id",
      label: "Pupil Count",
      fieldType: "metric",
      dataType: "number",
      aggregations: ["count"],
      defaultMetric: true,
    },
  ],
};

const RISK_REGISTER: DataSourceDefinition = {
  id: "risks",
  table: "risk_register",
  label: "Risk Register",
  icon: "AlertTriangle",
  color: "#ef4444",
  category: "school",
  defaultChartType: "bar",
  orgScoped: true,
  fields: [
    {
      field: "risk_categories",
      label: "Category",
      fieldType: "dimension",
      dataType: "text",
      defaultDimension: true,
      filterOptions: [
        "Financial",
        "Safeguarding",
        "Staffing",
        "Estates",
        "Governance",
        "Compliance",
        "Reputational",
        "Operational",
      ],
    },
    {
      field: "status",
      label: "Status",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: [
        "assessing",
        "treating",
        "tolerated",
        "closed",
        "escalated",
      ],
    },
    {
      field: "direction_of_travel",
      label: "Direction",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: ["improving", "stable", "worsening", "new"],
    },
    {
      field: "tier",
      label: "Tier",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: ["strategic", "operational"],
    },
    {
      field: "inherent_likelihood",
      label: "Likelihood",
      fieldType: "metric",
      dataType: "number",
      aggregations: ["avg", "max"],
    },
    {
      field: "inherent_impact",
      label: "Impact",
      fieldType: "metric",
      dataType: "number",
      aggregations: ["avg", "max"],
    },
    {
      field: "effective_residual_score",
      label: "Risk Score",
      fieldType: "metric",
      dataType: "number",
      aggregations: ["avg", "sum", "max"],
    },
    {
      field: "id",
      label: "Risk Count",
      fieldType: "metric",
      dataType: "number",
      aggregations: ["count"],
      defaultMetric: true,
    },
  ],
};

const ESTATES_TICKETS: DataSourceDefinition = {
  id: "estates",
  table: "estates_helpdesk_tickets",
  label: "Estates",
  icon: "Building",
  color: "#00D4D4",
  category: "school",
  defaultChartType: "bar",
  orgScoped: true,
  fields: [
    {
      field: "category",
      label: "Category",
      fieldType: "dimension",
      dataType: "text",
      defaultDimension: true,
      filterOptions: "dynamic",
    },
    {
      field: "priority",
      label: "Priority",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: ["Urgent", "High", "Medium", "Low"],
    },
    {
      field: "status",
      label: "Status",
      fieldType: "dimension",
      dataType: "text",
      filterOptions: ["open", "in_progress", "waiting", "resolved", "closed"],
    },
    {
      field: "created_at",
      label: "Date Raised",
      fieldType: "dimension",
      dataType: "date",
      dateBinOptions: ["week", "month"],
    },
    {
      field: "id",
      label: "Ticket Count",
      fieldType: "metric",
      dataType: "number",
      aggregations: ["count"],
      defaultMetric: true,
    },
    {
      field: "time_to_resolution_minutes",
      label: "Resolution Time (mins)",
      fieldType: "metric",
      dataType: "number",
      aggregations: ["avg", "min", "max"],
    },
  ],
};

// ─── Registry ───────────────────────────────────────────────

export const DATA_SOURCES: DataSourceDefinition[] = [
  STAFF_DIRECTORY,
  FINANCE_TRANSACTIONS,
  ATTENDANCE_REGISTERS,
  SEND_REGISTER,
  RISK_REGISTER,
  ESTATES_TICKETS,
];

export function getDataSource(
  sourceId: string,
): DataSourceDefinition | undefined {
  return DATA_SOURCES.find((s) => s.id === sourceId);
}

export function getDimensions(sourceId: string): FieldDefinition[] {
  const source = getDataSource(sourceId);
  return source?.fields.filter((f) => f.fieldType === "dimension") || [];
}

export function getMetrics(sourceId: string): FieldDefinition[] {
  const source = getDataSource(sourceId);
  return source?.fields.filter((f) => f.fieldType === "metric") || [];
}

export function getDefaultDimension(
  sourceId: string,
): FieldDefinition | undefined {
  return getDimensions(sourceId).find((f) => f.defaultDimension);
}

export function getDefaultMetric(
  sourceId: string,
): FieldDefinition | undefined {
  return getMetrics(sourceId).find((f) => f.defaultMetric);
}

/**
 * Validate that requested fields exist in the registry (prevents injection).
 */
export function validateFields(
  sourceId: string,
  fieldNames: string[],
): boolean {
  const source = getDataSource(sourceId);
  if (!source) return false;
  const validFields = new Set(source.fields.map((f) => f.field));
  return fieldNames.every((f) => validFields.has(f));
}
