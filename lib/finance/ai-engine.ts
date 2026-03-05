import { GoogleGenerativeAI } from '@google/generative-ai';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { generateText as generateGeminiText } from '@/lib/ai/gemini';
import type {
  AIProviderConfig,
  VarianceNarrativeRequest,
  VarianceNarrativeResponse,
  GenerateScenarioRequest,
  GenerateScenarioResponse,
  ScenarioResult
} from '@/types/finance';

// =====================================================
// AI ENGINE - CONFIGURABLE PROVIDER
// =====================================================

const AI_PROVIDER = process.env.FINANCE_AI_PROVIDER || 'GEMINI';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.3,
    topP: 0.8,
    maxOutputTokens: 1024,
  }
});

// =====================================================
// VARIANCE NARRATIVE GENERATION
// =====================================================

export async function generateVarianceNarrative(
  request: VarianceNarrativeRequest,
  config?: AIProviderConfig
): Promise<VarianceNarrativeResponse> {
  const provider = config?.provider || AI_PROVIDER;

  if (provider === 'GEMINI') {
    return await generateVarianceNarrativeGemini(request);
  } else if (provider === 'OPENAI') {
    return await generateVarianceNarrativeOpenAI(request);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

async function generateVarianceNarrativeGemini(
  request: VarianceNarrativeRequest
): Promise<VarianceNarrativeResponse> {
  const prompt = `
Analyze this school budget variance for the ${request.category} category.

Budgeted Amount: £${request.budgeted_amount.toLocaleString()}
Actual Amount: £${request.actual_amount.toLocaleString()}
Variance: ${request.variance_percent > 0 ? '+' : ''}${request.variance_percent.toFixed(1)}%

${request.historical_data ? `Historical Trend: ${JSON.stringify(request.historical_data)}` : ''}
${request.context ? `Additional Context: ${request.context}` : ''}

Provide a concise analysis suitable for a School Business Manager:

1. Explain the likely causes of this variance (2-3 sentences)
2. Suggest specific actions to address the issue
3. Assess the severity level (low/medium/high/critical)
4. Rate your confidence in this analysis (0-100)

Format your response as JSON:
{
  "narrative": "Your explanation here",
  "severity": "medium",
  "suggested_actions": ["Action 1", "Action 2"],
  "confidence_score": 85
}
`;

  try {
    const text = await generateGeminiText(geminiModel, prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      narrative: parsed.narrative || 'Unable to generate narrative',
      severity: parsed.severity || 'medium',
      suggested_actions: parsed.suggested_actions || ['Review variance with department head'],
      confidence_score: parsed.confidence_score || 50
    };

  } catch (error) {
    console.error('Error generating variance narrative with Gemini:', error);
    return getFallbackVarianceResponse(request);
  }
}

async function generateVarianceNarrativeOpenAI(
  request: VarianceNarrativeRequest
): Promise<VarianceNarrativeResponse> {
  const prompt = `
Analyze this school budget variance for the ${request.category} category.

Budgeted Amount: £${request.budgeted_amount.toLocaleString()}
Actual Amount: £${request.actual_amount.toLocaleString()}
Variance: ${request.variance_percent > 0 ? '+' : ''}${request.variance_percent.toFixed(1)}%

${request.historical_data ? `Historical Trend: ${JSON.stringify(request.historical_data)}` : ''}
${request.context ? `Additional Context: ${request.context}` : ''}

Provide a concise analysis suitable for a School Business Manager:

1. Explain the likely causes of this variance (2-3 sentences)
2. Suggest specific actions to address the issue
3. Assess the severity level (low/medium/high/critical)
4. Rate your confidence in this analysis (0-100)

Format your response as JSON:
{
  "narrative": "Your explanation here",
  "severity": "medium",
  "suggested_actions": ["Action 1", "Action 2"],
  "confidence_score": 85
}
`;

  try {
    const result = await generateText({
      model: openai('gpt-4'),
      prompt: prompt,
      temperature: 0.3,
      maxTokens: 1024,
    });

    const text = result.text;
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      narrative: parsed.narrative || 'Unable to generate narrative',
      severity: parsed.severity || 'medium',
      suggested_actions: parsed.suggested_actions || ['Review variance with department head'],
      confidence_score: parsed.confidence_score || 50
    };

  } catch (error) {
    console.error('Error generating variance narrative with OpenAI:', error);
    return getFallbackVarianceResponse(request);
  }
}

// =====================================================
// SCENARIO GENERATION
// =====================================================

export async function generateScenarios(
  request: GenerateScenarioRequest,
  budgetData: any,
  config?: AIProviderConfig
): Promise<GenerateScenarioResponse> {
  const provider = config?.provider || AI_PROVIDER;

  if (provider === 'GEMINI') {
    return await generateScenariosGemini(request, budgetData);
  } else if (provider === 'OPENAI') {
    return await generateScenariosOpenAI(request, budgetData);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

async function generateScenariosGemini(
  request: GenerateScenarioRequest,
  budgetData: any
): Promise<GenerateScenarioResponse> {
  const prompt = `
Generate cost-saving scenarios for a school to achieve £${request.target_saving.toLocaleString()} in savings.

Current Budget Breakdown:
- Total Budget: £${budgetData.total_budget.toLocaleString()}
- Teaching Staff: £${budgetData.teaching_staff || 0}
- Support Staff: £${budgetData.support_staff || 0}
- Premises: £${budgetData.premises || 0}
- Supplies & Services: £${budgetData.supplies || 0}
- Utilities: £${budgetData.utilities || 0}

Constraints:
${request.constraints?.exclude_redundancy ? '- No redundancy options' : ''}
${request.constraints?.max_staff_reduction ? `- Max staff reduction: ${request.constraints.max_staff_reduction}%` : ''}
${request.constraints?.protected_areas ? `- Protected areas: ${request.constraints.protected_areas.join(', ')}` : ''}

Generate 3 different scenarios:
1. Minimal Impact (lowest risk, gradual changes)
2. Balanced Approach (moderate risk, mix of savings)
3. Aggressive Savings (higher risk, significant changes)

For each scenario, provide:
- Total savings achieved
- Breakdown by category (staffing, premises, supplies, other)
- Impact description
- Risk level (low/medium/high)
- Implementation timeframe
- Redundancy costs if applicable

Format as JSON:
{
  "scenarios": [
    {
      "id": "scenario_1",
      "name": "Minimal Impact",
      "description": "Description here",
      "total_saving": 50000,
      "breakdown": {
        "staffing": 20000,
        "premises": 15000,
        "supplies": 10000,
        "other": 5000
      },
      "impact_description": "Impact details",
      "risk_level": "low",
      "implementation_time": "6-12 months",
      "redundancy_cost": 0
    }
  ],
  "total_possible_saving": 150000,
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}
`;

  try {
    const text = await generateGeminiText(geminiModel, prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      scenarios: parsed.scenarios || [],
      total_possible_saving: parsed.total_possible_saving || request.target_saving,
      recommendations: parsed.recommendations || ['Review scenarios with senior leadership']
    };

  } catch (error) {
    console.error('Error generating scenarios with Gemini:', error);
    return getFallbackScenariosResponse(request, budgetData);
  }
}

async function generateScenariosOpenAI(
  request: GenerateScenarioRequest,
  budgetData: any
): Promise<GenerateScenarioResponse> {
  const prompt = `
Generate cost-saving scenarios for a school to achieve £${request.target_saving.toLocaleString()} in savings.

Current Budget Breakdown:
- Total Budget: £${budgetData.total_budget.toLocaleString()}
- Teaching Staff: £${budgetData.teaching_staff || 0}
- Support Staff: £${budgetData.support_staff || 0}
- Premises: £${budgetData.premises || 0}
- Supplies & Services: £${budgetData.supplies || 0}
- Utilities: £${budgetData.utilities || 0}

Constraints:
${request.constraints?.exclude_redundancy ? '- No redundancy options' : ''}
${request.constraints?.max_staff_reduction ? `- Max staff reduction: ${request.constraints.max_staff_reduction}%` : ''}
${request.constraints?.protected_areas ? `- Protected areas: ${request.constraints.protected_areas.join(', ')}` : ''}

Generate 3 different scenarios:
1. Minimal Impact (lowest risk, gradual changes)
2. Balanced Approach (moderate risk, mix of savings)
3. Aggressive Savings (higher risk, significant changes)

For each scenario, provide:
- Total savings achieved
- Breakdown by category (staffing, premises, supplies, other)
- Impact description
- Risk level (low/medium/high)
- Implementation timeframe
- Redundancy costs if applicable

Format as JSON:
{
  "scenarios": [
    {
      "id": "scenario_1",
      "name": "Minimal Impact",
      "description": "Description here",
      "total_saving": 50000,
      "breakdown": {
        "staffing": 20000,
        "premises": 15000,
        "supplies": 10000,
        "other": 5000
      },
      "impact_description": "Impact details",
      "risk_level": "low",
      "implementation_time": "6-12 months",
      "redundancy_cost": 0
    }
  ],
  "total_possible_saving": 150000,
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}
`;

  try {
    const result = await generateText({
      model: openai('gpt-4'),
      prompt: prompt,
      temperature: 0.3,
      maxTokens: 2048,
    });

    const text = result.text;
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      scenarios: parsed.scenarios || [],
      total_possible_saving: parsed.total_possible_saving || request.target_saving,
      recommendations: parsed.recommendations || ['Review scenarios with senior leadership']
    };

  } catch (error) {
    console.error('Error generating scenarios with OpenAI:', error);
    return getFallbackScenariosResponse(request, budgetData);
  }
}

// =====================================================
// BENCHMARK ANALYSIS
// =====================================================

export async function generateBenchmarkAnalysis(
  schoolData: any,
  benchmarkData: any,
  config?: AIProviderConfig
): Promise<string> {
  const provider = config?.provider || AI_PROVIDER;

  const prompt = `
Analyze this school's financial performance against national benchmarks.

School Data:
- Phase: ${schoolData.phase}
- Region: ${schoolData.region}
- Spend per Pupil: £${schoolData.spend_per_pupil}
- Staffing %: ${schoolData.staffing_percentage}%
- Premises %: ${schoolData.premises_percentage}%

National Benchmarks:
- Average Spend per Pupil: £${benchmarkData.spend_per_pupil}
- Average Staffing %: ${benchmarkData.staffing_percentage}%
- Average Premises %: ${benchmarkData.premises_percentage}%

Provide a concise analysis (2-3 paragraphs) highlighting:
1. Key areas where the school performs above/below average
2. Potential reasons for significant differences
3. Recommendations for improvement

Write in a professional tone suitable for a School Business Manager.
`;

  if (provider === 'GEMINI') {
    try {
      const result = await geminiModel.generateContent([{ text: prompt }] as any);
      const response = await result.response;
      return response?.text() || '';
    } catch (error) {
      console.error('Error generating benchmark analysis with Gemini:', error);
      return getFallbackBenchmarkAnalysis(schoolData, benchmarkData);
    }
  } else if (provider === 'OPENAI') {
    try {
      const result = await generateText({
        model: openai('gpt-4'),
        prompt: prompt,
        temperature: 0.3,
        maxTokens: 512,
      });
      return result.text;
    } catch (error) {
      console.error('Error generating benchmark analysis with OpenAI:', error);
      return getFallbackBenchmarkAnalysis(schoolData, benchmarkData);
    }
  } else {
    return getFallbackBenchmarkAnalysis(schoolData, benchmarkData);
  }
}

// =====================================================
// FALLBACK RESPONSES
// =====================================================

function getFallbackVarianceResponse(request: VarianceNarrativeRequest): VarianceNarrativeResponse {
  const severity = Math.abs(request.variance_percent) > 20 ? 'high' : 
                  Math.abs(request.variance_percent) > 10 ? 'medium' : 'low';

  let narrative = `The ${request.category} category shows a variance of ${request.variance_percent > 0 ? '+' : ''}${request.variance_percent.toFixed(1)}%. `;
  
  if (request.variance_percent > 0) {
    narrative += `This overspend may be due to increased costs, additional requirements, or timing differences. `;
  } else {
    narrative += `This underspend may indicate savings opportunities or delayed expenditure. `;
  }
  
  narrative += `Review the detailed transactions to identify specific causes and consider budget adjustments for the next period.`;

  return {
    narrative,
    severity,
    suggested_actions: [
      'Review detailed transactions in this category',
      'Meet with department head to understand variance causes',
      'Consider budget adjustments for next period'
    ],
    confidence_score: 60
  };
}

function getFallbackScenariosResponse(
  request: GenerateScenarioRequest,
  budgetData: any
): GenerateScenarioResponse {
  const scenarios: ScenarioResult[] = [
    {
      id: 'scenario_1',
      name: 'Minimal Impact',
      description: 'Gradual cost reductions with minimal service impact',
      total_saving: Math.min(request.target_saving * 0.6, budgetData.total_budget * 0.05),
      breakdown: {
        staffing: Math.min(request.target_saving * 0.3, budgetData.total_budget * 0.025),
        premises: Math.min(request.target_saving * 0.2, budgetData.total_budget * 0.015),
        supplies: Math.min(request.target_saving * 0.1, budgetData.total_budget * 0.01),
        other: 0
      },
      impact_description: 'Minimal impact on teaching and learning through gradual efficiency improvements',
      risk_level: 'low',
      implementation_time: '6-12 months',
      redundancy_cost: 0
    },
    {
      id: 'scenario_2',
      name: 'Balanced Approach',
      description: 'Moderate savings across multiple areas',
      total_saving: Math.min(request.target_saving * 0.8, budgetData.total_budget * 0.08),
      breakdown: {
        staffing: Math.min(request.target_saving * 0.4, budgetData.total_budget * 0.04),
        premises: Math.min(request.target_saving * 0.25, budgetData.total_budget * 0.025),
        supplies: Math.min(request.target_saving * 0.15, budgetData.total_budget * 0.015),
        other: 0
      },
      impact_description: 'Moderate impact with some service adjustments required',
      risk_level: 'medium',
      implementation_time: '3-6 months',
      redundancy_cost: request.constraints?.exclude_redundancy ? 0 : Math.min(request.target_saving * 0.2, budgetData.total_budget * 0.02)
    },
    {
      id: 'scenario_3',
      name: 'Aggressive Savings',
      description: 'Significant cost reductions requiring major changes',
      total_saving: Math.min(request.target_saving, budgetData.total_budget * 0.12),
      breakdown: {
        staffing: Math.min(request.target_saving * 0.5, budgetData.total_budget * 0.06),
        premises: Math.min(request.target_saving * 0.3, budgetData.total_budget * 0.04),
        supplies: Math.min(request.target_saving * 0.2, budgetData.total_budget * 0.02),
        other: 0
      },
      impact_description: 'Significant impact on services, requires careful planning and stakeholder consultation',
      risk_level: 'high',
      implementation_time: '1-3 months',
      redundancy_cost: request.constraints?.exclude_redundancy ? 0 : Math.min(request.target_saving * 0.3, budgetData.total_budget * 0.04)
    }
  ];

  return {
    scenarios,
    total_possible_saving: Math.min(request.target_saving, budgetData.total_budget * 0.12),
    recommendations: [
      'Review scenarios with senior leadership team',
      'Consider impact on teaching and learning',
      'Plan stakeholder consultation for significant changes'
    ]
  };
}

function getFallbackBenchmarkAnalysis(schoolData: any, benchmarkData: any): string {
  const spendDiff = schoolData.spend_per_pupil - benchmarkData.spend_per_pupil;
  const staffingDiff = schoolData.staffing_percentage - benchmarkData.staffing_percentage;

  let analysis = `This school's spend per pupil is £${spendDiff > 0 ? 'above' : 'below'} the national average by £${Math.abs(spendDiff).toLocaleString()}. `;
  
  if (staffingDiff > 5) {
    analysis += `Staffing costs are significantly above average (${staffingDiff.toFixed(1)}% higher), which may indicate higher staff ratios or pay scales. `;
  } else if (staffingDiff < -5) {
    analysis += `Staffing costs are below average (${Math.abs(staffingDiff).toFixed(1)}% lower), which may indicate efficiency or potential understaffing. `;
  }

  analysis += `Review the detailed breakdown to identify specific areas for improvement and consider benchmarking against similar schools in the region.`;

  return analysis;
}
