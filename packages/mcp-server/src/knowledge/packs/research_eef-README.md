# EEF Research Knowledge Pack - README

## Overview

The EEF Research Knowledge Pack provides structured access to Education Endowment Foundation research evidence for use in inspection narratives and school improvement conversations.

## Core Principles

1. **EEF does NOT detect gaps** - Gaps come from frameworks (Ofsted, SIAMS, etc.)
2. **EEF is advisory, not prescriptive** - Use "EEF evidence suggests..." never "EEF requires"
3. **No hallucinated research** - All entries must be structured, cited, and reviewable
4. **Framework-agnostic** - Works for SEND, HR CPD, leadership, behaviour, etc.
5. **Supporting evidence layer** - EEF justifies, explains, and contextualises actions

## Usage

### Via consult_knowledge_pack Tool

```typescript
const result = await handleConsultKnowledgePack({
  domain: 'research',
  topic: 'feedback', // or 'metacognition_self_regulation', 'phonics', etc.
  context: undefined, // Optional context filter
}, context);
```

### Topics Available

- `feedback` - Feedback practices
- `metacognition_self_regulation` - Metacognition and self-regulation
- `early_language` - Early language interventions
- `reading_comprehension` - Reading comprehension strategies
- `phonics` - Systematic synthetic phonics
- `small_group_tuition` - Small group tuition
- `send_targeted_interventions` - SEND targeted interventions
- `behaviour_interventions` - Behaviour interventions
- `professional_development` - Professional development/CPD
- `assessment_for_learning` - Assessment for learning

## Entry Structure

Each EEF entry contains structured JSON in `rule.content`:

```typescript
{
  theme: string;                    // e.g., "Feedback", "Early Language"
  summary_plain_english: string;     // 2-4 sentences, non-technical
  strength_of_evidence: "High" | "Moderate" | "Limited";
  cost_implication: "Low" | "Moderate" | "High";
  implementation_considerations: string[];  // Short bullet list
  relevant_when: string;            // Plain-English triggers
  limitations_or_caveats: string;    // e.g., "requires sustained CPD"
}
```

## Adding New EEF Entries

### Step 1: Identify EEF Source

- Find official EEF publication (Teaching & Learning Toolkit, Guidance Reports, etc.)
- Verify publication title, URL, and year
- Note section/page references if available

### Step 2: Create Entry

Add to `EEF_RULES` array in `research_eef.ts`:

```typescript
{
  id: 'eef-your-topic',
  pack_id: 'eef-research-v1',
  topic: 'your_topic',
  applies_when_text: 'action involves [your topic] OR [related terms]',
  content: JSON.stringify({
    theme: 'Your Theme',
    summary_plain_english: 'EEF evidence suggests... This summary reflects EEF guidance and should be interpreted in the context of the school.',
    strength_of_evidence: 'High' | 'Moderate' | 'Limited',
    cost_implication: 'Low' | 'Moderate' | 'High',
    implementation_considerations: [
      'Consideration 1',
      'Consideration 2',
    ],
    relevant_when: 'When [conditions]',
    limitations_or_caveats: 'Limitations or caveats',
  }),
  citations: [
    {
      source: 'Education Endowment Foundation',
      section: 'Publication title and section',
      url: 'https://educationendowmentfoundation.org.uk/...',
      authority_level: 'guidance',
    },
  ],
  authority_level: 'guidance',
}
```

### Step 3: Update Topic Mapping (if needed)

If the new topic should be auto-detected from action strategies, add to `strategyToTopic` in `inspection-narrative.ts`:

```typescript
const strategyToTopic: Record<string, string> = {
  // ... existing mappings
  'your strategy name': 'your_topic',
};
```

## Updating When EEF Publishes Changes

### Process

1. **Review EEF Updates**
   - Check EEF website for new publications or updates
   - Verify if existing entries need revision
   - Note any new evidence or changed recommendations

2. **Update Entry**
   - Modify `summary_plain_english` if evidence has changed
   - Update `strength_of_evidence` if new research available
   - Revise `implementation_considerations` if guidance updated
   - Update citation with new publication details if applicable

3. **Version Control**
   - Update `version` in `EEF_PACK` if significant changes
   - Update `review_by_date` to reflect review cycle
   - Consider creating new pack version if major changes

4. **Document Changes**
   - Note what changed and why
   - Reference new EEF publication if applicable

## Inspection Learning Feedback

### How Inspection Learning Feeds Back into Research Links

1. **Post-Inspection Review**
   - Review inspection reports for research references
   - Note which EEF strategies were mentioned positively
   - Identify any gaps in EEF coverage

2. **Update Strategy Mapping**
   - If inspectors reference research not in our pack, consider adding
   - If certain strategies are frequently mentioned, ensure they're well-covered
   - Update `applies_when_text` if inspection learning suggests broader application

3. **Enhance Entries**
   - Add implementation considerations based on inspection feedback
   - Update limitations/caveats if inspection reveals common pitfalls
   - Strengthen citations if inspectors reference specific EEF publications

4. **No Automatic Updates**
   - Do NOT automatically update based on inspection reports
   - Always verify against official EEF sources
   - Maintain advisory language - never claim "inspectors expect" EEF strategies

## Language Guidelines

### ✅ Allowed Phrases

- "EEF evidence suggests..."
- "Research indicates this may be effective when..."
- "This approach is commonly associated with..."
- "EEF guidance indicates..."

### ❌ Disallowed Phrases

- "EEF says you must..."
- "This guarantees impact..."
- "Inspectors expect..."
- "Best practice requires..."

## Integration with Inspection Narrative

The inspection narrative tool automatically:

1. **Detects EEF Strategies** in actions (via `eef_strategy` field or action text)
2. **Fetches Relevant EEF Entries** (via `consult_knowledge_pack`)
3. **Includes in Prompt** (only if found - no failure if not found)
4. **LLM Uses in Narrative** (only in "Actions taken and rationale" and "Next steps and priorities")

### Example Flow

```
Action: "Implement feedback training for all teachers"
  ↓
Detects: eef_strategy = "feedback"
  ↓
Fetches: consult_knowledge_pack(domain='research', topic='feedback')
  ↓
Includes in prompt: EEF research summary for feedback
  ↓
LLM generates: "We are implementing feedback training based on EEF evidence suggesting that effective feedback can have a positive impact when it is specific, timely, and actionable..."
```

## Safety & Compliance

- ✅ All entries have citations (required by knowledge pack schema)
- ✅ All language is advisory (no prescriptive claims)
- ✅ Placeholders clearly marked (TBD where content unknown)
- ✅ Framework-agnostic (works across all frameworks)
- ✅ No hallucination (only retrieved, never generated)

## Current Status

**Pilot v1** - 10 starter entries:
- Structure-first, content-light
- Some placeholders (TBD) where exact wording needs verification
- Ready for testing and refinement

## Future Enhancements

- [ ] Verify all TBD placeholders with official EEF sources
- [ ] Add more EEF topics as needed
- [ ] Integrate with EEF API if available (future)
- [ ] Add structured evidence strength indicators
- [ ] Support for EEF Guidance Reports (beyond Toolkit)

