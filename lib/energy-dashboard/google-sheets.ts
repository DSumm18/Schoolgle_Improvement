import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { EnergyData, MeterInfo, TransformedEnergyRecord } from '@/types/energy-dashboard';
import { getServiceAccountAuth } from './google-auth';

const sheets = google.sheets('v4');

const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getSpreadsheetId(): string {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_ID is not configured.');
  }
  return spreadsheetId;
}

async function getSheetsAuth(): Promise<string | JWT> {
  const hasServiceAccount =
    Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);

  if (hasServiceAccount) {
    return getServiceAccountAuth(SHEETS_SCOPES);
  }

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Sheets credentials are missing.');
  }

  return apiKey;
}

function parseNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = parseFloat(value.replace(/£/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function getMeterData(): Promise<MeterInfo[]> {
  try {
    const auth = await getSheetsAuth();
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: getSpreadsheetId(),
      range: 'Meters!A:E',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

    return rows.slice(1).map((row) => ({
      schoolName: row[0] || '',
      address: row[1] || '',
      mpan: row[2] || '',
      energyType: (row[3] || 'Electricity') as 'Electricity' | 'Gas',
      meterNumber: row[4] || '',
    }));
  } catch (error) {
    console.error('Error fetching meter data:', error);
    return [];
  }
}

export async function getEnergyData(mpan: string): Promise<EnergyData[]> {
  try {
    const auth = await getSheetsAuth();
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: getSpreadsheetId(),
      range: `${mpan}!A:F`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

    return rows.slice(1).map((row) => ({
      schoolName: row[0] || '',
      meterNumber: mpan,
      energyType: (row[1] || 'Electricity') as 'Electricity' | 'Gas',
      year: parseInt(row[2]) || new Date().getFullYear(),
      month: row[3] || '',
      totalKwh: parseFloat(row[4]) || 0,
      totalCost: parseNumber(row[5]),
    }));
  } catch (error) {
    console.error(`Error fetching energy data for ${mpan}:`, error);
    return [];
  }
}

export async function getAllEnergyData(): Promise<EnergyData[]> {
  try {
    const meters = await getMeterData();
    const allData: EnergyData[] = [];

    for (const meter of meters) {
      if (meter.mpan) {
        const meterData = await getEnergyData(meter.mpan);
        const withMeta = meterData.map((entry) => ({
          ...entry,
          address: meter.address,
          mpan: meter.mpan,
        }));
        allData.push(...withMeta);
      }
    }

    return allData;
  } catch (error) {
    console.error('Error fetching all energy data:', error);
    return [];
  }
}

function hasServiceAccount(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

export async function upsertMeters(meters: MeterInfo[]): Promise<{ added: number; skipped: number }> {
  if (!hasServiceAccount() || meters.length === 0) {
    return { added: 0, skipped: meters.length };
  }

  const auth = await getServiceAccountAuth(SHEETS_SCOPES);
  const spreadsheetId = getSpreadsheetId();

  const existingRowsResponse = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: 'Meters!A:E',
  });

  const existingRows = existingRowsResponse.data.values || [];
  const header = existingRows[0] || [];
  const existingEntries = new Set(
    existingRows
      .slice(1)
      .map((row) => `${row[0]}|${row[2]}|${row[4]}`)
  );

  const rowsToAppend = meters
    .filter((meter) => {
      const key = `${meter.schoolName}|${meter.mpan}|${meter.meterNumber}`;
      const alreadyExists = existingEntries.has(key);
      if (!alreadyExists) {
        existingEntries.add(key);
      }
      return !alreadyExists;
    })
    .map((meter) => [
      meter.schoolName,
      meter.address,
      meter.mpan,
      meter.energyType,
      meter.meterNumber,
    ]);

  if (rowsToAppend.length === 0) {
    return { added: 0, skipped: meters.length };
  }

  if (existingRows.length === 0) {
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'Meters!A:E',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          header.length ? header : ['School', 'Address', 'MPAN/MPRN', 'Energy Type', 'Meter Number'],
          ...rowsToAppend,
        ],
      },
    });
  } else {
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'Meters!A:E',
      valueInputOption: 'RAW',
      requestBody: { values: rowsToAppend },
    });
  }

  return { added: rowsToAppend.length, skipped: meters.length - rowsToAppend.length };
}

