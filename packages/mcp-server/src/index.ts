/**
 * MCP Server - Main Entry Point
 * 
 * Model Context Protocol Server for Schoolgle
 * 
 * Features:
 * - Dual-Auth (User JWTs + API Keys)
 * - Module Entitlements (App Store)
 * - Tool Safety Middleware (GDPR compliance)
 * - Native Supabase RLS
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { authenticate, type AuthContext } from '@schoolgle/core/auth';
import { ToolSafetyMiddleware } from './middleware/safety.js';
import { handleGetFinancialRecords } from './tools/financials.js';
import { handleGetEvidenceMatches } from './tools/evidence.js';
import { handleGetAssessments } from './tools/assessments.js';
import { handleGetInspectionRiskProfile } from './tools/risk.js';
import {
  handleSearchResearchStrategies,
  handleCreateIntervention,
  handleAnalyzeCohortImpact
} from './tools/interventions.js';
import {
  handleImportStudentsBatch,
  handleCreateCohort,
  handleCreateOrganization,
  handleLinkSchoolToParent
} from './tools/admin.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

// Verify GDPR compliance
if (!SUPABASE_URL.includes('eu-west-2') && 
    !SUPABASE_URL.includes('eu-central-1') && 
    !SUPABASE_URL.includes('eu-west-1')) {
  console.warn('⚠️  WARNING: Supabase URL does not appear to be in EU region. See WARNINGS.md');
}

/**
 * Filter tools based on organization's module entitlements
 * 
 * Only returns tools for modules the organization has purchased.
 * Core module tools are always available.
 */
async function filterTools(
  context: AuthContext
): Promise<Array<{
  name: string;
  description: string;
  inputSchema: any;
}>> {
  // Get available tools for organization
  const { data: tools, error } = await context.supabase
    .rpc('get_available_tools', { org_id: context.organizationId });

  if (error || !tools) {
    console.error('[MCP] Error fetching available tools:', error);
    return [];
  }

  // Map to MCP tool format
  return tools.map((tool: any) => ({
    name: tool.tool_key,
    description: `${tool.description} (Module: ${tool.module_key}, Risk: ${tool.risk_level})`,
    inputSchema: getToolInputSchema(tool.tool_key)
  }));
}

/**
 * Get input schema for a tool
 */
