import { parse, isValid, format } from 'date-fns';
import { InvoiceExtractionResult, MeterInfo, TransformedEnergyRecord } from '@/types/energy-dashboard';
import { listPendingInvoiceFiles, downloadDriveFile, markFileAsProcessed } from './google-drive';
import { upsertEnergyDataRows, upsertMeters } from './google-sheets';

const FALLBACK_MODEL = 'gemini-1.5-flash';

type GenerativeAIModule = typeof import('@google/generative-ai');

let generativeAiModule: GenerativeAIModule | null = null;

async function loadGenerativeAi(): Promise<GenerativeAIModule> {
  if (generativeAiModule) {
    return generativeAiModule;
  }

  try {
    generativeAiModule = await import('@google/generative-ai');
    return generativeAiModule;
  } catch {
    throw new Error('The @google/generative-ai package is not installed. Run `npm install @google/generative-ai`.');
  }
}

function buildExtractionSchema(SchemaType: GenerativeAIModule['SchemaType']) {
  return {
    type: SchemaType.OBJECT,
    properties: {
      documentType: { type: SchemaType.STRING },
      supplier: { type: SchemaType.STRING },
      invoicePeriod: { type: SchemaType.STRING },
      totalAmount: { type: SchemaType.NUMBER },
      energyConsumed: { type: SchemaType.NUMBER },
      correctionFactor: { type: SchemaType.NUMBER, nullable: true },
      calorificValue: { type: SchemaType.NUMBER, nullable: true },
      meterSerial: { type: SchemaType.STRING, nullable: true },
      mprn: { type: SchemaType.STRING, nullable: true },
      previousRead: {
        type: SchemaType.OBJECT,
        properties: {
          value: { type: SchemaType.STRING },
          date: { type: SchemaType.STRING },
        },
        nullable: true,
      },
      currentRead: {
        type: SchemaType.OBJECT,
        properties: {
          value: { type: SchemaType.STRING },
          date: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
        },
        nullable: true,
      },
      siteName: { type: SchemaType.STRING, nullable: true },
    },
    required: ['documentType', 'supplier', 'invoicePeriod', 'totalAmount', 'energyConsumed'],
  };
}

const DATE_FORMATS = ['dd/MM/yyyy', 'd/M/yyyy', 'yyyy-MM-dd', 'dd MMM yyyy'];

function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  for (const formatString of DATE_FORMATS) {
    const parsed = parse(value.trim(), formatString, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function parseInvoicePeriod(period: string): { start?: Date; end?: Date } {
  const [startRaw, endRaw] = period.split(/to|-/i).map((part) => part.trim());
  return {
    start: parseDate(startRaw),
    end: parseDate(endRaw),
  };
}

function inferEnergyType(invoice: InvoiceExtractionResult): 'Electricity' | 'Gas' {
  const reference = invoice.mprn || invoice.meterSerial || '';
  if (/^\d{11,13}$/.test(reference)) {
    return 'Electricity';
  }
  return 'Gas';
}

function normaliseMeters(meters: MeterInfo[]): MeterInfo[] {
  const seen = new Set<string>();
  return meters.filter((meter) => {
    const key = `${meter.schoolName}|${meter.mpan}|${meter.meterNumber}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normaliseRecords(records: TransformedEnergyRecord[]): TransformedEnergyRecord[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = `${record.schoolName}|${record.meterNumber}|${record.energyType}|${record.year}|${record.month}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function extractInvoice(buffer: Buffer, mimeType: string, schoolName?: string): Promise<InvoiceExtractionResult> {
  const apiKey = process.env.GENAI_API_KEY;
  if (!apiKey) {
    throw new Error('GENAI_API_KEY is not configured.');
  }

  const modelName = process.env.GENAI_MODEL ?? FALLBACK_MODEL;
  const { GoogleGenerativeAI, SchemaType } = await loadGenerativeAi();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: buildExtractionSchema(SchemaType),
    },
  });

  const prompt = `Analyse this energy invoice${schoolName ? ` for ${schoolName}` : ''} and return structured data.`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: bufferToBase64(buffer),
      },
    },
    { text: prompt },
  ]);

  const text = result.response?.text();
  if (!text) {
    throw new Error('No structured response returned from the generative model.');
  }

  return JSON.parse(text) as InvoiceExtractionResult;
}

function transformInvoiceToRecords(invoice: InvoiceExtractionResult, schoolName?: string): { records: TransformedEnergyRecord[]; meter: MeterInfo | null } {
  const siteName = invoice.siteName || schoolName || 'Unknown Site';
  const { start, end } = parseInvoicePeriod(invoice.invoicePeriod);
  const referenceDate = end ?? start ?? new Date();
  const month = format(referenceDate, 'MMMM');
  const year = referenceDate.getFullYear();

  const multiplier = invoice.documentType === 'Credit Note' ? -1 : 1;
  const totalKwh = multiplier * Math.abs(invoice.energyConsumed);
  const totalCost = multiplier * Math.abs(invoice.totalAmount);

  const energyType = inferEnergyType(invoice);
  const meterNumber = invoice.meterSerial || invoice.mprn || `${siteName}-meter`;
  const mpan = invoice.mprn;

  const record: TransformedEnergyRecord = {
    schoolName: siteName,
    meterNumber,
    energyType,
    year,
    month,
    totalKwh,
    totalCost,
    mpan,
  };

  const meter: MeterInfo | null = {
    schoolName: siteName,
    address: '',
    mpan: mpan || meterNumber,
    energyType,
    meterNumber,
  };

  return { records: [record], meter };
}

export interface DriveSyncSummary {
  processed: number;
  skipped: number;
  meterUpdates: number;
  recordsInserted: number;
  recordsUpdated: number;
  errors: { file: string; message: string }[];
}

export async function syncInvoicesFromDrive(): Promise<DriveSyncSummary> {
  const files = await listPendingInvoiceFiles();
  if (files.length === 0) {
    return {
      processed: 0,
      skipped: 0,
      meterUpdates: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      errors: [],
    };
  }

  const records: TransformedEnergyRecord[] = [];
  const meters: MeterInfo[] = [];
  const errors: { file: string; message: string }[] = [];

  for (const file of files) {
    try {
      const result = await downloadDriveFile(file.id, file.mimeType);
      const buffer = Buffer.isBuffer(result) ? result : result.data;
      const extraction = await extractInvoice(buffer, file.mimeType, file.schoolName);
      const { records: transformed, meter } = transformInvoiceToRecords(extraction, file.schoolName);
      records.push(...transformed);
      if (meter) {
        meters.push(meter);
      }
      await markFileAsProcessed(file.id);
    } catch (error: any) {
      errors.push({
        file: file.name,
        message: error?.message || 'Failed to process file',
      });
    }
  }

  const uniqueMeters = normaliseMeters(meters);
  const uniqueRecords = normaliseRecords(records);

  let meterResult = { added: 0, skipped: 0 };
  let energyResult = { inserted: 0, updated: 0 };

  if (uniqueMeters.length > 0) {
    meterResult = await upsertMeters(uniqueMeters);
  }

  if (uniqueRecords.length > 0) {
    energyResult = await upsertEnergyDataRows(uniqueRecords);
  }

  return {
    processed: uniqueRecords.length,
    skipped: records.length - uniqueRecords.length,
    meterUpdates: meterResult.added,
    recordsInserted: energyResult.inserted,
    recordsUpdated: energyResult.updated,
    errors,
  };
}
