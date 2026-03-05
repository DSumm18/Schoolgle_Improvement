# Estates Compliance Module - Domain & Skills Mapping

**Module:** Estates Compliance
**Date:** 2026-01-23
**Purpose:** Map all knowledge domains and required AI skills for Estates Compliance

---

## Module Overview

**Scope:** Comprehensive estates compliance management for UK schools

**Primary Domains:**
1. Legionella Management
2. Fire Safety
3. Asbestos Management
4. Electrical Safety
5. Mechanical (Heating/Ventilation)
6. Gas Safety
7. Water Quality (Drinking Water)
8. Lift & LOLER Equipment
9. Playground Safety
10. Accessibility (DSA)

---

## Domain Breakdown

### Domain 1: Legionella Management

#### Knowledge Requirements

**Regulatory Sources:**
- HSE L8 (4th Edition) - Legionnaires' Disease: Technical guidance
- HSE ACoP L8 - Approved Code of Practice
- HSE HSG274 - Parts 1, 2, 3
- Water Supply (Water Fittings) Regulations 1999
- Local authority requirements

**Key Knowledge Areas:**

| Topic | Details | Frequency | Qualifications |
|-------|---------|-----------|----------------|
| **Weekly Flushing** | Outlets unused 7+ days must be flushed for 5+ minutes | Weekly | Appointed person/delegate |
| **Monthly Inspections** | Visual checks, cold water tanks, calorifiers | Monthly | Competent person |
| **Temperature Monitoring** | Cold water <20°C, Hot water >50°C (stored), >55°C (distributed) | Monthly | Competent person |
| **Quarterly Reviews** | Review of monitoring data, cleaning schedules | Quarterly | Responsible person |
| **Annual Risk Assessment** | Full risk assessment review | Annually | Risk assessor |
| **3-Yearly Full Assessment** | Comprehensive system assessment | 3 years | Qualified consultant |
| **Sample Testing** | Water sampling for bacteria analysis | 6-monthly or per risk assessment | Accredited lab |

#### Skill Requirements

**Skill Package:** `skill-legionella`

```typescript
// Skills needed
interface LegionellaSkills {
  // Core expertise
  guidance: {
    hse_l8_requirements: string;
    temperature_limits: string;
    flush_procedures: string;
    risk_assessment: string;
  };

  // Validation
  validation: {
    authorized_person_check: boolean;
    temperature_range_check: boolean;
    timing_compliance: boolean;
    recording_requirements: boolean;
  };

  // Conversation flows
  conversations: {
    weekly_flush_intake: ConversationFlow;
    monthly_inspection_intake: ConversationFlow;
    annual_review_intake: ConversationFlow;
    issue_reporting_intake: ConversationFlow;
  };

  // Knowledge base
  knowledge: {
    common_misunderstandings: string[];
    failure_points: string[];
    school_specific_considerations: string[];
    best_practices: string[];
  };
}
```

**Expert Questions Ed Must Answer:**
- "Do I need to flush this outlet?"
- "What temperature should the water be?"
- "Am I qualified to complete this check?"
- "What if the temperature is too high?"
- "How do I complete a risk assessment?"
- "What records do I need to keep?"
- "Who is the responsible person?"

**Common Mistakes to Prevent:**
- Flushing when not needed (< 7 days)
- Not flushing when required (≥ 7 days)
- Inadequate flush duration (< 5 minutes)
- Incorrect temperature recording
- Unqualified person completing checks
- Missing deadlines
- Incomplete risk assessments
- Not updating after changes

**School-Specific Context:**
- Term-time vs holiday periods
- Outlets unused during holidays
- Temporary buildings (classrooms)
- Sports facilities usage patterns
- Boarding facilities (if applicable)
- Safeguarding implications (water for drinking/cooking)

**Integration Points:**
- Task scheduling (weekly/monthly/annual)
- Temperature recording with validation
- Photo evidence upload
- Risk assessment workflow
- Certificate management
- Compliance dashboard
- Alert system for deadlines

---

### Domain 2: Fire Safety

#### Knowledge Requirements

**Regulatory Sources:**
- Regulatory Reform (Fire Safety) Order 2005 (RRO)
- BS5839-1: Fire detection and alarm systems
- BS5839-6: Visual alarm devices (for deaf people)
- BS5266: Emergency lighting
- Local fire service requirements

**Key Knowledge Areas:**