export async function upsertEnergyDataRows(records: TransformedEnergyRecord[]): Promise<{ inserted: number; updated: number }> {
  if (!hasServiceAccount() || records.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  const auth = await getServiceAccountAuth(SHEETS_SCOPES);
  const spreadsheetId = getSpreadsheetId();

  const grouped = records.reduce<Record<string, TransformedEnergyRecord[]>>((acc, record) => {
    const key = record.mpan || record.meterNumber;
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {});

  let inserted = 0;
  let updated = 0;

  for (const [mpan, entries] of Object.entries(grouped)) {
    const sheetId = mpan;
    let rows: string[][] = [];

    try {
      const response = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: `${sheetId}!A:F`,
      });
      rows = response.data.values || [];
    } catch (error: any) {
      if (error?.code === 400 || error?.response?.status === 400) {
        await sheets.spreadsheets.batchUpdate({
          auth,
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetId,
                  },
                },
              },
            ],
          },
        });
        rows = [];
      } else {
        throw error;
      }
    }

    const header = rows[0] || ['School', 'Energy Type', 'Year', 'Month', 'Total kWh', 'Total Cost'];

    const existingMap = new Map<string, { rowIndex: number; values: string[] }>();
    rows.slice(1).forEach((row, index) => {
      const key = `${row[1]}|${row[2]}|${row[3]}`;
      existingMap.set(key, { rowIndex: index + 1, values: row });
    });

    const updates: { range: string; values: any[][] }[] = [];
    const appends: any[][] = [];

    entries.forEach((entry) => {
      const key = `${entry.energyType}|${entry.year}|${entry.month}`;
      const costValue = entry.totalCost !== undefined ? entry.totalCost : '';
      if (existingMap.has(key)) {
        const { rowIndex } = existingMap.get(key)!;
        updates.push({
          range: `${sheetId}!A${rowIndex + 1}:F${rowIndex + 1}`,
          values: [[
            entry.schoolName,
            entry.energyType,
            entry.year,
            entry.month,
            entry.totalKwh,
            costValue,
          ]],
        });
        updated += 1;
      } else {
        appends.push([
          entry.schoolName,
          entry.energyType,
          entry.year,
          entry.month,
          entry.totalKwh,
          costValue,
        ]);
        inserted += 1;
      }
    });

    if (appends.length > 0 && rows.length === 0) {
      appends.unshift(header);
    }

    if (appends.length > 0) {
      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: `${sheetId}!A:F`,
        valueInputOption: 'RAW',
        requestBody: { values: appends },
      });
    }

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        auth,
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updates,
        },
      });
    }
  }

  return { inserted, updated };
}

