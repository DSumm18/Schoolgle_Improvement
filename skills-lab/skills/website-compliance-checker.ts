/**
 * Website Compliance Checker Skill
 *
 * Audits school websites against statutory requirements and provides specific fixes
 */

export interface WebsiteComplianceCheckerSkill {
  name: 'website_compliance_checker';
  description: 'Audit school website compliance and suggest fixes';
  version: '1.0.0';

  triggers: {
    keywords: ['website', 'compliance', 'statutory', 'what must we publish', 'website audit', 'DfE requirements'];
    contexts: ['governance', 'compliance', 'website review', 'ofsted preparation'];
  };

  requiredContext: {
    schoolType: 'maintained' | 'academy' | 'free school' | 'unknown';
    websiteUrl?: string;
    currentIssues?: string[];
    userQuery: string;
  };

  capabilities: {
    auditStatutoryRequirements: boolean;
    checkAccessibility: boolean;
    suggestImprovements: boolean;
    prioritizeIssues: boolean;
    generateComplianceChecklist: boolean;
  };
}

export class WebsiteComplianceChecker {
  private knowledgeBase = 'skills-lab/knowledge/website-compliance-requirements.md';

  /**
   * Generate comprehensive compliance checklist
   */
  async generateChecklist(schoolType: 'maintained' | 'academy'): Promise<{
    checklist: Array<{
      category: string;
      items: Array<{
        requirement: string;
        mandatory: boolean;
        whoFor: string[];
        guidance: string;
      }>;
    }>;
    priorities: {
      critical: string[];
      important: string[];
      recommended: string[];
    };
  }> {
    throw new Error('Prototype - implement with Ed AI integration');
  }

  /**
   * Audit website based on user-provided issues or URL
   */
  async auditWebsite(input: {
    schoolType: 'maintained' | 'academy';
    foundOnWebsite: string[]; // What user says they HAVE published
    notFoundOnWebsite?: string[]; // What user says is MISSING
  }): Promise<{
    compliance: {
      critical: { compliant: string[]; missing: string[] };
      important: { compliant: string[]; missing: string[] };
      recommended: { compliant: string[]; missing: string[] };
    };
    specificFixes: Array<{
      issue: string;
      severity: 'critical' | 'important' | 'recommended';
      whatToPublish: string;
      whereToFind: string;
      exampleContent?: string;
    }>;
    overallScore: {
      compliant: number;
      total: number;
      percentage: number;
      verdict: string;
    };
  }> {
    throw new Error('Prototype - implement with Ed AI integration');
  }

  /**
   * Answer specific compliance questions
   */
  async answerComplianceQuery(query: string, schoolType: string): Promise<{
    answer: string;
    relevantRequirements: string[];
    resources: Array<{ title: string; url: string }>;
  }> {
    throw new Error('Prototype - implement with Ed AI integration');
  }
}

export const websiteCompliancePrompt = `You are Ed's Website Compliance specialist.

KNOWLEDGE BASE: You have comprehensive knowledge of DfE website requirements (Section 328, Education Act 1996, School Information Regulations 2008).

YOUR ROLE:
- Audit school websites against statutory requirements
- Provide specific, actionable fixes (not just "you need to publish X")
- Prioritize critical compliance issues (safeguarding, admissions, complaints)
- Explain WHAT to publish and WHY it matters
- Consider both maintained schools and academies (different requirements)

WHEN AUDITING WEBSITES:
1. Systematically check each required section
2. Identify critical vs. important vs. recommended issues
3. Provide specific fixes with examples
4. Explain legal basis for each requirement
5. Note good practice when you see it

CRITICAL ISSUES (Fix Immediately):
- Safeguarding policy out of date
- No admissions policy
- No complaints procedure
- Contact details incorrect
- Accessibility statement missing

IMPORTANT ISSUES (Fix Within a Month):
- Pupil premium strategy not published
- SEND information report missing
- Exclusions data not published
- Governance information incomplete
- Policies undated or old (3+ years)

RECOMMENDED (Fix When Possible):
- Poor navigation/usability
- Accessibility issues (contrast, alt text)
- Broken links
- Generic content

OUTPUT FORMAT:
- Group issues by severity (Critical/Important/Recommended)
- For each issue, provide:
  - What's missing
  - What should be published
  - Where to find information
  - Example content (if helpful)
- Give practical next steps

AVOID:
- Overwhelming schools with too much at once (prioritize)
- Just listing requirements without explaining fixes
- Forgetting to differentiate maintained vs. academy requirements
`;

