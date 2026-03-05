// Import directly from lib to avoid test file loading in pdf-parse/index.js
// @ts-ignore - pdf-parse doesn't export types from lib directly
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { parse, isValid, format } from 'date-fns';
import { ExtractedInvoiceRecord } from '@/types/energy-dashboard';

interface ExtractionResult {
  success: boolean;
  data?: ExtractedInvoiceRecord;
  error?: string;
}

const DATE_FORMATS = [
  'dd/MM/yyyy',
  'd/M/yyyy',
  'dd-MM-yyyy',
  'd-M-yyyy',
  'yyyy-MM-dd',
  'dd MMM yyyy',
  'd MMM yyyy',
];

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const SUPPLIER_KEYWORDS = [
  'British Gas',
  'BG Energy',
  'EDF Energy',
  'E.ON',
  'E.ON Next',
  'Scottish and Southern',
  'SSE',
  'Octopus Energy',
  'Scottish Power',
  'Bulb',
  'Total Energies',
  'TotalEnergies',
  'npower',
  'Shell Energy',
  'Crown Gas',
  'Yu Energy',
  'Engie',
];

const TOTAL_AMOUNT_PATTERNS = [
  new RegExp('Total\s+(?:Amount|Due|Charges|Payable)[:\-\s]+(?:\u00A3|GBP)?\s*([-()0-9.,]+(?:\s*CR)?)', 'i'),
  new RegExp('Amount\s+(?:Due|Payable)[:\-\s]+(?:\u00A3|GBP)?\s*([-()0-9.,]+(?:\s*CR)?)', 'i'),
  new RegExp('Balance\s+(?:Brought\s+Forward|Due)[:\-\s]+(?:\u00A3|GBP)?\s*([-()0-9.,]+(?:\s*CR)?)', 'i'),
  new RegExp('(?:\u00A3|GBP)\s*([-()0-9.,]+)(?:\s*CR)?\s*(?:Total|Amount)', 'i'),
];

const ENERGY_CONSUMED_PATTERNS = [
  /(?:Energy|Electricity|Gas|Consumption|Units)\s*(?:Consumed|Used|Usage)?[:\-\s]+([0-9.,]+)\s*kWh/i,
  /([0-9.,]+)\s*kWh\s*(?:Total|Used|Consumption|Usage)/i,
];

const MPRN_PATTERNS = [
  /(?:MPRN|Meter Point Reference Number)[:\-\s]+([0-9\s]{6,11})/i,
];

const MPAN_PATTERNS = [
  /(?:MPAN|Supply Number|Top Line)[:\-\s]+([0-9\s]{13,21})/i,
  /(?:S|Top Line)[:\-\s]?\s*([0-9]{2}\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{4}\s*[0-9]{3})/i,
];

const METER_SERIAL_PATTERNS = [
  /(?:Meter(?:\s+Serial)?|Serial(?:\s+Number)?|Meter\s+ID)[:\-\s]+([A-Z0-9\-]+)/i,
];

const ACCOUNT_NUMBER_PATTERNS = [
  /(?:Account(?:\s+Number)?|Account\s+Ref|Customer\s+Number|Customer\s+Account)[:\-\s]+([A-Z0-9\-\/]+)/i,
];

const INVOICE_NUMBER_PATTERNS = [
  /(?:Invoice(?:\s+Number)?|Invoice\s+Ref|Bill\s+Number|Reference)[:\-\s]+([A-Z0-9\-\/]+)/i,
];

const PERIOD_PATTERNS = [
  /(?:Billing|Invoice|Supply|Reading|Statement)\s*(?:Period|Dates|Range)?[:\-\s]+([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})\s*(?:to|-)\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
  /([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})\s*(?:to|-)\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
];

const PREVIOUS_READ_PATTERNS = [
  /(?:Previous|Start)\s*(?:Read(?:ing)?|Meter)[:\-\s]+([0-9.,]+)\s*(?:on)?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
];

const CURRENT_READ_PATTERNS = [
  /(?:Current|End)\s*(?:Read(?:ing)?|Meter)[:\-\s]+([0-9.,]+)\s*(?:on)?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
];

