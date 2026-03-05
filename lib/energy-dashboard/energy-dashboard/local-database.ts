import { promises as fs } from 'fs';
import path from 'path';
import type { ExtractedInvoiceRecord, EnergyData } from '@/types/energy-dashboard';

const DATA_DIR = path.join(process.cwd(), 'data');
const EXTRACTIONS_FILE = path.join(DATA_DIR, 'extractions.json');
const ENERGY_DATA_FILE = path.join(DATA_DIR, 'energy-data.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Interface for extraction runs
export interface ExtractionRun {
  id: string;
  name: string;
  timestamp: string;
  recordCount: number;
  processedCount: number;
  skippedCount: number;
  errors: { file: string; message: string }[];
  records: ExtractedInvoiceRecord[];
  energyData: EnergyData[];
}

// Interface for stored extractions
interface StoredExtractions {
  runs: ExtractionRun[];
  currentRunId: string | null;
}

// Transform extracted invoice to energy data
function transformToEnergyData(record: ExtractedInvoiceRecord): EnergyData {
  const isCreditNote = record.documentType === 'Credit Note' || 
                      record.sourceFileName.toLowerCase().includes('credit') ||
                      record.totalAmount < 0;

  // Parse invoice period
  const periodMatch = record.invoicePeriod.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const year = periodMatch ? parseInt(periodMatch[3]) : new Date().getFullYear();
  const monthNum = periodMatch ? parseInt(periodMatch[2]) : new Date().getMonth() + 1;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[monthNum - 1] || 'Unknown';

  return {
    schoolName: record.siteName || 'Unknown',
    meterNumber: record.meterSerial || record.mprn || 'Unknown',
    energyType: record.supplier?.toLowerCase().includes('gas') ? 'Gas' : 'Electricity',
    year,
    month,
    totalKwh: isCreditNote ? 0 : record.energyConsumed || 0,
    totalCost: isCreditNote ? Math.abs(record.totalAmount) * -1 : record.totalAmount || 0,
    mpan: record.mprn
  };
}

// Save extraction run to local database
export async function saveExtractionRun(
  records: ExtractedInvoiceRecord[],
  processedCount: number,
  skippedCount: number,
  errors: { file: string; message: string }[],
  runName?: string
): Promise<ExtractionRun> {
  await ensureDataDir();

  const runId = `extract_${Date.now()}`;
  const timestamp = new Date().toISOString();
  const name = runName || `Energy Extract ${new Date().toLocaleDateString()}`;

  // Transform records to energy data
  const energyData = records.map(transformToEnergyData);

  const extractionRun: ExtractionRun = {
    id: runId,
    name,
    timestamp,
    recordCount: records.length,
    processedCount,
    skippedCount,
    errors,
    records,
    energyData
  };

  // Load existing extractions
  let storedExtractions: StoredExtractions = { runs: [], currentRunId: null };
  try {
    const data = await fs.readFile(EXTRACTIONS_FILE, 'utf-8');
    storedExtractions = JSON.parse(data);
  } catch {
    // File doesn't exist, start fresh
  }

  // Add new run
  storedExtractions.runs.unshift(extractionRun); // Add to beginning
  storedExtractions.currentRunId = runId;

  // Keep only last 10 runs to prevent file from growing too large
  if (storedExtractions.runs.length > 10) {
    storedExtractions.runs = storedExtractions.runs.slice(0, 10);
  }

  // Save to file
  await fs.writeFile(EXTRACTIONS_FILE, JSON.stringify(storedExtractions, null, 2));

  // Also save current energy data for quick access
  await fs.writeFile(ENERGY_DATA_FILE, JSON.stringify(energyData, null, 2));

  return extractionRun;
}

// Get all extraction runs
export async function getAllExtractionRuns(): Promise<ExtractionRun[]> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(EXTRACTIONS_FILE, 'utf-8');
    const storedExtractions: StoredExtractions = JSON.parse(data);
    return storedExtractions.runs;
  } catch {
    return [];
  }
}

// Get current extraction run
export async function getCurrentExtractionRun(): Promise<ExtractionRun | null> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(EXTRACTIONS_FILE, 'utf-8');
    const storedExtractions: StoredExtractions = JSON.parse(data);
    
    if (!storedExtractions.currentRunId) {
      return null;
    }

    return storedExtractions.runs.find(run => run.id === storedExtractions.currentRunId) || null;
  } catch {
    return null;
  }
}

// Get energy data from current run
export async function getCurrentEnergyData(): Promise<EnergyData[]> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(ENERGY_DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Get energy data from specific run
export async function getEnergyDataFromRun(runId: string): Promise<EnergyData[]> {
  const runs = await getAllExtractionRuns();
  const run = runs.find(r => r.id === runId);
  return run ? run.energyData : [];
}

// Set current run
export async function setCurrentRun(runId: string): Promise<boolean> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(EXTRACTIONS_FILE, 'utf-8');
    const storedExtractions: StoredExtractions = JSON.parse(data);
    
    const run = storedExtractions.runs.find(r => r.id === runId);
    if (!run) {
      return false;
    }

    storedExtractions.currentRunId = runId;
    await fs.writeFile(EXTRACTIONS_FILE, JSON.stringify(storedExtractions, null, 2));
    
    // Update current energy data file
    await fs.writeFile(ENERGY_DATA_FILE, JSON.stringify(run.energyData, null, 2));
    
    return true;
  } catch {
    return false;
  }
}

// Delete extraction run
export async function deleteExtractionRun(runId: string): Promise<boolean> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(EXTRACTIONS_FILE, 'utf-8');
    const storedExtractions: StoredExtractions = JSON.parse(data);
    
    const runIndex = storedExtractions.runs.findIndex(r => r.id === runId);
    if (runIndex === -1) {
      return false;
    }

    // Remove the run
    storedExtractions.runs.splice(runIndex, 1);

    // If this was the current run, set a new current run
    if (storedExtractions.currentRunId === runId) {
      storedExtractions.currentRunId = storedExtractions.runs.length > 0 ? storedExtractions.runs[0].id : null;
      
      // Update current energy data file
      if (storedExtractions.currentRunId) {
        const newCurrentRun = storedExtractions.runs[0];
        await fs.writeFile(ENERGY_DATA_FILE, JSON.stringify(newCurrentRun.energyData, null, 2));
      } else {
        await fs.writeFile(ENERGY_DATA_FILE, JSON.stringify([], null, 2));
      }
    }

    await fs.writeFile(EXTRACTIONS_FILE, JSON.stringify(storedExtractions, null, 2));
    return true;
  } catch {
    return false;
  }
}

// Get database statistics
export async function getDatabaseStats(): Promise<{
  totalRuns: number;
  totalRecords: number;
  currentRunId: string | null;
  currentRunName: string | null;
  currentRecordCount: number;
}> {
  const runs = await getAllExtractionRuns();
  const currentRun = await getCurrentExtractionRun();
  
  return {
    totalRuns: runs.length,
    totalRecords: runs.reduce((sum, run) => sum + run.recordCount, 0),
    currentRunId: currentRun?.id || null,
    currentRunName: currentRun?.name || null,
    currentRecordCount: currentRun?.recordCount || 0
  };
}
