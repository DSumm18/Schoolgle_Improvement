/**
 * School Skills Registry
 *
 * Function schemas for AI-powered school management.
 * These schemas define the functions the AI assistant can call
 * to interact with Staff Directory and Actions Hub.
 */

// =====================================================
// STAFF DIRECTORY SKILLS
// =====================================================

export const STAFF_FUNCTION_SCHEMAS = [
  {
    name: "create_staff_member",
    description: "Add a new staff member to the directory",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID to assign staff to",
        },
        first_name: {
          type: "string",
          description: "Staff member first name (required)",
        },
        last_name: {
          type: "string",
          description: "Staff member last name (required)",
        },
        salutation: {
          type: "string",
          enum: ["Mr", "Mrs", "Ms", "Dr", "Prof", "Miss", ""],
          description: "Title/salutation",
        },
        email: {
          type: "string",
          description: "Email address (used for matching)",
        },
        phone: {
          type: "string",
          description: "Contact phone number",
        },
        employee_id: {
          type: "string",
          description: "Staff/employee ID (used for matching)",
        },
        job_title: {
          type: "string",
          description: "Job title or position (required)",
        },
        role_category: {
          type: "string",
          enum: [
            "headteacher",
            "deputy_headteacher",
            "assistant_headteacher",
            "subject_lead",
            "phase_lead",
            "class_teacher",
            "sendco",
            "business_manager",
            "site_manager",
            "governor",
            "teaching_assistant",
            "support_staff",
            "other",
          ],
          description: "Role category for filtering",
        },
        is_super_user: {
          type: "boolean",
          description: "Has elevated permissions across all modules",
        },
        is_active: {
          type: "boolean",
          description: "Staff member is currently active (default: true)",
        },
      },
      required: ["organization_id", "first_name", "last_name", "job_title"],
    },
  },
  {
    name: "update_staff_member",
    description: "Update an existing staff member record",
    parameters: {
      type: "object",
      properties: {
        staff_id: {
          type: "string",
          description: "Staff member ID to update (required)",
        },
        first_name: {
          type: "string",
          description: "First name",
        },
        last_name: {
          type: "string",
          description: "Last name",
        },
        email: {
          type: "string",
          description: "Email address",
        },
        phone: {
          type: "string",
          description: "Phone number",
        },
        employee_id: {
          type: "string",
          description: "Employee ID",
        },
        job_title: {
          type: "string",
          description: "Job title",
        },
        role_category: {
          type: "string",
          enum: [
            "headteacher",
            "deputy_headteacher",
            "assistant_headteacher",
            "subject_lead",
            "phase_lead",
            "class_teacher",
            "sendco",
            "business_manager",
            "site_manager",
            "governor",
            "teaching_assistant",
            "support_staff",
            "other",
          ],
          description: "Role category",
        },
        is_super_user: {
          type: "boolean",
          description: "Super user status",
        },
        is_active: {
          type: "boolean",
          description: "Active status",
        },
      },
      required: ["staff_id"],
    },
  },
  {
    name: "list_staff",
    description: "List all staff members with optional filtering",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID to filter by (required)",
        },
        role_category: {
          type: "string",
          description: "Filter by role category",
        },
        is_active: {
          type: "boolean",
          description: "Filter by active status",
        },
        search: {
          type: "string",
          description: "Search by name or email",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "export_staff_csv",
    description: "Export staff directory as CSV for round-trip editing",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID to export for (required)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "import_staff_csv",
    description: "Import staff from CSV (supports add/update/remove actions)",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        csv_data: {
          type: "string",
          description: "CSV data with embedded instructions (required)",
        },
      },
      required: ["organization_id", "csv_data"],
    },
  },
  {
    name: "deactivate_staff_member",
    description: "Deactivate (archive) a staff member without deleting",
    parameters: {
      type: "object",
      properties: {
        staff_id: {
          type: "string",
          description: "Staff member ID to deactivate (required)",
        },
      },
      required: ["staff_id"],
    },
  },
];

