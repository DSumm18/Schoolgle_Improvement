/**
 * Headteacher Report to Governors Generator
 *
 * Helps headteachers create structured, comprehensive reports for governor meetings
 */

export interface HTReportGeneratorSkill {
  name: 'ht_report_generator';
  description: 'Generate structured headteacher reports for governor meetings';
  version: '1.0.0';

  triggers: {
    keywords: ['headteacher report', 'HT report', 'report to governors', 'governor meeting', 'governance report'];
    contexts: ['governance', 'school leadership', 'reporting', 'accountability'];
  };

  requiredContext: {
    schoolContext?: {
      name: string;
      phase: 'primary' | 'secondary' | 'all-through';
      pupilCount?: number;
      term: string; // e.g., 'Autumn 2024', 'Spring 2025'
    };
    dataProvided?: {
      attendance?: any;
      attainment?: any;
      behavior?: any;
      safeguarding?: any;
      budget?: any;
      staffing?: any;
    };
    priorities?: string[];
    userQuery: string;
  };

  capabilities: {
    generateFullReport: boolean;
    generateSection: boolean;
    suggestContent: boolean;
    reviewDraft: boolean;
    createExecutiveSummary: boolean;
  };
}

export class HTReportGenerator {
  private knowledgeBase = 'skills-lab/knowledge/headteacher-report-templates.md';

  /**
   * Generate a complete HT report
   */
  async generateReport(input: {
    schoolName: string;
    term: string;
    schoolContext: any;
    dataProvided: any;
    priorities: string[];
  }): Promise<{
    report: string; // Full markdown report
    executiveSummary: string;
    sectionsGenerated: string[];
    missingData: string[];
    suggestions: string[];
  }> {
    throw new Error('Prototype - implement with Ed AI integration');
  }

  /**
   * Generate specific section of report
   */
  async generateSection(
    sectionName: string,
    data: any,
    schoolContext: any
  ): Promise<{
    content: string;
    dataUsed: string[];
    suggestedImprovements: string[];
  }> {
    throw new Error('Prototype - implement with Ed AI integration');
  }

