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
  {
    name: "get_compliance_status",
    description:
      "Get overall compliance RAG status across all domains. Returns total checks, completed, overdue, and per-domain breakdown. No input needed — uses the authenticated user's organization.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (auto-populated from auth)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_overdue_checks",
    description:
      "List all overdue statutory compliance checks. Returns check name, domain, how many days overdue, and risk level. Optionally filter by compliance domain.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (auto-populated from auth)",
        },
        domain: {
          type: "string",
          enum: [
            "legionella",
            "fire",
            "asbestos",
            "electrical",
            "gas",
            "water",
            "mechanical",
            "lifts",
            "playground",
            "accessibility",
            "security",
            "coshh",
            "food_safety",
            "transport",
            "safeguarding",
            "seasonal",
          ],
          description: "Optional: filter by compliance domain",
        },
      },
      required: [],
    },
  },
  {
    name: "log_service_visit",
    description:
      "Log a contractor visit that serviced one or more assets. Records service_date, contractor, invoice reference, total cost, findings per asset, and allocates the cost across assets using a chosen strategy (equal_split/weighted_capacity/manual/invoice_line_item). Each asset gets its own next_service_due date. Use this when a user tells you about a completed service — the system will create a service_record + junction rows and update each asset's schedule.",
    parameters: {
      type: "object",
      properties: {
        organization_id: { type: "string", description: "Organization ID" },
        service_date: { type: "string", description: "Date work was done (YYYY-MM-DD)" },
        service_type: { type: "string", description: "e.g. 'Annual gas safety inspection'" },
        compliance_domain: {
          type: "string",
          description: "Compliance domain (gas/fire/electrical/legionella/etc)",
        },
        contractor_id: { type: "string", description: "Contractor UUID if known" },
        engineer_name: { type: "string", description: "Name of the engineer on site" },
        invoice_reference: { type: "string", description: "Invoice number" },
        certificate_reference: { type: "string", description: "Certificate number if issued" },
        total_cost: { type: "number", description: "Total invoice cost in GBP" },
        notes: { type: "string", description: "Free-form notes" },
        allocation_strategy: {
          type: "string",
          enum: ["equal_split", "weighted_capacity", "manual", "invoice_line_item"],
          description: "How to split the total_cost across assets. equal_split = divide evenly. weighted_capacity = weight by specifications.capacity_kw. manual = use individual cost_allocated per asset. invoice_line_item = each asset's cost_allocated is set from the invoice line.",
        },
        assets: {
          type: "array",
          description: "List of assets serviced in this visit",
          items: {
            type: "object",
            properties: {
              asset_id: { type: "string" },
              result: { type: "string", enum: ["pass", "fail", "advisory", "not_assessed"] },
              findings: { type: "string" },
              cost_allocated: { type: "number", description: "Manual allocation for this asset (only if strategy is manual or invoice_line_item)" },
              next_service_due: { type: "string", description: "YYYY-MM-DD — when this asset is next due" },
              remedial_cost_estimate: { type: "number" },
              remedial_actions: { type: "array", items: { type: "string" } },
            },
            required: ["asset_id"],
          },
        },
      },
      required: ["service_date", "service_type", "assets"],
    },
  },
  {
    name: "find_bundling_opportunities",
    description:
      "Find assets whose next service dates cluster closely enough that booking a single contractor visit would save callout fees compared to separate visits. Returns grouped recommendations per compliance domain with estimated savings. Use when a user asks 'when's my next boiler service?' or 'am I missing any scheduling savings?'",
    parameters: {
      type: "object",
      properties: {
        organization_id: { type: "string", description: "Organization ID" },
        window_days: {
          type: "number",
          description: "How many days forward/back counts as 'same visit' for bundling (default 90)",
        },
        callout_fee: {
          type: "number",
          description: "Typical callout fee per contractor visit, for savings calculation (default 100)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_asset_documentation",
    description:
      "List the user manuals, setup guides, data sheets, and troubleshooting guides attached to a specific asset. Use this BEFORE answering a question about how to use/configure/fix a piece of equipment — if the school has uploaded the actual product manual, you should reference it rather than guessing.",
    parameters: {
      type: "object",
      properties: {
        organization_id: { type: "string", description: "Organization ID" },
        asset_id: { type: "string", description: "Asset UUID (required)" },
      },
      required: ["asset_id"],
    },
  },
  {
    name: "read_asset_manual",
    description:
      "Read a specific user manual or documentation file attached to an asset and answer a specific question about it. Uses Gemini vision to parse the actual PDF. Call this when a user asks 'how do I...' or 'what does X do' or 'why is the light flashing' on a known asset — returns an answer grounded in the actual product documentation, not generic advice.",
    parameters: {
      type: "object",
      properties: {
        organization_id: { type: "string", description: "Organization ID" },
        evidence_id: { type: "string", description: "Evidence UUID of the manual (get this from get_asset_documentation)" },
        question: { type: "string", description: "The specific question to answer from the manual" },
      },
      required: ["evidence_id", "question"],
    },
  },
  {
    name: "get_asset_details",
    description:
      "Look up an asset by ID, code, or serial number. Returns full asset record including purchase info, warranty status, supplier contact, linked tickets, and compliance tasks. Use this whenever a user mentions a specific piece of equipment or when creating a ticket to check if the asset is under warranty.",
    parameters: {
      type: "object",
      properties: {
        organization_id: { type: "string", description: "Organization ID" },
        asset_id: { type: "string", description: "Asset UUID (preferred)" },
        asset_code: { type: "string", description: "Asset code like BOI-001 (alternative to asset_id)" },
        serial_number: { type: "string", description: "Serial number (alternative to asset_id)" },
      },
      required: [],
    },
  },
  {
    name: "check_asset_warranty",
    description:
      "Check if an asset is under warranty. Returns warranty status (active/expiring_soon/expired/none), days remaining, provider name, supplier contact details, and a recommended action. Use this BEFORE suggesting a school call a contractor — if the asset is under warranty, the original supplier should fix it for free.",
    parameters: {
      type: "object",
      properties: {
        organization_id: { type: "string", description: "Organization ID" },
        asset_id: { type: "string", description: "Asset UUID (required)" },
      },
      required: ["asset_id"],
    },
  },
  {
    name: "draft_warranty_claim_email",
    description:
      "Draft an email to an asset's warranty provider/supplier requesting service or repair under warranty. Returns a complete email body with asset details, invoice reference, and issue description. Requires user approval (PROPOSE flow) before sending — this skill does NOT actually send the email.",
    parameters: {
      type: "object",
      properties: {
        organization_id: { type: "string", description: "Organization ID" },
        asset_id: { type: "string", description: "Asset UUID (required)" },
        issue_description: { type: "string", description: "What's wrong with the asset" },
        urgency: {
          type: "string",
          enum: ["emergency", "urgent", "routine"],
          description: "How urgent is the repair",
        },
      },
      required: ["asset_id", "issue_description"],
    },
  },
  {
    name: "triage_estate_finding",
    description:
      "Classify an estates finding from a contractor report, condition survey, or compliance check into risk-led routing: task now, risk review, estate strategy, watchlist, or asset-only update. Use before turning report findings into work so serviceable end-of-life assets do not become panic tasks.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (auto-populated from auth)",
        },
        title: {
          type: "string",
          description: "Short finding title or asset name",
        },
        description: {
          type: "string",
          description: "Finding text from the report/survey",
        },
        estimated_cost: {
          type: "number",
          description: "Estimated cost in GBP if known",
        },
        result: {
          type: "string",
          enum: ["pass", "fail", "advisory", "not_assessed"],
          description: "Inspection result if known",
        },
        urgency: {
          type: "string",
          enum: ["emergency", "urgent", "routine", "monitor"],
          description: "Urgency stated by the report or user",
        },
        priority: {
          type: "string",
          enum: ["urgent", "essential", "desirable", "cosmetic"],
          description: "Condition survey priority if known",
        },
        condition_grade: {
          type: "string",
          enum: ["A", "B", "C", "D"],
          description: "Condition grade if known",
        },
        compliance_domain: {
          type: "string",
          description: "Domain such as gas, fire, electrical, legionella, roof, mechanical",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "create_estate_strategy_item",
    description:
      "Create a finance/trustee-facing estate strategy item from a risk-led finding. Defaults to the current three-year Estate Strategy if no plan_id is supplied. Use for capital pressures, serviceable end-of-life assets, and material estates risks that need budget planning rather than immediate helpdesk noise.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (auto-populated from auth)",
        },
        plan_id: {
          type: "string",
          description: "Optional strategic_plans.id. If omitted, the current estates strategy is found or created.",
        },
        title: {
          type: "string",
          description: "Short title of the strategy item",
        },
        description: {
          type: "string",
          description: "What needs doing and why",
        },
        estimated_cost: {
          type: "number",
          description: "Estimated cost in GBP",
        },
        year: {
          type: "number",
          description: "Planning year within the estate strategy, usually 1, 2, or 3",
        },
        risk_score: {
          type: "number",
          description: "Risk score for prioritisation. Use 1-25 if linked to risk register; triage 1-5 scores can be passed and will be recorded as provided.",
        },
        priority_band: {
          type: "string",
          enum: ["must", "should", "could", "wont"],
          description: "MoSCoW priority band if known",
        },
        is_statutory: {
          type: "boolean",
          description: "True if the work is required to meet a statutory duty",
        },
        risk_register_id: {
          type: "string",
          description: "Linked risk_register.id if a risk has already been created",
        },
        source_entity_id: {
          type: "string",
          description: "Source finding/report/check/asset identifier for traceability",
        },
        consequence_if_unfunded: {
          type: "string",
          description: "Plain-English consequence if finance/trustees do not fund the item",
        },
        cfr_code: {
          type: "string",
          enum: ["E12", "E13", "E16", "E18"],
          description: "Likely CFR budget code: E12 maintenance, E13 improvement, E16 energy, E18 other premises",
        },
      },
      required: ["title", "estimated_cost", "year"],
    },
  },
  {
    name: "create_cost_request",
    description:
      "Create a cost/budget request for estates work that needs financial approval. For strategic/capital planning, prefer create_estate_strategy_item so the item lands in the separate finance-facing estate strategy. Requires user confirmation before submission.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (auto-populated from auth)",
        },
        title: {
          type: "string",
          description: "Brief title of the work required (e.g., 'Boiler replacement Block A')",
        },
        description: {
          type: "string",
          description: "Detailed description of what's needed and why",
        },
        estimated_cost: {
          type: "number",
          description: "Estimated cost in GBP",
        },
        urgency: {
          type: "string",
          enum: ["emergency", "urgent", "planned", "strategic"],
          description: "How urgent: emergency (immediate safety), urgent (this term), planned (this year), strategic (5-year plan)",
        },
        classification: {
          type: "string",
          enum: ["statutory", "good_practice", "improvement"],
          description: "Statutory = legal requirement, good_practice = recommended, improvement = enhancement",
        },
        compliance_domain: {
          type: "string",
          enum: [
            "legionella",
            "fire",
            "asbestos",
            "electrical",
            "gas",
            "water",
            "mechanical",
            "lifts",
            "playground",
            "general",
          ],
          description: "Which compliance domain this cost relates to",
        },
        cfr_code: {
          type: "string",
          enum: ["E04", "E12", "E13", "E14", "E15", "E16", "E17", "E18"],
          description: "CFR code: E04=premises staff, E12=maintenance, E13=improvement, E14=insurance, E15=rates, E16=energy, E17=catering, E18=other premises",
        },
        business_case: {
          type: "string",
          description: "Business case justification — why this spend is necessary, what happens if deferred",
        },
        linked_risk_id: {
          type: "string",
          description: "Optional: ID of linked risk register entry",
        },
      },
      required: ["title", "estimated_cost", "urgency", "classification"],
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
// MIS INTELLIGENCE & DATA ANALYSIS SKILLS
// =====================================================

