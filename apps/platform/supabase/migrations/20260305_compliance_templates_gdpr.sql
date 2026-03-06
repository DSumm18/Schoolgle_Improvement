-- ============================================================
-- COMPLIANCE MODULE: EXPERT-LEVEL GDPR/DATA PROTECTION TEMPLATES
-- 10 comprehensive templates for UK school GDPR compliance
-- Legislation: UK GDPR, DPA 2018, PECR 2003, FOIA 2000,
--   Protection of Freedoms Act 2012, Surveillance Camera Code 2022
-- All content designed to pass ICO scrutiny
-- ============================================================

INSERT INTO compliance_templates (id, template_type, name, description, school_phase, jurisdiction, maintained_by, version, is_statutory, dfe_reference, source_reference, json_schema, content_html) VALUES

-- ============================================================
-- 1. PRIVACY NOTICE – PUPILS (Article 13/14 Compliant)
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'Privacy Notice – Pupils (Comprehensive)',
  'ICO-compliant privacy notice for pupils and parents/carers covering all Article 13/14 required information, specific data categories, recipients, IRMS retention periods, and Children''s Code considerations.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Data Protection Toolkit for Schools',
  'UK GDPR Articles 13-14 / ICO Privacy Notices Code of Practice 2025',
  '{"required_fields": ["school_name", "school_address", "dpo_name", "dpo_email", "dpo_phone", "headteacher_name", "review_date", "ico_registration_number"], "optional_fields": ["trust_name", "trust_dpo_name", "la_name", "school_website", "mis_provider", "cloud_provider"]}',
  '<h1>Privacy Notice: How We Use Pupil Information</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Data Controller</strong></td><td style="padding:8px;border:1px solid #ccc;">The Governing Body of {{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dpo_name}}, {{dpo_email}}, {{dpo_phone}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>ICO Registration</strong></td><td style="padding:8px;border:1px solid #ccc;">{{ico_registration_number}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Introduction</h2>
<p>{{school_name}} (''the School'') is the data controller for the personal information we process about pupils, unless otherwise stated. This privacy notice explains how we collect, store and use personal data about pupils in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018 (DPA 2018).</p>
<p>We are committed to being transparent about how we handle personal information, to protecting the privacy and security of that information, and to meeting our data protection obligations under UK law. Where pupils are too young to understand data protection issues, we address this notice to parents and carers.</p>

<h2>2. The Categories of Pupil Information We Collect and Process</h2>
<p>We collect and process the following categories of personal data:</p>

<h3>2.1 Personal Identifiers</h3>
<ul>
<li>Full name, preferred name, former names</li>
<li>Date of birth, age, gender</li>
<li>Unique Pupil Number (UPN) and former UPN</li>
<li>Home address and address history</li>
<li>Pupil photographs (for school records, ID badges)</li>
</ul>

<h3>2.2 Family and Contact Information</h3>
<ul>
<li>Parent/carer names, addresses, telephone numbers, email addresses</li>
<li>Emergency contact details</li>
<li>Parental responsibility and custody arrangements (where relevant to safeguarding)</li>
<li>Sibling information (for admissions and family liaison)</li>
</ul>

<h3>2.3 Characteristics Data</h3>
<ul>
<li>Ethnicity and national identity</li>
<li>Language(s) spoken at home and first language</li>
<li>Country of birth and nationality</li>
<li>Free school meal (FSM) eligibility and Pupil Premium status</li>
<li>Service child indicator</li>
<li>Looked after child / previously looked after child status</li>
<li>Young carer status</li>
</ul>

<h3>2.4 Attendance and Exclusion Data</h3>
<ul>
<li>Sessions attended and missed, with absence codes and reasons</li>
<li>Exclusion records (fixed-term and permanent) with reasons</li>
<li>Minutes late and patterns of lateness</li>
<li>Part-time timetable or alternative provision records</li>
</ul>

<h3>2.5 Educational and Assessment Data</h3>
<ul>
<li>Prior attainment and baseline assessment results</li>
<li>Current attainment and progress data (teacher assessments, standardised tests)</li>
<li>Statutory assessment results (EYFS Profile, Phonics, KS1, KS2, GCSEs, A-levels)</li>
<li>Internal reports and predicted grades</li>
<li>Learning plans, targets and interventions</li>
</ul>

<h3>2.6 Special Category Data (Article 9 UK GDPR)</h3>
<p>We process the following special category data where there is a substantial public interest or explicit consent:</p>
<ul>
<li><strong>Health and medical information:</strong> allergies, medical conditions, medication administered, care plans, mental health referrals, school nurse records</li>
<li><strong>Special educational needs and disabilities (SEND):</strong> SEN Support status, Education Health and Care Plan (EHCP) details, specialist assessments, provision maps</li>
<li><strong>Religious belief:</strong> for RE withdrawal requests, collective worship, admissions criteria at faith schools, dietary requirements</li>
<li><strong>Racial or ethnic origin:</strong> for statutory census returns and monitoring equality duties under the Equality Act 2010</li>
<li><strong>Biometric data:</strong> fingerprint or palm scans for cashless catering or library systems (only with explicit parental consent under the Protection of Freedoms Act 2012, s.26)</li>
</ul>

<h3>2.7 Safeguarding and Behavioural Data</h3>
<ul>
<li>Safeguarding concerns, referrals and case records</li>
<li>Child protection conference notes and plans</li>
<li>Behavioural records, sanctions and rewards</li>
<li>Bullying and racism incident records</li>
<li>Early Help assessments</li>
</ul>

<h3>2.8 Other Data</h3>
<ul>
<li>School transport arrangements</li>
<li>Catering choices and dietary requirements</li>
<li>Extracurricular activity registrations</li>
<li>School trip consent and medical forms</li>
<li>CCTV images and recordings (where operational)</li>
<li>Photographs and videos for school publications (consent-based)</li>
</ul>

<h2>3. Why We Collect and Use Pupil Information</h2>
<p>We use pupil data to:</p>
<ul>
<li>Support pupil learning and monitor academic progress</li>
<li>Provide appropriate pastoral care and safeguarding</li>
<li>Assess the quality of our educational provision</li>
<li>Administer admissions, transfers and transitions</li>
<li>Meet statutory obligations for data returns (school census, early years census)</li>
<li>Calculate and manage school funding (including Pupil Premium, SEN funding)</li>
<li>Administer statutory assessments and public examinations</li>
<li>Manage attendance, exclusions and behaviour</li>
<li>Manage and administer SEND provision and EHCPs</li>
<li>Manage school meal services and free school meal entitlement</li>
<li>Ensure the health, safety and welfare of pupils</li>
<li>Comply with legal obligations to local authorities, the DfE and other bodies</li>
<li>Support the transition of pupils between schools</li>
</ul>

<h2>4. Lawful Basis for Processing</h2>
<p>We only collect and use personal information where we have a lawful reason to do so. Our lawful bases for processing pupil data are:</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;text-align:left;">Lawful Basis</th>
<th style="padding:8px;border:1px solid #ccc;text-align:left;">UK GDPR Article</th>
<th style="padding:8px;border:1px solid #ccc;text-align:left;">Example Processing Activities</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Legal obligation</strong></td><td style="padding:8px;border:1px solid #ccc;">Article 6(1)(c)</td><td style="padding:8px;border:1px solid #ccc;">School census returns, attendance records, safeguarding referrals, admissions data, exclusion reporting</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Public task</strong></td><td style="padding:8px;border:1px solid #ccc;">Article 6(1)(e)</td><td style="padding:8px;border:1px solid #ccc;">Education provision, assessment, behaviour management, SEND support, careers guidance</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Vital interests</strong></td><td style="padding:8px;border:1px solid #ccc;">Article 6(1)(d)</td><td style="padding:8px;border:1px solid #ccc;">Medical emergencies, safeguarding referrals where immediate risk to life</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Consent</strong></td><td style="padding:8px;border:1px solid #ccc;">Article 6(1)(a)</td><td style="padding:8px;border:1px solid #ccc;">School photographs for marketing, biometric data collection, optional surveys, school trip photographs on social media</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Legitimate interests</strong></td><td style="padding:8px;border:1px solid #ccc;">Article 6(1)(f)</td><td style="padding:8px;border:1px solid #ccc;">CCTV for security (maintained schools only where applicable), alumni relations</td></tr>
</tbody>
</table>

<p><strong>Special category data</strong> is processed under Article 9(2)(g) – substantial public interest, with conditions set out in Schedule 1 of the DPA 2018, including:</p>
<ul>
<li>Paragraph 6: Statutory and government purposes</li>
<li>Paragraph 12: Regulatory requirements relating to unlawful acts and dishonesty</li>
<li>Paragraph 18: Safeguarding of children and individuals at risk</li>
</ul>
<p>Where we rely on consent, you may withdraw consent at any time by contacting {{dpo_name}} at {{dpo_email}}. Withdrawal does not affect the lawfulness of processing carried out before withdrawal.</p>

<h2>5. Collecting Pupil Information</h2>
<p>We obtain pupil information from:</p>
<ul>
<li>Parents/carers completing admission forms and data collection sheets</li>
<li>Previous schools via the Common Transfer File (CTF) or secure file transfer</li>
<li>The Learning Records Service (LRS) for UPN allocation</li>
<li>The local authority (for in-year admissions, SEND, and looked after children)</li>
<li>Health professionals (school nurse, CAMHS, NHS immunisation teams)</li>
<li>Other professionals (social workers, educational psychologists, SEND caseworkers)</li>
<li>Pupils themselves (e.g., classwork, self-assessment, older pupils'' contact details)</li>
<li>Examination boards (results data)</li>
</ul>
<p>We will inform you at the point of collection if data provision is a statutory or contractual requirement and the consequences of not providing it. In most cases, failure to provide information will prevent us from admitting your child or providing full educational support.</p>

<h2>6. Who We Share Pupil Information With</h2>
<p>We routinely share pupil information with the following recipients. All data sharing is subject to data processing agreements or statutory requirements:</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Recipient</th>
<th style="padding:8px;border:1px solid #ccc;">Purpose</th>
<th style="padding:8px;border:1px solid #ccc;">Legal Basis</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Department for Education (DfE)</td><td style="padding:8px;border:1px solid #ccc;">School census, national pupil database, funding</td><td style="padding:8px;border:1px solid #ccc;">Education Act 1996 s.537A</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Local authority ({{la_name}})</td><td style="padding:8px;border:1px solid #ccc;">Statutory duties: admissions, SEND, attendance, safeguarding, fair access, CME tracking</td><td style="padding:8px;border:1px solid #ccc;">Education Act 1996 / Children Act 2004</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">NHS / School nursing</td><td style="padding:8px;border:1px solid #ccc;">Immunisation programmes, health screening (vision, hearing), school nurse referrals</td><td style="padding:8px;border:1px solid #ccc;">NHS Act 2006 / Public task</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Ofsted</td><td style="padding:8px;border:1px solid #ccc;">Inspection evidence, pupil data review</td><td style="padding:8px;border:1px solid #ccc;">Education Act 2005</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Receiving schools</td><td style="padding:8px;border:1px solid #ccc;">Common Transfer File on pupil transfer</td><td style="padding:8px;border:1px solid #ccc;">Education (Pupil Information) Regulations 2005</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Examination boards (AQA, Edexcel, OCR, etc.)</td><td style="padding:8px;border:1px solid #ccc;">Exam entries, coursework moderation, results</td><td style="padding:8px;border:1px solid #ccc;">Contract / Public task</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Careers service / National Apprenticeship Service</td><td style="padding:8px;border:1px solid #ccc;">Section 507B Education Act 1997 (Y9-11 pupils)</td><td style="padding:8px;border:1px solid #ccc;">Legal obligation</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Police / social services</td><td style="padding:8px;border:1px solid #ccc;">Safeguarding and crime prevention</td><td style="padding:8px;border:1px solid #ccc;">Children Act 1989/2004 / Crime and Disorder Act 1998</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">School cloud platform providers</td><td style="padding:8px;border:1px solid #ccc;">Data processing for MIS, learning platforms, communication apps (acting as data processors under DPA)</td><td style="padding:8px;border:1px solid #ccc;">Data processing agreements in place</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Catering provider</td><td style="padding:8px;border:1px solid #ccc;">FSM eligibility, allergen/dietary information</td><td style="padding:8px;border:1px solid #ccc;">Legal obligation / Contract</td></tr>
</tbody>
</table>

<h3>6.1 National Pupil Database</h3>
<p>We are required by law to provide information about our pupils to the DfE via the school census. This data is stored in the National Pupil Database (NPD). The DfE may share NPD data with third parties for research or statistical purposes (under strict controls). For more information, see: <em>https://www.gov.uk/government/publications/national-pupil-database-user-guide-and-supporting-information</em></p>

<h2>7. How Long We Keep Pupil Data</h2>
<p>We follow the Information and Records Management Society (IRMS) Schools Toolkit for retention periods:</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Record Type</th>
<th style="padding:8px;border:1px solid #ccc;">Retention Period</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Pupil educational record (primary)</td><td style="padding:8px;border:1px solid #ccc;">Date of birth + 25 years</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Pupil educational record (secondary)</td><td style="padding:8px;border:1px solid #ccc;">Date of leaving + 7 years</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Safeguarding / child protection file</td><td style="padding:8px;border:1px solid #ccc;">Date of birth + 25 years (minimum; review for longer retention)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Attendance registers</td><td style="padding:8px;border:1px solid #ccc;">Date of register + 3 years</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Public examination results</td><td style="padding:8px;border:1px solid #ccc;">Permanent (part of pupil record)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Internal assessment data</td><td style="padding:8px;border:1px solid #ccc;">Current year + 6 years</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">SEN / EHCP records</td><td style="padding:8px;border:1px solid #ccc;">Date of birth + 25 years (or 35 years for serious cases)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Accident/injury records (pupils)</td><td style="padding:8px;border:1px solid #ccc;">Date of birth + 25 years</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Consent forms (trips/photos)</td><td style="padding:8px;border:1px solid #ccc;">Duration of consent purpose + 1 year</td></tr>
</tbody>
</table>
<p>At the end of the retention period, records are securely destroyed (paper: cross-cut shredding; digital: permanent deletion with audit trail).</p>

<h2>8. Data Security</h2>
<p>We protect personal data through:</p>
<ul>
<li>Role-based access controls on our Management Information System (MIS) and electronic records</li>
<li>Encryption of data at rest and in transit</li>
<li>Secure password policies and multi-factor authentication for staff accounts</li>
<li>Locked storage for paper records containing personal data</li>
<li>Regular data protection training for all staff (at least annually)</li>
<li>Visitor sign-in and restricted access to school premises</li>
<li>Data processing agreements with all third-party providers</li>
<li>Regular review and audit of data access permissions</li>
</ul>

<h2>9. Your Rights</h2>
<p>Under UK GDPR, pupils (and parents acting on behalf of children under 13, or where the child lacks capacity) have the following rights:</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Right</th>
<th style="padding:8px;border:1px solid #ccc;">Description</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Access (Article 15)</strong></td><td style="padding:8px;border:1px solid #ccc;">Request a copy of the personal data we hold about your child. We will respond within one calendar month.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Rectification (Article 16)</strong></td><td style="padding:8px;border:1px solid #ccc;">Request correction of inaccurate or incomplete data.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Erasure (Article 17)</strong></td><td style="padding:8px;border:1px solid #ccc;">Request deletion of data where there is no compelling reason for continued processing. Note: this right is limited where we have a legal obligation to retain data.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Restriction (Article 18)</strong></td><td style="padding:8px;border:1px solid #ccc;">Request restriction of processing while we verify accuracy or consider an objection.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Objection (Article 21)</strong></td><td style="padding:8px;border:1px solid #ccc;">Object to processing based on public task or legitimate interests. We must stop unless we demonstrate compelling legitimate grounds.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data portability (Article 20)</strong></td><td style="padding:8px;border:1px solid #ccc;">Request transfer of data provided by you in a machine-readable format (where processing is based on consent or contract and is automated).</td></tr>
</tbody>
</table>
<p><strong>Pupil educational records:</strong> Parents of pupils at maintained schools also have a right of access to their child''s educational record under the Education (Pupil Information) (England) Regulations 2005. We must respond within 15 school days. This is a separate right from the UK GDPR subject access right.</p>

<h2>10. Children''s Code (Age Appropriate Design Code)</h2>
<p>Where our digital services are likely to be accessed by children, we have regard to the ICO''s Age Appropriate Design Code. We ensure:</p>
<ul>
<li>Privacy settings are set to high by default for any pupil-facing platforms</li>
<li>Data collection is minimised to what is necessary</li>
<li>Geolocation is switched off by default</li>
<li>Profiling is not used in ways that are detrimental to children</li>
<li>Age-appropriate privacy information is provided to pupils</li>
</ul>

<h2>11. International Transfers</h2>
<p>Some of our cloud-based systems may process data outside the UK. Where this occurs, we ensure an adequate level of protection through UK adequacy decisions, Standard Contractual Clauses (UK International Data Transfer Agreement), or other approved safeguards under UK GDPR Chapter V.</p>

