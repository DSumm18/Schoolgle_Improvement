# Schoolgle Privacy Policy

**Last Updated:** November 2025  
**Version:** 1.0

---

## 1. Introduction

Schoolgle ("we", "us", "our") is committed to protecting the privacy and security of your personal data. This Privacy Policy explains how we collect, use, store, and protect information when you use our school improvement platform.

We are registered as a Data Processor under UK GDPR. Schools using Schoolgle remain the Data Controller for any personal data processed through our platform.

**Data Protection Officer Contact:**  
Email: dpo@schoolgle.co.uk  
Address: [Company Address]

---

## 2. Data We Collect

### 2.1 Account Data (Provided by Users)

| Data Type | Purpose | Legal Basis |
|-----------|---------|-------------|
| Email address | Account creation, login, notifications | Contract performance |
| Display name | User identification | Contract performance |
| Job title/role | Access control, permissions | Legitimate interest |
| School/Organization name | Multi-tenancy separation | Contract performance |

### 2.2 Usage Data (Automatically Collected)

| Data Type | Purpose | Legal Basis |
|-----------|---------|-------------|
| Login timestamps | Security, audit trail | Legitimate interest |
| Feature usage | Product improvement | Legitimate interest |
| IP address | Security, fraud prevention | Legitimate interest |

### 2.3 School Improvement Data (User-Created Content)

| Data Type | Purpose | Legal Basis |
|-----------|---------|-------------|
| Self-assessments | Framework tracking | Contract performance |
| Actions/tasks | School improvement planning | Contract performance |
| Evidence documents | Inspection preparation | Contract performance |
| Observation notes | Teaching quality monitoring | Contract performance |

### 2.4 Data We Do NOT Collect

- ❌ Pupil names or identifiable pupil data
- ❌ Parent contact information
- ❌ Medical or health records
- ❌ Financial information (beyond subscription)
- ❌ Biometric data
- ❌ Criminal records

**Important:** Schoolgle is designed for school IMPROVEMENT data, not pupil MIS data. Users should NOT upload documents containing identifiable pupil information.

---

## 3. How We Use Your Data

### 3.1 To Provide Our Service
- Authenticate users and manage access
- Store and display school improvement data
- Generate reports and documents
- Track framework compliance

### 3.2 To Improve Our Service
- Analyse feature usage (anonymised)
- Identify bugs and issues
- Develop new features

### 3.3 To Communicate With You
- Service announcements
- Security alerts
- Product updates (opt-out available)

### 3.4 AI Processing

When you use AI features (Voice-to-Observation, Mock Inspector, Ed Chatbot):
- Data is sent to OpenAI/OpenRouter for processing
- We use the **API mode** (not training mode) - your data is NOT used to train AI models
- Processing is real-time; data is not stored by AI providers beyond immediate processing
- All AI API calls are encrypted in transit

---

## 4. Data Storage & Security

### 4.1 Where We Store Data

| Data Type | Storage Location | Provider |
|-----------|-----------------|----------|
| Account data | Supabase (EU region) | Supabase Inc. |
| Authentication | Firebase Auth | Google Cloud (EU) |
| Files/documents | Supabase Storage | Supabase Inc. |
| AI processing | OpenAI API | OpenAI (US)* |

*Note: AI processing involves transient data transfer to US servers. Data is not stored beyond immediate processing. See Section 7 for international transfer safeguards.

### 4.2 Security Measures

**Technical:**
- All data encrypted at rest (AES-256)
- All data encrypted in transit (TLS 1.3)
- Row Level Security (RLS) on all database tables
- Organisation-level data isolation
- Regular security audits

**Organisational:**
- Staff background checks
- Data protection training
- Access logging and monitoring
- Incident response procedures

### 4.3 Access Controls

- Users only access their organisation's data
- Role-based permissions (Admin, SLT, Teacher, Viewer)
- Multi-factor authentication available
- Session timeout after inactivity

---

## 5. Data Retention

| Data Type | Retention Period | Deletion Method |
|-----------|-----------------|-----------------|
| Account data | Until account deletion + 30 days | Hard delete |
| Usage logs | 12 months | Automatic purge |
| School improvement data | Until deleted by school + 30 days | Hard delete |
| Backups | 90 days | Automatic expiry |
| AI processing data | Real-time only (not stored) | N/A |

Schools may request immediate deletion at any time (see Section 8).

---

## 6. Your Rights (UK GDPR)

You have the following rights regarding your personal data:

### 6.1 Right of Access (Article 15)
Request a copy of all personal data we hold about you.
**Response time:** Within 30 days
**How:** Email dpo@schoolgle.co.uk or use in-app "Export My Data" feature

### 6.2 Right to Rectification (Article 16)
Correct any inaccurate personal data.
**How:** Update in Settings or email dpo@schoolgle.co.uk

### 6.3 Right to Erasure (Article 17)
Request deletion of your personal data ("Right to be Forgotten").
**Response time:** Within 30 days
**How:** Use in-app "Delete My Account" or email dpo@schoolgle.co.uk

### 6.4 Right to Restrict Processing (Article 18)
Request that we stop processing your data while a complaint is resolved.

### 6.5 Right to Data Portability (Article 20)
Receive your data in a machine-readable format (JSON).
**How:** Use in-app "Export My Data" feature

### 6.6 Right to Object (Article 21)
Object to processing based on legitimate interests.

### 6.7 Rights Related to Automated Decision-Making (Article 22)
Schoolgle does not make automated decisions that significantly affect you.

---

## 7. International Data Transfers

When using AI features, data may be processed in the United States. We ensure adequate protection through:

- **Standard Contractual Clauses (SCCs)** with all US-based processors
- **Data Processing Agreements** with all sub-processors
- **Technical measures** - encryption, pseudonymisation where possible
- **Minimal data transfer** - only necessary data sent for processing

---

## 8. Data Subject Requests

### For Individual Users:
Email: dpo@schoolgle.co.uk  
In-app: Settings → Privacy → "My Data Rights"

### For Schools (Organisation-Level):
Organisation admins can:
- Export all organisation data
- Delete organisation and all associated data
- View audit logs of data access

---

## 9. Cookies

Schoolgle uses only essential cookies:

| Cookie | Purpose | Duration |
|--------|---------|----------|
| `session` | Authentication | Session |
| `csrf` | Security | Session |

We do NOT use tracking or advertising cookies.

---

## 10. Children's Privacy

Schoolgle is designed for use by school staff (adults). We do not knowingly collect data from children under 18. If pupil data is accidentally uploaded, schools must notify us immediately for deletion.

---

## 11. Changes to This Policy

We will notify users of material changes via:
- Email to account holders
- In-app notification
- Website announcement

---

## 12. Complaints

If you have concerns about our data handling:

1. **Contact us first:** dpo@schoolgle.co.uk
2. **Supervisory Authority:** Information Commissioner's Office (ICO)
   - Website: ico.org.uk
   - Phone: 0303 123 1113

---

## 13. Contact Us

**Schoolgle Ltd**  
Email: dpo@schoolgle.co.uk  
Website: schoolgle.co.uk  

