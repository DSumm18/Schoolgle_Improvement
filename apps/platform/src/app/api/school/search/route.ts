import { NextRequest, NextResponse } from 'next/server';
import { getDfeClient } from '@/lib/supabase-dfe';
import { DFESchoolData } from '@/lib/supabase-dfe';

export async function GET(req: NextRequest) {
  try {
    // Check DfE client is configured
    if (!process.env.DFE_SUPABASE_URL || !process.env.DFE_SUPABASE_SERVICE_ROLE_KEY) {
      console.error('DfE client not configured - missing environment variables');
      return NextResponse.json({ 
        success: false, 
        error: 'School search is not available. Please contact support.' 
      }, { status: 503 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Search query must be at least 2 characters' 
      }, { status: 400 });
    }

    const searchTerm = query.trim();

    // Check if query is a URN (numeric)
    const isURN = /^\d+$/.test(searchTerm);

    let schools: DFESchoolData[] = [];

    try {
      if (isURN) {
        // Search by URN
        const { data, error } = await getDfeClient()
          .from('schools')
          .select('urn, name, la_name, type_name, phase_name, town, postcode, address_line1')
          .eq('urn', parseInt(searchTerm))
          .limit(10);

        if (error) {
          console.error('DfE search error:', error);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to search schools. Please try again.' 
          }, { status: 500 });
        }

        schools = (data || []) as DFESchoolData[];
      } else {
        // Search by name or town
        const { data, error } = await getDfeClient()
          .from('schools')
          .select('urn, name, la_name, type_name, phase_name, town, postcode, address_line1')
          .or(`name.ilike.%${searchTerm}%,town.ilike.%${searchTerm}%`)
          .limit(20);

        if (error) {
          console.error('DfE search error:', error);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to search schools. Please try again.' 
          }, { status: 500 });
        }

        schools = (data || []) as DFESchoolData[];
      }
    } catch (dfeError: any) {
      console.error('DfE client error:', dfeError);
      return NextResponse.json({ 
        success: false, 
        error: 'School database connection error. Please try again later.' 
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      schools: schools.map(school => ({
        urn: school.urn,
        name: school.name,
        localAuthority: school.la_name,
        type: school.type_name,
        phase: school.phase_name,
        town: school.town,
        postcode: school.postcode,
        address: school.address_line1,
      }))
    });

  } catch (error: any) {
    console.error('School search error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