<h2>12. Automated Decision-Making</h2>
<p>We do not make any decisions about your child based solely on automated processing (including profiling) that have a legal or similarly significant effect. Any use of AI-assisted tools for educational purposes is supervised by qualified staff and does not replace professional judgement.</p>

<h2>13. How to Contact Us / Complain</h2>
<p>If you have concerns about how we handle your child''s data:</p>
<ol>
<li><strong>Contact our DPO:</strong> {{dpo_name}}, {{dpo_email}}, {{dpo_phone}}</li>
<li><strong>Contact the ICO:</strong> Information Commissioner''s Office, Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF. Tel: 0303 123 1113. Website: <em>ico.org.uk</em></li>
</ol>
<p>We would appreciate the opportunity to address your concerns before you contact the ICO.</p>

<h2>14. Changes to This Notice</h2>
<p>We may update this notice from time to time. The latest version will always be available from the school office and on our website. We will notify parents of any significant changes.</p>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Last reviewed: {{review_date}} | Next review due: one year from review date</p>'
),

-- ============================================================
-- 2. PRIVACY NOTICE – STAFF/WORKFORCE
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'Privacy Notice – Staff/Workforce (Comprehensive)',
  'ICO-compliant privacy notice for all staff, volunteers and contractors covering employment-specific lawful bases, data categories, recipients, and IRMS retention periods.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Data Protection Toolkit for Schools',
  'UK GDPR Articles 13-14 / ICO Employment Practices Code',
  '{"required_fields": ["school_name", "school_address", "dpo_name", "dpo_email", "dpo_phone", "headteacher_name", "review_date", "ico_registration_number"], "optional_fields": ["trust_name", "trust_dpo_name", "hr_contact", "payroll_provider", "pension_provider", "oh_provider"]}',
  '<h1>Privacy Notice: How We Use Staff/Workforce Information</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Data Controller</strong></td><td style="padding:8px;border:1px solid #ccc;">The Governing Body of {{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dpo_name}}, {{dpo_email}}, {{dpo_phone}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>ICO Registration</strong></td><td style="padding:8px;border:1px solid #ccc;">{{ico_registration_number}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Introduction</h2>
<p>This privacy notice explains how {{school_name}} collects, stores, uses and shares personal data relating to its workforce – including employees, agency staff, volunteers, governors acting in an employed capacity, and contractors working on site. It applies from recruitment through to post-employment record retention.</p>
<p>This notice should be read alongside your contract of employment and the school''s Data Protection Policy.</p>

<h2>2. Categories of Staff Information We Collect</h2>

<h3>2.1 Recruitment Data</h3>
<ul>
<li>Application form (name, address, employment history, qualifications, references, personal statement)</li>
<li>Interview notes, scoring matrices, selection panel records</li>
<li>Pre-employment checks: identity documents, proof of right to work (copy of passport/visa)</li>
<li>Disclosure and Barring Service (DBS) certificate number, date and level (Enhanced/Enhanced with barred list check)</li>
<li>Prohibition checks (Teaching Regulation Agency), s.128 directions, EEA sanctions</li>
<li>Medical fitness declarations (Education (Health Standards) (England) Regulations 2003)</li>
<li>References received (two minimum, including most recent employer)</li>
</ul>

<h3>2.2 Employment Data</h3>
<ul>
<li>Full name, title, date of birth, gender, home address, personal email, phone number</li>
<li>National Insurance number</li>
<li>Teacher Reference Number (TRN) and QTS/QTLS status</li>
<li>Emergency contact and next-of-kin details</li>
<li>Photographs (for ID badges, staff intranet)</li>
<li>Contract type, hours, pay scale point, salary, allowances</li>
<li>Bank account details (for payroll)</li>
<li>Tax code, student loan deductions, pension scheme membership and contribution rates</li>
<li>Trade union membership (where deducted from payroll or disclosed for facility time)</li>
</ul>

<h3>2.3 Professional Development and Performance</h3>
<ul>
<li>Appraisal/performance review records, objectives, lesson observation outcomes</li>
<li>Continuing Professional Development (CPD) records and certificates</li>
<li>Induction records (ECF/ECT statutory induction)</li>
<li>Capability procedure records</li>
</ul>

<h3>2.4 Absence and Health Data</h3>
<ul>
<li>Sickness absence records (dates, fit notes, reasons, return-to-work forms)</li>
<li>Occupational health referrals and reports</li>
<li>Workplace adjustments and Access to Work records</li>
<li>Maternity/paternity/adoption/shared parental leave records</li>
<li>Phased return arrangements</li>
</ul>

<h3>2.5 Conduct and Disciplinary Data</h3>
<ul>
<li>Disciplinary investigation records, hearing outcomes, warnings</li>
<li>Grievance records</li>
<li>Allegations management records (where applicable)</li>
<li>Compromise/settlement agreements (where applicable)</li>
</ul>

<h3>2.6 Special Category Data (Article 9)</h3>
<ul>
<li><strong>Health data:</strong> sickness absence reasons, occupational health reports, disability status (Equality Act 2010)</li>
<li><strong>Trade union membership:</strong> for payroll deduction or facility time</li>
<li><strong>Religious belief:</strong> for time off for religious observance requests</li>
<li><strong>Racial/ethnic origin:</strong> for workforce monitoring under the Equality Act 2010 public sector equality duty</li>
</ul>

<h2>3. Why We Collect and Use Staff Information</h2>
<ul>
<li>Recruitment, appointment and onboarding</li>
<li>Payroll administration and pension contributions</li>
<li>DBS and safeguarding checks for the Single Central Record</li>
<li>Managing performance, appraisal and professional development</li>
<li>Managing sickness absence and occupational health</li>
<li>Disciplinary and grievance procedures</li>
<li>DfE School Workforce Census returns</li>
<li>HMRC tax and National Insurance reporting</li>
<li>Teachers'' Pension Scheme (TPS) or Local Government Pension Scheme (LGPS) administration</li>
<li>Health and safety duties (risk assessments, accident reporting, DSE assessments)</li>
<li>Compliance with employment law (Working Time Regulations, National Minimum Wage Act, Equality Act)</li>
<li>Providing employment references (during and after employment)</li>
<li>Insurance claims and legal proceedings</li>
</ul>

<h2>4. Lawful Basis for Processing</h2>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Lawful Basis</th>
<th style="padding:8px;border:1px solid #ccc;">UK GDPR Article</th>
<th style="padding:8px;border:1px solid #ccc;">Processing Activities</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Performance of contract</strong></td><td style="padding:8px;border:1px solid #ccc;">Article 6(1)(b)</td><td style="padding:8px;border:1px solid #ccc;">Payroll, pension, managing your employment, providing contractual benefits</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Legal obligation</strong></td><td style="padding:8px;border:1px solid #ccc;">Article 6(1)(c)</td><td style="padding:8px;border:1px solid #ccc;">HMRC reporting, DBS checks, right to work checks, School Workforce Census, TRA checks, health and safety duties, RIDDOR</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Public task</strong></td><td style="padding:8px;border:1px solid #ccc;">Article 6(1)(e)</td><td style="padding:8px;border:1px solid #ccc;">Teaching and education functions, safeguarding, Ofsted inspection support</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Legitimate interests</strong></td><td style="padding:8px;border:1px solid #ccc;">Article 6(1)(f)</td><td style="padding:8px;border:1px solid #ccc;">Staff directory/contact lists, internal communications, CCTV (security), alumni/leaver references</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Consent</strong></td><td style="padding:8px;border:1px solid #ccc;">Article 6(1)(a)</td><td style="padding:8px;border:1px solid #ccc;">Staff photographs on website (optional), staff wellbeing surveys, trade union deductions</td></tr>
</tbody>
</table>

<p><strong>Special category data</strong> is processed under:</p>
<ul>
<li>Article 9(2)(b): Employment, social security and social protection obligations (with DPA 2018 Schedule 1, Part 1, Paragraph 1)</li>
<li>Article 9(2)(g): Substantial public interest – equality of opportunity monitoring (DPA 2018 Schedule 1, Part 2, Paragraph 8)</li>
<li>Article 9(2)(h): Occupational medicine assessment of working capacity (with DPA 2018 Schedule 1, Part 1, Paragraph 2)</li>
</ul>

<h2>5. Who We Share Staff Information With</h2>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Recipient</th>
<th style="padding:8px;border:1px solid #ccc;">Purpose</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">HMRC</td><td style="padding:8px;border:1px solid #ccc;">RTI (Real Time Information) for tax and NI, P45/P60, student loan repayments</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Teachers'' Pension Scheme (TPS) / LGPS</td><td style="padding:8px;border:1px solid #ccc;">Pension contributions, service records, ill-health retirement</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">DfE</td><td style="padding:8px;border:1px solid #ccc;">School Workforce Census (annual statutory return)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Disclosure and Barring Service (DBS)</td><td style="padding:8px;border:1px solid #ccc;">Disclosure applications, Update Service checks</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Teaching Regulation Agency (TRA)</td><td style="padding:8px;border:1px solid #ccc;">Prohibition/restriction checks, serious misconduct referrals</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Payroll provider ({{payroll_provider}})</td><td style="padding:8px;border:1px solid #ccc;">Salary calculation and payment processing</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Occupational health provider ({{oh_provider}})</td><td style="padding:8px;border:1px solid #ccc;">Fitness to work assessments, ill-health referrals</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Ofsted</td><td style="padding:8px;border:1px solid #ccc;">SCR review during inspection, staff interview data</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Local authority</td><td style="padding:8px;border:1px solid #ccc;">LADO referrals, allegations management</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Professional bodies (e.g., NAHT, NEU, NASUWT)</td><td style="padding:8px;border:1px solid #ccc;">Only where you have authorised payroll deduction</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Prospective employers</td><td style="padding:8px;border:1px solid #ccc;">Employment references (factual, with your implicit agreement)</td></tr>
</tbody>
</table>

<h2>6. Data Retention</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Record Type</th>
<th style="padding:8px;border:1px solid #ccc;">Retention Period</th>
<th style="padding:8px;border:1px solid #ccc;">Authority</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Personnel file</td><td style="padding:8px;border:1px solid #ccc;">Termination of employment + 6 years</td><td style="padding:8px;border:1px solid #ccc;">Limitation Act 1980</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Recruitment records (unsuccessful)</td><td style="padding:8px;border:1px solid #ccc;">Date of appointment decision + 6 months</td><td style="padding:8px;border:1px solid #ccc;">IRMS / ICO guidance</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">DBS certificates</td><td style="padding:8px;border:1px solid #ccc;">6 months from receipt (record DBS number and date on SCR only)</td><td style="padding:8px;border:1px solid #ccc;">DBS Code of Practice</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Payroll and tax records</td><td style="padding:8px;border:1px solid #ccc;">Current tax year + 6 years</td><td style="padding:8px;border:1px solid #ccc;">Taxes Management Act 1970</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Pension records</td><td style="padding:8px;border:1px solid #ccc;">Termination + 12 years (or until age 75 for pension queries)</td><td style="padding:8px;border:1px solid #ccc;">TPS/LGPS regulations</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Sickness absence records</td><td style="padding:8px;border:1px solid #ccc;">Termination + 6 years</td><td style="padding:8px;border:1px solid #ccc;">Limitation Act 1980</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Appraisal records</td><td style="padding:8px;border:1px solid #ccc;">Current year + 6 years</td><td style="padding:8px;border:1px solid #ccc;">IRMS</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Disciplinary/grievance records</td><td style="padding:8px;border:1px solid #ccc;">Per warning duration + 6 years (or termination + 6 years if resulted in dismissal)</td><td style="padding:8px;border:1px solid #ccc;">IRMS / Limitation Act 1980</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Accident/injury at work</td><td style="padding:8px;border:1px solid #ccc;">Date of incident + 6 years (or 12 years for industrial disease claims)</td><td style="padding:8px;border:1px solid #ccc;">Limitation Act 1980</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Maternity/paternity records</td><td style="padding:8px;border:1px solid #ccc;">End of tax year following return + 3 years</td><td style="padding:8px;border:1px solid #ccc;">Statutory Maternity Pay Regulations</td></tr>
</tbody>
</table>

<h2>7. Your Rights</h2>
<p>You have the following rights under UK GDPR:</p>
<ul>
<li><strong>Right of access (Article 15):</strong> Request a copy of your personal data. We will respond within one calendar month.</li>
<li><strong>Right to rectification (Article 16):</strong> Request correction of inaccurate data. Please keep your personal details up to date via the school office or HR.</li>
<li><strong>Right to erasure (Article 17):</strong> Request deletion where data is no longer necessary. This is limited where we have legal or contractual retention obligations.</li>
<li><strong>Right to restrict processing (Article 18):</strong> Request restriction while we address a concern.</li>
<li><strong>Right to object (Article 21):</strong> Object to processing based on legitimate interests or public task. We must demonstrate compelling grounds to continue.</li>
<li><strong>Right to data portability (Article 20):</strong> Where processing is based on consent or contract and is automated.</li>
<li><strong>Rights related to automated decision-making (Article 22):</strong> We do not make solely automated employment decisions.</li>
</ul>

<h2>8. Data Security</h2>
<p>Staff data is protected by role-based access controls (HR and senior leadership only), encrypted storage, secure payroll transmission, locked filing cabinets for paper records, and regular access reviews. All processors are bound by data processing agreements.</p>

<h2>9. Complaints</h2>
<p>Contact {{dpo_name}} at {{dpo_email}} in the first instance. You may also complain to the Information Commissioner''s Office: Wycliffe House, Water Lane, Wilmslow SK9 5AF. Tel: 0303 123 1113. Website: <em>ico.org.uk</em></p>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Last reviewed: {{review_date}} | Next review due: one year from review date</p>'
),

-- ============================================================
-- 3. PRIVACY NOTICE – GOVERNORS/TRUSTEES
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'Privacy Notice – Governors/Trustees (Comprehensive)',
  'ICO-compliant privacy notice for governors and trustees covering GIAS publication, Companies House requirements for academies, and governance-specific processing.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'School Governance (Roles, Procedures and Allowances) (England) Regulations 2013',
  'UK GDPR Articles 13-14 / School Governance Regs 2013',
  '{"required_fields": ["school_name", "school_address", "dpo_name", "dpo_email", "dpo_phone", "chair_of_governors", "review_date", "ico_registration_number"], "optional_fields": ["trust_name", "company_number", "clerk_name", "clerk_email"]}',
  '<h1>Privacy Notice: How We Use Governor/Trustee Information</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Data Controller</strong></td><td style="padding:8px;border:1px solid #ccc;">The Governing Body of {{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dpo_name}}, {{dpo_email}}, {{dpo_phone}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>ICO Registration</strong></td><td style="padding:8px;border:1px solid #ccc;">{{ico_registration_number}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Introduction</h2>
<p>This notice explains how {{school_name}} processes personal data about members of the governing body (or board of trustees), in compliance with the UK GDPR and DPA 2018. It covers all categories of governor: parent governors, staff governors, co-opted governors, local authority governors, foundation governors, and any associate members.</p>

<h2>2. Categories of Governor Data We Process</h2>
<ul>
<li>Full name, home address, date of birth, email address, telephone number</li>
<li>Category of governor and term of office dates (appointment and expiry)</li>
<li>Business and pecuniary interests declarations (including interests of related persons)</li>
<li>Governance roles held (e.g., chair, vice-chair, committee memberships, named governor roles such as SEND governor, safeguarding governor)</li>
<li>Attendance records at full governing body and committee meetings</li>
<li>Training and development records (including statutory safeguarding training, Prevent, safer recruitment)</li>
<li>DBS certificate details (number, date, level) – required under KCSIE for governors who visit the school</li>
<li>Section 128 direction check results (for academy trustees)</li>
<li>Disqualification declarations (Charity Commission automatic disqualification criteria, company director disqualification)</li>
<li>Skills audit responses</li>
<li>Photographs (for school website and governance noticeboard, with consent)</li>
</ul>

<h2>3. Why We Process This Data</h2>
<ul>
<li>To administer and support the governing body''s statutory functions</li>
<li>To maintain the register of business and pecuniary interests as required by the School Governance (Roles, Procedures and Allowances) (England) Regulations 2013</li>
<li>To publish governor information on the Get Information About Schools (GIAS) register as required by the DfE</li>
<li>To submit governance information to the DfE via GIAS (governor name, category, appointing body, date of appointment, date term ends)</li>
<li>To register trustees and directors with Companies House (academy trusts only)</li>
<li>To comply with safeguarding duties (DBS checks, s.128 checks)</li>
<li>To provide information to Ofsted during inspections</li>
<li>To monitor governor attendance and training compliance</li>
<li>To process governor expenses claims</li>
<li>To communicate governance matters (agendas, minutes, papers)</li>
</ul>

