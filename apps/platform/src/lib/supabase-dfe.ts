import { createClient } from '@supabase/supabase-js';

/**
 * DfE Data Warehouse Supabase Client
 * 
 * Separate client for querying the DfE data warehouse database
 * Schema: dfe_data (isolated from main app data)
 */
export const dfeClient = createClient(
  process.env.DFE_SUPABASE_URL!,
  process.env.DFE_SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * School data from DfE warehouse
 */
export interface DFESchoolData {
  urn: number;
  name: string;
  la_code?: string;
  la_name?: string;
  type_name?: string;
  phase_name?: string;
  status_name?: string;
  trust_name?: string;
  trust_uid?: string;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  town?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  website?: string;
  // Check if these exist in the actual schema
  religious_character?: string;
  religious_ethos?: string;
  denomination?: string;
}

/**
 * Lookup school by URN
 */
export async function lookupSchoolByURN(urn: string | number): Promise<DFESchoolData | null> {
  try {
    // Try direct query first (works if views exist in public schema)
    const { data: directData, error: directError } = await dfeClient
      .from('schools')
      .select('*')
      .eq('urn', parseInt(urn.toString()))
      .single();

    if (!directError && directData) {
      return directData as DFESchoolData;
    }

    // Fallback: Use REST API with schema prefix
    const response = await fetch(
      `${process.env.DFE_SUPABASE_URL}/rest/v1/schools?urn=eq.${urn}`,
      {
        headers: {
          'apikey': process.env.DFE_SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.DFE_SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) && data.length > 0 ? data[0] as DFESchoolData : null;
    }

    console.error('DfE lookup error:', directError || 'No data found');
    return null;
  } catch (error) {
    console.error('Error looking up school:', error);
    return null;
  }
}

/**
 * Check if school is independent (uses ISI, not Ofsted)
 */
export function isIndependentSchool(schoolData: DFESchoolData | null): boolean {
  if (!schoolData?.type_name) return false;
  
  const independentTypes = [
    'Independent school',
    'Other independent school',
    'Non-maintained special school'
  ];
  
  return independentTypes.some(type => 
    schoolData.type_name?.toLowerCase().includes(type.toLowerCase())
  );
}

/**
 * Detect required inspection frameworks from school data
 */
export interface FrameworkConfig {
  ofsted: boolean;
  isi: boolean;
  siams: boolean;
  csi: boolean;
  section48Muslim: boolean;
  section48Jewish: boolean;
  section48Hindu: boolean;
  section48Sikh: boolean;
}

export function detectFrameworks(schoolData: DFESchoolData | null): FrameworkConfig {
  const config: FrameworkConfig = {
    ofsted: false,
    isi: false,
    siams: false,
    csi: false,
    section48Muslim: false,
    section48Jewish: false,
    section48Hindu: false,
    section48Sikh: false,
  };

  if (!schoolData) return config;

  // Detect Ofsted vs ISI
  if (isIndependentSchool(schoolData)) {
    config.isi = true;
    config.ofsted = false;
  } else {
    config.ofsted = true;
    config.isi = false;
  }

  // Faith frameworks - cannot auto-detect reliably
  // Religious character may not be in DfE data
  // User must confirm these
  if (schoolData.religious_character || schoolData.religious_ethos) {
    const rc = (schoolData.religious_character || schoolData.religious_ethos || '').toLowerCase();
    
    if (rc.includes('church of england') || rc.includes('methodist')) {
      config.siams = true;
    } else if (rc.includes('catholic') || rc.includes('roman catholic')) {
      config.csi = true;
    } else if (rc.includes('muslim') || rc.includes('islamic')) {
      config.section48Muslim = true;
    } else if (rc.includes('jewish')) {
      config.section48Jewish = true;
    } else if (rc.includes('hindu')) {
      config.section48Hindu = true;
    } else if (rc.includes('sikh')) {
      config.section48Sikh = true;
    }
  }

  return config;
}

