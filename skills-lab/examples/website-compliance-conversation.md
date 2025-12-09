# Example Conversation: Website Compliance Check

## Scenario
A school governor has been asked to audit the school website for statutory compliance before Ofsted inspection.

---

## Conversation

**User**: Hi Ed, I'm a governor and we think Ofsted might be coming soon. I've been asked to check our website is compliant. Can you help?

**Ed** (activates `website_compliance_checker` skill):

Absolutely! Website compliance is something Ofsted does check (especially safeguarding policy and pupil premium information), so it's smart to audit it now. Let me guide you through a systematic check.

First, I need to know:
- Is your school **maintained** (local authority) or an **academy/free school**?
- Do you have access to the website to look through it, or would you like a general checklist?

The requirements are mostly the same, but academies have a few additional financial transparency requirements.

---

**User**: We're an academy. I have the website open now - I can check sections as you guide me through.

**Ed**:

Perfect! I'll take you through this systematically, starting with **critical** items (fix immediately if missing), then **important** (fix within a month), then **recommended**.

## **Critical Checks** (Do These First - 10 minutes)

These are legal requirements Ofsted may check. Let's go through them one by one:

### ✅ **1. Safeguarding Policy**

**What to check**:
- Go to your policies section (often under "About Us" or "Information")
- Look for "Child Protection and Safeguarding Policy"
- Check the date - **must be September 2024 or later** (reflects latest KCSIE)
- Check it names the Designated Safeguarding Lead

**What you should see**:
```
Child Protection and Safeguarding Policy
Date: September 2024
Review date: September 2025
References: Keeping Children Safe in Education 2024
Designated Safeguarding Lead: [Name]
```

**Can you find this?** What date does your policy show?

---

**User**: Found it! It's dated September 2024 and names our DSL. ✅

**Ed**: Excellent - that's the most critical one done! ✅

### ✅ **2. Admissions Information**

**What to check**:
- Look for an "Admissions" page
- You need **two** admission policies:
  - 2024/25 (current year)
  - 2025/26 (next year) ← Many schools forget this!
- Also check for: PAN (Published Admission Number), oversubscription criteria, in-year admissions process

**What should be there**:
- Clear admission policy for current AND next academic year
- PAN clearly stated (e.g., "We admit 60 pupils to Reception each year")
- Oversubscription criteria (what happens if more apply than places)
- How to apply for in-year admissions

**Can you find all of these?**

---

**User**: We have current year policy but not next year's! And I can't see the in-year admissions process mentioned anywhere.

**Ed**:

Good catch! That's a **critical compliance gap** - you legally must publish next year's policy. Here's what to do:

**Missing items**:
1. ❌ **2025/26 Admissions Policy** - CRITICAL
2. ❌ **In-year admissions process** - CRITICAL

**How to fix**:
1. **Next year's policy**: Contact your admissions lead or trust central team - this should be determined by now (deadline was 28 Feb for determining policies). Get them to send you the policy and upload it to the website.

2. **In-year admissions**: Add a section to your admissions page explaining:
   - How to apply for a place mid-year
   - Who to contact (usually trust admissions team for academies)
   - What happens next (visit, place offered if available, waiting list if full)

**Example text for in-year admissions**:
```
**In-Year Admissions**

If you would like to apply for a place outside the normal admission round (i.e., mid-year or for a year group other than Reception), please:

1. Contact our school office on [phone] or [email]
2. Complete an in-year application form (available from school office or [trust website])
3. We will arrange a visit and inform you of availability within 10 school days

If places are available, we will offer a start date. If the year group is full, your child will be added to our waiting list and we will contact you if a place becomes available.
```

I'll keep tracking these as we go. Let's continue with the critical checks:

### ✅ **3. Complaints Procedure**

**What to check**:
- Look for a "Complaints Policy" or "How to Make a Complaint"
- Should explain the stages (usually 3: informal, formal to headteacher, formal to governors)
- Should say who to contact at each stage
- Should give timescales

