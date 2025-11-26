# GDPR Procedures Manual

## For Schools and Schoolgle Staff

---

## 1. Subject Access Request (SAR) Procedure

### 1.1 What is a SAR?
A Subject Access Request is a request from an individual to access all personal data an organisation holds about them.

### 1.2 Who Can Make a SAR?
- Any user with a Schoolgle account
- Third parties with written authority from the data subject

### 1.3 How Users Make a SAR

**Option 1: Self-Service (Recommended)**
1. Log in to Schoolgle
2. Go to Settings → Privacy → "Export My Data"
3. Click "Generate Data Export"
4. Download JSON file containing all personal data

**Option 2: Email Request**
1. Email dpo@schoolgle.co.uk
2. Include: Full name, email address, account identifier
3. We will verify identity before processing

### 1.4 Response Timeline
- **Acknowledgement:** Within 3 working days
- **Data provided:** Within 30 calendar days
- **Extension:** May extend by 60 days for complex requests (must notify within 30 days)

### 1.5 What Data is Provided?
| Category | Data Included |
|----------|---------------|
| Account | Email, name, role, join date |
| Activity | Login history, features used |
| Content | Assessments, actions, notes created |
| Settings | Preferences, notification settings |

### 1.6 SAR Response Template

```
SUBJECT ACCESS REQUEST RESPONSE

Date: [Date]
Reference: SAR-[Number]
Data Subject: [Name]

Dear [Name],

Thank you for your Subject Access Request dated [Date]. Please find attached a complete copy of the personal data we hold about you.

Data categories included:
✓ Account information
✓ Activity logs (past 12 months)
✓ Content you have created
✓ Settings and preferences

The attached file is in JSON format, which can be opened in any text editor or imported into other systems.

If you have any questions about this data, please contact us at dpo@schoolgle.co.uk.

Yours sincerely,
Schoolgle Data Protection Team
```

---

## 2. Right to Erasure (Deletion) Procedure

### 2.1 What is the Right to Erasure?
Also known as "Right to be Forgotten", this allows individuals to request deletion of their personal data.

### 2.2 When We Must Delete Data
- User withdraws consent
- Data no longer necessary for original purpose
- User objects and there's no overriding legitimate interest
- Data was unlawfully processed
- Required by law

### 2.3 When We May Refuse
- Legal obligation to retain data
- Exercise or defence of legal claims
- Public interest in public health
- Archiving in public interest

### 2.4 How Users Request Deletion

**Option 1: Self-Service**
1. Log in to Schoolgle
2. Go to Settings → Privacy → "Delete My Account"
3. Confirm deletion (enter password)
4. Account and all data deleted within 30 days

**Option 2: Email Request**
1. Email dpo@schoolgle.co.uk
2. Subject: "Right to Erasure Request"
3. Include account email address
4. We will verify identity before processing

### 2.5 Response Timeline
- **Acknowledgement:** Within 3 working days
- **Deletion completed:** Within 30 calendar days
- **Confirmation:** Email sent upon completion

### 2.6 What Gets Deleted

| Data Type | Action | Timeline |
|-----------|--------|----------|
| Account data | Hard delete | Immediate |
| Content (assessments, actions) | Hard delete | Within 30 days |
| Activity logs | Anonymised | Within 30 days |
| Backups | Automatic expiry | 90 days |

### 2.7 Organisation-Level Deletion

**For School Administrators:**
1. Go to Settings → Organisation → "Delete Organisation"
2. Download final data export (recommended)
3. Confirm deletion (requires Admin password)
4. All organisation data deleted within 30 days

**What happens:**
- All users removed from organisation
- All assessments, actions, documents deleted
- All audit logs deleted
- Organisation record removed

### 2.8 Deletion Confirmation Template

```
DELETION CONFIRMATION

Date: [Date]
Reference: DEL-[Number]

Dear [Name],

We confirm that your personal data has been deleted from Schoolgle as requested on [Request Date].

The following data has been permanently deleted:
✓ Account information
✓ Activity logs
✓ Content you created
✓ Settings and preferences

Data in existing backups will be automatically purged within 90 days.

If you have any questions, please contact dpo@schoolgle.co.uk.

Yours sincerely,
Schoolgle Data Protection Team
```

---

## 3. Data Breach Procedure

### 3.1 Definition
A data breach is any security incident that results in:
- Accidental or unlawful destruction of data
- Loss of data
- Alteration of data
- Unauthorised disclosure of data
- Unauthorised access to data

### 3.2 Internal Reporting
Any staff member who suspects a breach must:
1. Report immediately to the Data Protection Officer
2. Do NOT attempt to investigate or fix without authorisation
3. Preserve evidence (do not delete logs)

### 3.3 Assessment (within 4 hours)
The DPO will assess:
- Nature of the breach
- Categories of data affected
- Number of records affected
- Likely consequences
- Whether breach is ongoing

### 3.4 Notification to Schools (within 24 hours)
If personal data is affected, notify the school (Data Controller):
- Email to registered admin contact
- Phone call if high risk
- Provide breach details and recommended actions

### 3.5 ICO Notification (within 72 hours)
The School (as Data Controller) decides whether to notify ICO.
Schoolgle will assist by providing:
- Breach report
- Technical details
- Remediation steps taken

### 3.6 Data Subject Notification
If high risk to individuals, assist the School in notifying affected users.

### 3.7 Post-Incident Review
Within 14 days:
- Root cause analysis
- Remediation implemented
- Process improvements identified
- Report to affected schools

---

## 4. Data Retention Schedule

| Data Type | Retention Period | Basis |
|-----------|-----------------|-------|
| Active accounts | Duration of service | Contract |
| Closed accounts | 30 days then delete | Policy |
| Activity logs | 12 months | Legitimate interest |
| Audit logs | 24 months | Legal compliance |
| Backups | 90 days | Disaster recovery |
| AI processing | Real-time only | Technical necessity |
| Support tickets | 24 months | Service improvement |
| Financial records | 7 years | Legal requirement |

---

## 5. Data Export Format

When users export their data, they receive a JSON file structured as:

```json
{
  "export_date": "2025-11-26T12:00:00Z",
  "data_subject": {
    "id": "user_abc123",
    "email": "user@school.ac.uk",
    "display_name": "Jane Smith",
    "role": "slt",
    "created_at": "2024-01-15T09:30:00Z"
  },
  "organisation": {
    "name": "Example Primary School",
    "role": "Senior Leader"
  },
  "activity": {
    "last_login": "2025-11-25T14:22:00Z",
    "total_logins": 156,
    "features_used": ["dashboard", "ofsted", "reports"]
  },
  "content": {
    "assessments_created": 24,
    "actions_created": 18,
    "observations_recorded": 12
  },
  "settings": {
    "notifications_enabled": true,
    "email_updates": false
  }
}
```

---

## 6. Annual Review

This procedures manual shall be reviewed annually, or when:
- Legislation changes
- New processing activities introduced
- Following a data breach
- Significant system changes

**Last reviewed:** November 2025  
**Next review due:** November 2026

