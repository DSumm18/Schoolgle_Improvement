import { NextRequest } from 'next/server';
import { lookupSchoolByURN, detectFrameworks, type DFESchoolData } from '@/lib/supabase-dfe';

interface LookupResponse {
  success: boolean;
  school?: DFESchoolData;
  frameworks?: {
    ofsted: boolean;
    isi: boolean;
    siams: boolean;
    csi: boolean;
    section48Muslim: boolean;
    section48Jewish: boolean;
    section48Hindu: boolean;
    section48Sikh: boolean;
  };
  error?: string;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const urn = searchParams.get('urn');

    if (!urn) {
      return new Response(
        JSON.stringify({ success: false, error: 'URN is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Lookup school in DfE warehouse
    const schoolData = await lookupSchoolByURN(urn);

    if (!schoolData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'School not found. Please check the URN is correct.' 
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Detect frameworks
    const frameworks = detectFrameworks(schoolData);

    const response: LookupResponse = {
      success: true,
      school: schoolData,
      frameworks,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('School lookup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