**Can you find this?**

---

**User**: Yes, we have a complaints procedure. It's dated 2023 though - does that matter?

**Ed**:

**2023 is fine** for complaints procedure - it doesn't change as often as safeguarding policy. As long as it's within the last 3 years and reflects your current practice, you're compliant. ✅

Just check it's accurate (e.g., are the named people still in post? Does the process match what actually happens?). If yes, you're good.

### ✅ **4. Contact Details**

**What to check**:
- School name, address, phone number, email
- Headteacher/principal name
- Chair of governors/trustees name

**All current and correct?**

---

**User**: All correct except the chair of trustees - we have a new chair as of January and the website still shows the old one!

**Ed**:

That's a **critical fix** - needs updating immediately:

❌ **Chair of trustees out of date** - CRITICAL

**How to fix**: Ask your clerk to trustees for the new chair's name and update the website. This should take 2 minutes.

Ofsted could ask to speak to your chair, so having the wrong name published looks disorganized.

---

## **Running Total So Far**

**Critical Issues Found**:
1. ❌ 2025/26 Admissions Policy missing
2. ❌ In-year admissions process not published
3. ❌ Chair of trustees name out of date

**Critical Items Compliant**:
1. ✅ Safeguarding policy (Sep 2024)
2. ✅ Complaints procedure
3. ✅ Contact details (except chair name)

Let's keep going - we're doing well! Now onto **Important** items (should fix within a month):

---

## **Important Checks** (Fix Within a Month)

### ✅ **5. Pupil Premium Strategy**

**What to check**:
- Look for "Pupil Premium" page (often under "Information" or "Key Information")
- You need **two** documents:
  - Current year strategy statement (2024/25)
  - Previous year's impact report (2023/24)

**The strategy must include**:
- Number of PP pupils and funding amount
- Identified barriers to learning
- Chosen interventions and **why** (evidence/rationale)
- How impact will be measured
- Budget breakdown

**Can you find both current strategy AND last year's impact report?**

---

**User**: We have current year strategy but I can't find last year's impact report anywhere.

**Ed**:

That's a common gap! Ofsted **specifically** asks about PP impact, so this is **important**:

❌ **2023/24 Pupil Premium Impact Report missing** - IMPORTANT

**How to fix**:
Ask your headteacher/deputy for last year's impact report. It should show:
- What you spent PP on in 2023/24
- What impact it had (data, evidence)
- What worked, what didn't
- How this informed this year's strategy

If it was never written (many schools forget!), create a brief summary:
```
**2023/24 Pupil Premium Impact Report**

**Funding**: £[amount] for [number] pupils

**Spending**:
- Intervention 1: £[amount] - Impact: [data/evidence]
- Intervention 2: £[amount] - Impact: [data/evidence]

**Outcomes**:
- Attainment gap: [data showing gap closure or not]
- What worked: [successful interventions]
- What didn't: [less effective - what we'll change]

**Informing 2024/25 Strategy**:
Based on above, we are focusing on [priorities] this year.
```

**Quick check on your current strategy**: Does it link interventions to evidence (e.g., "EEF research shows...")?

---

**User**: I'm looking at the strategy now... it just lists what we're spending on but doesn't explain why or link to evidence.

**Ed**:

That's another **important improvement needed**:

⚠️ **Pupil Premium Strategy lacks evidence/rationale** - IMPORTANT

**What's needed**:
For each intervention in your strategy, add:
- **Why** this intervention (what barrier does it address?)
- **Evidence** it works (cite EEF Toolkit or other research)

**Example**:
```
**Poor** (what you have now):
- Small group reading tuition: £12k

**Good** (what you need):
- Small group reading tuition: £12k
  **Rationale**: Our identified barrier is reading comprehension gaps (PP pupils 15% behind non-PP at KS2)
  **Evidence**: EEF Toolkit shows small group tuition has +4 months impact (⭐⭐⭐ evidence strength)
  **Success criteria**: 70% of pupils in intervention groups close gap and exit intervention by July
```