export function getMockEnergyData(): EnergyData[] {
  const mock: EnergyData[] = [
    { schoolName: 'Hollingwood Primary School', meterNumber: '2378152210187', energyType: 'Electricity', year: 2025, month: 'September', totalKwh: 11329.9 },
    { schoolName: 'Hollingwood Primary School', meterNumber: '2378152210187', energyType: 'Electricity', year: 2025, month: 'October', totalKwh: 14318.5 },
    { schoolName: 'Hollingwood Primary School', meterNumber: '2378152210187', energyType: 'Electricity', year: 2025, month: 'November', totalKwh: 17288.4 },
    { schoolName: 'Hollingwood Primary School', meterNumber: '2378152210187', energyType: 'Electricity', year: 2025, month: 'December', totalKwh: 15332.9 },
    { schoolName: 'Hollingwood Primary School', meterNumber: '2378152210187', energyType: 'Electricity', year: 2026, month: 'January', totalKwh: 18804.2 },
    { schoolName: 'Hollingwood Primary School', meterNumber: '2378152210187', energyType: 'Electricity', year: 2026, month: 'February', totalKwh: 19806.7 },

    { schoolName: 'Laycock Primary School', meterNumber: '2353299524521', energyType: 'Electricity', year: 2025, month: 'September', totalKwh: 9800 },
    { schoolName: 'Laycock Primary School', meterNumber: '2353299524521', energyType: 'Electricity', year: 2025, month: 'October', totalKwh: 11200 },
    { schoolName: 'Laycock Primary School', meterNumber: '2353299524521', energyType: 'Electricity', year: 2025, month: 'November', totalKwh: 10500 },

    { schoolName: 'Crossley Hall Primary School', meterNumber: '2314700704221', energyType: 'Electricity', year: 2024, month: 'September', totalKwh: 5957 },
    { schoolName: 'Crossley Hall Primary School', meterNumber: '2314700704221', energyType: 'Electricity', year: 2024, month: 'October', totalKwh: 8160 },
    { schoolName: 'Crossley Hall Primary School', meterNumber: '2314700704221', energyType: 'Electricity', year: 2024, month: 'November', totalKwh: 5987.3 },
    { schoolName: 'Crossley Hall Primary School', meterNumber: '2314700704221', energyType: 'Electricity', year: 2024, month: 'December', totalKwh: 7769.7 },

    { schoolName: 'Clayton Village Primary', meterNumber: '2315811875711', energyType: 'Electricity', year: 2025, month: 'October', totalKwh: 7500 },
    { schoolName: 'Clayton Village Primary', meterNumber: '2315811875711', energyType: 'Electricity', year: 2025, month: 'November', totalKwh: 8200 },

    { schoolName: 'Farnham Primary School', meterNumber: '2315511999614', energyType: 'Electricity', year: 2025, month: 'October', totalKwh: 12000 },
    { schoolName: 'Farnham Primary School', meterNumber: '2315511999614', energyType: 'Electricity', year: 2025, month: 'November', totalKwh: 13500 },

    { schoolName: 'Lidget Green Primary School', meterNumber: '0239951231318', energyType: 'Electricity', year: 2025, month: 'September', totalKwh: 15000 },
    { schoolName: 'Lidget Green Primary School', meterNumber: '0239951231318', energyType: 'Electricity', year: 2025, month: 'October', totalKwh: 16500 },
    { schoolName: 'Lidget Green Primary School', meterNumber: '0623830623108', energyType: 'Electricity', year: 2025, month: 'September', totalKwh: 4500 },
    { schoolName: 'Lidget Green Primary School', meterNumber: '0623830623108', energyType: 'Electricity', year: 2025, month: 'October', totalKwh: 5000 },

    { schoolName: 'Grove House Primary School', meterNumber: '0028024408', energyType: 'Gas', year: 2025, month: 'October', totalKwh: 18200 },
    { schoolName: 'Grove House Primary School', meterNumber: '0028024408', energyType: 'Gas', year: 2025, month: 'November', totalKwh: 22500 },
    { schoolName: 'Grove House Primary School', meterNumber: '0015562208', energyType: 'Electricity', year: 2025, month: 'October', totalKwh: 8800 },
    { schoolName: 'Grove House Primary School', meterNumber: '0015562208', energyType: 'Electricity', year: 2025, month: 'November', totalKwh: 9200 },

    { schoolName: 'Grange Road First & Middle School', meterNumber: '0152639598', energyType: 'Gas', year: 2025, month: 'October', totalKwh: 21000 },
    { schoolName: 'Grange Road First & Middle School', meterNumber: '0152639598', energyType: 'Gas', year: 2025, month: 'November', totalKwh: 25000 },
    { schoolName: 'Grange Road First & Middle School', meterNumber: '0638202202', energyType: 'Electricity', year: 2025, month: 'October', totalKwh: 11500 },
    { schoolName: 'Grange Road First & Middle School', meterNumber: '0638202202', energyType: 'Electricity', year: 2025, month: 'November', totalKwh: 12500 },

    { schoolName: 'Fairweather Green First & Middle', meterNumber: '04705039836', energyType: 'Gas', year: 2025, month: 'October', totalKwh: 19000 },
    { schoolName: 'Fairweather Green First & Middle', meterNumber: '04705039836', energyType: 'Gas', year: 2025, month: 'November', totalKwh: 23000 },
  ];

  return mock.map((entry) => ({
    ...entry,
    totalCost: parseFloat((entry.totalKwh * 0.18).toFixed(2)),
  }));
}