// =====================================================
// ACTIONS HUB SKILLS
// =====================================================

export const ACTIONS_FUNCTION_SCHEMAS = [
  {
    name: "create_action",
    description: "Create a new improvement action with EEF research backing",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        title: {
          type: "string",
          description: "Action title (required)",
        },
        description: {
          type: "string",
          description: "Detailed description",
        },
        success_criteria: {
          type: "string",
          description: "How will we know this action is complete?",
        },
        framework_type: {
          type: "string",
          enum: ["ofsted", "siams"],
          description: "Framework: Ofsted or SIAMS (default: ofsted)",
        },
        priority: {
          type: "string",
          enum: ["critical", "high", "medium", "low"],
          description: "Priority level (default: medium)",
        },
        owner_id: {
          type: "string",
          description: "Staff ID to assign to",
        },
        owner_name: {
          type: "string",
          description: "Owner name (if ID not available)",
        },
        due_date: {
          type: "string",
          description: "Due date in YYYY-MM-DD format",
        },
        user_status: {
          type: "string",
          enum: [
            "draft",
            "assigned",
            "in_progress",
            "pending_review",
            "complete",
            "cancelled",
          ],
          description: "User progress status (default: draft)",
        },
        ai_status: {
          type: "string",
          enum: ["not_met", "partially_met", "met", "not_assessed"],
          description: "AI evidence validation (default: not_assessed)",
        },
        estimated_cost: {
          type: "number",
          description: "Estimated cost in pounds",
        },
        funding_source: {
          type: "string",
          enum: [
            "pupil_premium",
            "school_budget",
            "sports_premium",
            "catch_up_premium",
            "devolved_capital",
            "central_grant",
            "other",
          ],
          description: "Funding source",
        },
        financial_year: {
          type: "string",
          description: "Financial year (e.g., 2024-25)",
        },
        eef_strategy: {
          type: "string",
          description: "EEF strategy ID for research backing",
        },
        eef_impact_months: {
          type: "number",
          description: "Expected months to impact",
        },
      },
      required: ["organization_id", "title"],
    },
  },
  {
    name: "update_action",
    description: "Update an existing action",
    parameters: {
      type: "object",
      properties: {
        action_id: {
          type: "string",
          description: "Action ID to update (required)",
        },
        title: {
          type: "string",
          description: "Action title",
        },
        description: {
          type: "string",
          description: "Description",
        },
        success_criteria: {
          type: "string",
          description: "Success criteria",
        },
        priority: {
          type: "string",
          enum: ["critical", "high", "medium", "low"],
          description: "Priority level",
        },
        owner_id: {
          type: "string",
          description: "Assign to staff ID",
        },
        owner_name: {
          type: "string",
          description: "Owner name",
        },
        due_date: {
          type: "string",
          description: "Due date in YYYY-MM-DD format",
        },
        user_status: {
          type: "string",
          enum: [
            "draft",
            "assigned",
            "in_progress",
            "pending_review",
            "complete",
            "cancelled",
          ],
          description: "User status",
        },
        ai_status: {
          type: "string",
          enum: ["not_met", "partially_met", "met", "not_assessed"],
          description: "AI assessment status",
        },
        ai_rationale: {
          type: "string",
          description: "Explanation for AI assessment",
        },
        actual_cost: {
          type: "number",
          description: "Actual cost spent",
        },
        implementation_date: {
          type: "string",
          description: "Implementation date in YYYY-MM-DD format",
        },
      },
      required: ["action_id"],
    },
  },
  {
    name: "list_actions",
    description: "List all actions with filtering options",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        user_status: {
          type: "string",
          enum: [
            "draft",
            "assigned",
            "in_progress",
            "pending_review",
            "complete",
            "cancelled",
          ],
          description: "Filter by user status",
        },
        ai_status: {
          type: "string",
          enum: ["not_met", "partially_met", "met", "not_assessed"],
          description: "Filter by AI status",
        },
        priority: {
          type: "string",
          enum: ["critical", "high", "medium", "low"],
          description: "Filter by priority",
        },
        owner_id: {
          type: "string",
          description: "Filter by owner",
        },
        framework_type: {
          type: "string",
          enum: ["ofsted", "siams"],
          description: "Filter by framework",
        },
        overdue_only: {
          type: "boolean",
          description: "Only show overdue actions",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "get_action_stats",
    description: "Get dashboard statistics for actions",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "suggest_eef_strategy",
    description:
      "Suggest EEF research-backed strategies based on action description",
    parameters: {
      type: "object",
      properties: {
        action_description: {
          type: "string",
          description:
            "Description of the action or improvement area (required)",
        },
        focus_area: {
          type: "string",
          enum: [
            "teaching",
            "learning",
            "behaviour",
            "attendance",
            "pastoral",
            "leadership",
          ],
          description: "Primary focus area",
        },
        budget_level: {
          type: "string",
          enum: ["£", "££", "£££", "££££", "£££££"],
          description: "Available budget level",
        },
      },
      required: ["action_description"],
    },
  },
  {
    name: "add_action_note",
    description: "Add a progress note to an action",
    parameters: {
      type: "object",
      properties: {
        action_id: {
          type: "string",
          description: "Action ID (required)",
        },
        content: {
          type: "string",
          description: "Note content (required)",
        },
        author: {
          type: "string",
          description: "Note author name",
        },
      },
      required: ["action_id", "content"],
    },
  },
];

