# Inspection Narrative & SEF Generator

**MCP Tool**: `generate_inspection_narrative`

## Overview

This tool generates inspection-ready narratives and SEF-style documentation from gap analysis results, actions, and evidence metadata. It uses LLM assistance to structure and improve clarity while maintaining strict data fidelity.

## Purpose

- Turn gap analysis + actions + evidence into calm, inspection-ready narratives
- Support SEF-style documentation (without claiming to be "the SEF")
- Reduce workload for Headteachers and SLT
- Use advisory language only
- Be safe, defensible, and explainable

## Tool Definition

```typescript
generate_inspection_narrative(
  school_id: string,
  framework: 'ofsted' | 'siams' | 'csi' | 'isi' | 'section48' | 'other',
  mode?: 'inspection_narrative' | 'sef_draft' | 'leadership_brief'
)
```

### Parameters

- **school_id**: Organization ID (must match authenticated organization)
- **framework**: Framework to generate narrative for
- **mode**: Output mode (default: `inspection_narrative`)
  - `inspection_narrative`: Standard inspection-ready narrative
  - `sef_draft`: SEF-style draft document
  - `leadership_brief`: Concise SLT brief

## Data Sources

The tool gathers data from:

1. **Gap Analysis Results** (via `analyze_framework_gaps`)
   - Strengths
   - Priority gaps
   - Risk-weighted areas
   - Confidence levels

2. **Actions & Improvement Data** (from `actions` table)
   - Actions linked to framework areas
   - Action status, priority, dates
   - EEF strategies and expected impact
   - Success criteria

3. **Evidence Metadata** (from gap analysis results)
   - Evidence presence by framework area
   - Recency indicators (up to date / ageing / missing)
   - Evidence types and counts

## LLM Usage

The LLM is used **ONLY** to:
- Structure narrative
- Improve clarity and flow
- Align tone to inspection expectations

The LLM **MUST NOT**:
- Invent actions, evidence, outcomes, or judgements
- Predict inspection outcomes
- Assign grades
- Use authoritative language ("must", "requires") unless explicitly citing statutory sources

### Model Selection

- **Default**: `OPENROUTER_CHEAP_MODEL` (e.g., `google/gemini-flash-1.5`)
- **Override**: Set `OPENROUTER_SMART_MODEL` environment variable
- **Temperature**: 0.3 (for consistent, factual output)
- **Max Tokens**: 3000

## Output Structure

The output follows this exact structure:

1. **Context and self-understanding**
   - How the school understands its current position
   - Reference timeframe ("since last inspection" / "over the last X years")

2. **Strengths and secure practice**
   - Based only on areas marked strong / low-risk
   - Cite evidence presence and review cycles

3. **Areas of focus and improvement**
   - Priority gaps identified by the gap engine
   - Use calm, non-judgemental language
   - Explain *why* these areas are priorities

4. **Actions taken and rationale**
   - Link actions to gaps
   - Explain intent and expected impact
   - Reference research sources where applicable (EEF, DfE)

5. **Review and impact monitoring**
   - How actions are being reviewed
   - What indicators are being monitored
   - Acknowledge where impact is not yet measurable

6. **Next steps and priorities**
   - Clear, practical next steps
   - Risk-weighted ordering
   - Advisory phrasing only

7. **Evidence and sources referenced**
   - List evidence categories (not documents)
   - List guidance / research sources used
   - Preserve authority_level for each source

## Fallback Behaviour

If insufficient data exists:
- **DO NOT** call LLM
- Return structured response explaining:
  - What data is missing
  - What needs to be added to generate a narrative
  - Suggested next actions for the school

## Language & Safety Rules

- ✅ Advisory tone only ("we consider", "we are focusing on")
- ❌ No grades, predictions, or inspection outcomes
- ❌ No claims beyond available data
- ✅ If data is missing or weak, say so explicitly
- ✅ If confidence is low, flag it clearly

## Telemetry

Logs:
- `used_llm`: true/false
- `model`: Model used
- `token_usage`: Actual or estimated tokens
- `duration_ms`: Execution time
- `outcome`: success / insufficient_data / error
- `error_code`: If applicable

## Files

- **Implementation**: `inspection-narrative.ts`
- **Prompt Template**: `inspection-narrative-PROMPT.md`
- **Example Output**: `inspection-narrative-EXAMPLE.md`
- **This README**: `inspection-narrative-README.md`

## Constraints

- ✅ Do NOT build UI
- ✅ Do NOT modify gap analysis logic
- ✅ Do NOT store narrative permanently (generate-on-demand)
- ✅ Do NOT hardcode Ofsted language
- ✅ Must work for future frameworks

## Cost

This is a **paid skill** (uses LLM). Costs depend on:
- Model selected (cheap vs smart)
- Token usage (prompt + completion)
- Frequency of use

See telemetry logs for actual costs per invocation.