export const MIS_INTELLIGENCE_FUNCTION_SCHEMAS = [
  {
    name: "detect_teacher_performance_patterns",
    description:
      "Analyze teacher performance across year groups and academic years to identify consistent over or underperformance patterns",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        academic_year: {
          type: "number",
          description: "Academic year start (e.g. 2025 for 2025/26)",
        },
        subject: {
          type: "string",
          description: "Filter by subject (e.g. maths, reading, writing)",
        },
        staff_id: {
          type: "string",
          description: "Filter to a specific staff member",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "detect_teacher_assessment_inflation",
    description:
      "Compare teacher assessment grades against standardised test scores to identify potential inflation or deflation",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        academic_year: {
          type: "number",
          description: "Academic year start (e.g. 2025 for 2025/26)",
        },
        year_group: {
          type: "number",
          description: "Filter by year group (e.g. 6 for Year 6)",
        },
        subject: {
          type: "string",
          description: "Filter by subject (e.g. maths, reading, writing)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "detect_declining_pupils",
    description:
      "Identify pupils whose attainment is gradually declining, especially those not on any intervention list",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        year_group: {
          type: "number",
          description: "Filter by year group",
        },
        subject: {
          type: "string",
          description: "Filter by subject",
        },
        minimum_decline_points: {
          type: "number",
          description:
            "Minimum number of data points showing decline before flagging (default: 2)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "detect_pupil_strength_change",
    description:
      "Find SEN/EHCP/PP pupils making exceptional progress as evidence for reports",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        year_group: {
          type: "number",
          description: "Filter by year group",
        },
        pupil_group: {
          type: "string",
          enum: ["sen", "ehcp", "pp", "fsm", "eal", "lac", "all"],
          description: "Pupil group to analyse (default: all)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "detect_cohort_anomaly",
    description:
      "Find year groups performing below school norm and cross-reference with supply cover and absence data",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        academic_year: {
          type: "number",
          description: "Academic year start (e.g. 2025 for 2025/26)",
        },
        subject: {
          type: "string",
          description: "Filter by subject",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "detect_pp_gap_trend",
    description:
      "Track Pupil Premium attainment gap trends across subjects and year groups",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        year_group: {
          type: "number",
          description: "Filter by year group",
        },
        subject: {
          type: "string",
          description: "Filter by subject",
        },
        years_back: {
          type: "number",
          description: "How many years of trend data to include (default: 3)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "detect_gender_gap",
    description:
      "Identify significant gender attainment gaps by subject and year group",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        year_group: {
          type: "number",
          description: "Filter by year group",
        },
        subject: {
          type: "string",
          description: "Filter by subject",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "detect_sen_progress",
    description:
      "Track whether SEN pupils are making expected progress from their own baselines",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        year_group: {
          type: "number",
          description: "Filter by year group",
        },
        sen_type: {
          type: "string",
          enum: ["sen_support", "ehcp", "all"],
          description: "Type of SEN provision to filter (default: all)",
        },
        subject: {
          type: "string",
          description: "Filter by subject",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "correlate_attendance_attainment",
    description:
      "Show the relationship between attendance bands and academic outcomes",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        year_group: {
          type: "number",
          description: "Filter by year group",
        },
        subject: {
          type: "string",
          description: "Filter by subject",
        },
        attendance_bands: {
          type: "array",
          items: { type: "string" },
          description:
            "Custom attendance bands (default: ['95-100', '90-95', '85-90', '80-85', 'below-80'])",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "detect_bradford_factor_alerts",
    description:
      "Calculate Bradford Factor for all staff and flag those exceeding thresholds",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        threshold: {
          type: "number",
          description: "Bradford Factor threshold to flag (default: 200)",
        },
        staff_id: {
          type: "string",
          description: "Filter to a specific staff member",
        },
        period_months: {
          type: "number",
          description:
            "Rolling period in months to calculate over (default: 12)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "detect_staff_absence_impact",
    description:
      "Correlate staff absence periods with pupil outcome dips and behaviour spikes",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        staff_id: {
          type: "string",
          description: "Filter to a specific staff member",
        },
        year_group: {
          type: "number",
          description: "Filter by year group",
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
    name: "run_ofsted_readiness_scan",
    description:
      "Run a comprehensive Ofsted-lens analysis across all data with RAG ratings",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        focus_areas: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "quality_of_education",
              "behaviour_and_attitudes",
              "personal_development",
              "leadership_and_management",
              "safeguarding",
            ],
          },
          description: "Ofsted key judgement areas to focus on (default: all)",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "generate_governor_report_data",
    description:
      "Generate data for a termly governor report pack from all sources",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        term: {
          type: "string",
          enum: ["autumn", "spring", "summer"],
          description: "Which term the report covers",
        },
        academic_year: {
          type: "number",
          description: "Academic year start (e.g. 2025 for 2025/26)",
        },
        sections: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "attendance",
              "attainment",
              "progress",
              "behaviour",
              "safeguarding",
              "staffing",
              "finance",
              "estates",
              "send",
              "pupil_premium",
            ],
          },
          description: "Report sections to include (default: all)",
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
// WORKFLOW SKILLS
// =====================================================

export const WORKFLOW_FUNCTION_SCHEMAS = [
  {
    name: "create_workflow",
    description:
      "Create a workflow from a template (e.g. equipment-inspection-failure, incident-response) or freeform. Workflows have phases containing ordered steps with role assignments, deadlines, and evidence requirements.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        template_slug: {
          type: "string",
          description:
            "Template to create from, e.g. 'equipment-inspection-failure', 'incident-response', 'new-starter-onboarding' (required)",
        },
        title: {
          type: "string",
          description: "Custom title for this workflow instance",
        },
        description: {
          type: "string",
          description: "Additional context or notes about this workflow",
        },
        trigger_type: {
          type: "string",
          enum: ["manual", "inspection_failure", "incident", "maintenance"],
          description: "What triggered this workflow",
        },
        trigger_source_id: {
          type: "string",
          description:
            "ID of the source record that triggered this workflow (e.g. inspection finding ID, helpdesk ticket ID)",
        },
        owner_name: {
          type: "string",
          description:
            "Name of the person responsible for overseeing this workflow",
        },
        owner_role: {
          type: "string",
          description:
            "Role of the workflow owner (e.g. site_manager, headteacher)",
        },
      },
      required: ["organization_id", "template_slug"],
    },
  },
  {
    name: "get_workflow_status",
    description:
      "Get full workflow detail including all phases, steps, completion progress, blockers, and next actionable steps. Use this to brief the user on where a workflow stands.",
    parameters: {
      type: "object",
      properties: {
        workflow_id: {
          type: "string",
          description: "Workflow ID (required)",
        },
      },
      required: ["workflow_id"],
    },
  },
  {
    name: "update_workflow_step",
    description:
      "Mark a workflow step as done, in_progress, blocked, or skipped. Optionally attach completion notes and evidence (photos, documents, external references).",
    parameters: {
      type: "object",
      properties: {
        workflow_id: {
          type: "string",
          description: "Workflow ID (required)",
        },
        step_id: {
          type: "string",
          description: "Step ID to update (required)",
        },
        status: {
          type: "string",
          enum: [
            "todo",
            "in_progress",
            "done",
            "blocked",
            "skipped",
            "waiting_external",
          ],
          description: "New status for this step (required)",
        },
        completion_notes: {
          type: "string",
          description:
            "Notes about what was done or why it was blocked/skipped",
        },
        completion_evidence: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                description: "Evidence type (e.g. photo, document, link)",
              },
              url: {
                type: "string",
                description: "URL or file path of the evidence",
              },
              id: {
                type: "string",
                description: "ID of the evidence record if stored internally",
              },
            },
          },
          description: "Evidence attached to this step completion",
        },
        external_reference: {
          type: "string",
          description:
            "External reference number (e.g. contractor invoice, purchase order)",
        },
      },
      required: ["workflow_id", "step_id", "status"],
    },
  },
  {
    name: "get_my_workflow_tasks",
    description:
      "Get all workflow steps assigned to the current user's role that are ready to action. Returns tasks across all active workflows, sorted by urgency.",
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
    name: "advance_workflow",
    description:
      "Check if the current phase is complete and advance to the next phase. Also recalculates overall workflow progress percentage.",
    parameters: {
      type: "object",
      properties: {
        workflow_id: {
          type: "string",
          description: "Workflow ID (required)",
        },
      },
      required: ["workflow_id"],
    },
  },
  {
    name: "create_procurement_request",
    description:
      "Create a procurement/quote tracking request, optionally linked to a workflow step. Tracks estimated cost, budget line, required quotes, and approval status.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        workflow_id: {
          type: "string",
          description: "Workflow ID this procurement is linked to",
        },
        workflow_step_id: {
          type: "string",
          description: "Workflow step ID this procurement fulfils",
        },
        title: {
          type: "string",
          description: "Title of the procurement request (required)",
        },
        description: {
          type: "string",
          description: "Detailed description of what is being procured",
        },
        category: {
          type: "string",
          enum: ["equipment", "maintenance", "supplies", "service"],
          description: "Procurement category",
        },
        estimated_amount: {
          type: "number",
          description: "Estimated cost in GBP",
        },
        budget_line_cfr: {
          type: "string",
          description: "CFR budget line code this spend falls under",
        },
        quotes_required: {
          type: "number",
          description: "Number of quotes required (default: 3)",
        },
      },
      required: ["organization_id", "title"],
    },
  },
];