function getToolInputSchema(toolKey: string): any {
  switch (toolKey) {
    case 'get_financial_records':
      return {
        type: 'object',
        properties: {
          fiscalYear: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}$',
            description: 'Academic year in YYYY-YY format (e.g., "2024-25"). Optional.'
          },
          category: {
            type: 'string',
            enum: ['pupil_premium', 'sports_premium', 'both'],
            default: 'both',
            description: 'Financial category filter. Default: "both".'
          },
          includeSpending: {
            type: 'boolean',
            default: false,
            description: 'Include spending breakdown. Default: false.'
          }
        }
      };

    case 'get_evidence_matches':
      return {
        type: 'object',
        properties: {
          subcategoryId: {
            type: 'string',
            description: 'Ofsted subcategory ID (e.g., "curriculum-teaching-1"). Required.'
          },
          frameworkType: {
            type: 'string',
            enum: ['ofsted', 'siams'],
            default: 'ofsted',
            description: 'Framework type. Default: "ofsted".'
          },
          minConfidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            default: 0.5,
            description: 'Minimum confidence threshold. Default: 0.5.'
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: 'Maximum results. Default: 20.'
          }
        },
        required: ['subcategoryId']
      };

    case 'get_assessments':
      return {
        type: 'object',
        properties: {
          subcategoryId: {
            type: 'string',
            description: 'Optional filter by Ofsted subcategory ID (e.g., "curriculum-teaching-1"). If omitted, returns all assessments.'
          },
          categoryId: {
            type: 'string',
            description: 'Optional filter by Ofsted category ID (e.g., "curriculum-teaching", "inclusion"). If omitted, returns all categories.'
          },
          includeNotAssessed: {
            type: 'boolean',
            default: false,
            description: 'If true, includes subcategories with "not_assessed" ratings. Default: false.'
          },
          ratingFilter: {
            type: 'string',
            enum: ['exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement'],
            description: 'Optional filter by rating. Returns assessments matching this rating.'
          },
          minEvidenceCount: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Minimum evidence count threshold. Default: 0.'
          },
          minQualityScore: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Minimum evidence quality score (0-1). If provided, only returns assessments with quality_score >= this value.'
          }
        }
      };

    case 'get_inspection_risk_profile':
      return {
        type: 'object',
        properties: {
          urn: {
            type: 'string',
            description: 'Unique Reference Number (URN). If omitted, uses organization.urn from context.'
          }
        }
      };

    case 'search_research_strategies':
      return {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Search topic (e.g., "phonics", "metacognition", "feedback", "reading"). Required.'
          },
          category: {
            type: 'string',
            description: 'Optional category filter (e.g., "literacy", "numeracy", "metacognition").'
          },
          minEvidenceStrength: {
            type: 'number',
            minimum: 1,
            maximum: 5,
            description: 'Minimum evidence strength (1-5). Default: 3.'
          },
          minImpactMonths: {
            type: 'number',
            description: 'Minimum impact in months (e.g., 4 for "+4 months").'
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 50,
            default: 10,
            description: 'Maximum number of strategies to return. Default: 10.'
          }
        },
        required: ['topic']
      };

    case 'create_intervention':
      return {
        type: 'object',
        properties: {
          cohortId: {
            type: 'string',
            description: 'UUID of the cohort this intervention targets. Required.'
          },
          strategyId: {
            type: 'string',
            description: 'UUID of the research strategy being implemented. Required.'
          },
          startDate: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Start date for the intervention (YYYY-MM-DD). Required.'
          },
          plannedEndDate: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Planned end date (YYYY-MM-DD). Optional.'
          },
          frequency: {
            type: 'string',
            description: 'Frequency of sessions (e.g., "daily", "weekly", "3x per week").'
          },
          durationMinutes: {
            type: 'number',
            minimum: 1,
            description: 'Duration per session in minutes.'
          },
          staffLead: {
            type: 'string',
            description: 'Name of staff member leading the intervention (no PII).'
          },
          intendedOutcomes: {
            type: 'string',
            description: 'What outcomes are expected from this intervention.'
          },
          successCriteria: {
            type: 'string',
            description: 'How success will be measured.'
          }
        },
        required: ['cohortId', 'strategyId', 'startDate']
      };

    case 'analyze_cohort_impact':
      return {
        type: 'object',
        properties: {
          cohortId: {
            type: 'string',
            description: 'UUID of the cohort to analyze. Required.'
          },
          includeInterventions: {
            type: 'boolean',
            default: true,
            description: 'Include intervention details in the analysis. Default: true.'
          },
          includePulseChecks: {
            type: 'boolean',
            default: true,
            description: 'Include pulse check data in the analysis. Default: true.'
          }
        },
        required: ['cohortId']
      };

    case 'import_students_batch':
      return {
        type: 'object',
        properties: {
          students: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                upn: {
                  type: 'string',
                  description: 'Unique Pupil Number (will be hashed before storage). Required.'
                },
                yearGroup: {
                  type: 'number',
                  minimum: 1,
                  maximum: 13,
                  description: 'Year group (1-13). Required.'
                },
                characteristics: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of characteristics (e.g., ["pp", "send", "eal"]).'
                }
              },
              required: ['upn', 'yearGroup']
            },
            minItems: 1,
            maxItems: 1000,
            description: 'Array of student records to import. Required.'
          }
        },
        required: ['students']
      };

    case 'analyze_framework_gaps':
      return {
        type: 'object',
        properties: {
          framework: {
            type: 'string',
            enum: ['ofsted', 'siams', 'csi', 'isi', 'section48', 'other'],
            description: 'Framework to analyze gaps for (e.g., "ofsted", "siams"). Required.'
          },
          forceRefresh: {
            type: 'boolean',
            default: false,
            description: 'If true, forces a fresh analysis (ignores cached results). Default: false.'
          },
          areaKey: {
            type: 'string',
            description: 'Optional filter by area_key (e.g., "curriculum_intent", "safeguarding_culture").'
          }
        },
        required: ['framework']
      };

    case 'generate_inspection_narrative':
      return {
        type: 'object',
        properties: {
          school_id: {
            type: 'string',
            description: 'School/organization ID to generate narrative for. Required.'
          },
          framework: {
            type: 'string',
            enum: ['ofsted', 'siams', 'csi', 'isi', 'section48', 'other'],
            description: 'Framework to generate narrative for (e.g., "ofsted", "siams"). Required.'
          },
          mode: {
            type: 'string',
            enum: ['inspection_narrative', 'sef_draft', 'leadership_brief'],
            default: 'inspection_narrative',
            description: 'Output mode: "inspection_narrative" (default), "sef_draft", or "leadership_brief".'
          }
        },
        required: ['school_id', 'framework']
      };

    case 'create_cohort':
      return {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Cohort name (e.g., "Year 5 Pupil Premium"). Required.'
          },
          description: {
            type: 'string',
            description: 'Optional description of the cohort.'
          },
          criteria: {
            type: 'object',
            properties: {
              yearGroup: {
                type: 'number',
                minimum: 1,
                maximum: 13,
                description: 'Filter by specific year group.'
              },
              yearGroups: {
                type: 'array',
                items: { type: 'number', minimum: 1, maximum: 13 },
                description: 'Filter by multiple year groups (e.g., [3, 4, 5, 6] for KS2).'
              },
              minYear: {
                type: 'number',
                minimum: 1,
                maximum: 13,
                description: 'Minimum year group (inclusive).'
              },
              maxYear: {
                type: 'number',
                minimum: 1,
                maximum: 13,
                description: 'Maximum year group (inclusive).'
              },
              characteristics: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by characteristics (e.g., ["pp"], ["send"]).'
              },
              year: {
                type: 'number',
                minimum: 1,
                maximum: 13,
                description: 'Alias for yearGroup (legacy support).'
              },
              is_pp: {
                type: 'boolean',
                description: 'Legacy: If true, includes pupils with "pp" characteristic.'
              },
              is_send: {
                type: 'boolean',
                description: 'Legacy: If true, includes pupils with "send" characteristic.'
              }
            },
            description: 'Filter criteria for the cohort. At least one criterion required.'
          }
        },
        required: ['name', 'criteria']
      };

    case 'create_organization':
      return {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the organization (e.g., "Acme Academy Trust", "St. Mary\'s Primary School"). Required.'
          },
          type: {
            type: 'string',
            enum: ['school', 'trust', 'local_authority'],
            description: 'Type of organization: "school" (individual school), "trust" (Multi-Academy Trust), or "local_authority" (Local Authority). Required.'
          },
          parentId: {
            type: 'string',
            format: 'uuid',
            description: 'Optional UUID of parent organization (Trust or LA). Only valid if type is "school".'
          },
          laCode: {
            type: 'string',
            description: 'DfE Local Authority code (required if type is "local_authority").'
          },
          urn: {
            type: 'string',
            description: 'Unique Reference Number (URN) for schools.'
          },
          dataSharingAgreement: {
            type: 'boolean',
            default: false,
            description: 'Whether this organization has a data sharing agreement (relevant for schools under LAs).'
          }
        },
        required: ['name', 'type']
      };

    case 'link_school_to_parent':
      return {
        type: 'object',
        properties: {
          schoolId: {
            type: 'string',
            format: 'uuid',
            description: 'UUID of the school to link to a parent organization. Required.'
          },
          parentId: {
            type: 'string',
            format: 'uuid',
            description: 'UUID of the parent organization (Trust or Local Authority). Required.'
          }
        },
        required: ['schoolId', 'parentId']
      };

    case 'consult_knowledge_pack':
      return {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            enum: ['estates', 'send', 'hr', 'finance', 'compliance'],
            description: 'Knowledge domain to query'
          },
          topic: {
            type: 'string',
            description: 'Topic to search for (e.g., "classroom_minimum_area", "safeguarding_reporting")'
          },
          context: {
            type: 'string',
            description: 'Optional context to filter applies_when conditions (e.g., "primary school", "wheelchair users")'
          }
        },
        required: ['domain', 'topic']
      };

    case 'generate_room_brief':
      return {
        type: 'object',
        properties: {
          roomType: {
            type: 'string',
            description: 'Type of room (e.g., "classroom", "science_lab", "classroom_minimum_area")'
          },
          constraints: {
            type: 'string',
            description: 'Additional constraints (e.g., "primary school", "30 pupils", "2 wheelchair users")'
          },
          ageGroup: {
            type: 'string',
            enum: ['primary', 'secondary', 'mixed'],
            description: 'Age group if applicable'
          }
        },
        required: ['roomType']
      };

    default:
      return {
        type: 'object',
        properties: {}
      };
  }
}