  /**
   * Review and improve existing report draft
   */
  async reviewReport(draftReport: string): Promise<{
    feedback: Array<{
      section: string;
      issue: string;
      suggestion: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    strengthsIdentified: string[];
    overallScore: number; // 0-10
    improvedVersion?: string;
  }> {
    throw new Error('Prototype - implement with Ed AI integration');
  }

  /**
   * Suggest content based on school priorities
   */
  async suggestContent(context: {
    sectionName: string;
    schoolPriorities: string[];
    previousReports?: string[];
  }): Promise<{
    suggestedContent: string;
    rationale: string;
    exampleData: string;
  }> {
    throw new Error('Prototype - implement with Ed AI integration');
  }
}

export const htReportGeneratorPrompt = `You are Ed's Governance Reporting specialist.

KNOWLEDGE BASE: You have comprehensive templates and guidance for headteacher reports to governors.

YOUR ROLE:
- Help headteachers create clear, impactful reports for governors
- Structure information logically (context, performance, safeguarding, finance, priorities)
- Focus on impact, not just activity
- Highlight areas needing governor scrutiny or decisions
- Use data meaningfully with interpretation
- Be honest about challenges (governors can't help if they don't know)

REPORT STRUCTURE (Standard):
1. **School Context**: Pupil numbers, staffing changes, significant events
2. **Educational Performance**: Attainment, progress, curriculum, SEND
3. **Safeguarding and Welfare**: Safeguarding, attendance, behavior
4. **Leadership and Management**: SIP progress, policies, compliance
5. **Finance and Resources**: Budget, spending, premises
6. **Parental Engagement**: Events, feedback, complaints, community
7. **Priorities and Decisions**: Next term focus, decisions needed, strategic discussions

BEST PRACTICES:
- **Focus on impact**: Not "we ran CPD" but "CPD delivered, early impact shows X% improvement"
- **Use data meaningfully**: Explain what data means, trends, actions
- **Highlight governor attention areas**: Make clear what needs scrutiny/decision
- **Be honest about challenges**: Explain problems AND proposed solutions
- **Suggest actions**: Don't just report issues, propose responses
- **Keep it readable**: 4-6 pages main report, detailed data in appendices
- **Avoid jargon**: Explain acronyms, write for non-educators

WHEN GENERATING REPORTS:
1. Start with provided school context and data
2. Structure using standard headings
3. Interpret data (don't just present numbers)
4. Include previous priorities to show progress
5. Highlight decisions needed from governors
6. Suggest strategic discussion topics
7. Be specific (avoid generic statements)

WHEN REVIEWING REPORTS:
1. Check all essential sections included
2. Ensure data is interpreted, not just presented
3. Look for areas needing governor scrutiny
4. Check if challenges are explained with solutions
5. Verify priorities are clear
6. Ensure language is accessible

OUTPUT FORMAT:
- Markdown formatted report
- Clear headings and subheadings
- Bullet points for readability
- Data in context (not just numbers)
- Action-oriented language
- Executive summary (1 page)

AVOID:
- Generic statements ("teaching is good")
- Data without interpretation
- Hiding challenges
- Jargon and unexplained acronyms
- Overly long reports (governors won't read 15 pages)
- Activity lists without impact evidence
`;

export const exampleUsage = {
  query: "I need to write my termly headteacher report for governors. Can you help me structure the educational performance section? We're a primary school, and I have our latest assessment data.",

  expectedResponse: `Of course! The educational performance section is crucial - it's where governors really need to see impact and hold you to account. Let me help you structure it effectively.

## Educational Performance Section Structure

I'd suggest breaking this into three subsections:

### 1. Attainment and Progress
**What to include**:
- Current assessment data with interpretation
- Progress since last report
- Comparisons (previous years, targets, national if available)
- Gap analysis (PP vs non-PP, SEND, EAL, etc.)
- Actions being taken

**Template**:

\`\`\`markdown
### Attainment and Progress

**Current Attainment (Spring 2025 Assessments)**

| Year Group | Reading | Writing | Maths |
|-----------|---------|---------|-------|
| Year 1 | 76% | 71% | 78% |
| Year 2 | 82% | 75% | 80% |
| Year 3 | 79% | 73% | 81% |
| Year 4 | 84% | 78% | 83% |
| Year 5 | 80% | 74% | 79% |
| Year 6 | 85% | 78% | 86% |

*% at expected standard or above*

**Key Points**:
- **Year 6 on track**: 85% reading, 78% writing, 86% maths (targets: 80%, 75%, 85%)
- **Writing focus**: Whole-school priority, seeing improvement (up 5% from autumn)
- **Year 1**: Below target in reading/writing - targeted intervention in place

**Progress Tracking**:
- **Good/better progress**: 83% of pupils across school (target: 85%)
- **Accelerated progress groups**: 24 pupils receiving small-group tuition (14 already showing catch-up)

**Gap Analysis**:
| Group | Reading Gap | Writing Gap | Maths Gap |
|-------|------------|------------|-----------|
| PP vs non-PP | 12% | 15% | 10% |
| SEND vs non-SEND | 28% | 32% | 25% |

**Narrowing gaps**:
- PP gap reduced from 18% to 12% in reading (targeted tuition impact)
- SEND gap expected (but 67% of SEND pupils making expected progress for their starting points)

**Actions**:
1. Continue writing intervention (Talk for Writing approach showing impact)
2. Additional 1-1 tuition for 8 Year 6 pupils (targeted at borderline expected/greater depth)
3. Pre-teaching vocabulary for PP pupils in Years 3-5 (addressing reading comprehension gaps)
\`\`\`

### 2. Curriculum and Teaching Quality
**What to include**:
- Curriculum developments or changes
- Subject leader updates (if significant)
- Teaching quality evidence (lesson observations, work scrutiny)
- CPD undertaken and early impact
- Any new initiatives

**Template**:

\`\`\`markdown
### Curriculum and Teaching Quality

**Curriculum Developments**:
- **Maths**: White Rose Maths embedded across school, early signs of impact (improved fluency)
- **Science**: New knowledge organisers for all units (supporting knowledge retention)
- **Computing**: Online safety curriculum updated (reflects latest guidance)

**Subject Leadership**:
- English lead: Monitoring shows consistent application of Talk for Writing (10/10 classes)
- Maths lead: Calculation policy reviewed (shared with parents, positive feedback)
- PE lead: New gymnastics scheme purchased and staff training delivered

**Teaching Quality**:
- **Lesson observations** (this term): 18 lessons observed
  - Outstanding: 3 (17%)
  - Good: 13 (72%)
  - Requires improvement: 2 (11%)
  - Inadequate: 0

- **Areas of strength**: Use of worked examples in maths, responsive teaching, pupil engagement
- **Development areas**: Checking understanding before moving on, use of pre-teaching for PP pupils

**CPD Undertaken**:
- **Whole-staff**: Talk for Writing (INSET day, January)
  - Early impact: Writing data up 5%, pupils more confident with genre features
- **Teaching assistants**: Supporting reading comprehension (twilight sessions)
- **Leadership team**: Ofsted preparation (deep dive training)

**Quality Assurance**:
- Book looks completed for writing (good progression of skills, marking for improvement evident)
- Pupil voice: 92% say lessons are interesting, 87% say teachers help them when stuck
- Parent survey: 94% satisfied with teaching quality
\`\`\`

### 3. SEND and Inclusion
**What to include**:
- SEND cohort numbers
- Quality of provision and progress
- EHCP updates
- Interventions and impact
- Parent engagement

**Template**:

\`\`\`markdown
### SEND and Inclusion

**SEND Cohort**:
- **Total on SEND register**: 58 pupils (13.2% of cohort)
  - SEN Support: 50 pupils
  - EHCP: 8 pupils
- **Primary needs**: Speech and language (22 pupils), SEMH (14), Cognition and learning (12), ASD (6), Physical (4)

**Progress**:
- **67% of SEND pupils** making expected progress for their starting points (good)
- **EHCP pupils**: All making progress against outcomes in their plans
- **3 pupils**: Undergoing EHCP assessment (outcomes expected May/June)

**Quality of Provision**:
- **Interventions running**:
  - Precision Teaching (reading): 12 pupils (8 showing 6+ months progress in 3 months)
  - NELI (language): 8 pupils (7 improved Wellcomm scores)
  - Lego Therapy (social skills): 6 pupils (reduced playground incidents)
  - Fresh Start Phonics: 10 pupils (5 now accessing age-appropriate texts)

- **Staff expertise**:
  - SENCO completing NASENCO qualification (due July)
  - 3 TAs trained in autism awareness
  - 2 TAs trained in Makaton

**Inclusion Initiatives**:
- **Sensory room** opened (funded by PTA £3k) - used by 14 pupils, reducing dysregulation incidents
- **SEND coffee morning** for parents (16 attended, positive feedback)
- **Accessibility**: All pupils accessing full curriculum (reasonable adjustments in place)

**Parent Engagement**:
- **SEND review meetings**: 52/58 parents attended (90% attendance, excellent)
- **Parent feedback**: 88% satisfied with SEND provision (parent survey)
- **1 complaint**: Resolved at informal stage (concern about TA consistency - now addressed with staffing changes)

**Next Steps**:
- Embed trauma-informed practice training (whole-staff, summer term)
- Review SEND information report (annual update due)
- Appoint new higher-level TA specializing in SEMH (recruitment underway)
\`\`\`

---

## Tips for Your Report

1. **Use your data**: Replace my example numbers with your actual assessment data
2. **Interpret, don't just present**: Explain what the data means ("Year 6 on track" not just "85%")
3. **Show actions**: For any issues, explain what you're doing about it
4. **Highlight governor focus areas**: E.g., "Governors should note the writing improvement - CPD investment is paying off"
5. **Be honest about challenges**: If Year 1 is below target, say so and explain intervention plan
6. **Link to school priorities**: If writing is a SIP priority, show progress explicitly

## Questions to Consider

To help me tailor this further, could you share:
- What are your current school improvement priorities? (so I can link data to SIP progress)
- Do you have any specific challenges you want to highlight to governors?
- What's your school context? (e.g., high PP %, large SEND cohort, etc.)

Would you like me to help draft any of these sections with your specific data, or would you like templates for the other sections (safeguarding, finance, etc.)?`,
};

export default HTReportGenerator;
