# EEF Research in Inspection Narrative - Example

This document shows how EEF research is integrated into inspection narratives.

## Scenario

A school has an action: "Implement feedback training for all teachers" with `eef_strategy = "feedback"`.

## Step 1: Action Detection

```typescript
Action: {
  title: "Implement feedback training for all teachers",
  eef_strategy: "feedback",
  description: "Training programme to improve feedback quality",
  // ...
}
```

## Step 2: EEF Research Retrieval

The inspection narrative tool calls:

```typescript
const eefResult = await handleConsultKnowledgePack({
  domain: 'research',
  topic: 'feedback',
  context: undefined,
}, context);
```

Returns EEF rule with structured content:

```json
{
  "theme": "Feedback",
  "summary_plain_english": "EEF evidence suggests that effective feedback can have a positive impact on pupil outcomes when it is specific, timely, and actionable. Feedback that focuses on the task rather than the pupil, and provides clear guidance on how to improve, is generally more effective. This summary reflects EEF guidance and should be interpreted in the context of the school.",
  "strength_of_evidence": "High",
  "cost_implication": "Low",
  "implementation_considerations": [
    "Ensure feedback is specific and linked to learning objectives",
    "Provide feedback in a timely manner",
    "Focus on task rather than pupil characteristics",
    "Train staff in effective feedback techniques"
  ],
  "relevant_when": "When seeking to improve teaching effectiveness, assessment practices, or pupil progress",
  "limitations_or_caveats": "Effectiveness depends on quality of implementation and may require sustained CPD"
}
```

## Step 3: Inclusion in LLM Prompt

The EEF research is included in the prompt:

```
Actions Taken:
- Implement feedback training for all teachers
  Status: in_progress
  Priority: high
  Description: Training programme to improve feedback quality
  EEF strategy: feedback
  ...

EEF Research Evidence (if available):
- For action: "Implement feedback training for all teachers"
  Theme: Feedback
  Summary: EEF evidence suggests that effective feedback can have a positive impact on pupil outcomes when it is specific, timely, and actionable...
  Strength of evidence: High
  Cost implication: Low
  Limitations: Effectiveness depends on quality of implementation and may require sustained CPD
```

## Step 4: LLM-Generated Narrative

The LLM uses the EEF research in the "Actions taken and rationale" section:

### ✅ Good Example (Advisory Language)

```
Actions Taken and Rationale:

We are implementing feedback training for all teachers to address gaps identified in our gap analysis around assessment and teaching quality. EEF evidence suggests that effective feedback can have a positive impact on pupil outcomes when it is specific, timely, and actionable. Research indicates this may be effective when feedback focuses on the task rather than the pupil, and provides clear guidance on how to improve.

Our training programme is designed to ensure feedback is specific and linked to learning objectives, provided in a timely manner, and focuses on task characteristics. We recognise that effectiveness depends on quality of implementation and may require sustained CPD, so we have planned follow-up coaching sessions and regular review cycles.

This approach is commonly associated with improved teaching effectiveness and pupil progress, and we expect to see improvements in our assessment practices over the next academic year.
```

### ❌ Bad Example (Prescriptive Language - DO NOT USE)

```
Actions Taken and Rationale:

We must implement feedback training because EEF requires it. This is best practice and guarantees impact. Inspectors expect schools to use EEF strategies.
```

## Step 5: Final Narrative Output

The complete narrative includes:

```json
{
  "actions_taken_and_rationale": "We are implementing feedback training... EEF evidence suggests...",
  "next_steps_and_priorities": "...continue to embed feedback practices based on EEF guidance...",
  "evidence_and_sources_referenced": {
    "guidance_sources": [
      {
        "source": "Education Endowment Foundation",
        "authority_level": "guidance"
      }
    ]
  }
}
```

## Key Points

1. **EEF appears only in specific sections**: "Actions taken and rationale" and "Next steps and priorities"
2. **Advisory language only**: "EEF evidence suggests...", "Research indicates..."
3. **No failure if EEF not found**: Narrative continues without research reference
4. **Contextualised**: EEF research is used to explain rationale, not as a requirement
5. **Framework-agnostic**: Works for any framework (Ofsted, SIAMS, etc.)

## Multiple Actions with EEF

If multiple actions reference EEF:

```
Actions Taken:
- Action 1 (EEF: feedback)
- Action 2 (EEF: metacognition)
- Action 3 (no EEF strategy)

EEF Research Evidence:
- For action: "Action 1"
  Theme: Feedback
  Summary: ...
- For action: "Action 2"
  Theme: Metacognition & Self-regulation
  Summary: ...
```

The LLM will reference EEF research for Actions 1 and 2, but not for Action 3 (no research reference needed).