| Topic | Details | Frequency | Qualifications |
|-------|---------|-----------|----------------|
| **Weekly Alarm Tests** | Test call points, verify alarm activation | Weekly | Competent person |
| **Monthly Equipment Checks** | Visual inspection of extinguishers, signs, emergency lighting | Monthly | Competent person |
| **Quarterly Emergency Lighting** | Full duration test (3 hours) | Quarterly | Competent person |
| **Annual Servicing** | Extinguishers, alarm system, emergency lighting | Annually | Competent engineer |
| **Fire Risk Assessment** | Full review of fire safety risks | Annually | Fire risk assessor |
| **Fire Drills** | Evacuation practice, log results | Termly (3x/year) | Fire warden |
| **Fire Logbook** | Maintain all records, tests, findings | Ongoing | Responsible person |

#### Skill Requirements

**Skill Package:** `skill-fire-safety`

**Expert Questions Ed Must Answer:**
- "How often do I need to test the fire alarm?"
- "What do I check during monthly inspection?"
- "How do I complete a fire risk assessment?"
- "What if the emergency light fails?"
- "Do I need a fire drill?"
- "How do I dispose of old extinguishers?"
- "What are the different types of extinguishers?"

**Common Mistakes to Prevent:**
- Missing weekly alarm tests
- Not recording test results
- Using wrong extinguisher type
- Blocked escape routes
- Damaged fire doors (propped open)
- Outdated fire risk assessment
- Incomplete fire logbook
- Not informing local fire service of changes

**School-Specific Context:**
- Evacuation procedures for children with SEND
- Boarding facilities (additional requirements)
- Kitchen fire suppression systems
- Science lab fire safety
- DT workshop fire safety
- Temporary buildings/fire rated partitioning

---

### Domain 3: Asbestos Management

#### Knowledge Requirements

**Regulatory Sources:**
- Control of Asbestos Regulations 2012 (CAR 2012)
- ACOP L143 - Managing and working with asbestos
- HSE A5 - Comprehensive guide to managing asbestos

**Key Knowledge Areas:**

| Topic | Details | Frequency | Qualifications |
|-------|---------|-----------|----------------|
| **Asbestos Register** | Maintain up-to-date register of ACM locations | Ongoing | Duty holder |
| **Annual Visual Inspection** | Visual check of ACM condition | Annually | Competent person |
| **Re-inspection** | Full survey and condition assessment | Every 3 years | UKAS surveyor |
| **Management Plan** | Asbestos management plan review | Annually | Duty holder |
| **Training Records** | Staff training awareness | Every 12 months | All staff |
| **Incident Reporting** | If ACM damaged or disturbed | Immediately | Duty holder |

#### Skill Requirements

**Skill Package:** `skill-asbestos`

**Expert Questions Ed Must Answer:**
- "What do I do if I find damaged asbestos?"
- "Do I need an asbestos survey?"
- "Who can work on asbestos?"
- "What's the difference between licensed and non-licensed work?"
- "How do I update the register?"
- "What training do staff need?"

**Common Mistakes to Prevent:**
- Not maintaining register
- Ignoring damaged ACMs
- Unlicensed work on licensed materials
- Not informing contractors
- Inadequate warning signs
- Poor record-keeping
- Failing to re-inspect on schedule

**School-Specific Context:**
- Classroom pinboards (often contain asbestos)
- Ceiling tiles in older buildings
- Pipe lagging in boiler rooms
- External cladding
- School holiday works (contractor management)

---

### Domain 4: Electrical Safety

#### Knowledge Requirements

**Regulatory Sources:**
- Electricity at Work Regulations 1989
- BS7671 (IET Wiring Regulations)
- IET Code of Practice for In-Service Inspection
- Health and Safety at Work Act 1974

**Key Knowledge Areas:**

| Topic | Details | Frequency | Qualifications |
|-------|---------|-----------|----------------|
| **Visual Inspections** | Visual check of sockets, switches, fittings | Annually | Competent person |
| **Fixed Wire Testing** | Full electrical installation testing | Every 5 years | Qualified electrician |
| **Portable Appliance Testing** | Testing of portable equipment | Class based (6mo-4yr) | Competent person |
| **Emergency Lighting Test** | See Fire Safety above | Monthly/Quarterly | Competent person |
| **RCD Testing** | Residual Current Device test | Quarterly | Competent person |
| **Thermal Imaging** | Optional for switchboards | Annually | Qualified engineer |

#### Skill Requirements

**Skill Package:** `skill-electrical`

---

### Domain 5: Mechanical (Heating/Ventilation)

#### Knowledge Requirements

**Regulatory Sources:**
- Gas Safety (Installation and Use) Regulations 1998
- GFPA Code of Practice
- TM44 - Air conditioning inspections
- Building Regulations Part L

**Key Knowledge Areas:**

| Topic | Details | Frequency | Qualifications |
|-------|---------|-----------|----------------|
| **Gas Safety Checks** | All gas appliances and pipework | Annually | Gas Safe registered |
| **TM44 Inspections** | Air conditioning systems >12kW | Every 5 years | Accredited energy assessor |
| **Boiler Servicing** | Annual service and safety check | Annually | Gas Safe/Oftec registered |
| **Ventilation Checks** | Kitchen extraction, fume cupboards | Termly | Competent person |
| **Filter Cleaning/Replacement** | AHU and ventilation filters | Per manufacturer | Competent person |

