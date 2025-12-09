# Ed Skills Lab

## Overview

The Skills Lab is Ed's specialized knowledge and capability system. Instead of relying solely on general AI knowledge, Ed can activate **domain-specific skills** with comprehensive knowledge bases when handling UK schools topics.

## Why Skills?

**Problem**: General AI chatbots give generic advice that isn't tailored to UK education context.

**Solution**: When Ed detects specific topics (pupil premium, website compliance, governance), activate specialist skills with:
- Comprehensive UK-specific knowledge bases
- Evidence-based guidance (EEF research, DfE requirements, Ofsted framework)
- Specific, actionable advice (not generic platitudes)
- Up-to-date statutory requirements

## Wave 1 Skills (Complete ✅)

### 1. Pupil Premium Planner
**Purpose**: Help schools plan evidence-based pupil premium spending

**Knowledge Base**: EEF Teaching & Learning Toolkit
- All intervention evidence ratings (+X months impact)
- Three-tiered spending approach (70% teaching, 20% targeted, 10% wider)
- Common pitfalls and how to avoid them
- Implementation guidance

**Example Use Case**: School wants to spend £120k PP funding → Ed analyzes against EEF evidence, challenges low-impact interventions, suggests alternatives matched to barriers

**Triggers**: "pupil premium", "PP spending", "disadvantaged pupils", "EEF"

---

### 2. Website Compliance Checker
**Purpose**: Audit school websites against statutory requirements

**Knowledge Base**: DfE Website Requirements (Section 328, Education Act 1996)
- All statutory information schools must publish
- Maintained vs academy differences
- Accessibility requirements (WCAG 2.1 AA)
- GDPR considerations
- Compliance priorities (critical → important → recommended)

**Example Use Case**: Governor auditing website before Ofsted → Ed systematically checks compliance, identifies 9 gaps, provides specific fixes with templates

**Triggers**: "website", "compliance", "statutory", "what must we publish"

---

### 3. Headteacher Report Generator
**Purpose**: Help headteachers create structured governor reports

**Knowledge Base**: Report Templates & Governance Best Practices
- Standard HT report structure
- What to include in each section
- How to present challenges effectively
- Governance expectations
- Best practices (focus on impact, not just activity)

**Example Use Case**: HT needs to write spring term report → Ed provides structure, drafts sections with examples, helps frame falling rolls challenge strategically

**Triggers**: "headteacher report", "HT report", "report to governors"

---

## Skills Lab Structure

```
skills-lab/
├── knowledge/              # Knowledge bases (MD files)
│   ├── pupil-premium-eef-toolkit.md
│   ├── website-compliance-requirements.md
│   └── headteacher-report-templates.md
│
├── skills/                 # Skill prototypes (TS files)
│   ├── pupil-premium-planner.ts
│   ├── website-compliance-checker.ts
│   └── ht-report-generator.ts
│
├── examples/               # Example conversations
│   ├── pupil-premium-conversation.md
│   ├── website-compliance-conversation.md
│   └── ht-report-conversation.md
│
└── notes/                  # Planning & documentation
    ├── PLAN.md             # Overall roadmap
    ├── INTEGRATION_PLAN.md # How to integrate into Ed
    └── README.md           # This file
```

## How Skills Work

### Current Flow (No Skills)
```
User: "How should I spend pupil premium?"
  ↓
Ed's general knowledge responds
  ↓
Generic advice (may not cite EEF, may miss UK context)
```

### With Skills (Planned)
```
User: "How should I spend pupil premium?"
  ↓
SkillRouter detects "pupil premium" trigger
  ↓
Activates pupil_premium_planner skill
  ↓
Injects EEF Toolkit knowledge base into prompt
  ↓
Ed responds with specific EEF evidence citations
  ↓
"Small group tuition: +4 months impact (⭐⭐⭐), but avoid TAs in every class..."
```

## Integration Status

- ✅ **Wave 1 Skills**: Complete (3 skills with knowledge bases, prototypes, examples)
- ✅ **Integration Plan**: Documented (see `notes/INTEGRATION_PLAN.md`)
- 🔄 **Backend Integration**: Not started (SkillRouter, ModelRouter updates)
- 🔄 **Testing**: Not started
- 🔄 **Deployment**: Not started

## Next Steps

### Option 1: Start Integration Now
Implement SkillRouter and connect to Ed's backend (1-2 days work)

