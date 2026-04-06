/**
 * Terry Taurus — Estate & H&S Specialist Tools
 *
 * PROPOSE → APPROVE mode: All write operations return proposals
 * that must be explicitly approved by the user before DB writes.
 */

export interface TerryProposal {
  proposal_id: string;
  tool: string;
  action: 'create' | 'update' | 'log' | 'assess';
  confidence: number; // 0-1
  summary: string;
  fields: Record<string, unknown>;
  risk_assessment?: {
    likelihood: number; // 1-5
    impact: number; // 1-5
    score: number; // 1-25
    reasoning: string;
    safeguarding_flag: boolean;
    register_entry_required: boolean; // score >= 15
  };
  regulatory_references: Array<{
    legislation: string;
    section: string;
    requirement_type: 'must' | 'should' | 'could';
  }>;
  created_at: string;
}

export interface TerryToolResult {
  type: 'proposal' | 'query_result';
  proposal?: TerryProposal;
  data?: unknown;
  message: string;
}

// Tool: create_ticket
export const CREATE_TICKET_TOOL = {
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
};

// Tool: update_ticket
export const UPDATE_TICKET_TOOL = {
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
    required: [
      'organization_id',
      'ticket_id',
      'update_description',
      'actor_name',
    ],
  },
};

// Tool: query_tickets (read-only, no approval needed)
export const QUERY_TICKETS_TOOL = {
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
};

// Tool: query_compliance (read-only, no approval needed)
export const QUERY_COMPLIANCE_TOOL = {
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
};

// Tool: log_compliance_check
export const LOG_COMPLIANCE_CHECK_TOOL = {
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
};

// Tool: assess_risk
export const ASSESS_RISK_TOOL = {
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
};

// All Terry tools
export const TERRY_TOOL_SCHEMAS = [
  CREATE_TICKET_TOOL,
  UPDATE_TICKET_TOOL,
  QUERY_TICKETS_TOOL,
  QUERY_COMPLIANCE_TOOL,
  LOG_COMPLIANCE_CHECK_TOOL,
  ASSESS_RISK_TOOL,
];

// Mapping: Terry tool name → underlying platform skill
export const TERRY_SKILL_MAP: Record<string, string> = {
  terry_create_ticket: 'create_helpdesk_ticket',
  terry_update_ticket: 'update_helpdesk_ticket',
  terry_query_tickets: 'list_compliance_tasks', // overloaded — handler does custom query
  terry_query_compliance: 'list_compliance_tasks',
  terry_log_compliance_check: 'log_compliance_check',
  terry_assess_risk: 'assess_risk',
};

// Write tools that require approval
export const TERRY_APPROVAL_REQUIRED = new Set([
  'terry_create_ticket',
  'terry_update_ticket',
  'terry_log_compliance_check',
  'terry_assess_risk',
]);

// Read-only tools that don't need approval
export const TERRY_READ_ONLY = new Set([
  'terry_query_tickets',
  'terry_query_compliance',
]);
