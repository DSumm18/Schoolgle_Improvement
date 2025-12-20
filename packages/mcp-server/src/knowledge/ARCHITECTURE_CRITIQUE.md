# Architecture Critique: Generic Knowledge Pack Engine

## A) Why a Simple {roomType: minArea} Dictionary is Unsafe for BB104

**Problem:**
A hardcoded dictionary like `{classroom: 55, scienceLab: 83}` fails because:

1. **Context Dependency**: BB104 minimum areas vary by:
   - Age group (Reception vs Year 6)
   - Special educational needs (SEND provisions)
   - Room function (teaching vs storage)
   - Building regulations (fire exits, accessibility)

2. **Version Drift**: BB104 updates periodically. A static dictionary becomes outdated without lifecycle controls.

3. **Citation Loss**: Users need to know:
   - Which BB104 section applies
   - When guidance was effective
   - Whether it's statutory or advisory

4. **Edge Cases**: Dictionary can't handle:
   - "Classroom for 30 pupils with 2 wheelchair users"
   - "Science lab with prep room attached"
   - "Temporary accommodation vs permanent"

**Solution:**
Rules with `applies_when` conditions + citations allow Ed to:
- Retrieve contextually relevant guidance
- Cite sources for auditability
- Warn when guidance is outdated or draft
- Handle complex scenarios through structured queries

---

## B) How Lifecycle Controls Prevent Outdated Guidance

**Lifecycle Metadata:**
- `effective_date`: When guidance becomes valid
- `review_by_date`: When guidance should be reviewed
- `superseded_by`: Link to newer version
- `confidence_level`: Draft vs validated

**Protection Mechanisms:**

1. **Automatic Filtering**: `consult_knowledge_pack` checks:
   ```typescript
   if (pack.review_by_date < today && pack.confidence_level !== 'high') {
     return { warning: 'Guidance may be outdated' }
   }
   ```

2. **Version Awareness**: Ed warns users:
   - "This guidance is from BB104 v2.1 (2020). Check for updates."
   - "This rule is marked as 'draft' - verify before implementation."

3. **Supersession Chain**: If `superseded_by` exists, tool redirects to current version.

4. **Audit Trail**: Every retrieval logs:
   - Which version was used
   - When it was accessed
   - Confidence level at time of access

**Result:**
Users never quote outdated guidance unknowingly. System enforces review cycles.

---

## C) Why Generic Knowledge Pack Engine Avoids One-Off Implementations

**Anti-Pattern (What We're Avoiding):**
```typescript
// ❌ Estates-specific tool
function getBB104RoomSize(roomType: string) {
  const sizes = { classroom: 55, lab: 83 };
  return sizes[roomType];
}

// ❌ Later: KCSIE-specific tool
function getKCSIESafeguardingRequirement(category: string) {
  const requirements = { ... };
  return requirements[category];
}

// ❌ Later: HR-specific tool
function getHRDisciplinaryProcess(type: string) {
  const processes = { ... };
  return processes[type];
}
```

**Problems:**
- Each domain reinvents retrieval logic
- No shared lifecycle controls
- No consistent citation format
- Can't cross-reference (e.g., "BB104 + KCSIE for SEND spaces")

**Generic Engine Pattern:**
```typescript
// ✅ Single retrieval tool
consult_knowledge_pack(domain, topic, context?)

// ✅ Domain-specific packs
estates_bb104.ts
kcsie_safeguarding.ts
hr_disciplinary.ts

// ✅ Domain-specific skills (orchestrate retrieval + LLM)
generate_room_brief(roomType) // Uses consult_knowledge_pack internally
assess_safeguarding_risk(scenario) // Uses consult_knowledge_pack internally
```

**Benefits:**
- One retrieval mechanism for all domains
- Consistent lifecycle controls
- Shared citation format
- Cross-domain queries possible
- New domains = new pack file, not new architecture

---

## D) How This Design Scales Cleanly to HR, Compliance, Finance

### HR Example:
```typescript
// Pack: hr_disciplinary.ts
{
  domain: 'hr',
  topic: 'disciplinary_process',
  applies_when: 'employee misconduct',
  content: 'ACAS guidance suggests...',
  citations: [{ source: 'ACAS Code of Practice', section: '3.2' }]
}

// Skill: assess_disciplinary_risk
// 1. consult_knowledge_pack('hr', 'disciplinary_process')
// 2. LLM structures: timeline, required steps, risks
// 3. Output cites ACAS explicitly
```

### Compliance Example:
```typescript
// Pack: compliance_gdpr.ts
{
  domain: 'compliance',
  topic: 'data_breach_reporting',
  applies_when: 'personal data breach occurs',
  content: 'ICO guidance indicates...',
  citations: [{ source: 'GDPR Article 33', section: '33(1)' }]
}

// Skill: generate_breach_report
// 1. consult_knowledge_pack('compliance', 'data_breach_reporting')
// 2. LLM drafts report structure
// 3. Output cites GDPR articles
```

### Finance Example:
```typescript
// Pack: finance_procurement.ts
{
  domain: 'finance',
  topic: 'tender_thresholds',
  applies_when: 'purchase exceeds £10k',
  content: 'Public Contracts Regulations 2015 suggest...',
  citations: [{ source: 'PCR 2015', section: 'Reg 5' }]
}

// Skill: assess_procurement_route
// 1. consult_knowledge_pack('finance', 'tender_thresholds')
// 2. LLM evaluates: route, risks, timeline
// 3. Output cites regulations
```

**Scaling Pattern:**
1. New domain = new pack file (`packs/{domain}_{source}.ts`)
2. New skill = new tool file (`tools/{domain}.ts`)
3. All use same `consult_knowledge_pack` retrieval
4. All follow same citation + lifecycle pattern
5. Zero architectural changes needed

---

## Summary: Why This Architecture Works

1. **Deterministic Retrieval**: No LLM calls for static guidance → £0.00 cost
2. **Auditability**: Every output cites source + version
3. **Lifecycle Safety**: Outdated guidance is flagged automatically
4. **Extensibility**: New domains = new files, not new systems
5. **Cost Discipline**: LLMs only for structuring/drafting, not retrieval
6. **Non-Authoritative**: Ed always says "guidance suggests" not "requires"

This is the engine. The product explosion (SEND, KCSIE, HR, Finance) comes later, but the architecture is ready.