<h2>4. Lawful Basis for Processing</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Lawful Basis</th>
<th style="padding:8px;border:1px solid #ccc;">Article</th>
<th style="padding:8px;border:1px solid #ccc;">Activities</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Legal obligation</strong></td><td style="padding:8px;border:1px solid #ccc;">6(1)(c)</td><td style="padding:8px;border:1px solid #ccc;">GIAS publication, DBS/s.128 checks, register of interests, Companies House filings (academies)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Public task</strong></td><td style="padding:8px;border:1px solid #ccc;">6(1)(e)</td><td style="padding:8px;border:1px solid #ccc;">Governance administration, strategic oversight, Ofsted preparation</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Legitimate interests</strong></td><td style="padding:8px;border:1px solid #ccc;">6(1)(f)</td><td style="padding:8px;border:1px solid #ccc;">Governor training tracking, skills audit, expenses processing, internal communications</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Consent</strong></td><td style="padding:8px;border:1px solid #ccc;">6(1)(a)</td><td style="padding:8px;border:1px solid #ccc;">Photographs on school website, optional biographical information for public profiles</td></tr>
</tbody>
</table>

<h2>5. What Is Published</h2>
<p>The following governor information is published as required by regulation:</p>

<h3>5.1 GIAS (Get Information About Schools)</h3>
<p>The DfE requires schools to submit and maintain governor data on GIAS. Published information includes: governor name, category, appointing body, date of appointment, and date term of office ends. This is a statutory requirement under the School Governance (Roles, Procedures and Allowances) Regulations 2013.</p>

<h3>5.2 School Website</h3>
<p>Maintained schools must publish on their website: the names of governors, their category, which body appointed them, and their term of office. Academies must publish trustee/director details and the structure and remit of the trust. The register of business and pecuniary interests must also be published.</p>

<h3>5.3 Companies House (Academy Trusts Only)</h3>
<p>If {{school_name}} is part of an academy trust, trustee/director details (name, date of birth month/year, nationality, correspondence address) are filed at Companies House under the Companies Act 2006 and are publicly available.</p>

<h2>6. Who We Share Governor Data With</h2>
<ul>
<li><strong>DfE</strong> – via GIAS portal (statutory)</li>
<li><strong>Companies House</strong> – for academy trust directors/trustees</li>
<li><strong>Charity Commission</strong> – for exempt charities (academy trusts)</li>
<li><strong>DBS</strong> – for enhanced disclosure checks</li>
<li><strong>Ofsted</strong> – during inspection (governance review)</li>
<li><strong>Local authority</strong> – for maintained school governance changes</li>
<li><strong>Clerk to governors / governance professional</strong> – for meeting administration</li>
<li><strong>The school community</strong> – published information as detailed in section 5</li>
</ul>

<h2>7. Retention</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Record</th>
<th style="padding:8px;border:1px solid #ccc;">Retention</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Governor appointment records</td><td style="padding:8px;border:1px solid #ccc;">End of term of office + 6 years</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Governing body meeting minutes (signed)</td><td style="padding:8px;border:1px solid #ccc;">Permanent (legal record of decisions)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Meeting agendas and supporting papers</td><td style="padding:8px;border:1px solid #ccc;">Date of meeting + 6 years</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Register of pecuniary interests</td><td style="padding:8px;border:1px solid #ccc;">End of term of office + 6 years</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">DBS records</td><td style="padding:8px;border:1px solid #ccc;">Certificate destroyed after 6 months; number/date retained on SCR for term of office</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Training records</td><td style="padding:8px;border:1px solid #ccc;">End of term of office + 6 years</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Expenses claims</td><td style="padding:8px;border:1px solid #ccc;">Current financial year + 6 years</td></tr>
</tbody>
</table>

<h2>8. Your Rights</h2>
<p>You have the same rights as set out under UK GDPR Articles 15-22: access, rectification, erasure (where lawful), restriction, objection, data portability, and rights relating to automated decision-making. Note that some published information (GIAS, Companies House) may be retained by those bodies beyond our control.</p>

<h2>9. Contact</h2>
<p>For data queries, contact: {{dpo_name}} at {{dpo_email}} or {{dpo_phone}}. You may also complain to the ICO at <em>ico.org.uk</em> or 0303 123 1113.</p>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Last reviewed: {{review_date}} | Next review due: one year from review date</p>'
)

,

-- ============================================================
-- 4. PRIVACY NOTICE – WEBSITE VISITORS
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'Privacy Notice – Website Visitors & Cookie Policy (Comprehensive)',
  'Combined privacy and cookie notice for school website visitors compliant with UK GDPR and PECR 2003, covering analytics, contact forms, embedded content, and cookie categories.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  NULL,
  'UK GDPR / PECR 2003 / ICO Cookies Guidance 2024',
  '{"required_fields": ["school_name", "school_address", "dpo_name", "dpo_email", "website_url", "review_date", "ico_registration_number"], "optional_fields": ["analytics_provider", "hosting_provider", "cookie_consent_tool"]}',
  '<h1>Website Privacy Notice &amp; Cookie Policy</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Website</strong></td><td style="padding:8px;border:1px solid #ccc;">{{website_url}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Operator / Data Controller</strong></td><td style="padding:8px;border:1px solid #ccc;">The Governing Body of {{school_name}}, {{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dpo_name}}, {{dpo_email}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>ICO Registration</strong></td><td style="padding:8px;border:1px solid #ccc;">{{ico_registration_number}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Introduction</h2>
<p>This notice explains what personal data we collect when you visit {{website_url}}, how we use cookies and similar technologies, and your rights under the UK General Data Protection Regulation (UK GDPR) and the Privacy and Electronic Communications Regulations 2003 (PECR).</p>

<h2>2. Information We Collect</h2>

<h3>2.1 Information You Provide</h3>
<ul>
<li><strong>Contact forms:</strong> name, email address, telephone number, and message content when you use our enquiry, admissions or complaints forms</li>
<li><strong>Newsletter sign-ups:</strong> email address and name (where you opt in to receive school newsletters)</li>
<li><strong>Event bookings:</strong> name, contact details, dietary requirements (for open evenings, school events)</li>
<li><strong>Job applications:</strong> where our website hosts a vacancies section linking to application forms</li>
</ul>

<h3>2.2 Information Collected Automatically</h3>
<ul>
<li><strong>Technical data:</strong> IP address (anonymised where possible), browser type and version, operating system, screen resolution</li>
<li><strong>Usage data:</strong> pages visited, time spent on pages, referring website, click paths</li>
<li><strong>Device data:</strong> device type (desktop, mobile, tablet)</li>
</ul>
<p>We collect this data through cookies and similar technologies (see Section 4 below).</p>

<h3>2.3 Embedded Content</h3>
<p>Our website may embed content from third parties (e.g., YouTube videos, Google Maps, Twitter feeds, Flickr galleries). When you view embedded content, those third parties may collect data about you as if you were visiting their website directly. We recommend reviewing their privacy policies.</p>

<h2>3. How We Use Website Data</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Purpose</th>
<th style="padding:8px;border:1px solid #ccc;">Lawful Basis</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Respond to contact form enquiries</td><td style="padding:8px;border:1px solid #ccc;">Legitimate interests (Article 6(1)(f)) – responding to requests directed to us</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Process admissions enquiries</td><td style="padding:8px;border:1px solid #ccc;">Public task (Article 6(1)(e)) – education provision</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Website analytics and improvement</td><td style="padding:8px;border:1px solid #ccc;">Consent (Article 6(1)(a)) – via cookie consent mechanism</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Essential website functionality</td><td style="padding:8px;border:1px solid #ccc;">Legitimate interests (Article 6(1)(f)) – necessary for the website to function</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Security and fraud prevention</td><td style="padding:8px;border:1px solid #ccc;">Legitimate interests (Article 6(1)(f)) – protecting our website and users</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Send newsletters (where opted in)</td><td style="padding:8px;border:1px solid #ccc;">Consent (Article 6(1)(a)) – you may unsubscribe at any time</td></tr>
</tbody>
</table>

<h2>4. Cookies</h2>
<p>Cookies are small text files placed on your device when you visit a website. Under PECR 2003 Regulation 6, we must tell you about cookies and obtain consent for non-essential cookies.</p>

<h3>4.1 Strictly Necessary Cookies</h3>
<p>These cookies are essential for the website to function and cannot be switched off. They do not require consent under PECR.</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Cookie Name</th>
<th style="padding:8px;border:1px solid #ccc;">Purpose</th>
<th style="padding:8px;border:1px solid #ccc;">Duration</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">cookie_consent</td><td style="padding:8px;border:1px solid #ccc;">Stores your cookie consent preferences</td><td style="padding:8px;border:1px solid #ccc;">1 year</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">session_id</td><td style="padding:8px;border:1px solid #ccc;">Maintains your session while browsing</td><td style="padding:8px;border:1px solid #ccc;">Session (deleted when browser closed)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">csrf_token</td><td style="padding:8px;border:1px solid #ccc;">Security token to prevent cross-site request forgery on forms</td><td style="padding:8px;border:1px solid #ccc;">Session</td></tr>
</tbody>
</table>

<h3>4.2 Analytics Cookies</h3>
<p>These cookies help us understand how visitors use our website. They are only placed with your explicit consent.</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Cookie Name</th>
<th style="padding:8px;border:1px solid #ccc;">Purpose</th>
<th style="padding:8px;border:1px solid #ccc;">Duration</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">_ga, _ga_*</td><td style="padding:8px;border:1px solid #ccc;">Google Analytics – distinguishes unique users, tracks page views</td><td style="padding:8px;border:1px solid #ccc;">2 years</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">_gid</td><td style="padding:8px;border:1px solid #ccc;">Google Analytics – distinguishes users</td><td style="padding:8px;border:1px solid #ccc;">24 hours</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">_gat</td><td style="padding:8px;border:1px solid #ccc;">Google Analytics – throttle request rate</td><td style="padding:8px;border:1px solid #ccc;">1 minute</td></tr>
</tbody>
</table>
<p><em>Note: We have configured Google Analytics with IP anonymisation enabled and data sharing with Google disabled. Where available, we use privacy-focused alternatives such as Plausible or Fathom Analytics which do not use cookies.</em></p>

<h3>4.3 Functionality Cookies</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Cookie Name</th>
<th style="padding:8px;border:1px solid #ccc;">Purpose</th>
<th style="padding:8px;border:1px solid #ccc;">Duration</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">accessibility_prefs</td><td style="padding:8px;border:1px solid #ccc;">Remembers accessibility settings (font size, contrast)</td><td style="padding:8px;border:1px solid #ccc;">1 year</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">language_pref</td><td style="padding:8px;border:1px solid #ccc;">Stores language preference for multilingual content</td><td style="padding:8px;border:1px solid #ccc;">1 year</td></tr>
</tbody>
</table>

<h3>4.4 Third-Party Cookies</h3>
<p>Embedded content (YouTube, Google Maps, social media widgets) may set their own cookies. These are controlled by the third party, not by us. We recommend:</p>
<ul>
<li>YouTube: <em>policies.google.com/privacy</em></li>
<li>Google Maps: <em>policies.google.com/privacy</em></li>
<li>Twitter/X: <em>twitter.com/privacy</em></li>
</ul>

<h3>4.5 Managing Cookies</h3>
<p>You can manage or delete cookies at any time through:</p>
<ul>
<li>Our cookie consent banner (click the cookie icon or ''manage cookies'' link in the footer)</li>
<li>Your browser settings (see <em>aboutcookies.org</em> for guidance)</li>
<li>Opting out of Google Analytics: <em>tools.google.com/dlpage/gaoptout</em></li>
</ul>
<p>Disabling strictly necessary cookies may prevent parts of our website from functioning correctly.</p>

<h2>5. Data Retention</h2>
<ul>
<li><strong>Contact form submissions:</strong> 12 months from receipt, then securely deleted</li>
<li><strong>Analytics data:</strong> 26 months (Google Analytics default with anonymisation)</li>
<li><strong>Newsletter subscribers:</strong> until you unsubscribe</li>
<li><strong>Server logs:</strong> 90 days rolling</li>
</ul>

<h2>6. Data Sharing</h2>
<p>We do not sell website visitor data. Data may be shared with:</p>
<ul>
<li>Our website hosting provider (as a data processor, under a DPA)</li>
<li>Google (if you consent to analytics cookies) – data is processed in the EEA/UK under Standard Contractual Clauses</li>
<li>Law enforcement (only if legally required)</li>
</ul>

<h2>7. International Transfers</h2>
<p>Where analytics or hosting services process data outside the UK, we ensure appropriate safeguards are in place (UK adequacy decisions, UK International Data Transfer Agreement, or Standard Contractual Clauses).</p>

<h2>8. Your Rights</h2>
<p>You have rights under UK GDPR to: access your data, rectify inaccuracies, request erasure, restrict processing, object to processing, and data portability. Contact {{dpo_name}} at {{dpo_email}}.</p>

<h2>9. Complaints</h2>
<p>Contact our DPO in the first instance. You may also complain to the ICO: <em>ico.org.uk</em>, 0303 123 1113.</p>

<h2>10. Changes</h2>
<p>We may update this notice. The latest version is always available at {{website_url}}/privacy.</p>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Last reviewed: {{review_date}} | Next review due: one year from review date</p>'
),

-- ============================================================
-- 5. DATA PROTECTION POLICY (Comprehensive)
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'Data Protection Policy (Comprehensive)',
  'Full organisational data protection policy covering all 7 UK GDPR principles, lawful bases, special category data, children''s data, international transfers, DPO role, subject rights, breach procedures, and training requirements.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Data Protection Toolkit for Schools',
  'UK GDPR / DPA 2018 / ICO Accountability Framework',
  '{"required_fields": ["school_name", "school_address", "dpo_name", "dpo_email", "dpo_phone", "headteacher_name", "chair_of_governors", "review_date", "ico_registration_number", "approved_by", "approval_date"], "optional_fields": ["trust_name", "trust_dpo", "siro_name", "it_manager"]}',
  '<h1>Data Protection Policy</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Policy Owner</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}} (Headteacher)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dpo_name}}, {{dpo_email}}, {{dpo_phone}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>ICO Registration</strong></td><td style="padding:8px;border:1px solid #ccc;">{{ico_registration_number}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Approved By</strong></td><td style="padding:8px;border:1px solid #ccc;">{{approved_by}} on {{approval_date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Review Date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Status</strong></td><td style="padding:8px;border:1px solid #ccc;">Statutory</td></tr>
</table>

<h2>1. Purpose and Scope</h2>
<p>This policy sets out how {{school_name}} (''the School'') will comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018 (DPA 2018). It applies to all personal data processed by the School, whether in electronic or paper form.</p>
<p>This policy applies to all staff (teaching and support), governors, volunteers, contractors, and any other persons who process personal data on behalf of the School.</p>
<p><strong>Related policies:</strong> Privacy Notices (pupils, staff, governors, website), Data Breach Response Procedure, CCTV Policy, Records Retention Schedule, Acceptable Use Policy, Information Security Policy.</p>

<h2>2. Definitions</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:25%;"><strong>Personal data</strong></td><td style="padding:8px;border:1px solid #ccc;">Any information relating to an identified or identifiable living individual (data subject). This includes names, identification numbers, location data, and online identifiers.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Special category data</strong></td><td style="padding:8px;border:1px solid #ccc;">Personal data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, trade union membership, genetic data, biometric data, health data, or data concerning sex life or sexual orientation.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Processing</strong></td><td style="padding:8px;border:1px solid #ccc;">Any operation performed on personal data, including collection, recording, organisation, structuring, storage, adaptation, retrieval, consultation, use, disclosure, dissemination, alignment, restriction, erasure or destruction.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data controller</strong></td><td style="padding:8px;border:1px solid #ccc;">The person or organisation that determines the purposes and means of processing. For this school, the governing body is the data controller.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data processor</strong></td><td style="padding:8px;border:1px solid #ccc;">A person or organisation that processes personal data on behalf of the controller (e.g., payroll provider, cloud hosting, MIS provider).</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer (DPO)</strong></td><td style="padding:8px;border:1px solid #ccc;">The independent officer responsible for monitoring compliance, advising on data protection, and acting as the contact point for data subjects and the ICO.</td></tr>
</table>

<h2>3. The Seven Data Protection Principles</h2>
<p>All personal data processing must comply with the seven principles set out in Article 5 of the UK GDPR:</p>

<h3>3.1 Lawfulness, Fairness and Transparency</h3>
<p>We will only process personal data where we have a lawful basis to do so (see Section 4). We will be transparent with data subjects about how their data is used through clear privacy notices. We will not process data in ways that are unfair or that data subjects would not reasonably expect.</p>
<p><strong>School context:</strong> Privacy notices are provided to pupils/parents on admission, to staff on appointment, and to governors on election/appointment. These are available on the school website and from the school office.</p>

<h3>3.2 Purpose Limitation</h3>
<p>We will only collect personal data for specified, explicit and legitimate purposes. We will not further process data in a manner incompatible with those purposes unless we have a lawful basis to do so and have informed the data subject.</p>
<p><strong>School context:</strong> Data collected for educational purposes will not be used for marketing without explicit consent. Staff data collected for employment will not be shared with unrelated third parties.</p>

<h3>3.3 Data Minimisation</h3>
<p>We will only collect personal data that is adequate, relevant and limited to what is necessary for the specified purpose.</p>
<p><strong>School context:</strong> Admission forms and data collection sheets are reviewed annually to ensure we only ask for necessary information. We will not collect data ''just in case'' it might be useful.</p>