// =====================================================
// INCIDENT REPORTING SKILLS
// =====================================================

export const INCIDENT_FUNCTION_SCHEMAS = [
  {
    name: "report_incident",
    description:
      "Report a health & safety incident, near miss, or dangerous occurrence. RIDDOR-compliant. Auto-creates a risk register entry for major/critical incidents. Required: incident_type, severity, incident_date, location, title, description.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        incident_type: {
          type: "string",
          enum: [
            "accident",
            "near_miss",
            "dangerous_occurrence",
            "violence",
            "ill_health",
            "fire",
            "security",
            "environmental",
            "other",
          ],
          description: "Type of incident (required)",
        },
        severity: {
          type: "string",
          enum: ["minor", "moderate", "major", "critical"],
          description:
            "Severity level. Major/critical auto-creates risk register entry (required)",
        },
        incident_date: {
          type: "string",
          description: "Date of incident in YYYY-MM-DD format (required)",
        },
        incident_time: {
          type: "string",
          description: "Time of incident in HH:MM format",
        },
        location: {
          type: "string",
          description: "Where the incident occurred (required)",
        },
        location_detail: {
          type: "string",
          description: "Specific location detail",
        },
        injured_person_name: {
          type: "string",
          description: "Name of injured person (if any)",
        },
        injured_person_type: {
          type: "string",
          enum: ["pupil", "staff", "visitor", "contractor", "other"],
          description: "Type of person injured",
        },
        title: {
          type: "string",
          description: "Brief summary title (required)",
        },
        description: {
          type: "string",
          description: "Full description of what happened (required)",
        },
        immediate_actions: {
          type: "string",
          description: "What was done immediately after the incident",
        },
        first_aid_given: {
          type: "boolean",
          description: "Was first aid administered?",
        },
        hospital_attendance: {
          type: "boolean",
          description: "Did the person attend hospital?",
        },
        is_riddor_reportable: {
          type: "boolean",
          description:
            "Is this RIDDOR reportable? (deaths, specified injuries, >7 day incapacitation, dangerous occurrences)",
        },
        riddor_category: {
          type: "string",
          enum: [
            "death",
            "specified_injury",
            "over_7_day",
            "non_fatal_non_worker",
            "dangerous_occurrence",
            "occupational_disease",
          ],
          description: "RIDDOR reporting category (if reportable)",
        },
        investigation_required: {
          type: "boolean",
          description: "Does this incident require formal investigation?",
        },
        reported_by_name: {
          type: "string",
          description: "Name of the person reporting",
        },
      },
      required: [
        "organization_id",
        "incident_type",
        "severity",
        "incident_date",
        "location",
        "title",
        "description",
      ],
    },
  },
  {
    name: "get_incidents",
    description:
      "List incidents and near-misses for the school. Returns summary statistics (by severity, type, RIDDOR status) plus incident list. Can filter by status, type, severity, or RIDDOR reportable.",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID (required)",
        },
        status: {
          type: "string",
          enum: [
            "open",
            "investigating",
            "awaiting_riddor",
            "closed",
            "closed_no_action",
          ],
          description: "Filter by status",
        },
        incident_type: {
          type: "string",
          description: "Filter by incident type",
        },
        severity: {
          type: "string",
          enum: ["minor", "moderate", "major", "critical"],
          description: "Filter by severity",
        },
        riddor_only: {
          type: "boolean",
          description: "Only show RIDDOR reportable incidents",
        },
      },
      required: ["organization_id"],
    },
  },
  {
    name: "update_incident",
    description:
      "Update an existing incident — change status, add investigation notes, record RIDDOR reference, add corrective actions, or close the incident.",
    parameters: {
      type: "object",
      properties: {
        incident_id: {
          type: "string",
          description: "Incident ID to update (required)",
        },
        status: {
          type: "string",
          enum: [
            "open",
            "investigating",
            "awaiting_riddor",
            "closed",
            "closed_no_action",
          ],
          description: "New status",
        },
        investigation_notes: {
          type: "string",
          description: "Investigation findings or notes",
        },
        root_cause: {
          type: "string",
          description: "Identified root cause",
        },
        riddor_reference: {
          type: "string",
          description: "HSE reference number once RIDDOR report filed",
        },
        riddor_reported_date: {
          type: "string",
          description: "Date RIDDOR was reported (YYYY-MM-DD)",
        },
        closure_notes: {
          type: "string",
          description: "Notes for closing the incident",
        },
        corrective_actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              assigned_to: { type: "string" },
              due_date: { type: "string" },
              status: {
                type: "string",
                enum: ["pending", "in_progress", "completed"],
              },
            },
          },
          description: "Corrective actions to add/replace",
        },
      },
      required: ["incident_id"],
    },
  },
];

