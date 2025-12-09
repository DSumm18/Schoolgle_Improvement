/**
 * Pupil Premium Planner Skill
 *
 * Helps schools plan evidence-based pupil premium spending aligned with EEF research
 */

export interface PupilPremiumPlannerSkill {
  name: 'pupil_premium_planner';
  description: 'Analyze and plan pupil premium spending using EEF evidence';
  version: '1.0.0';

  // When to activate this skill
  triggers: {
    keywords: ['pupil premium', 'PP spending', 'disadvantaged pupils', 'EEF', 'pupil premium strategy'];
    contexts: ['planning', 'budgeting', 'school improvement', 'governor meeting'];
  };

  // What context this skill needs
  requiredContext: {
    schoolContext?: {
      phase: 'primary' | 'secondary' | 'all-through';
      ppPupilCount?: number;
      ppFunding?: number;
      identifiedBarriers?: string[];
    };
    userQuery: string;
    conversationHistory?: Array<{role: string; content: string}>;
  };

  // What this skill can do
  capabilities: {
    analyzeProposedSpending: boolean;
    suggestInterventions: boolean;
    evaluateEvidence: boolean;
    createBudgetBreakdown: boolean;
    generateSuccessCriteria: boolean;
    compareInterventions: boolean;
  };

  // How to use this skill
  usage: {
    inputFormat: 'natural language query about PP spending';
    outputFormat: 'structured advice with EEF evidence citations';
  };
}

/**
 * Skill implementation
 */
export class PupilPremiumPlanner {
  private knowledgeBase = 'skills-lab/knowledge/pupil-premium-eef-toolkit.md';

  /**
   * Analyze proposed PP spending against EEF evidence
   */
  async analyzeSpending(proposal: {
    interventions: Array<{
      name: string;
      description: string;
      cost: number;
      targetPupils: number;
      expectedOutcome: string;
    }>;
    totalBudget: number;
  }): Promise<{
    analysis: string;
    recommendations: string[];
    evidenceRatings: Array<{
      intervention: string;
      eefImpact: string;
      eefCost: string;
      eefEvidence: string;
      verdict: 'strong' | 'moderate' | 'weak' | 'avoid';
      reason: string;
    }>;
    budgetAllocation: {
      tier1Teaching: number;
      tier2TargetedSupport: number;
      tier3WiderStrategies: number;
      recommendation: string;
    };
  }> {
    // Implementation would:
    // 1. Load EEF knowledge base
    // 2. Match proposed interventions to EEF evidence
    // 3. Calculate budget allocation across tiers
    // 4. Generate recommendations

    // This is a prototype - actual implementation will use Ed's AI with knowledge base
    throw new Error('Prototype - implement with Ed AI integration');
  }

  /**
   * Suggest evidence-based interventions for specific barriers
   */
  async suggestInterventions(context: {
    barriers: string[];
    budget: number;
    phase: 'primary' | 'secondary';
    currentInterventions?: string[];
  }): Promise<{
    recommendations: Array<{
      name: string;
      eefImpact: string;
      rationale: string;
      estimatedCost: number;
      implementation: string;
      successCriteria: string[];
    }>;
    priorityOrder: string[];
    reasoning: string;
  }> {
    throw new Error('Prototype - implement with Ed AI integration');
  }

  /**
   * Generate a pupil premium strategy statement
   */
  async generateStrategy(input: {
    schoolName: string;
    ppPupilCount: number;
    funding: number;
    identifiedBarriers: string[];
    proposedInterventions: Array<{
      name: string;
      cost: number;
      rationale: string;
    }>;
  }): Promise<{
    strategyDocument: string; // Markdown formatted
    complianceCheck: {
      hasSchoolContext: boolean;
      hasBarriers: boolean;
      hasEvidenceLinks: boolean;
      hasSuccessCriteria: boolean;
      hasBudgetBreakdown: boolean;
      missingElements: string[];
    };
  }> {
    throw new Error('Prototype - implement with Ed AI integration');
  }

  /**
   * Compare two interventions
   */
  async compareInterventions(
    intervention1: string,
    intervention2: string
  ): Promise<{
    comparison: {
      intervention1: { impact: string; cost: string; evidence: string };
      intervention2: { impact: string; cost: string; evidence: string };
    };
    recommendation: string;
    reasoning: string;
  }> {
    throw new Error('Prototype - implement with Ed AI integration');
  }
}

/**
 * Example system prompt for this skill
 */
export const pupilPremiumPlannerPrompt = `You are Ed's Pupil Premium Planning specialist.

KNOWLEDGE BASE: You have access to comprehensive EEF Teaching & Learning Toolkit evidence.

YOUR ROLE:
- Help schools plan evidence-based pupil premium spending
- Always cite specific EEF impact ratings (e.g., "+6 months", "⭐⭐⭐⭐")
- Recommend the three-tiered approach (70-80% teaching, 15-20% targeted support, 5-10% wider strategies)
- Challenge low-impact interventions politely but clearly
- Be specific and actionable

WHEN ANALYZING SPENDING:
1. Match each intervention to EEF evidence
2. Calculate % of budget in each tier
3. Flag if spending skewed away from Tier 1 (teaching)
4. Suggest evidence-based alternatives for weak interventions
5. Provide specific implementation guidance

WHEN SUGGESTING INTERVENTIONS:
1. Start with school's identified barriers
2. Recommend highest-impact interventions first (metacognition, feedback, reading comprehension)
3. Explain WHY each intervention addresses the barrier
4. Give realistic cost estimates
5. Suggest measurable success criteria

AVOID:
- Generic advice ('focus on teaching quality' - be specific)
- Recommending interventions without EEF evidence
- Supporting low-impact interventions (e.g., setting/streaming)
- Ignoring school's specific context

OUTPUT FORMAT:
- Clear headings
- Bullet points for readability
- Evidence citations in brackets [EEF: +6 months, ⭐⭐⭐⭐]
- Specific next steps
`;