function normaliseWhitespace(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\f/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const { text } = await pdfParse(buffer);
  if (!text || !text.trim()) {
    throw new Error('No text content could be read from the document.');
  }
  return normaliseWhitespace(text);
}

function parseCurrency(raw?: string): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/CR/gi, '').replace(/credit/gi, '');
  const negative = /CR|credit|\(|\)|-/i.test(raw);
  const numeric = cleaned.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (!numeric) return undefined;
  const value = parseFloat(numeric);
  if (!Number.isFinite(value)) {
    return undefined;
  }
  return negative ? -Math.abs(value) : Math.abs(value);
}

function parseNumeric(raw?: string): number | undefined {
  if (!raw) return undefined;
  const numeric = raw.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (!numeric) return undefined;
  const value = parseFloat(numeric);
  return Number.isFinite(value) ? value : undefined;
}



function matchFirst(text: string, patterns: RegExp[]): RegExpMatchArray | null {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      return match;
    }
  }
  return null;
}

function normaliseDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const trimmed = dateStr.trim().replace(/\s{2,}/g, ' ');
  for (const formatString of DATE_FORMATS) {
    const parsed = parse(trimmed, formatString, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'dd/MM/yyyy');
    }
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return format(parsed, 'dd/MM/yyyy');
  }
  return undefined;
}