// =====================================================
// COMBINED REGISTRY
// =====================================================

// =====================================================
// SOP (STANDARD OPERATING PROCEDURE) SKILLS
// =====================================================

export const SOP_FUNCTION_SCHEMAS = [
  {
    name: "start_sop",
    description:
      "Start a Standard Operating Procedure (SOP) run from a template. Returns the created run with step-by-step checklist. Use when user reports an incident, needs to follow a procedure, or asks about H&S checklists.",
    parameters: {
      type: "object",
      properties: {
        template_id: {
          type: "string",
          description:
            "SOP template ID. Available: incident_response, riddor_assessment, incident_investigation, near_miss_recording, violence_response, dangerous_occurrence, active_incident_check, fire_door_check, premises_monthly, website_compliance, governor_pack_prep",
        },
        context: {
          type: "string",
          description:
            "Context for this run, e.g. 'Playground fall incident 2026-03-12' or 'Monthly premises check March 2026'",
        },
        linked_incident_id: {
          type: "string",
          description:
            "UUID of linked incident report (if triggered by incident)",
        },
        linked_module: {
          type: "string",
          description:
            "Module that triggered this SOP: incidents, estates, compliance, safeguarding",
        },
        linked_entity_id: {
          type: "string",
          description: "UUID of the linked entity in the triggering module",
        },
      },
      required: ["template_id"],
    },
  },
  {
    name: "get_sop_status",
    description:
      "Get the current status and progress of an active SOP run. Shows completed steps, next step, and overall progress percentage.",
    parameters: {
      type: "object",
      properties: {
        run_id: {
          type: "string",
          description: "UUID of the SOP run to check",
        },
      },
      required: ["run_id"],
    },
  },
  {
    name: "update_sop_step",
    description:
      "Mark a step in an active SOP run as done, skipped, or blocked. Can include notes and evidence references.",
    parameters: {
      type: "object",
      properties: {
        run_id: {
          type: "string",
          description: "UUID of the SOP run",
        },
        step_id: {
          type: "string",
          description:
            "ID of the step to update (e.g. 'review_detection', 'verify_cordon')",
        },
        status: {
          type: "string",
          enum: ["done", "skipped", "blocked"],
          description: "New status for the step",
        },
        notes: {
          type: "string",
          description: "Notes or observations for this step",
        },
      },
      required: ["run_id", "step_id", "status"],
    },
  },
  {
    name: "get_sop_templates",
    description:
      "List available SOP templates, optionally filtered by category. Categories: h_and_s, estates, safeguarding, compliance, governance, finance, hr.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: [
            "h_and_s",
            "estates",
            "safeguarding",
            "compliance",
            "governance",
            "finance",
            "hr",
          ],
          description: "Filter templates by category",
        },
      },
    },
  },
  {
    name: "get_my_sop_runs",
    description:
      "Get all active SOP runs for the current organization. Shows in-progress procedures with progress percentage.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["in_progress", "completed", "abandoned"],
          description: "Filter by run status. Default: in_progress",
        },
        linked_module: {
          type: "string",
          description: "Filter by linked module (e.g. 'incidents')",
        },
      },
    },
  },
  {
    name: "suggest_sops_for_incident",
    description:
      "Given incident details, suggest which SOP templates should be triggered. Returns recommended templates with reasons.",
    parameters: {
      type: "object",
      properties: {
        incident_type: {
          type: "string",
          enum: [
            "accident",
            "near_miss",
            "dangerous_occurrence",
            "violence",
            "ill_health",
            "fire",
            "security",
            "environmental",
            "other",
          ],
          description: "Type of incident",
        },
        severity: {
          type: "string",
          enum: ["minor", "moderate", "major", "critical"],
          description: "Incident severity",
        },
        is_riddor_reportable: {
          type: "boolean",
          description: "Whether the incident is RIDDOR reportable",
        },
        investigation_required: {
          type: "boolean",
          description: "Whether investigation is required",
        },
      },
      required: ["incident_type", "severity"],
    },
  },
];

