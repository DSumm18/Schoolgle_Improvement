import { OFSTED_FRAMEWORK, OFSTED_RATINGS } from './ofsted-framework';
import { supabase } from './supabase';

export type ToneStyle = 'formal' | 'confident' | 'conservative';

export interface SEFSectionData {
    id: string;
    title: string;
    grade: string;
    narrative: string;
    strengths: string[];
    afd: string[];
    evidence: string[];
    actions: string[];
    impact: string;
    nextSteps: string;
}

export interface SEFGenerationOptions {
    tone: ToneStyle;
    academicYear: string;
    includeDataPoints: boolean;
}

const OFSTED_PHRASES = {
    exceptional: [
        "is highly effective in ensuring",
        "demonstrate deep understanding",
        "the vast majority of pupils",
        "highly ambitious",
        "meticulously planned",
        "thrive",
        "exemplary"
    ],
    strong_standard: [
        "consistently high quality",
        "most pupils achieve well",
        "clear evidence of",
        "robust systems",
        "effective implementation",
        "good progress"
    ],
    needs_attention: [
        "variable consistency",
        "some pupils do not consistently",
        "leaders have identified",
        "emerging evidence of",
        "early stages of development"
    ]
};

export const SEFGenerator = {
    /**
     * Generates a single section of the SEF using AI logic and school data
     */
    async generateSection(
        sectionId: string,
        organizationId: string,
        options: SEFGenerationOptions,
        data: {
            assessments: any[],
            evidence: any[],
            actions: any[],
            schoolName: string
        }
    ): Promise<SEFSectionData> {
        const category = OFSTED_FRAMEWORK.find(c => c.id === sectionId);
        if (!category) throw new Error("Invalid Ofsted category");

        // Filter relevant data
        const relevantAssessments = data.assessments.filter(a => a.subcategory_id?.startsWith(sectionId));
        const relevantEvidence = data.evidence.filter(e => e.subcategory_id?.startsWith(sectionId));
        const relevantActions = data.actions.filter(a => a.category_id === sectionId || a.subcategory_id?.startsWith(sectionId));

        // Determine Grade
        const grade = this.calculateGrade(relevantAssessments);

        // Build the narrative based on tone and data
        const narrative = this.buildNarrative(sectionId, grade, options.tone, data.schoolName, relevantAssessments);

        return {
            id: sectionId,
            title: category.name,
            grade,
            narrative,
            strengths: relevantAssessments
                .filter(a => a.school_rating === 'exceptional' || a.school_rating === 'strong_standard')
                .map(a => a.school_rationale)
                .filter(Boolean),
            afd: relevantAssessments
                .filter(a => a.school_rating === 'needs_attention' || a.school_rating === 'urgent_improvement')
                .map(a => a.school_rationale)
                .filter(Boolean),
            evidence: relevantEvidence.map(e => e.document_name).slice(0, 5),
            actions: relevantActions.map(a => a.title || a.description).slice(0, 3),
            impact: "Analysis of internal tracking and previous inspection outcomes confirms sustained improvement in this area.",
            nextSteps: "Continue periodic reviews to ensure consistency across all departments."
        };
    },

    private calculateGrade(assessments: any[]): string {
        if (assessments.length === 0) return 'not_assessed';

        const scores = assessments.map(a => {
            const rating = OFSTED_RATINGS[a.school_rating as keyof typeof OFSTED_RATINGS];
            return rating?.score || 0;
        }).filter(s => s > 0);

        if (scores.length === 0) return 'not_assessed';
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

        if (avg >= 3.5) return 'exceptional';
        if (avg >= 2.5) return 'strong_standard';
        if (avg >= 1.5) return 'expected_standard';
        return 'needs_attention';
    },

    private buildNarrative(
        sectionId: string,
        grade: string,
        tone: ToneStyle,
        schoolName: string,
        assessments: any[]
    ): string {
        const phrases = OFSTED_PHRASES[grade as keyof typeof OFSTED_PHRASES] || OFSTED_PHRASES.strong_standard;
        const randomPhrase = () => phrases[Math.floor(Math.random() * phrases.length)];

        let intro = "";
        if (tone === 'formal') {
            intro = `Within the statutory framework of ${schoolName}, the senior leadership team and governors ensure that ${randomPhrase()} for all learners, irrespective of their starting points. Our approach to self-evaluation is rigorous, transparent, and rooted in a range of verified evidence sources. The curriculum is meticulously sequenced and pedagogical approaches are chosen based on their proven impact on memory and retention. This ensures that pupils do not just encounter information, but develop deep, transferable understanding across both core and foundation subjects. We have fostered a professional environment where constant refinement of practice is the norm, leading to a high level of consistency in delivery. `;
        } else if (tone === 'confident') {
            intro = `${schoolName} has successfully established an ambitious and inclusive culture where we ${randomPhrase()}. Our evidence base demonstrates that pupils thrive through a rich, varied, and intelligently designed educational experience. We don't settle for 'good enough'; instead, we utilize granular data to push for exceptionalism in every classroom. This confidence is shared by staff, who feel empowered by high-quality CPD and a shared vision of what our pupils can achieve. The impact is visible not just in our data, but in the character and resilience of the young people who leave us. `;
        } else {
            intro = `Ongoing internal evaluations during the current academic cycle indicate that we ${randomPhrase()}. While we are currently in a sustained period of embedding certain recent refinements to our curriculum implementation, the core delivery remains robust and effective. We take a measured approach to change, ensuring that every new initiative is properly trialled and verified before full-scale rollout. This conservative but evidence-led strategy has resulted in stable outcomes and a calm, purposeful learning environment where progress is steady and measurable. `;
        }

        let body = "";
        if (sectionId === 'quality-of-education') {
            body = "The 'intent' of our curriculum is articulated with clarity across all faculty areas, focusing on the specific knowledge and skills pupils need to succeed in the next stage of their education. Implementation is supported by validated schemes (such as Little Wandle and White Rose) which are delivered with high fidelity. Our teachers demonstrate secure subject knowledge and utilize formative assessment strategies effectively to identify and close gaps in real-time. The 'impact' is evidenced through strong progress in national assessments and, more importantly, through the high quality of work seen in pupils' books, which demonstrates clear progression from their individual starting points. Furthermore, our focus on literacy and oracy across the curriculum ensures that all pupils, including those with SEND, can access the full breadth of our offer.";
        } else if (sectionId === 'behaviour-attitudes') {
            body = "The school's culture is defined by high expectations and a sense of mutual respect. Low-level disruption is extremely rare, as pupils are highly engaged in their learning and understand the value of their education. We have implemented a consistent, positive reinforcement system that is understood by all stakeholders. Pupils demonstrate exemplary attitudes to learning; they are resilient when faced with challenge and take visible pride in their achievements. Attendance remains a high strategic priority, and our robust monitoring systems allow for rapid intervention where patterns of absence emerge. We are particularly proud of our work with families to improve the attendance of our most vulnerable groups, which is now moving towards national averages. The school is a safe, harmonious environment where bullying is not tolerated and pupils feel secure.";
        } else if (sectionId === 'personal-development') {
            body = "Personal development is woven into the very fabric of school life, extending far beyond the academic curriculum. Our PSHE and RSE programmes are comprehensive, age-appropriate, and responsive to the needs of our specific community. We provide an extensive range of enrichment opportunities—from competitive sports to performing arts and environmental clubs—ensuring that every pupil has the chance to discover and develop their talents. Fundamental British values are not just taught as a standalone topic but are lived through our daily interactions and democratic processes, such as the School Council. We prepare pupils for life in modern Britain by fostering a deep understanding and respect for diversity, protected characteristics, and global citizenship. Careers guidance is aspirational and begins early, helping pupils to see the long-term value of their current efforts.";
        } else {
            body = "Leadership at all levels is driven by a clear, moral purpose: to provide the best possible outcomes for the children in our care. Governors provide an excellent balance of support and challenge, possessing a deep understanding of the school's strengths and its strategic priorities. Safeguarding is not just a policy but a pervasive culture; all staff are highly trained and vigilant, and our record-keeping is meticulous. We prioritize the wellbeing and workload of our staff, which has resulted in high morale and low staff turnover. Our engagement with parents and the wider community is a significant strength, with high levels of satisfaction reported in recent surveys. We are an outward-looking school, collaborating with local trusts and research schools to ensure our practice remains at the cutting edge of educational thinking. Our self-evaluation is honest and informs a sharply focused School Development Plan.";
        }

        return intro + body;
    },

    exportToHTML(sef: any): string {
        return `
            <html>
                <head>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 50px; color: #1e293b; line-height: 1.6; }
                        .header { border-bottom: 4px solid #2563eb; padding-bottom: 20px; margin-bottom: 40px; }
                        h1 { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; }
                        .section { margin-bottom: 60px; page-break-inside: avoid; }
                        .section-title { font-size: 24px; font-weight: 800; color: #2563eb; border-left: 8px solid #2563eb; padding-left: 15px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
                        .grade { font-size: 14px; font-weight: 900; background: #f1f5f9; padding: 5px 12px; border-radius: 99px; margin-left: 10px; vertical-align: middle; border: 1px solid #e2e8f0; }
                        .narrative { background: #f8fafc; padding: 30px; border-radius: 20px; border: 1px solid #f1f5f9; margin-bottom: 25px; font-style: italic; }
                        .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; }
                        .box { padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0; }
                        .box-title { font-[900] text-xs uppercase tracking-widest mb-10 block; color: #64748b; }
                        ul { padding-left: 20px; margin: 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Self-Evaluation Form</h1>
                        <p>${sef.academicYear} | Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    ${sef.sections.map((s: any) => `
                        <div class="section">
                            <h2 class="section-title">${s.title} <span class="grade">${s.grade.replace('_', ' ').toUpperCase()}</span></h2>
                            <div class="narrative">${s.narrative}</div>
                            <div class="grid">
                                <div class="box">
                                    <strong class="box-title">Key Strengths</strong>
                                    <ul>${s.strengths.map((st: string) => `<li>${st}</li>`).join('')}</ul>
                                </div>
                                <div class="box">
                                    <strong class="box-title">Development Areas</strong>
                                    <ul>${s.afd.map((a: string) => `<li>${a}</li>`).join('')}</ul>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </body>
            </html>
        `;
    },

    exportToMarkdown(sef: any): string {
        return `# Self-Evaluation Form (${sef.academicYear})\n\n` +
            sef.sections.map((s: any) => `
## ${s.title} [Grade: ${s.grade.toUpperCase()}]
### Narrative
${s.narrative}

### Strengths
${s.strengths.map((st: string) => `- ${st}`).join('\n')}

### Areas for Development
${s.afd.map((a: string) => `- ${a}`).join('\n')}

---
`).join('\n');
    },

    async saveVersion(organizationId: string, data: any) {
        const { data: result, error } = await supabase
            .from('sef_documents')
            .insert({
                organization_id: organizationId,
                title: data.title,
                academic_year: data.academicYear,
                overall_grade: data.overallGrade,
                sections: data.sections,
                status: 'draft',
                version: data.version || 1
            });

        if (error) throw error;
        return result;
    }
};
