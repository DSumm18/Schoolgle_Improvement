import OpenAI from 'openai';
import { OFSTED_FRAMEWORK, type Category } from './ofsted-framework';

// --- Configuration ---

export const MODEL_CONFIG = {
    // Primary model for most document analysis
    primary: {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3',
        costPerRequest: 0.0008,
        useFor: ['docx', 'xlsx', 'txt', 'google-docs', 'text-pdf'],
        maxTokens: 8000
    },

    // OCR model for scanned documents and images
    ocr: {
        id: 'mistral-ocr',
        name: 'Mistral OCR',
        costPerRequest: 0.002,
        useFor: ['scanned-pdf', 'image', 'jpg', 'png', 'jpeg'],
        maxTokens: 4000
    },

    // Vision model for documents with charts/diagrams
    vision: {
        id: 'qwen/qwen-2.5-vl-72b-instruct',
        name: 'Qwen 2.5 VL 72B',
        costPerRequest: 0.001,
        useFor: ['charts', 'diagrams', 'visual-reports'],
        maxTokens: 6000
    },

    // Fallback model for reliability
    fallback: {
        id: 'google/gemini-2.0-flash-lite-001',
        name: 'Gemini 2.0 Flash Lite',
        costPerRequest: 0.0003,
        useFor: ['retry', 'json-parsing-failed'],
        maxTokens: 8000
    }
};

// --- Types ---

export interface DocumentMetadata {
    filename: string;
    fileId: string;
    mimeType: string;
    foldername?: string;
    folderPath?: string;
    webViewLink?: string;
}

export interface EvidenceMatch {
    categoryId: string;
    categoryName: string;
    subcategoryId: string;
    subcategoryName: string;
    evidenceItem: string;
    confidence: number; // 0-1
    relevanceExplanation: string;
    keyQuotes: string[];
    documentId: string;
    documentName: string;
    documentLink?: string;
}

export interface MatchResult {
    documentId: string;
    documentName: string;
    matches: EvidenceMatch[];
    processingTime: number;
    modelUsed: string;
    error?: string;
}

interface AIResponse {
    matches: {
        category_id: string;
        subcategory_id: string;
        evidence_item: string;
        confidence: number;
        explanation: string;
        key_quotes: string[];
    }[];
    summary?: string;
}

// --- Helper Functions ---

/**
 * Select the appropriate AI model based on document type
 */
export function selectModel(metadata: DocumentMetadata): string {
    const { mimeType, filename } = metadata;

    // Check for scanned PDFs or images
    if (mimeType.includes('image') ||
        filename.toLowerCase().includes('scan') ||
        filename.toLowerCase().includes('photo')) {
        return MODEL_CONFIG.ocr.id;
    }

    // Check for visual-heavy documents (charts, diagrams)
    if (filename.toLowerCase().includes('chart') ||
        filename.toLowerCase().includes('diagram') ||
        filename.toLowerCase().includes('infographic')) {
        return MODEL_CONFIG.vision.id;
    }

    // Default: Use primary model (DeepSeek V3)
    return MODEL_CONFIG.primary.id;
}

/**
 * Format framework data for AI prompt
 */
function formatFrameworkForPrompt(): string {
    let formatted = '';

    OFSTED_FRAMEWORK.forEach(category => {
        formatted += `\n## ${category.name}\n`;
        category.subcategories.forEach(sub => {
            formatted += `\n### ${sub.name}\n`;
            formatted += `Description: ${sub.description}\n`;
            formatted += `Evidence Required:\n`;
            sub.evidenceRequired.forEach((evidence, idx) => {
                formatted += `${idx + 1}. ${evidence}\n`;
            });
        });
    });

    return formatted;
}

/**
 * Create system prompt for AI
 */
function createSystemPrompt(): string {
    return `You are an expert Ofsted inspector analyzing school documents to identify evidence.

Your task is to:
1. Read the document carefully
2. Identify which Ofsted evidence requirements it satisfies
3. Provide a confidence score (0-1) for each match
4. Extract relevant quotes that demonstrate the evidence
5. Explain WHY the document satisfies each requirement

Be thorough but precise. Only match evidence with high confidence (>0.7).
If a document partially satisfies a requirement, use a moderate confidence score (0.5-0.7).
If a document clearly and comprehensively addresses a requirement, use high confidence (0.8-1.0).`;
}

/**
 * Create user prompt with document content
 */
function createUserPrompt(documentText: string, metadata: DocumentMetadata): string {
    const frameworkData = formatFrameworkForPrompt();

    // Truncate document if too long (keep first 8000 chars for context)
    const truncatedText = documentText.length > 8000
        ? documentText.substring(0, 8000) + '\n\n[Document truncated for analysis...]'
        : documentText;

    return `Analyze this school document and identify which Ofsted evidence requirements it satisfies.

**Document Details:**
- Filename: ${metadata.filename}
- Folder: ${metadata.folderPath || metadata.foldername || 'Root'}
- Type: ${metadata.mimeType}

**Document Content:**
${truncatedText}

**Ofsted Framework Evidence Requirements:**
${frameworkData}

**Instructions:**
Return a JSON object with this exact structure:
{
  "matches": [
    {
      "category_id": "quality_of_education",
      "subcategory_id": "curriculum_intent",
      "evidence_item": "Curriculum policy documents",
      "confidence": 0.95,
      "explanation": "This document is a comprehensive curriculum policy...",
      "key_quotes": ["Quote 1 from document", "Quote 2 from document"]
    }
  ],
  "summary": "Overall assessment of what this document provides evidence for"
}

Only include matches with confidence >= 0.5. Be selective and accurate.`;
}

