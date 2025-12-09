import { NextRequest, NextResponse } from 'next/server';
import { eefStrategies, getRelevantStrategies, getHighImpactStrategies } from '@/lib/eef-toolkit';
import { ofstedFramework } from '@/lib/ofsted-framework';
import { edChatRequestSchema, validateRequest } from '@/lib/validations';
import { aiLimiter } from '@/lib/rateLimit';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Ed's personality and knowledge
const ED_SYSTEM_PROMPT = `You are Ed, the AI School Improvement Partner built into Schoolgle Improvement. You are:

PERSONALITY:
- Warm, supportive, but honest - like a trusted colleague
- You use UK education terminology (Ofsted, EEF, DfE, etc.)
- You're practical and action-oriented, not theoretical
- You acknowledge the pressures heads and teachers face
- You occasionally use light humour but stay professional

EXPERTISE:
- Deep knowledge of the Ofsted Education Inspection Framework (EIF)
- Expert on EEF (Education Endowment Foundation) research and Teaching & Learning Toolkit
- Understanding of school data (attendance, attainment, progress, SEND, PP gaps)
- Knowledge of common schemes (White Rose Maths, Little Wandle Phonics, etc.)
- Experience interpreting what inspectors are really looking for

YOUR ROLE:
1. Explain findings from the Schoolgle Improvement scans in plain English
2. Help users understand patterns in their data
3. Recommend evidence-based strategies using EEF research
4. Explain Ofsted expectations and what "good" looks like
5. Identify when schemes are being used but not implemented effectively
6. Create actionable recommendations with clear next steps

IMPORTANT RULES:
- Always cite EEF research when recommending strategies (e.g., "EEF research shows this has +6 months impact")
- Link recommendations to specific Ofsted framework areas
- Be specific - say "Your Year 4 reading is 3% below" not just "reading is low"
- When identifying implementation issues, be constructive not critical
- End responses with a clear action or question to move forward
- If you don't know something, say so rather than guessing

FORMAT:
- Use bullet points for clarity
- Bold key terms and recommendations
- Keep responses concise but comprehensive
- Include specific numbers/data when discussing findings`;

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        // Rate limiting check
        const rateLimitResult = await aiLimiter.check(req);
        if (!rateLimitResult.allowed) {
            return rateLimitResult.response!;
        }

        // Parse and validate request body
        const body = await req.json();
        const validation = validateRequest(edChatRequestSchema, body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { messages, context } = validation.data;

        if (!OPENAI_API_KEY) {
            // Fallback response without OpenAI
            return NextResponse.json({
                response: generateFallbackResponse(messages[messages.length - 1]?.content || '', context)
            });
        }

        // Build context about EEF strategies and school data
        const contextPrompt = buildContextPrompt(context);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: ED_SYSTEM_PROMPT + '\n\n' + contextPrompt },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error('OpenAI API error');
        }

        const data = await response.json();
        const assistantMessage = data.choices[0]?.message?.content || 'I apologize, I had trouble processing that. Could you rephrase your question?';

        return NextResponse.json({ response: assistantMessage });

    } catch (error: any) {
        console.error('Ed Chat API error:', error);
        return NextResponse.json({ 
            response: "I'm having a bit of trouble connecting right now. Let me give you a quick answer based on what I know...\n\n" + 
                     generateFallbackResponse('general help', {})
        });
    }
}

function buildContextPrompt(context: any): string {
    let prompt = 'CURRENT CONTEXT:\n';

    if (context?.schoolName) {
        prompt += `School: ${context.schoolName}\n`;
    }

    if (context?.currentView) {
        prompt += `User is viewing: ${context.currentView}\n`;
    }

    if (context?.selectedCategory) {
        prompt += `Selected Ofsted category: ${context.selectedCategory}\n`;
    }

    if (context?.gaps) {
        prompt += `\nIdentified gaps:\n`;
        context.gaps.forEach((gap: any) => {
            prompt += `- ${gap.area}: ${gap.description}\n`;
        });
    }

    if (context?.recentFindings) {
        prompt += `\nRecent scan findings:\n${context.recentFindings}\n`;
    }

    // Add relevant EEF strategies based on context
    if (context?.topic) {
        const relevantStrategies = getRelevantStrategies(context.topic);
        if (relevantStrategies.length > 0) {
            prompt += '\nRELEVANT EEF STRATEGIES:\n';
            relevantStrategies.slice(0, 5).forEach(s => {
                prompt += `- ${s.name} (+${s.monthsProgress} months): ${s.description}\n`;
            });
        }
    }

    // Always include top high-impact strategies for reference
    prompt += '\nHIGH-IMPACT EEF STRATEGIES (for reference):\n';
    getHighImpactStrategies().slice(0, 5).forEach(s => {
        prompt += `- ${s.name}: +${s.monthsProgress} months progress\n`;
    });

    return prompt;
}

