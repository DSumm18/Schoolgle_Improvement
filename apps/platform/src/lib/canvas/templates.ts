/**
 * Canvas Templates — 30 Pre-built Starting Points
 *
 * Zero-to-insight in 30 seconds. Each template defines:
 * - A viz spec with parameterised data source
 * - Required Schoolgle tables
 * - Target audience (role-based)
 * - Business area
 */

import type { ChartType, BusinessArea, VizSpec } from "./types";

export interface CanvasTemplate {
  id: string;
  name: string;
  businessArea: BusinessArea;
  description: string;
  category: string;
  vizSpecTemplate: VizSpec;
  requiredTables: string[];
  targetRoles: string[];
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  // ─── Attendance (6) ────────────────────────────────────────
  {
    id: "attendance-trend-term",
    name: "Attendance Trend (Termly)",
    businessArea: "attendance",
    description: "Term-on-term attendance rate with national benchmark overlay",
    category: "attendance",
    vizSpecTemplate: {
      chartType: "line",
      title: "Attendance Trend",
      subtitle: "Term-on-term attendance rate",
      dataSource: { table: "attendance_registers" },
      xAxis: { field: "term", label: "Term", type: "category" },
      yAxis: { field: "rate", label: "Attendance %", type: "percentage" },
      series: [{ field: "rate", label: "School Rate" }],
      benchmark: { label: "National (95.7%)", value: 95.7 },
      dataSources: [{ name: "Schoolgle Attendance" }, { name: "DfE National" }],
    },
    requiredTables: ["attendance_registers"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "attendance-by-year-group",
    name: "Attendance by Year Group",
    businessArea: "attendance",
    description: "Bar chart comparing attendance rates across year groups",
    category: "attendance",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Attendance by Year Group",
      dataSource: { table: "attendance_registers" },
      xAxis: { field: "year_group", label: "Year Group", type: "category" },
      yAxis: { field: "rate", label: "Attendance %", type: "percentage" },
      series: [{ field: "rate", label: "Attendance %" }],
      benchmark: { label: "School Target", value: 96 },
      dataSources: [{ name: "Schoolgle Attendance" }],
    },
    requiredTables: ["attendance_registers"],
    targetRoles: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "persistent-absence",
    name: "Persistent Absence Tracker",
    businessArea: "attendance",
    description: "Pupils below 90% attendance with trend direction",
    category: "attendance",
    vizSpecTemplate: {
      chartType: "table",
      title: "Persistent Absence",
      subtitle: "Pupils below 90% attendance",
      dataSource: { table: "attendance_summaries" },
      series: [
        { field: "count", label: "PA Count" },
        { field: "rate", label: "PA %" },
      ],
      dataSources: [{ name: "Schoolgle Attendance" }],
    },
    requiredTables: ["attendance_summaries"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "absence-by-day",
    name: "Absence by Day of Week",
    businessArea: "attendance",
    description:
      "Identifies Monday/Friday absence patterns (Bradford Factor indicator)",
    category: "attendance",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Absence by Day of Week",
      subtitle: "Which days have the most absences?",
      dataSource: { table: "attendance_registers" },
      xAxis: { field: "day", label: "Day", type: "category" },
      yAxis: { field: "absences", label: "Absences", type: "number" },
      series: [{ field: "absences", label: "Total Absences" }],
      dataSources: [{ name: "Schoolgle Attendance" }],
    },
    requiredTables: ["attendance_registers"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "attendance-vs-national",
    name: "School vs National Attendance",
    businessArea: "attendance",
    description: "Multi-year comparison against DfE published national figures",
    category: "attendance",
    vizSpecTemplate: {
      chartType: "line",
      title: "School vs National Attendance",
      dataSource: { table: "attendance_registers" },
      xAxis: {
        field: "academic_year",
        label: "Academic Year",
        type: "category",
      },
      yAxis: { field: "rate", label: "Attendance %", type: "percentage" },
      series: [
        { field: "school_rate", label: "School" },
        { field: "national_rate", label: "National", color: "#94a3b8" },
      ],
      dataSources: [
        { name: "Schoolgle Attendance" },
        { name: "DfE National Statistics" },
      ],
    },
    requiredTables: ["attendance_registers", "attendance"],
    targetRoles: ["admin", "headteacher", "slt", "governor"],
  },
  {
    id: "absence-codes-breakdown",
    name: "Absence Codes Breakdown",
    businessArea: "attendance",
    description:
      "Pie chart of absence reasons (illness, holiday, unauthorised, etc.)",
    category: "attendance",
    vizSpecTemplate: {
      chartType: "pie",
      title: "Absence Reasons",
      dataSource: { table: "attendance_registers" },
      series: [{ field: "count", label: "Count" }],
      dataSources: [{ name: "Schoolgle Attendance" }],
    },
    requiredTables: ["attendance_registers"],
    targetRoles: ["admin", "headteacher", "slt"],
  },

  // ─── Finance (6) ──────────────────────────────────────────
  {
    id: "budget-vs-actual",
    name: "Budget vs Actual",
    businessArea: "finance",
    description: "Year-to-date spend against budget by cost centre",
    category: "finance",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Budget vs Actual",
      subtitle: "Year to date",
      dataSource: { table: "finance_budget_lines" },
      xAxis: { field: "category", label: "Cost Centre", type: "category" },
      yAxis: { field: "budget", label: "Amount (£)", type: "number" },
      series: [
        { field: "budget", label: "Budget", color: "#94a3b8" },
        { field: "actual", label: "Actual" },
      ],
      dataSources: [{ name: "Schoolgle Finance" }],
    },
    requiredTables: ["finance_budget_lines"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "monthly-spend-profile",
    name: "Monthly Spend Profile",
    businessArea: "finance",
    description: "Monthly expenditure trend with seasonality patterns",
    category: "finance",
    vizSpecTemplate: {
      chartType: "area",
      title: "Monthly Spend Profile",
      dataSource: { table: "finance_transactions" },
      xAxis: { field: "month", label: "Month", type: "category" },
      yAxis: { field: "total", label: "Spend (£)", type: "number" },
      series: [{ field: "total", label: "Total Spend" }],
      dataSources: [{ name: "Schoolgle Finance" }],
    },
    requiredTables: ["finance_transactions"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "supplier-spend-top10",
    name: "Top 10 Suppliers by Spend",
    businessArea: "finance",
    description: "Highest-spend suppliers for procurement review",
    category: "finance",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Top 10 Suppliers",
      dataSource: { table: "finance_suppliers" },
      xAxis: { field: "supplier", label: "Supplier", type: "category" },
      yAxis: { field: "total_spend", label: "Total Spend (£)", type: "number" },
      series: [{ field: "total_spend", label: "Spend" }],
      dataSources: [{ name: "Schoolgle Finance" }],
    },
    requiredTables: ["finance_suppliers"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "staff-cost-ratio",
    name: "Staff Cost as % of Income (ICFP)",
    businessArea: "finance",
    description:
      "The single most important school finance metric — staff costs vs total income",
    category: "finance",
    vizSpecTemplate: {
      chartType: "metric_card",
      title: "Staff Cost Ratio",
      subtitle: "ICFP Key Metric",
      dataSource: { table: "finance_budget_lines" },
      series: [{ field: "value", label: "Value" }],
      benchmark: { label: "DfE Recommended (<75%)", value: 75 },
      dataSources: [
        { name: "Schoolgle Finance" },
        { name: "DfE ICFP Guidance" },
      ],
    },
    requiredTables: ["finance_budget_lines"],
    targetRoles: ["admin", "headteacher", "slt", "governor"],
  },
  {
    id: "income-breakdown",
    name: "Income Sources Breakdown",
    businessArea: "finance",
    description:
      "Where the money comes from — GAG, pupil premium, grants, trading",
    category: "finance",
    vizSpecTemplate: {
      chartType: "pie",
      title: "Income Sources",
      dataSource: { table: "expected_income" },
      series: [{ field: "amount", label: "Amount" }],
      dataSources: [{ name: "Schoolgle Finance" }],
    },
    requiredTables: ["expected_income"],
    targetRoles: ["admin", "headteacher", "slt", "governor"],
  },
  {
    id: "budget-forecast",
    name: "3-Year Budget Forecast",
    businessArea: "finance",
    description: "Projected income vs expenditure for 3 years",
    category: "finance",
    vizSpecTemplate: {
      chartType: "line",
      title: "3-Year Budget Forecast",
      dataSource: { table: "finance_budget_lines" },
      xAxis: { field: "year", label: "Year", type: "category" },
      yAxis: { field: "amount", label: "Amount (£)", type: "number" },
      series: [
        { field: "income", label: "Income" },
        { field: "expenditure", label: "Expenditure", color: "#ef4444" },
      ],
      dataSources: [{ name: "Schoolgle Finance" }],
    },
    requiredTables: ["finance_budget_lines"],
    targetRoles: ["admin", "headteacher", "slt", "governor"],
  },

  // ─── Staffing & HR (5) ────────────────────────────────────
  {
    id: "staff-composition",
    name: "Staff Composition",
    businessArea: "staffing_hr",
    description: "Teaching vs support staff breakdown with FTE",
    category: "staffing",
    vizSpecTemplate: {
      chartType: "pie",
      title: "Staff Composition",
      dataSource: { table: "staff_directory" },
      series: [{ field: "count", label: "Count" }],
      dataSources: [{ name: "Schoolgle HR" }],
    },
    requiredTables: ["staff_directory"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "sickness-bradford",
    name: "Sickness & Bradford Factor",
    businessArea: "staffing_hr",
    description: "Staff absence patterns with Bradford Factor scores",
    category: "staffing",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Staff Sickness Overview",
      dataSource: { table: "staff_absences" },
      xAxis: { field: "month", label: "Month", type: "category" },
      yAxis: { field: "days_lost", label: "Days Lost", type: "number" },
      series: [{ field: "days_lost", label: "Days Lost" }],
      dataSources: [{ name: "Schoolgle HR" }],
    },
    requiredTables: ["staff_absences"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "staff-turnover",
    name: "Staff Turnover",
    businessArea: "staffing_hr",
    description: "Starters and leavers by term with retention rate",
    category: "staffing",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Staff Turnover",
      dataSource: { table: "staff_directory" },
      xAxis: { field: "term", label: "Term", type: "category" },
      yAxis: { field: "count", label: "Count", type: "number" },
      series: [
        { field: "starters", label: "Starters" },
        { field: "leavers", label: "Leavers", color: "#ef4444" },
      ],
      dataSources: [{ name: "Schoolgle HR" }],
    },
    requiredTables: ["staff_directory"],
    targetRoles: ["admin", "headteacher", "slt", "governor"],
  },
  {
    id: "pay-scale-distribution",
    name: "Pay Scale Distribution",
    businessArea: "staffing_hr",
    description: "Staff count at each pay point — useful for budget planning",
    category: "staffing",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Pay Scale Distribution",
      dataSource: { table: "staff_contracts" },
      xAxis: { field: "pay_point", label: "Pay Point", type: "category" },
      yAxis: { field: "count", label: "Staff Count", type: "number" },
      series: [{ field: "count", label: "Staff" }],
      dataSources: [{ name: "Schoolgle HR" }],
    },
    requiredTables: ["staff_contracts"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "training-compliance",
    name: "Training Compliance Matrix",
    businessArea: "staffing_hr",
    description:
      "Staff training completion rates — safeguarding, first aid, fire, etc.",
    category: "staffing",
    vizSpecTemplate: {
      chartType: "heatmap",
      title: "Training Compliance",
      dataSource: { table: "compliance_training_completions" },
      series: [{ field: "completion_rate", label: "Completion %" }],
      dataSources: [{ name: "Schoolgle Compliance" }],
    },
    requiredTables: ["compliance_training_completions"],
    targetRoles: ["admin", "headteacher", "slt"],
  },

  // ─── SEND (3) ─────────────────────────────────────────────
  {
    id: "send-register-summary",
    name: "SEND Register Summary",
    businessArea: "send",
    description: "SEN Support (K) and EHCP (E) counts by year group",
    category: "send",
    vizSpecTemplate: {
      chartType: "bar",
      title: "SEND Register",
      dataSource: { table: "send_register" },
      xAxis: { field: "year_group", label: "Year Group", type: "category" },
      yAxis: { field: "count", label: "Pupils", type: "number" },
      series: [
        { field: "sen_support", label: "SEN Support (K)" },
        { field: "ehcp", label: "EHCP (E)", color: "#ef4444" },
      ],
      dataSources: [{ name: "Schoolgle SEND" }],
    },
    requiredTables: ["send_register"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "send-provision-costs",
    name: "SEND Provision Cost per Pupil",
    businessArea: "send",
    description:
      "What each SEND pupil costs in support — TA hours, specialist input, resources",
    category: "send",
    vizSpecTemplate: {
      chartType: "bar",
      title: "SEND Provision Costs",
      dataSource: { table: "send_provision_map" },
      xAxis: { field: "provision_type", label: "Provision", type: "category" },
      yAxis: { field: "cost", label: "Cost (£)", type: "number" },
      series: [{ field: "cost", label: "Annual Cost" }],
      dataSources: [{ name: "Schoolgle SEND" }],
    },
    requiredTables: ["send_provision_map"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "send-needs-profile",
    name: "SEND Primary Needs Profile",
    businessArea: "send",
    description: "Breakdown of primary needs (SEMH, SpLD, ASD, SLCN, etc.)",
    category: "send",
    vizSpecTemplate: {
      chartType: "pie",
      title: "SEND Primary Needs",
      dataSource: { table: "send_register" },
      series: [{ field: "count", label: "Count" }],
      dataSources: [{ name: "Schoolgle SEND" }],
    },
    requiredTables: ["send_register"],
    targetRoles: ["admin", "headteacher", "slt"],
  },

  // ─── Governance (2) ───────────────────────────────────────
  {
    id: "governor-attendance",
    name: "Governor Meeting Attendance",
    businessArea: "governance",
    description: "Which governors attend which meetings — compliance evidence",
    category: "governance",
    vizSpecTemplate: {
      chartType: "heatmap",
      title: "Governor Attendance",
      dataSource: { table: "meeting_attendees" },
      series: [{ field: "attended", label: "Attended" }],
      dataSources: [{ name: "Schoolgle Governance" }],
    },
    requiredTables: ["meeting_attendees"],
    targetRoles: ["admin", "headteacher", "governor"],
  },
  {
    id: "governor-kpis",
    name: "Governor KPI Dashboard",
    businessArea: "governance",
    description:
      "Key metrics governors need — attendance, budget, risk, staffing in one view",
    category: "governance",
    vizSpecTemplate: {
      chartType: "metric_card",
      title: "Governor KPIs",
      dataSource: { table: "multiple" },
      series: [{ field: "value", label: "Value" }],
      dataSources: [{ name: "Schoolgle (All Modules)" }],
    },
    requiredTables: [
      "attendance_registers",
      "finance_budget_lines",
      "risk_register",
      "staff_directory",
    ],
    targetRoles: ["admin", "headteacher", "governor"],
  },

  // ─── Estates (2) ──────────────────────────────────────────
  {
    id: "estates-open-tasks",
    name: "Open Maintenance Tasks",
    businessArea: "premises_coshh",
    description: "Helpdesk tickets and statutory checks by priority",
    category: "estates",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Open Maintenance Tasks",
      dataSource: { table: "estates_helpdesk_tickets" },
      xAxis: { field: "priority", label: "Priority", type: "category" },
      yAxis: { field: "count", label: "Count", type: "number" },
      series: [{ field: "count", label: "Tasks" }],
      dataSources: [{ name: "Schoolgle Estates" }],
    },
    requiredTables: ["estates_helpdesk_tickets"],
    targetRoles: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "energy-consumption",
    name: "Energy Consumption Trend",
    businessArea: "premises_coshh",
    description: "Gas and electricity usage with cost overlay",
    category: "estates",
    vizSpecTemplate: {
      chartType: "area",
      title: "Energy Consumption",
      dataSource: { table: "energy_readings" },
      xAxis: { field: "month", label: "Month", type: "category" },
      yAxis: { field: "consumption", label: "kWh", type: "number" },
      series: [
        { field: "electricity", label: "Electricity" },
        { field: "gas", label: "Gas", color: "#f97316" },
      ],
      dataSources: [{ name: "Schoolgle Energy" }],
    },
    requiredTables: ["energy_readings"],
    targetRoles: ["admin", "headteacher", "slt", "caretaker"],
  },

  // ─── Data Quality (3) ─────────────────────────────────────
  {
    id: "reconciliation-summary",
    name: "Data Reconciliation Summary",
    businessArea: "data_quality",
    description:
      "Cross-system discrepancy overview — GDPR Article 5(1)(d) evidence",
    category: "data_quality",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Data Discrepancies by Field",
      dataSource: { table: "canvas_reconciliation_log" },
      xAxis: { field: "field_name", label: "Field", type: "category" },
      yAxis: { field: "count", label: "Conflicts", type: "number" },
      series: [{ field: "count", label: "Discrepancies", color: "#ef4444" }],
      dataSources: [{ name: "Canvas Reconciliation" }],
    },
    requiredTables: ["canvas_reconciliation_log"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "migration-readiness",
    name: "MIS Migration Readiness",
    businessArea: "data_quality",
    description: "Gauge showing how ready you are for MIS migration",
    category: "data_quality",
    vizSpecTemplate: {
      chartType: "metric_card",
      title: "Migration Readiness",
      dataSource: { table: "canvas_sessions" },
      series: [{ field: "value", label: "Score" }],
      dataSources: [{ name: "Canvas Migration" }],
    },
    requiredTables: ["canvas_sessions"],
    targetRoles: ["admin", "headteacher", "slt"],
  },
  {
    id: "connected-systems-status",
    name: "Connected Systems Status",
    businessArea: "data_quality",
    description: "Overview of all connected data sources and their health",
    category: "data_quality",
    vizSpecTemplate: {
      chartType: "table",
      title: "Connected Systems",
      dataSource: { table: "data_sources" },
      series: [{ field: "status", label: "Status" }],
      dataSources: [{ name: "Schoolgle Connectors" }],
    },
    requiredTables: ["data_sources"],
    targetRoles: ["admin", "headteacher", "slt"],
  },

  // ─── Safeguarding (1) ─────────────────────────────────────
  {
    id: "safeguarding-concerns-category",
    name: "Safeguarding Concerns by Category",
    businessArea: "safeguarding",
    description: "Concern types breakdown — for DSL annual report",
    category: "safeguarding",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Safeguarding Concerns",
      subtitle: "By category this academic year",
      dataSource: { table: "safeguarding_concerns" },
      xAxis: { field: "category", label: "Category", type: "category" },
      yAxis: { field: "count", label: "Count", type: "number" },
      series: [{ field: "count", label: "Concerns" }],
      dataSources: [{ name: "Schoolgle Safeguarding" }],
    },
    requiredTables: ["safeguarding_concerns"],
    targetRoles: ["admin", "headteacher"],
  },

  // ─── Curriculum & Progress (2) ────────────────────────────
  {
    id: "pupil-premium-impact",
    name: "Pupil Premium Impact",
    businessArea: "curriculum_progress",
    description: "PP vs non-PP attainment gap with EEF strategy effectiveness",
    category: "curriculum",
    vizSpecTemplate: {
      chartType: "bar",
      title: "Pupil Premium Impact",
      dataSource: { table: "pupil_assessments_pseudo" },
      xAxis: { field: "subject", label: "Subject", type: "category" },
      yAxis: { field: "score", label: "Average Score", type: "number" },
      series: [
        { field: "pp_score", label: "PP Pupils" },
        { field: "non_pp_score", label: "Non-PP", color: "#94a3b8" },
      ],
      dataSources: [{ name: "Schoolgle Assessments" }],
    },
    requiredTables: ["pupil_assessments_pseudo"],
    targetRoles: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "assessment-overview",
    name: "Assessment Overview",
    businessArea: "curriculum_progress",
    description:
      "School-wide attainment summary across subjects and year groups",
    category: "curriculum",
    vizSpecTemplate: {
      chartType: "heatmap",
      title: "Assessment Overview",
      dataSource: { table: "pupil_assessments_pseudo" },
      series: [{ field: "pct_expected", label: "% at Expected" }],
      dataSources: [{ name: "Schoolgle Assessments" }],
    },
    requiredTables: ["pupil_assessments_pseudo"],
    targetRoles: ["admin", "headteacher", "slt", "teacher"],
  },
];
