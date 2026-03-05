# Ed as Legal Counsel & SEND Expert

## "Ed doesn't submit, the user does. Ed guides, explains, suggests."

---

## The Knowledge Layer: Form Instructions & Guidance

For each form template, Ed stores:
- **Official guidance** (from LA, government, etc.)
- **Plain English explanations** (what this field actually means)
- **Red flag warnings** (things to avoid)
- **Suggested wording** (more formal, accurate, cautious)
- **Case law examples** (what went wrong before)

---

## Example: SEND Section A Request

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Ed: SEND Section A Request                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FIELD: Parental Concerns                                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  💡 What this means:                                      │  │
│  │                                                            │  │
│  │  This section is for you to describe your concerns       │  │
│  │  about your child's special educational needs. The        │  │
│  │  local authority will use this to decide whether to       │  │
│  │  assess your child.                                        │  │
│  │                                                            │  │
│  │  🚩 Red Flags to Avoid:                                   │  │
│  │  • Don't say "school is failing my child"                │  │
│  │  • Don't focus on teacher personality                     │  │
│  │  • Don't be aggressive toward the school                 │  │
│  │                                                            │  │
│  │  ✅ Better Approach:                                      │  │
│  │  • Focus on your child's specific needs                  │  │
│  │  • Use examples of what you've observed                  │  │
│  │  • Reference professional reports if you have them       │  │
│  │  • Be factual, not emotional                             │  │
│  │                                                            │  │
│  │  💬 Suggested Wording:                                    │  │
│  │  "I am concerned that my child is not making progress      │  │
│  │   in reading despite additional support. His reading age  │  │
│  │   is 7 years but his chronological age is 9. The school    │  │
│  │  has provided phonics interventions but I have not seen    │  │
│  │   improvement in his reading accuracy over the past       │  │
│  │   12 months."                                              │  │
│  │                                                            │  │
│  │  This is better than:                                     │  │
│  │  "The school is failing to teach my child to read" ❌    │  │
│  │                                                            │  │
│  │  [Use this wording]  [Write my own]  [Tell me more]      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Your input:                                                 │
│  I am worried that my son struggles with writing and the      │
│  school hasn't provided any help]                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📝 Ed's Suggestion:                                      │  │
│  │                                                            │  │
│  │  "My child has significant difficulty with writing        │  │
│  │   tasks. Despite verbal ability within the average         │  │
│  │   range, he struggles to put words on paper. His         │  │
│  │   written work is often illegible and below age           │  │
│  │   expected levels. I am concerned about the gap          │  │
│  │   between his verbal and written skills."                 │  │
│  │                                                            │  │
│  │  This is stronger because:                                │  │
│  │  • Uses specific terms (SENCO may recognize)             │  │
│  │  • Describes the gap clearly (verbal vs written)          │  │
│  │  • Is factual without being accusatory                     │  │
│  │  • More likely to trigger assessment                      │  │
│  │                                                            │  │
│  │  [Use Ed's version]  [Keep my version]  [Tell me more]    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Knowledge Base Structure

```sql
CREATE TABLE ed_form_knowledge (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES ed_form_templates(id),

  -- Field-level guidance
  field_key TEXT NOT NULL,  -- 'parental_concerns'
  field_label TEXT NOT NULL,

  -- Explanation in plain English
  explanation TEXT NOT NULL,

  -- What NOT to say (common mistakes)
  red_flags TEXT[],
  -- ['Don\'t blame teachers', 'Avoid emotional language']

  -- Suggested wording templates
  suggested_wordings JSONB,
  -- {
  --   "formal": "My child has difficulty with...",
  --   "simple": "My child struggles with...",
  --   "legal": "I am concerned that my child's needs..."
  -- }

  -- Legal context
  legal_context TEXT,  -- Reference to relevant laws/codes
  case_law TEXT[],    -- Examples of relevant cases

  -- Local authority specifics
  local_authority_notes JSONB,
  -- {
  --   "Bradford": "Include pupil reference number",
  --   "Leeds": "Must include SENCO name",
  --   "Birmingham": "Attach professional reports"
  -- }
);
```

---

## Field-by-Field Guidance Example

### SEND Section A: Part 1 - Child's Details

**Field: Child's Name**
```
💡 Straightforward - use full legal name
🚩 Don't use nicknames like "Tommy"
✅ Use: "Thomas William Smith"
```

**Field: Date of Birth**
```
💡 Use exact date from birth certificate
🚩 Don't use "aged 9" - they need the actual date
✅ Use: "01/09/2015"
```

**Field: Child's Address**
```
💡 Use the address where child lives
🚩 Don't use school address unless child lives there
✅ Use: "123 School Lane, Bradford, BD7 1XX"
```

**Field: Parent/Carer Details**
```
💡 Include ALL parents/carers with parental responsibility
🚩 Don't forget step-parents if they have PR
✅ List: Both parents if applicable
⚠️ If there's a court order restricting access, mention it
```

### SEND Section A: Part 2 - Nature of Concern

**Field: Primary Need**
```
💡 Select the MAIN area of concern
🚩 Don't select multiple unless they're equal
✅ Options from Ed (based on your input):
   • Cognition and Learning (if below average IQ)
   • Communication and Interaction (if speech/language issues)
   • Social, Emotional and Mental Health (if anxiety, behaviour)
   • Sensory and/or Physical (if hearing, vision, mobility)

💬 Ed: Based on what you told me about your child's reading
   difficulty but good verbal skills, I'd suggest:
   "Cognition and Learning" as the primary need

   This is because the gap between verbal and written
   performance suggests a specific learning difficulty.
```

**Field: Child's Views**
```
💡 IMPORTANT: If child is old enough, their views MUST be included
🚩 Don't speak for the child if they can express themselves
✅ Age-appropriate guidance from Ed:
   • Under 8: "What does your child enjoy doing?"
   • 8-11: "What do you find hard at school?"
   • 12+: "What would help you learn better?"

💬 Ed: "Your child is 9. Their views should be included.
   Here are some questions to ask them:

   1. 'What do you enjoy most at school?'
   2. 'What subjects do you find tricky?'
   3. 'What would make school better for you?'

   Then include their exact words in this field."
```

**Field: Parental Concerns**
```
💡 This is THE MOST IMPORTANT SECTION
🚩 What NOT to include:
   • Complaints about individual teachers
   • Emotional accusations
   • Threats ("I'll go to the papers")
   • References to past disputes with the school

✅ What TO include:
   • Specific examples of concerns (with dates)
   • Progress (or lack thereof) over time
   • Professional opinions you have received
   • What you've already tried
   • Your child's own words/feelings

💬 Ed's Framework for Writing Concerns:

   Start with facts:
   "I am concerned that [child] is not making expected progress
    in [subject/skill]. Despite [support provided], I have observed
    [specific concerns]."

   Add evidence:
   "For example, on [date] I noticed [specific incident]. His
    teacher noted that [teacher's observation]."

   Reference professional reports if you have them:
   "An educational psychologist assessment in [month/year]
    identified [finding from report]."

   Focus on impact:
   "This is affecting [child] because [specific impact on
    learning/wellbeing]."

💬 Ed: "Let me help you phrase your concerns. Tell me what
   happened, and I'll suggest formal wording that's more
   likely to trigger the support your child needs."
```

---

## Real-Time Warnings & Suggestions

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Ed detected a potential issue                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You wrote: "The school is failing to teach my child"           │
│                                                                 │
│  💡 Why this may be a problem:                                   │
│  • "Failing" is emotive language that may be seen as             │
│    aggressive by the local authority                            │
│  • It doesn't describe what your child's actual needs are        │
│  • It focuses on the school rather than your child             │
│  • It may put the LA on the defensive rather than              │
│    helpful mode                                                 │
│                                                                 │
│  ✅ Suggested alternative:                                       │
│  "I am concerned that my child is not making expected            │
│   progress in literacy despite the additional                   │
│   support provided by the school. His reading age              │
│   is approximately 7 years while his chronological             │
│   age is 9. I have observed this gap persist over the          │
│   past 18 months despite phonics interventions."               │
│                                                                 │
│  This is better because:                                        │
│  • It describes the concern factually                          │
│  • It provides specific evidence (ages, duration)               │
│  • It acknowledges support already tried                        │
│  • It's more likely to lead to assessment                       │
│                                                                 │
│  [Use suggested wording]  [Edit myself]  [Tell me more]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Risk Hat: Cautious Mode

For high-stakes forms, Ed enters "Cautious Mode":

```typescript
interface CautiousModeConfig {
  spellcheckEverything: true,
  suggestFormalAlternatives: true,
  warnAboutEmotionalLanguage: true,
  requireFinalReview: true,
  explainConsequences: true,
}

// Examples of transformations
const transformations = {
  casual: "My kid's teacher is rubbish",
  formal: "I am concerned that my child is not receiving appropriate support",

  angry: "They don't care about my child's needs",
  cautious: "I feel my child's needs are not being fully met",

  vague: "He struggles with writing",
  specific: "He struggles with written expression, particularly with sentence structure and spelling",

  negative: "The school has failed him",
  constructive: "Despite interventions, my child has not made expected progress"
};
```

---

## Form Completion with Ed

```
USER: "I want to apply for an EHCP for my son"

ED: "I can help you with the EHCP application. This is an
     important process. Let me explain what we're doing:

     An EHCP (Education, Health and Care Plan) is a legal document
     that describes your child's special educational needs and the
     support they should receive.

     The application has several sections. I'll guide you through
     each one, explain what they're looking for, and help you phrase
     your concerns in the best way."

USER: "Okay, where do we start?"

ED: "First, tell me about your son. What are your main worries
     about his learning or development?"

USER: "He can't read very well, he's 9 but reads like a 6 year old"

ED: "Thank you. Let me explain how we should phrase this for the
     form:

     Instead of: 'He can't read very well, he's 9 but reads like
     a 6 year old'

     Use: 'My child has significant difficulty with reading.
     His reading age is approximately 6 years while his
     chronological age is 9 years. This represents a 3-year
     gap in his reading attainment.'

     Why this is better:
     • 'Significant difficulty' is professional language
     • Reading age vs chronological age is a standard measure
     • '3-year gap' quantifies the concern
     • It's factual, not emotional

     Shall I use this wording?"

USER: "Yes, that sounds better"

ED: "Great. Now, what support has the school already provided?"
     [Continues with next section...]
```

---

## Ed as the "Risk Hat"

Ed thinks about:

1. **Legal implications** - Could this wording harm the case?
2. **LA response** - Is this likely to trigger support or defensiveness?
3. **Evidence quality** - Is this specific enough to be useful?
4. **Emotional tone** - Is this balanced or aggressive?
5. **Completeness** - Are we missing important information?

```
┌─────────────────────────────────────────────────────────────────┐
│  🎓 Ed's Risk Assessment                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Strength of Your Application:                                │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ ✅ Specific concerns identified                          │    │
│  │ ⚠️  Professional evidence included (optional)          │    │
│  │ ⚠️  Child's views included (for age 9+)                │    │
│  │ ❌ Evidence of lack of progress over time              │    │
│  │ ❌ Details of support already tried                      │    │
│  │ ❌ Reference to relevant professional reports            │    │
│  │ ✅ Balanced tone maintained                              │    │
│  │ ✅ Focused on child's needs, not school failings        │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Recommendations to Strengthen:                               │
│  • Include examples of schoolwork showing difficulty         │
│  • Mention specific interventions tried and outcomes         │
│  • Ask your child for their views (he's old enough)          │
│  • If you have professional reports, reference them          │
│  • Keep a diary for 2 weeks showing patterns of difficulty   │
│                                                                 │
│  [Continue with current wording]  [Strengthen with Ed]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: Ed as Counselor, Not Scribe

| Traditional Form Filling | Ed's Approach |
|------------------------|---------------|
| "What's your name?" → Fills field | Explains why they need the name |
| "What's the concern?" → Fills field | Helps phrase concerns effectively |
| Blind filling | Guidance at every step |
| No context | Explains purpose of each section |
| User submits alone | User submits with confidence |
