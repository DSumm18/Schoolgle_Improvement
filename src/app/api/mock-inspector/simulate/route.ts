import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { schoolData, assessments, persona } = await req.json();

        const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        const baseUrl = process.env.OPENROUTER_API_KEY 
            ? 'https://openrouter.ai/api/v1' 
            : 'https://api.openai.com/v1';

        // Identify weak areas from assessments
        const weakAreas = Object.entries(assessments || {})
            .filter(([_, a]: [string, any]) => 
                a.schoolRating === 'needs_attention' || a.schoolRating === 'urgent_improvement'
            )
            .map(([key]) => key.replace(/-/g, ' '));

        if (apiKey) {
            const personaPrompts: Record<string, string> = {
                lead: 'You are the Lead Inspector focusing on overall effectiveness, leadership impact, and strategic vision.',
                curriculum: 'You are conducting a curriculum deep dive, focusing on subject leadership, curriculum design, and implementation.',
                safeguarding: 'You are the safeguarding lead inspector, focusing on child protection systems, culture of vigilance, and compliance.',
                send: 'You are a SEND specialist inspector, focusing on inclusion, adaptive teaching, and support for vulnerable learners.',
                eyfs: 'You are an EYFS expert, focusing on early years provision, learning through play, and child development.'
            };

            const prompt = `${personaPrompts[persona] || personaPrompts.lead}

Generate a realistic mock Ofsted inspection simulation for ${schoolData?.name || 'the school'}. 
Based on self-assessment, these areas may need attention: ${weakAreas.join(', ') || 'None identified'}.

Return JSON with:
1. greeting: Opening statement (2-3 sentences, professional but human)
2. questions: Array of 5-7 objects with:
   - id: unique string
   - category: Leadership/Curriculum/Safeguarding/SEND/Behaviour/Personal Development
   - question: The main question an inspector would ask
   - context: Why inspectors ask this (help the school prepare)
   - followUps: Array of 2-3 likely follow-up questions
   - expectedEvidence: Array of 3-4 documents/data the inspector expects
   - redFlags: Array of 2-3 things that would concern an inspector
3. challengeAreas: Array of specific areas this school should prepare for
4. tips: Array of 5 practical tips for inspection day
5. overallReadiness: Brief assessment based on the data provided

Return ONLY valid JSON.`;

            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    ...(process.env.OPENROUTER_API_KEY && {
                        'HTTP-Referer': 'https://schoolgle.co.uk',
                        'X-Title': 'Schoolgle Mock Inspector'
                    })
                },
                body: JSON.stringify({
                    model: process.env.OPENROUTER_API_KEY ? 'openai/gpt-4o' : 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0]?.message?.content;
                
                try {
                    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
                    return NextResponse.json(parsed);
                } catch {
                    // Fall through to default
                }
            }
        }

        // Return default simulation
        return NextResponse.json(generateDefaultSimulation(schoolData, weakAreas));

    } catch (error: any) {
        console.error('Mock inspector error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateDefaultSimulation(schoolData: any, weakAreas: string[]) {
    return {
        greeting: `Good morning. I'm the Lead Inspector for today's inspection of ${schoolData?.name || 'your school'}. We'll be spending time looking at the quality of education, behaviour, personal development, and leadership. Let's begin.`,
        questions: [
            {
                id: '1',
                category: 'Leadership',
                question: "What's your vision for education at this school, and how do you ensure all staff share it?",
                context: 'Inspectors assess whether leaders have high ambitions and communicate them effectively.',
                followUps: ['How do you communicate this to new staff?', 'Give an example of a decision shaped by this vision.'],
                expectedEvidence: ['Vision statement', 'Staff meeting minutes', 'CPD records'],
                redFlags: ['Vague or generic responses', 'Staff cannot articulate the vision']
            },
            {
                id: '2',
                category: 'Curriculum',
                question: 'Walk me through your curriculum in [subject]. What are the key concepts and how do they build?',
                context: 'Deep dives examine curriculum intent, implementation, and impact.',
                followUps: ['What do pupils find most challenging?', 'How do you address misconceptions?'],
                expectedEvidence: ['Curriculum maps', 'Assessment data', 'Work samples'],
                redFlags: ['No clear rationale', 'Content-heavy without progression']
            },
            {
                id: '3',
                category: 'Safeguarding',
                question: 'Tell me about your safeguarding culture. How do staff know what to do with a concern?',
                context: 'Safeguarding is always inspected. Culture matters as much as procedures.',
                followUps: ['What training have staff had?', 'Walk me through a recent case.'],
                expectedEvidence: ['SCR', 'Training records', 'Concern logs'],
                redFlags: ['Hesitation', 'Gaps in training', 'Poor records']
            },
            {
                id: '4',
                category: 'SEND',
                question: 'How do you identify and support SEND pupils? What does adaptive teaching look like?',
                context: 'Inclusion is central to the framework.',
                followUps: ['How do SEND pupils access the full curriculum?', 'What about parent relationships?'],
                expectedEvidence: ['SEND register', 'Provision maps', 'Progress data'],
                redFlags: ['Withdrawal as default', 'No progress tracking']
            },
            {
                id: '5',
                category: 'Behaviour',
                question: 'What are your behaviour expectations and how do you ensure consistency?',
                context: 'Behaviour and attitudes are assessed throughout.',
                followUps: ['How do you support pupils who struggle?', 'What does exclusion data show?'],
                expectedEvidence: ['Behaviour policy', 'Exclusion data', 'Support plans'],
                redFlags: ['High exclusions', 'Inconsistent application']
            }
        ],
        challengeAreas: weakAreas.length > 0 ? weakAreas : ['Ensure evidence is readily accessible', 'Prepare staff for curriculum deep dives'],
        tips: [
            'Be specific with examples - avoid generalisations',
            'Know your data, especially for disadvantaged and SEND pupils',
            'Be honest about areas for development',
            'Have evidence organised and accessible',
            'Ensure all staff can articulate the school vision'
        ],
        overallReadiness: 'Continue to prepare - practice articulating your strengths with evidence'
    };
}

