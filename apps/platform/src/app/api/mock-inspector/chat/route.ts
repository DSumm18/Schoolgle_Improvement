import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { messages, persona, schoolContext } = await req.json();

        const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        const baseUrl = process.env.OPENROUTER_API_KEY 
            ? 'https://openrouter.ai/api/v1' 
            : 'https://api.openai.com/v1';

        const personaDescriptions: Record<string, string> = {
            lead: 'Lead Inspector - probing overall effectiveness and leadership',
            curriculum: 'Curriculum Deep Diver - examining subject implementation',
            safeguarding: 'Safeguarding Lead - assessing child protection systems',
            send: 'SEND Specialist - evaluating inclusive practice',
            eyfs: 'EYFS Expert - focusing on early years provision'
        };

        const systemPrompt = `You are an Ofsted inspector (${personaDescriptions[persona] || personaDescriptions.lead}) conducting a mock inspection.

Your role:
- Ask probing, realistic questions like a real inspector
- Follow up on responses to dig deeper
- Be professional but direct
- Challenge vague answers
- Acknowledge good responses briefly but move on
- Focus on evidence and impact, not just intent

School context: ${JSON.stringify(schoolContext)}

Keep responses concise (2-4 sentences). After hearing a response, either:
1. Ask a follow-up question to probe deeper
2. Move to a new topic area
3. Thank them and conclude

Never break character. Never explain you're AI.`;

        if (apiKey) {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    ...(process.env.OPENROUTER_API_KEY && {
                        'HTTP-Referer': 'https://schoolgle.co.uk',
                        'X-Title': 'Schoolgle Mock Inspector Chat'
                    })
                },
                body: JSON.stringify({
                    model: process.env.OPENROUTER_API_KEY ? 'openai/gpt-4o' : 'gpt-4o',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.map((m: any) => ({
                            role: m.role === 'inspector' ? 'assistant' : 'user',
                            content: m.content
                        }))
                    ],
                    temperature: 0.8,
                    max_tokens: 200
                })
            });

            if (response.ok) {
                const data = await response.json();
                return NextResponse.json({ 
                    response: data.choices[0]?.message?.content 
                });
            }
        }

        // Fallback responses based on conversation length
        const fallbacks = [
            "Thank you. Can you tell me more about how you measure the impact of that? What evidence would show me it's working?",
            "Interesting. And specifically for your disadvantaged pupils - how do you ensure they're making the same progress as their peers?",
            "I see. Let's move on to another area. How do your middle leaders drive improvement in their subjects? What accountability is there?",
            "That's helpful context. Now, thinking about behaviour - how consistent is the application of your policy across all staff?",
            "OK. Finally, tell me about professional development here. How do you know the training you provide improves teaching?"
        ];

        const responseIndex = Math.min(Math.floor(messages.length / 2), fallbacks.length - 1);

        return NextResponse.json({ 
            response: fallbacks[responseIndex]
        });

    } catch (error: any) {
        console.error('Mock inspector chat error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

