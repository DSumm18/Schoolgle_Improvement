# School Data Folder Structure Guide

**Purpose**: This guide shows the recommended Google Drive folder structure for Schoolgle to automatically detect and organize your school's data.

**Why This Matters**: When you connect your Google Drive to Schoolgle, we scan the folder structure to understand what data you have and where it's stored. Using the recommended structure means automatic detection and easier navigation.

---

## 📁 Recommended Structure

Create a **master folder** called something like:
- `School Data`
- `School Improvement Platform`
- `Grove House Data`
- `[School Name] Improvement System`

Then create these numbered subfolders inside it:

```
📁 School Data (root)
│
├─ 📁 01_Census_Reports
│   └─ DfE census returns, validation reports, census data uploads
│
├─ 📁 02_Pupil_Data
│   ├─ Admissions
│   ├─ Attendance
│   ├─ Assessments (KS1, KS2, Phonics, Multiplication Check)
│   ├─ SEN_Register
│   └─ Pupil_Premium
│
├─ 📁 03_Staff_Records
│   ├─ HR_Records
│   ├─ Training_(CPD)
│   └─ DBS_Checks_(SCR)
│
├─ 📁 04_Finance
│   ├─ Budgets
│   ├─ Payroll
│   └─ Purchasing
│
├─ 📁 05_Governance
│   ├─ Board_Meetings_(minutes/agendas)
│   ├─ Policies_(all school policies)
│   └─ Risk_Register
│
├─ 📁 06_Safeguarding
│   └─ Child protection, DSL records, LAC
│
├─ 📁 07_Estates
│   ├─ Health_and_Safety
│   ├─ Premises_(maintenance, building work)
│   └─ Asset_Register
│
├─ 📁 08_Compliance
│   └─ GDPR, data protection, FOI requests
│
├─ 📁 09_Ofsted_Evidence
│   └─ Evidence mapped to Ofsted framework
│
└─ 📁 10_SIAMS_Evidence_(church schools only)
    └─ Evidence mapped to SIAMS framework
```

---

## 🎯 Alternative Naming Options

We automatically detect folders using these patterns (case-insensitive):

| Category | Folder Name Patterns We Detect |
|----------|-------------------------------|
| **Census** | `Census`, `School Census`, `DfE`, `Department for Education`, `Census Return` |
| **Pupil Data** | `Pupil Data`, `Pupil Roll`, `Admissions`, `In Year Applications` |
| **Attendance** | `Attendance`, `Attendance Data`, `Absences` |
| **Assessments** | `Assessment`, `Assessments`, `Tracker`, `Tracking`, `Attainment`, `Progress`, `Key Stage`, `KS1`, `KS2`, `Phonics Screening`, `Multiplication Check` |
| **SEN/SEND** | `SEN`, `SEND`, `Special Educational Needs`, `Send Register`, `EHCP`, `Education Health Care Plan` |
| **Pupil Premium** | `Pupil Premium`, `Disadvantaged`, `PP Strategy` |
| **Behaviour** | `Behaviour`, `Behavior`, `Exclusions`, `Behaviour Data` |
| **Staff** | `Staff`, `Staff Data`, `Staff Records`, `HR`, `Human Resources`, `Personnel`, `Staff Handbook` |
| **Training** | `Training`, `CPD`, `Professional Development`, `Performance Management` |
| **DBS/SCR** | `DBS`, `Disclosure and Barring`, `Single Central Record`, `SCR` |
| **Finance** | `Finance`, `FMS`, `School Budget`, `Budget`, `Consistent Financial Reporting`, `CFR` |
| **Payroll** | `Payroll`, `Payroll Data`, `Salaries` |
| **Governance** | `Governance`, `Governing Body`, `Full Governing Body`, `FGB`, `Board Meetings`, `Governor Meetings`, `Committee Meetings` |
| **Policies** | `Policies`, `Policy Documents`, `School Policies`, `Documents`, `Documentation` |
| **Risk** | `Risk`, `Risk Register`, `Risk Assessment`, `Risks` |
| **Safeguarding** | `Safeguarding`, `Child Protection`, `Looked After Children`, `LAC`, `DSL`, `Designated Safeguarding Lead` |
| **Estates** | `Estates`, `Facilities`, `Premises`, `Health and Safety`, `Health & Safety`, `H&S`, `Asset Register`, `Assets`, `Property`, `Maintenance` |
| **Compliance** | `Compliance`, `GDPR`, `Data Protection`, `Freedom of Information`, `FOI` |
| **Ofsted** | `Ofsted`, `Ofsted Evidence`, `Ofsted Inspection`, `Inspection`, `Section 8`, `Section 5` |
| **SIAMS** | `SIAMS`, `SIAMS Evidence`, `Statutory Inspection of Anglican Schools`, `Church School`, `Diocese` |
| **Curriculum** | `Curriculum`, `Curriculum Planning`, `Scheme of Work`, `Schemes`, `Lesson Planning`, `Learning Objectives` |
| **Teaching & Learning** | `Teaching and Learning`, `Teaching & Learning`, `Quality of Education`, `Pedagogy` |
| **Communications** | `Communications`, `Newsletters`, `Parent Communications`, `School Newsletter`, `Website`, `School Website`, `Social Media` |
| **Meetings** | `Meetings`, `Staff Meetings`, `Parent Meetings`, `Meeting Minutes` |
| **External Reports** | `External Reports`, `DfE Reports`, `Local Authority`, `LA Reports` |

---

## ✅ Setup Checklist

1. **Create master folder** in Google Drive with your school's name
2. **Create numbered subfolders** (01-10) as shown above
3. **Move existing documents** into the appropriate folders
4. **Share the master folder** as "Anyone with the link" → Viewer
5. **Copy the folder link** and paste it into Schoolgle's Data Connections page

---

## 🔧 What If I Already Have a Different Structure?

**No problem!** Our system scans up to 3 levels deep and will:
- Detect folders matching the patterns above
- Show you what we found after connection
- Let you map folders manually if needed

If you have a custom structure, we'll still detect folders that match common patterns. You can always rename folders later to match our recommended structure for better auto-detection.

---

## 🔒 Privacy & Security

**Important**: When sharing your Google Drive folder:
- ✅ **DO** share as "Anyone with the link" → **Viewer** access
- ❌ **DON'T** share as Editor or Contributor
- ✅ **DO** keep sensitive HR/payroll data in separate, unshared folders if needed
- ✅ **DO** remove sensitive individual pupil files before sharing

We only need **read access** to scan and display your documents. We don't modify anything in your Drive.

---

## 📞 Need Help?

If you're unsure about folder setup:
1. Start with the basic structure (01-10)
2. Add folders as you have documents for them
3. You can always restructure later and re-connect

For questions, contact support@schoolgle.co.uk