#### Skill Requirements

**Skill Package:** `skill-mechanical`

---

### Domain 6: Water Quality (Drinking Water)

#### Knowledge Requirements

**Regulatory Sources:**
- Water Supply (Water Fittings) Regulations 1999
- Water Industry Act 1991
- Drinking Water Inspectorate guidance
- Local water authority requirements

**Key Knowledge Areas:**

| Topic | Details | Frequency | Qualifications |
|-------|---------|-----------|----------------|
| **Water Sampling** | Drinking water quality tests | Termly or per LA | Accredited lab |
| **Tank Cleaning** | Cold water storage tank cleaning | Annually | Competent person |
| **Outlet Cleaning** | Drinking fountain/bottle filler cleaning | Weekly | Caretaker/cleaning staff |
| **Temperature Checks** | Stored hot water temperature | Monthly | Competent person |

#### Skill Requirements

**Skill Package:** `skill-water-quality`

---

### Domain 7: Lift & LOLER Equipment

#### Knowledge Requirements

**Regulatory Sources:**
- Lifting Operations and Lifting Equipment Regulations 1998 (LOLER)
- Provision and Use of Work Equipment Regulations 1998 (PUWER)
- BS EN 81 series (Lift safety)

**Key Knowledge Areas:**

| Topic | Details | Frequency | Qualifications |
|-------|---------|-----------|----------------|
| **LOLER Inspections** | Thorough examination of lifting equipment | Every 6/12 months | Competent person (INSPEC) |
| **Passenger Lifts** | Full examination and test | Every 6 months | Lift engineer |
| **Goods/Hospital Lifts** | Full examination and test | Every 12 months | Lift engineer |
| **Platform Lifts** | Full examination and test | Every 6 months | Lift engineer |
| **Gym Equipment** | LOLER if lifting >25kg | Every 12 months | Competent person |

#### Skill Requirements

**Skill Package:** `skill-lift-loler`

---

### Domain 8: Playground Safety

#### Knowledge Requirements

**Regulatory Sources:**
- Health and Safety at Work Act 1974
- EN 1176 (Playground equipment)
- EN 1177 (Suracing)
- ROSPA Play Safety

**Key Knowledge Areas:**

| Topic | Details | Frequency | Qualifications |
|-------|---------|-----------|----------------|
| **Weekly Visual Inspection** | Check for damage, wear, litter | Weekly | Trained staff |
| **Quarterly Inspection** | Detailed equipment inspection | Quarterly | RPII qualified inspector |
| **Annual Post Installation** | Full inspection after installation | Annually | RPII outdoor play inspector |
| **Surface Impact Testing** | Test surfacing for critical fall height | Every 3 years | RPII inspector |

#### Skill Requirements

**Skill Package:** `skill-playground`

---

### Domain 9: Accessibility (DSA)

#### Knowledge Requirements

**Regulatory Sources:**
- Equality Act 2010
- Building Regulations Part M
- BS 8300 (Design of accessible buildings)

**Key Knowledge Areas:**

| Topic | Details | Frequency | Qualifications |
|-------|---------|-----------|----------------|
| **Access Audits** | Review of accessibility provision | Every 3 years | Access auditor |
| **Evacuation PEEPs** | Personal Emergency Evacuation Plans | Per student/year | SENCO/responsible person |
| **Equipment Checks** | Hoists, lifts, ramps | Termly | Competent person |

#### Skill Requirements

**Skill Package:** `skill-accessibility`

---

## Skill Orchestration

### Cross-Domain Skills

Some skills span multiple domains:

#### Universal Skills

**Skill:** `compliance-basics`

- Understanding of "competent person"
- Record keeping requirements
- Duty holder responsibilities
- Documentation standards
- Audit trail maintenance

**Skill:** `risk-assessment`

- 5 steps to risk assessment
- Risk rating methodology
- Control measures hierarchy
- Review requirements
- Documentation

**Skill:** `contractor-management`

- Contractor selection
- Verification of qualifications
- Permits to work
- On-site supervision
- Sign-off procedures

### Domain Interactions

| Domain | Interactions | Example Scenario |
|--------|--------------|------------------|
| **Legionella + Fire** | Water for fire fighting | Weekly fire pump tests |
| **Asbestos + Fire** | Fire doors with ACMs | Fire door inspection triggers asbestos check |
| **Electrical + Fire** | Emergency lighting, fire alarms | Electrical test reveals fire system fault |
| **All + Safeguarding** | Working in school environment | Any work requires DBS check awareness |
| **All + Accessibility** | Impact on disabled students | Equipment replacement must consider accessibility |

