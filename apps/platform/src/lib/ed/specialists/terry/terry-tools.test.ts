/**
 * Terry Taurus — Estate Specialist Tools Tests
 *
 * Tests tools.ts (schemas, sets, TerryProposal typing) and
 * handler.ts (proposal generation, safeguarding detection, field extraction).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Supabase before importing handler (which imports supabase-server)
// ---------------------------------------------------------------------------

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: vi.fn(() => mockSupabase),
}));

// ---------------------------------------------------------------------------
// Imports under test
// ---------------------------------------------------------------------------

import {
  TERRY_TOOL_SCHEMAS,
  TERRY_APPROVAL_REQUIRED,
  TERRY_READ_ONLY,
  CREATE_TICKET_TOOL,
  UPDATE_TICKET_TOOL,
  QUERY_TICKETS_TOOL,
  QUERY_COMPLIANCE_TOOL,
  LOG_COMPLIANCE_CHECK_TOOL,
  ASSESS_RISK_TOOL,
  type TerryProposal,
  type TerryToolResult,
} from './tools';

import { handleTerryToolCall } from './handler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a chainable Supabase query stub that resolves to { data, error }. */
function makeQueryChain(data: unknown[] = [], error: null | { message: string } = null) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'limit', 'lt', 'not', 'in'];
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  // Make the chain thenable so `await query` works
  chain.then = (resolve: (v: { data: unknown[]; error: typeof error }) => void) =>
    Promise.resolve({ data, error }).then(resolve);
  return chain;
}

// ---------------------------------------------------------------------------
// tools.ts — TERRY_TOOL_SCHEMAS
// ---------------------------------------------------------------------------

