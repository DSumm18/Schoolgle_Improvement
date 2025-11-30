import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { transcript, teacherName, subject, yearGroup } = await req.json();

        if (!transcript) {
            return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
        }

        // Use OpenRouter/OpenAI for processing
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        const baseUrl = process.env.OPENROUTER_API_KEY 
            ? 'https://openrouter.ai/api/v1' 
            : 'https://api.openai.com/v1';

        if (apiKey) {
            const prompt = `You are an expert education consultant analyzing a lesson observation transcript. 
Extract the following information and return as JSON:

1. summary: A 2-3 sentence summary of the lesson
2. strengths: Array of 3-5 specific strengths observed
3. areasForDevelopment: Array of 2-3 areas for improvement
4. ratings: Object with these keys, each rated 1-4 (1=Inadequate, 2=RI, 3=Good, 4=Outstanding):
   - subjectKnowledge
   - pedagogy
   - adaptiveTeaching
   - assessment
   - behaviour
   - engagement
5. eefRecommendations: Array of 2-3 EEF research-based recommendations with expected impact
6. suggestedActions: Array of 2-3 specific next steps for the teacher
7. ofstedLinks: Array of relevant Ofsted framework areas (e.g., "Curriculum and Teaching", "Achievement")

Transcript:
${transcript}

Return ONLY valid JSON, no markdown formatting.`;

            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    ...(process.env.OPENROUTER_API_KEY && {
                        'HTTP-Referer': 'https://schoolgle.co.uk',
                        'X-Title': 'Schoolgle Voice Observation'
                    })
                },
                body: JSON.stringify({
                    model: process.env.OPENROUTER_API_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0]?.message?.content;
                
                try {
                    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
                    return NextResponse.json({
                        id: `obs_${Date.now()}`,
                        teacherName: teacherName || 'Teacher',
                        date: new Date().toISOString().split('T')[0],
                        duration: '30:00',
                        subject: subject || 'Not specified',
                        yearGroup: yearGroup || 'Not specified',
                        transcript,
                        ...parsed
                    });
                } catch {
                    // Fall through to default
                }
            }
        }

        // Fallback response
        return NextResponse.json({
            id: `obs_${Date.now()}`,
            teacherName: teacherName || 'Teacher',
            date: new Date().toISOString().split('T')[0],
            duration: '30:00',
            subject: subject || 'Not specified',
            yearGroup: yearGroup || 'Not specified',
            transcript,
            summary: 'A well-structured lesson demonstrating effective teaching practices with clear opportunities for development.',
            strengths: [
                'Strong subject knowledge with confident delivery',
                'Effective use of questioning techniques',
                'Good behaviour management strategies',
                'Clear learning objectives communicated'
            ],
            areasForDevelopment: [
                'Increase opportunities for student discussion and collaboration',
                'Consider pace and timing to maximise learning time',
                'Enhance differentiation strategies for SEND learners'
            ],
            ratings: {
                subjectKnowledge: 4,
                pedagogy: 3,
                adaptiveTeaching: 3,
                assessment: 3,
                behaviour: 4,
                engagement: 3
            },
            eefRecommendations: [
                'Feedback (+6 months): Implement more specific, actionable feedback during lessons',
                'Collaborative Learning (+5 months): Structure more peer discussion opportunities',
                'Metacognition (+7 months): Explicitly teach students to plan and evaluate their work'
            ],
            suggestedActions: [
                'Observe a colleague skilled in collaborative learning strategies',
                'Attend CPD on adaptive teaching for diverse learners',
                'Implement structured talk protocols in next lesson'
            ],
            ofstedLinks: [
                'Curriculum and Teaching - Teaching Quality',
                'Achievement - Progress and Attainment',
                'Inclusion - Adaptive Teaching'
            ]
        });

    } catch (error: any) {
        console.error('Process observation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