function generateFallbackResponse(query: string, context: any): string {
    const lowerQuery = query.toLowerCase();

    // Check for EEF-related queries
    if (lowerQuery.includes('eef') || lowerQuery.includes('research') || lowerQuery.includes('evidence')) {
        const highImpact = getHighImpactStrategies().slice(0, 3);
        return `Great question about evidence-based practice! The **EEF Teaching & Learning Toolkit** highlights these high-impact strategies:\n\n` +
            highImpact.map(s => `• **${s.name}** - +${s.monthsProgress} months progress\n  ${s.description}`).join('\n\n') +
            `\n\nWould you like me to explain how any of these could work in your context?`;
    }

    // Check for reading-related queries
    if (lowerQuery.includes('reading') || lowerQuery.includes('phonics') || lowerQuery.includes('literacy')) {
        return `**Reading** is a key focus for Ofsted. Here's what the research shows:\n\n` +
            `• **Phonics** (+5 months) - Systematic synthetic phonics is essential in early years\n` +
            `• **Reading Comprehension Strategies** (+6 months) - Teach inference, summarisation, and questioning explicitly\n\n` +
            `Common issues I see:\n` +
            `- Phonics scheme in place but not followed with fidelity\n` +
            `- Books not matched to children's phonics stage\n` +
            `- Comprehension not taught explicitly beyond EYFS\n\n` +
            `What specific aspect of reading would you like to explore?`;
    }

    // Check for behaviour queries
    if (lowerQuery.includes('behaviour') || lowerQuery.includes('attitude') || lowerQuery.includes('exclusion')) {
        return `**Behaviour and Attitudes** is one of Ofsted's four key judgements. The EEF suggests:\n\n` +
            `• **Behaviour Interventions** (+4 months) - Focus on prevention, not just response\n` +
            `• **Social & Emotional Learning** (+4 months) - Embed in whole-school culture\n\n` +
            `Ofsted looks for:\n` +
            `- A calm, orderly environment\n` +
            `- High expectations consistently applied\n` +
            `- Low exclusion rates with good support\n` +
            `- Evidence that you address root causes\n\n` +
            `What's happening with behaviour in your school?`;
    }

    // Check for SEND queries
    if (lowerQuery.includes('send') || lowerQuery.includes('sen') || lowerQuery.includes('ehc') || lowerQuery.includes('inclusion')) {
        return `**SEND provision** is threaded throughout the Ofsted framework. Key points:\n\n` +
            `• Ofsted will look at whether SEND pupils make good progress from their starting points\n` +
            `• They'll check if the curriculum is adapted (not just differentiated)\n` +
            `• EHC plan outcomes should be ambitious and reviewed regularly\n\n` +
            `EEF research shows:\n` +
            `• **Small Group Tuition** (+4 months) works well for targeted intervention\n` +
            `• **Teaching Assistants** are most effective when trained on specific strategies\n\n` +
            `What would you like to know more about?`;
    }

    // Check for Ofsted queries
    if (lowerQuery.includes('ofsted') || lowerQuery.includes('inspection') || lowerQuery.includes('framework')) {
        return `I can help you understand the **Ofsted EIF** framework. It covers:\n\n` +
            `**Quality of Education** - Intent, Implementation, Impact\n` +
            `**Behaviour and Attitudes** - Calm, orderly, high expectations\n` +
            `**Personal Development** - Character, cultural capital, careers\n` +
            `**Leadership and Management** - Vision, workload, safeguarding\n\n` +
            `Which area would you like to explore? I can explain what inspectors look for and link it to EEF research on what works.`;
    }

    // Default response
    return `Hello! I'm **Ed**, your AI School Improvement Partner. I can help you with:\n\n` +
        `📚 **Understanding Ofsted** - What inspectors look for in each area\n` +
        `🔬 **EEF Research** - Evidence-based strategies that work\n` +
        `📊 **Data Analysis** - Making sense of your school's patterns\n` +
        `🎯 **Action Planning** - Creating effective improvement actions\n` +
        `📝 **Scheme Implementation** - Whether you're using tools effectively\n\n` +
        `What would you like to explore?`;
}