// =====================================================
// TERRY TAURUS TOOLS (Estates PROPOSE → APPROVE mode)
// =====================================================

export const TERRY_FUNCTION_SCHEMAS = [
  {
    name: 'terry_create_ticket',
    description:
      'Create an estate/maintenance ticket from a natural language description. Terry extracts structured fields, performs risk assessment, and returns a PROPOSAL for user approval. Does NOT write to DB until approved.',
    parameters: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization ID' },
        description: {
          type: 'string',
          description:
            'Natural language description of the issue (e.g. "The fence in Year 3 playground is broken")',
        },
        reported_by_name: {
          type: 'string',
          description: 'Name of the person reporting the issue',
        },
      },
      required: ['organization_id', 'description', 'reported_by_name'],
    },
  },
  {
    name: 'terry_update_ticket',
    description:
      'Update an existing estate ticket from natural language. Terry proposes status changes, updated notes, and risk re-assessment. Returns a PROPOSAL for user approval.',
    parameters: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization ID' },
        ticket_id: {
          type: 'string',
          description: 'Ticket ID or ticket number to update',
        },
        update_description: {
          type: 'string',
          description:
            'Natural language update (e.g. "Dave put up temporary barriers around the fence")',
        },
        actor_name: {
          type: 'string',
          description: 'Name of person providing the update',
        },
      },
      required: ['organization_id', 'ticket_id', 'update_description', 'actor_name'],
    },
  },
  {
    name: 'terry_query_tickets',
    description:
      "Query estate tickets using natural language. Returns prioritised, risk-weighted list. Read-only — no approval needed.",
    parameters: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization ID' },
        query: {
          type: 'string',
          description:
            "Natural language query (e.g. \"What's overdue this week?\", \"Show me all critical tickets\")",
        },
      },
      required: ['organization_id', 'query'],
    },
  },
  {
    name: 'terry_query_compliance',
    description:
      'Query compliance status using natural language. Returns compliance check status from compliance_instances. Read-only — no approval needed.',
    parameters: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization ID' },
        query: {
          type: 'string',
          description:
            'Natural language query (e.g. "When is our next fire risk assessment?", "How compliant are we?")',
        },
      },
      required: ['organization_id', 'query'],
    },
  },
  {
    name: 'terry_log_compliance_check',
    description:
      'Log a completed compliance check from natural language. Terry proposes a check completion record with pre-filled fields. Returns a PROPOSAL for user approval.',
    parameters: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization ID' },
        description: {
          type: 'string',
          description:
            'Natural language description (e.g. "We did the weekly fire alarm test today, all clear")',
        },
        completed_by_name: {
          type: 'string',
          description: 'Name of person who completed the check',
        },
      },
      required: ['organization_id', 'description', 'completed_by_name'],
    },
  },
  {
    name: 'terry_assess_risk',
    description:
      'Perform a 5×5 risk assessment from a situation description. Terry proposes likelihood × impact scoring with reasoning. If score >= 15, suggests risk register entry. Returns a PROPOSAL for user approval — their name is logged against the assessment.',
    parameters: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization ID' },
        situation: {
          type: 'string',
          description: 'Description of the situation to assess',
        },
        assessor_name: {
          type: 'string',
          description: 'Name of the person who will own this risk assessment',
        },
      },
      required: ['organization_id', 'situation', 'assessor_name'],
    },
  },
];

