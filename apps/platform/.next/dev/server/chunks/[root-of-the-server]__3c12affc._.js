module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/packages/ed-backend/dist/lib/openrouter-client.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OpenRouterClient",
    ()=>OpenRouterClient
]);
class OpenRouterClient {
    constructor(apiKey){
        this.baseUrl = 'https://openrouter.ai/api/v1';
        if (!apiKey) {
            throw new Error('OpenRouter API key is required');
        }
        this.apiKey = apiKey;
    }
    async chatCompletion(request) {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://schoolgle.co.uk',
                    'X-Title': 'Schoolgle Ed AI'
                },
                body: JSON.stringify({
                    model: request.model,
                    messages: request.messages.map((m)=>({
                            role: m.role,
                            content: m.content
                        })),
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.maxTokens ?? 1000,
                    top_p: request.topP ?? 1.0
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return {
                id: data.id,
                choices: data.choices.map((choice)=>({
                        message: {
                            role: choice.message.role,
                            content: choice.message.content
                        },
                        finishReason: choice.finish_reason
                    })),
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0
                },
                model: data.model
            };
        } catch (error) {
            console.error('OpenRouter API Error:', error);
            throw error;
        }
    }
    async testConnection() {
        try {
            const response = await this.chatCompletion({
                model: 'google/gemini-2.0-flash-lite:free',
                messages: [
                    {
                        role: 'user',
                        content: 'Hello'
                    }
                ],
                maxTokens: 10
            });
            return !!response.choices[0]?.message?.content;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}
}),
"[project]/packages/ed-backend/dist/lib/model-router.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Routes tasks to optimal models based on complexity, cost, and requirements
 */ __turbopack_context__.s([
    "ModelRouter",
    ()=>ModelRouter,
    "modelRouter",
    ()=>modelRouter
]);
class ModelRouter {
    /**
     * Estimate token count (rough approximation)
     */ estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
    /**
     * Determine task complexity
     */ analyzeTaskComplexity(messages) {
        const lastMessage = messages[messages.length - 1];
        const tokenCount = this.estimateTokens(lastMessage.content);
        // Check for reasoning indicators
        const reasoningKeywords = [
            'explain',
            'analyze',
            'compare',
            'evaluate',
            'plan',
            'strategy'
        ];
        const requiresReasoning = reasoningKeywords.some((kw)=>lastMessage.content.toLowerCase().includes(kw));
        // Check for vision indicators (will implement with Product 2)
        const requiresVision = false;
        return {
            tokenCount,
            requiresReasoning,
            requiresVision
        };
    }
    /**
     * Determine task type from context
     */ determineTaskType(messages, context) {
        // Vision analysis (Product 2)
        if (context?.screenshot) {
            return 'vision_analysis';
        }
        // OCR task
        if (context?.taskType === 'document_extract') {
            return 'ocr';
        }
        // Report generation
        if (context?.taskType === 'generate_report') {
            return 'report_generation';
        }
        // Chat complexity
        const { tokenCount, requiresReasoning } = this.analyzeTaskComplexity(messages);
        if (tokenCount > 500 || requiresReasoning) {
            return 'chat_complex';
        }
        return 'chat_simple';
    }
    /**
     * Select optimal model for task
     */ route(messages, context = {}) {
        const taskType = this.determineTaskType(messages, context);
        let selectedModel;
        let reason;
        let estimatedCost;
        switch(taskType){
            case 'vision_analysis':
                selectedModel = {
                    model: 'qwen/qwen-2.5-vl-72b',
                    provider: 'openrouter',
                    maxTokens: 1500,
                    temperature: 0.3
                };
                reason = 'UI screenshot analysis requires vision model';
                estimatedCost = 0.0008; // ~£0.0008 per request
                break;
            case 'ocr':
                selectedModel = {
                    model: 'mistralai/pixtral-large-2411',
                    provider: 'openrouter',
                    maxTokens: 2000,
                    temperature: 0.1
                };
                reason = 'OCR task requires specialized model';
                estimatedCost = 0.0004;
                break;
            case 'report_generation':
                selectedModel = {
                    model: 'openai/gpt-4o-mini',
                    provider: 'openrouter',
                    maxTokens: 4000,
                    temperature: 0.7
                };
                reason = 'Report writing benefits from GPT-4o-mini quality';
                estimatedCost = 0.002;
                break;
            case 'chat_complex':
                selectedModel = {
                    model: 'deepseek/deepseek-chat',
                    provider: 'openrouter',
                    maxTokens: 2000,
                    temperature: 0.7
                };
                reason = 'Complex reasoning task, using DeepSeek V3';
                estimatedCost = 0.0012;
                break;
            case 'chat_simple':
            default:
                selectedModel = {
                    model: 'google/gemini-2.0-flash-lite:free',
                    provider: 'openrouter',
                    maxTokens: 1000,
                    temperature: 0.7
                };
                reason = 'Simple query, using fast & cheap model';
                estimatedCost = 0.00015;
                break;
        }
        return {
            taskType,
            selectedModel,
            reason,
            estimatedCost
        };
    }
}
const modelRouter = new ModelRouter();
}),
"[project]/packages/ed-backend/dist/lib/prompt-builder.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Build system prompt based on context
 */ __turbopack_context__.s([
    "buildSystemPrompt",
    ()=>buildSystemPrompt
]);
function buildSystemPrompt(context) {
    const basePrompt = `You are Ed, an AI school assistant created by Schoolgle.

PERSONALITY:
- Warm, supportive, and honest - like a trusted colleague
- Practical and action-oriented, not theoretical
- Use UK education terminology
- Acknowledge pressures on school staff
- Light humour is welcome but stay professional

EXPERTISE:
- Ofsted Education Inspection Framework (November 2025)
- SIAMS framework (for church schools)
- EEF Teaching & Learning Toolkit
- School improvement and self-evaluation
- UK school operations and compliance`;
    // Add product-specific context
    if (context.product === 'schoolgle-platform') {
        return basePrompt + `

CURRENT CONTEXT:
School: ${context.schoolName}
${context.schoolType ? `Type: ${context.schoolType}` : ''}
${context.isChurchSchool ? 'This is a church school (both Ofsted and SIAMS apply)' : ''}
${context.page ? `Current page: ${context.page}` : ''}
${context.category ? `Focus area: ${context.category}` : ''}

${buildSchoolgleContext(context)}

GUIDELINES:
- Always cite EEF research when making recommendations
- Link advice to specific Ofsted framework requirements
- Be specific and actionable (not generic advice)
- If you see evidence gaps, proactively suggest how to fill them
- If actions are overdue, gently remind without being pushy
- Celebrate progress and strengths`;
    }
    if (context.product === 'parent-chat') {
        return basePrompt + `

CURRENT CONTEXT:
School: ${context.schoolName}

GUIDELINES FOR PARENT QUERIES:
- Be friendly and welcoming
- Provide accurate school information
- If you don't know something, say so clearly
- Direct parents to contact school for specific queries
- Never make up information about the school`;
    }
    if (context.product === 'staff-tools') {
        return basePrompt + `

CURRENT CONTEXT:
Helping with: ${context.page || 'MIS system navigation'}
${context.screenshot ? 'Analyzing screenshot of school system' : ''}

GUIDELINES FOR STAFF SUPPORT:
- Provide step-by-step instructions
- Be patient and clear
- Explain why each step matters
- Offer shortcuts and tips
- If stuck, suggest contacting system support`;
    }
    return basePrompt;
}
/**
 * Build Schoolgle-specific context from platform data
 */ function buildSchoolgleContext(context) {
    if (!context.schoolgleContext) {
        return '';
    }
    const parts = [];
    // Health score
    if (context.schoolgleContext.healthScore !== undefined) {
        const score = context.schoolgleContext.healthScore;
        let status = 'good';
        if (score < 40) status = 'critical';
        else if (score < 60) status = 'at risk';
        else if (score < 75) status = 'neutral';
        parts.push(`School improvement health: ${score}/100 (${status})`);
    }
    // Evidence gaps
    if (context.schoolgleContext.gaps && context.schoolgleContext.gaps.length > 0) {
        parts.push(`\nEVIDENCE GAPS (${context.schoolgleContext.gaps.length}):`);
        context.schoolgleContext.gaps.slice(0, 5).forEach((gap)=>{
            parts.push(`- ${gap.area}/${gap.subcategory}: ${gap.description || 'Missing evidence'} [${gap.severity}]`);
        });
        if (context.schoolgleContext.gaps.length > 5) {
            parts.push(`  ... and ${context.schoolgleContext.gaps.length - 5} more`);
        }
    }
    // Recent activity
    if (context.schoolgleContext.recentActivity && context.schoolgleContext.recentActivity.length > 0) {
        parts.push(`\nRECENT ACTIVITY:`);
        context.schoolgleContext.recentActivity.slice(0, 3).forEach((activity)=>{
            parts.push(`- ${activity.type}: ${activity.summary}`);
        });
    }
    // Evidence summary
    if (context.schoolgleContext.evidenceSummary) {
        const summary = context.schoolgleContext.evidenceSummary;
        parts.push(`\nEVIDENCE SUMMARY:`);
        parts.push(`- Total documents scanned: ${summary.totalDocuments}`);
        parts.push(`- Evidence matches found: ${summary.evidenceMatches}`);
    }
    return parts.length > 0 ? '\n' + parts.join('\n') : '';
}
}),
"[project]/packages/ed-backend/dist/lib/chat.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EdChatHandler",
    ()=>EdChatHandler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$openrouter$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/lib/openrouter-client.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$model$2d$router$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/lib/model-router.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$prompt$2d$builder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/lib/prompt-builder.js [app-route] (ecmascript)");