// =====================================================
// ESTATES & COMPLIANCE SKILLS
// =====================================================

export const ESTATES_FUNCTION_SCHEMAS = [
  {
    name: "create_helpdesk_ticket",
    description:
      "Log a new maintenance or helpdesk ticket (e.g., repairs, leaks, broken equipment)",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        title: {
          type: "string",
          description: "Brief title of the issue (required)",
        },
        description: {
          type: "string",
          description: "Detailed description of the maintenance issue",
        },
        priority: {
          type: "string",
          enum: ["critical", "high", "medium", "low"],
          description: "Urgency of the repair (default: medium)",
        },
        location: {
          type: "string",
          description:
            "Building, room, or area where the issue is (plain text)",
        },
        location_id: {
          type: "string",
          description:
            "The unique ID of the location from estates_locations (preferred)",
        },
        compliance_domain: {
          type: "string",
          enum: [
            "fire",
            "water",
            "electrical",
            "gas",
            "asbestos",
            "structural",
            "security",
            "general",
          ],
          description: "Compliance domain this falls under",
        },
      },
      required: ["organization_id", "title"],
    },
  },
  {
    name: "update_helpdesk_ticket",
    description: "Update status, assignee, or notes for an existing ticket",
    parameters: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: "ID of the ticket to update (required)",
        },
        status: {
          type: "string",
          enum: ["open", "in_progress", "resolved", "closed", "cancelled"],
          description: "New status for the ticket",
        },
        assignee_id: {
          type: "string",
          description: "ID of the staff member or contractor assigned",
        },
        resolution_notes: {
          type: "string",
          description: "Notes explaining how the issue was resolved",
        },
      },
      required: ["ticket_id"],
    },
  },
  {
    name: "search_contractors",
    description:
      "Find contractors by service type (plumber, electrician, etc.) or name",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        service_type: {
          type: "string",
          description: "Type of trade or service (e.g., plumbing, roofing)",
        },
        search: {
          type: "string",
          description: "Search string for contractor name",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "check_contractor_accreditation",
    description:
      "Verify if a contractor has valid DBS or trade accreditations (IOSH, SafeContractor, etc.)",
    parameters: {
      type: "object",
      properties: {
        contractor_id: {
          type: "string",
          description: "Contractor ID to check (required)",
        },
        accreditation_type: {
          type: "string",
          description: "Specific accreditation to check (e.g., DBS)",
        },
      },
      required: ["contractor_id"],
    },
  },
  {
    name: "list_compliance_tasks",
    description:
      "List upcoming or overdue compliance tasks (fire checks, water testing, etc.)",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "overdue", "completed"],
          description: "Filter by task status",
        },
        domain: {
          type: "string",
          enum: [
            "fire",
            "water",
            "electrical",
            "gas",
            "asbestos",
            "security",
            "general",
          ],
          description: "Filter by compliance domain",
        },
        location_id: {
          type: "string",
          description: "Filter tasks for a specific location ID",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "search_knowledge",
    description:
      "Search the statutory compliance knowledge base for legislation, frequencies, and guidance",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'The topic or legislation to search for (e.g., "Legionella flushing frequency")',
        },
        domain: {
          type: "string",
          enum: [
            "estates",
            "hr",
            "safeguarding",
            "fire",
            "water",
            "asbestos",
            "electrical",
            "gas",
            "it",
            "send",
          ],
          description: "Optional domain to narrow the search",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "extract_estates_document",
    description:
      "Extract asset or compliance information from an uploaded document (PDF/Image) using vision/LLM",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        file_url: {
          type: "string",
          description: "URL of the uploaded document (required)",
        },
        document_type: {
          type: "string",
          enum: [
            "compliance_certificate",
            "asset_list",
            "invoice",
            "inspection_report",
          ],
          description: "The category of the document to aid extraction",
        },
      },
      required: ["organization_id", "file_url"],
    },
  },
  {
    name: "analyze_spatial_impact",
    description:
      "Analyze the impact of an issue or maintenance task on adjacent rooms/areas based on proximity",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        location_id: {
          type: "string",
          description: "Location ID of the source issue (required)",
        },
        issue_type: {
          type: "string",
          description:
            'Type of issue (e.g., "leak", "power failure", "boiler maintenance")',
        },
      },
      required: ["organization_id", "location_id"],
    },
  },
];