export const SCHOOL_FUNCTION_SCHEMAS = [
  ...STAFF_FUNCTION_SCHEMAS,
  ...ACTIONS_FUNCTION_SCHEMAS,
  ...ESTATES_FUNCTION_SCHEMAS,
  ...ESTATES_SPATIAL_FUNCTION_SCHEMAS,
  ...INTELLIGENCE_FUNCTION_SCHEMAS,
  ...MIS_INTELLIGENCE_FUNCTION_SCHEMAS,
  ...RISK_FUNCTION_SCHEMAS,
  ...DOCUMENT_FUNCTION_SCHEMAS,
  ...WORKFLOW_FUNCTION_SCHEMAS,
  ...INCIDENT_FUNCTION_SCHEMAS,
  ...SOP_FUNCTION_SCHEMAS,
  ...TERRY_FUNCTION_SCHEMAS,
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

export function getMisIntelligenceFunctionNames(): string[] {
  return MIS_INTELLIGENCE_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getDocumentFunctionNames(): string[] {
  return DOCUMENT_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getWorkflowFunctionNames(): string[] {
  return WORKFLOW_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getIncidentFunctionNames(): string[] {
  return INCIDENT_FUNCTION_SCHEMAS.map((f) => f.name);
}

export function getSopFunctionNames(): string[] {
  return SOP_FUNCTION_SCHEMAS.map((f) => f.name);
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
export const MIS_INTELLIGENCE_FUNCTIONS = new Set(
  getMisIntelligenceFunctionNames(),
);
export const RISK_FUNCTIONS = new Set(getRiskFunctionNames());
export const DOCUMENT_FUNCTIONS = new Set(getDocumentFunctionNames());
export const WORKFLOW_FUNCTIONS = new Set(getWorkflowFunctionNames());
export const INCIDENT_FUNCTIONS = new Set(getIncidentFunctionNames());
export const SOP_FUNCTIONS = new Set(getSopFunctionNames());

// =====================================================
// GOOGLE DRIVE SKILLS
// =====================================================

export const GDRIVE_FUNCTION_SCHEMAS = [
  {
    name: "upload_to_drive",
    description: "Upload a file to the school's Google Drive",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID",
        },
        file_name: {
          type: "string",
          description: "Name of the file to upload",
        },
        content: {
          type: "string",
          description: "Text content of the file",
        },
        mime_type: {
          type: "string",
          description: "MIME type (default: text/plain)",
        },
        folder_id: {
          type: "string",
          description: "Google Drive folder ID to upload to (optional)",
        },
      },
      required: ["organization_id", "file_name", "content"],
    },
  },
  {
    name: "create_drive_folder",
    description: "Create a folder in the school's Google Drive",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID",
        },
        folder_name: {
          type: "string",
          description: "Name of the folder to create",
        },
        parent_folder_id: {
          type: "string",
          description: "Parent folder ID (optional, defaults to root)",
        },
      },
      required: ["organization_id", "folder_name"],
    },
  },
  {
    name: "list_drive_files",
    description: "List files in a Google Drive folder",
    parameters: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "Organization ID",
        },
        folder_id: {
          type: "string",
          description: "Folder ID to list (default: root)",
        },
      },
      required: ["organization_id"],
    },
  },
];