describe('TERRY_TOOL_SCHEMAS', () => {
  it('has exactly 6 tools', () => {
    expect(TERRY_TOOL_SCHEMAS).toHaveLength(6);
  });

  it('includes all six named tools', () => {
    const names = TERRY_TOOL_SCHEMAS.map((t) => t.name);
    expect(names).toContain('terry_create_ticket');
    expect(names).toContain('terry_update_ticket');
    expect(names).toContain('terry_query_tickets');
    expect(names).toContain('terry_query_compliance');
    expect(names).toContain('terry_log_compliance_check');
    expect(names).toContain('terry_assess_risk');
  });

  it('every tool has a name, description, and parameters with required fields', () => {
    for (const tool of TERRY_TOOL_SCHEMAS) {
      expect(tool).toHaveProperty('name');
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);

      expect(tool).toHaveProperty('description');
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);

      expect(tool).toHaveProperty('parameters');
      expect(tool.parameters).toHaveProperty('required');
      expect(Array.isArray(tool.parameters.required)).toBe(true);
      expect(tool.parameters.required.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// tools.ts — TERRY_APPROVAL_REQUIRED
// ---------------------------------------------------------------------------

describe('TERRY_APPROVAL_REQUIRED', () => {
  it('has exactly 4 entries', () => {
    expect(TERRY_APPROVAL_REQUIRED.size).toBe(4);
  });

  it('contains create_ticket, update_ticket, log_compliance_check, assess_risk', () => {
    expect(TERRY_APPROVAL_REQUIRED.has('terry_create_ticket')).toBe(true);
    expect(TERRY_APPROVAL_REQUIRED.has('terry_update_ticket')).toBe(true);
    expect(TERRY_APPROVAL_REQUIRED.has('terry_log_compliance_check')).toBe(true);
    expect(TERRY_APPROVAL_REQUIRED.has('terry_assess_risk')).toBe(true);
  });

  it('does NOT contain the read-only tools', () => {
    expect(TERRY_APPROVAL_REQUIRED.has('terry_query_tickets')).toBe(false);
    expect(TERRY_APPROVAL_REQUIRED.has('terry_query_compliance')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// tools.ts — TERRY_READ_ONLY
// ---------------------------------------------------------------------------

describe('TERRY_READ_ONLY', () => {
  it('has exactly 2 entries', () => {
    expect(TERRY_READ_ONLY.size).toBe(2);
  });

  it('contains query_tickets and query_compliance', () => {
    expect(TERRY_READ_ONLY.has('terry_query_tickets')).toBe(true);
    expect(TERRY_READ_ONLY.has('terry_query_compliance')).toBe(true);
  });

  it('does NOT overlap with TERRY_APPROVAL_REQUIRED', () => {
    for (const tool of TERRY_READ_ONLY) {
      expect(TERRY_APPROVAL_REQUIRED.has(tool)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// tools.ts — Individual tool schema required fields
// ---------------------------------------------------------------------------

describe('CREATE_TICKET_TOOL required fields', () => {
  it('requires organization_id, description, reported_by_name', () => {
    expect(CREATE_TICKET_TOOL.parameters.required).toEqual(
      expect.arrayContaining(['organization_id', 'description', 'reported_by_name']),
    );
  });
});

describe('UPDATE_TICKET_TOOL required fields', () => {
  it('requires organization_id, ticket_id, update_description, actor_name', () => {
    expect(UPDATE_TICKET_TOOL.parameters.required).toEqual(
      expect.arrayContaining([
        'organization_id',
        'ticket_id',
        'update_description',
        'actor_name',
      ]),
    );
  });
});

describe('QUERY_TICKETS_TOOL required fields', () => {
  it('requires organization_id and query', () => {
    expect(QUERY_TICKETS_TOOL.parameters.required).toEqual(
      expect.arrayContaining(['organization_id', 'query']),
    );
  });
});

describe('QUERY_COMPLIANCE_TOOL required fields', () => {
  it('requires organization_id and query', () => {
    expect(QUERY_COMPLIANCE_TOOL.parameters.required).toEqual(
      expect.arrayContaining(['organization_id', 'query']),
    );
  });
});

describe('LOG_COMPLIANCE_CHECK_TOOL required fields', () => {
  it('requires organization_id, description, completed_by_name', () => {
    expect(LOG_COMPLIANCE_CHECK_TOOL.parameters.required).toEqual(
      expect.arrayContaining(['organization_id', 'description', 'completed_by_name']),
    );
  });
});

describe('ASSESS_RISK_TOOL required fields', () => {
  it('requires organization_id, situation, assessor_name', () => {
    expect(ASSESS_RISK_TOOL.parameters.required).toEqual(
      expect.arrayContaining(['organization_id', 'situation', 'assessor_name']),
    );
  });
});

// ---------------------------------------------------------------------------
// tools.ts — TerryProposal interface typing (structural test)
// ---------------------------------------------------------------------------

describe('TerryProposal interface', () => {
  it('accepts a fully-valid TerryProposal object', () => {
    const proposal: TerryProposal = {
      proposal_id: 'tp_123_abc',
      tool: 'terry_create_ticket',
      action: 'create',
      confidence: 0.9,
      summary: 'Test summary',
      fields: { title: 'Broken fence', priority: 'high' },
      regulatory_references: [
        { legislation: 'RIDDOR 2013', section: '7', requirement_type: 'must' },
      ],
      created_at: new Date().toISOString(),
    };
    expect(proposal.proposal_id).toBe('tp_123_abc');
    expect(proposal.action).toBe('create');
    expect(proposal.confidence).toBe(0.9);
    expect(proposal.regulatory_references).toHaveLength(1);
  });

  it('accepts a TerryProposal with an optional risk_assessment', () => {
    const proposal: TerryProposal = {
      proposal_id: 'tp_456_def',
      tool: 'terry_assess_risk',
      action: 'assess',
      confidence: 0.8,
      summary: 'Broken gate near car park',
      fields: {},
      regulatory_references: [],
      created_at: new Date().toISOString(),
      risk_assessment: {
        likelihood: 4,
        impact: 5,
        score: 20,
        reasoning: 'High footfall area used by children',
        safeguarding_flag: true,
        register_entry_required: true,
      },
    };
    expect(proposal.risk_assessment?.score).toBe(20);
    expect(proposal.risk_assessment?.register_entry_required).toBe(true);
  });

  it('action enum only accepts create | update | log | assess', () => {
    const validActions: Array<TerryProposal['action']> = ['create', 'update', 'log', 'assess'];
    for (const action of validActions) {
      const p: TerryProposal = {
        proposal_id: 'tp_x',
        tool: 'terry_create_ticket',
        action,
        confidence: 1,
        summary: '',
        fields: {},
        regulatory_references: [],
        created_at: '',
      };
      expect(p.action).toBe(action);
    }
  });
});

// ---------------------------------------------------------------------------
// handler.ts — write tools return type: 'proposal'
// ---------------------------------------------------------------------------

describe('handleTerryToolCall — write tools return proposal', () => {
  it('terry_create_ticket returns type "proposal"', async () => {
    const result = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: 'The boiler room door is jammed',
      reported_by_name: 'Jane Smith',
    });
    expect(result.type).toBe('proposal');
    expect(result.proposal).toBeDefined();
  });

  it('terry_update_ticket returns type "proposal"', async () => {
    const result = await handleTerryToolCall('terry_update_ticket', {
      organization_id: 'org_1',
      ticket_id: 'tkt_99',
      update_description: 'Temporary repair done',
      actor_name: 'Dave Jones',
    });
    expect(result.type).toBe('proposal');
    expect(result.proposal).toBeDefined();
  });

  it('terry_log_compliance_check returns type "proposal"', async () => {
    const result = await handleTerryToolCall('terry_log_compliance_check', {
      organization_id: 'org_1',
      description: 'Weekly fire alarm test completed, all clear',
      completed_by_name: 'Helen Brown',
    });
    expect(result.type).toBe('proposal');
    expect(result.proposal).toBeDefined();
  });

  it('terry_assess_risk returns type "proposal"', async () => {
    const result = await handleTerryToolCall('terry_assess_risk', {
      organization_id: 'org_1',
      situation: 'Loose roof tile above the main entrance',
      assessor_name: 'Bob White',
    });
    expect(result.type).toBe('proposal');
    expect(result.proposal).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// handler.ts — proposal_id starts with 'tp_'
// ---------------------------------------------------------------------------

describe('handleTerryToolCall — proposal_id format', () => {
  it('proposal_id starts with "tp_"', async () => {
    const result = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: 'Broken window in hall',
      reported_by_name: 'Alice Green',
    });
    expect(result.proposal?.proposal_id).toMatch(/^tp_/);
  });

  it('each call generates a unique proposal_id', async () => {
    const r1 = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: 'Issue A',
      reported_by_name: 'Alice',
    });
    const r2 = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: 'Issue B',
      reported_by_name: 'Bob',
    });
    expect(r1.proposal?.proposal_id).not.toBe(r2.proposal?.proposal_id);
  });
});

// ---------------------------------------------------------------------------
// handler.ts — safeguarding detection
// ---------------------------------------------------------------------------

describe('handleTerryToolCall — safeguarding detection', () => {
  it('flags safeguarding when description contains "playground"', async () => {
    const result = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: 'The fence in the Year 3 playground is broken',
      reported_by_name: 'Mr Taylor',
    });
    expect(result.proposal?.risk_assessment?.safeguarding_flag).toBe(true);
  });

  it('flags safeguarding when description contains "children"', async () => {
    const result = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: 'Gate left open, children could access the road',
      reported_by_name: 'Mrs Patel',
    });
    expect(result.proposal?.risk_assessment?.safeguarding_flag).toBe(true);
  });

  it('does NOT flag safeguarding for routine maintenance text', async () => {
    const result = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: 'The boiler pressure gauge is reading low',
      reported_by_name: 'Dave Cooper',
    });
    expect(result.proposal?.risk_assessment?.safeguarding_flag).toBe(false);
  });

  it('does NOT flag safeguarding for neutral office issue', async () => {
    const result = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: 'Leaking tap in the staff kitchen',
      reported_by_name: 'Carol White',
    });
    expect(result.proposal?.risk_assessment?.safeguarding_flag).toBe(false);
  });

  it('assess_risk also flags safeguarding when situation contains "children"', async () => {
    const result = await handleTerryToolCall('terry_assess_risk', {
      organization_id: 'org_1',
      situation: 'Broken railing near the area where children gather',
      assessor_name: 'Sue Hall',
    });
    expect(result.proposal?.risk_assessment?.safeguarding_flag).toBe(true);
  });

  it('assess_risk does NOT flag safeguarding for unrelated situation', async () => {
    const result = await handleTerryToolCall('terry_assess_risk', {
      organization_id: 'org_1',
      situation: 'Electrical cabinet door is stiff and hard to open',
      assessor_name: 'Tom Black',
    });
    expect(result.proposal?.risk_assessment?.safeguarding_flag).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// handler.ts — create_ticket proposal fields
// ---------------------------------------------------------------------------

describe('handleTerryToolCall — create_ticket proposal fields', () => {
  it('includes expected fields in the proposal', async () => {
    const result = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_42',
      description: 'Hall ceiling tile has come loose',
      reported_by_name: 'Pete Marsh',
    });

    const fields = result.proposal?.fields as Record<string, unknown>;
    expect(fields).toBeDefined();
    expect(fields).toHaveProperty('title');
    expect(fields).toHaveProperty('description');
    expect(fields).toHaveProperty('category');
    expect(fields).toHaveProperty('priority');
    expect(fields).toHaveProperty('location');
    expect(fields).toHaveProperty('reported_by_name', 'Pete Marsh');
    expect(fields).toHaveProperty('organization_id', 'org_42');
    expect(fields).toHaveProperty('created_via', 'ed_chatbot');
    expect(fields).toHaveProperty('ticket_type', 'maintenance_reactive');
  });

  it('carries the description from params into fields.description', async () => {
    const desc = 'Classroom 4 radiator not working';
    const result = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: desc,
      reported_by_name: 'Kim Lee',
    });
    const fields = result.proposal?.fields as Record<string, unknown>;
    expect(fields.description).toBe(desc);
  });

  it('has a risk_assessment block', async () => {
    const result = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: 'Broken step outside reception',
      reported_by_name: 'Paul Fox',
    });
    expect(result.proposal?.risk_assessment).toBeDefined();
    expect(result.proposal?.risk_assessment).toHaveProperty('likelihood');
    expect(result.proposal?.risk_assessment).toHaveProperty('impact');
    expect(result.proposal?.risk_assessment).toHaveProperty('score');
    expect(result.proposal?.risk_assessment).toHaveProperty('reasoning');
    expect(result.proposal?.risk_assessment).toHaveProperty('safeguarding_flag');
    expect(result.proposal?.risk_assessment).toHaveProperty('register_entry_required');
  });

  it('proposal action is "create"', async () => {
    const result = await handleTerryToolCall('terry_create_ticket', {
      organization_id: 'org_1',
      description: 'Light bulb out in corridor',
      reported_by_name: 'Amy Chan',
    });
    expect(result.proposal?.action).toBe('create');
  });
});

// ---------------------------------------------------------------------------
// handler.ts — assess_risk proposal includes risk_assessment
// ---------------------------------------------------------------------------

describe('handleTerryToolCall — assess_risk proposal fields', () => {
  it('includes a risk_assessment block', async () => {
    const result = await handleTerryToolCall('terry_assess_risk', {
      organization_id: 'org_1',
      situation: 'Pothole in car park near staff entrance',
      assessor_name: 'Gary Pope',
    });
    expect(result.proposal?.risk_assessment).toBeDefined();
    expect(typeof result.proposal?.risk_assessment?.score).toBe('number');
    expect(typeof result.proposal?.risk_assessment?.likelihood).toBe('number');
    expect(typeof result.proposal?.risk_assessment?.impact).toBe('number');
  });

  it('proposal action is "assess"', async () => {
    const result = await handleTerryToolCall('terry_assess_risk', {
      organization_id: 'org_1',
      situation: 'Overgrown hedge blocking CCTV camera view',
      assessor_name: 'Nina Ross',
    });
    expect(result.proposal?.action).toBe('assess');
  });

  it('fields contain situation and assessor_name', async () => {
    const result = await handleTerryToolCall('terry_assess_risk', {
      organization_id: 'org_99',
      situation: 'Worn non-slip matting at top of staircase',
      assessor_name: 'Raj Kumar',
    });
    const fields = result.proposal?.fields as Record<string, unknown>;
    expect(fields.situation).toBe('Worn non-slip matting at top of staircase');
    expect(fields.assessor_name).toBe('Raj Kumar');
  });
});

// ---------------------------------------------------------------------------
// handler.ts — log_compliance_check proposal does NOT include risk_assessment
// ---------------------------------------------------------------------------

describe('handleTerryToolCall — log_compliance_check proposal', () => {
  it('does NOT include risk_assessment (log action, not create/assess)', async () => {
    const result = await handleTerryToolCall('terry_log_compliance_check', {
      organization_id: 'org_1',
      description: 'Monthly fire extinguisher inspection passed',
      completed_by_name: 'Brian Ford',
    });
    expect(result.proposal?.risk_assessment).toBeUndefined();
  });

  it('proposal action is "log"', async () => {
    const result = await handleTerryToolCall('terry_log_compliance_check', {
      organization_id: 'org_1',
      description: 'COSHH cupboard checked and compliant',
      completed_by_name: 'Lisa May',
    });
    expect(result.proposal?.action).toBe('log');
  });
});

// ---------------------------------------------------------------------------
// handler.ts — update_ticket proposal does NOT include risk_assessment
// ---------------------------------------------------------------------------

describe('handleTerryToolCall — update_ticket proposal', () => {
  it('does NOT include risk_assessment', async () => {
    const result = await handleTerryToolCall('terry_update_ticket', {
      organization_id: 'org_1',
      ticket_id: 'tkt_55',
      update_description: 'Temporary barriers placed around the area',
      actor_name: 'Steve Nash',
    });
    expect(result.proposal?.risk_assessment).toBeUndefined();
  });

  it('proposal action is "update"', async () => {
    const result = await handleTerryToolCall('terry_update_ticket', {
      organization_id: 'org_1',
      ticket_id: 'tkt_22',
      update_description: 'Plumber has been booked for Thursday',
      actor_name: 'Claire Dunn',
    });
    expect(result.proposal?.action).toBe('update');
  });
});

// ---------------------------------------------------------------------------
// handler.ts — read-only query tools return type: 'query_result'
// ---------------------------------------------------------------------------

describe('handleTerryToolCall — read-only query tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = makeQueryChain([{ id: 'tkt_1', priority: 'high' }]);
    mockSupabase.from.mockReturnValue(chain);
  });

  it('terry_query_tickets returns type "query_result"', async () => {
    const chain = makeQueryChain([]);
    mockSupabase.from.mockReturnValue(chain);

    const result = await handleTerryToolCall('terry_query_tickets', {
      organization_id: 'org_1',
      query: 'Show all open tickets',
    });
    expect(result.type).toBe('query_result');
  });

  it('terry_query_compliance returns type "query_result"', async () => {
    const chain = makeQueryChain([]);
    mockSupabase.from.mockReturnValue(chain);

    const result = await handleTerryToolCall('terry_query_compliance', {
      organization_id: 'org_1',
      query: 'When is our next fire risk assessment?',
    });
    expect(result.type).toBe('query_result');
  });

  it('terry_query_tickets does NOT return a proposal', async () => {
    const chain = makeQueryChain([]);
    mockSupabase.from.mockReturnValue(chain);

    const result = await handleTerryToolCall('terry_query_tickets', {
      organization_id: 'org_1',
      query: 'Show critical tickets',
    });
    expect(result.proposal).toBeUndefined();
  });
});