export const exampleUsage = {
  query: "I'm a governor and I've been asked to check our website compliance. Where do I start?",

  expectedResponse: `Great question! Let me give you a systematic approach to checking your school website's compliance.

## Step 1: Understand What Applies to Your School

First, is your school:
- **Maintained** (local authority school), or
- **Academy/free school**?

Most requirements are the same, but academies have additional financial transparency requirements.

## Step 2: Critical Checks (Do This First)

These are legal requirements that Ofsted may check and could put the school at risk if missing:

### ✅ Safeguarding Policy
**What to check**:
- Is the child protection and safeguarding policy published?
- Is it dated September 2024 or later? (Must reflect latest KCSIE)
- Does it name the Designated Safeguarding Lead?

**Why critical**: Legal requirement, Ofsted checks this

**If missing**: Publish immediately. Get policy from headteacher, ensure it references "Keeping Children Safe in Education 2024"

### ✅ Admissions Information
**What to check**:
- Admissions policy for current year AND next year
- Determined admission number (PAN)
- Oversubscription criteria
- In-year admissions process

**Why critical**: Parents have legal right to this information

**If missing**: Get admissions policy from school office or local authority

### ✅ Complaints Procedure
**What to check**:
- How to make a complaint
- Stages of process (usually 3 stages)
- Who to contact at each stage
- Timescales

**Why critical**: Legal requirement

**If missing**: Use DfE model policy or local authority template

### ✅ Contact Details
**What to check**:
- School name, address, phone, email
- Headteacher name
- Chair of governors name

**Why critical**: Parents need to contact school

**If missing/wrong**: Update immediately

## Step 3: Important Information (Check Within a Month)

### ✅ Pupil Premium Strategy
**What to check**:
- Current year strategy statement
- Previous year's impact report
- Amount of funding received
- How it will be spent (with evidence/rationale)

**What should be included**:
- Number of PP pupils
- Identified barriers to learning
- Chosen interventions and why (link to evidence like EEF)
- How impact will be measured
- Budget breakdown

**If missing**: Work with headteacher to publish strategy. I can help draft this if you share your school's context.

### ✅ SEND Information
**What to check**:
- SEND policy
- SEND information report
- Name of SENCO
- Link to local authority local offer

**The information report must explain**:
- How school identifies SEND
- How parents can raise concerns
- How school supports SEND pupils
- Staff expertise and training
- How effectiveness is evaluated

**If missing**: SENCO should have this - if not, I can help create a template

### ✅ Governance Information
**What to check**:
- List of all governors/trustees
- Governor roles and committees
- Attendance records (transparency requirement)
- Business interests register
- (*Academies also*: Articles, funding agreement, members list)

**If out of date**: This is very common - get updated list from clerk to governors

### ✅ Ofsted Information
**What to check**:
- Link to most recent Ofsted report
- Ofsted rating displayed prominently
- Date of last inspection

**Why important**: Parents want to see this (legal requirement to publish)

**If buried/missing**: Make it prominent on homepage or About section

### ✅ Curriculum Information
**What to check**:
- Curriculum statement (intent, implementation, impact)
- What's taught in each year group
- Names of phonics/reading schemes (primary)

**If generic**: Just saying "we follow National Curriculum" isn't enough - need to show what children learn in each year group

## Step 4: Accessibility (Legal Requirement)

**Check**:
- Is there an accessibility statement?
- Can you resize text to 200% without content breaking?
- Do images have alt text?
- Is color contrast sufficient?
- Are PDFs accessible (not scanned images)?

**Common issues**:
- Scanned PDF documents (not accessible to screen readers)
- Light grey text (poor contrast)
- Links saying "click here" instead of describing destination
- No accessibility statement

**Fix**: Add accessibility statement explaining any known issues and how to request alternative formats

## Step 5: Policies to Check Are Published

**Statutory policies** (must publish):
- ✅ Admissions
- ✅ Behavior policy
- ✅ Charging and remissions
- ✅ Child protection/safeguarding
- ✅ Complaints
- ✅ Equality information and objectives
- ✅ Exclusions policy
- ✅ SEND policy and information report

**Check each policy**:
- Is it dated? (Should be reviewed every 1-3 years)
- Does it reflect current practice?
- Is it findable? (Not buried deep)

## Your Audit Checklist

I'd suggest creating a simple spreadsheet:

| Requirement | Published? | Up to date? | Action needed | Priority |
|------------|-----------|-------------|---------------|----------|
| Safeguarding policy | Yes | Sept 2024 | None | Critical |
| Admissions policy | Yes | 2024/25 only | Add 2025/26 policy | Critical |
| Contact details | Yes | HT name wrong | Update HT name | Critical |
| PP strategy | No | N/A | Publish strategy | Important |
| ... | ... | ... | ... | ... |

## Useful Resources

- **DfE guidance (maintained schools)**: gov.uk/guidance/what-maintained-schools-must-publish-online
- **DfE guidance (academies)**: gov.uk/guidance/what-academies-free-schools-and-colleges-should-publish-online
- **Accessibility requirements**: gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps

## Quick Wins

If you're short on time, prioritize:
1. Fix critical issues (safeguarding, admissions, complaints, contact details)
2. Publish pupil premium strategy (Ofsted may ask about this)
3. Update governance information (shows transparency)
4. Add accessibility statement
5. Check all policies are dated and current

## Who to Involve

- **Headteacher**: Overall responsibility, has most policies
- **School business manager**: Financial information, some policies
- **SENCO**: SEND report
- **Clerk to governors**: Governance information
- **Website admin**: Technical updates

But remember: **Governors are ultimately responsible for compliance** - you're right to be checking!

## Next Steps

1. Go through the critical checks first (should take 30 mins)
2. Note any missing/out of date items
3. Bring list to next governors' meeting
4. Agree timeline for fixes (critical = immediate, important = within a month)
5. Review again in 6 months

Would you like me to help with any specific section? For example, I can help draft a pupil premium strategy, explain what should be in a SEND information report, or create a governance information template.`,
};

export default WebsiteComplianceChecker;
