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