---

## Skill Package Structure

```
packages/skills-estates-compliance/
├── skill-legionella/           # Domain 1
├── skill-fire-safety/          # Domain 2
├── skill-asbestos/             # Domain 3
├── skill-electrical/           # Domain 4
├── skill-mechanical/           # Domain 5
├── skill-water-quality/        # Domain 6
├── skill-lift-loler/           # Domain 7
├── skill-playground/           # Domain 8
├── skill-accessibility/        # Domain 9
│
├── skill-compliance-basics/    # Cross-domain
├── skill-risk-assessment/      # Cross-domain
└── skill-contractor-management/# Cross-domain
```

---

## Knowledge Research Plan

### For Each Domain

**Phase 1: Source Gathering (Week 1)**
1. Download all regulatory documents
2. Identify key requirements
3. Note all frequencies and timeframes
4. Document qualification requirements
5. List common failure points

**Phase 2: Knowledge Structuring (Week 2)**
1. Define knowledge pack schema
2. Extract critical rules
3. Create validation logic
4. Design question flows
5. Identify expert questions

**Phase 3: Expert Validation (Week 3)**
1. Review with subject matter expert
2. Verify rule accuracy
3. Test conversation flows
4. Refine guidance
5. Finalize citations

### Priority Order for Development

**Phase 1 (MVP):**
1. Legionella Management (pilot domain)
   - Weekly flush
   - Monthly inspection
   - Temperature validation
   - Authorization checks

**Phase 2 (Core):**
2. Fire Safety
3. Asbestos Management
4. Electrical Safety

**Phase 3 (Extended):**
5. Mechanical
6. Water Quality
7. Lift/LOLER
8. Playground
9. Accessibility

---

## User Journey Mapping

### Scenario 1: Weekly Legionella Flush

```
User: Site Manager
Task: Complete weekly flush of classroom sinks

1. User opens Estates Compliance app
2. Dashboard shows "3 outlets due for flush"
3. User taps on "Classroom 1 Sink"
4. Ed appears: "Hi! I'll guide you through this weekly flush."
5. Ed: "This outlet was last used 10 days ago, so a flush is required."
6. Ed: "You'll need to flush for at least 5 minutes."
7. User: "Ok"
8. Ed: "After flushing, record the temperature. Cold water should be below 20°C."
9. User completes flush, records 18°C
10. Ed: "Great! 18°C is within limits. Who completed this flush?"
11. User: "Me, John Smith"
12. Ed: "Are you the appointed responsible person or delegated by them?"
13. User: "I'm delegated by Sarah Jones (Responsible Person)"
14. Ed: "Perfect! Task complete. Next flush due in 7 days."
15. Ed: "Quick tip: Don't forget to record this in the site log book too."

Behind the scenes:
- Ed validated 7+ day rule
- Ed validated temperature limit
- Ed checked authorization
- Ed scheduled next task
- Ed reminded of parallel requirements
```

### Scenario 2: Temperature Finding

```
User: Site Manager
Task: Complete weekly flush, finds high temperature

1-10. Same as above
11. User records temperature: 25°C
12. Ed: "⚠️ 25°C is above the 20°C limit. This may indicate bacterial growth."
13. Ed: "I'll create a finding for investigation."
14. Ed: "Do you know when this outlet was last used before today?"
15. User: "About 3 weeks ago"
16. Ed: "Thanks. That extended period increases risk."
17. Ed: "I recommend: 1) Increased flushing frequency for 2 weeks, 2) Consider water sample, 3) Check for cold water tank issues"
18. User: "Ok, create the finding"
19. Ed: "Finding created. I've also notified the Responsible Person."
20. Ed: "Would you like me to schedule a follow-up flush in 3 days?"

Behind the scenes:
- Ed detected out-of-range reading
- Ed gathered context
- Ed calculated risk level
- Ed provided expert guidance
- Ed created compliance finding
- Ed triggered notification
- Ed offered proactive solution
```

---

## Next Steps

1. **Complete Legionella Knowledge Pack** (Pilot)
   - Research HSE L8 in detail
   - Create knowledge rules
   - Build question flows
   - Develop validation logic

2. **Build Legionella Skill Package**
   - MCP tools implementation
   - Conversation flows
   - Integration hooks

3. **Develop Application Features**
   - Task scheduling
   - Temperature recording
   - Evidence upload
   - Compliance dashboard

4. **Test & Iterate**
   - User testing
   - Expert validation
   - Refine and improve

---

**Document Status:** Draft - Ready for Research Phase
**Next Action:** Begin competitor research and Legionella deep-dive
**Owner:** Product Team

---

**Last Updated:** 2026-01-23
