# Data Processing Agreement (DPA)

**Between:**  
**Data Controller:** [School Name] ("the School")  
**Data Processor:** Schoolgle Ltd ("Schoolgle")

**Effective Date:** [Date]  
**Agreement Reference:** DPA-[School URN]-[Date]

---

## 1. Background

1.1 The School has engaged Schoolgle to provide school improvement and inspection preparation software services (the "Services").

1.2 In providing the Services, Schoolgle will process personal data on behalf of the School.

1.3 This Data Processing Agreement ("DPA") sets out the terms on which Schoolgle will process personal data on behalf of the School, in compliance with UK GDPR and the Data Protection Act 2018.

---

## 2. Definitions

**"Personal Data"** means any information relating to an identified or identifiable natural person.

**"Processing"** means any operation performed on personal data, including collection, storage, retrieval, use, disclosure, and deletion.

**"Data Subject"** means an identified or identifiable natural person whose personal data is processed.

**"Sub-processor"** means any third party engaged by Schoolgle to process personal data on behalf of the School.

**"Data Breach"** means a breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data.

---

## 3. Scope of Processing

### 3.1 Categories of Data Subjects
- School staff (teachers, support staff, leaders)
- Governors

### 3.2 Types of Personal Data
- Names and email addresses
- Job titles and roles
- Professional observations and feedback
- Login and usage data

### 3.3 Purpose of Processing
- Providing school improvement tracking services
- Generating inspection preparation documents
- User authentication and access control
- Service improvement and support

### 3.4 Duration of Processing
Processing will continue for the duration of the Services agreement, plus 30 days for account closure procedures.

---

## 4. Schoolgle's Obligations

Schoolgle shall:

### 4.1 Lawful Processing
(a) Process personal data only on documented instructions from the School, unless required by law.

(b) Not process personal data for any purpose other than providing the Services.

(c) Inform the School if an instruction infringes data protection law.

### 4.2 Confidentiality
(a) Ensure all personnel processing personal data are bound by confidentiality obligations.

(b) Limit access to personal data to personnel who need it to perform the Services.

### 4.3 Security Measures
(a) Implement appropriate technical and organisational measures, including:
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Row Level Security database isolation
- Access logging and monitoring
- Regular security testing
- Incident response procedures

(b) Regularly assess and improve security measures.

### 4.4 Sub-processors
(a) Not engage a sub-processor without prior written authorisation from the School.

(b) The School hereby authorises the following sub-processors:
| Sub-processor | Purpose | Location |
|--------------|---------|----------|
| Supabase Inc. | Database hosting | EU (Frankfurt) |
| Google Firebase | Authentication | EU |
| OpenAI | AI text processing | US (with SCCs) |
| OpenRouter | AI routing | US (with SCCs) |
| Vercel | Application hosting | EU/US (with SCCs) |

(c) Ensure all sub-processors are bound by equivalent data protection obligations.

(d) Notify the School of any intended changes to sub-processors, giving 30 days to object.

(e) Remain fully liable for sub-processor compliance.

### 4.5 Data Subject Rights
(a) Assist the School in responding to data subject requests within required timeframes.

(b) Provide tools for data export and deletion.

(c) Notify the School promptly of any data subject request received directly.

### 4.6 Data Breach Notification
(a) Notify the School of any data breach without undue delay, and no later than 24 hours after becoming aware.

(b) Provide the School with:
- Description of the breach
- Categories and approximate numbers of data subjects affected
- Categories and approximate numbers of records affected
- Likely consequences
- Measures taken to address the breach

(c) Assist the School in notifying the ICO and data subjects if required.

### 4.7 Data Protection Impact Assessments
Assist the School with DPIAs where processing is likely to result in high risk to data subjects.

### 4.8 Audit Rights
(a) Make available all information necessary to demonstrate compliance.

(b) Allow and contribute to audits and inspections by the School or an authorised auditor, with reasonable notice.

### 4.9 Deletion and Return
Upon termination of Services:
(a) Delete or return all personal data at the School's choice.

(b) Delete existing copies unless required by law to retain.

(c) Provide certification of deletion upon request.

---

## 5. School's Obligations

The School shall:

(a) Ensure it has lawful grounds to share personal data with Schoolgle.

(b) Provide clear instructions for processing.

(c) Ensure data subjects have been informed about the processing.

(d) Not upload identifiable pupil data to Schoolgle.

(e) Notify Schoolgle of any changes to data protection requirements.

---

## 6. International Transfers

6.1 Personal data may be transferred to the United States for AI processing purposes only.

6.2 Such transfers are protected by:
- Standard Contractual Clauses (SCCs) with US processors
- Technical measures (encryption, pseudonymisation)
- Minimal data transfer (only necessary data)

6.3 The School consents to such transfers for the purposes of providing AI features.

---

## 7. Liability and Indemnity

7.1 Each party shall be liable for its own breaches of this DPA and applicable data protection law.

7.2 Schoolgle shall indemnify the School against losses arising from Schoolgle's breach of this DPA, subject to the limitations in the main Services agreement.

---

## 8. Term and Termination

8.1 This DPA shall remain in effect for the duration of the Services agreement.

8.2 Obligations relating to confidentiality and data deletion shall survive termination.

---

## 9. Amendments

9.1 This DPA may be amended by mutual written agreement.

9.2 Schoolgle may update this DPA to reflect changes in law, provided such updates do not materially reduce the School's protections.

---

## 10. Governing Law

This DPA shall be governed by the laws of England and Wales.

---

## Signatures

**For and on behalf of the School:**

Name: _________________________

Title: _________________________

Signature: _________________________

Date: _________________________

**For and on behalf of Schoolgle Ltd:**

Name: _________________________

Title: _________________________

Signature: _________________________

Date: _________________________

---

## Annex A: Technical and Organisational Measures

### A.1 Access Control
- Role-based access control (Admin, SLT, Teacher, Viewer)
- Multi-factor authentication available
- Session timeout after 30 minutes inactivity
- Unique user accounts (no shared logins)

### A.2 Encryption
- Data at rest: AES-256 encryption
- Data in transit: TLS 1.3
- Database connections: SSL required

### A.3 Data Isolation
- Row Level Security (RLS) on all tables
- Organisation-level data separation
- API authentication required for all requests

### A.4 Monitoring and Logging
- All data access logged
- Security event monitoring
- Anomaly detection alerts

### A.5 Backup and Recovery
- Daily automated backups
- Point-in-time recovery available
- Backup encryption
- 90-day backup retention

### A.6 Incident Response
- 24/7 security monitoring
- Incident response team
- Breach notification within 24 hours
- Post-incident review process

### A.7 Staff Security
- Background checks for all staff
- Annual data protection training
- Confidentiality agreements
- Access revocation on termination

### A.8 Physical Security
- Cloud-hosted infrastructure (no on-premise servers)
- Data centre certifications: ISO 27001, SOC 2
- Geographic redundancy (EU region)

