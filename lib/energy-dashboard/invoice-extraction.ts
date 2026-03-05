import { ExtractedInvoiceRecord } from '@/types/energy-dashboard';

interface GeminiSuccessResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const extractionSchema = {
  type: 'object',
  properties: {
    documentType: { type: 'string', description: "The type of document, either 'Invoice' or 'Credit Note'." },
    supplier: { type: 'string', description: 'The name of the energy supplier.' },
    invoicePeriod: { type: 'string', description: "The start and end date of the invoice period, e.g., '01/09/2024 to 30/09/2024'." },
    totalAmount: { type: 'number', description: 'The total amount payable. Negative if it is a credit note.' },
    energyConsumed: { type: 'number', description: 'Total energy consumed in kWh.' },
    correctionFactor: { type: 'number', description: 'Correction factor used in the energy calculation.' },
    calorificValue: { type: 'number', description: 'Calorific value used in the energy calculation.' },
    meterSerial: { type: 'string', description: 'Meter serial number.' },
    mprn: { type: 'string', description: 'Meter Point Reference Number (MPRN).' },
    previousRead: {
      type: 'object',
      properties: {
        value: { type: 'string' },
        date: { type: 'string' },
      },
      required: ['value', 'date'],
    },
    currentRead: {
      type: 'object',
      properties: {
        value: { type: 'string' },
        date: { type: 'string' },
        type: { type: 'string' },
      },
      required: ['value', 'date', 'type'],
    },
  },
  required: [
    'documentType',
    'supplier',
    'invoicePeriod',
    'totalAmount',
    'energyConsumed',
    'correctionFactor',
    'calorificValue',
    'meterSerial',
    'mprn',
    'previousRead',
    'currentRead',
  ],
};

const prompt = [
  'You are an assistant that extracts structured data from UK school energy invoices and credit notes.',
  'Return only valid JSON that follows the provided schema.',
  "Ensure amounts from credit notes are represented as negative numbers.",
  'If some fields are missing, make a best effort using the document context without hallucinating.',
].join(' ');

function buildRequestBody(base64File: string, mimeType: string) {
  return {
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: base64File, mimeType } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: extractionSchema,
      temperature: 0,
    },
  };
}

async function callGeminiApi(body: unknown): Promise<GeminiSuccessResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return (await response.json()) as GeminiSuccessResponse;
}

function parseGeminiResponse(response: GeminiSuccessResponse) {
  const candidate = response.candidates?.[0];
  const partText = candidate?.content?.parts?.[0]?.text;

  if (!partText) {
    throw new Error('Gemini response did not include any text content.');
  }

  return JSON.parse(partText);
}

interface ExtractInvoiceArgs {
  buffer: Buffer;
  mimeType: string;
  siteName: string;
  fileId: string;
  fileName: string;
}

export async function extractInvoiceFromBuffer({
  buffer,
  mimeType,
  siteName,
  fileId,
  fileName,
}: ExtractInvoiceArgs): Promise<ExtractedInvoiceRecord> {
  const base64File = buffer.toString('base64');
  const body = buildRequestBody(base64File, mimeType);
  const response = await callGeminiApi(body);
  const parsed = parseGeminiResponse(response);

  return {
    ...parsed,
    siteName,
    sourceFileId: fileId,
    sourceFileName: fileName,
  } as ExtractedInvoiceRecord;
}