/**
 * Parse AI response and extract matches
 */
function parseAIResponse(
    responseText: string,
    documentMetadata: DocumentMetadata
): EvidenceMatch[] {
    try {
        // Try to extract JSON from response (handle code blocks)
        let jsonText = responseText.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const parsed: AIResponse = JSON.parse(jsonText);

        if (!parsed.matches || !Array.isArray(parsed.matches)) {
            console.error('Invalid AI response structure:', parsed);
            return [];
        }

        // Convert to EvidenceMatch format
        return parsed.matches.map(match => {
            // Find category and subcategory names
            const category = OFSTED_FRAMEWORK.find(c => c.id === match.category_id);
            const subcategory = category?.subcategories.find(s => s.id === match.subcategory_id);

            return {
                categoryId: match.category_id,
                categoryName: category?.name || 'Unknown Category',
                subcategoryId: match.subcategory_id,
                subcategoryName: subcategory?.name || 'Unknown Subcategory',
                evidenceItem: match.evidence_item,
                confidence: match.confidence,
                relevanceExplanation: match.explanation,
                keyQuotes: match.key_quotes || [],
                documentId: documentMetadata.fileId,
                documentName: documentMetadata.filename,
                documentLink: documentMetadata.webViewLink
            };
        });

    } catch (error) {
        console.error('Failed to parse AI response:', error);
        console.error('Response text:', responseText);
        return [];
    }
}

// --- Main Functions ---

/**
 * Match a single document to Ofsted evidence requirements using AI
 */
export async function matchDocumentToEvidenceRequirements(
    documentText: string,
    documentMetadata: DocumentMetadata,
    useModel?: string
): Promise<MatchResult> {
    const startTime = Date.now();

    try {
        // Select model
        const modelId = useModel || selectModel(documentMetadata);

        // Initialize OpenRouter client
        const openai = new OpenAI({
            apiKey: process.env.VITE_OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': 'https://schoolgle.co.uk',
                'X-Title': 'Schoolgle - Improvement'
            }
        });

        // Create prompts
        const systemPrompt = createSystemPrompt();
        const userPrompt = createUserPrompt(documentText, documentMetadata);

        console.log(`[AI Matcher] Analyzing ${documentMetadata.filename} with ${modelId}`);

        // Call AI model
        const response = await openai.chat.completions.create({
            model: modelId,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3, // Lower temperature for more consistent JSON output
            max_tokens: MODEL_CONFIG.primary.maxTokens
        });

        const responseText = response.choices[0]?.message?.content || '';

        if (!responseText) {
            throw new Error('Empty response from AI model');
        }

        // Parse response
        const matches = parseAIResponse(responseText, documentMetadata);

        const processingTime = Date.now() - startTime;

        console.log(`[AI Matcher] Found ${matches.length} matches in ${processingTime}ms`);

        return {
            documentId: documentMetadata.fileId,
            documentName: documentMetadata.filename,
            matches,
            processingTime,
            modelUsed: modelId
        };

    } catch (error: any) {
        console.error(`[AI Matcher] Error processing ${documentMetadata.filename}:`, error);

        // Try fallback model if primary failed
        if (!useModel || useModel !== MODEL_CONFIG.fallback.id) {
            console.log('[AI Matcher] Retrying with fallback model...');
            return matchDocumentToEvidenceRequirements(
                documentText,
                documentMetadata,
                MODEL_CONFIG.fallback.id
            );
        }

        return {
            documentId: documentMetadata.fileId,
            documentName: documentMetadata.filename,
            matches: [],
            processingTime: Date.now() - startTime,
            modelUsed: useModel || 'unknown',
            error: error.message
        };
    }
}

/**
 * Batch process multiple documents
 */
export async function batchMatchDocuments(
    documents: { text: string; metadata: DocumentMetadata }[],
    onProgress?: (current: number, total: number) => void
): Promise<MatchResult[]> {
    const results: MatchResult[] = [];

    for (let i = 0; i < documents.length; i++) {
        const { text, metadata } = documents[i];

        try {
            const result = await matchDocumentToEvidenceRequirements(text, metadata);
            results.push(result);

            if (onProgress) {
                onProgress(i + 1, documents.length);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`Failed to process ${metadata.filename}:`, error);
            results.push({
                documentId: metadata.fileId,
                documentName: metadata.filename,
                matches: [],
                processingTime: 0,
                modelUsed: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    return results;
}

/**
 * Legacy function for backward compatibility
 * Will be replaced by matchDocumentToEvidenceRequirements
 */
export function matchDocumentToCategories(text: string): {
    categoryId: string;
    subcategoryId: string;
    evidenceItem: string;
    confidence: number;
}[] {
    const matches: any[] = [];

    // Simple keyword matching as fallback
    OFSTED_FRAMEWORK.forEach(category => {
        category.subcategories.forEach(sub => {
            sub.evidenceRequired.forEach(evidence => {
                const keywords = evidence.name.toLowerCase().split(' ').filter(w => w.length > 3);
                const matchCount = keywords.filter(kw =>
                    text.toLowerCase().includes(kw)
                ).length;

                if (matchCount > 2) {
                    matches.push({
                        categoryId: category.id,
                        subcategoryId: sub.id,
                        evidenceItem: evidence.name,
                        confidence: Math.min(matchCount / keywords.length, 1)
                    });
                }
            });
        });
    });

    return matches;
}