### Option 2: Build Wave 2 Skills First
Add more skills before integrating:
- Access Finance Navigator
- PSF Finance Navigator
- IT Helpdesk Coach
- Ofsted Preparation Guide
- Staff Wellbeing Advisor

### Option 3: User Testing First
Test Wave 1 skills manually (copy/paste knowledge bases into conversations) to validate approach before building integration

## Wave 2 Skills (Planned)

### 4. Access Finance Navigator
**Purpose**: Guide staff through Access Education Finance system
**Knowledge**: Access Finance user guides, common tasks, troubleshooting

### 5. PSF Finance Navigator
**Purpose**: Guide staff through PS Financials system
**Knowledge**: PSF workflows, budget monitoring, purchase orders

### 6. IT Helpdesk Coach
**Purpose**: First-line support for common IT issues
**Knowledge**: Password resets, printer problems, escalation paths

### 7. Ofsted Preparation Guide
**Purpose**: Help schools prepare for inspection
**Knowledge**: Ofsted framework, deep dive process, evidence requirements

### 8. Staff Wellbeing Advisor
**Purpose**: Support leaders with wellbeing initiatives
**Knowledge**: Teacher wellbeing research, practical strategies, workload reduction

## Success Metrics

Once integrated, track:
- **Skill activation rate**: % of conversations where skills activate
- **User satisfaction**: Feedback on skill responses vs general responses
- **Conversation length**: Do skills resolve queries faster?
- **Return usage**: Do users come back when they need that skill again?

## Benefits of Skills Approach

1. **Accuracy**: Knowledge bases ensure factually correct, up-to-date information
2. **Specificity**: UK education context built in (not generic international advice)
3. **Evidence-based**: All recommendations cite research (EEF, Ofsted, DfE)
4. **Maintainable**: Update knowledge bases when guidance changes (no retraining needed)
5. **Modular**: Add new skills without affecting existing ones
6. **Transparent**: Users can see which skill is being used
7. **Self-updating**: Knowledge bases can be refreshed from authoritative sources

## Key Principles

1. **UK Schools-Focused**: All skills tailored to UK education system
2. **Evidence-Based**: Cite EEF research, Ofsted framework, DfE guidance
3. **Actionable**: Provide specific, practical guidance (not generic advice)
4. **Honest**: Challenge poor approaches politely but clearly
5. **Supportive**: Acknowledge pressures on school staff
6. **Current**: Keep knowledge bases updated with latest guidance

## Files Overview

### Knowledge Bases

**`pupil-premium-eef-toolkit.md`** (330 lines)
- All EEF intervention evidence ratings
- Three-tiered spending approach
- Common pitfalls
- Effective PP spending checklist

**`website-compliance-requirements.md`** (380 lines)
- All statutory requirements (maintained + academy)
- Accessibility requirements
- GDPR considerations
- Common compliance issues

**`headteacher-report-templates.md`** (280 lines)
- Standard report structure
- Section-by-section guidance
- Best practices
- Governor expectations

### Skill Prototypes

Each `.ts` file contains:
- Skill metadata (name, description, triggers)
- Function signatures (what the skill can do)
- System prompt for the skill
- Example usage
- Expected response format

### Example Conversations

Each `.md` file shows:
- Realistic scenario
- Full conversation flow
- How skill activates
- Value demonstrated
- User outcome

---

## Quick Start

### To Test a Skill Manually

1. Read the knowledge base (e.g., `knowledge/pupil-premium-eef-toolkit.md`)
2. Read the skill prompt (in `skills/pupil-premium-planner.ts`, look for `pupilPremiumPlannerPrompt`)
3. In your Ed conversation, paste: "Act as if you have the Pupil Premium Planning skill with full EEF knowledge"
4. Ask a PP question
5. Compare response to the example conversation

### To Integrate Skills

Follow `notes/INTEGRATION_PLAN.md`:
1. Create `SkillRouter` class
2. Update `ModelRouter` to check for skills
3. Update `PromptBuilder` to inject knowledge bases
4. Test with example queries
5. Deploy

---

## Questions?

See:
- **Overall plan**: `notes/PLAN.md`
- **Integration details**: `notes/INTEGRATION_PLAN.md`
- **Example conversations**: `examples/` folder
- **Knowledge bases**: `knowledge/` folder

---

**Status**: Wave 1 Complete ✅ | Ready for Integration 🚀