export function getGdriveFunctionNames(): string[] {
  return GDRIVE_FUNCTION_SCHEMAS.map((f) => f.name);
}

export const GDRIVE_FUNCTIONS = new Set(getGdriveFunctionNames());

export function getSkillForFunction(
  functionName: string,
):
  | "staff"
  | "actions"
  | "estates"
  | "intelligence"
  | "mis-intelligence"
  | "risk"
  | "documents"
  | "workflow"
  | "incidents"
  | "sops"
  | "gdrive"
  | null {
  if (STAFF_FUNCTIONS.has(functionName)) return "staff";
  if (ACTIONS_FUNCTIONS.has(functionName)) return "actions";
  if (ESTATES_FUNCTIONS.has(functionName)) return "estates";
  if (ESTATES_SPATIAL_FUNCTIONS.has(functionName)) return "estates";
  if (INTELLIGENCE_FUNCTIONS.has(functionName)) return "intelligence";
  if (MIS_INTELLIGENCE_FUNCTIONS.has(functionName)) return "mis-intelligence";
  if (RISK_FUNCTIONS.has(functionName)) return "risk";
  if (DOCUMENT_FUNCTIONS.has(functionName)) return "documents";
  if (WORKFLOW_FUNCTIONS.has(functionName)) return "workflow";
  if (INCIDENT_FUNCTIONS.has(functionName)) return "incidents";
  if (SOP_FUNCTIONS.has(functionName)) return "sops";
  if (GDRIVE_FUNCTIONS.has(functionName)) return "gdrive";
  return null;
}