/**
 * Create and configure MCP server
 */
export async function createMCPServer(transportType: 'stdio' | 'sse' = 'stdio') {
  const server = new Server(
    {
      name: 'schoolgle-mcp-server',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {},
        resources: {}
      }
    }
  );

  // Store auth context per connection
  const connectionContexts = new Map<string, AuthContext>();

  // List available tools (filtered by entitlements)
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    const connectionId = request.meta?.connectionId || 'default';
    const context = connectionContexts.get(connectionId);

    if (!context) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const tools = await filterTools(context);

    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const connectionId = request.meta?.connectionId || 'default';
    const context = connectionContexts.get(connectionId);

    if (!context) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const { name: toolName, arguments: toolArgs } = request.params;

    // Generate request and session IDs for telemetry tracing
    const requestId = crypto.randomUUID();
    const sessionId = request.meta?.sessionId || connectionId; // Use connectionId as session fallback

    // Initialize safety middleware
    const safety = new ToolSafetyMiddleware(context.supabase);

    // Create tool request
    const toolRequest = {
      toolName,
      inputs: toolArgs || {},
      context
    };

    // Route to appropriate handler
    let handler: (request: any) => Promise<any>;
    switch (toolName) {
      case 'get_financial_records':
        handler = async (req) => {
          const { GetFinancialRecordsSchema } = await import('./tools/financials.js');
          const validated = GetFinancialRecordsSchema.parse(req.inputs);
          return handleGetFinancialRecords(validated, req.context);
        };
        break;

      case 'get_evidence_matches':
        handler = async (req) => {
          const { GetEvidenceMatchesSchema } = await import('./tools/evidence.js');
          const validated = GetEvidenceMatchesSchema.parse(req.inputs);
          return handleGetEvidenceMatches(validated, req.context);
        };
        break;

      case 'get_assessments':
        handler = async (req) => {
          const { GetAssessmentsSchema } = await import('./tools/assessments.js');
          const validated = GetAssessmentsSchema.parse(req.inputs);
          return handleGetAssessments(validated, req.context);
        };
        break;

      case 'get_inspection_risk_profile':
        handler = async (req) => {
          const { GetInspectionRiskProfileSchema } = await import('./tools/risk.js');
          const validated = GetInspectionRiskProfileSchema.parse(req.inputs);
          return handleGetInspectionRiskProfile(validated, req.context);
        };
        break;

      case 'search_research_strategies':
        handler = async (req) => {
          const { SearchResearchStrategiesSchema } = await import('./tools/interventions.js');
          const validated = SearchResearchStrategiesSchema.parse(req.inputs);
          return handleSearchResearchStrategies(validated, req.context);
        };
        break;

      case 'create_intervention':
        handler = async (req) => {
          const { CreateInterventionSchema } = await import('./tools/interventions.js');
          const validated = CreateInterventionSchema.parse(req.inputs);
          return handleCreateIntervention(validated, req.context);
        };
        break;

      case 'analyze_cohort_impact':
        handler = async (req) => {
          const { AnalyzeCohortImpactSchema } = await import('./tools/interventions.js');
          const validated = AnalyzeCohortImpactSchema.parse(req.inputs);
          return handleAnalyzeCohortImpact(validated, req.context);
        };
        break;

      case 'import_students_batch':
        handler = async (req) => {
          const { ImportStudentsBatchSchema } = await import('./tools/admin.js');
          const validated = ImportStudentsBatchSchema.parse(req.inputs);
          return handleImportStudentsBatch(validated, req.context);
        };
        break;

      case 'create_cohort':
        handler = async (req) => {
          const { CreateCohortSchema } = await import('./tools/admin.js');
          const validated = CreateCohortSchema.parse(req.inputs);
          return handleCreateCohort(validated, req.context);
        };
        break;

      case 'create_organization':
        handler = async (req) => {
          const { CreateOrganizationSchema } = await import('./tools/admin.js');
          const validated = CreateOrganizationSchema.parse(req.inputs);
          return handleCreateOrganization(validated, req.context);
        };
        break;

      case 'link_school_to_parent':
        handler = async (req) => {
          const { LinkSchoolToParentSchema } = await import('./tools/admin.js');
          const validated = LinkSchoolToParentSchema.parse(req.inputs);
          return handleLinkSchoolToParent(validated, req.context);
        };
        break;

      case 'analyze_framework_gaps':
        handler = async (req) => {
          const { AnalyzeFrameworkGapsSchema } = await import('./tools/gap-analysis.js');
          const validated = AnalyzeFrameworkGapsSchema.parse(req.inputs);
          const { handleAnalyzeFrameworkGaps } = await import('./tools/gap-analysis.js');
          return handleAnalyzeFrameworkGaps(validated, req.context, requestId, sessionId);
        };
        break;

      case 'generate_inspection_narrative':
        handler = async (req) => {
          const { GenerateInspectionNarrativeSchema } = await import('./tools/inspection-narrative.js');
          const validated = GenerateInspectionNarrativeSchema.parse(req.inputs);
          const { handleGenerateInspectionNarrative } = await import('./tools/inspection-narrative.js');
          return handleGenerateInspectionNarrative(validated, req.context, requestId, sessionId);
        };
        break;

      case 'consult_knowledge_pack':
        handler = async (req) => {
          const { ConsultKnowledgePackSchema } = await import('./tools/knowledge.js');
          const validated = ConsultKnowledgePackSchema.parse(req.inputs);
          const { handleConsultKnowledgePack } = await import('./tools/knowledge.js');
          return handleConsultKnowledgePack(validated, req.context, requestId, sessionId);
        };
        break;

      case 'generate_room_brief':
        handler = async (req) => {
          const { GenerateRoomBriefSchema } = await import('./tools/estates.js');
          const validated = GenerateRoomBriefSchema.parse(req.inputs);
          const { handleGenerateRoomBrief } = await import('./tools/estates.js');
          return handleGenerateRoomBrief(validated, req.context, requestId, sessionId);
        };
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    // Process through safety middleware
    const response = await safety.processRequest(toolRequest, handler);

    if (!response.success) {
      if (response.requiresApproval) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: response.error,
              requiresApproval: true,
              approvalRequestId: response.approvalRequestId,
              message: 'This tool requires human approval. Please approve via dashboard.'
            })
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: response.error })
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data)
      }]
    };
  });

  // Authentication endpoint (custom MCP extension)
  server.setRequestHandler(
    { method: 'auth/authenticate' } as any,
    async (request: any) => {
      const { authHeader } = request.params;

      try {
        const context = await authenticate(SUPABASE_URL, authHeader);
        const connectionId = request.meta?.connectionId || crypto.randomUUID();
        connectionContexts.set(connectionId, context);

        return {
          success: true,
          connectionId,
          organizationId: context.organizationId,
          userId: context.userId
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Authentication failed'
        };
      }
    }
  );

  // Setup transport
  let transport;
  if (transportType === 'stdio') {
    transport = new StdioServerTransport();
  } else {
    transport = new SSEServerTransport({
      // SSE configuration
    });
  }

  await server.connect(transport);
  return server;
}

// Main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const transportType = process.env.MCP_TRANSPORT === 'sse' ? 'sse' : 'stdio';
  createMCPServer(transportType).catch(console.error);
}