// File tracking functions
export async function isFileProcessed(fileName: string, filePath: string): Promise<boolean> {
  try {
    const auth = await getSheetsAuth();
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: getSpreadsheetId(),
      range: 'ProcessedFiles!A:C',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return false;

    return rows.some((row, index) => {
      if (index === 0) return false;
      return row[0] === fileName && row[1] === filePath;
    });
  } catch (error) {
    console.error('Error checking if file is processed:', error);
    return false;
  }
}

export async function markFileAsProcessed(
  fileName: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  status: 'processed' | 'failed' = 'processed',
  errorMessage?: string
): Promise<void> {
  try {
    const auth = await getSheetsAuth();
    const spreadsheetId = getSpreadsheetId();

    // Ensure ProcessedFiles sheet exists
    await ensureProcessedFilesSheet(auth, spreadsheetId);

    // Add new record
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'ProcessedFiles!A:G',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          fileName,
          filePath,
          fileSize,
          mimeType,
          new Date().toISOString(),
          status,
          errorMessage || ''
        ]]
      }
    });
  } catch (error) {
    console.error('Error marking file as processed:', error);
  }
}

async function ensureProcessedFilesSheet(auth: any, spreadsheetId: string): Promise<void> {
  try {
    await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'ProcessedFiles!A1:G1',
    });
  } catch (error) {
    // Create sheet with headers
    await sheets.spreadsheets.batchUpdate({
      auth,
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: 'ProcessedFiles',
              gridProperties: { rowCount: 1000, columnCount: 7 }
            }
          }
        }]
      }
    });

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: 'ProcessedFiles!A1:G1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'File Name', 'File Path', 'File Size', 'MIME Type',
          'Processed At', 'Status', 'Error Message'
        ]]
      }
    });
  }
}

// Create a summary sheet for extracted invoice data
export async function createInvoiceExtractSummary(records: any[]): Promise<void> {
  try {
    const auth = await getSheetsAuth();
    const spreadsheetId = getSpreadsheetId();

    // Create or update the InvoiceExtractSummary sheet
    try {
      await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'InvoiceExtractSummary!A1:L1',
      });
    } catch (error) {
      // Create sheet with headers
      await sheets.spreadsheets.batchUpdate({
        auth,
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'InvoiceExtractSummary',
                gridProperties: { rowCount: 1000, columnCount: 12 }
              }
            }
          }]
        }
      });

      await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: 'InvoiceExtractSummary!A1:L1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Extract Date', 'School Name', 'Supplier', 'Document Type', 
            'Invoice Period', 'Total Amount', 'Energy Consumed (kWh)', 
            'Meter Serial', 'MPRN', 'Source File', 'Status', 'Notes'
          ]]
        }
      });
    }

    // Add new records
    const newRows = records.map(record => [
      new Date().toISOString(),
      record.siteName || 'Unknown',
      record.supplier || 'Unknown',
      record.documentType || 'Invoice',
      record.invoicePeriod || 'Unknown',
      record.totalAmount || 0,
      record.energyConsumed || 0,
      record.meterSerial || 'Unknown',
      record.mprn || 'Unknown',
      record.sourceFileName || 'Unknown',
      'Processed',
      'Extracted via AI'
    ]);

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'InvoiceExtractSummary!A:L',
      valueInputOption: 'RAW',
      requestBody: {
        values: newRows
      }
    });
  } catch (error) {
    console.error('Error creating invoice extract summary:', error);
  }
}

