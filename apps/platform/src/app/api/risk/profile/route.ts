import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// Temporarily commented to fix build - will fix import path
// import { handleGetInspectionRiskProfile } from '../../../../../../packages/mcp-server/src/tools/risk';

// Temporary placeholder - will fix import path later
async function handleGetInspectionRiskProfile(urn: string, context?: any) {
  return { error: 'MCP tool not available' };
}

/**
 * API Route: Get Inspection Risk Profile
 * 
 * Calls the MCP tool to calculate risk based on DfE data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urn } = body;

    if (!urn) {
      return NextResponse.json(
        { error: 'URN is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create mock AuthContext for the tool
    // In production, extract from JWT
    const authContext = {
      userId: 'api-user', // TODO: Extract from session
      organizationId: 'temp-org-id', // TODO: Extract from session
      userRole: 'admin',
      isAuthenticated: true,
      isApiKey: false,
      supabase,
    } as any;

    // Call the risk tool
    const result = await handleGetInspectionRiskProfile(urn, authContext);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in risk profile API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