This shows governors (and Ofsted) you're making evidence-based decisions, not just spending because you've always spent on X.

Want me to help improve your strategy after we finish the compliance check?

---

**User**: Yes please! Let's finish the check first though.

**Ed**: Good plan! Continuing with important items:

### ✅ **6. SEND Information**

**What to check**:
- SEND policy
- **SEND Information Report** (this is separate from policy - many schools miss this!)
- Name of SENCO
- Link to local authority local offer

**The Information Report must explain**:
- How school identifies SEND
- How parents can raise concerns
- How school supports SEND pupils
- Staff expertise and training
- How effectiveness is evaluated

**Can you find both the policy AND information report?**

---

**User**: We have a SEND policy but I don't see a separate information report. We do name the SENCO though.

**Ed**:

Another common gap:

❌ **SEND Information Report missing** - IMPORTANT

**How to fix**:
The SEND Information Report is a **legal requirement**. Ask your SENCO to create one using this template:

```markdown
# SEND Information Report

**SENCO**: [Name] | **Contact**: [email]

## How we identify SEND
[Explain your assessment/identification process]

## How parents can raise concerns
[Who to contact, what happens next]

## How we support SEND pupils
[Your provision: interventions, in-class support, specialist support]

## Staff expertise and training
[SENCO qualifications, TA training, specialist knowledge]

## Equipment and facilities
[Any specialist equipment, sensory spaces, etc.]

## Evaluating effectiveness
[How you measure progress, review cycles]

## Complaints
[Link to complaints procedure for SEND concerns]

**Local Authority Local Offer**: [Link to LA website]
```

DfE provides a template: search "SEND information report template DfE"

### ✅ **7. Governance Information**

**What to check** (Academies need):
- List of all trustees
- List of members
- Committee structure
- Attendance records
- Business/pecuniary interests register
- Articles of association
- Funding agreement

**Can you find all of these?**

---

**User**: We have trustees list but it's from 2023. No attendance records published. I can't find the business interests register anywhere.

**Ed**:

More important gaps - these are **transparency requirements**:

❌ **Trustees list out of date** - IMPORTANT
❌ **No attendance records published** - IMPORTANT
❌ **Business interests register not published** - IMPORTANT

**How to fix**:

1. **Updated trustees list**: Get current list from clerk (should include: name, role, appointment date, term end date, any committee memberships)

2. **Attendance records**: Create a table showing:
```
| Trustee Name | Possible Meetings | Attended | Attendance % |
|-------------|------------------|----------|--------------|
| John Smith  | 6                | 6        | 100%         |
| Jane Doe    | 6                | 5        | 83%          |
```
Update termly after each board meeting.

3. **Business interests register**: Create a table:
```
| Trustee Name | Business Interests | Date Declared |
|-------------|-------------------|---------------|
| John Smith  | None              | Sept 2024     |
| Jane Doe    | Director of ABC Ltd (no conflict) | Sept 2024 |
```

**Why this matters**: Shows transparency and guards against corruption. Ofsted can check this.

---

## **Compliance Summary So Far**

Let me summarize what we've found:

### **Critical Issues** (Fix Immediately)
1. ❌ 2025/26 Admissions Policy missing
2. ❌ In-year admissions process not published
3. ❌ Chair of trustees name out of date

### **Important Issues** (Fix Within a Month)
4. ❌ 2023/24 Pupil Premium Impact Report missing
5. ⚠️ Pupil Premium Strategy lacks evidence/rationale
6. ❌ SEND Information Report missing
7. ❌ Trustees list out of date (2023)
8. ❌ No trustee attendance records published
9. ❌ Business interests register not published

### **Compliant Items** ✅
- Safeguarding policy (up to date)
- Complaints procedure
- Contact details (except chair name)
- SEND policy
- SENCO named
- Pupil premium strategy published (though needs improvement)