;
;
;
class EdChatHandler {
    constructor(apiKey){
        this.openRouter = new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$openrouter$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["OpenRouterClient"](apiKey);
    }
    async handleChat(request) {
        try {
            // Route to optimal model
            const routing = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$model$2d$router$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["modelRouter"].route(request.messages, request.context);
            console.log(`[Ed] Routing decision:`, {
                taskType: routing.taskType,
                model: routing.selectedModel.model,
                reason: routing.reason
            });
            // Build system prompt with context
            const systemPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$prompt$2d$builder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildSystemPrompt"])(request.context);
            // Prepare messages with system context
            const messagesWithSystem = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                ...request.messages
            ];
            // Call OpenRouter
            const response = await this.openRouter.chatCompletion({
                model: routing.selectedModel.model,
                messages: messagesWithSystem,
                temperature: routing.selectedModel.temperature,
                maxTokens: routing.selectedModel.maxTokens,
                topP: routing.selectedModel.topP
            });
            const assistantMessage = response.choices[0]?.message?.content || '';
            return {
                message: assistantMessage,
                conversationId: request.context.conversationId || response.id,
                model: response.model,
                usage: {
                    tokens: response.usage.totalTokens,
                    cost: routing.estimatedCost
                }
            };
        } catch (error) {
            console.error('[Ed] Chat error:', error);
            throw new Error(`Ed chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
}),
"[project]/packages/ed-backend/dist/lib/schoolgle-context.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Retrieves Schoolgle context data for Ed AI assistant
 * This includes assessments, evidence gaps, recent activity, and health metrics
 */ __turbopack_context__.s([
    "getSchoolgleContext",
    ()=>getSchoolgleContext
]);
async function getSchoolgleContext(supabase, organizationId) {
    try {
        // Fetch assessments with joined subcategory/category data
        const { data: assessmentsData, error: assessmentsError } = await supabase.from('ofsted_assessments').select(`
        id,
        subcategory_id,
        school_rating,
        school_rationale,
        ai_rating,
        ai_rationale,
        evidence_count,
        evidence_quality_score,
        ofsted_subcategories!inner (
          id,
          name,
          category_id,
          ofsted_categories!inner (
            id,
            name
          )
        )
      `).eq('organization_id', organizationId).not('school_rating', 'is', null);
        if (assessmentsError) {
            console.error('[Schoolgle Context] Error fetching assessments:', assessmentsError);
        }
        // Transform assessments data
        const assessments = (assessmentsData || []).map((a)=>({
                id: a.id,
                subcategoryId: a.subcategory_id,
                subcategoryName: a.ofsted_subcategories.name,
                categoryId: a.ofsted_subcategories.category_id,
                categoryName: a.ofsted_subcategories.ofsted_categories.name,
                schoolRating: a.school_rating,
                schoolRationale: a.school_rationale,
                aiRating: a.ai_rating,
                aiRationale: a.ai_rationale,
                evidenceCount: a.evidence_count || 0,
                evidenceQualityScore: a.evidence_quality_score
            }));
        // Identify evidence gaps (subcategories with no/low evidence)
        const { data: subcategoriesData } = await supabase.from('ofsted_subcategories').select(`
        id,
        name,
        category_id,
        ofsted_categories!inner (
          id,
          name
        )
      `).eq('ofsted_categories.is_active', true);
        const gaps = [];
        for (const subcat of subcategoriesData || []){
            const subcatAny = subcat;
            const assessment = assessments.find((a)=>a.subcategoryId === subcatAny.id);
            if (!assessment) {
                gaps.push({
                    subcategoryId: subcatAny.id,
                    subcategoryName: subcatAny.name,
                    categoryId: subcatAny.category_id,
                    categoryName: subcatAny.ofsted_categories.name,
                    gapType: 'no_evidence',
                    suggestions: [
                        `No assessment recorded for ${subcatAny.name}`
                    ]
                });
            } else if (assessment.evidenceCount < 3) {
                gaps.push({
                    subcategoryId: subcatAny.id,
                    subcategoryName: subcatAny.name,
                    categoryId: subcatAny.category_id,
                    categoryName: subcatAny.ofsted_categories.name,
                    gapType: 'insufficient',
                    suggestions: [
                        `Only ${assessment.evidenceCount} pieces of evidence for ${subcatAny.name}`
                    ]
                });
            } else if (assessment.evidenceQualityScore && assessment.evidenceQualityScore < 0.6) {
                gaps.push({
                    subcategoryId: subcatAny.id,
                    subcategoryName: subcatAny.name,
                    categoryId: subcatAny.category_id,
                    categoryName: subcatAny.ofsted_categories.name,
                    gapType: 'low_quality',
                    suggestions: [
                        `Evidence quality score is ${assessment.evidenceQualityScore.toFixed(2)} for ${subcatAny.name}`
                    ]
                });
            }
        }
        // Fetch recent activity (last 20 items)
        const { data: activityData, error: activityError } = await supabase.from('activity_log').select('id, action_type, entity_type, entity_name, description, user_name, created_at').eq('organization_id', organizationId).order('created_at', {
            ascending: false
        }).limit(20);
        if (activityError) {
            console.error('[Schoolgle Context] Error fetching activity:', activityError);
        }
        const recentActivity = (activityData || []).map((a)=>({
                id: a.id,
                actionType: a.action_type,
                entityType: a.entity_type,
                entityName: a.entity_name || '',
                description: a.description || '',
                userName: a.user_name || 'Unknown',
                createdAt: a.created_at
            }));
        // Fetch evidence summary
        const { count: documentsCount } = await supabase.from('documents').select('*', {
            count: 'exact',
            head: true
        }).eq('organization_id', organizationId);
        const { count: matchesCount } = await supabase.from('evidence_matches').select('*', {
            count: 'exact',
            head: true
        }).eq('organization_id', organizationId);
        const { data: lastScan } = await supabase.from('scan_jobs').select('completed_at').eq('organization_id', organizationId).eq('status', 'complete').order('completed_at', {
            ascending: false
        }).limit(1).single();
        // Calculate category coverage
        const { data: categoryMatchCounts } = await supabase.from('evidence_matches').select('category_id').eq('organization_id', organizationId);
        const categoryCoverage = {};
        for (const match of categoryMatchCounts || []){
            const matchAny = match;
            categoryCoverage[matchAny.category_id] = (categoryCoverage[matchAny.category_id] || 0) + 1;
        }
        const evidenceSummary = {
            totalDocuments: documentsCount || 0,
            totalMatches: matchesCount || 0,
            categoryCoverage,
            lastScanned: lastScan?.completed_at
        };
        // Calculate health score (simple average of assessment ratings)
        let healthScore;
        if (assessments.length > 0) {
            const ratingValues = {
                'exceptional': 4,
                'strong_standard': 3,
                'expected_standard': 2,
                'needs_attention': 1,
                'urgent_improvement': 0
            };
            const totalScore = assessments.reduce((sum, a)=>{
                const rating = a.schoolRating || a.aiRating;
                return sum + (rating ? ratingValues[rating] || 2 : 2);
            }, 0);
            healthScore = totalScore / assessments.length / 4 * 100; // Convert to 0-100 scale
        }
        return {
            assessments,
            gaps,
            recentActivity,
            healthScore,
            evidenceSummary
        };
    } catch (error) {
        console.error('[Schoolgle Context] Unexpected error:', error);
        // Return empty context on error
        return {
            assessments: [],
            gaps: [],
            recentActivity: [],
            healthScore: undefined,
            evidenceSummary: undefined
        };
    }
}
}),
"[project]/packages/ed-backend/dist/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$openrouter$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/lib/openrouter-client.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$model$2d$router$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/lib/model-router.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$prompt$2d$builder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/lib/prompt-builder.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$chat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/lib/chat.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$schoolgle$2d$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/lib/schoolgle-context.js [app-route] (ecmascript)");
;
;
;
;
;
}),
"[project]/apps/platform/src/lib/supabase.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://ygquvauptwyvlhkyxkwy.supabase.co");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseKey);
} else {
    console.warn("Supabase URL or Key missing. Vector DB features will not work.");
    // Create a dummy proxy to prevent build crashes if imported
    supabase = {
        from: ()=>({
                insert: async ()=>({
                        error: {
                            message: "Supabase not configured"
                        }
                    }),
                select: async ()=>({
                        error: {
                            message: "Supabase not configured"
                        }
                    })
            })
    };
}
;
}),
"[project]/apps/platform/src/app/api/ed/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$chat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/lib/chat.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$schoolgle$2d$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ed-backend/dist/lib/schoolgle-context.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$platform$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/platform/src/lib/supabase.ts [app-route] (ecmascript)");
;
;
;
async function POST(request) {
    try {
        // Get API key from environment (OpenRouter preferred, OpenAI fallback)
        const apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'AI API key not configured'
            }, {
                status: 500
            });
        }
        // Parse request body
        const body = await request.json();
        const { messages, context } = body;
        if (!messages || !Array.isArray(messages)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Invalid messages format'
            }, {
                status: 400
            });
        }
        // Fetch actual Schoolgle context from database
        let schoolgleContext;
        const orgId = context.organizationId;
        if (orgId && orgId !== 'demo' && __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$platform$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"]) {
            try {
                schoolgleContext = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$schoolgle$2d$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSchoolgleContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$platform$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"], orgId);
                console.log('[Ed API] Fetched Schoolgle context:', {
                    assessments: schoolgleContext.assessments.length,
                    gaps: schoolgleContext.gaps.length,
                    activities: schoolgleContext.recentActivity.length,
                    healthScore: schoolgleContext.healthScore
                });
            } catch (error) {
                console.error('[Ed API] Error fetching Schoolgle context:', error);
                // Continue with empty context on error
                schoolgleContext = {
                    assessments: [],
                    gaps: [],
                    recentActivity: [],
                    healthScore: undefined,
                    evidenceSummary: undefined
                };
            }
        } else {
            // Demo mode or no Supabase
            schoolgleContext = context.schoolgleContext || {
                assessments: [],
                gaps: [],
                recentActivity: [],
                healthScore: undefined,
                evidenceSummary: undefined
            };
        }
        // Build full context
        const fullContext = {
            organizationId: orgId || 'demo',
            schoolName: context.schoolName || 'Demo School',
            product: 'schoolgle-platform',
            page: context.page,
            category: context.category,
            userId: context.userId,
            userRole: context.userRole,
            conversationId: context.conversationId,
            schoolgleContext
        };
        // Initialize Ed chat handler with OpenRouter
        const chatHandler = new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ed$2d$backend$2f$dist$2f$lib$2f$chat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EdChatHandler"](apiKey);
        // Handle chat
        const response = await chatHandler.handleChat({
            messages,
            context: fullContext
        });
        // Return response (maintain compatibility with existing frontend)
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            response: response.message,
            message: response.message,
            conversationId: response.conversationId,
            metadata: {
                model: response.model,
                tokens: response.usage.tokens,
                cost: response.usage.cost
            }
        });
    } catch (error) {
        console.error('[Ed API] Error:', error);
        // Return fallback response on error
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            response: `I'm having a bit of trouble connecting right now. Let me give you a quick answer based on what I know...\n\nI'm Ed, your AI School Improvement Partner. I can help you with:\n\n📚 **Understanding Ofsted** - What inspectors look for\n🔬 **EEF Research** - Evidence-based strategies\n📊 **Data Analysis** - Making sense of patterns\n🎯 **Action Planning** - Creating improvement actions\n\nWhat would you like to explore?`,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3c12affc._.js.map