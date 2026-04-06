/**
 * Terry Taurus — Handler
 *
 * Processes Terry's tool calls:
 * - Write tools → generate a TerryProposal (no direct DB write)
 * - Read tools → query DB via Supabase service role and return data
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { TerryProposal, TerryToolResult, TERRY_APPROVAL_REQUIRED } from './tools';

// Generate a unique proposal ID
function generateProposalId(): string {
  return `tp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Handle a Terry tool call — returns a proposal for write ops or data for read ops
 */
export async function handleTerryToolCall(
  toolName: string,
  params: Record<string, unknown>,
): Promise<TerryToolResult> {
  if (TERRY_APPROVAL_REQUIRED.has(toolName)) {
    return createProposal(toolName, params);
  }
  return executeQuery(toolName, params);
}

function createProposal(toolName: string, params: Record<string, unknown>): TerryToolResult {
  const proposal: TerryProposal = {
    proposal_id: generateProposalId(),
    tool: toolName,
    action: getActionType(toolName),
    confidence: 0.85,
    summary: String(params.description || params.update_description || params.situation || ''),
    fields: extractFields(toolName, params),
    regulatory_references: [],
    created_at: new Date().toISOString(),
  };

  // Add risk assessment for create_ticket and assess_risk
  if (toolName === 'terry_create_ticket' || toolName === 'terry_assess_risk') {
    proposal.risk_assessment = {
      likelihood: 3,
      impact: 3,
      score: 9,
      reasoning: 'Initial assessment — pending user review',
      safeguarding_flag: detectSafeguarding(
        String(params.description || params.situation || ''),
      ),
      register_entry_required: false,
    };
  }

  return {
    type: 'proposal',
    proposal,
    message: `I've prepared a proposal for your review. Please check the details and approve, edit, or reject.`,
  };
}

function getActionType(toolName: string): 'create' | 'update' | 'log' | 'assess' {
  switch (toolName) {
    case 'terry_create_ticket':
      return 'create';
    case 'terry_update_ticket':
      return 'update';
    case 'terry_log_compliance_check':
      return 'log';
    case 'terry_assess_risk':
      return 'assess';
    default:
      return 'create';
  }
}

function extractFields(
  toolName: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  switch (toolName) {
    case 'terry_create_ticket':
      return {
        title: '',
        description: params.description,
        category: '',
        priority: 'medium',
        location: '',
        reported_by_name: params.reported_by_name,
        organization_id: params.organization_id,
        created_via: 'ed_chatbot',
        ticket_type: 'maintenance_reactive',
      };
    case 'terry_update_ticket':
      return {
        ticket_id: params.ticket_id,
        update_description: params.update_description,
        actor_name: params.actor_name,
        organization_id: params.organization_id,
        status: '',
        notes: '',
      };
    case 'terry_log_compliance_check':
      return {
        description: params.description,
        completed_by_name: params.completed_by_name,
        organization_id: params.organization_id,
        status: 'completed',
        pass_fail: 'pass',
        completed_date: new Date().toISOString(),
      };
    case 'terry_assess_risk':
      return {
        situation: params.situation,
        assessor_name: params.assessor_name,
        organization_id: params.organization_id,
      };
    default:
      return params as Record<string, unknown>;
  }
}

/** Detect safeguarding concerns from free text */
function detectSafeguarding(text: string): boolean {
  const safeguardingKeywords = [
    'child',
    'children',
    'pupil',
    'student',
    'playground',
    'safeguard',
    'dbs',
    'visitor',
    'stranger',
    'abuse',
    'injury to child',
    'unsupervised',
    'broken fence',
    'security',
    'gate',
    'lock',
    'cctv',
    'intruder',
  ];
  const lower = text.toLowerCase();
  return safeguardingKeywords.some((kw) => lower.includes(kw));
}

/**
 * Execute a read-only query — no approval needed
 */