<h3>3.4 Accuracy</h3>
<p>We will take reasonable steps to ensure personal data is accurate and, where necessary, kept up to date. Inaccurate data will be rectified or erased without delay.</p>
<p><strong>School context:</strong> We run an annual data collection exercise asking parents to verify and update pupil data. Staff are reminded annually to update personal details.</p>

<h3>3.5 Storage Limitation</h3>
<p>We will not keep personal data for longer than is necessary. Retention periods are set out in the Data Retention Schedule, based on the IRMS Schools Toolkit, and are reviewed annually.</p>
<p><strong>School context:</strong> At the end of each academic year, the School Business Manager / Data Lead reviews records due for destruction and arranges secure disposal.</p>

<h3>3.6 Integrity and Confidentiality (Security)</h3>
<p>We will process personal data securely, using appropriate technical and organisational measures to protect against unauthorised or unlawful processing, accidental loss, destruction or damage.</p>
<p><strong>School context:</strong> See Section 10 (Data Security) for specific measures including access controls, encryption, physical security, and training.</p>

<h3>3.7 Accountability</h3>
<p>We will demonstrate compliance with the above principles through documentation, policies, training records, DPIAs, the Record of Processing Activities (ROPA), and regular audits.</p>
<p><strong>School context:</strong> The DPO maintains the ROPA (Article 30 register), reviews DPIAs, conducts annual audits, and reports to the governing body on compliance.</p>

<h2>4. Lawful Bases for Processing</h2>
<p>Under Article 6 UK GDPR, we must have at least one lawful basis before processing personal data. The bases most relevant to schools are:</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Lawful Basis</th>
<th style="padding:8px;border:1px solid #ccc;">Article</th>
<th style="padding:8px;border:1px solid #ccc;">School Examples</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Consent</strong></td><td style="padding:8px;border:1px solid #ccc;">6(1)(a)</td><td style="padding:8px;border:1px solid #ccc;">School photographs on website/social media, biometric data, optional surveys, marketing emails, school trip photos for public use</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Contract</strong></td><td style="padding:8px;border:1px solid #ccc;">6(1)(b)</td><td style="padding:8px;border:1px solid #ccc;">Staff employment (payroll, pension, benefits), supplier contracts</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Legal obligation</strong></td><td style="padding:8px;border:1px solid #ccc;">6(1)(c)</td><td style="padding:8px;border:1px solid #ccc;">School census, attendance records, safeguarding referrals, HMRC returns, DBS checks, SCR maintenance, Ofsted provision</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Vital interests</strong></td><td style="padding:8px;border:1px solid #ccc;">6(1)(d)</td><td style="padding:8px;border:1px solid #ccc;">Medical emergencies (sharing allergy information with emergency services)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Public task</strong></td><td style="padding:8px;border:1px solid #ccc;">6(1)(e)</td><td style="padding:8px;border:1px solid #ccc;">Education provision, assessment, pastoral care, SEND support, behaviour management, careers guidance</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Legitimate interests</strong></td><td style="padding:8px;border:1px solid #ccc;">6(1)(f)</td><td style="padding:8px;border:1px solid #ccc;">CCTV, alumni relations, internal directories. Note: public authorities (maintained schools) cannot rely on this basis for the performance of their tasks – use public task instead.</td></tr>
</tbody>
</table>

<h2>5. Special Category Data (Article 9)</h2>
<p>Schools process significant amounts of special category data. In addition to a lawful basis under Article 6, we must also satisfy a condition under Article 9(2):</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Special Category</th>
<th style="padding:8px;border:1px solid #ccc;">School Context</th>
<th style="padding:8px;border:1px solid #ccc;">Article 9 Condition</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Racial/ethnic origin</td><td style="padding:8px;border:1px solid #ccc;">DfE census, equality monitoring, EAL support</td><td style="padding:8px;border:1px solid #ccc;">9(2)(g) – substantial public interest (DPA Sch1 Para 8 – equality of opportunity)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Religious belief</td><td style="padding:8px;border:1px solid #ccc;">RE withdrawal, faith school admissions, dietary requirements, collective worship</td><td style="padding:8px;border:1px solid #ccc;">9(2)(g) – substantial public interest (DPA Sch1 Para 6 – statutory purposes)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Health data</td><td style="padding:8px;border:1px solid #ccc;">Medical conditions, allergies, SEND, mental health, medication administration, care plans</td><td style="padding:8px;border:1px solid #ccc;">9(2)(g) – substantial public interest (DPA Sch1 Para 18 – safeguarding) or 9(2)(c) – vital interests where subject cannot consent</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Biometric data</td><td style="padding:8px;border:1px solid #ccc;">Fingerprint for cashless catering/library</td><td style="padding:8px;border:1px solid #ccc;">9(2)(a) – explicit consent (also requires parental consent under Protection of Freedoms Act 2012 s.26)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Trade union membership (staff)</td><td style="padding:8px;border:1px solid #ccc;">Payroll deductions, facility time records</td><td style="padding:8px;border:1px solid #ccc;">9(2)(b) – employment obligations (DPA Sch1 Part 1 Para 1)</td></tr>
</tbody>
</table>

<h2>6. Children''s Data and the Age Appropriate Design Code</h2>
<p>Schools hold large volumes of children''s data. We give particular regard to:</p>
<ul>
<li>The ICO''s Age Appropriate Design Code (Children''s Code) for any digital services likely to be accessed by children</li>
<li>Privacy settings set to ''high'' by default on pupil-facing platforms</li>
<li>Minimal data collection for digital services used by pupils</li>
<li>Age-appropriate privacy information (simplified language for younger pupils)</li>
<li>No detrimental profiling of children</li>
<li>Geolocation switched off by default</li>
<li>Parental controls where appropriate, respecting the evolving capacities of the child</li>
</ul>
<p>For consent-based processing involving children, we require parental consent for children under 13 (UK GDPR Article 8, as applied by DPA 2018 s.9). For children 13 and over, we consider their competence to consent on a case-by-case basis.</p>

<h2>7. International Transfers</h2>
<p>Where we use cloud-based services that may process data outside the UK, we ensure:</p>
<ul>
<li>A UK adequacy decision exists for the recipient country, OR</li>
<li>UK Standard Contractual Clauses (UK International Data Transfer Agreement – IDTA) are in place, OR</li>
<li>Another approved transfer mechanism applies (binding corporate rules, codes of conduct with binding commitments)</li>
</ul>
<p>We maintain a register of international transfers as part of our ROPA. Key providers and their transfer mechanisms are reviewed annually by the DPO.</p>

<h2>8. Data Protection Officer (DPO)</h2>
<p>The School has appointed {{dpo_name}} as Data Protection Officer. Schools that are public authorities are required to appoint a DPO under Article 37 UK GDPR. The DPO:</p>
<ul>
<li>Operates independently and reports to the governing body</li>
<li>Informs and advises the School on its data protection obligations</li>
<li>Monitors compliance with UK GDPR, DPA 2018, and this policy</li>
<li>Provides advice on Data Protection Impact Assessments (DPIAs)</li>
<li>Acts as the contact point for data subjects and the ICO</li>
<li>Maintains the Record of Processing Activities (ROPA)</li>
<li>Conducts or commissions annual data protection audits</li>
</ul>
<p>Contact: {{dpo_email}} / {{dpo_phone}}</p>

<h2>9. Data Subject Rights</h2>
<p>Data subjects have the following rights. All requests should be directed to the DPO and will be responded to within one calendar month (extendable by two months for complex requests):</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Right</th>
<th style="padding:8px;border:1px solid #ccc;">Key Points</th>
<th style="padding:8px;border:1px solid #ccc;">Timescale</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Access (Art.15)</td><td style="padding:8px;border:1px solid #ccc;">Free copy of personal data. Verify identity before disclosure. Redact third-party data.</td><td style="padding:8px;border:1px solid #ccc;">1 month</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Rectification (Art.16)</td><td style="padding:8px;border:1px solid #ccc;">Correct inaccurate data; complete incomplete data.</td><td style="padding:8px;border:1px solid #ccc;">1 month</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Erasure (Art.17)</td><td style="padding:8px;border:1px solid #ccc;">''Right to be forgotten'' – limited where legal obligations require retention.</td><td style="padding:8px;border:1px solid #ccc;">1 month</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Restriction (Art.18)</td><td style="padding:8px;border:1px solid #ccc;">Restrict processing while accuracy is contested or objection is considered.</td><td style="padding:8px;border:1px solid #ccc;">1 month</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Portability (Art.20)</td><td style="padding:8px;border:1px solid #ccc;">Receive data in structured, machine-readable format. Only applies to consent/contract-based automated processing.</td><td style="padding:8px;border:1px solid #ccc;">1 month</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Objection (Art.21)</td><td style="padding:8px;border:1px solid #ccc;">Object to public task/legitimate interests processing. School must stop unless compelling grounds demonstrated.</td><td style="padding:8px;border:1px solid #ccc;">1 month</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Automated decisions (Art.22)</td><td style="padding:8px;border:1px solid #ccc;">Right not to be subject to solely automated decisions with legal/significant effects. School does not use such processing.</td><td style="padding:8px;border:1px solid #ccc;">N/A</td></tr>
</tbody>
</table>
<p><strong>Education records (maintained schools):</strong> Parents also have a separate right to access their child''s educational record under the Education (Pupil Information) (England) Regulations 2005 – response within 15 school days.</p>

<h2>10. Data Security</h2>
<p>We implement the following technical and organisational measures:</p>

<h3>10.1 Technical Measures</h3>
<ul>
<li>Role-based access controls on all systems (MIS, email, shared drives, HR system)</li>
<li>Encryption at rest and in transit (TLS 1.2+ for data in transit; AES-256 for data at rest)</li>
<li>Multi-factor authentication (MFA) for all staff accounts</li>
<li>Automatic screen lock after 5 minutes of inactivity</li>
<li>Mobile device management (MDM) for school-issued devices</li>
<li>Email encryption for sensitive data transfers</li>
<li>Firewall, anti-malware, and intrusion detection systems</li>
<li>Regular software updates and security patching</li>
<li>Secure disposal of IT equipment (data wiping to NCSC standards)</li>
</ul>

<h3>10.2 Organisational Measures</h3>
<ul>
<li>Mandatory data protection training for all staff on induction and annually thereafter</li>
<li>Clear desk and clear screen policy</li>
<li>Visitor management and sign-in procedures</li>
<li>Secure filing for all paper records containing personal data</li>
<li>Data processing agreements (DPAs) with all processors, reviewed annually</li>
<li>Acceptable use policy covering personal devices, email, internet, and social media</li>
<li>Incident response plan and data breach procedure</li>
<li>Regular access reviews (termly) to ensure leavers'' access is removed promptly</li>
</ul>

<h2>11. Data Breach Procedure (Summary)</h2>
<p>A personal data breach is a breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data.</p>
<ul>
<li><strong>Report:</strong> All suspected breaches must be reported to the DPO immediately (within 24 hours of discovery)</li>
<li><strong>Assess:</strong> The DPO will assess the risk to individuals and determine severity</li>
<li><strong>Notify ICO:</strong> If a breach is likely to result in a risk to the rights and freedoms of individuals, the DPO will report to the ICO within 72 hours of becoming aware</li>
<li><strong>Notify individuals:</strong> If a breach is likely to result in a <em>high</em> risk to individuals, those affected will be notified without undue delay</li>
<li><strong>Record:</strong> All breaches are recorded in the breach register regardless of whether they are notified to the ICO</li>
</ul>
<p>See the full Data Breach Response Procedure for detailed guidance.</p>

<h2>12. Data Protection Impact Assessments (DPIAs)</h2>
<p>A DPIA must be conducted before any processing that is likely to result in a high risk to individuals. This includes:</p>
<ul>
<li>Implementing new technology systems that process personal data</li>
<li>Large-scale processing of special category data</li>
<li>Systematic monitoring of publicly accessible areas (e.g., new CCTV systems)</li>
<li>Processing children''s data for new digital services</li>
<li>Any new data sharing with third parties</li>
</ul>
<p>DPIAs are conducted by the data owner in consultation with the DPO and are reviewed by the governing body where high residual risks remain.</p>

<h2>13. Training</h2>
<ul>
<li><strong>Induction:</strong> All new staff receive data protection awareness training before accessing personal data</li>
<li><strong>Annual refresher:</strong> All staff complete annual data protection training (online or face-to-face)</li>
<li><strong>Role-specific:</strong> Staff with significant data responsibilities (DSL, office, SENDCo, HR) receive enhanced training</li>
<li><strong>Governors:</strong> Annual data protection update at a full governing body meeting</li>
<li><strong>Records:</strong> Training completion is tracked and reported to the governing body</li>
</ul>

<h2>14. Monitoring and Review</h2>
<ul>
<li>This policy is reviewed annually by the DPO and approved by the governing body</li>
<li>The DPO conducts an annual data protection audit and reports findings to governors</li>
<li>Compliance with this policy is monitored through spot checks, breach analysis, and SAR response times</li>
<li>The DfE Data Protection Toolkit for Schools self-assessment is completed annually</li>
</ul>

<h2>15. Consequences of Non-Compliance</h2>
<p>Failure to comply with this policy may result in:</p>
<ul>
<li>Disciplinary action (up to and including dismissal for staff)</li>
<li>Removal from the governing body</li>
<li>Regulatory action by the ICO (including enforcement notices and fines of up to 17.5 million or 4% of annual turnover)</li>
<li>Civil claims from affected data subjects</li>
<li>Criminal prosecution under DPA 2018 s.170 (unlawful obtaining of personal data)</li>
</ul>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Approved: {{approval_date}} | Last reviewed: {{review_date}} | Next review due: one year from review date</p>'
)

,

