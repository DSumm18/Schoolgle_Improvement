# Schoolgle Security Overview

## For School IT Teams, DPOs, and Governors

---

## Executive Summary

Schoolgle is built with security and data protection at its core. This document provides an overview of our security measures for school decision-makers.

**Key Points:**
- ✅ UK GDPR compliant
- ✅ Data encrypted at rest and in transit
- ✅ Multi-tenant architecture with complete data isolation
- ✅ No pupil data required or stored
- ✅ Regular security testing
- ✅ Incident response procedures in place

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SCHOOLGLE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Browser    │───▶│   Vercel     │───▶│   Supabase   │       │
│  │   (School)   │    │   (EU/UK)    │    │   (EU)       │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│        │                   │                    │                │
│        │              TLS 1.3              TLS 1.3               │
│        │                   │                    │                │
│        │             ┌──────────────┐           │                │
│        └────────────▶│   Firebase   │           │                │
│                      │   Auth (EU)  │           │                │
│                      └──────────────┘           │                │
│                                                 │                │
│  AI Features (Optional):                        │                │
│  ┌──────────────┐                               │                │
│  │   OpenAI     │◀──────────────────────────────┘                │
│  │   API (US)   │  (Transient processing only)                   │
│  └──────────────┘                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Classification

| Classification | Examples | Protection Level |
|---------------|----------|------------------|
| **Public** | Marketing materials | None required |
| **Internal** | Framework templates | Access control |
| **Confidential** | Staff names, emails | Encrypted, access logged |
| **Restricted** | N/A (no pupil data) | N/A |

**Important:** Schoolgle is designed for school IMPROVEMENT data. We do not process:
- Pupil names or identifiers
- Parent contact information
- Medical or SEND records
- Safeguarding case details
- Financial records

---

## 3. Authentication & Access Control

### 3.1 User Authentication
- **Provider:** Firebase Authentication (Google Cloud)
- **Methods:** Google SSO, Microsoft SSO
- **MFA:** Available for all users
- **Session:** 24-hour timeout, refresh token rotation

### 3.2 Role-Based Access Control (RBAC)

| Role | Dashboard | Assessments | Actions | Reports | Settings | Users |
|------|-----------|-------------|---------|---------|----------|-------|
| Admin | ✅ | ✅ Edit | ✅ Edit | ✅ | ✅ | ✅ |
| SLT | ✅ | ✅ Edit | ✅ Edit | ✅ | View | ❌ |
| Teacher | ✅ | View | ✅ Edit | View | ❌ | ❌ |
| Governor | ✅ | View | View | ✅ | ❌ | ❌ |
| Viewer | ✅ | View | View | View | ❌ | ❌ |

### 3.3 Data Isolation
- Row Level Security (RLS) enforced at database level
- Users can ONLY access their organisation's data
- API requests validated against organisation membership
- No cross-organisation data access possible

---

## 4. Encryption

### 4.1 Data at Rest
- **Database:** AES-256 encryption (Supabase managed)
- **File storage:** AES-256 encryption
- **Backups:** Encrypted with separate keys

### 4.2 Data in Transit
- **All connections:** TLS 1.3 minimum
- **Certificate management:** Automated via Let's Encrypt
- **HSTS:** Enabled with 12-month max-age

### 4.3 Key Management
- Keys managed by cloud providers (AWS KMS, Google Cloud KMS)
- No keys stored in application code
- Regular key rotation

---

## 5. Infrastructure Security

### 5.1 Hosting
| Component | Provider | Certifications |
|-----------|----------|---------------|
| Application | Vercel | SOC 2 Type II |
| Database | Supabase | SOC 2 Type II, ISO 27001 |
| Authentication | Firebase | SOC 2 Type II, ISO 27001 |
| AI Processing | OpenAI | SOC 2 Type II |

### 5.2 Network Security
- DDoS protection (Cloudflare/Vercel)
- WAF (Web Application Firewall)
- Rate limiting on all API endpoints
- IP allowlisting available for enterprise

### 5.3 Monitoring
- Real-time security event monitoring
- Anomaly detection alerts
- 24/7 incident response capability

---

## 6. Data Handling

### 6.1 Data Location
| Data Type | Primary Location | Backup Location |
|-----------|-----------------|-----------------|
| User accounts | EU (Frankfurt) | EU (Ireland) |
| School data | EU (Frankfurt) | EU (Ireland) |
| Authentication | EU (Belgium) | EU (Netherlands) |
| AI processing | US (transient) | Not stored |

### 6.2 Data Retention
| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| Active accounts | While subscribed | Hard delete on request |
| Closed accounts | 30 days | Automatic purge |
| Activity logs | 12 months | Automatic purge |
| Backups | 90 days | Automatic expiry |

### 6.3 Data Minimisation
- Only necessary data collected
- No tracking cookies
- No analytics on personal data
- AI processing uses minimal context

---

## 7. AI Security

### 7.1 How AI is Used
- Voice transcription (Whisper)
- Observation processing (GPT-4)
- Mock inspector conversations (GPT-4)
- Ed chatbot (GPT-4)

### 7.2 AI Data Handling
- **API mode only** - data NOT used for training
- **No storage** - data processed in real-time
- **Minimal context** - only necessary data sent
- **Encryption** - all API calls over TLS 1.3

### 7.3 AI Provider Agreements
- Data Processing Agreements in place
- Standard Contractual Clauses for US transfers
- Opt-out from training confirmed

---

## 8. Incident Response

### 8.1 Response Timeline
| Severity | Detection | Response | Resolution |
|----------|-----------|----------|------------|
| Critical | Immediate | 15 mins | 4 hours |
| High | 15 mins | 1 hour | 24 hours |
| Medium | 1 hour | 4 hours | 72 hours |
| Low | 24 hours | 48 hours | 1 week |

### 8.2 Breach Notification
- Schools notified within 24 hours
- ICO notification support provided
- Post-incident report within 14 days

---

## 9. Compliance

### 9.1 Certifications & Standards
- ✅ UK GDPR compliant
- ✅ Data Protection Act 2018 compliant
- ✅ Cyber Essentials (in progress)
- ✅ ISO 27001 alignment (roadmap)

### 9.2 Regular Activities
- Annual penetration testing
- Quarterly vulnerability scanning
- Monthly access reviews
- Ongoing security training

---

## 10. School Responsibilities

While Schoolgle provides robust security, schools should:

1. **Use strong passwords** - Encourage SSO where possible
2. **Review user access** - Regularly audit who has access
3. **Don't upload pupil data** - Schoolgle is for school improvement data only
4. **Report concerns** - Contact us immediately if you suspect issues
5. **Keep contact details current** - For security notifications

---

## 11. Contact

**Security Team:** security@schoolgle.co.uk  
**Data Protection:** dpo@schoolgle.co.uk  
**Emergency (breaches):** [Phone number]

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 2025 | Security Team | Initial release |