// =====================================================
// ESTATES SPATIAL, ENERGY & DATA VALIDATION SKILLS
// =====================================================

export const ESTATES_SPATIAL_FUNCTION_SCHEMAS = [
  {
    name: "get_floor_plan",
    description:
      "Get floor plan data with room list, asset counts, and overlay data for an organization",
    parameters: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Organization ID (required)",
        },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "get_location_details",
    description:
      "Get details for a specific room or location including assets, compliance status, and recent scans",
    parameters: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Organization ID (required)",
        },
        locationId: {
          type: "string",
          description: "Location/room ID to retrieve details for (required)",
        },
      },
      required: ["organizationId", "locationId"],
    },
  },
  {
    name: "get_energy_summary",
    description:
      "Get energy consumption summary including costs, carbon footprint, and detected anomalies for the organization",
    parameters: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Organization ID (required)",
        },
        period: {
          type: "string",
          enum: ["month", "quarter", "year"],
          description: "Time period for the summary (default: month)",
        },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "get_energy_anomalies",
    description:
      "List detected energy waste or anomalies such as overnight consumption spikes, heating left on, or unusual meter readings",
    parameters: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Organization ID (required)",
        },
        status: {
          type: "string",
          enum: ["detected", "investigating", "resolved"],
          description: "Filter by anomaly status",
        },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "log_qr_scan",
    description:
      "Log a QR code or NFC asset scan from a mobile inspection or ad-hoc check",
    parameters: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Organization ID (required)",
        },
        assetLocationId: {
          type: "string",
          description: "ID of the asset-location record being scanned",
        },
        scanType: {
          type: "string",
          enum: ["qr", "nfc", "manual"],
          description: "Type of scan performed",
        },
        scanContext: {
          type: "string",
          description:
            "Context of the scan (e.g., 'routine inspection', 'reported issue')",
        },
        result: {
          type: "string",
          enum: ["pass", "fail", "needs_attention"],
          description: "Outcome of the scan check",
        },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "get_validation_queue",
    description:
      "Get pending data validation items that need human review, such as extracted certificate dates, asset serial numbers, or compliance evidence",
    parameters: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Organization ID (required)",
        },
        documentType: {
          type: "string",
          enum: [
            "compliance_certificate",
            "asset_list",
            "invoice",
            "inspection_report",
          ],
          description: "Filter by document type",
        },
      },
      required: ["organizationId"],
    },
  },
];

