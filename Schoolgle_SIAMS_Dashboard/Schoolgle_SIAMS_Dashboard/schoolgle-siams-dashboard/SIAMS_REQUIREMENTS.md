# SIAMS Dashboard - Requirements & Research Document

## 📋 What is SIAMS?

**SIAMS** (Statutory Inspection of Anglican and Methodist Schools) is the inspection framework used by the Church of England to evaluate church schools. It assesses how effectively a school's **theologically rooted Christian vision** enables pupils and adults to flourish.

### Key Links:
- **Official Framework**: [Church of England SIAMS](https://www.churchofengland.org/about/education-and-schools/church-schools-and-academies/siams-inspections)
- **Winchester Diocese SIAMS Guide**: [SIAMS Process Guide](https://winchester.anglican.org/education-schools/governors-senior-leaders/the-church-school-inspection-process-siams/)

---

## 🎯 The 7 SIAMS Inspection Strands

### Core Question:
*"How effective is the school's distinctive Christian vision, established and promoted by leadership at all levels, in enabling pupils and adults to flourish?"*

### The 7 Evaluation Strands:

#### 1. **Vision and Leadership**
- How is the Christian vision established and promoted?
- Leadership at all levels driving the vision
- Decision-making influenced by Christian values

#### 2. **Wisdom, Knowledge, and Skills**
- Quality of education reflecting Christian ethos
- Curriculum design and delivery
- Academic excellence within a Christian context

#### 3. **Character Development: Hope, Aspiration, and Courageous Advocacy**
- Fostering hope and aspiration in pupils
- Encouraging courageous advocacy
- Developing resilience and moral courage

#### 4. **Community and Living Well Together**
- Building relationships within the school community
- Partnerships with local churches and wider community
- Social and cultural development

#### 5. **Dignity and Respect**
- Ensuring respect for all members of the community
- Inclusivity and equality
- Celebrating diversity within a Christian framework

#### 6. **Impact of Collective Worship**
- Quality and effectiveness of collective worship
- Participation and engagement
- Spiritual development through worship

#### 7. **Effectiveness of Religious Education** (VA schools)
- Quality of RE teaching
- Curriculum breadth and balance
- Pupil engagement and outcomes

---

## 🏗️ Dashboard Architecture

### Similar to Estates Dashboard Approach:
Just like we built the estates dashboard with Google Sheets integration, we'll create a comprehensive SIAMS evaluation system.

### Core Components:

#### 1. **Self-Evaluation Module**
- Questionnaire aligned to each of the 7 strands
- Rating scale (e.g., 1-4: Outstanding, Good, Requires Improvement, Inadequate)
- Text fields for "Why?" (rationale)
- Evidence links section

#### 2. **Evidence Management System**
- **Folder structure**: One folder per strand/question
- **Document upload**: Policies, photos, meeting minutes, pupil work
- **Automated categorization**: AI tags evidence to relevant strands
- **Evidence types**:
  - Policies & procedures
  - Meeting minutes
  - Curriculum plans
  - Pupil work samples
  - Photos/videos of displays, worship, events
  - Surveys & feedback (staff, pupils, parents)
  - Performance data

#### 3. **AI Analysis Engine**
- **Content Analysis**: AI scans uploaded evidence in each folder
- **Auto-summarization**: Generates summary of what evidence exists
- **Gap Analysis**: Identifies missing evidence
- **Recommendations**: Suggests additional evidence inspectors would require
- **SEF Auto-population**: Drafts SEF content based on evidence

#### 4. **Action Planning**
- Automated action suggestions based on gaps
- Task assignment to staff
- Progress tracking
- Deadline management

#### 5. **SEF Generation**
- Auto-generate Self-Evaluation Form (SEF)
- Export to PDF/Word format
- Pre-populated with evidence summaries
- Editable by school leadership

---

## 📊 Data Structure

### Google Sheets Integration (like Estates Dashboard)

#### **Sheet 1: Self-Evaluation Matrix**
| Strand | Question | Rating | Why? | Evidence Links | Last Updated | Status |
|--------|----------|--------|------|----------------|--------------|--------|
| 1. Vision & Leadership | How is the Christian vision established? | Good | Our vision is... | folder/vision-docs | 2024-09-30 | Complete |
| 1. Vision & Leadership | How does leadership promote the vision? | Outstanding | Leadership team... | folder/leadership | 2024-09-30 | Complete |

#### **Sheet 2: Evidence Tracker**
| Evidence Type | File Name | Upload Date | Relevant Strand(s) | AI Summary | Quality Score | Missing Elements |
|---------------|-----------|-------------|-------------------|------------|---------------|------------------|
| Policy | Christian Vision Policy.pdf | 2024-09-30 | 1, 4 | Document outlines... | 85% | Include review dates |

#### **Sheet 3: Action Plan**
| Strand | Gap Identified | Action Required | Assigned To | Due Date | Status | Priority |
|--------|----------------|-----------------|-------------|----------|--------|----------|
| 2. Wisdom & Skills | Limited curriculum integration evidence | Upload RE scheme of work | J. Smith | 2024-10-15 | In Progress | High |

#### **Sheet 4: SEF Draft Content**
| Strand | Auto-Generated Summary | Manual Additions | Final Version | Approved By |
|--------|----------------------|------------------|---------------|-------------|
| 1. Vision | Based on uploaded evidence... | [Editable] | [Final] | Head Teacher |

---

## 🤖 AI Features

### 1. **Evidence Scanner**
```
Input: Upload documents to strand folder
Process:
- Extract text from PDFs/images (OCR)
- Analyze content for SIAMS criteria
- Identify key themes and impact statements
- Match to specific inspection questions
Output: Summary + quality score + suggestions
```

### 2. **Gap Analysis**
```
Compare:
- What evidence exists
- What SIAMS framework requires
- What other "Outstanding" schools provide
Output: Missing evidence list + recommendations
```

### 3. **SEF Writer**
```
Input: All evidence + self-evaluation ratings
Process:
- Synthesize evidence across strands
- Generate narrative linking vision to impact
- Include statistical data where relevant
- Highlight strengths and development areas
Output: Draft SEF document
```

### 4. **Inspector Prediction**
```
Analyze evidence using SIAMS criteria
Predict likely inspector questions
Suggest additional evidence to preempt questions
```

---

## 📁 Folder Structure for Evidence

```
/siams-evidence/
├── 1-vision-and-leadership/
│   ├── vision-policy.pdf
│   ├── leadership-meeting-minutes/
│   ├── governors-records/
│   └── staff-survey-results.pdf
├── 2-wisdom-knowledge-skills/
│   ├── curriculum-plans/
│   ├── lesson-observations/
│   ├── pupil-work-samples/
│   └── assessment-data/
├── 3-character-development/
│   ├── pshe-curriculum/
│   ├── pupil-voice-surveys/
│   ├── enrichment-programmes/
│   └── case-studies/
├── 4-community-living-together/
│   ├── partnership-agreements/
│   ├── community-event-photos/
│   ├── parent-feedback/
│   └── local-church-links/
├── 5-dignity-and-respect/
│   ├── behaviour-policy/
│   ├── inclusion-evidence/
│   ├── pupil-wellbeing-data/
│   └── equality-impact-assessments/
├── 6-collective-worship/
│   ├── worship-plans/
│   ├── pupil-reflections/
│   ├── worship-photos-videos/
│   └── parent-feedback/
└── 7-religious-education/
    ├── re-scheme-of-work/
    ├── re-assessment-data/
    ├── pupil-work-samples/
    └── re-governor-reports/
```

---

## 🎨 Dashboard Features (UI/UX)

### Main Dashboard View
- **Progress Overview**: Visual indicators for each strand (traffic light system)
- **Evidence Count**: Number of pieces of evidence per strand
- **Quality Score**: AI-calculated readiness score (0-100%)
- **Next Actions**: Top 5 priority actions

### Strand Detail View
- **Self-Evaluation Form**: Interactive questionnaire
- **Evidence Library**: Drag-and-drop upload
- **AI Analysis**: Auto-generated summaries
- **Gap Report**: Missing evidence highlighted
- **Quick Actions**: Upload, Edit, Generate SEF section

### SEF Generator View
- **Preview**: Live preview of SEF document
- **Edit Mode**: Edit AI-generated content
- **Export Options**: PDF, Word, Google Doc
- **Version History**: Track changes over time

### Collaboration Features
- **Task Assignment**: Assign evidence collection to staff
- **Comments**: Staff can add notes to evidence
- **Approval Workflow**: Leadership review and approve SEF sections
- **Notifications**: Reminders for missing evidence/deadlines

---

## 📈 Example Templates

### Self-Evaluation Question Template
```
Strand: 1 - Vision and Leadership
Question: How effectively does the school's Christian vision drive decision-making?

Rating: ⭐⭐⭐⭐ (Outstanding)

Why?
Our Christian vision "Let Your Light Shine" (Matthew 5:16) is embedded in all decision-making processes. Evidence shows:
- All governor meetings begin with reflection on the vision
- Strategic decisions are mapped against vision impact
- Staff report 95% alignment with vision in annual survey

Evidence:
- Governor meeting minutes (Sept-July 2024)
- Strategic Plan 2024-2027
- Staff vision survey results
- Vision display in reception area (photo)

AI Summary: Strong evidence of vision-driven leadership. Consider adding:
- Pupil voice examples of how they see vision in action
- Case study of a specific decision influenced by Christian vision
```

---

## 🚀 Implementation Plan

### Phase 1: Core Structure (Weeks 1-2)
- Set up Google Sheets with all 7 strands
- Create folder structure in Google Drive/Supabase
- Build basic self-evaluation form UI
- Implement evidence upload functionality

### Phase 2: AI Integration (Weeks 3-4)
- Implement document text extraction (OCR)
- Build AI analysis engine for evidence
- Create gap analysis algorithm
- Develop auto-summarization feature

### Phase 3: SEF Generation (Weeks 5-6)
- Build SEF template based on Church of England format
- Implement auto-population from evidence
- Create export functionality
- Add editing capabilities

### Phase 4: Collaboration & Polish (Weeks 7-8)
- Add user roles (Head, Staff, Governors)
- Implement task assignment & notifications
- Build progress tracking dashboard
- User testing and refinement

---

## 🔗 Integration with Existing Schoolgle Ecosystem

- **Link to Estates Dashboard**: Cross-reference building evidence
- **Staff Management**: Pull staff data for leadership evidence
- **Calendar Integration**: Track worship dates, RE lessons
- **Document Management**: Central evidence repository
- **Analytics**: Track progress over time

---

## 💡 Key Differentiators

1. **AI-Powered Evidence Analysis**: First tool to use AI for SIAMS evidence evaluation
2. **Automated SEF Generation**: Saves hours of manual writing
3. **Gap Prediction**: Identifies missing evidence before inspection
4. **Inspector Lens**: Provides inspector's perspective on evidence quality
5. **Collaborative Platform**: Whole school can contribute evidence
6. **Progress Tracking**: Monitor readiness over time

---

## 📚 Next Steps

1. ✅ Research completed
2. ⏭️ Create database schema for SIAMS data
3. ⏭️ Design UI mockups for dashboard
4. ⏭️ Set up Google Sheets template
5. ⏭️ Implement evidence upload system
6. ⏭️ Build AI analysis engine
7. ⏭️ Test with sample SIAMS evidence
8. ⏭️ User testing with church schools

---

**Let's build this! 🎯**