-- ============================================================
-- 6. RECORD OF PROCESSING ACTIVITIES (ROPA) – Article 30
-- ============================================================
(
  gen_random_uuid(),
  'generic_doc',
  'Record of Processing Activities – ROPA (Comprehensive)',
  'Article 30 UK GDPR register with 20+ processing activities typical for schools, including lawful bases, data subjects, categories, recipients, retention periods, and technical measures for each activity.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Data Protection Toolkit for Schools',
  'UK GDPR Article 30 / ICO Documentation Guidance',
  '{"required_fields": ["school_name", "school_address", "dpo_name", "dpo_email", "dpo_phone", "review_date", "ico_registration_number"], "optional_fields": ["trust_name", "mis_provider", "cloud_provider", "payroll_provider", "catering_provider"]}',
  '<h1>Record of Processing Activities (ROPA)</h1>
<p><em>Required under Article 30 of the UK GDPR for all data controllers</em></p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Data Controller</strong></td><td style="padding:8px;border:1px solid #ccc;">The Governing Body of {{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Controller Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dpo_name}}, {{dpo_email}}, {{dpo_phone}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>ICO Registration</strong></td><td style="padding:8px;border:1px solid #ccc;">{{ico_registration_number}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Last Updated</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>Processing Activities Register</h2>

<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:0.85em;">
<thead>
<tr style="background:#e8e8e8;">
<th style="padding:6px;border:1px solid #999;">Ref</th>
<th style="padding:6px;border:1px solid #999;">Processing Activity</th>
<th style="padding:6px;border:1px solid #999;">Purpose(s)</th>
<th style="padding:6px;border:1px solid #999;">Lawful Basis (Art.6)</th>
<th style="padding:6px;border:1px solid #999;">Special Category Condition (Art.9)</th>
<th style="padding:6px;border:1px solid #999;">Data Subjects</th>
<th style="padding:6px;border:1px solid #999;">Data Categories</th>
<th style="padding:6px;border:1px solid #999;">Recipients / Transfers</th>
<th style="padding:6px;border:1px solid #999;">Retention Period</th>
<th style="padding:6px;border:1px solid #999;">Technical &amp; Organisational Measures</th>
</tr>
</thead>
<tbody>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R01</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Pupil Admissions</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Process applications, allocate places, manage appeals</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c); Public task 6(1)(e)</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(g) – religion for faith school admissions criteria</td>
<td style="padding:6px;border:1px solid #ccc;">Prospective pupils, parents/carers</td>
<td style="padding:6px;border:1px solid #ccc;">Name, DOB, address, prior school, sibling data, religion (faith schools), SEND, LAC status, medical needs</td>
<td style="padding:6px;border:1px solid #ccc;">LA admissions team; DfE; appeal panel members</td>
<td style="padding:6px;border:1px solid #ccc;">Successful: becomes pupil record. Unsuccessful: date of decision + 1 year (or end of appeal)</td>
<td style="padding:6px;border:1px solid #ccc;">MIS access controls, encrypted storage, restricted sharing</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R02</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>School Census</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Statutory data return to DfE (termly/annual)</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c) – Education Act 1996 s.537A</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(g) – ethnicity, SEN, FSM</td>
<td style="padding:6px;border:1px solid #ccc;">All registered pupils</td>
<td style="padding:6px;border:1px solid #ccc;">UPN, demographics, ethnicity, FSM, SEN status, attendance, exclusions, in-year movement</td>
<td style="padding:6px;border:1px solid #ccc;">DfE via COLLECT portal; National Pupil Database</td>
<td style="padding:6px;border:1px solid #ccc;">As per DfE NPD retention policy</td>
<td style="padding:6px;border:1px solid #ccc;">DfE COLLECT secure portal, MIS export controls</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R03</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Attendance Management</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Record and monitor attendance, manage absences, issue penalty notices</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c) – Education Act 1996 s.434</td>
<td style="padding:6px;border:1px solid #ccc;">N/A (unless health-related absence – 9(2)(g))</td>
<td style="padding:6px;border:1px solid #ccc;">Pupils, parents/carers</td>
<td style="padding:6px;border:1px solid #ccc;">Session marks, absence codes, absence reasons, GP/medical notes</td>
<td style="padding:6px;border:1px solid #ccc;">LA (persistent absence, CME); DfE (census); EWO</td>
<td style="padding:6px;border:1px solid #ccc;">Date of register + 3 years</td>
<td style="padding:6px;border:1px solid #ccc;">MIS access controls, electronic registers with audit trail</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R04</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Assessment &amp; Reporting</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Track pupil progress, statutory assessments, report to parents</td>
<td style="padding:6px;border:1px solid #ccc;">Public task 6(1)(e); Legal obligation 6(1)(c)</td>
<td style="padding:6px;border:1px solid #ccc;">N/A</td>
<td style="padding:6px;border:1px solid #ccc;">Pupils</td>
<td style="padding:6px;border:1px solid #ccc;">Teacher assessments, standardised scores, statutory results (EYFS, Phonics, KS1/2/4/5), reports</td>
<td style="padding:6px;border:1px solid #ccc;">DfE (statutory results); exam boards; receiving schools on transfer</td>
<td style="padding:6px;border:1px solid #ccc;">Internal: current year + 6 years. Statutory results: permanent on pupil file</td>
<td style="padding:6px;border:1px solid #ccc;">MIS role-based access, encrypted assessment systems</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R05</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Safeguarding &amp; Child Protection</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Identify and respond to concerns, make referrals, maintain CP records</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c) – Children Act 1989/2004; Vital interests 6(1)(d)</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(g) – safeguarding (DPA Sch1 Para 18)</td>
<td style="padding:6px;border:1px solid #ccc;">Pupils, parents/carers, staff (if allegation), third parties</td>
<td style="padding:6px;border:1px solid #ccc;">Concern records, referral forms, conference notes, chronologies, body maps</td>
<td style="padding:6px;border:1px solid #ccc;">MASH/children''s services; police; LADO; receiving school DSL</td>
<td style="padding:6px;border:1px solid #ccc;">DOB + 25 years (minimum; review for longer retention for serious cases)</td>
<td style="padding:6px;border:1px solid #ccc;">Restricted access (DSL team only), secure CPOMS/MyConcern, audit trail, separate from main pupil file</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R06</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>SEND Provision</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Identify needs, provide support, manage EHCPs, provision mapping</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c) – Children and Families Act 2014; Public task 6(1)(e)</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(g) – health/disability (DPA Sch1 Para 6)</td>
<td style="padding:6px;border:1px solid #ccc;">Pupils with SEN, parents/carers</td>
<td style="padding:6px;border:1px solid #ccc;">SEN support plans, EHCPs, EP reports, SALT reports, OT reports, medical diagnoses, provision maps</td>
<td style="padding:6px;border:1px solid #ccc;">LA SEND team; EP service; health professionals; receiving schools; tribunal (if appeal)</td>
<td style="padding:6px;border:1px solid #ccc;">DOB + 25 years (or 35 years for serious cases)</td>
<td style="padding:6px;border:1px solid #ccc;">Restricted MIS access (SENDCo, DSL, class teachers as needed), encrypted storage</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R07</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Payroll &amp; Pension Administration</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Calculate and pay salaries, deduct tax/NI, administer pensions</td>
<td style="padding:6px;border:1px solid #ccc;">Contract 6(1)(b); Legal obligation 6(1)(c)</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(b) – employment obligations (TU deductions)</td>
<td style="padding:6px;border:1px solid #ccc;">Staff (employees, casual workers)</td>
<td style="padding:6px;border:1px solid #ccc;">Name, NI number, tax code, bank details, salary, allowances, pension contributions, student loan, TU subscriptions</td>
<td style="padding:6px;border:1px solid #ccc;">HMRC (RTI); TPS/LGPS; payroll bureau ({{payroll_provider}})</td>
<td style="padding:6px;border:1px solid #ccc;">Current tax year + 6 years (payroll); termination + 12 years (pension)</td>
<td style="padding:6px;border:1px solid #ccc;">Encrypted payroll system, restricted access (bursar/HR only), secure file transfer to HMRC</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R08</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Recruitment</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Advertise vacancies, shortlist, interview, appoint</td>
<td style="padding:6px;border:1px solid #ccc;">Contract 6(1)(b) – steps prior to entering contract; Legal obligation 6(1)(c)</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(b) – disability monitoring; 9(2)(g) – equality monitoring</td>
<td style="padding:6px;border:1px solid #ccc;">Job applicants, referees</td>
<td style="padding:6px;border:1px solid #ccc;">Application forms, CVs, interview notes, references, equality monitoring data, ID documents</td>
<td style="padding:6px;border:1px solid #ccc;">Interview panel members; referees contacted</td>
<td style="padding:6px;border:1px solid #ccc;">Successful: becomes personnel record. Unsuccessful: date of appointment + 6 months</td>
<td style="padding:6px;border:1px solid #ccc;">Restricted access, secure email for applications, equality data separated from selection</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R09</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>DBS &amp; Safeguarding Checks (SCR)</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Pre-employment and ongoing vetting for safeguarding</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c) – Safeguarding Vulnerable Groups Act 2006; KCSIE</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(g) – safeguarding; 9(2)(b) – employment</td>
<td style="padding:6px;border:1px solid #ccc;">Staff, governors, volunteers, contractors, agency workers</td>
<td style="padding:6px;border:1px solid #ccc;">DBS certificate number, date, level, outcome; s.128 check; prohibition check; overseas police check; right to work</td>
<td style="padding:6px;border:1px solid #ccc;">DBS; TRA; Ofsted (SCR inspection)</td>
<td style="padding:6px;border:1px solid #ccc;">Certificate: 6 months from decision. DBS number/date: duration of employment/appointment + 6 months</td>
<td style="padding:6px;border:1px solid #ccc;">SCR with restricted access (headteacher, HR lead), DBS certificates stored separately and destroyed per Code of Practice</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R10</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>CCTV Surveillance</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Security, safeguarding, crime prevention/detection</td>
<td style="padding:6px;border:1px solid #ccc;">Legitimate interests 6(1)(f) – security; Public task 6(1)(e) – safeguarding</td>
<td style="padding:6px;border:1px solid #ccc;">N/A (images not biometric unless facial recognition used)</td>
<td style="padding:6px;border:1px solid #ccc;">All persons on school premises (staff, pupils, visitors, contractors)</td>
<td style="padding:6px;border:1px solid #ccc;">Video images, audio (if enabled), date/time stamps</td>
<td style="padding:6px;border:1px solid #ccc;">Police (on lawful request); insurers (claims); parents (SAR with third-party redaction)</td>
<td style="padding:6px;border:1px solid #ccc;">30 days rolling (unless retained for specific investigation/SAR)</td>
<td style="padding:6px;border:1px solid #ccc;">Password-protected access, viewing logs, secure server room, signage displayed, DPIA completed</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R11</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>School Workforce Census</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Statutory annual return to DfE</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c) – Education Act 1996 s.537A</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(g) – ethnicity, disability</td>
<td style="padding:6px;border:1px solid #ccc;">All staff</td>
<td style="padding:6px;border:1px solid #ccc;">TRN, role, contract type, hours, pay, qualifications, ethnicity, disability, absence data</td>
<td style="padding:6px;border:1px solid #ccc;">DfE via COLLECT</td>
<td style="padding:6px;border:1px solid #ccc;">As per DfE guidance</td>
<td style="padding:6px;border:1px solid #ccc;">DfE COLLECT secure portal, MIS export controls</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R12</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Website Analytics</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Monitor website performance and improve user experience</td>
<td style="padding:6px;border:1px solid #ccc;">Consent 6(1)(a) – via cookie consent</td>
<td style="padding:6px;border:1px solid #ccc;">N/A</td>
<td style="padding:6px;border:1px solid #ccc;">Website visitors</td>
<td style="padding:6px;border:1px solid #ccc;">Anonymised IP, pages visited, time on site, browser/device, referrer</td>
<td style="padding:6px;border:1px solid #ccc;">Analytics provider (Google Analytics / Plausible)</td>
<td style="padding:6px;border:1px solid #ccc;">26 months (anonymised)</td>
<td style="padding:6px;border:1px solid #ccc;">IP anonymisation, cookie consent mechanism, no cross-site tracking</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R13</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>School Photographs &amp; Media</strong></td>
<td style="padding:6px;border:1px solid #ccc;">School events, newsletters, website, social media, prospectus</td>
<td style="padding:6px;border:1px solid #ccc;">Consent 6(1)(a) – for external/marketing use; Public task 6(1)(e) – for internal educational use</td>
<td style="padding:6px;border:1px solid #ccc;">N/A</td>
<td style="padding:6px;border:1px solid #ccc;">Pupils, staff, visitors</td>
<td style="padding:6px;border:1px solid #ccc;">Photographs, video recordings, names (captions)</td>
<td style="padding:6px;border:1px solid #ccc;">School website, social media, local press (with consent), Ofsted</td>
<td style="padding:6px;border:1px solid #ccc;">Duration of consent + 1 year; internal: current year + 3 years</td>
<td style="padding:6px;border:1px solid #ccc;">Consent register maintained, photos removed on withdrawal, no geotagging, no full names on social media</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R14</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Catering &amp; Free School Meals</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Provide school meals, check FSM eligibility, manage allergies</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c); Public task 6(1)(e); Vital interests 6(1)(d) – allergies</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(g) – health (allergies); 9(2)(g) – religion (dietary)</td>
<td style="padding:6px;border:1px solid #ccc;">Pupils, parents/carers</td>
<td style="padding:6px;border:1px solid #ccc;">Name, class, FSM eligibility, dietary needs, allergies, religion (for halal/kosher), medical care plans</td>
<td style="padding:6px;border:1px solid #ccc;">Catering provider ({{catering_provider}}); LA (FSM checking service); DfE (census)</td>
<td style="padding:6px;border:1px solid #ccc;">Current year + 6 years (financial); allergy info: duration of attendance</td>
<td style="padding:6px;border:1px solid #ccc;">Allergy lists posted in kitchen (first name only), DPA with catering provider, restricted system access</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R15</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Medical Records &amp; Medication</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Manage medical needs, administer medication, care plans</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c); Vital interests 6(1)(d)</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(c) – vital interests; 9(2)(h) – health provision</td>
<td style="padding:6px;border:1px solid #ccc;">Pupils</td>
<td style="padding:6px;border:1px solid #ccc;">Medical conditions, medications, dosage, administration logs, care plans, emergency protocols</td>
<td style="padding:6px;border:1px solid #ccc;">School nurse; ambulance service; GP (emergency); parents</td>
<td style="padding:6px;border:1px solid #ccc;">Duration of attendance + 7 years (or DOB + 25 for serious conditions)</td>
<td style="padding:6px;border:1px solid #ccc;">Locked medication cabinet, restricted access (first aiders, class teachers), care plans in class packs</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R16</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Governor/Trustee Administration</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Governance functions, regulatory compliance, GIAS</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c); Public task 6(1)(e)</td>
<td style="padding:6px;border:1px solid #ccc;">N/A</td>
<td style="padding:6px;border:1px solid #ccc;">Governors, trustees, associate members</td>
<td style="padding:6px;border:1px solid #ccc;">Name, contact details, category, term dates, DBS status, pecuniary interests, attendance, training</td>
<td style="padding:6px;border:1px solid #ccc;">DfE (GIAS); Companies House (academies); Ofsted; LA</td>
<td style="padding:6px;border:1px solid #ccc;">End of term + 6 years; minutes: permanent</td>
<td style="padding:6px;border:1px solid #ccc;">Governor portal access controls, secure minutes distribution, interests register published</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R17</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Behaviour Management</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Record and manage behaviour, sanctions, rewards, exclusions</td>
<td style="padding:6px;border:1px solid #ccc;">Public task 6(1)(e); Legal obligation 6(1)(c) – exclusions</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(g) – where linked to SEND/disability</td>
<td style="padding:6px;border:1px solid #ccc;">Pupils, parents/carers</td>
<td style="padding:6px;border:1px solid #ccc;">Behaviour incidents, sanctions, rewards, pastoral support plans, exclusion records, managed moves</td>
<td style="padding:6px;border:1px solid #ccc;">LA (exclusions); receiving school; governors (exclusion panels); DfE (census)</td>
<td style="padding:6px;border:1px solid #ccc;">Part of pupil record (DOB + 25 primary / leaving + 7 secondary)</td>
<td style="padding:6px;border:1px solid #ccc;">MIS access controls, restricted behaviour module access</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R18</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>School Trips &amp; Educational Visits</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Organise trips, manage consent, emergency contacts</td>
<td style="padding:6px;border:1px solid #ccc;">Public task 6(1)(e); Consent 6(1)(a) – photographs; Vital interests 6(1)(d) – medical emergencies</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(c) – medical info for emergencies</td>
<td style="padding:6px;border:1px solid #ccc;">Pupils, parents/carers, staff</td>
<td style="padding:6px;border:1px solid #ccc;">Consent forms, medical info, emergency contacts, dietary needs, passport details (overseas)</td>
<td style="padding:6px;border:1px solid #ccc;">Trip leaders; external providers (with DPA); overseas authorities (passport checks)</td>
<td style="padding:6px;border:1px solid #ccc;">Date of trip + 7 years (or DOB + 25 if child injured)</td>
<td style="padding:6px;border:1px solid #ccc;">Trip leader carries secure list, forms stored in locked cabinet, digital copies encrypted</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R19</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Biometric Systems</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Cashless catering, library management (if applicable)</td>
<td style="padding:6px;border:1px solid #ccc;">Consent 6(1)(a) – explicit consent required</td>
<td style="padding:6px;border:1px solid #ccc;">9(2)(a) – explicit consent for biometric data</td>
<td style="padding:6px;border:1px solid #ccc;">Pupils (secondary), staff</td>
<td style="padding:6px;border:1px solid #ccc;">Fingerprint/palm template (mathematical representation, not image)</td>
<td style="padding:6px;border:1px solid #ccc;">Biometric system provider (as processor)</td>
<td style="padding:6px;border:1px solid #ccc;">Deleted immediately upon withdrawal of consent or leaving school</td>
<td style="padding:6px;border:1px solid #ccc;">Templates not reverse-engineerable, parental consent under Protection of Freedoms Act 2012 s.26, alternative (PIN) always available</td>
</tr>

<tr>
<td style="padding:6px;border:1px solid #ccc;">R20</td>
<td style="padding:6px;border:1px solid #ccc;"><strong>Complaints &amp; FOI</strong></td>
<td style="padding:6px;border:1px solid #ccc;">Manage formal complaints and FOI/SAR requests</td>
<td style="padding:6px;border:1px solid #ccc;">Legal obligation 6(1)(c) – FOIA 2000, UK GDPR; Public task 6(1)(e)</td>
<td style="padding:6px;border:1px solid #ccc;">N/A (unless complaint involves special category data)</td>
<td style="padding:6px;border:1px solid #ccc;">Complainants, staff, pupils (if relevant to complaint)</td>
<td style="padding:6px;border:1px solid #ccc;">Complaint details, investigation records, outcomes, correspondence, SAR/FOI logs</td>
<td style="padding:6px;border:1px solid #ccc;">ICO (if appealed); DfE (if escalated); governors (formal complaints panel)</td>
<td style="padding:6px;border:1px solid #ccc;">Resolution + 6 years</td>
<td style="padding:6px;border:1px solid #ccc;">Confidential filing, restricted access, redaction of third-party data in SARs</td>
</tr>

</tbody>
</table>

<h2>Notes</h2>
<ul>
<li>This ROPA must be reviewed and updated at least annually, or whenever a new processing activity is introduced.</li>
<li>The DPO is responsible for maintaining this register and ensuring its accuracy.</li>
<li>Add additional rows for school-specific processing activities (e.g., breakfast club, after-school club, peripatetic music lessons, swimming lessons, educational software platforms).</li>
<li>Where a Data Protection Impact Assessment (DPIA) has been conducted for a processing activity, reference it in this register.</li>
</ul>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Last updated: {{review_date}} | DPO: {{dpo_name}}</p>'
),