// =====================================================
// INTELLIGENCE & DATA ANALYSIS SKILLS
// =====================================================

export const INTELLIGENCE_FUNCTION_SCHEMAS = [
  {
    name: "run_intelligence_analysis",
    description:
      "Run a full cross-referenced school intelligence analysis combining DfE data, pupil assessments, contextual factors, and cross-module signals with EEF research recommendations",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        urn: {
          type: "number",
          description: "School URN for DfE data lookup",
        },
        focus_areas: {
          type: "array",
          items: { type: "string" },
          description:
            "Areas to focus on: attendance, attainment, progress, behaviour, safeguarding, send, disadvantaged",
        },
        focus_year_groups: {
          type: "array",
          items: { type: "number" },
          description: "Specific year groups to analyse (e.g. [4, 5, 6])",
        },
        academic_year: {
          type: "number",
          description: "Academic year start (e.g. 2025 for 2025/26)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "get_cohort_journey",
    description:
      "Trace a specific year group backwards through time, showing what happened to them (COVID impact, staffing changes, curriculum changes) and DfE data at each stage",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        urn: {
          type: "number",
          description: "School URN for DfE data lookup",
        },
        current_year_group: {
          type: "number",
          description:
            "Current year group to trace (e.g. 6 for Year 6) (required)",
        },
        years_back: {
          type: "number",
          description: "How many years to trace back (default: 6)",
        },
      },
      required: ["organization_id", "current_year_group"],
    },
  },
  {
    name: "get_assessment_insights",
    description:
      "Get pupil assessment analysis results including attainment gaps (FSM/SEND/gender/PP), teacher assessment accuracy, and EEF intervention recommendations. All data is pseudonymised — no pupil names.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        import_id: {
          type: "string",
          description:
            "Specific import ID to get insights for (optional — defaults to latest)",
        },
        severity_filter: {
          type: "string",
          enum: ["critical", "high", "medium", "low"],
          description: "Filter insights by minimum severity",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "get_contextual_factors",
    description:
      "Get active contextual factors that may explain data patterns (COVID impact, staff turnover, curriculum changes, demographic shifts)",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        factor_type: {
          type: "string",
          enum: [
            "covid_lockdown",
            "staff_change",
            "curriculum_change",
            "demographic_shift",
            "building_work",
            "ofsted_inspection",
            "other",
          ],
          description: "Filter by factor type",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "get_dfe_trends",
    description:
      "Get multi-year DfE data trends for a school including attendance rates, KS2 results, census demographics, workforce data, and exclusion figures",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        urn: {
          type: "number",
          description: "School URN for DfE data lookup (required)",
        },
        years_back: {
          type: "number",
          description: "How many years of data to retrieve (default: 5)",
        },
        data_types: {
          type: "array",
          items: {
            type: "string",
            enum: ["attendance", "ks2", "census", "workforce", "exclusions"],
          },
          description: "Which data types to include (default: all)",
        },
      },
      required: ["organization_id", "urn"],
    },
  },
  {
    name: "get_cross_module_signals",
    description:
      "Get alerts from across Schoolgle modules (Estates, HR, Compliance, Governance) that may be affecting pupil outcomes — overdue tasks, safeguarding gaps, staff absence, building issues",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
      },
      required: ["organization_id"],
    },
  },
];

// =====================================================
// RISK MANAGEMENT SKILLS
// =====================================================