function buildPeriod(startRaw?: string, endRaw?: string, text?: string): string {
  const start = normaliseDate(startRaw);
  const end = normaliseDate(endRaw);
  if (start && end) {
    return `${start} - ${end}`;
  }
  if (start) {
    return start;
  }
  if (end) {
    return end;
  }

  if (text) {
    const monthMatch = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2}|19\d{2})/i);
    if (monthMatch) {
      const monthIndex = MONTH_NAMES.indexOf(monthMatch[1].toLowerCase());
      const year = parseInt(monthMatch[2], 10);
      if (monthIndex >= 0 && !Number.isNaN(year)) {
        const startDate = new Date(year, monthIndex, 1);
        const endDate = new Date(year, monthIndex + 1, 0);
        return `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
      }
    }
  }

  return 'Unknown Period';
}

function extractReading(text: string, patterns: RegExp[]): { value: string; date: string; type?: string } | undefined {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const value = match[1];
      const date = normaliseDate(match[2]) ?? match[2];
      const windowStart = Math.max(0, match.index - 40);
      const windowEnd = Math.min(text.length, match.index + match[0].length + 40);
      const surrounding = text.slice(windowStart, windowEnd).toLowerCase();
      const type = surrounding.includes('estimate') ? 'Estimated' : 'Actual';
      return {
        value,
        date,
        type,
      };
    }
  }
  return undefined;
}

function computeConsumption(previous?: { value: string }, current?: { value: string }): number | undefined {
  if (!previous?.value || !current?.value) return undefined;
  const previousValue = parseNumeric(previous.value);
  const currentValue = parseNumeric(current.value);
  if (previousValue === undefined || currentValue === undefined) {
    return undefined;
  }
  const difference = currentValue - previousValue;
  return difference >= 0 ? difference : undefined;
}

function detectSupplier(text: string): string | undefined {
  for (const keyword of SUPPLIER_KEYWORDS) {
    const pattern = new RegExp(keyword.replace(/\./g, '\\.'), 'i');
    if (pattern.test(text)) {
      return keyword;
    }
  }
  const firstLine = text.split('\n').map((line) => line.trim()).find((line) => line.length > 0);
  return firstLine?.slice(0, 80);
}



export function detectEnergyType(args: { supplier?: string; mprn?: string; fileName: string; text: string }): 'Electricity' | 'Gas' {
  const { supplier, mprn, fileName, text } = args;
  const number = mprn ? mprn.replace(/\D/g, '') : '';
  if (number.length >= 12) {
    return 'Electricity';
  }
  if (number.length > 0 && number.length <= 11) {
    return 'Gas';
  }

  const haystack = `${supplier ?? ''} ${fileName} ${text}`.toLowerCase();
  if (haystack.includes('gas')) {
    return 'Gas';
  }
  if (haystack.includes('electric')) {
    return 'Electricity';
  }

  return 'Electricity';
}

function isCreditDocument(fileName: string, text: string, amount?: number): boolean {
  const lowerName = fileName.toLowerCase();
  const lowerText = text.toLowerCase();
  if (lowerName.includes('credit') || lowerName.includes('crn')) {
    return true;
  }
  if (lowerText.includes('credit note') || lowerText.includes('credit amount')) {
    return true;
  }
  if (amount !== undefined && amount < 0) {
    return true;
  }
  return false;
}

export async function extractInvoiceData(
  buffer: Buffer,
  fileName: string,
  siteName: string
): Promise<ExtractionResult> {
  try {
    const text = await extractTextFromPDF(buffer);

    const supplier = detectSupplier(text) ?? 'Unknown Supplier';
    const periodMatch = matchFirst(text, PERIOD_PATTERNS);
    const invoicePeriod = buildPeriod(periodMatch?.[1], periodMatch?.[2], text);

    const totalAmountMatch = matchFirst(text, TOTAL_AMOUNT_PATTERNS);
    const totalAmount = parseCurrency(totalAmountMatch?.[1]) ?? 0;

    const previousRead = extractReading(text, PREVIOUS_READ_PATTERNS);
    const currentRead = extractReading(text, CURRENT_READ_PATTERNS);

    const energyMatch = matchFirst(text, ENERGY_CONSUMED_PATTERNS);
    let energyConsumed = parseNumeric(energyMatch?.[1]) ?? computeConsumption(previousRead, currentRead) ?? 0;

    const mprnMatch = matchFirst(text, MPRN_PATTERNS);
    const mprn = mprnMatch?.[1]?.replace(/\s+/g, '') ?? 'Unknown';

    const mpanMatch = matchFirst(text, MPAN_PATTERNS);
    const mpan = mpanMatch?.[1]?.replace(/\s+/g, '');

    const meterSerialMatch = matchFirst(text, METER_SERIAL_PATTERNS);
    const meterSerial = meterSerialMatch?.[1] ?? 'Unknown';

    const accountNumberMatch = matchFirst(text, ACCOUNT_NUMBER_PATTERNS);
    const accountNumber = accountNumberMatch?.[1];

    const invoiceNumberMatch = matchFirst(text, INVOICE_NUMBER_PATTERNS);
    const invoiceNumber = invoiceNumberMatch?.[1];

    const documentType = isCreditDocument(fileName, text, totalAmount) ? 'Credit Note' : 'Invoice';
    if (documentType === 'Credit Note') {
      energyConsumed = 0;
    }

    const extraction: ExtractedInvoiceRecord = {
      documentType,
      supplier,
      invoicePeriod,
      totalAmount,
      energyConsumed,
      correctionFactor: 1,
      calorificValue: 39.5,
      meterSerial,
      mprn,
      mpan,
      accountNumber,
      invoiceNumber,
      previousRead: previousRead ?? { value: '0', date: 'Unknown' },
      currentRead: {
        value: currentRead?.value ?? previousRead?.value ?? '0',
        date: currentRead?.date ?? previousRead?.date ?? 'Unknown',
        type: currentRead?.type ?? 'Actual',
      },
      siteName,
      sourceFileId: fileName,
      sourceFileName: fileName,
    };

    return {
      success: true,
      data: extraction,
    };
  } catch (error) {
    console.error('Error extracting invoice data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
    };
  }
}

export async function extractTableData(buffer: Buffer): Promise<any[]> {
  const text = await extractTextFromPDF(buffer);
  const readings: Array<{ date: string; reading: string; type: string }> = [];
  const previous = extractReading(text, PREVIOUS_READ_PATTERNS);
  const current = extractReading(text, CURRENT_READ_PATTERNS);

  if (previous) {
    readings.push({
      date: previous.date,
      reading: previous.value,
      type: previous.type ?? 'Actual',
    });
  }

  if (current) {
    readings.push({
      date: current.date,
      reading: current.value,
      type: current.type ?? 'Actual',
    });
  }

  return readings;
}

export const EXTRACTION_COSTS = {
  gemini: {
    costPerPage: 0.001,
    monthlyEstimate: 50,
  },
  free: {
    costPerPage: 0,
    monthlyEstimate: 0,
  },
};