// Create a new Google Sheet for each extraction run
export async function createExtractionSheet(records: any[]): Promise<string> {
  try {
    const auth = await getSheetsAuth();
    const timestamp = new Date().toISOString().split('T')[0]; // 2025-01-26
    const sheetName = `Energy Extract ${timestamp}`;
    
    // Create new spreadsheet
    const newSheet = await sheets.spreadsheets.create({
      auth,
      requestBody: {
        properties: {
          title: sheetName
        },
        sheets: [
          {
            properties: {
              title: 'Meters',
              gridProperties: { rowCount: 1000, columnCount: 5 }
            }
          },
          {
            properties: {
              title: 'ProcessedFiles',
              gridProperties: { rowCount: 1000, columnCount: 7 }
            }
          },
          {
            properties: {
              title: 'InvoiceExtractSummary',
              gridProperties: { rowCount: 1000, columnCount: 12 }
            }
          }
        ]
      }
    });

    const newSpreadsheetId = newSheet.data.spreadsheetId!;
    
    // Set up the Meters sheet headers
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: newSpreadsheetId,
      range: 'Meters!A1:E1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['School Name', 'Address', 'MPAN', 'Energy Type', 'Meter Number']]
      }
    });

    // Set up the ProcessedFiles sheet headers
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: newSpreadsheetId,
      range: 'ProcessedFiles!A1:G1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['File Name', 'File Path', 'File Size', 'MIME Type', 'Processed At', 'Status', 'Error Message']]
      }
    });

    // Set up the InvoiceExtractSummary sheet headers
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: newSpreadsheetId,
      range: 'InvoiceExtractSummary!A1:L1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Extract Date', 'School Name', 'Supplier', 'Document Type', 'Invoice Period', 'Total Amount', 'Energy Consumed (kWh)', 'Meter Serial', 'MPRN', 'Source File', 'Status', 'Notes']]
      }
    });

    return newSpreadsheetId;
  } catch (error) {
    console.error('Error creating extraction sheet:', error);
    throw error;
  }
}

// Save extraction data to a specific sheet
export async function saveExtractionToSheet(spreadsheetId: string, records: any[]): Promise<void> {
  try {
    // Temporarily override the spreadsheet ID for this operation
    const originalSpreadsheetId = process.env.GOOGLE_SHEETS_ID;
    process.env.GOOGLE_SHEETS_ID = spreadsheetId;
    
    // Transform records to energy data format
    const energyRecords = records.map(record => {
      const isCreditNote = record.documentType === 'Credit Note' || 
                          record.sourceFileName?.toLowerCase().includes('credit') ||
                          record.totalAmount < 0;
      
      // Parse invoice period for better date handling
      const periodMatch = record.invoicePeriod?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      const year = periodMatch ? parseInt(periodMatch[3]) : new Date().getFullYear();
      const monthNum = periodMatch ? parseInt(periodMatch[2]) : new Date().getMonth() + 1;
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const month = months[monthNum - 1] || 'Unknown';
      
      return {
        schoolName: record.siteName || 'Unknown',
        meterNumber: record.meterSerial || record.mprn || 'Unknown',
        energyType: (record.supplier?.toLowerCase().includes('gas') ? 'Gas' : 'Electricity') as 'Electricity' | 'Gas',
        year,
        month,
        totalKwh: isCreditNote ? 0 : record.energyConsumed || 0,
        totalCost: isCreditNote ? Math.abs(record.totalAmount) * -1 : record.totalAmount || 0,
        mpan: record.mprn
      };
    });

    // Save to the new sheet
    await upsertEnergyDataRows(energyRecords);
    
    // Create summary in the new sheet
    await createInvoiceExtractSummary(records);
    
    // Restore original spreadsheet ID
    process.env.GOOGLE_SHEETS_ID = originalSpreadsheetId;
  } catch (error) {
    console.error('Error saving extraction to sheet:', error);
    throw error;
  }
}