export const RISK_FUNCTION_SCHEMAS = [
  {
    name: "get_risk_register",
    description:
      "List risks from the school or trust risk register with optional filtering by status, category, or risk band",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        status: {
          type: "string",
          enum: ["open", "mitigated", "closed", "escalated"],
          description: "Filter by risk status",
        },
        category: {
          type: "string",
          enum: [
            "safeguarding",
            "financial",
            "governance",
            "operational",
            "estates",
            "hr_staffing",
            "educational_standards",
            "reputational",
            "legal_compliance",
            "cyber_data",
            "environmental",
            "strategic",
          ],
          description: "Filter by risk category",
        },
        band: {
          type: "string",
          enum: ["critical", "high", "medium", "low", "very_low"],
          description: "Filter by risk band (based on residual score)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "get_risk_heatmap",
    description:
      "Get the 5x5 likelihood x impact heat map matrix showing current distribution of all risks by residual score",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "recalculate_risk_scores",
    description:
      "Trigger dynamic recalculation of residual risk scores for all risks, factoring in overdue mitigations which increase residual scores",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "create_risk",
    description:
      "Create a new risk entry in the risk register with inherent likelihood and impact scores",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        title: {
          type: "string",
          description: "Short title for the risk (required)",
        },
        description: {
          type: "string",
          description:
            "Detailed description of the risk and its potential consequences (required)",
        },
        categories: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "safeguarding",
              "financial",
              "governance",
              "operational",
              "estates",
              "hr_staffing",
              "educational_standards",
              "reputational",
              "legal_compliance",
              "cyber_data",
              "environmental",
              "strategic",
            ],
          },
          description:
            "Risk categories this falls under (required, at least one)",
        },
        inherent_likelihood: {
          type: "number",
          minimum: 1,
          maximum: 5,
          description:
            "Inherent likelihood score 1-5 before any mitigations (required)",
        },
        inherent_impact: {
          type: "number",
          minimum: 1,
          maximum: 5,
          description:
            "Inherent impact score 1-5 before any mitigations (required)",
        },
      },
      required: [
        "organization_id",
        "title",
        "description",
        "categories",
        "inherent_likelihood",
        "inherent_impact",
      ],
    },
  },
  {
    name: "add_mitigation",
    description:
      "Add a mitigation or control to an existing risk. Mitigations reduce the residual risk score",
    parameters: {
      type: "object",
      properties: {
        risk_id: {
          type: "string",
          description: "ID of the risk to add a mitigation to (required)",
        },
        title: {
          type: "string",
          description: "Short title for the mitigation (required)",
        },
        mitigation_type: {
          type: "string",
          enum: ["treat", "tolerate", "transfer", "terminate"],
          description: "4T decision type for this mitigation (required)",
        },
        source_module: {
          type: "string",
          enum: [
            "estates",
            "hr",
            "compliance",
            "governance",
            "safeguarding",
            "finance",
            "manual",
          ],
          description: "Which Schoolgle module this mitigation originates from",
        },
        description: {
          type: "string",
          description: "Detailed description of the mitigation action",
        },
        owner_id: {
          type: "string",
          description: "Staff member ID responsible for this mitigation",
        },
        due_date: {
          type: "string",
          description: "Due date for completing this mitigation (YYYY-MM-DD)",
        },
      },
      required: ["risk_id", "title", "mitigation_type"],
    },
  },
  {
    name: "record_risk_decision",
    description:
      "Record a formal 4T risk decision (treat/tolerate/transfer/terminate) with rationale for the audit trail",
    parameters: {
      type: "object",
      properties: {
        risk_id: {
          type: "string",
          description: "ID of the risk the decision applies to (required)",
        },
        decision: {
          type: "string",
          enum: ["treat", "tolerate", "transfer", "terminate"],
          description: "The 4T decision (required)",
        },
        rationale: {
          type: "string",
          description:
            "Explanation of why this decision was made — recorded in the audit trail (required)",
        },
        decided_by: {
          type: "string",
          description: "Name or ID of the person making the decision",
        },
        review_date: {
          type: "string",
          description:
            "When this decision should next be reviewed (YYYY-MM-DD)",
        },
      },
      required: ["risk_id", "decision", "rationale"],
    },
  },
];

// =====================================================
// DOCUMENT PRODUCTION SKILLS
// =====================================================

