
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
    const { csvData, batchSize = 1000 } = await req.json();
    
    if (!csvData) {
      return new Response(
        JSON.stringify({ error: 'CSV data is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting GIAS data import...');

    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split('\t');
    
    console.log(`Found ${lines.length - 1} data rows to process`);

    // Process data in batches
    let totalProcessed = 0;
    let batchData = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      
      // Create record object matching staging table structure
      const record = {
        urn: values[0] || null,
        la_code: values[1] || null,
        la_name: values[2] || null,
        establishment_number: values[3] || null,
        establishment_name: values[4] || null,
        type_of_establishment_code: values[5] || null,
        type_of_establishment_name: values[6] || null,
        establishment_type_group_code: values[7] || null,
        establishment_type_group_name: values[8] || null,
        establishment_status_code: values[9] || null,
        establishment_status_name: values[10] || null,
        reason_establishment_opened_code: values[11] || null,
        reason_establishment_opened_name: values[12] || null,
        open_date: values[13] || null,
        reason_establishment_closed_code: values[14] || null,
        reason_establishment_closed_name: values[15] || null,
        close_date: values[16] || null,
        phase_of_education_code: values[17] || null,
        phase_of_education_name: values[18] || null,
        statutory_low_age: values[19] || null,
        statutory_high_age: values[20] || null,
        boarders_code: values[21] || null,
        boarders_name: values[22] || null,
        nursery_provision_name: values[23] || null,
        official_sixth_form_code: values[24] || null,
        official_sixth_form_name: values[25] || null,
        gender_code: values[26] || null,
        gender_name: values[27] || null,
        religious_character_code: values[28] || null,
        religious_character_name: values[29] || null,
        religious_ethos_name: values[30] || null,
        diocese_code: values[31] || null,
        diocese_name: values[32] || null,
        admissions_policy_code: values[33] || null,
        admissions_policy_name: values[34] || null,
        school_capacity: values[35] || null,
        special_classes_code: values[36] || null,
        special_classes_name: values[37] || null,
        census_date: values[38] || null,
        number_of_pupils: values[39] || null,
        number_of_boys: values[40] || null,
        number_of_girls: values[41] || null,
        percentage_fsm: values[42] || null,
        trust_school_flag_code: values[43] || null,
        trust_school_flag_name: values[44] || null,
        trusts_code: values[45] || null,
        trusts_name: values[46] || null,
        school_sponsor_flag_name: values[47] || null,
        school_sponsors_name: values[48] || null,
        federation_flag_name: values[49] || null,
        federations_code: values[50] || null,
        federations_name: values[51] || null,
        ukprn: values[52] || null,
        fe_he_identifier: values[53] || null,
        further_education_type_name: values[54] || null,
        last_changed_date: values[55] || null,
        street: values[56] || null,
        locality: values[57] || null,
        address3: values[58] || null,
        town: values[59] || null,
        county_name: values[60] || null,
        postcode: values[61] || null,
        school_website: values[62] || null,
        telephone_num: values[63] || null,
        head_title_name: values[64] || null,
        head_first_name: values[65] || null,
        head_last_name: values[66] || null,
        head_preferred_job_title: values[67] || null,
        bso_inspectorate_name: values[68] || null,
        inspectorate_report: values[69] || null,
        date_of_last_inspection_visit: values[70] || null,
        next_inspection_visit: values[71] || null,
        raw_data: lines[i], // Store full line for debugging
        processed: false
      };

      batchData.push(record);

      // Process batch when it reaches the batch size
      if (batchData.length >= batchSize) {
        const { error } = await supabase
          .from('gias_import_staging')
          .insert(batchData);

        if (error) {
          console.error('Batch insert error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to insert batch', details: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        totalProcessed += batchData.length;
        console.log(`Processed ${totalProcessed} records so far...`);
        batchData = [];
      }
    }

    // Process remaining records
    if (batchData.length > 0) {
      const { error } = await supabase
        .from('gias_import_staging')
        .insert(batchData);

      if (error) {
        console.error('Final batch insert error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to insert final batch', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      totalProcessed += batchData.length;
    }

    console.log(`Import to staging complete. Total records: ${totalProcessed}`);

    // Now process the staging data into the main schools table
    const { data: processResult, error: processError } = await supabase
      .rpc('process_gias_import');

    if (processError) {
      console.error('Processing error:', processError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process staging data', 
          details: processError.message,
          stagingRecords: totalProcessed 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        stagingRecords: totalProcessed,
        processedRecords: processResult,
        message: `Successfully imported ${processResult} schools from GIAS data` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('GIAS import error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Import failed', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