async function executeQuery(
  toolName: string,
  params: Record<string, unknown>,
): Promise<TerryToolResult> {
  const supabase = createServiceRoleClient();
  const orgId = String(params.organization_id);

  if (toolName === 'terry_query_tickets') {
    let query = supabase
      .from('estates_helpdesk_tickets')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);

    const queryText = String(params.query || '').toLowerCase();

    if (queryText.includes('overdue')) {
      query = query.lt('due_date', new Date().toISOString().split('T')[0]);
      query = query.not('status', 'in', '("resolved","closed")');
    }
    if (queryText.includes('critical')) {
      query = query.eq('priority', 'critical');
    } else if (queryText.includes('high')) {
      query = query.eq('priority', 'high');
    }
    if (queryText.includes('open')) {
      query = query.in('status', ['open', 'assigned', 'in_progress']);
    }

    const { data, error } = await query;
    if (error) {
      return {
        type: 'query_result',
        message: `Error querying tickets: ${error.message}`,
        data: [],
      };
    }

    return {
      type: 'query_result',
      data: data || [],
      message: `Found ${data?.length || 0} ticket(s) matching your query.`,
    };
  }

  if (toolName === 'terry_query_compliance') {
    const { data, error } = await supabase
      .from('estates_compliance_instances')
      .select('*, compliance_check:compliance_check_id(*)')
      .eq('organization_id', orgId)
      .order('due_date', { ascending: true })
      .limit(20);

    if (error) {
      return {
        type: 'query_result',
        message: `Error querying compliance: ${error.message}`,
        data: [],
      };
    }

    return {
      type: 'query_result',
      data: data || [],
      message: `Found ${data?.length || 0} compliance record(s).`,
    };
  }

  return { type: 'query_result', message: 'Unknown query tool', data: [] };
}

/**
 * Execute an approved proposal — calls the underlying platform skill via /api/skills/invoke
 */
export async function executeApprovedProposal(
  proposal: TerryProposal,
  approvedBy: string,
  baseUrl?: string,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const effectiveBaseUrl =
    baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const skillParams = mapProposalToSkillParams(proposal);

  try {
    const response = await fetch(`${effectiveBaseUrl}/api/skills/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: getSkillName(proposal.tool),
        parameters: skillParams,
      }),
    });

    const result = await response.json();
    return { success: result.success, data: result.data, error: result.error };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function getSkillName(terryTool: string): string {
  const map: Record<string, string> = {
    terry_create_ticket: 'create_helpdesk_ticket',
    terry_update_ticket: 'update_helpdesk_ticket',
    terry_log_compliance_check: 'log_compliance_check',
    terry_assess_risk: 'assess_risk',
  };
  return map[terryTool] || terryTool;
}

function mapProposalToSkillParams(proposal: TerryProposal): Record<string, unknown> {
  const fields = proposal.fields;

  switch (proposal.tool) {
    case 'terry_create_ticket':
      return {
        organization_id: fields.organization_id,
        title: fields.title,
        description: fields.description,
        priority: fields.priority,
        location: fields.location,
        category: fields.category,
        created_via: 'ed_chatbot',
        ticket_type: fields.ticket_type,
        safeguarding_flag: proposal.risk_assessment?.safeguarding_flag || false,
        risk_score: proposal.risk_assessment?.score || 0,
      };
    case 'terry_update_ticket':
      return {
        ticket_id: fields.ticket_id,
        status: fields.status,
        resolution_notes: fields.notes || fields.update_description,
      };
    case 'terry_log_compliance_check':
      return {
        organization_id: fields.organization_id,
        status: 'completed',
        pass_fail: fields.pass_fail,
        completed_date: fields.completed_date,
        notes: fields.description,
      };
    case 'terry_assess_risk':
      return {
        organization_id: fields.organization_id,
        situation: fields.situation,
        likelihood: proposal.risk_assessment?.likelihood,
        impact: proposal.risk_assessment?.impact,
        score: proposal.risk_assessment?.score,
        reasoning: proposal.risk_assessment?.reasoning,
      };
    default:
      return fields as Record<string, unknown>;
  }
}