export const DOCUMENT_FUNCTION_SCHEMAS = [
  {
    name: "list_document_templates",
    description:
      "Browse available document templates (letters, notices, reports, certificates) filtered by module or category. Use this to find the right template before generating a document.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        module: {
          type: "string",
          enum: [
            "hr",
            "governance",
            "estates",
            "compliance",
            "teaching_learning",
            "send",
            "finance",
            "general",
          ],
          description: "Filter templates by module",
        },
        category: {
          type: "string",
          description:
            "Filter by category (e.g., sickness, disciplinary, safeguarding, fire_safety)",
        },
        document_type: {
          type: "string",
          enum: [
            "letter",
            "notice",
            "report",
            "certificate",
            "newsletter",
            "minutes",
            "memo",
            "form",
            "invitation",
            "policy_extract",
          ],
          description: "Filter by document type",
        },
        search: {
          type: "string",
          description: "Search templates by name",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "generate_document",
    description:
      "Generate a document from a template with auto-resolved placeholders. The system automatically fills in school details, staff details, absence data, and meeting details from the database. You can also provide custom placeholder values.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        template_id: {
          type: "string",
          description: "Template ID to generate from (required)",
        },
        recipient_type: {
          type: "string",
          enum: ["staff", "parent", "governor", "contractor", "external"],
          description: "Type of recipient (required)",
        },
        recipient_name: {
          type: "string",
          description: "Full name of the recipient (required)",
        },
        recipient_id: {
          type: "string",
          description:
            "Staff or contractor ID for auto-resolving their details",
        },
        recipient_email: {
          type: "string",
          description: "Email address of the recipient",
        },
        context_type: {
          type: "string",
          description:
            "Context domain (e.g., sickness, meeting, estates, compliance)",
        },
        context_id: {
          type: "string",
          description: "Related record ID (meeting ID, absence ID, etc.)",
        },
        custom_values: {
          type: "object",
          description:
            "Additional placeholder values to merge (e.g., { meeting_date: '15 March 2026', custom_note: 'Please bring...' })",
        },
      },
      required: [
        "organization_id",
        "template_id",
        "recipient_type",
        "recipient_name",
      ],
    },
  },
  {
    name: "list_generated_documents",
    description:
      "List previously generated documents with filtering by module, status, or recipient. Useful for finding recent letters, checking document status, or reviewing what has been sent.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        module: {
          type: "string",
          enum: [
            "hr",
            "governance",
            "estates",
            "compliance",
            "teaching_learning",
            "send",
            "finance",
            "general",
          ],
          description: "Filter by module",
        },
        status: {
          type: "string",
          enum: [
            "draft",
            "pending_approval",
            "approved",
            "finalised",
            "sent",
            "delivered",
            "acknowledged",
          ],
          description: "Filter by document status",
        },
        search: {
          type: "string",
          description: "Search by subject or recipient name",
        },
        limit: {
          type: "number",
          description: "Number of results to return (default: 20)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "get_document",
    description:
      "Get full details of a specific generated document including its content, status, and delivery history",
    parameters: {
      type: "object",
      properties: {
        document_id: {
          type: "string",
          description: "ID of the generated document (required)",
        },
      },
      required: ["document_id"],
    },
  },
  {
    name: "send_document",
    description:
      "Send a finalised document via email. The document must be in 'finalised' status first. If the document is still a draft, advise the user to finalise it first via the Documents hub.",
    parameters: {
      type: "object",
      properties: {
        document_id: {
          type: "string",
          description: "ID of the document to send (required)",
        },
        email: {
          type: "string",
          description:
            "Override email address (uses document's recipient_email if not provided)",
        },
      },
      required: ["document_id"],
    },
  },
  {
    name: "generate_newsletter",
    description:
      "Generate a school newsletter with branded header, sections, and footer. Provide sections like headteacher message, safeguarding reminders, dates, celebrations, and notices. The system can auto-include attendance stats and upcoming diary dates from the database.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        title: {
          type: "string",
          description:
            "Newsletter title, e.g. 'Weekly Newsletter' or 'Spring Term Update' (required)",
        },
        week_ending: {
          type: "string",
          description:
            "Week ending date in YYYY-MM-DD format (defaults to today)",
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: [
                  "headteacher_message",
                  "safeguarding",
                  "dates",
                  "celebrations",
                  "curriculum",
                  "attendance",
                  "notices",
                  "pta",
                  "custom",
                ],
                description: "Section type",
              },
              title: {
                type: "string",
                description:
                  "Custom section title (optional, auto-generated from type)",
              },
              content: {
                type: "string",
                description: "Section content as HTML (required)",
              },
            },
            required: ["type", "content"],
          },
          description: "Newsletter sections (required, at least one)",
        },
        auto_include_attendance: {
          type: "boolean",
          description:
            "Automatically include this week's staff attendance statistics",
        },
        auto_include_dates: {
          type: "boolean",
          description:
            "Automatically include upcoming diary dates from meetings/events",
        },
      },
      required: ["organization_id", "title", "sections"],
    },
  },
];

