import { promises as fs } from 'fs';
import path from 'path';
import type { ExtractedInvoiceRecord, EnergyData } from '@/types/energy-dashboard';
import { detectEnergyType } from './document-extraction';
import { getStorageBaseDir, setStorageBaseDir } from './storage-config';

interface StorageOptions {
  baseDir?: string;
}

async function resolveStorage(options?: StorageOptions) {
  const baseDir = options?.baseDir
    ? await setStorageBaseDir(options.baseDir)
    : await getStorageBaseDir();

  const csvDir = path.join(baseDir, 'csv-exports');

  await fs.mkdir(baseDir, { recursive: true });
  await fs.mkdir(csvDir, { recursive: true });

  const summaryPath = path.join(baseDir, 'latest-extraction.json');

  return {
    baseDir,
    csvDir,
    summaryPath,
  };
}

function parseReadingValue(value?: string): number | undefined {
  if (!value) return undefined;
  const numeric = value.replace(/[^0-9.-]/g, '').replace(/,/g, '');
  if (!numeric) return undefined;
  const parsed = parseFloat(numeric);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const stringValue = String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return '"' + escaped + '"';
}

function transformToEnergyData(record: ExtractedInvoiceRecord): EnergyData {
  const isCreditNote =
    record.documentType === 'Credit Note' ||
    record.sourceFileName.toLowerCase().includes('credit') ||
    record.totalAmount < 0;

  const periodMatch = record.invoicePeriod.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const year = periodMatch ? parseInt(periodMatch[3]) : new Date().getFullYear();
  const monthNum = periodMatch ? parseInt(periodMatch[2]) : new Date().getMonth() + 1;
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const month = months[monthNum - 1] || 'Unknown';

  let totalKwh = record.energyConsumed ?? 0;
  if ((!totalKwh || totalKwh === 0) && record.previousRead?.value && record.currentRead?.value) {
    const previousValue = parseReadingValue(record.previousRead.value);
    const currentValue = parseReadingValue(record.currentRead.value);
    if (previousValue !== undefined && currentValue !== undefined) {
      const difference = currentValue - previousValue;
      if (difference >= 0) {
        totalKwh = difference;
      }
    }
  }
  if (isCreditNote) {
    totalKwh = 0;
  }

  const amount = record.totalAmount ?? 0;
  const totalCost = isCreditNote ? -Math.abs(amount) : amount;

  const supplierForHeuristics = record.supplier || '';
  const energyType = detectEnergyType({
    supplier: supplierForHeuristics,
    mprn: record.mprn,
    fileName: record.sourceFileName,
    text: `${supplierForHeuristics} ${record.sourceFileName}`.trim(),
  });

  const meterNumber = record.meterSerial?.trim() || record.mprn?.trim() || 'Unknown';
  const mpan = record.mprn && record.mprn !== 'Unknown' ? record.mprn : undefined;

  return {
    schoolName: record.siteName || 'Unknown',
    meterNumber,
    energyType,
    year,
    month,
    totalKwh,
    totalCost,
    mpan,
  };
}

export async function saveExtractionToCSV(
  records: ExtractedInvoiceRecord[],
  schoolName: string = 'Unknown School',
  options?: StorageOptions,
): Promise<{ csvPath: string; recordCount: number; baseDir: string }> {
  const { baseDir, csvDir, summaryPath } = await resolveStorage(options);

  const timestamp = new Date().toISOString().split('T')[0];
  const csvFileName = `energy-data-${schoolName.replace(/\s+/g, '-')}-${timestamp}.csv`;
  const csvPath = path.join(csvDir, csvFileName);

  const energyData = records.map(transformToEnergyData);

  const csvHeaders = [
    'School Name',
    'Meter Serial',
    'MPRN',
    'MPAN',
    'Account Number',
    'Invoice Number',
    'Energy Type',
    'Year',
    'Month',
    'Total kWh',
    'Total Cost (GBP)',
    'Supplier',
    'Document Type',
    'Invoice Period',
    'Previous Reading',
    'Current Reading',
    'Extraction Date',
  ];

  const csvRows = energyData.map((record, index) => [
    record.schoolName,
    records[index]?.meterSerial || '',
    records[index]?.mprn || '',
    records[index]?.mpan || '',
    records[index]?.accountNumber || '',
    records[index]?.invoiceNumber || '',
    record.energyType,
    record.year,
    record.month,
    record.totalKwh,
    record.totalCost,
    records[index]?.supplier || 'Unknown',
    records[index]?.documentType || 'Invoice',
    records[index]?.invoicePeriod || '',
    records[index]?.previousRead?.value || '',
    records[index]?.currentRead?.value || '',
    new Date().toISOString(),
  ]);

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map((row) => row.map(formatCsvValue).join(',')),
  ].join('\n');

  await fs.writeFile(csvPath, csvContent, 'utf-8');

  const summary = {
    timestamp: new Date().toISOString(),
    schoolName,
    recordCount: records.length,
    csvPath: csvFileName,
    energyData,
    storageBaseDir: baseDir,
  };

  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

  return {
    csvPath: csvFileName,
    recordCount: records.length,
    baseDir,
  };
}

export async function getLatestExtractionData(): Promise<EnergyData[]> {
  try {
    const { summaryPath } = await resolveStorage();
    const summaryData = await fs.readFile(summaryPath, 'utf-8');
    const summary = JSON.parse(summaryData);
    return summary.energyData || [];
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code !== 'ENOENT') {
      console.error('Error reading latest extraction data:', error);
    }
    return [];
  }
}

export async function getAllCSVFiles(): Promise<
  Array<{ name: string; path: string; size: number; date: Date }>
> {
  try {
    const { csvDir } = await resolveStorage();
    const files = await fs.readdir(csvDir);

    const csvFiles = await Promise.all(
      files
        .filter((file) => file.endsWith('.csv'))
        .map(async (file) => {
          const filePath = path.join(csvDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            date: stats.mtime,
          };
        }),
    );

    return csvFiles.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Error reading CSV files:', error);
    return [];
  }
}

export async function readCSVFile(fileName: string): Promise<EnergyData[]> {
  try {
    const { csvDir } = await resolveStorage();
    const csvPath = path.join(csvDir, fileName);
    const csvContent = await fs.readFile(csvPath, 'utf-8');

    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map((h) => h.replace(/"/g, ''));

    const data: EnergyData[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map((v) => v.replace(/"/g, ''));
        const record: Record<string, string> = {};

        headers.forEach((header, index) => {
          record[header] = values[index];
        });

        data.push({
          schoolName: record['School Name'],
          meterNumber: record['Meter Number'],
          energyType: record['Energy Type'] as 'Electricity' | 'Gas',
          year: parseInt(record['Year'], 10),
          month: record['Month'],
          totalKwh: parseFloat(record['Total kWh']) || 0,
          totalCost: parseFloat(record['Total Cost (GBP)']) || 0,
          mpan: record['MPAN'],
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Error reading CSV file:', error);
    return [];
  }
}
