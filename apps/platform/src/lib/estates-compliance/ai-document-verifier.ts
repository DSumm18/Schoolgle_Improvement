/**
 * AI Document Verifier for Estates Compliance
 *
 * Uses AI to verify uploaded evidence documents including:
 * - Certificate validation (dates, issuing body, document number)
 * - Document type verification
 * - Compliance domain matching
 * - Key information extraction
 * - Fraud detection (tampered documents, invalid certificates)
 */

import { ROUTER_MODELS } from "@/lib/ai-openrouter";

import OpenAI from 'openai';
import { parsePDF, parseDocx, parseExcel, parseImage } from '@/lib/extractors';

// ============================================================================
// Types
// ============================================================================

export interface VerificationInput {
  evidenceId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  evidenceType: 'certificate' | 'report' | 'inspection_record' | 'policy' | 'photograph' | 'other';
  complianceDomain?: string;
  expectedDetails?: {
    issuingBody?: string;
    documentNumber?: string;
    expiryDate?: string;
    issuedDate?: string;
  };
}

export interface CertificateInfo {
  certificateNumber?: string;
  issuingBody: string;
  issuedDate?: string;
  expiryDate?: string;
  certifyingEntity?: string;
  recipient?: string;
  address?: string;
  keyFindings?: string[];
  standardsMet?: string[];
  recommendations?: string[];
}

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  certificateInfo?: CertificateInfo;
  extractedText?: string;
  validationChecks: {
    documentTypeValid: boolean;
    issuingBodyRecognised: boolean;
    datesValid: boolean;
    datesConsistent: boolean;
    certificateNumberPresent: boolean;
    noTamperingDetected: boolean;
  };
  issues: string[];
  warnings: string[];
  suggestions: string[];
  complianceDomains: string[];
  extractedData: Record<string, any>;
  modelUsed: string;
  processingTime: number;
}

export interface ParsedDocument {
  text: string;
  fileType: string;
  pageCount?: number;
  hasImages?: boolean;
}

// ============================================================================
// AI Model Configuration
// ============================================================================

const MODEL_CONFIG = {
  primary: {
    id: ROUTER_MODELS.DEFAULT,
    name: 'Gemini 2.5 Flash',
    maxTokens: 8000
  },
  vision: {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    maxTokens: 4000
  },
  fallback: {
    id: 'google/gemini-2.0-flash-lite-001',
    name: 'Gemini 2.0 Flash Lite',
    maxTokens: 8000
  }
};

// ============================================================================
// Recognised UK Certifying Bodies
// ============================================================================

const RECOGNISED_BODIES = {
  fire: [
    'fire risk assessment',
    'fire safety',
    'fire eng',
    'ifsm',
    'institute of fire safety managers',
    'ifire',
    'fire protection association',
    'fire industry association'
  ],
  legionella: [
    'legionella control association',
    'water management',
    'water hygiene',
    'hse',
    'health and safety executive',
    'lca',
    'acop l8'
  ],
  asbestos: [
    'ukas',
    'asbestos removal contractors association',
    'arca',
    'asbestos testing',
    'bohs',
    'british occupational hygiene society'
  ],
  electrical: [
    'niceic',
    'napit',
    'elecsa',
    'bre',
    'bsi',
    'i.e.t.',
    'engineering council'
  ],
  gas: [
    'gas safe',
    'gas safe register',
    'corgi',
    'oftec'
  ],
  lift: [
    'lift and escalator engineers association',
    'leea',
    'safe contractors'
  ],
  general: [
    'city & guilds',
    'nvq',
    'iso',
    'bsi',
    'british standard',
    'en standard',
    'european standard'
  ]
};

// ============================================================================
// Document Parsing
// ============================================================================

/**
 * Fetch and parse document from URL
 */