-- ============================================================
-- 7. DATA RETENTION SCHEDULE (Comprehensive)
-- ============================================================
(
  gen_random_uuid(),
  'generic_doc',
  'Data Retention Schedule (Comprehensive)',
  'IRMS-based retention schedule with 35+ record categories for schools, covering pupil, staff, safeguarding, financial, H&S, governance, SEND, CCTV, and insurance records with destruction methods and legal authorities.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Data Protection Toolkit for Schools',
  'IRMS Schools Toolkit 2022 / UK GDPR Article 5(1)(e)',
  '{"required_fields": ["school_name", "review_date", "dpo_name"], "optional_fields": ["data_lead_name", "data_lead_role"]}',
  '<h1>Data Retention Schedule</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dpo_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Last Reviewed</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>Introduction</h2>
<p>This schedule sets out the minimum retention periods for school records in accordance with the UK GDPR storage limitation principle (Article 5(1)(e)) and the Information and Records Management Society (IRMS) Schools Toolkit. Records must not be retained beyond the stated period unless there is a specific, documented reason (e.g., ongoing legal proceedings, safeguarding investigation, audit requirement).</p>

<h2>Destruction Methods</h2>
<ul>
<li><strong>Secure destruction (paper):</strong> Cross-cut shredding (DIN Level P-4 minimum) or confidential waste collection by certified contractor</li>
<li><strong>Secure destruction (digital):</strong> Permanent deletion from all systems, backups, and archives. For hardware: data wiping to NCSC / HMG IA Standard No. 5 or physical destruction</li>
<li><strong>Review:</strong> At end of retention period, the record is reviewed by the DPO/data lead to determine if further retention is justified</li>
</ul>

<h2>Retention Schedule</h2>

<h3>A. Pupil Records</h3>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:0.9em;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Record Type</th>
<th style="padding:6px;border:1px solid #ccc;">Retention Period</th>
<th style="padding:6px;border:1px solid #ccc;">Action After Retention</th>
<th style="padding:6px;border:1px solid #ccc;">Legal Authority</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Pupil educational record (primary)</td><td style="padding:6px;border:1px solid #ccc;">DOB + 25 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Education (Pupil Information) Regs 2005 / Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Pupil educational record (secondary)</td><td style="padding:6px;border:1px solid #ccc;">Date of leaving + 7 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS / Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Admission forms and registers</td><td style="padding:6px;border:1px solid #ccc;">Date of admission + 1 year (unsuccessful); pupil record (successful)</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">School Admissions Code 2021</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Attendance registers</td><td style="padding:6px;border:1px solid #ccc;">Date of register + 3 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Education (Pupil Registration) Regs 2006</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Public examination results</td><td style="padding:6px;border:1px solid #ccc;">Permanently on pupil file</td><td style="padding:6px;border:1px solid #ccc;">Retained as part of pupil record</td><td style="padding:6px;border:1px solid #ccc;">IRMS</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Internal assessment/test results</td><td style="padding:6px;border:1px solid #ccc;">Current year + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">School reports to parents</td><td style="padding:6px;border:1px solid #ccc;">Part of pupil educational record</td><td style="padding:6px;border:1px solid #ccc;">As per pupil record</td><td style="padding:6px;border:1px solid #ccc;">IRMS</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Exclusion records</td><td style="padding:6px;border:1px solid #ccc;">Part of pupil record + retained on MIS for DfE census period</td><td style="padding:6px;border:1px solid #ccc;">As per pupil record</td><td style="padding:6px;border:1px solid #ccc;">Education Act 2002</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Consent forms (trips, photos)</td><td style="padding:6px;border:1px solid #ccc;">Duration of consent purpose + 1 year (or DOB + 25 if injury on trip)</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS</td></tr>
</tbody>
</table>

<h3>B. Safeguarding &amp; Child Protection</h3>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:0.9em;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Record Type</th>
<th style="padding:6px;border:1px solid #ccc;">Retention Period</th>
<th style="padding:6px;border:1px solid #ccc;">Action</th>
<th style="padding:6px;border:1px solid #ccc;">Authority</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Child protection files</td><td style="padding:6px;border:1px solid #ccc;">DOB + 25 years (minimum)</td><td style="padding:6px;border:1px solid #ccc;">Review; may retain indefinitely for serious cases</td><td style="padding:6px;border:1px solid #ccc;">KCSIE / Working Together 2023 / IRMS</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Safeguarding concern forms</td><td style="padding:6px;border:1px solid #ccc;">Part of CP file; DOB + 25 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction after review</td><td style="padding:6px;border:1px solid #ccc;">KCSIE</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Allegations against staff</td><td style="padding:6px;border:1px solid #ccc;">Until person reaches normal pension age or 10 years (whichever is longer) if substantiated. If unsubstantiated/false: record on personnel file per KCSIE</td><td style="padding:6px;border:1px solid #ccc;">Review</td><td style="padding:6px;border:1px solid #ccc;">KCSIE Part 4</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Low-level concern records</td><td style="padding:6px;border:1px solid #ccc;">Reviewed periodically; retained as long as individual in regulated activity</td><td style="padding:6px;border:1px solid #ccc;">Review on leaving</td><td style="padding:6px;border:1px solid #ccc;">KCSIE Part 4 Section 2</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Early Help assessments</td><td style="padding:6px;border:1px solid #ccc;">Part of pupil file; DOB + 25 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Working Together 2023</td></tr>
</tbody>
</table>

<h3>C. SEND Records</h3>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:0.9em;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Record Type</th>
<th style="padding:6px;border:1px solid #ccc;">Retention</th>
<th style="padding:6px;border:1px solid #ccc;">Action</th>
<th style="padding:6px;border:1px solid #ccc;">Authority</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">SEN support plans / IEPs</td><td style="padding:6px;border:1px solid #ccc;">Part of pupil record</td><td style="padding:6px;border:1px solid #ccc;">Transfer to receiving school; then as pupil record</td><td style="padding:6px;border:1px solid #ccc;">SEND Code of Practice 2015</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Education Health and Care Plans (EHCPs)</td><td style="padding:6px;border:1px solid #ccc;">DOB + 25 years (school copy); LA retains master</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Children and Families Act 2014</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Educational psychologist reports</td><td style="padding:6px;border:1px solid #ccc;">DOB + 25 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">SEND tribunal papers</td><td style="padding:6px;border:1px solid #ccc;">DOB + 35 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS / Limitation Act 1980</td></tr>
</tbody>
</table>

<h3>D. Staff / Employment Records</h3>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:0.9em;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Record Type</th>
<th style="padding:6px;border:1px solid #ccc;">Retention</th>
<th style="padding:6px;border:1px solid #ccc;">Action</th>
<th style="padding:6px;border:1px solid #ccc;">Authority</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Personnel file (general)</td><td style="padding:6px;border:1px solid #ccc;">Termination + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Unsuccessful applications</td><td style="padding:6px;border:1px solid #ccc;">Date of appointment + 6 months</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS / ICO guidance</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">DBS certificates</td><td style="padding:6px;border:1px solid #ccc;">6 months from receipt</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction (retain number/date on SCR)</td><td style="padding:6px;border:1px solid #ccc;">DBS Code of Practice</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Single Central Record (SCR)</td><td style="padding:6px;border:1px solid #ccc;">While individual remains in role + 6 months</td><td style="padding:6px;border:1px solid #ccc;">Remove entry (retain in personnel file)</td><td style="padding:6px;border:1px solid #ccc;">KCSIE / Ofsted</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Payroll records</td><td style="padding:6px;border:1px solid #ccc;">Current tax year + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Taxes Management Act 1970</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Pension records</td><td style="padding:6px;border:1px solid #ccc;">Termination + 12 years (or age 75)</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">TPS/LGPS regulations</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Sickness absence records</td><td style="padding:6px;border:1px solid #ccc;">Termination + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Appraisal/performance records</td><td style="padding:6px;border:1px solid #ccc;">Current year + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Disciplinary/grievance records</td><td style="padding:6px;border:1px solid #ccc;">Warning expiry + 6 years (or termination + 6 if dismissal)</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS / Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Maternity/paternity records</td><td style="padding:6px;border:1px solid #ccc;">End of tax year following return + 3 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Statutory Maternity Pay Regs 1986</td></tr>
</tbody>
</table>

<h3>E. Financial Records</h3>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:0.9em;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Record Type</th>
<th style="padding:6px;border:1px solid #ccc;">Retention</th>
<th style="padding:6px;border:1px solid #ccc;">Action</th>
<th style="padding:6px;border:1px solid #ccc;">Authority</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Annual accounts and audit reports</td><td style="padding:6px;border:1px solid #ccc;">Current year + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">HMRC / Charities Act 2011 (academies)</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Invoices, receipts, purchase orders</td><td style="padding:6px;border:1px solid #ccc;">Current year + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Taxes Management Act 1970</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Bank statements</td><td style="padding:6px;border:1px solid #ccc;">Current year + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">School fund accounts</td><td style="padding:6px;border:1px solid #ccc;">Current year + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Charities Act 2011</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Contracts and agreements</td><td style="padding:6px;border:1px solid #ccc;">Expiry + 6 years (12 years if under seal)</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Limitation Act 1980</td></tr>
</tbody>
</table>

<h3>F. Governance Records</h3>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:0.9em;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Record Type</th>
<th style="padding:6px;border:1px solid #ccc;">Retention</th>
<th style="padding:6px;border:1px solid #ccc;">Action</th>
<th style="padding:6px;border:1px solid #ccc;">Authority</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Signed governing body minutes</td><td style="padding:6px;border:1px solid #ccc;">Permanent</td><td style="padding:6px;border:1px solid #ccc;">Archive</td><td style="padding:6px;border:1px solid #ccc;">School Governance Regs 2013</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Agendas and supporting papers</td><td style="padding:6px;border:1px solid #ccc;">Date of meeting + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Governor appointment records</td><td style="padding:6px;border:1px solid #ccc;">End of term of office + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Register of interests</td><td style="padding:6px;border:1px solid #ccc;">End of term of office + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">School Governance Regs 2013</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Instrument of government</td><td style="padding:6px;border:1px solid #ccc;">Permanent</td><td style="padding:6px;border:1px solid #ccc;">Archive</td><td style="padding:6px;border:1px solid #ccc;">School Governance Regs 2013</td></tr>
</tbody>
</table>

<h3>G. Health &amp; Safety, CCTV, Insurance, Complaints</h3>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:0.9em;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Record Type</th>
<th style="padding:6px;border:1px solid #ccc;">Retention</th>
<th style="padding:6px;border:1px solid #ccc;">Action</th>
<th style="padding:6px;border:1px solid #ccc;">Authority</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Accident reports (pupils – children)</td><td style="padding:6px;border:1px solid #ccc;">DOB + 25 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Limitation Act 1980 (minor limitation)</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Accident reports (adults)</td><td style="padding:6px;border:1px solid #ccc;">Date of incident + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Asbestos management records</td><td style="padding:6px;border:1px solid #ccc;">40 years from date of record (or life of building)</td><td style="padding:6px;border:1px solid #ccc;">Review</td><td style="padding:6px;border:1px solid #ccc;">Control of Asbestos Regulations 2012</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Fire risk assessments</td><td style="padding:6px;border:1px solid #ccc;">Life of building + 3 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Regulatory Reform (Fire Safety) Order 2005</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Legionella testing records</td><td style="padding:6px;border:1px solid #ccc;">Date of record + 5 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">ACOP L8</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">CCTV footage</td><td style="padding:6px;border:1px solid #ccc;">30 days rolling</td><td style="padding:6px;border:1px solid #ccc;">Auto-overwrite (unless preserved for investigation)</td><td style="padding:6px;border:1px solid #ccc;">ICO CCTV Code of Practice</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Insurance policies</td><td style="padding:6px;border:1px solid #ccc;">Expiry + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Insurance claims</td><td style="padding:6px;border:1px solid #ccc;">Settlement + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Employer''s liability insurance certificate</td><td style="padding:6px;border:1px solid #ccc;">Expiry + 40 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Employers'' Liability (Compulsory Insurance) Regs 1998</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Complaints records</td><td style="padding:6px;border:1px solid #ccc;">Date of resolution + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">IRMS / Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Medical records (staff OH)</td><td style="padding:6px;border:1px solid #ccc;">Termination + 6 years (40 years if exposure to hazardous substances)</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">COSHH Regs 2002 / Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Risk assessments</td><td style="padding:6px;border:1px solid #ccc;">Life of activity + 3 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">Management of H&S at Work Regs 1999</td></tr>
</tbody>
</table>

<h3>H. Data Protection Records</h3>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:0.9em;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Record Type</th>
<th style="padding:6px;border:1px solid #ccc;">Retention</th>
<th style="padding:6px;border:1px solid #ccc;">Action</th>
<th style="padding:6px;border:1px solid #ccc;">Authority</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Data breach register</td><td style="padding:6px;border:1px solid #ccc;">Date of breach + 5 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">UK GDPR Article 33(5)</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Subject access requests (SAR log)</td><td style="padding:6px;border:1px solid #ccc;">Date of response + 3 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">UK GDPR / ICO guidance</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">DPIAs</td><td style="padding:6px;border:1px solid #ccc;">Life of processing activity + 3 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">UK GDPR Article 35</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Consent records</td><td style="padding:6px;border:1px solid #ccc;">Duration of consent + 3 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">UK GDPR Article 7</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Data processing agreements</td><td style="padding:6px;border:1px solid #ccc;">Expiry of contract + 6 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">UK GDPR Article 28 / Limitation Act 1980</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">FOI request log</td><td style="padding:6px;border:1px solid #ccc;">Date of response + 3 years</td><td style="padding:6px;border:1px solid #ccc;">Secure destruction</td><td style="padding:6px;border:1px solid #ccc;">FOIA 2000 / ICO guidance</td></tr>
</tbody>
</table>

<h2>Annual Review Process</h2>
<ol>
<li>The DPO/data lead reviews all record categories against this schedule at least annually (recommended: end of each academic year).</li>
<li>Records that have reached their retention date are identified and listed for authorised destruction.</li>
<li>A destruction log is maintained recording: record type, date range of records, volume, method of destruction, date of destruction, authorising officer.</li>
<li>Any records flagged for extended retention must have documented justification.</li>
<li>Paper records are destroyed via cross-cut shredding (minimum DIN P-4) or certified confidential waste contractor.</li>
<li>Digital records are permanently deleted from all systems, backups and archives with audit trail confirmation.</li>
</ol>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Last reviewed: {{review_date}} | Next review due: one year from review date</p>'
)

,