---

## **Quick Remaining Checks**

Let me speed through a few more important items:

**Ofsted Report**: Is your most recent Ofsted report linked and prominent? (Not buried deep)

**Curriculum**: Do you publish what pupils learn in each year group? (Not just "we follow National Curriculum")

**Exam Results** (if you have secondary): KS4/KS5 results published?

**Policies**: Are these dated and current?
- Behavior policy
- Exclusions policy
- Equality objectives
- Charging and remissions policy

---

**User**: Ofsted report is linked but quite buried. Curriculum is very brief - just says we follow NC. We don't publish exam results (we're primary only). Policies - let me check... behavior is 2024, exclusions is 2022, equality objectives I can't find, charging is 2023.

**Ed**:

OK, a few more improvements needed:

⚠️ **Recommended Improvements**:
- Ofsted report should be more prominent (add to homepage or About section)
- Curriculum needs more detail (what do Year 3 learn in history? What phonics scheme? What maths scheme?)
- Exclusions policy should be reviewed (2022 is OK but getting old - aim for every 3 years)
- Equality objectives missing (legal requirement)

---

## **Your Action Plan**

Here's what I suggest you present to trustees:

### **Priority 1: Critical (Fix This Week)**
1. Update chair of trustees name (5 mins - ask clerk)
2. Publish 2025/26 admissions policy (ask admissions lead)
3. Add in-year admissions process (use template I provided)

### **Priority 2: Important (Fix This Month)**
4. Publish 2023/24 PP impact report (ask HT/Deputy)
5. Improve PP strategy with evidence/rationale (I can help with this)
6. Create SEND Information Report (ask SENCO, use DfE template)
7. Update trustees list (ask clerk)
8. Publish trustee attendance records (ask clerk)
9. Publish business interests register (ask clerk - should already exist)

### **Priority 3: Recommended (Fix This Term)**
10. Make Ofsted report more prominent
11. Expand curriculum information (subject leaders can provide)
12. Review/update exclusions policy
13. Create equality objectives (if don't exist) or publish (if they do exist)

---

## **Who to Involve**

**Clerk to Trustees**: Items 1, 7, 8, 9
**Admissions Lead/Trust Team**: Items 2, 3
**Headteacher/Deputy**: Items 4, 5, 10, 11
**SENCO**: Item 6
**SBM**: Items 12, 13

---

## **Timescale**

- **Critical items**: Aim to fix by [date 1 week from now]
- **Important items**: Aim to fix by [date 4 weeks from now]
- **Recommended**: Aim to fix by [end of term]

**Review again**: After fixes, do another quick check in 6 months (or before Ofsted if you get notice!)

---

**Would you like me to**:
1. Help improve your pupil premium strategy with evidence links?
2. Provide the SEND Information Report template in full?
3. Create template text for in-year admissions?
4. Draft equality objectives for you to adapt?

---

**User**: This is so helpful! Can you help with the pupil premium strategy? And provide the full SEND report template?

**Ed**:

Absolutely! Let me help with both...

[Conversation would continue with Ed providing detailed templates and guidance]

---

## **Skill Activation Summary**

**Skill triggered**: `website_compliance_checker`

**Why triggered**: User asked about website compliance audit with specific context (academy, pre-Ofsted check)

**Knowledge used**:
- `skills-lab/knowledge/website-compliance-requirements.md`
- Statutory requirements (Section 328, Education Act 1996)
- DfE guidance for academies
- Ofsted expectations
- Accessibility requirements

**Value demonstrated**:
- Systematic audit process (critical → important → recommended)
- Identified 9 compliance gaps with specific fixes
- Provided templates and example text
- Prioritized actions with timescales
- Assigned responsibility to appropriate people
- Offered continued support

**User outcome**: Governor has clear action plan to fix compliance gaps before Ofsted, with specific guidance on how to fix each issue