/**
 * Example usage
 */
export const exampleUsage = {
  query: "We're planning to spend our £50k pupil premium on: hiring a TA to support PP pupils in class, running homework club, and a trip to a university. Is this a good plan?",

  expectedSkillActivation: true,

  expectedResponse: `I need to be honest - this plan would likely have limited impact on closing the disadvantage gap. Here's my analysis:

## Analysis of Proposed Spending

### ❌ Hiring TA to support PP pupils in class
**EEF Evidence**: +4 months impact, ⭐⭐⭐ evidence strength
**Cost**: £20k (estimated)
**Concern**: TAs supporting lower-attaining pupils all day can be ineffective or even harmful
- Separates PP pupils from teacher input
- Creates learned helplessness
- Research shows this is one of the least effective uses of TAs

**Better approach**:
- Teacher maintains responsibility for PP pupils' learning
- TA delivers structured interventions (e.g., phonics program, reading comprehension)
- TA works with higher attainers while teacher works with PP pupils

### ⚠️ Homework club
**EEF Evidence**: +2 months (primary), +5 months (secondary), ⭐⭐
**Cost**: £5k (estimated for supervision)
**Verdict**: Useful but limited impact
- Can help provide quiet space/resources
- Won't close gap if teaching quality/curriculum gaps are the issue
- Better as complement to stronger interventions, not main strategy

### ❌ University trip
**EEF Evidence**: Aspiration interventions +0 months, ⭐⭐⭐
**Cost**: £5k
**Concern**: PP pupils often already have high aspirations
- The barrier is achieving those aspirations (exam results, social capital)
- Valuable for cultural capital but shouldn't be priority for PP spending
- Could fund this from other budgets (enrichment, PSHE)

## Current Budget Allocation

Your plan splits as:
- **Tier 1 (Teaching)**: £0 (0%)
- **Tier 2 (Targeted support)**: ~£25k (50% - TA interventions + homework club)
- **Tier 3 (Wider strategies)**: £5k (10% - university trip)
- **Unallocated**: £20k (40%)

**EEF Recommendation**: 70-80% teaching, 15-20% targeted support, 5-10% wider strategies

## Evidence-Based Alternative Plan

Here's how I'd suggest restructuring the £50k:

### Priority 1: Tier 1 - Quality First Teaching (£35k - 70%)

**1. Teacher CPD on feedback strategies** [EEF: +6 months, ⭐⭐⭐⭐]
- Cost: £10k
- Whole-staff training on effective feedback
- Focused on live marking, whole-class feedback, closing the gap tasks
- Impact: Benefits all pupils, particularly PP

**2. Metacognition and self-regulation training** [EEF: +7 months, ⭐⭐⭐⭐⭐]
- Cost: £8k
- Train teachers to explicitly teach learning strategies
- Provide planning time to embed in curriculum
- Impact: Helps PP pupils become independent learners

**3. High-quality curriculum resources** [EEF: +5 months for mastery approaches, ⭐⭐⭐]
- Cost: £12k
- E.g., White Rose Maths, Read Write Inc Phonics
- Ensures all pupils access ambitious curriculum
- Reduces teacher workload (more time for feedback)

**4. Instructional coaching** [EEF: Tied to feedback +6 months]
- Cost: £5k (release time for lead teachers to coach)
- Focused on implementing new feedback/metacognition strategies
- Embed evidence-based practice

### Priority 2: Tier 2 - Targeted Academic Support (£12k - 24%)

**5. Small group reading interventions** [EEF: +4 months, ⭐⭐⭐]
- Cost: £8k (TA delivery of structured program)
- Groups of 2-3 pupils, 3x per week
- Use proven program (e.g., Fresh Start phonics)
- TA trained in program delivery

**6. 1-1 tuition for identified gaps** [EEF: +5 months, ⭐⭐⭐]
- Cost: £4k
- National Tutoring Programme partnership or internal staff
- Short, regular sessions aligned to class curriculum
- Target specific knowledge gaps

### Priority 3: Tier 3 - Wider Strategies (£3k - 6%)

**7. Breakfast club** [EEF: +2 months, ⭐⭐]
- Cost: £2k
- Ensures PP pupils start day ready to learn
- Opportunity for homework completion in supervised space

**8. Enrichment**
- Cost: £1k
- University trip or similar (funded but not priority)

## Expected Impact

With this revised plan:
- **All pupils** benefit from improved teaching quality
- **PP pupils** get additional targeted support for specific gaps
- **Wider barriers** addressed (breakfast, enrichment)
- **Budget allocation** matches EEF evidence (70-80% teaching)

## Success Criteria

For your strategy statement, suggest:
1. **Teaching quality**: % of lessons rated good/outstanding (focus on feedback/metacognition)
2. **Academic progress**: PP pupils' reading ages improve by X months in Y time
3. **Attainment gap**: Reduce gap between PP and non-PP pupils by X% in reading/maths
4. **Attendance**: PP pupils' attendance improves to 96%+

## Next Steps

1. Consult with staff on revised plan
2. Cost each intervention accurately
3. Write pupil premium strategy statement (happy to help draft)
4. Set up evaluation methods (baseline assessments, lesson observations, etc.)
5. Share with governors for approval

Would you like me to help with any of these steps, or do you have questions about the suggested interventions?`,
};

export default PupilPremiumPlanner;