-- ============================================================
-- 8. DATA BREACH RESPONSE PROCEDURE
-- ============================================================
(
  gen_random_uuid(),
  'breach',
  'Data Breach Response Procedure (Comprehensive)',
  'Complete incident response procedure with school-specific examples, step-by-step response workflow, ICO 72-hour notification criteria, risk assessment matrix, severity classification, roles and responsibilities, and breach register template.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Data Protection Toolkit for Schools',
  'UK GDPR Articles 33-34 / ICO Personal Data Breach Guidance 2024',
  '{"required_fields": ["school_name", "dpo_name", "dpo_email", "dpo_phone", "headteacher_name", "review_date", "ico_registration_number"], "optional_fields": ["trust_name", "trust_dpo", "it_manager", "siro_name"]}',
  '<h1>Data Breach Response Procedure</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dpo_name}}, {{dpo_email}}, {{dpo_phone}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>ICO Registration</strong></td><td style="padding:8px;border:1px solid #ccc;">{{ico_registration_number}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. What Is a Personal Data Breach?</h2>
<p>A personal data breach is defined under Article 4(12) UK GDPR as a breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data transmitted, stored or otherwise processed.</p>
<p>A breach can be:</p>
<ul>
<li><strong>Confidentiality breach:</strong> Unauthorised or accidental disclosure of, or access to, personal data</li>
<li><strong>Integrity breach:</strong> Unauthorised or accidental alteration of personal data</li>
<li><strong>Availability breach:</strong> Accidental or unauthorised loss of access to, or destruction of, personal data</li>
</ul>

<h2>2. Examples of Breaches in a School Context</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Category</th>
<th style="padding:8px;border:1px solid #ccc;">Examples</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Email/communication</strong></td><td style="padding:8px;border:1px solid #ccc;">Sending a pupil report to the wrong parent; BCC failure (all parent emails visible); sending safeguarding information to wrong address; replying-all with confidential information</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Paper records</strong></td><td style="padding:8px;border:1px solid #ccc;">Confidential papers left in photocopier; pupil records left visible on desk during parents'' evening; SEN files found in recycling bin; loss of paper register with pupil medical information</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Physical loss/theft</strong></td><td style="padding:8px;border:1px solid #ccc;">Lost USB drive with pupil data; stolen laptop containing personnel files; burglary involving filing cabinets with personal data; lost school phone with parent contact details</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Cyber/IT</strong></td><td style="padding:8px;border:1px solid #ccc;">Ransomware attack encrypting the MIS; phishing attack compromising staff email; MIS misconfiguration exposing data; unauthorised access to school systems by former employee</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Verbal</strong></td><td style="padding:8px;border:1px solid #ccc;">Disclosing safeguarding information to an unauthorised person; discussing pupil SEN status in a public area; sharing staff sickness details in the staffroom</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>MIS/system</strong></td><td style="padding:8px;border:1px solid #ccc;">Granting a parent access to another family''s records on the parent portal; data migration error merging pupil records; system backup failure resulting in permanent data loss</td></tr>
</tbody>
</table>

<h2>3. Breach Response Procedure: Step by Step</h2>

<h3>Step 1: CONTAIN (Immediate – within minutes/hours)</h3>
<ul>
<li>Take immediate action to stop the breach and limit its impact</li>
<li>Recover any data that has been disclosed inappropriately (e.g., recall an email, retrieve papers)</li>
<li>Isolate affected systems if a cyber incident (disconnect from network, do NOT power off – preserve evidence)</li>
<li>Change passwords/access credentials if accounts may be compromised</li>
<li>Ask recipients of misdirected information to delete it and confirm deletion</li>
<li>Secure any physical documents that are exposed</li>
</ul>

<h3>Step 2: ASSESS (Within 24 hours of discovery)</h3>
<p>The DPO (or deputy) assesses the breach using the following criteria:</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Factor</th>
<th style="padding:8px;border:1px solid #ccc;">Assessment Questions</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Type of data</td><td style="padding:8px;border:1px solid #ccc;">Is it special category? Financial? Safeguarding? Children''s data?</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Volume</td><td style="padding:8px;border:1px solid #ccc;">How many individuals are affected?</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Sensitivity</td><td style="padding:8px;border:1px solid #ccc;">Could the data cause harm, distress, embarrassment, or financial loss?</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Ease of identification</td><td style="padding:8px;border:1px solid #ccc;">Can individuals be identified from the data alone or in combination?</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Vulnerability</td><td style="padding:8px;border:1px solid #ccc;">Are the data subjects children or vulnerable individuals?</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Context</td><td style="padding:8px;border:1px solid #ccc;">Who has the data? Are they trustworthy? How was data received?</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Containment</td><td style="padding:8px;border:1px solid #ccc;">Has the breach been fully contained? Could it recur?</td></tr>
</tbody>
</table>

<h3>Severity Classification Matrix</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Severity</th>
<th style="padding:8px;border:1px solid #ccc;">Criteria</th>
<th style="padding:8px;border:1px solid #ccc;">Example</th>
<th style="padding:8px;border:1px solid #ccc;">Action Required</th>
</tr>
</thead>
<tbody>
<tr style="background:#ffcccc;">
<td style="padding:8px;border:1px solid #ccc;"><strong>HIGH</strong></td>
<td style="padding:8px;border:1px solid #ccc;">Special category/safeguarding data; large volume; children affected; likely harm/distress; not contained</td>
<td style="padding:8px;border:1px solid #ccc;">Ransomware encrypting MIS; safeguarding file sent to wrong parent; data breach involving SEN records of multiple children</td>
<td style="padding:8px;border:1px solid #ccc;">Notify ICO within 72 hours AND notify affected individuals without undue delay</td>
</tr>
<tr style="background:#fff3cd;">
<td style="padding:8px;border:1px solid #ccc;"><strong>MEDIUM</strong></td>
<td style="padding:8px;border:1px solid #ccc;">Personal data disclosed to wrong recipient but contained; small volume; some risk of harm</td>
<td style="padding:8px;border:1px solid #ccc;">School report sent to wrong parent (recalled and deleted); staff payslip emailed to wrong staff member</td>
<td style="padding:8px;border:1px solid #ccc;">Notify ICO within 72 hours if risk to rights/freedoms; may not need to notify individuals if quickly contained</td>
</tr>
<tr style="background:#d4edda;">
<td style="padding:8px;border:1px solid #ccc;"><strong>LOW</strong></td>
<td style="padding:8px;border:1px solid #ccc;">Minimal data; no special categories; data retrieved/contained immediately; negligible risk</td>
<td style="padding:8px;border:1px solid #ccc;">Pupil contact list briefly visible on shared screen during Teams call; paper register left on desk for 10 minutes</td>
<td style="padding:8px;border:1px solid #ccc;">Record internally; no ICO notification required; review procedures</td>
</tr>
</tbody>
</table>

<h3>Step 3: NOTIFY (Within 72 hours of becoming aware)</h3>

<h4>3a. Notify the ICO (if required)</h4>
<p>Under Article 33 UK GDPR, we must notify the ICO within <strong>72 hours</strong> of becoming aware of a breach that is likely to result in a risk to the rights and freedoms of individuals. "Becoming aware" means when the DPO or senior management has a reasonable degree of certainty that a breach has occurred.</p>
<p><strong>How to notify:</strong></p>
<ul>
<li>Online: <em>ico.org.uk/for-organisations/report-a-breach/</em> (preferred method)</li>
<li>Telephone: 0303 123 1113 (if unable to submit online within 72 hours)</li>
</ul>
<p><strong>Information to provide:</strong></p>
<ul>
<li>Nature of the breach (confidentiality, integrity, availability)</li>
<li>Categories and approximate number of data subjects</li>
<li>Categories and approximate number of data records</li>
<li>Name and contact details of the DPO</li>
<li>Description of likely consequences</li>
<li>Measures taken or proposed to address the breach and mitigate effects</li>
</ul>
<p>If we cannot provide all information within 72 hours, we will provide it in phases without undue further delay.</p>

<h4>3b. Notify Affected Individuals (if high risk)</h4>
<p>Under Article 34 UK GDPR, we must notify affected individuals without undue delay where a breach is likely to result in a <strong>high risk</strong> to their rights and freedoms. Notification should:</p>
<ul>
<li>Be in clear, plain language (age-appropriate for children/parents)</li>
<li>Describe the nature of the breach</li>
<li>Provide DPO contact details</li>
<li>Describe likely consequences</li>
<li>Describe measures taken and advice for individuals to protect themselves</li>
</ul>
<p>Notification to individuals is NOT required if:</p>
<ul>
<li>We have applied appropriate protection measures (e.g., encryption) rendering data unintelligible, OR</li>
<li>We have taken subsequent measures ensuring high risk is no longer likely, OR</li>
<li>It would involve disproportionate effort (in which case, public communication is used)</li>
</ul>

<h4>3c. Notify Other Bodies (as applicable)</h4>
<ul>
<li><strong>Police:</strong> If the breach involves criminal activity (theft, hacking)</li>
<li><strong>Local authority LADO:</strong> If the breach involves safeguarding data and there is an allegation against a member of staff</li>
<li><strong>Trust/MAT central team:</strong> If the school is part of a trust</li>
<li><strong>Insurers:</strong> Notify cyber insurance provider (if applicable)</li>
<li><strong>DfE:</strong> If the breach involves school census or NPD data</li>
<li><strong>Action Fraud:</strong> If the breach results from fraud (0300 123 2040)</li>
</ul>

<h3>Step 4: RECORD (Ongoing)</h3>
<p>Under Article 33(5) UK GDPR, we must document all breaches regardless of whether they are reported to the ICO. The breach register records:</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Field</th>
<th style="padding:8px;border:1px solid #ccc;">Details</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Breach reference number</td><td style="padding:8px;border:1px solid #ccc;">Unique sequential reference (e.g., BREACH-2026-001)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Date/time breach occurred</td><td style="padding:8px;border:1px solid #ccc;">[Date and time]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Date/time breach discovered</td><td style="padding:8px;border:1px solid #ccc;">[Date and time]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Who discovered/reported it</td><td style="padding:8px;border:1px solid #ccc;">[Name and role]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Description of breach</td><td style="padding:8px;border:1px solid #ccc;">[Factual account of what happened]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Type (confidentiality/integrity/availability)</td><td style="padding:8px;border:1px solid #ccc;">[Type(s)]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Data categories involved</td><td style="padding:8px;border:1px solid #ccc;">[Personal data, special category, financial, etc.]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Number of data subjects affected</td><td style="padding:8px;border:1px solid #ccc;">[Exact or approximate]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Severity (High/Medium/Low)</td><td style="padding:8px;border:1px solid #ccc;">[Per matrix above]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Containment actions taken</td><td style="padding:8px;border:1px solid #ccc;">[What was done to stop/limit the breach]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">ICO notified (Yes/No)</td><td style="padding:8px;border:1px solid #ccc;">[If yes: date, ICO reference number]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Individuals notified (Yes/No)</td><td style="padding:8px;border:1px solid #ccc;">[If yes: date, method, number notified]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Root cause</td><td style="padding:8px;border:1px solid #ccc;">[Human error, system failure, process gap, malicious]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Remedial actions</td><td style="padding:8px;border:1px solid #ccc;">[Process changes, training, system updates]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Lessons learned</td><td style="padding:8px;border:1px solid #ccc;">[What will prevent recurrence]</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Sign-off</td><td style="padding:8px;border:1px solid #ccc;">[DPO name, date closed]</td></tr>
</tbody>
</table>

<h2>4. Roles and Responsibilities</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Role</th>
<th style="padding:8px;border:1px solid #ccc;">Responsibilities</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>All staff</strong></td><td style="padding:8px;border:1px solid #ccc;">Immediately report any suspected or actual breach to the DPO or Headteacher. Do not attempt to investigate independently. Take containment steps within your ability (e.g., recall email, secure documents).</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer ({{dpo_name}})</strong></td><td style="padding:8px;border:1px solid #ccc;">Receive breach reports, assess severity, determine ICO/individual notification requirements, submit ICO notifications, maintain breach register, conduct post-incident review, report to governors.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher ({{headteacher_name}})</strong></td><td style="padding:8px;border:1px solid #ccc;">Authorise communications to affected individuals and parents. Manage staff disciplinary aspects. Brief the governing body. Act as DPO deputy if DPO unavailable.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>IT Manager / Technician</strong></td><td style="padding:8px;border:1px solid #ccc;">Implement technical containment (isolate systems, change credentials, preserve evidence for forensic analysis). Support DPO with technical assessment.</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Chair of Governors</strong></td><td style="padding:8px;border:1px solid #ccc;">Informed of all HIGH severity breaches. Receives DPO breach reports. Oversees remedial actions where systemic issues identified.</td></tr>
</tbody>
</table>

<h2>5. Post-Breach Review</h2>
<p>After every breach (regardless of severity), the DPO conducts a post-incident review within 10 working days:</p>
<ol>
<li><strong>Root cause analysis:</strong> Why did the breach happen? Human error, process failure, system vulnerability, malicious act?</li>
<li><strong>Effectiveness of response:</strong> Was containment timely? Was notification appropriate and within timescale?</li>
<li><strong>Remedial actions:</strong> What changes are needed to prevent recurrence? (e.g., additional training, process change, technical control, policy update)</li>
<li><strong>Action plan:</strong> Document specific actions with owners and deadlines</li>
<li><strong>Governing body report:</strong> All HIGH/MEDIUM breaches reported to the next governing body meeting (anonymised as appropriate)</li>
</ol>

<h2>6. Training</h2>
<ul>
<li>All staff are trained on breach identification and reporting during induction and annual refresher training</li>
<li>Scenario-based exercises are conducted annually to test the breach response procedure</li>
<li>The DPO briefs the SLT on breach trends and emerging risks termly</li>
</ul>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Last reviewed: {{review_date}} | Next review due: one year from review date</p>'
),

-- ============================================================
-- 9. CCTV POLICY
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'CCTV Policy (Comprehensive)',
  'Full CCTV policy following ICO CCTV guidance and Surveillance Camera Commissioner Code 2022, covering purpose limitation, lawful basis with balancing test, DPIA requirements, signage, storage, retention, access controls, SARs for footage, and covert surveillance.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  NULL,
  'UK GDPR / Protection of Freedoms Act 2012 / ICO CCTV Code / Surveillance Camera Commissioner Code 2022',
  '{"required_fields": ["school_name", "school_address", "dpo_name", "dpo_email", "dpo_phone", "headteacher_name", "review_date", "number_of_cameras", "cctv_system_provider", "storage_location", "retention_days"], "optional_fields": ["trust_name", "site_manager", "cctv_manager_name"]}',
  '<h1>CCTV Policy</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Data Protection Officer</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dpo_name}}, {{dpo_email}}, {{dpo_phone}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Number of Cameras</strong></td><td style="padding:8px;border:1px solid #ccc;">{{number_of_cameras}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>System Provider</strong></td><td style="padding:8px;border:1px solid #ccc;">{{cctv_system_provider}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Purpose</h2>
<p>{{school_name}} operates a CCTV surveillance system on its premises. This policy sets out how the system is managed, how footage is used, and the rights of individuals recorded by it. The system is operated in accordance with the UK GDPR, Data Protection Act 2018, the Protection of Freedoms Act 2012, the Surveillance Camera Commissioner''s Code of Practice 2022, and ICO CCTV guidance.</p>

<h2>2. Purposes of CCTV</h2>
<p>CCTV is operated for the following specific, stated purposes only:</p>
<ul>
<li><strong>Security:</strong> To protect school buildings, equipment and assets from damage, disruption, vandalism and crime</li>
<li><strong>Safeguarding:</strong> To help ensure the safety and welfare of pupils, staff and visitors on school premises</li>
<li><strong>Crime prevention and detection:</strong> To deter and detect criminal or anti-social activity</li>
<li><strong>Health and safety:</strong> To assist with health and safety monitoring, including fire evacuation and incident investigation</li>
<li><strong>Disciplinary and complaints:</strong> To provide evidence for disciplinary, grievance or complaints investigations where relevant footage exists</li>
</ul>
<p><strong>CCTV is NOT used for:</strong></p>
<ul>
<li>Routine monitoring of staff performance or productivity</li>
<li>Monitoring pupil behaviour in classrooms as standard practice</li>
<li>Any purpose other than those stated above</li>
</ul>

<h2>3. Lawful Basis</h2>
<p>Our lawful basis for processing CCTV data is:</p>
<ul>
<li><strong>Article 6(1)(e) – Public task:</strong> The school has a duty to safeguard pupils and provide a safe environment for education</li>
<li><strong>Article 6(1)(f) – Legitimate interests:</strong> Security of premises and assets (a legitimate interests assessment has been conducted and is available from the DPO)</li>
</ul>

<h3>3.1 Legitimate Interests Assessment (Summary)</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Purpose (legitimate interest)</strong></td><td style="padding:8px;border:1px solid #ccc;">Security, safeguarding, crime deterrence</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Necessity</strong></td><td style="padding:8px;border:1px solid #ccc;">CCTV is necessary to achieve these purposes; less intrusive means (e.g., additional staff supervision, security guards) are not practical or cost-effective for all hours</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Balancing test</strong></td><td style="padding:8px;border:1px solid #ccc;">The security and safeguarding benefits outweigh the privacy impact, particularly as cameras are positioned in external and communal areas, NOT in private areas (toilets, changing rooms, staff rooms). Signage is displayed. Retention is limited to {{retention_days}} days.</td></tr>
</table>

<h2>4. Data Protection Impact Assessment (DPIA)</h2>
<p>A DPIA has been conducted for the CCTV system as required by Article 35 UK GDPR (systematic monitoring of a publicly accessible area on a large scale). The DPIA is reviewed annually and whenever the system is significantly modified (e.g., new cameras, facial recognition, audio recording, change of provider). The DPIA is available from the DPO on request.</p>

<h2>5. Camera Locations</h2>
<p>Cameras are positioned to monitor:</p>
<ul>
<li>School entrances and exits (main entrance, playground gates, vehicle access points)</li>
<li>External perimeter (boundaries, car park, playing fields)</li>
<li>Internal corridors and communal areas (reception, halls, stairwells)</li>
<li>Areas identified as having higher security or safety risk</li>
</ul>
<p><strong>Cameras are NOT located in:</strong></p>
<ul>
<li>Toilets, changing rooms, or shower areas</li>
<li>Staff rooms or staff break areas</li>
<li>Classrooms (unless specifically justified by a DPIA for a particular safeguarding concern and approved by governors)</li>
<li>Any area where individuals have a heightened expectation of privacy</li>
</ul>
<p>A plan showing all camera locations is maintained by {{headteacher_name}} and is available to the DPO and governors on request.</p>

<h2>6. Signage</h2>
<p>Clear and prominent signs are displayed at all entrances to the school site and in monitored areas. Signs include:</p>
<div style="border:2px solid #333;padding:15px;margin:15px 0;max-width:400px;">
<p style="font-size:1.1em;font-weight:bold;margin:0 0 5px 0;">CCTV IN OPERATION</p>
<p style="margin:0 0 5px 0;">Images are being monitored and recorded for the purposes of security, safeguarding and crime prevention.</p>
<p style="margin:0 0 5px 0;"><strong>Data Controller:</strong> {{school_name}}</p>
<p style="margin:0 0 5px 0;"><strong>Contact:</strong> {{dpo_name}}, {{dpo_email}}</p>
<p style="margin:0;font-size:0.9em;">For further information, please see our CCTV Policy available from the school office or website.</p>
</div>

<h2>7. Storage, Security and Retention</h2>

<h3>7.1 Storage</h3>
<ul>
<li>Footage is recorded on {{storage_location}}</li>
<li>Recording equipment is housed in a secure, locked location with restricted access</li>
<li>Remote access (if enabled) is via encrypted VPN with MFA</li>
</ul>

<h3>7.2 Security</h3>
<ul>
<li>System access is password-protected with unique credentials for each authorised user</li>
<li>Access is logged (who accessed the system, when, and what footage was viewed)</li>
<li>The system is maintained and updated by {{cctv_system_provider}} under a data processing agreement</li>
<li>Firmware and software are kept up to date to address security vulnerabilities</li>
</ul>