// =====================================================
// COMBINED REGISTRY
// =====================================================

export const SCHOOL_FUNCTION_SCHEMAS = [
  ...STAFF_FUNCTION_SCHEMAS,
  ...ACTIONS_FUNCTION_SCHEMAS,
  ...ESTATES_FUNCTION_SCHEMAS,
  ...ESTATES_SPATIAL_FUNCTION_SCHEMAS,
  ...INTELLIGENCE_FUNCTION_SCHEMAS,
  ...RISK_FUNCTION_SCHEMAS,
  ...DOCUMENT_FUNCTION_SCHEMAS,
];

// Helper to get all function names
export function getStaffFunctionNames(): string[] {
  return STAFF_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getActionsFunctionNames(): string[] {
  return ACTIONS_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getEstatesFunctionNames(): string[] {
  return ESTATES_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getIntelligenceFunctionNames(): string[] {
  return INTELLIGENCE_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getEstatesSpatialFunctionNames(): string[] {
  return ESTATES_SPATIAL_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getRiskFunctionNames(): string[] {
  return RISK_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getDocumentFunctionNames(): string[] {
  return DOCUMENT_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getAllSchoolFunctionNames(): string[] {
  return SCHOOL_FUNCTION_SCHEMAS.map((f) => f.name);
}

// Helper to get function schema by name
export function getFunctionSchema(functionName: string) {
  return SCHOOL_FUNCTION_SCHEMAS.find((f) => f.name === functionName);
}

// Category helpers for skill routing
export const STAFF_FUNCTIONS = new Set(getStaffFunctionNames());
export const ACTIONS_FUNCTIONS = new Set(getActionsFunctionNames());
export const ESTATES_FUNCTIONS = new Set(getEstatesFunctionNames());
export const ESTATES_SPATIAL_FUNCTIONS = new Set(
  getEstatesSpatialFunctionNames(),
);
export const INTELLIGENCE_FUNCTIONS = new Set(getIntelligenceFunctionNames());
export const RISK_FUNCTIONS = new Set(getRiskFunctionNames());
export const DOCUMENT_FUNCTIONS = new Set(getDocumentFunctionNames());

export function getSkillForFunction(
  functionName: string,
):
  | "staff"
  | "actions"
  | "estates"
  | "intelligence"
  | "risk"
  | "documents"
  | null {
  if (STAFF_FUNCTIONS.has(functionName)) return "staff";
  if (ACTIONS_FUNCTIONS.has(functionName)) return "actions";
  if (ESTATES_FUNCTIONS.has(functionName)) return "estates";
  if (ESTATES_SPATIAL_FUNCTIONS.has(functionName)) return "estates";
  if (INTELLIGENCE_FUNCTIONS.has(functionName)) return "intelligence";
  if (RISK_FUNCTIONS.has(functionName)) return "risk";
  if (DOCUMENT_FUNCTIONS.has(functionName)) return "documents";
  return null;
}
