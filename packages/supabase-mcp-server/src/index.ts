/**
 * Simple Supabase MCP Server for Schoolgle
 *
 * Provides direct database access tools for Supabase
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ygquvauptwyvlhkyxkwy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncXV2YXVwdHd5dmxoa3l4a3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk2MTA1NCwiZXhwIjoyMDc5NTM3MDU0fQ.SniWiVIv7QAF_medPRZiamHSRpgCy1N53LGDpQf6TwA';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Create MCP server
const server = new Server(
  {
    name: 'schoolgle-supabase-mcp-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {},
    }
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_database',
        description: 'Execute a SQL query on the Supabase database. Use SELECT statements only. Returns rows as JSON.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'SQL SELECT query to execute (e.g., "SELECT * FROM estates_statutory_completions LIMIT 10")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_table_info',
        description: 'Get information about a specific table including column names and types',
        inputSchema: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: 'Name of the table (e.g., "estates_statutory_completions")',
            },
          },
          required: ['table_name'],
        },
      },
      {
        name: 'list_tables',
        description: 'List all tables in the public schema',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_user_completions',
        description: 'Get statutory completions for a specific user and domain',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'User email address (e.g., "admin@schoolgle.co.uk")',
            },
            domain: {
              type: 'string',
              description: 'Compliance domain (e.g., "legionella")',
            },
          },
          required: ['email'],
        },
      },
      {
        name: 'check_recent_completion',
        description: 'Check if there are any recent completions (last 24 hours)',
        inputSchema: {
          type: 'object',
          properties: {
            organization_id: {
              type: 'string',
              description: 'Organization UUID (optional, defaults to Aurora Academy)',
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name: toolName, arguments: toolArgs } = request.params;

  try {
    switch (toolName) {
      case 'query_database': {
        const { query } = toolArgs as { query: string };

        // Only allow SELECT queries for safety
        if (!query.trim().toUpperCase().startsWith('SELECT')) {
          throw new Error('Only SELECT queries are allowed for safety');
        }

        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: query
        });

        if (error) {
          // Try using direct table query instead
          const tableMatch = query.match(/FROM\s+(\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            const { data: tableData, error: tableError } = await supabase
              .from(tableName)
              .select('*');

            if (tableError) {
              throw new Error(`Query failed: ${tableError.message}`);
            }

            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  query,
                  rows: tableData,
                  count: tableData?.length || 0
                }, null, 2)
              }]
            };
          }
          throw new Error(`Query failed: ${error.message}`);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              query,
              result: data
            }, null, 2)
          }]
        };
      }

      case 'get_table_info': {
        const { table_name } = toolArgs as { table_name: string };

        const { data, error } = await supabase
          .from(table_name)
          .select('*')
          .limit(1);

        if (error) {
          throw new Error(`Error accessing table: ${error.message}`);
        }

        // Get column info from the data
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                table: table_name,
                columns,
                sample_row: data[0],
                has_data: true
              }, null, 2)
            }]
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              table: table_name,
              columns: [],
              message: 'Table exists but is empty',
              has_data: false
            }, null, 2)
          }]
        };
      }

      case 'list_tables': {
        // Query to get all tables in public schema
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');

        if (error) {
          throw new Error(`Error listing tables: ${error.message}`);
        }

        const tables = data?.map((t: any) => t.table_name) || [];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              tables,
              count: tables.length
            }, null, 2)
          }]
        };
      }

      case 'get_user_completions': {
        const { email, domain } = toolArgs as { email: string; domain?: string };

        // First get the user's auth_id
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (userError || !user) {
          throw new Error(`User not found: ${email}`);
        }

        // Get completions
        let query = supabase
          .from('estates_statutory_completions')
          .select('*')
          .eq('organization_id', 'c64ed86b-9eab-49ee-9829-0706ff371083') // Aurora Academy
          .order('completed_at', { ascending: false, nullsFirst: false });

        if (domain) {
          query = query.eq('compliance_domain', domain);
        }

        const { data: completions, error: completionError } = await query;

        if (completionError) {
          throw new Error(`Error fetching completions: ${completionError.message}`);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              user: {
                email: user.email,
                auth_id: user.auth_id,
              },
              domain,
              completions,
              count: completions?.length || 0
            }, null, 2)
          }]
        };
      }

      case 'check_recent_completion': {
        const { organization_id = 'c64ed86b-9eab-49ee-9829-0706ff371083' } = toolArgs as { organization_id?: string };

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: completions, error } = await supabase
          .from('estates_statutory_completions')
          .select('*')
          .eq('organization_id', organization_id)
          .gte('created_at', yesterday)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Error fetching recent completions: ${error.message}`);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              recent_completions: completions,
              count: completions?.length || 0,
              checked_after: yesterday
            }, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          tool: toolName
        }, null, 2)
      }],
      isError: true
    };
  }
});

// Start server
async function main() {
  console.error('Schoolgle Supabase MCP Server starting...');
  console.error(`Connected to Supabase: ${SUPABASE_URL}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Schoolgle Supabase MCP Server running...');
}

main().catch(console.error);