<h3>7.3 Retention</h3>
<ul>
<li>Footage is retained for <strong>{{retention_days}} days</strong> on a rolling basis and is then automatically overwritten</li>
<li>This retention period has been assessed as proportionate to the system''s purposes</li>
<li>Footage may be retained beyond this period ONLY where it is specifically required for: a subject access request; a police investigation; an insurance claim; a disciplinary/complaints investigation; or a legal proceeding</li>
<li>Extended-retention footage is stored securely with documented justification and a review date</li>
</ul>

<h2>8. Access to Footage</h2>

<h3>8.1 Authorised Personnel</h3>
<p>Live and recorded footage may only be viewed by:</p>
<ul>
<li>Headteacher ({{headteacher_name}})</li>
<li>Site Manager / CCTV manager</li>
<li>Deputy Headteacher (in Headteacher''s absence)</li>
<li>DPO (for compliance monitoring)</li>
</ul>
<p>Viewing for investigation purposes must be authorised by the Headteacher (or DPO for data protection matters) and documented in an access log.</p>

<h3>8.2 Disclosure to Third Parties</h3>
<p>Footage may be disclosed to:</p>
<ul>
<li><strong>Police:</strong> Upon formal written request (s.29 DPA 2018 exemption or court order). We may voluntarily disclose for crime prevention/detection purposes after a balancing test.</li>
<li><strong>Insurers:</strong> In relation to a specific claim, under a data processing agreement</li>
<li><strong>Legal advisors:</strong> For ongoing legal proceedings</li>
<li><strong>Parents/pupils:</strong> Via a Subject Access Request (see Section 9)</li>
</ul>
<p>All disclosures are recorded in the CCTV access log.</p>

<h2>9. Subject Access Requests (SARs) for CCTV Footage</h2>
<p>Individuals recorded on CCTV have the right to request access to footage of themselves under Article 15 UK GDPR. To make a SAR:</p>
<ol>
<li>Submit a request in writing to the DPO ({{dpo_email}})</li>
<li>Provide sufficient detail to locate the footage: date, approximate time, location/camera area, description of yourself or the data subject (for parent requests on behalf of a child)</li>
<li>We will verify the requester''s identity before disclosure</li>
<li>We will respond within one calendar month</li>
<li><strong>Third-party redaction:</strong> Where footage contains images of other identifiable individuals, we will redact (blur/mask) those individuals before disclosure, unless they have consented or disclosure is otherwise lawful</li>
<li>Footage will normally be provided as a video file on encrypted media or via secure file transfer</li>
</ol>

<h2>10. Covert Surveillance</h2>
<p>Covert CCTV surveillance (without signage or the knowledge of those being monitored) will only be used in <strong>exceptional circumstances</strong> where:</p>
<ul>
<li>There is a reasonable suspicion of criminal activity or serious misconduct</li>
<li>Overt surveillance would prejudice the investigation</li>
<li>It has been authorised in writing by the Headteacher, in consultation with the DPO and the Chair of Governors</li>
<li>A specific DPIA has been completed for the covert operation</li>
<li>The surveillance is proportionate, time-limited, and targeted</li>
<li>Legal advice has been obtained where appropriate</li>
</ul>
<p>Covert surveillance must comply with the Regulation of Investigatory Powers Act 2000 (RIPA) if directed by a public authority, or the Protection of Freedoms Act 2012 / Surveillance Camera Code otherwise.</p>

<h2>11. Audio Recording</h2>
<p>The CCTV system [does / does not] record audio. If audio recording is enabled, this represents an additional privacy intrusion and must be specifically justified in the DPIA. Audio is only used where visual recording alone is insufficient for the stated purpose.</p>

<h2>12. Review and Audit</h2>
<ul>
<li>This policy is reviewed annually by the DPO and approved by the governing body</li>
<li>The DPIA is reviewed annually or when changes are made to the system</li>
<li>Access logs are audited termly by the DPO</li>
<li>Camera positioning is reviewed annually to ensure continued proportionality</li>
<li>The system provider''s data processing agreement is reviewed annually</li>
</ul>

<h2>13. Complaints</h2>
<p>If you have concerns about the school''s use of CCTV, contact {{dpo_name}} at {{dpo_email}}. You may also complain to the ICO (ico.org.uk, 0303 123 1113) or the Surveillance Camera Commissioner.</p>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Last reviewed: {{review_date}} | Next review due: one year from review date</p>'
),

-- ============================================================
-- 10. FOI PUBLICATION SCHEME
-- ============================================================
(
  gen_random_uuid(),
  'generic_doc',
  'Freedom of Information Publication Scheme (Comprehensive)',
  'ICO Model Publication Scheme for schools with all 7 classes of information, school-specific examples, charging policy, commonly used exemptions, FOI request procedure, internal review, and ICO complaint route.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  NULL,
  'FOIA 2000 / ICO Model Publication Scheme for Schools',
  '{"required_fields": ["school_name", "school_address", "headteacher_name", "review_date", "school_email", "school_phone", "school_website"], "optional_fields": ["trust_name", "foi_officer_name", "foi_officer_email"]}',
  '<h1>Freedom of Information Act 2000: Publication Scheme</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>FOI Contact</strong></td><td style="padding:8px;border:1px solid #ccc;">{{foi_officer_name}}, {{foi_officer_email}} (or {{school_email}})</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date Adopted</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Introduction</h2>
<p>{{school_name}} has adopted the Information Commissioner''s Office (ICO) Model Publication Scheme. This means we are committed to making certain information routinely available to the public, and will explain how to access it and whether any charges apply.</p>
<p>This scheme covers information already published and information which is to be published in the future. All information in the scheme is available on our website at {{school_website}} or in hard copy from the school office.</p>

<h2>2. Categories of Information Published</h2>
<p>The publication scheme is structured around the ICO''s seven classes of information:</p>

<h3>Class 1: Who We Are and What We Do</h3>
<p><em>Organisational information, structures, locations and contacts</em></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Information</th>
<th style="padding:6px;border:1px solid #ccc;">How to Access</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">School name, address, phone number, email, website</td><td style="padding:6px;border:1px solid #ccc;">Website / office</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">School prospectus and admissions arrangements</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Names of Headteacher and senior leadership team</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Names and categories of governors/trustees, terms of office</td><td style="padding:6px;border:1px solid #ccc;">Website / GIAS</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Governing body structure and terms of reference for committees</td><td style="padding:6px;border:1px solid #ccc;">Website / school office</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Instrument of Government / Articles of Association (academies)</td><td style="padding:6px;border:1px solid #ccc;">Website / school office</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Register of business and pecuniary interests of governors</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Session times and term dates</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Ofsted reports</td><td style="padding:6px;border:1px solid #ccc;">Ofsted website / school website</td></tr>
</tbody>
</table>

<h3>Class 2: What We Spend and How We Spend It</h3>
<p><em>Financial information relating to projected and actual income and expenditure, procurement, contracts and financial audit</em></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Information</th>
<th style="padding:6px;border:1px solid #ccc;">How to Access</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Annual budget plan and financial statements</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Capital funding and expenditure</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Procurement and contracts exceeding 10,000</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Pupil Premium strategy statement and impact report</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Sports Premium funding and impact (primary)</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Recovery Premium / National Tutoring Programme spend</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Staff pay structure (pay ranges by grade, not individual salaries)</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Governor allowances paid</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
</tbody>
</table>

<h3>Class 3: What Our Priorities Are and How We Are Doing</h3>
<p><em>Strategies and plans, performance indicators, audits, inspections and reviews</em></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Information</th>
<th style="padding:6px;border:1px solid #ccc;">How to Access</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">School Development/Improvement Plan (non-confidential summary)</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Ofsted reports and school response</td><td style="padding:6px;border:1px solid #ccc;">Ofsted website / school website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Performance data (published school results – DfE performance tables)</td><td style="padding:6px;border:1px solid #ccc;">DfE website / school website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">SIAMS report (church schools)</td><td style="padding:6px;border:1px solid #ccc;">SIAMS website / school website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Accessibility Plan</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Equality objectives and information</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
</tbody>
</table>

<h3>Class 4: How We Make Decisions</h3>
<p><em>Decision-making processes and records of decisions</em></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Information</th>
<th style="padding:6px;border:1px solid #ccc;">How to Access</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Governing body meeting minutes (approved, non-confidential parts)</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Admissions criteria and arrangements</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Scheme of delegation</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
</tbody>
</table>

<h3>Class 5: Our Policies and Procedures</h3>
<p><em>Current written protocols, policies and procedures for delivering our services and responsibilities</em></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Information</th>
<th style="padding:6px;border:1px solid #ccc;">How to Access</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Safeguarding / Child Protection Policy</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Data Protection Policy and Privacy Notices</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Behaviour Policy (including anti-bullying)</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">SEND Policy and Information Report</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Charging and Remissions Policy</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Health and Safety Policy</td><td style="padding:6px;border:1px solid #ccc;">Website / school office</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Complaints Procedure</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Staff Code of Conduct</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Whistleblowing Policy</td><td style="padding:6px;border:1px solid #ccc;">Website / school office</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Equality Policy / Equality Objectives</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">CCTV Policy</td><td style="padding:6px;border:1px solid #ccc;">Website / school office</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Freedom of Information Publication Scheme (this document)</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Online Safety Policy</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Supporting Pupils with Medical Conditions Policy</td><td style="padding:6px;border:1px solid #ccc;">Website / school office</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Curriculum Policy</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">RSE (Relationships and Sex Education) Policy</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
</tbody>
</table>

<h3>Class 6: Lists and Registers</h3>
<p><em>Information held in registers required by law and other lists and registers relating to the functions of the authority</em></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Information</th>
<th style="padding:6px;border:1px solid #ccc;">How to Access</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Curriculum subjects (what is taught in each year group)</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Register of pupils'' attendance (summary statistics, not individual records)</td><td style="padding:6px;border:1px solid #ccc;">Published in governors'' annual report / DfE tables</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Disclosure log (previous FOI requests and responses, where appropriate)</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Asset register (school property and equipment)</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
</tbody>
</table>

<h3>Class 7: The Services We Offer</h3>
<p><em>Information about the services we offer, including leaflets, guidance and newsletters</em></p>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">Information</th>
<th style="padding:6px;border:1px solid #ccc;">How to Access</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;">Extracurricular clubs and activities</td><td style="padding:6px;border:1px solid #ccc;">Website / school newsletter</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Breakfast club / after-school club provision</td><td style="padding:6px;border:1px solid #ccc;">Website / school office</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">School meals service and menus</td><td style="padding:6px;border:1px solid #ccc;">Website</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">Lettings information (facilities available for hire)</td><td style="padding:6px;border:1px solid #ccc;">School office on request</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;">School newsletters and communications</td><td style="padding:6px;border:1px solid #ccc;">Website / email</td></tr>
</tbody>
</table>

<h2>3. Charges</h2>
<p>Most information is available free of charge on our website. Where charges apply:</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Item</th>
<th style="padding:8px;border:1px solid #ccc;">Charge</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Photocopied documents (A4 black and white)</td><td style="padding:8px;border:1px solid #ccc;">10p per page</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Photocopied documents (A4 colour)</td><td style="padding:8px;border:1px solid #ccc;">20p per page</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Postage</td><td style="padding:8px;border:1px solid #ccc;">At cost (Royal Mail rates)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Information provided on USB/CD</td><td style="padding:8px;border:1px solid #ccc;">At cost of media</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">School prospectus</td><td style="padding:8px;border:1px solid #ccc;">Free</td></tr>
</tbody>
</table>
<p>We will advise you of any charge before providing the information.</p>

<h2>4. Requesting Information Not in the Publication Scheme</h2>
<p>If the information you require is not available through this publication scheme, you can make a Freedom of Information request.</p>

<h3>4.1 How to Make an FOI Request</h3>
<ul>
<li>Your request must be in <strong>writing</strong> (letter or email)</li>
<li>Send to: {{school_email}} or {{school_address}}</li>
<li>Clearly state your name and correspondence address (email is acceptable)</li>
<li>Describe the information you require in sufficient detail for us to identify it</li>
<li>You do NOT need to mention the Freedom of Information Act or give a reason for your request</li>
</ul>

<h3>4.2 Response Timescale</h3>
<p>We will respond within <strong>20 working days</strong> of receiving your request. If we need to clarify your request, the 20-day clock starts from the date of clarification.</p>

<h3>4.3 Fees</h3>
<p>We may charge a fee if the cost of complying exceeds the ''appropriate limit'' (18 hours of staff time at 25/hour = 450 for non-central government bodies). If the estimated cost exceeds 450, we may:</p>
<ul>
<li>Refuse the request, OR</li>
<li>Offer to provide the information for a fee covering the estimated cost</li>
</ul>

<h2>5. Exemptions</h2>
<p>Some information may be withheld under exemptions in the FOIA 2000. Exemptions commonly used by schools include:</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Section</th>
<th style="padding:8px;border:1px solid #ccc;">Exemption</th>
<th style="padding:8px;border:1px solid #ccc;">School Examples</th>
<th style="padding:8px;border:1px solid #ccc;">Type</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">s.21</td><td style="padding:8px;border:1px solid #ccc;">Information accessible by other means</td><td style="padding:8px;border:1px solid #ccc;">Ofsted reports (on Ofsted website), performance data (DfE website)</td><td style="padding:8px;border:1px solid #ccc;">Absolute</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">s.36</td><td style="padding:8px;border:1px solid #ccc;">Prejudice to effective conduct of public affairs</td><td style="padding:8px;border:1px solid #ccc;">Draft policies under discussion, informal advice to governors</td><td style="padding:8px;border:1px solid #ccc;">Qualified (public interest test)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">s.40</td><td style="padding:8px;border:1px solid #ccc;">Personal data</td><td style="padding:8px;border:1px solid #ccc;">Individual staff salaries, pupil records, parent details, disciplinary outcomes for named individuals</td><td style="padding:8px;border:1px solid #ccc;">Absolute (own data = SAR; third party = public interest test)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">s.41</td><td style="padding:8px;border:1px solid #ccc;">Information provided in confidence</td><td style="padding:8px;border:1px solid #ccc;">Safeguarding referrals, professional reports provided in confidence (e.g., EP reports marked confidential)</td><td style="padding:8px;border:1px solid #ccc;">Absolute</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">s.43</td><td style="padding:8px;border:1px solid #ccc;">Commercial interests</td><td style="padding:8px;border:1px solid #ccc;">Tender evaluation details, commercial pricing from suppliers, contract terms with specific financial details</td><td style="padding:8px;border:1px solid #ccc;">Qualified (public interest test)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">s.38</td><td style="padding:8px;border:1px solid #ccc;">Health and safety</td><td style="padding:8px;border:1px solid #ccc;">Security arrangements, detailed CCTV locations (if disclosure would compromise security)</td><td style="padding:8px;border:1px solid #ccc;">Qualified (public interest test)</td></tr>
</tbody>
</table>
<p>Where a qualified exemption is applied, we will conduct a public interest test and explain our reasoning in our response.</p>

<h2>6. Refusing a Request</h2>
<p>If we refuse your request (in whole or in part), we will issue a refusal notice within 20 working days explaining:</p>
<ul>
<li>Which exemption(s) apply</li>
<li>Why the exemption applies (including public interest test reasoning for qualified exemptions)</li>
<li>Your right to request an internal review</li>
<li>Your right to complain to the ICO</li>
</ul>

<h2>7. Internal Review</h2>
<p>If you are dissatisfied with our response, you may request an <strong>internal review</strong>:</p>
<ul>
<li>Write to: {{headteacher_name}}, {{school_address}} (or {{school_email}})</li>
<li>State why you are dissatisfied and which response you are challenging</li>
<li>We will acknowledge your review request within 5 working days</li>
<li>The review will be conducted by someone not involved in the original decision (typically the Chair of Governors or a senior member of staff not previously involved)</li>
<li>We will complete the internal review within <strong>20 working days</strong> (or 40 working days in exceptional circumstances with explanation)</li>
</ul>

<h2>8. Complaint to the ICO</h2>
<p>If you remain dissatisfied after the internal review, you may complain to the Information Commissioner:</p>
<ul>
<li><strong>Online:</strong> <em>ico.org.uk/make-a-complaint/</em></li>
<li><strong>Telephone:</strong> 0303 123 1113</li>
<li><strong>Post:</strong> Information Commissioner''s Office, Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF</li>
</ul>
<p>The ICO will normally expect you to have completed our internal review process before they will investigate.</p>

<h2>9. Environmental Information</h2>
<p>Requests for environmental information (e.g., asbestos surveys, energy consumption data, grounds maintenance practices) are handled under the Environmental Information Regulations 2004 (EIR), not FOIA. The EIR provides a similar right of access but with different exemptions. Requests for environmental information can be made verbally or in writing.</p>

<h2>10. Data Protection / Subject Access Requests</h2>
<p>If your request is for your own personal data (or your child''s educational record), this is a Subject Access Request (SAR) under UK GDPR, not an FOI request. SARs should be directed to the Data Protection Officer: {{school_email}}. There is no charge for a SAR and we must respond within one calendar month.</p>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Date adopted: {{review_date}} | This publication scheme is reviewed annually.</p>'
)

ON CONFLICT DO NOTHING;
