
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, searchType } = await req.json();
    
    if (!searchTerm) {
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`School lookup for: ${searchTerm}, type: ${searchType}`);

    // Enhanced search in local database with full GIAS data
    let query = supabase
      .from('schools')
      .select(`
        *,
        trusts:trust_id (
          id,
          name,
          dfe_group_uid,
          companies_house_number,
          address_town,
          address_postcode
        )
      `)
      .eq('is_test_account', false) // Only return real schools
      .in('status', ['Open', 'open', 'Open with Sixth Form']) // Only active schools
      .order('name');

    if (searchType === 'urn') {
      // Exact URN search
      const urnNumber = parseInt(searchTerm);
      if (isNaN(urnNumber)) {
        return new Response(
          JSON.stringify({ 
            schools: [], 
            message: 'Invalid URN format. Please enter a valid URN number.',
            source: 'validation'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      query = query.eq('urn', urnNumber);
    } else {
      // Enhanced text search across multiple fields
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      query = query.or(
        `name.ilike.${searchPattern},` +
        `address_town.ilike.${searchPattern},` +
        `address_postcode.ilike.${searchPattern},` +
        `local_authority.ilike.${searchPattern},` +
        `la_name.ilike.${searchPattern}`
      );
    }

    const { data: results, error } = await query.limit(20); // Increased limit for better results

    if (error) {
      console.error('Database search error:', error);
      return new Response(
        JSON.stringify({ 
          schools: [], 
          error: 'School search is currently unavailable. Please try again later.',
          details: error.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Found ${results?.length || 0} schools in database`);

    if (results && results.length > 0) {
      // Enhance results with additional computed fields
      const enhancedResults = results.map(school => ({
        ...school,
        // Combine headteacher name if available
        headteacher_name: school.head_first_name && school.head_last_name 
          ? `${school.head_first_name} ${school.head_last_name}`
          : school.headteacher_name,
        // Add age range display
        age_range: school.statutory_low_age && school.statutory_high_age
          ? `${school.statutory_low_age}-${school.statutory_high_age}`
          : null,
        // Add nursery and sixth form flags
        has_nursery: school.nursery_provision === 'Has Nursery Classes' || school.has_nursery,
        has_sixth_form: school.official_sixth_form_name === 'Has a sixth form' || school.has_sixth_form,
        // Enhanced location info
        full_address: [
          school.address_street,
          school.locality,
          school.address_town,
          school.address_county,
          school.address_postcode
        ].filter(Boolean).join(', ')
      }));

      return new Response(
        JSON.stringify({ 
          schools: enhancedResults, 
          source: 'database',
          cached: false,
          count: enhancedResults.length,
          message: `Found ${enhancedResults.length} school${enhancedResults.length > 1 ? 's' : ''} from Department for Education database`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No results found
    return new Response(
      JSON.stringify({ 
        schools: [], 
        source: 'database',
        count: 0,
        message: searchType === 'urn' 
          ? `No school found with URN ${searchTerm}. Please check the URN number is correct.`
          : `No schools found matching "${searchTerm}". Try different search terms, check spelling, or use a URN number for exact matches.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('School lookup error:', error);
    return new Response(
      JSON.stringify({ 
        schools: [], 
        error: 'School lookup service is currently unavailable. Please try again later.',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
