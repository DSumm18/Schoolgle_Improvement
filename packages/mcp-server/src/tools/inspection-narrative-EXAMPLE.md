# Inspection Narrative - Example Output

This document shows example outputs from `generate_inspection_narrative` with mock data.

## Example 1: Successful Narrative Generation

**Input:**
```json
{
  "school_id": "org-123",
  "framework": "ofsted",
  "mode": "inspection_narrative"
}
```

**Output:**
```json
{
  "framework": "ofsted",
  "mode": "inspection_narrative",
  "generated_at": "2024-01-15T10:30:00Z",
  "context_and_self_understanding": "Our school has been working systematically to strengthen our provision since our last inspection in 2019. Over the past four years, we have focused on embedding improvements across curriculum, teaching, and safeguarding. We understand our current position through regular self-evaluation, gap analysis, and evidence review cycles. Our leadership team meets monthly to review progress against our school development plan priorities, and we use a combination of internal monitoring, external support, and evidence-based interventions to drive improvement.\n\nWe recognise that inspection frameworks evolve, and we have been proactive in aligning our practice with current Ofsted expectations. Our gap analysis indicates that we have strong foundations in safeguarding and curriculum intent, with areas for development in curriculum implementation and impact monitoring.",
  "strengths_and_secure_practice": "Our safeguarding culture is strong, with clear policies, regular training, and effective systems for identifying and supporting vulnerable pupils. We have comprehensive evidence of safeguarding practice, including up-to-date policies, training records, and case studies. Our curriculum intent is well-articulated and aligned with national expectations, with clear progression models and subject-specific guidance.\n\nWe have secure practice in pupil premium spending, with clear tracking of interventions and regular review of impact. Our evidence base for these areas is current, with documents updated within the last 12 months and clear links to framework expectations.",
  "areas_of_focus_and_improvement": "Our gap analysis has identified curriculum implementation as a priority area. While our intent is strong, we recognise that the consistency of implementation across subjects and year groups needs further development. We are focusing on ensuring that all teachers have access to high-quality resources and that our curriculum is delivered as intended.\n\nWe are also working to strengthen our impact monitoring. While we collect a range of assessment data, we recognise that we need to better link this data to curriculum outcomes and use it more effectively to inform teaching and learning. This is a priority because it enables us to demonstrate the impact of our curriculum on pupil outcomes.",
  "actions_taken_and_rationale": "To address curriculum implementation, we have introduced a programme of curriculum coaching for all teachers, supported by EEF guidance on effective professional development. This action is linked to our gap analysis findings and is expected to improve consistency across the school. We are monitoring progress through lesson observations and pupil work scrutiny.\n\nFor impact monitoring, we have implemented a new assessment tracking system and are training staff in data analysis. This is informed by DfE guidance on assessment and is designed to help us better understand the impact of our curriculum. We expect to see improvements in our ability to track progress and identify areas for intervention within the next academic year.",
  "review_and_impact_monitoring": "Our actions are reviewed termly through our school development plan monitoring cycle. We track progress against success criteria and adjust our approach where needed. For curriculum implementation, we are monitoring through lesson observations, book looks, and pupil voice. For impact monitoring, we are tracking the quality and frequency of data analysis and its use in planning.\n\nWe acknowledge that some actions are in early stages and impact is not yet measurable. We are committed to ongoing review and will adjust our approach based on evidence of what works. We use a combination of quantitative data (assessment results, attendance) and qualitative evidence (pupil voice, staff feedback) to evaluate impact.",
  "next_steps_and_priorities": "Our immediate priorities are to:\n1. Complete the curriculum coaching programme and evaluate its impact on teaching consistency\n2. Embed the new assessment tracking system and ensure all staff are confident in using data to inform practice\n3. Continue to strengthen evidence collection and ensure all framework areas have up-to-date documentation\n\nThese priorities are risk-weighted based on our gap analysis, with curriculum implementation and impact monitoring identified as highest priority due to their impact on overall school effectiveness.",
  "evidence_and_sources_referenced": {
    "evidence_categories": [
      "safeguarding_policies",
      "curriculum_documents",
      "assessment_data",
      "lesson_observations",
      "pupil_voice",
      "training_records"
    ],
    "guidance_sources": [
      {
        "source": "Ofsted",
        "authority_level": "statutory"
      },
      {
        "source": "DfE",
        "authority_level": "statutory"
      },
      {
        "source": "EEF",
        "authority_level": "guidance"
      }
    ]
  },
  "data_quality": {
    "has_gap_analysis": true,
    "has_actions": true,
    "has_evidence": true,
    "confidence_level": "medium"
  },
  "telemetry": {
    "used_llm": true,
    "model": "google/gemini-flash-1.5",
    "token_usage": {
      "prompt_tokens": 2450,
      "completion_tokens": 1850,
      "total_tokens": 4300
    },
    "duration_ms": 3420
  }
}
```

## Example 2: Insufficient Data Response

**Input:**
```json
{
  "school_id": "org-456",
  "framework": "ofsted",
  "mode": "inspection_narrative"
}
```

**Output:**
```json
{
  "framework": "ofsted",
  "mode": "inspection_narrative",
  "generated_at": "2024-01-15T10:30:00Z",
  "outcome": "insufficient_data",
  "missing_data": {
    "gap_analysis": true,
    "actions": false,
    "evidence": true
  },
  "message": "Insufficient data to generate narrative. Please add the missing data and try again.",
  "suggested_next_actions": [
    "Run gap analysis to identify framework areas and evidence gaps",
    "Upload and scan documents to build evidence base"
  ]
}
```

## Example 3: SEF Draft Mode

**Input:**
```json
{
  "school_id": "org-123",
  "framework": "ofsted",
  "mode": "sef_draft"
}
```

**Output Structure:**
Same as Example 1, but with:
- More formal, document-style language
- Structured sections that mirror SEF format
- Emphasis on self-evaluation and evidence
- Clear articulation of strengths and areas for development

## Example 4: Leadership Brief Mode

**Input:**
```json
{
  "school_id": "org-123",
  "framework": "ofsted",
  "mode": "leadership_brief"
}
```

**Output Structure:**
Same as Example 1, but with:
- More concise sections (200-400 words each)
- Executive summary style
- Focus on key priorities and actions
- Less detailed evidence descriptions

## Notes on Mock Data

The examples above use mock data. In production:

1. **Gap Analysis Data** comes from `analyze_framework_gaps` tool
2. **Actions Data** comes from `actions` table filtered by framework
3. **Evidence Metadata** comes from `evidence_matches` and `documents` tables
4. **All data is real** - the LLM never invents information

## Language Characteristics

Notice in the examples:
- ✅ Advisory language: "We are focusing on...", "We recognise that...", "We are working to..."
- ✅ No predictions: No mention of inspection outcomes or grades
- ✅ Data-driven: References to gap analysis, evidence counts, dates
- ✅ Honest about limitations: "impact is not yet measurable", "early stages"
- ✅ Statutory citations: When referencing DfE/Ofsted, authority_level is specified

