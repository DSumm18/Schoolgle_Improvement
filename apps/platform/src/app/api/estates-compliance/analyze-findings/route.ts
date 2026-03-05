/**
 * API Route: Analyze Findings from Text
 *
 * Extracts findings from contractor report text and classifies them.
 * POST /api/estates-compliance/analyze-findings
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { classifyFinding, type FindingDomain } from '@/lib/estates-compliance/findings-database';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for AI processing

interface AnalyzeFindingsRequest {
  text: string;
  domain?: FindingDomain;
  organizationId?: string;
}

interface ExtractedFinding {
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  actionRequired: string;
  estimatedCost?: number;
  rawText: string;
}

interface AnalyzeFindingsResponse {
  findings: ExtractedFinding[];
  domain: string;
  processingTime: number;
}

/**
 * POST /api/estates-compliance/analyze-findings
 *
 * Analyzes contractor report text and extracts findings with classifications.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: AnalyzeFindingsRequest = await request.json();
    const { text, domain } = body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: text is required' },
        { status: 400 }
      );
    }

    if (text.length < 50) {
      return NextResponse.json(
        { error: 'Text is too short to analyze' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Initialize AI client
    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://schoolgle.co.uk',
        'X-Title': 'Schoolgle Estates Compliance',
      }
    });

    // Create system prompt for finding extraction
    const systemPrompt = createSystemPrompt(domain);

    // Create user prompt with the document text
    const userPrompt = createUserPrompt(text, domain);

    // Call AI model to extract findings
    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from AI model');
    }

    // Parse AI response
    const aiResponse = JSON.parse(responseText);
    const findings: ExtractedFinding[] = (aiResponse.findings || []).map((finding: any) => ({
      description: finding.description || finding.issue || '',
      severity: finding.severity || 'medium',
      actionRequired: finding.actionRequired || finding.recommendedAction || 'Review and determine appropriate action',
      estimatedCost: finding.estimatedCost || undefined,
      rawText: finding.rawText || finding.excerpt || '',
    }));

    // Filter out invalid findings
    const validFindings = findings.filter(f => f.description.length > 10);

    // Enhance findings with classification
    const enhancedFindings = validFindings.map(finding => {
      const classification = classifyFinding(finding.description, domain);
      return {
        ...finding,
        classification: classification.classification,
        source: classification.source,
        sourceUrl: classification.sourceUrl,
        confidence: classification.confidence,
        explanation: classification.explanation,
      };
    });

    const processingTime = Date.now() - startTime;

    return NextResponse.json<AnalyzeFindingsResponse>({
      findings: enhancedFindings,
      domain: domain || 'auto-detected',
      processingTime,
    });

  } catch (error: any) {
    console.error('Error analyzing findings:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze findings',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Create system prompt for AI
 */
function createSystemPrompt(domain?: FindingDomain): string {
  const domainContext = domain
    ? ` Focus on ${domain.toUpperCase()} compliance requirements.`
    : ' Automatically detect the compliance domain (legionella, fire, asbestos, electrical, gas, etc.).';

  return `You are an expert UK estates compliance analyst with deep knowledge of:
- Health and Safety Executive (HSE) regulations
- Approved Codes of Practice (ACoP)
- British Standards
- Education-specific requirements

Your task is to extract findings from contractor reports and classify them accurately.

CRITICAL: You must distinguish between three classification tiers:

1. STATUTORY REQUIRED: Legal requirements from legislation or ACoP
   - Examples: HSE L8 (ACoP) requirements, RRO 2005, CAR 2012, EAWR 1989
   - These have legal force and non-compliance can lead to prosecution

2. GOOD PRACTICE: Recommendations from HSE guidance, British Standards
   - Examples: HSE HSG274 (guidance), BS5839 recommendations
   - Recommended but not legally required

3. CONTRACTOR SUGGESTION: Optional improvements
   - Suggestions not found in regulations or guidance
   - May be beneficial but are completely optional

For each finding, provide:
- description: Clear statement of the issue
- severity: critical, high, medium, or low
- actionRequired: Specific action needed
- estimatedCost: Estimated cost in GBP (if mentioned)
- rawText: The exact text excerpt from the report

Be conservative in classification. If uncertain about statutory status, classify as good_practice and note the uncertainty in explanation.${domainContext}`;
}

/**
 * Create user prompt with document text
 */
function createUserPrompt(documentText: string, domain?: FindingDomain): string {
  // Truncate text if too long
  const maxLength = 12000;
  const truncatedText = documentText.length > maxLength
    ? documentText.substring(0, maxLength) + '\n\n[Document truncated...]'
    : documentText;

  return `Analyze this contractor report and extract all findings, recommendations, and issues.

${domain ? `Domain: ${domain}` : ''}

Report text:
${truncatedText}

Return a JSON object with this exact structure:
{
  "findings": [
    {
      "description": "Clear statement of the issue or recommendation",
      "severity": "critical|high|medium|low",
      "actionRequired": "Specific action that should be taken",
      "estimatedCost": 500 (optional, number in GBP),
      "rawText": "Excerpt from the report"
    }
  ]
}

Guidelines:
- Extract ALL findings, recommendations, and issues mentioned
- Include both problems and suggestions
- Assign severity based on potential impact
- Only include estimatedCost if explicitly mentioned in the report
- Preserve the original wording in rawText`;
}
