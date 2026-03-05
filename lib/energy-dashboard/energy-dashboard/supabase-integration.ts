import { createClient } from '@supabase/supabase-js';

interface SupabaseConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

interface EnergyData {
  id?: string;
  school_name: string;
  meter_number: string;
  energy_type: 'Electricity' | 'Gas';
  year: number;
  month: string;
  total_kwh: number;
  total_cost: number;
  mpan: string;
  supplier: string;
  invoice_date: string;
  created_at?: string;
  updated_at?: string;
}

interface MeterInfo {
  id?: string;
  school_name: string;
  address: string;
  mpan: string;
  energy_type: 'Electricity' | 'Gas';
  meter_number: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

interface ExtractionRun {
  id?: string;
  run_name: string;
  school_name: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  records_created: number;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseEnergyStorage {
  private supabase: any;
  private projectId: string;

  constructor(config: SupabaseConfig) {
    this.supabase = createClient(config.url, config.anonKey);
    this.projectId = config.projectId;
  }

  // Initialize database schema for a new school
  async initializeSchoolDatabase(schoolName: string): Promise<void> {
    try {
      // Create tables if they don't exist
      await this.createTables();
      
      // Set up Row Level Security (RLS) policies
      await this.setupRLSPolicies(schoolName);
      
      // Create initial meter records if needed
      await this.initializeMeterData(schoolName);
      
    } catch (error) {
      console.error('Error initializing school database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // This would typically be done via Supabase migrations
    // For now, we'll assume the tables exist
    console.log('Tables should be created via Supabase migrations');
  }

  private async setupRLSPolicies(schoolName: string): Promise<void> {
    // Set up RLS policies to ensure schools can only access their own data
    // This would be done via Supabase SQL policies
    console.log('RLS policies should be set up via Supabase SQL');
  }

  private async initializeMeterData(schoolName: string): Promise<void> {
    // Initialize with any existing meter data
    console.log('Initializing meter data for:', schoolName);
  }

  // Save extracted energy data
  async saveEnergyData(data: EnergyData[]): Promise<{ inserted: number; updated: number }> {
    try {
      const { data: result, error } = await this.supabase
        .from('energy_data')
        .upsert(data, { 
          onConflict: 'school_name,meter_number,energy_type,year,month',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      return {
        inserted: result?.length || 0,
        updated: 0 // Supabase upsert doesn't distinguish between insert/update
      };
    } catch (error) {
      console.error('Error saving energy data:', error);
      throw error;
    }
  }

  // Save meter information
  async saveMeterInfo(meters: MeterInfo[]): Promise<{ added: number; skipped: number }> {
    try {
      const { data: result, error } = await this.supabase
        .from('meters')
        .upsert(meters, { 
          onConflict: 'school_name,mpan,energy_type',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      return {
        added: result?.length || 0,
        skipped: 0
      };
    } catch (error) {
      console.error('Error saving meter info:', error);
      throw error;
    }
  }

  // Save extraction run information
  async saveExtractionRun(run: ExtractionRun): Promise<string> {
    try {
      const { data: result, error } = await this.supabase
        .from('extraction_runs')
        .insert(run)
        .select('id')
        .single();

      if (error) throw error;

      return result.id;
    } catch (error) {
      console.error('Error saving extraction run:', error);
      throw error;
    }
  }

  // Get energy data for dashboard
  async getEnergyData(filters?: {
    schoolName?: string;
    year?: number;
    month?: string;
    energyType?: string;
  }): Promise<EnergyData[]> {
    try {
      let query = this.supabase
        .from('energy_data')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (filters?.schoolName) {
        query = query.eq('school_name', filters.schoolName);
      }
      if (filters?.year) {
        query = query.eq('year', filters.year);
      }
      if (filters?.month) {
        query = query.eq('month', filters.month);
      }
      if (filters?.energyType) {
        query = query.eq('energy_type', filters.energyType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching energy data:', error);
      throw error;
    }
  }

  // Get meter information
  async getMeterInfo(schoolName?: string): Promise<MeterInfo[]> {
    try {
      let query = this.supabase
        .from('meters')
        .select('*')
        .order('school_name');

      if (schoolName) {
        query = query.eq('school_name', schoolName);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching meter info:', error);
      throw error;
    }
  }

  // Get extraction run history
  async getExtractionRuns(schoolName?: string): Promise<ExtractionRun[]> {
    try {
      let query = this.supabase
        .from('extraction_runs')
        .select('*')
        .order('created_at', { ascending: false });

      if (schoolName) {
        query = query.eq('school_name', schoolName);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching extraction runs:', error);
      throw error;
    }
  }

  // Get dashboard statistics
  async getDashboardStats(schoolName?: string): Promise<{
    totalRecords: number;
    totalKwh: number;
    totalCost: number;
    activeMeters: number;
    lastExtraction: string | null;
  }> {
    try {
      // Get energy data stats
      let energyQuery = this.supabase
        .from('energy_data')
        .select('total_kwh, total_cost');

      if (schoolName) {
        energyQuery = energyQuery.eq('school_name', schoolName);
      }

      const { data: energyData, error: energyError } = await energyQuery;

      if (energyError) throw energyError;

      // Get meter count
      let meterQuery = this.supabase
        .from('meters')
        .select('id', { count: 'exact' });

      if (schoolName) {
        meterQuery = meterQuery.eq('school_name', schoolName);
      }

      const { count: meterCount, error: meterError } = await meterQuery;

      if (meterError) throw meterError;

      // Get last extraction
      let extractionQuery = this.supabase
        .from('extraction_runs')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (schoolName) {
        extractionQuery = extractionQuery.eq('school_name', schoolName);
      }

      const { data: lastExtraction, error: extractionError } = await extractionQuery;

      if (extractionError) throw extractionError;

      const totalKwh = energyData?.reduce((sum: number, record: any) => sum + (record.total_kwh || 0), 0) || 0;
      const totalCost = energyData?.reduce((sum: number, record: any) => sum + (record.total_cost || 0), 0) || 0;

      return {
        totalRecords: energyData?.length || 0,
        totalKwh,
        totalCost,
        activeMeters: meterCount || 0,
        lastExtraction: lastExtraction?.[0]?.created_at || null
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}

// Factory function to create Supabase storage instance
export function createSupabaseStorage(projectId: string): SupabaseEnergyStorage {
  // In a real implementation, you'd get these from environment variables or a config service
  const config: SupabaseConfig = {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    projectId
  };

  return new SupabaseEnergyStorage(config);
}