async function parseDocument(fileUrl: string, fileName: string, fileType: string): Promise<ParsedDocument> {
  // For demo purposes, if fileUrl is not a real URL, return mock data
  if (!fileUrl.startsWith('http')) {
    return {
      text: `[Mock document content for ${fileName}]`,
      fileType,
      pageCount: 1
    };
  }

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    let text = '';
    let pageCount = 1;
    let hasImages = false;

    // Parse based on file type
    if (fileType.includes('pdf')) {
      text = await parsePDF(buffer);
      pageCount = text.split('--- Page').length;
    } else if (fileType.includes('word') || fileType.includes('docx')) {
      text = await parseDocx(buffer);
    } else if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xlsx')) {
      text = await parseExcel(buffer);
    } else if (fileType.includes('image')) {
      text = await parseImage(buffer, fileType);
      hasImages = true;
      pageCount = 1;
    } else {
      text = `[Unsupported file type: ${fileType}]`;
    }

    return { text, fileType, pageCount, hasImages };
  } catch (error) {
    console.error('Error parsing document:', error);
    return {
      text: `[Error parsing document: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      fileType,
      pageCount: 0
    };
  }
}

// ============================================================================
// AI Verification Functions
// ============================================================================

/**
 * Create system prompt for certificate verification
 */
function createVerificationSystemPrompt(): string {
  return `You are an expert in UK estates compliance and certificate verification.

Your task is to analyze a document and verify its authenticity, completeness, and compliance.

For certificates, verify:
1. **Issuing Body**: Is it a recognised UK certifying body for this domain?
2. **Document Number**: Is there a certificate/reference number present?
3. **Dates**: Are the issue and expiry dates valid and consistent?
4. **Standards**: Does it reference appropriate British/European standards?
5. **Tampering**: Are there any signs of document tampering or inconsistencies?
6. **Scope**: Is the certificate appropriate for the type of equipment/premises?

Recognised UK bodies include:
- Fire Safety: IFSM, Fire Protection Association, Fire Industry Association
- Legionella: Legionella Control Association, HSE, Water Management Society
- Asbestos: ARCA, UKAS, BOHS
- Electrical: NICEIC, NAPIT, ELECSA, BSI
- Gas: Gas Safe Register
- Lifts: LEEA

Respond with a JSON object containing:
- verified: boolean (overall verification status)
- confidence: number (0-1)
- certificate_info: extracted certificate details
- validation_checks: individual check results
- issues: array of problems found
- warnings: array of concerns
- suggestions: array of recommendations
- compliance_domains: array of relevant compliance domains
- extracted_data: key information extracted`;
}

/**
 * Create user prompt for document analysis
 */
function createVerificationUserPrompt(
  documentText: string,
  input: VerificationInput
): string {
  const { fileName, evidenceType, complianceDomain, expectedDetails } = input;

  let prompt = `Analyze this compliance document and verify its authenticity and completeness.

**Document Details:**
- File Name: ${fileName}
- Evidence Type: ${evidenceType}
- Compliance Domain: ${complianceDomain || 'Not specified'}
- File Type: ${input.fileType}
`;

  if (expectedDetails) {
    prompt += `\n**Expected Details (for verification):**\n`;
    if (expectedDetails.issuingBody) {
      prompt += `- Expected Issuing Body: ${expectedDetails.issuingBody}\n`;
    }
    if (expectedDetails.documentNumber) {
      prompt += `- Expected Document Number: ${expectedDetails.documentNumber}\n`;
    }
    if (expectedDetails.issuedDate) {
      prompt += `- Expected Issue Date: ${expectedDetails.issuedDate}\n`;
    }
    if (expectedDetails.expiryDate) {
      prompt += `- Expected Expiry Date: ${expectedDetails.expiryDate}\n`;
    }
  }

  // Truncate text if too long
  const truncatedText = documentText.length > 15000
    ? documentText.substring(0, 15000) + '\n\n[Document truncated for analysis...]'
    : documentText;

  prompt += `\n**Document Content:**\n${truncatedText || '[No text content - image-based document]'}\n`;

  prompt += `\n**Instructions:**
Return a JSON object with this structure:
{
  "verified": true/false,
  "confidence": 0.95,
  "certificate_info": {
    "certificate_number": "ABC-12345",
    "issuing_body": "Name of organisation",
    "issued_date": "2024-01-15",
    "expiry_date": "2025-01-15",
    "certifying_entity": "Name of certifier",
    "recipient": "Name of school/organisation",
    "address": "Premises address",
    "key_findings": ["Finding 1", "Finding 2"],
    "standards_met": ["BS 5839-1", "BS 5266"],
    "recommendations": ["Recommendation 1"]
  },
  "validation_checks": {
    "document_type_valid": true,
    "issuing_body_recognised": true,
    "dates_valid": true,
    "dates_consistent": true,
    "certificate_number_present": true,
    "no_tampering_detected": true
  },
  "issues": [],
  "warnings": [],
  "suggestions": [],
  "compliance_domains": ["fire", "electrical"],
  "extracted_data": {
    "premises_type": "School",
    "system_type": "Fire Alarm",
    "grade": "Grade D",
    "category": "L1"
  }
}`;

  return prompt;
}

/**
 * Parse AI response for verification result
 */
function parseVerificationResponse(responseText: string): VerificationResult | null {
  try {
    let jsonText = responseText.trim();

    // Remove markdown code blocks
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText);

    return {
      verified: parsed.verified || false,
      confidence: parsed.confidence || 0,
      certificateInfo: parsed.certificate_info,
      validationChecks: parsed.validation_checks || {
        documentTypeValid: false,
        issuingBodyRecognised: false,
        datesValid: false,
        datesConsistent: false,
        certificateNumberPresent: false,
        noTamperingDetected: false
      },
      issues: parsed.issues || [],
      warnings: parsed.warnings || [],
      suggestions: parsed.suggestions || [],
      complianceDomains: parsed.compliance_domains || [],
      extractedData: parsed.extracted_data || {},
      modelUsed: '',
      processingTime: 0
    };
  } catch (error) {
    console.error('Failed to parse verification response:', error);
    return null;
  }
}

// ============================================================================
// Main Verification Function
// ============================================================================

/**
 * Verify a compliance document using AI
 */
export async function verifyComplianceDocument(
  input: VerificationInput
): Promise<VerificationResult> {
  const startTime = Date.now();

  try {
    console.log(`[Document Verifier] Starting verification for ${input.fileName}`);

    // Step 1: Parse document
    const parsed = await parseDocument(input.fileUrl, input.fileName, input.fileType);
    console.log(`[Document Verifier] Parsed document, text length: ${parsed.text.length}`);

    // Step 2: Initialize AI client
    const apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('No API key available for AI verification');
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://schoolgle.co.uk',
        'X-Title': 'Schoolgle - Estates Compliance'
      }
    });

    // Step 3: Create prompts
    const systemPrompt = createVerificationSystemPrompt();
    const userPrompt = createVerificationUserPrompt(parsed.text, input);

    // Step 4: Select model based on document type
    let modelId = MODEL_CONFIG.primary.id;
    if (input.fileType.includes('image') || parsed.hasImages) {
      modelId = MODEL_CONFIG.vision.id;
    }

    console.log(`[Document Verifier] Using model: ${modelId}`);

    // Step 5: Call AI
    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: MODEL_CONFIG.primary.maxTokens,
      response_format: { type: 'json_object' }
    });

    const responseText = response.choices[0]?.message?.content || '';

    if (!responseText) {
      throw new Error('Empty response from AI model');
    }

    // Step 6: Parse response
    let result = parseVerificationResponse(responseText);

    if (!result) {
      // Try fallback model
      console.log('[Document Verifier] Primary parse failed, trying fallback model');
      const fallbackResponse = await openai.chat.completions.create({
        model: MODEL_CONFIG.fallback.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: MODEL_CONFIG.fallback.maxTokens,
        response_format: { type: 'json_object' }
      });

      const fallbackText = fallbackResponse.choices[0]?.message?.content || '';
      result = parseVerificationResponse(fallbackText);

      if (!result) {
        throw new Error('Failed to parse AI response from both models');
      }

      result.modelUsed = MODEL_CONFIG.fallback.id;
    } else {
      result.modelUsed = modelId;
    }

    // Step 7: Add extracted text and processing time
    result.extractedText = parsed.text.substring(0, 1000); // First 1000 chars
    result.processingTime = Date.now() - startTime;

    // Step 8: Validate compliance domain
    if (input.complianceDomain && !result.complianceDomains.includes(input.complianceDomain)) {
      result.warnings.push(
        `Expected compliance domain "${input.complianceDomain}" not detected. Found: ${result.complianceDomains.join(', ')}`
      );
    }

    console.log(`[Document Verifier] Verification complete: ${result.verified ? 'VERIFIED' : 'NOT VERIFIED'} (${result.confidence})`);

    return result;

  } catch (error: any) {
    console.error('[Document Verifier] Verification failed:', error);

    // Return a failed verification result
    return {
      verified: false,
      confidence: 0,
      validationChecks: {
        documentTypeValid: false,
        issuingBodyRecognised: false,
        datesValid: false,
        datesConsistent: false,
        certificateNumberPresent: false,
        noTamperingDetected: false
      },
      issues: [error.message || 'Unknown verification error'],
      warnings: ['Verification failed - manual review required'],
      suggestions: ['Please check the document manually or contact support'],
      complianceDomains: [],
      extractedData: {},
      modelUsed: 'error',
      processingTime: Date.now() - startTime
    };
  }
}

// ============================================================================
// Batch Verification
// ============================================================================

/**
 * Verify multiple documents in batch
 */
export async function batchVerifyDocuments(
  inputs: VerificationInput[],
  onProgress?: (current: number, total: number, result: VerificationResult) => void
): Promise<Map<string, VerificationResult>> {
  const results = new Map<string, VerificationResult>();

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const result = await verifyComplianceDocument(input);
    results.set(input.evidenceId, result);

    if (onProgress) {
      onProgress(i + 1, inputs.length, result);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an issuing body is recognised
 */
export function isRecognisedBody(domain: string, bodyName: string): boolean {
  const normalisedBody = bodyName.toLowerCase();
  const bodies = RECOGNISED_BODIES[domain as keyof typeof RECOGNISED_BODIES] || RECOGNISED_BODIES.general;

  return bodies.some(body => normalisedBody.includes(body) || body.includes(normalisedBody));
}

/**
 * Calculate expiry status
 */
export function getExpiryStatus(expiryDate: string): 'expired' | 'expiring_soon' | 'valid' {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry < 30) return 'expiring_soon';
  return 'valid';
}

/**
 * Get compliance domains from evidence type
 */
export function inferComplianceDomains(evidenceType: string): string[] {
  const domainMap: Record<string, string[]> = {
    'fire_safety_certificate': ['fire'],
    'fire_risk_assessment': ['fire'],
    'legionella_certificate': ['legionella'],
    'water_hygiene_certificate': ['legionella', 'water'],
    'asbestos_survey': ['asbestos'],
    'asbestos_certificate': ['asbestos'],
    'electrical_certificate': ['electrical'],
    'emergency_lighting_certificate': ['electrical', 'fire'],
    'gas_safety_certificate': ['gas'],
    'lift_certificate': ['lifts', 'mechanical'],
    'portable_appliance_test': ['electrical'],
    'insurance_certificate': ['insurance'],
    'public_liability': ['insurance'],
    'employer_liability': ['insurance'],
  };

  return domainMap[evidenceType] || [];
}
