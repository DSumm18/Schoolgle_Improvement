# Schoolgle Drive Folder Structure

**Purpose**: This guide shows the exact folder structure to create in your "Schoolgle Drive" folder for automatic data detection by Schoolgle.

---

## 🔒 Privacy & Security

**IMPORTANT**: Schoolgle ONLY accesses files in the "Schoolgle Drive" folder — nothing else in your Google Drive.

- ✅ We only read files in "Schoolgle Drive"
- ✅ We never modify, delete, or create files
- ✅ You can disconnect at any time
- ✅ OAuth tokens are encrypted at rest

---

## 📁 Create the Root Folder

1. Go to [Google Drive](https://drive.google.com)
2. Click **+ New** → **New folder**
3. Name it exactly: **`Schoolgle Drive`**
4. Click **Create**

---

## 📂 Recommended Folder Structure

Create these numbered folders inside "Schoolgle Drive":

```
📁 Schoolgle Drive
│
├─ 📁 01 Census Reports
│   └─ DfE census returns, validation reports, census data uploads
│
├─ 📁 02 Pupil Data
│   ├─ 📁 Admissions
│   ├─ 📁 Attendance
│   ├─ 📁 Assessments (KS1, KS2, Phonics, Multiplication Check)
│   ├─ 📁 SEN Register
│   └─ 📁 Pupil Premium
│
├─ 📁 03 Staff Records
│   ├─ 📁 HR Records
│   ├─ 📁 Training (CPD)
│   └─ 📁 DBS Checks (SCR)
│
├─ 📁 04 Finance
│   ├─ 📁 Budgets
│   ├─ 📁 Payroll
│   └─ 📁 Purchasing
│
├─ 📁 05 Governance
│   ├─ 📁 Board Meetings (minutes/agendas)
│   ├─ 📁 Policies (all school policies)
│   └─ 📁 Risk Register
│
├─ 📁 06 Safeguarding
│   └─ Child protection, DSL records, LAC
│
├─ 📁 07 Estates & Facilities
│   ├─ 📁 Health and Safety
│   ├─ 📁 Premises (maintenance, building work)
│   └─ 📁 Asset Register
│
├─ 📁 08 Compliance
│   └─ GDPR, data protection, FOI requests
│
└─ 📁 09 Ofsted Evidence
    └─ Evidence mapped to Ofsted framework
```

---

## 🎯 Alternative Folder Names

We automatically detect folders using these patterns (case-insensitive):

| Category | Folder Name Patterns We Detect |
|----------|-------------------------------|
| **Census** | `Census`, `School Census`, `DfE`, `Department for Education` |
| **Pupil Data** | `Pupil Data`, `Pupil Roll`, `Admissions` |
| **Attendance** | `Attendance`, `Attendance Data`, `Absences` |
| **Assessments** | `Assessment`, `Assessments`, `Tracker`, `KS1`, `KS2`, `Phonics`, `Multiplication` |
| **SEN/SEND** | `SEN`, `SEND`, `Special Educational Needs`, `EHCP` |
| **Pupil Premium** | `Pupil Premium`, `Disadvantaged`, `PP Strategy` |
| **Staff** | `Staff`, `Staff Data`, `HR Records`, `Human Resources` |
| **Training** | `Training`, `CPD`, `Professional Development` |
| **DBS/SCR** | `DBS`, `Single Central Record`, `SCR` |
| **Finance** | `Finance`, `FMS`, `School Budget`, `Budget` |
| **Payroll** | `Payroll`, `Salaries` |
| **Governance** | `Governance`, `Governing Body`, `Board Meetings` |
| **Policies** | `Policies`, `Policy Documents`, `School Policies` |
| **Risk** | `Risk`, `Risk Register`, `Risk Assessment` |
| **Safeguarding** | `Safeguarding`, `Child Protection`, `DSL`, `Looked After Children` |
| **Estates** | `Estates`, `Facilities`, `Premises`, `Health and Safety`, `Asset Register` |
| **Compliance** | `Compliance`, `GDPR`, `Data Protection` |
| **Ofsted** | `Ofsted`, `Ofsted Evidence`, `Inspection` |

---

## ✅ Setup Checklist

1. **Create "Schoolgle Drive" folder** in your Google Drive
2. **Create numbered subfolders** (01-09) as shown above
3. **Move existing documents** into the appropriate folders
4. **Go to Schoolgle** → Settings → Data Connections
5. **Click "Connect Google Drive"** and authorize
6. Schoolgle will scan your "Schoolgle Drive" folder only

---

## 📞 Need Help?

If you're unsure about folder setup:
1. Start with the basic structure (01-09)
2. Add folders as you have documents for them
3. You can always restructure later and re-scan

For questions, contact support@schoolgle.co.uk
