-- ============================================================
-- COMPLIANCE TEMPLATES: HR, GOVERNANCE, EQUALITY, SEND,
-- ADMISSIONS, ONLINE SAFETY, BEHAVIOUR & FINANCE
-- Migration: 20260305_compliance_templates_hr_gov_eq.sql
--
-- 14 production-ready statutory/recommended templates for
-- UK schools (England jurisdiction).
--
-- Legislation sources:
--   ACAS Code of Practice 2015, Employment Rights Act 1996,
--   Employment Relations Act 1999, Employment Act 2002,
--   Education Act 1996/2002/2011, Education (School Teachers'
--   Appraisal) (England) Regulations 2012, School Governance
--   (Roles, Procedures and Allowances) Regulations 2013,
--   Equality Act 2010, SEND Code of Practice 2015, Children
--   and Families Act 2014, School Admissions Code 2021,
--   KCSIE 2024, DfE Behaviour in Schools 2024, Protection
--   from Harassment Act 1997, STPCD 2024
--
-- All single quotes in content are escaped as '' per PostgreSQL.
-- ============================================================

-- ============================================================
-- 1. STAFF DISCIPLINARY POLICY & PROCEDURE
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Staff Disciplinary Policy and Procedure',
  'Full ACAS Code of Practice compliant disciplinary procedure for all school staff, including gross misconduct definitions, staged warnings, and appeal process.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'ACAS-DISC-2015',
  'ACAS Code of Practice on Disciplinary and Grievance Procedures 2015 / Employment Rights Act 1996 / Employment Act 2002 / Education Act 2002',
  '{"required_fields":["school_name","headteacher_name","hr_contact","review_date"],"optional_fields":["chair_of_governors","trade_union_rep","appeal_panel_chair"]}',
  '<h1>Staff Disciplinary Policy and Procedure</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Policy Owner:</strong> {{headteacher_name}}<br/>
<strong>HR Contact:</strong> {{hr_contact}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Purpose</h2>
<p>This policy sets out the framework for managing disciplinary matters fairly and consistently at {{school_name}}. It is designed to help and encourage all employees to achieve and maintain acceptable standards of conduct while ensuring that any disciplinary action is handled in a fair, consistent and timely manner.</p>

<h2>2. Scope</h2>
<p>2.1 This policy applies to all employees of {{school_name}}, including teaching staff, support staff and temporary employees who have completed their probationary period.</p>
<p>2.2 Teachers may also be subject to the Teachers'' Standards (DfE 2011) and Part 2 (Personal and Professional Conduct) in particular.</p>
<p>2.3 This procedure does not apply to capability/performance matters, which are dealt with under the separate Staff Capability Procedure.</p>
<p>2.4 Allegations of abuse against children are dealt with under safeguarding procedures (KCSIE 2024) and may run concurrently with this procedure.</p>

<h2>3. Legal Framework</h2>
<p>3.1 This policy has been developed in accordance with:</p>
<ul>
<li>ACAS Code of Practice on Disciplinary and Grievance Procedures (2015)</li>
<li>Employment Rights Act 1996</li>
<li>Employment Act 2002</li>
<li>Employment Relations Act 1999 (right to be accompanied)</li>
<li>Education Act 2002 (regulations relating to school staffing)</li>
<li>Equality Act 2010 (non-discrimination)</li>
<li>Teachers'' Standards (DfE 2011)</li>
</ul>

<h2>4. Principles</h2>
<p>4.1 <strong>Consistency:</strong> All cases of a similar nature will be dealt with consistently across the school.</p>
<p>4.2 <strong>Fairness and Natural Justice:</strong> No employee will be dismissed for a first offence except in cases of gross misconduct. Employees will be fully informed of the case against them and given the opportunity to respond before any decision is made.</p>
<p>4.3 <strong>No Unreasonable Delay:</strong> Matters will be dealt with promptly. Investigations will be completed without unnecessary delay, and hearings will be arranged at the earliest reasonable opportunity.</p>
<p>4.4 <strong>Confidentiality:</strong> All parties involved in disciplinary proceedings are expected to maintain confidentiality throughout.</p>
<p>4.5 <strong>Support:</strong> The school will consider whether support (such as counselling or occupational health referral) is appropriate at any stage.</p>

<h2>5. Investigation</h2>
<p>5.1 Before any formal disciplinary action is taken, an investigation will be carried out to establish the facts.</p>
<p>5.2 The headteacher (or delegated senior leader) will appoint an <strong>Investigating Officer</strong> who has had no prior involvement in the matter.</p>
<p>5.3 The Investigating Officer will:</p>
<ul>
<li>Gather all relevant evidence, including documents, witness statements and any physical evidence</li>
<li>Interview witnesses and the employee under investigation</li>
<li>Inform the employee in writing of the nature of the allegations and that an investigation is being conducted</li>
<li>Allow the employee to be accompanied at an investigatory interview (although this is not a statutory right at investigation stage, the school will normally permit it as good practice)</li>
<li>Complete the investigation within 20 working days where reasonably practicable</li>
<li>Prepare a written investigation report with findings and recommendation</li>
</ul>
<p>5.4 At the conclusion of the investigation, the Investigating Officer will recommend one of the following:</p>
<ul>
<li>No further action required</li>
<li>Informal management action (see Section 6)</li>
<li>Formal disciplinary hearing (see Sections 7-9)</li>
</ul>

<h2>6. Informal Stage</h2>
<p>6.1 Where misconduct is minor and there is no previous disciplinary history, the matter may be dealt with informally through a management discussion.</p>
<p>6.2 The line manager will meet with the employee to:</p>
<ul>
<li>Explain the concern and expected standard of conduct</li>
<li>Listen to the employee''s response</li>
<li>Agree any support or training needed</li>
<li>Set clear expectations for future conduct</li>
<li>Record the discussion in a brief file note (not placed on the disciplinary record)</li>
</ul>
<p>6.3 A verbal warning given at the informal stage is not a formal sanction and does not form part of the employee''s disciplinary record.</p>

<h2>7. Formal Stage 1 -- First Written Warning</h2>
<p>7.1 Where there is evidence of misconduct, or where informal action has not resulted in improvement, the employee will be invited to a formal disciplinary hearing.</p>
<p>7.2 The employee will receive written notice of the hearing at least <strong>5 working days</strong> in advance, which will include:</p>
<ul>
<li>The specific allegations and the evidence upon which they are based</li>
<li>Copies of all documentary evidence to be relied upon</li>
<li>The names of any management witnesses</li>
<li>The right to be accompanied (see Section 11)</li>
<li>The potential outcomes of the hearing</li>
</ul>
<p>7.3 If the allegations are upheld, a <strong>First Written Warning</strong> will be issued. The warning letter will specify:</p>
<ul>
<li>The nature of the misconduct</li>
<li>The improvement required and the timescale</li>
<li>The consequences of further misconduct</li>
<li>The duration of the warning: <strong>6 months</strong> from the date of issue, after which it will be disregarded for disciplinary purposes (but retained on file)</li>
<li>The right to appeal (see Section 10)</li>
</ul>

<h2>8. Formal Stage 2 -- Final Written Warning</h2>
<p>8.1 Where there is further misconduct during the currency of a first written warning, or where the misconduct is sufficiently serious to warrant it (but falls short of gross misconduct), the employee will be invited to a formal disciplinary hearing.</p>
<p>8.2 The same procedural requirements as Stage 1 apply regarding notice, evidence disclosure and right to be accompanied.</p>
<p>8.3 If the allegations are upheld, a <strong>Final Written Warning</strong> will be issued. The warning letter will specify:</p>
<ul>
<li>The nature of the misconduct</li>
<li>The improvement required</li>
<li>That any further misconduct may result in dismissal</li>
<li>The duration of the warning: <strong>12 months</strong> from the date of issue</li>
<li>The right to appeal</li>
</ul>

<h2>9. Formal Stage 3 -- Dismissal</h2>
<p>9.1 Dismissal will normally only be considered where:</p>
<ul>
<li>The employee commits an act of gross misconduct; or</li>
<li>The employee''s conduct has failed to improve and a final written warning is in force; or</li>
<li>The cumulative effect of misconduct is such that dismissal is a reasonable response</li>
</ul>
<p>9.2 Only the headteacher (or, in the case of the headteacher, the Chair of Governors with a panel of governors) has the authority to dismiss.</p>
<p>9.3 The dismissal letter will confirm:</p>
<ul>
<li>The reasons for dismissal</li>
<li>The effective date of dismissal and notice period (or payment in lieu of notice)</li>
<li>The right to appeal</li>
<li>Any post-employment restrictions (e.g. return of school property)</li>
</ul>

<h2>10. Gross Misconduct</h2>
<p>10.1 Gross misconduct is misconduct of such a serious nature that it fundamentally breaches the employment contract and destroys the trust and confidence the school has in the employee. The following are examples (this list is not exhaustive):</p>
<ul>
<li>Theft, fraud, or deliberate falsification of records</li>
<li>Physical violence or threats of violence</li>
<li>Safeguarding breach or failure to follow child protection procedures</li>
<li>Serious insubordination or refusal to carry out reasonable instructions</li>
<li>Being under the influence of alcohol or illegal drugs at work</li>
<li>Serious breach of confidentiality (including data protection breaches)</li>
<li>Serious damage to school property</li>
<li>Bringing the school into serious disrepute</li>
<li>Serious breach of trust and confidence</li>
<li>Deliberate falsification of qualifications, employment history or other information on appointment</li>
<li>Serious breaches of health and safety rules that endanger others</li>
<li>Discrimination, harassment or victimisation on grounds of a protected characteristic</li>
<li>Serious misuse of the school''s IT systems or social media in a way that brings the school into disrepute or constitutes a safeguarding risk</li>
</ul>
<p>10.2 In cases of alleged gross misconduct, the employee may be summarily dismissed (i.e., without notice or payment in lieu of notice) if the allegation is upheld following a full investigation and hearing.</p>

<h2>11. Right to be Accompanied</h2>
<p>11.1 Under Section 10 of the Employment Relations Act 1999, the employee has the statutory right to be accompanied at <strong>all formal disciplinary hearings</strong> by:</p>
<ul>
<li>A trade union representative; or</li>
<li>A work colleague employed by the school</li>
</ul>
<p>11.2 The companion may address the hearing, put forward the employee''s case, sum up, respond on the employee''s behalf, and confer with the employee during the hearing. The companion may not answer questions on behalf of the employee.</p>
<p>11.3 If the employee''s chosen companion is unavailable on the date proposed, the hearing will be rescheduled to a date within 5 working days of the original date, provided this is reasonable.</p>

<h2>12. Right of Appeal</h2>
<p>12.1 The employee has the right to appeal against any formal disciplinary sanction (written warning, final written warning, or dismissal).</p>
<p>12.2 Appeals must be submitted <strong>in writing within 5 working days</strong> of receiving the outcome letter, stating the grounds for appeal.</p>
<p>12.3 Grounds for appeal may include:</p>
<ul>
<li>The finding or sanction was unfair or disproportionate</li>
<li>New evidence has come to light</li>
<li>There was a procedural flaw that materially affected the outcome</li>
<li>The sanction was inconsistent with previous cases</li>
</ul>
<p>12.4 Appeals against dismissal will be heard by a panel of governors who have had no prior involvement in the case (the Staff Dismissal Appeal Committee).</p>
<p>12.5 Appeals against warnings will be heard by a senior leader or governor(s) who were not involved in the original decision.</p>
<p>12.6 The appeal hearing may uphold the original decision, reduce the sanction, or overturn the decision entirely.</p>

<h2>13. Suspension</h2>
<p>13.1 Suspension is a <strong>neutral act</strong> and does not imply guilt. It is not a disciplinary sanction.</p>
<p>13.2 Suspension will only be considered where it is necessary to:</p>
<ul>
<li>Protect a child or children (safeguarding)</li>
<li>Protect the integrity of the investigation (evidence preservation)</li>
<li>Prevent further potential misconduct</li>
</ul>
<p>13.3 Alternatives to suspension (such as temporary redeployment to different duties or a different location) will be considered before suspension is imposed.</p>
<p>13.4 Suspension will be <strong>on full pay</strong> and will be reviewed at least every <strong>3 weeks</strong> by the headteacher (or Chair of Governors if the headteacher is suspended).</p>
<p>13.5 During suspension, the employee will be informed of:</p>
<ul>
<li>The reason for suspension</li>
<li>The conditions of suspension (e.g. not to enter school premises, not to contact colleagues/witnesses)</li>
<li>A named contact person for welfare and communication purposes</li>
</ul>

<h2>14. Record Keeping</h2>
<p>14.1 Records of all disciplinary proceedings will be kept securely in the employee''s confidential personnel file, including:</p>
<ul>
<li>Investigation notes, witness statements, and the investigation report</li>
<li>Hearing minutes and supporting documentation</li>
<li>Outcome letters (warning letters, dismissal letters)</li>
<li>Appeal submissions and outcomes</li>
</ul>
<p>14.2 Records will be retained in accordance with the school''s data retention policy and IRMS guidance for school records.</p>

<h2>15. Teacher-Specific Provisions</h2>
<p>15.1 Where a teacher is dismissed or resigns while under investigation for misconduct, the headteacher must consider whether a referral to the <strong>Teaching Regulation Agency (TRA)</strong> is appropriate, as required by the Teachers'' Disciplinary (England) Regulations 2012.</p>
<p>15.2 Referral to the TRA is mandatory where the reason for dismissal or resignation relates to unacceptable professional conduct, conduct that may bring the profession into disrepute, conviction of a relevant offence, or a prohibition order from another jurisdiction.</p>

<h2>16. Criminal Proceedings</h2>
<p>16.1 Where an employee is subject to criminal proceedings, the school may proceed with its own disciplinary investigation and hearing. The standard of proof in disciplinary proceedings is the <strong>balance of probabilities</strong>, not the criminal standard of beyond reasonable doubt.</p>
<p>16.2 The school will not delay disciplinary action simply because criminal proceedings are pending, unless specifically requested by the police (and even then, the delay should be limited and reviewed regularly).</p>

<h2>17. Equality and Monitoring</h2>
<p>17.1 This policy will be applied fairly and consistently to all employees regardless of any protected characteristic under the Equality Act 2010.</p>
<p>17.2 Where an employee has a disability, the school will consider whether reasonable adjustments are required to the disciplinary process.</p>
<p>17.3 The governing body will monitor the use of disciplinary procedures by protected characteristic annually.</p>

<h2>18. Review</h2>
<p>18.1 This policy will be reviewed annually by the governing body or whenever there is a change in relevant legislation or ACAS guidance.</p>
<p>18.2 Next review date: {{review_date}}</p>'
);

-- ============================================================
-- 2. STAFF GRIEVANCE PROCEDURE
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Staff Grievance Procedure',
  'Full ACAS Code of Practice compliant grievance procedure covering informal resolution, formal stages, mediation, and appeal to governors.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'ACAS-GRIEV-2015',
  'ACAS Code of Practice on Disciplinary and Grievance Procedures 2015 / Employment Rights Act 1996',
  '{"required_fields":["school_name","headteacher_name","chair_of_governors","review_date"],"optional_fields":["hr_contact","mediation_service"]}',
  '<h1>Staff Grievance Procedure</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Policy Owner:</strong> {{headteacher_name}}<br/>
<strong>Chair of Governors:</strong> {{chair_of_governors}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Purpose</h2>
<p>This procedure provides a framework for employees of {{school_name}} to raise concerns, problems or complaints about their employment in a fair and timely manner. The school is committed to resolving grievances as close to the point of origin and as quickly as possible.</p>

<h2>2. Scope</h2>
<p>2.1 This procedure applies to all employees of {{school_name}} and covers any employment-related concern, including but not limited to:</p>
<ul>
<li>Terms and conditions of employment</li>
<li>Working conditions and environment</li>
<li>Working relationships and interpersonal issues</li>
<li>Application of school policies and procedures</li>
<li>Treatment by managers, colleagues or other parties</li>
<li>Management decisions affecting the employee</li>
<li>Concerns about equal opportunities</li>
</ul>
<p>2.2 <strong>This procedure does NOT cover:</strong></p>
<ul>
<li><strong>Whistleblowing:</strong> Disclosures of wrongdoing in the public interest are dealt with under the separate Whistleblowing Policy (Public Interest Disclosure Act 1998)</li>
<li><strong>Collective grievances:</strong> Matters affecting a group of employees should be raised through trade union representatives via the collective consultation process</li>
<li><strong>Complaints by or about pupils/parents:</strong> These are dealt with under the school''s Complaints Procedure</li>
<li><strong>Matters subject to other statutory procedures:</strong> e.g. redundancy consultation, TUPE</li>
</ul>

<h2>3. Legal Framework</h2>
<ul>
<li>ACAS Code of Practice on Disciplinary and Grievance Procedures (2015)</li>
<li>Employment Rights Act 1996 (right not to suffer detriment for raising a grievance)</li>
<li>Employment Act 2002</li>
<li>Equality Act 2010 (where the grievance relates to discrimination)</li>
</ul>

<h2>4. Principles</h2>
<p>4.1 The school encourages open communication and employees should not feel that raising a genuine concern will result in any detriment.</p>
<p>4.2 Grievances will be dealt with promptly, fairly, and confidentially.</p>
<p>4.3 Employees have the right to be accompanied at all formal stages (see Section 8).</p>
<p>4.4 All parties are expected to act reasonably and in good faith throughout.</p>

<h2>5. Informal Stage</h2>
<p>5.1 Many concerns can be resolved through informal discussion. In the first instance, the employee should raise the matter with their <strong>line manager</strong>.</p>
<p>5.2 If the grievance is about the line manager, the employee may approach the headteacher or another appropriate senior leader.</p>
<p>5.3 The manager will:</p>
<ul>
<li>Arrange a private meeting with the employee within 5 working days</li>
<li>Listen carefully to the concern</li>
<li>Investigate the matter informally as appropriate</li>
<li>Seek to resolve the matter within <strong>10 working days</strong> of it being raised</li>
<li>Inform the employee of the outcome and any action to be taken</li>
</ul>
<p>5.4 A brief record of the informal discussion and outcome will be kept.</p>

<h2>6. Formal Stage 1 -- Grievance Hearing</h2>
<p>6.1 If the employee is not satisfied with the outcome of the informal stage, or if the matter is too serious for informal resolution, the employee may submit a <strong>formal written grievance</strong>.</p>
<p>6.2 The written grievance should be submitted to:</p>
<ul>
<li>The headteacher; or</li>
<li>The Chair of Governors (if the grievance is about the headteacher)</li>
</ul>
<p>6.3 The written grievance should set out:</p>
<ul>
<li>The nature of the grievance and the facts upon which it is based</li>
<li>Any steps already taken to resolve the matter informally</li>
<li>The outcome the employee is seeking</li>
</ul>
<p>6.4 <strong>Acknowledgement:</strong> The grievance will be acknowledged in writing within <strong>5 working days</strong> of receipt.</p>
<p>6.5 <strong>Grievance Hearing:</strong> A formal grievance hearing will be arranged within <strong>10 working days</strong> of receipt of the written grievance. The employee will receive written confirmation of the date, time, venue, and their right to be accompanied.</p>
<p>6.6 At the hearing, the employee will have the opportunity to:</p>
<ul>
<li>Explain the grievance in full</li>
<li>Present evidence and call witnesses</li>
<li>Be accompanied by a trade union representative or work colleague</li>
</ul>
<p>6.7 The hearing manager may adjourn the hearing to investigate any points raised.</p>
<p>6.8 <strong>Written Response:</strong> The employee will receive a written response within <strong>5 working days</strong> of the hearing, setting out the findings, any actions to be taken, and the right to appeal.</p>

<h2>7. Formal Stage 2 -- Appeal</h2>
<p>7.1 If the employee is not satisfied with the outcome at Stage 1, they may submit a <strong>written appeal within 5 working days</strong> of receiving the Stage 1 outcome.</p>
<p>7.2 The appeal should state clearly the grounds on which the employee is appealing, which may include:</p>
<ul>
<li>The grievance has not been properly investigated or considered</li>
<li>New evidence has come to light</li>
<li>There was a procedural irregularity</li>
<li>The outcome was unreasonable</li>
</ul>
<p>7.3 The appeal will be heard by a panel of <strong>governors who have not been previously involved</strong> in the grievance.</p>
<p>7.4 The appeal hearing will be arranged within <strong>15 working days</strong> of receipt of the appeal.</p>
<p>7.5 The appeal panel may uphold, modify, or overturn the Stage 1 decision.</p>
<p>7.6 A <strong>final written decision</strong> will be provided within <strong>5 working days</strong> of the appeal hearing. This decision is final and there is no further right of appeal within the school.</p>

<h2>8. Right to be Accompanied</h2>
<p>8.1 At all formal stages, the employee has the statutory right (Employment Relations Act 1999, s.10) to be accompanied by:</p>
<ul>
<li>A trade union representative; or</li>
<li>A work colleague employed by the school</li>
</ul>
<p>8.2 The companion may address the hearing, confer with the employee, and sum up the employee''s case, but may not answer questions on behalf of the employee.</p>

<h2>9. Overlapping Grievance and Disciplinary</h2>
<p>9.1 Where an employee raises a grievance during a disciplinary process:</p>
<ul>
<li>If the grievance is related to the disciplinary matter, the disciplinary process may be temporarily suspended while the grievance is dealt with</li>
<li>If the grievance is unrelated, both processes may run concurrently</li>
<li>The decision on whether to suspend the disciplinary process will be made by the headteacher (or Chair if relevant), taking into account ACAS guidance</li>
</ul>

<h2>10. Mediation</h2>
<p>10.1 Mediation may be offered at any stage of the grievance process, with the mutual consent of all parties involved.</p>
<p>10.2 Mediation is a voluntary, confidential process facilitated by a trained and impartial mediator (internal or external).</p>
<p>10.3 If mediation is attempted but does not resolve the grievance, the formal procedure will continue from the point at which it was paused.</p>
<p>10.4 Mediation discussions are confidential and without prejudice; they cannot be referred to in any subsequent proceedings.</p>

<h2>11. Collective Grievances</h2>
<p>11.1 Where a grievance is raised by two or more employees about the same issue, the school may deal with it as a collective grievance.</p>
<p>11.2 Collective grievances should be raised through trade union representatives or an elected spokesperson.</p>
<p>11.3 The same principles of fairness and timeliness apply to collective grievances.</p>

<h2>12. Record Keeping and Confidentiality</h2>
<p>12.1 All grievance records will be treated as confidential and kept securely in accordance with the school''s data retention policy.</p>
<p>12.2 Records of formal grievance proceedings will be retained on the employee''s confidential personnel file.</p>
<p>12.3 Information will only be disclosed to those who need to know in order to investigate or resolve the grievance.</p>

<h2>13. Monitoring and Review</h2>
<p>13.1 The governing body will receive an annual summary (anonymised) of formal grievances raised, to identify any patterns or systemic issues.</p>
<p>13.2 This procedure will be reviewed annually or whenever there is a change in relevant legislation or ACAS guidance.</p>
<p>13.3 Next review date: {{review_date}}</p>'
);

-- ============================================================
-- 3. STAFF CAPABILITY PROCEDURE
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Staff Capability Procedure',
  'Performance management procedure for staff whose work falls below expected standards despite support. Separate from disciplinary (performance not conduct). Compliant with Appraisal Regulations 2012.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DFE-APPRAISAL-2012',
  'Education (School Teachers'' Appraisal) (England) Regulations 2012 / ACAS Guide on Managing Performance / DfE Teacher Appraisal Model Policy',
  '{"required_fields":["school_name","headteacher_name","review_date"],"optional_fields":["hr_contact","teaching_school_hub"]}',
  '<h1>Staff Capability Procedure</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Policy Owner:</strong> {{headteacher_name}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Purpose</h2>
<p>This procedure sets out the process for managing situations where an employee''s performance falls below the expected standard, despite appropriate support having been provided. It is separate from the school''s disciplinary procedure, which deals with matters of conduct rather than capability.</p>

<h2>2. Scope</h2>
<p>2.1 This procedure applies to all employees of {{school_name}} where there are concerns about their ability to perform their role to the required standard.</p>
<p>2.2 This procedure will only be invoked after performance management support has been provided through the normal appraisal process and has been unsuccessful in securing the necessary improvement.</p>
<p>2.3 For teachers, the expected standards are set out in the <strong>Teachers'' Standards (DfE 2011)</strong>. For support staff, the expected standards are defined by their job description and any relevant professional standards.</p>
<p>2.4 <strong>ECTs (Early Career Teachers):</strong> ECTs subject to statutory induction are managed under the separate ECT induction framework (Education (Induction Arrangements for School Teachers) (England) Regulations 2012) and this capability procedure does not apply during the induction period.</p>

<h2>3. Legal Framework</h2>
<ul>
<li>Education (School Teachers'' Appraisal) (England) Regulations 2012</li>
<li>Teachers'' Standards (DfE 2011)</li>
<li>ACAS Guide on Managing Performance</li>
<li>DfE Teacher Appraisal and Capability Model Policy</li>
<li>Employment Rights Act 1996</li>
<li>Equality Act 2010</li>
</ul>

<h2>4. Link to Appraisal</h2>
<p>4.1 The appraisal process is the primary mechanism for identifying and supporting performance improvement. Capability proceedings will only be initiated where:</p>
<ul>
<li>Performance concerns have been identified through the appraisal process or through monitoring</li>
<li>The employee has been made aware of the concerns and the expected standards</li>
<li>Reasonable support, guidance and time to improve have been provided</li>
<li>Performance has not improved to the required standard</li>
</ul>

<h2>5. Support Stage (Informal)</h2>
<p>5.1 Before formal capability proceedings are initiated, the employee''s line manager will hold a <strong>support meeting</strong> to:</p>
<ul>
<li>Clearly explain the areas of concern and the required standard</li>
<li>Listen to the employee''s response and any mitigating factors</li>
<li>Consider whether external factors (health, personal circumstances, workload) are contributing to the performance shortfall</li>
<li>Agree a <strong>Support Plan</strong> with clear, specific and measurable targets</li>
</ul>
<p>5.2 The Support Plan will include:</p>
<ul>
<li>The specific areas for improvement</li>
<li>The standards expected (referencing Teachers'' Standards where applicable)</li>
<li>The support to be provided (mentoring, coaching, CPD, observation opportunities, team teaching, additional planning time, external advisory support)</li>
<li>The monitoring arrangements (lesson observations, work scrutiny, learning walks, data analysis)</li>
<li>A review period of typically <strong>4 to 6 weeks</strong></li>
<li>A scheduled review meeting date</li>
</ul>
<p>5.3 At the review meeting:</p>
<ul>
<li>If satisfactory improvement has been made, the employee returns to normal appraisal with continued monitoring</li>
<li>If some improvement but not yet at the required standard, the support period may be extended by a further 2-4 weeks</li>
<li>If insufficient improvement, the employee will be informed that formal capability proceedings will be initiated</li>
</ul>

<h2>6. Formal Stage 1 -- First Capability Meeting</h2>
<p>6.1 The employee will receive at least <strong>5 working days'' written notice</strong> of the formal capability meeting, including:</p>
<ul>
<li>The areas of concern and evidence</li>
<li>Copies of all relevant documentation (support plan, observation records, monitoring data)</li>
<li>The right to be accompanied by a trade union representative or work colleague</li>
</ul>
<p>6.2 At the meeting, the headteacher (or delegated senior leader) will:</p>
<ul>
<li>Set out the performance concerns and evidence</li>
<li>Allow the employee to respond and present their case</li>
<li>Consider any representations made by the employee or their companion</li>
</ul>
<p>6.3 Possible outcomes:</p>
<ul>
<li>No further action (if concerns are resolved or mitigated)</li>
<li><strong>First Written Warning</strong> with a formal improvement plan containing SMART targets, a monitoring period of <strong>4 to 8 weeks</strong>, specified support measures, and clear criteria for success</li>
</ul>
<p>6.4 The employee will be advised in writing of the outcome and the right to appeal.</p>

<h2>7. Formal Stage 2 -- Second Capability Meeting</h2>
<p>7.1 If, at the end of the Stage 1 monitoring period, performance remains below the required standard, a second formal capability meeting will be convened.</p>
<p>7.2 The same procedural requirements apply as at Stage 1.</p>
<p>7.3 Possible outcomes:</p>
<ul>
<li>Sufficient improvement: warning may be lifted or reduced</li>
<li>Some improvement but not yet sufficient: extended monitoring with <strong>Final Written Warning</strong> and a further monitoring period of <strong>4 to 8 weeks</strong></li>
<li>Insufficient improvement: progression to Stage 3</li>
</ul>
<p>7.4 Additional support measures will be considered and documented at this stage.</p>

<h2>8. Formal Stage 3 -- Dismissal Hearing</h2>
<p>8.1 If performance remains below the required standard at the end of the Stage 2 monitoring period, a <strong>dismissal hearing</strong> will be convened.</p>
<p>8.2 The dismissal hearing will be conducted by the headteacher (or a panel of governors if the headteacher is the employee concerned).</p>
<p>8.3 Possible outcomes:</p>
<ul>
<li>Extend the monitoring period with additional support (in exceptional circumstances only)</li>
<li>Offer redeployment to an alternative post at a lower level (if available and appropriate)</li>
<li><strong>Dismissal</strong> with the appropriate notice period</li>
</ul>
<p>8.4 The employee will be advised in writing of the outcome and the right to appeal.</p>

<h2>9. Fast-Track Procedure</h2>
<p>9.1 Where there are serious concerns about the employee''s performance that are putting pupils'' education, welfare or safety at risk, the procedure may be <strong>fast-tracked</strong> by shortening timeframes or omitting the informal stage.</p>
<p>9.2 The decision to fast-track must be documented with a clear rationale and the employee will be informed of the reasons.</p>

<h2>10. Right to be Accompanied</h2>
<p>10.1 At all formal stages, the employee has the right to be accompanied by a trade union representative or work colleague (Employment Relations Act 1999, s.10).</p>

<h2>11. Right of Appeal</h2>
<p>11.1 The employee has the right to appeal against any formal outcome, including dismissal.</p>
<p>11.2 Appeals must be submitted in writing within <strong>5 working days</strong> of receiving the outcome letter.</p>
<p>11.3 Appeals against dismissal will be heard by the <strong>Staff Dismissal Appeal Committee</strong> of the governing body, comprising governors who have had no prior involvement.</p>
<p>11.4 The appeal panel may uphold, modify, or overturn the original decision.</p>

<h2>12. Teacher-Specific Provisions</h2>
<p>12.1 Unlike misconduct cases, referral to the <strong>Teaching Regulation Agency (TRA)</strong> is not required when a teacher is dismissed for capability reasons alone.</p>
<p>12.2 However, if capability concerns include elements of professional misconduct, TRA referral should be considered.</p>

<h2>13. Absence During Capability</h2>
<p>13.1 If an employee is absent due to sickness during capability proceedings:</p>
<ul>
<li>The procedure may be paused for the duration of the absence</li>
<li>The capability process is not reset by absence; it resumes at the same stage upon return</li>
<li>An occupational health referral may be made to assess fitness to participate</li>
<li>Where absence is prolonged, the school may need to consider whether the absence itself constitutes a capability issue</li>
</ul>

<h2>14. Record Keeping</h2>
<p>14.1 All records relating to capability proceedings will be kept securely and confidentially.</p>
<p>14.2 Support plans, monitoring records, meeting notes and outcome letters will be retained on the employee''s personnel file.</p>

<h2>15. Review</h2>
<p>15.1 This procedure will be reviewed annually by the governing body.</p>
<p>15.2 Next review date: {{review_date}}</p>'
);

-- ============================================================
-- 4. REGISTER OF BUSINESS INTERESTS -- GOVERNORS
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'generic_doc',
  'Register of Business Interests - Governors',
  'Annual declaration of business and personal interests for governors and trustees, per School Governance Regulations 2013. Includes declaration form and register template.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'GOV-REG-2013-R14',
  'School Governance (Roles, Procedures and Allowances) (England) Regulations 2013 / Academies Financial Handbook',
  '{"required_fields":["school_name","governor_name","academic_year","date"],"optional_fields":["clerk_name","trust_name"]}',
  '<h1>Register of Business Interests -- Governors and Trustees</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Academic Year:</strong> {{academic_year}}</p>

<h2>1. Introduction and Legal Requirement</h2>
<p>1.1 Under Regulation 14 of the <strong>School Governance (Roles, Procedures and Allowances) (England) Regulations 2013</strong>, the governing body is required to establish and maintain a register of the business and pecuniary interests of governors and associate members.</p>
<p>1.2 For academy trusts, the <strong>Academy Trust Handbook</strong> (formerly Academies Financial Handbook) requires all members, trustees and local governors to declare interests annually and at each meeting where a potential conflict may arise.</p>
<p>1.3 The purpose of the register is to provide openness and transparency about the interests of those involved in governance, enabling potential conflicts of interest to be identified and managed appropriately.</p>

<h2>2. What Must Be Declared</h2>
<p>2.1 Each governor/trustee must declare the following <strong>relevant business interests</strong>:</p>
<ul>
<li>Directorships, partnerships or other business interests (whether paid or unpaid)</li>
<li>Trusteeships or governorships at other educational establishments or charities</li>
<li>Employment or consultancy with any organisation that does or may supply goods or services to the school</li>
<li>Membership of any organisation that may seek to influence the school''s policies or decisions</li>
<li>Roles in local authority education functions</li>
<li>Any other role or interest which may create, or be perceived to create, a conflict of interest with the governor''s role at the school</li>
</ul>
<p>2.2 Each governor/trustee must also declare the following <strong>personal interests</strong>:</p>
<ul>
<li>Any family relationship (spouse, partner, parent, child, sibling, or cohabitant) with a member of staff at the school</li>
<li>Any family relationship with another governor or trustee</li>
<li>Any family relationship with a supplier or contractor to the school</li>
<li>Any other personal relationship that could constitute a conflict of interest</li>
</ul>
<p>2.3 <strong>Definition of ''relevant business interest'':</strong> any business, commercial or financial interest which could or could be perceived to influence the governor''s judgement when participating in governing body business.</p>

<h2>3. Nil Returns</h2>
<p>3.1 If a governor/trustee has no interests to declare, a <strong>nil return</strong> must still be completed and signed. Failure to return the declaration form (even as a nil return) is a breach of governance requirements.</p>

<h2>4. Timing and Updates</h2>
<p>4.1 All governors/trustees must complete a declaration:</p>
<ul>
<li>On appointment to the governing body</li>
<li>At the start of each academic year (annual renewal)</li>
<li>Within <strong>28 days</strong> of any change in circumstances giving rise to a new interest or the cessation of a previously declared interest</li>
</ul>
<p>4.2 In addition, at the start of each governing body meeting, the Chair will ask whether any governor has an interest to declare in relation to any item on the agenda.</p>

<h2>5. Publication</h2>
<p>5.1 <strong>Maintained schools:</strong> The register of interests must be available for inspection by governors, staff, parents and the local authority at the school during school hours. It is recommended (and required by many LAs) that the register is published on the school''s website.</p>
<p>5.2 <strong>Academy trusts:</strong> The register of interests of members and trustees must be published on the trust''s website. Directors'' interests must also be declared in the annual accounts filed at Companies House.</p>

<h2>6. Managing Conflicts of Interest</h2>
<p>6.1 Where a governor has a declared interest in a matter being discussed:</p>
<ul>
<li>They must declare the interest at the meeting before the item is discussed</li>
<li>They will normally be required to withdraw from the meeting for that item</li>
<li>They will not participate in the vote on that item</li>
<li>Their withdrawal will be recorded in the minutes</li>
</ul>
<p>6.2 In cases of uncertainty, the clerk will advise and the remaining governors will decide by vote whether withdrawal is necessary.</p>

<h2>7. Consequences of Non-Declaration</h2>
<p>7.1 Failure to declare a relevant interest may:</p>
<ul>
<li>Invalidate any decision in which the undisclosed interest was relevant</li>
<li>Constitute a breach of the governor''s duty and the school''s governance framework</li>
<li>Lead to suspension or removal from the governing body</li>
<li>For academy trustees, may constitute a breach of fiduciary duty under company and charity law</li>
</ul>

<h2>8. Declaration Form</h2>
<table border="1" cellpadding="8" cellspacing="0" width="100%">
<thead>
<tr><th>Nature of Interest</th><th>Organisation / Entity</th><th>Relationship to School</th><th>From Date</th><th>To Date (or ongoing)</th></tr>
</thead>
<tbody>
<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</tbody>
</table>

<h2>9. Declaration Statement</h2>
<p>I confirm that the information provided above is a full and accurate declaration of my business and personal interests as at the date of signing. I undertake to notify the clerk to the governing body within 28 days of any change in my circumstances that would require this declaration to be updated.</p>
<p><strong>Name:</strong> {{governor_name}}<br/>
<strong>Signature:</strong> _________________________<br/>
<strong>Date:</strong> {{date}}<br/>
<strong>Role on governing body:</strong> _________________________</p>'
);


-- ============================================================
-- 5. EQUALITY INFORMATION & OBJECTIVES
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Equality Information and Objectives',
  'Published equality information and objectives per Public Sector Equality Duty (Equality Act 2010 s.149) and Specific Duties Regulations 2011. Includes data categories, example objectives, and monitoring framework.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'EA2010-PSED-S149',
  'Equality Act 2010 / The Equality Act 2010 (Specific Duties) Regulations 2011 / DfE Equality Act 2010: Advice for Schools 2014',
  '{"required_fields":["school_name","headteacher_name","equality_lead","review_date"],"optional_fields":["governor_lead","data_year"]}',
  '<h1>Equality Information and Objectives</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Headteacher:</strong> {{headteacher_name}}<br/>
<strong>Equality Lead:</strong> {{equality_lead}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Legal Framework</h2>
<p>1.1 This document fulfils the statutory requirements of the <strong>Equality Act 2010</strong> and the <strong>Equality Act 2010 (Specific Duties) Regulations 2011</strong>.</p>
<p>1.2 Under the <strong>Public Sector Equality Duty (PSED)</strong>, Section 149 of the Equality Act 2010, {{school_name}} must, in the exercise of its functions, have due regard to the need to:</p>
<ol>
<li><strong>Eliminate</strong> discrimination, harassment and victimisation and any other conduct prohibited under the Act</li>
<li><strong>Advance equality of opportunity</strong> between people who share a protected characteristic and people who do not share it</li>
<li><strong>Foster good relations</strong> between people who share a protected characteristic and people who do not share it</li>
</ol>
<p>1.3 Under the <strong>Specific Duties Regulations 2011</strong>, the school must:</p>
<ul>
<li>Publish information annually to demonstrate compliance with the PSED</li>
<li>Prepare and publish one or more specific and measurable equality objectives at least every four years</li>
</ul>

<h2>2. Protected Characteristics</h2>
<p>2.1 The Equality Act 2010 identifies nine protected characteristics. The school''s duties in relation to each are as follows:</p>
<table border="1" cellpadding="6" cellspacing="0" width="100%">
<thead><tr><th>Protected Characteristic</th><th>School Context</th></tr></thead>
<tbody>
<tr><td><strong>Age</strong></td><td>Applies to employment duties only (not to pupils). The school will not discriminate in recruitment, pay, promotion or training on grounds of age.</td></tr>
<tr><td><strong>Disability</strong></td><td>Applies to pupils and staff. Includes physical, sensory, cognitive, mental health and long-term health conditions. The school has a duty to make reasonable adjustments and must not discriminate against disabled pupils in admissions, education, exclusions or other detriment.</td></tr>
<tr><td><strong>Gender reassignment</strong></td><td>Applies to pupils and staff. The school will support transgender pupils and staff with dignity and respect, in accordance with DfE guidance.</td></tr>
<tr><td><strong>Marriage and civil partnership</strong></td><td>Applies to employment duties only. The school will not discriminate against staff because of their marital or civil partnership status.</td></tr>
<tr><td><strong>Pregnancy and maternity</strong></td><td>Applies to pupils (protection from unfavourable treatment during pregnancy and maternity leave from education) and staff (employment protection).</td></tr>
<tr><td><strong>Race</strong></td><td>Applies to pupils and staff. Includes ethnicity, colour, nationality and national or ethnic origins. The school actively promotes racial equality and tackles racial discrimination and harassment.</td></tr>
<tr><td><strong>Religion or belief</strong></td><td>Applies to pupils and staff. Includes any religion, lack of religion, and philosophical belief. The school respects all faiths and none, and ensures the curriculum and school life reflect this.</td></tr>
<tr><td><strong>Sex</strong></td><td>Applies to pupils and staff. The school promotes gender equality and challenges stereotypes through curriculum and culture.</td></tr>
<tr><td><strong>Sexual orientation</strong></td><td>Applies to pupils and staff. The school is committed to an inclusive environment where all sexual orientations are respected and homophobic, biphobic and transphobic language and behaviour are challenged.</td></tr>
</tbody>
</table>

<h2>3. Equality Information Published</h2>
<p>3.1 The following information is published annually to demonstrate compliance with the PSED:</p>
<h3>3.1.1 Pupil Demographics</h3>
<ul>
<li>Pupil population by ethnicity</li>
<li>Pupil population by gender</li>
<li>Number and proportion of pupils with SEND (SEN Support and EHC Plans)</li>
<li>Number and proportion of pupils eligible for Free School Meals / Pupil Premium</li>
<li>Number and proportion of pupils with English as an Additional Language (EAL)</li>
<li>Number of Looked After Children and Previously Looked After Children</li>
</ul>
<h3>3.1.2 Attainment and Progress</h3>
<ul>
<li>Attainment data disaggregated by ethnicity, gender, SEND status, FSM eligibility and EAL status</li>
<li>Progress data for the same groups</li>
<li>Analysis of attainment gaps between groups</li>
</ul>
<h3>3.1.3 Exclusions</h3>
<ul>
<li>Fixed-term and permanent exclusion data disaggregated by ethnicity, gender, SEND status and FSM eligibility</li>
<li>Analysis of any disproportionality in exclusion rates</li>
</ul>
<h3>3.1.4 Attendance</h3>
<ul>
<li>Attendance data disaggregated by ethnicity, gender, SEND status and FSM eligibility</li>
<li>Persistent absence rates for the same groups</li>
</ul>
<h3>3.1.5 Bullying and Harassment</h3>
<ul>
<li>Number of recorded bullying incidents by type (racial, homophobic, disability-related, sexist, other)</li>
<li>Outcomes and actions taken</li>
</ul>
<h3>3.1.6 Workforce</h3>
<ul>
<li>Staff diversity data (where available and with due regard to individual privacy)</li>
<li>Gender pay information (where applicable under gender pay gap reporting requirements)</li>
<li>Analysis of recruitment, retention and promotion data by protected characteristic (where data is available)</li>
</ul>

<h2>4. Equality Objectives</h2>
<p>4.1 The following equality objectives have been set for the period covering the next four years. Each objective is specific, measurable and has clear actions, timescales and responsibilities.</p>

<h3>Objective 1: Close the Attainment Gap for Disadvantaged Pupils</h3>
<table border="1" cellpadding="6" cellspacing="0" width="100%">
<tr><td><strong>Outcome</strong></td><td>Reduce the attainment gap between Pupil Premium pupils and non-Pupil Premium pupils in reading, writing and maths by at least 5 percentage points over 4 years</td></tr>
<tr><td><strong>Actions</strong></td><td>Targeted interventions, quality-first teaching focus, enhanced CPD, parental engagement, attendance improvement for PP pupils</td></tr>
<tr><td><strong>Timescale</strong></td><td>Annual milestones reviewed each September</td></tr>
<tr><td><strong>Responsible</strong></td><td>{{equality_lead}} / Pupil Premium Lead</td></tr>
<tr><td><strong>Monitoring</strong></td><td>Termly data analysis, annual report to governors</td></tr>
</table>

<h3>Objective 2: Improve Outcomes for Pupils with SEND</h3>
<table border="1" cellpadding="6" cellspacing="0" width="100%">
<tr><td><strong>Outcome</strong></td><td>Increase the proportion of SEND pupils making expected or better progress in line with their individual targets</td></tr>
<tr><td><strong>Actions</strong></td><td>Enhanced Quality First Teaching, targeted interventions, staff CPD on adaptive teaching, increased SENCO capacity, pupil voice</td></tr>
<tr><td><strong>Timescale</strong></td><td>Annual review</td></tr>
<tr><td><strong>Responsible</strong></td><td>SENCO / {{equality_lead}}</td></tr>
<tr><td><strong>Monitoring</strong></td><td>Termly SEN reviews, EHCP annual reviews, data analysis</td></tr>
</table>

<h3>Objective 3: Promote Diversity Through the Curriculum</h3>
<table border="1" cellpadding="6" cellspacing="0" width="100%">
<tr><td><strong>Outcome</strong></td><td>Ensure the curriculum across all subjects reflects the diversity of British society and global perspectives, with positive representation of all protected characteristics</td></tr>
<tr><td><strong>Actions</strong></td><td>Curriculum audit for diversity and representation, selection of diverse texts and resources, celebration of cultural events, pupil and parent voice surveys</td></tr>
<tr><td><strong>Timescale</strong></td><td>Initial audit Year 1, implementation Years 2-4</td></tr>
<tr><td><strong>Responsible</strong></td><td>Curriculum leads / {{equality_lead}}</td></tr>
<tr><td><strong>Monitoring</strong></td><td>Annual curriculum review, pupil surveys, governor monitoring visits</td></tr>
</table>

<h3>Objective 4: Reduce Prejudice-Related Incidents</h3>
<table border="1" cellpadding="6" cellspacing="0" width="100%">
<tr><td><strong>Outcome</strong></td><td>Year-on-year reduction in recorded prejudice-related bullying incidents, with 100% of incidents receiving a timely and effective response</td></tr>
<tr><td><strong>Actions</strong></td><td>Anti-bullying education programme, staff training on recognising and responding to prejudice-related incidents, pupil reporting mechanisms, restorative approaches</td></tr>
<tr><td><strong>Timescale</strong></td><td>Ongoing with termly review</td></tr>
<tr><td><strong>Responsible</strong></td><td>DSL / {{equality_lead}}</td></tr>
<tr><td><strong>Monitoring</strong></td><td>Termly incident analysis, annual report to governors</td></tr>
</table>

<h2>5. Accessibility</h2>
<p>5.1 The school maintains a separate <strong>Accessibility Plan</strong> as required by Schedule 10 of the Equality Act 2010, which sets out how the school will increase access for disabled pupils in three areas: curriculum, physical environment, and information.</p>

<h2>6. Reasonable Adjustments</h2>
<p>6.1 The school has a duty under the Equality Act 2010 to make <strong>reasonable adjustments</strong> for disabled pupils to prevent them being put at a substantial disadvantage compared with their non-disabled peers. This duty is anticipatory -- the school must plan in advance for the needs of disabled pupils.</p>
<p>6.2 The same duty applies to disabled staff under employment law.</p>

<h2>7. Monitoring and Reporting</h2>
<p>7.1 The governing body will receive an annual report on:</p>
<ul>
<li>Progress against each equality objective</li>
<li>Equality data analysis (attainment gaps, exclusion, attendance, bullying by characteristic)</li>
<li>Any equality impact assessments conducted</li>
<li>Actions taken and planned</li>
</ul>

<h2>8. Publication</h2>
<p>8.1 This document is published on the school''s website and is updated annually.</p>
<p>8.2 The equality objectives are reviewed and republished at least every four years.</p>'
);

-- ============================================================
-- 6. ACCESSIBILITY PLAN (3-YEAR)
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Accessibility Plan (3-Year)',
  'Statutory 3-year plan to increase access for disabled pupils across curriculum, physical environment, and information, per Equality Act 2010 Schedule 10.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'EA2010-SCH10',
  'Equality Act 2010 Schedule 10 / SEND Code of Practice 2015 / DfE Accessible Schools: Planning to Increase Access',
  '{"required_fields":["school_name","senco_name","plan_period","review_date"],"optional_fields":["accessibility_lead","site_manager","governor_lead"]}',
  '<h1>Accessibility Plan</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>SENCO:</strong> {{senco_name}}<br/>
<strong>Plan Period:</strong> {{plan_period}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Introduction</h2>
<p>1.1 This Accessibility Plan has been drawn up in compliance with <strong>Schedule 10 of the Equality Act 2010</strong> and the <strong>DfE guidance "Accessible Schools: Planning to Increase Access"</strong>.</p>
<p>1.2 Under the Equality Act 2010, all schools must have an Accessibility Plan. The plan must be in writing and must be reviewed and revised as necessary. The plan must be implemented and resourced.</p>
<p>1.3 The plan sets out how {{school_name}} will increase access for disabled pupils over the next three years in three key areas.</p>

<h2>2. Definition of Disability</h2>
<p>2.1 Under Section 6 of the Equality Act 2010, a person has a disability if they have a <strong>physical or mental impairment that has a substantial and long-term adverse effect on their ability to carry out normal day-to-day activities</strong>.</p>
<p>2.2 "Substantial" means more than minor or trivial. "Long-term" means has lasted, or is likely to last, at least 12 months or for the rest of the person''s life.</p>
<p>2.3 This includes (but is not limited to) physical disabilities, sensory impairments (hearing, vision), learning difficulties, mental health conditions, autistic spectrum conditions, epilepsy, diabetes, severe allergies, chronic fatigue, and HIV.</p>
<p>2.4 Some conditions are automatically treated as disabilities: cancer, HIV infection, multiple sclerosis, and certified visual impairment.</p>

<h2>3. Area 1: Increasing Curriculum Access</h2>
<p>3.1 The school will take steps to ensure that the curriculum is accessible to all disabled pupils by adapting teaching strategies, providing appropriate resources, and removing barriers to learning.</p>

<table border="1" cellpadding="6" cellspacing="0" width="100%">
<thead><tr><th>Target</th><th>Current Status</th><th>Action Required</th><th>Timescale</th><th>Responsibility</th><th>Success Criteria</th><th>Cost/Resource</th></tr></thead>
<tbody>
<tr>
<td>All teachers use adaptive teaching strategies to meet the needs of disabled pupils</td>
<td>Most teachers differentiate; some require further CPD</td>
<td>Deliver targeted CPD on adaptive teaching approaches; peer observation programme; coaching from SENCO</td>
<td>Year 1</td>
<td>{{senco_name}} / CPD Lead</td>
<td>All lesson observations show evidence of adaptive teaching; pupil progress data shows improved outcomes for SEND pupils</td>
<td>CPD budget allocation</td>
</tr>
<tr>
<td>Assistive technology available and used effectively across the curriculum</td>
<td>Some assistive technology in place; inconsistent use</td>
<td>Audit current provision; procure additional assistive technology (speech-to-text, screen readers, adapted keyboards, tablets with accessibility features); staff training on use</td>
<td>Years 1-2</td>
<td>{{senco_name}} / IT Lead</td>
<td>All pupils requiring assistive technology have access to appropriate tools; usage logged and reviewed termly</td>
<td>IT/SEND budget</td>
</tr>
<tr>
<td>Alternative formats available for curriculum materials</td>
<td>Ad hoc provision of large print; limited other formats</td>
<td>Establish process for providing materials in large print, audio, simplified language and modified layout as needed; train TAs in material adaptation</td>
<td>Year 1 (process), ongoing</td>
<td>{{senco_name}} / TAs</td>
<td>All pupils receive materials in accessible format within 48 hours of request</td>
<td>Reprographics budget</td>
</tr>
<tr>
<td>Specialist resources available for pupils with specific learning difficulties</td>
<td>Some resources in place for dyslexia; gaps for dyscalculia, dyspraxia</td>
<td>Audit and expand specialist resources (coloured overlays, fidget tools, writing slopes, visual timetables, task management boards, weighted items); staff training</td>
<td>Years 1-2</td>
<td>{{senco_name}}</td>
<td>All pupils with identified needs have access to appropriate resources; parent and pupil feedback positive</td>
<td>SEND budget</td>
</tr>
<tr>
<td>Support staff deployed effectively to maximise curriculum access</td>
<td>TAs allocated to classes; some need for more flexible deployment</td>
<td>Review TA deployment model; implement EEF recommendations on TA deployment; provide targeted TA training on specific interventions</td>
<td>Year 1</td>
<td>{{senco_name}} / SLT</td>
<td>TAs deliver evidence-based interventions; pupil progress data shows positive impact</td>
<td>Staffing budget</td>
</tr>
</tbody>
</table>

<h2>4. Area 2: Improving Physical Access</h2>
<p>4.1 The school will take steps to improve the physical environment to increase access for disabled pupils, staff and visitors.</p>

<table border="1" cellpadding="6" cellspacing="0" width="100%">
<thead><tr><th>Target</th><th>Current Status</th><th>Action Required</th><th>Timescale</th><th>Responsibility</th><th>Success Criteria</th><th>Cost/Resource</th></tr></thead>
<tbody>
<tr>
<td>All areas of the school accessible to wheelchair users</td>
<td>Ground floor accessible; upper floors via stairs only in some buildings</td>
<td>Install ramps where step access only; investigate lift/platform lift installation for multi-storey buildings; ensure all external pathways are even and maintained; review door widths</td>
<td>Years 1-3</td>
<td>Site Manager / SLT</td>
<td>Full wheelchair access to all areas used by pupils; timetabling ensures accessible rooms used where needed in interim</td>
<td>Capital budget / DfE CIF bid</td>
</tr>
<tr>
<td>Accessible toilets available and fit for purpose</td>
<td>One accessible toilet on ground floor</td>
<td>Audit accessible toilet provision; install additional facilities if needed; ensure all have appropriate grab rails, emergency alarm, changing bench where required</td>
<td>Year 1-2</td>
<td>Site Manager</td>
<td>Accessible toilets available on each floor/building in use; meet Building Regulations Part M standards</td>
<td>Capital budget</td>
</tr>
<tr>
<td>Hearing loop/sound field systems in key areas</td>
<td>Hearing loop in main hall only</td>
<td>Install portable hearing loops or sound field systems in classrooms used by hearing-impaired pupils; hearing loop in reception area</td>
<td>Year 1</td>
<td>{{senco_name}} / Site Manager</td>
<td>All hearing-impaired pupils have access to hearing loop/sound field in every lesson</td>
<td>SEND/Capital budget</td>
</tr>
<tr>
<td>Visual contrast and signage appropriate for visually impaired users</td>
<td>Basic signage in place; limited contrast marking</td>
<td>Audit signage and visual contrast; install high-contrast markings on stairs, glass doors, and hazards; install tactile signage at key locations; review lighting levels</td>
<td>Years 1-2</td>
<td>Site Manager</td>
<td>Meets RNIB recommendations; no reported incidents related to visual accessibility</td>
<td>Maintenance budget</td>
</tr>
<tr>
<td>Personal Emergency Evacuation Plans (PEEPs) in place for all who need them</td>
<td>PEEPs created on ad hoc basis</td>
<td>Systematic process for identifying all pupils, staff and regular visitors requiring PEEPs; create, share and practise PEEPs; review after each fire drill</td>
<td>Year 1 (process), ongoing</td>
<td>{{senco_name}} / Health &amp; Safety Lead</td>
<td>100% of those requiring PEEPs have current, practised plans; reviewed termly and after each fire drill</td>
<td>Staff time</td>
</tr>
</tbody>
</table>

<h2>5. Area 3: Improving Information Access</h2>
<p>5.1 The school will take steps to improve the availability of information to disabled pupils, parents and visitors in a range of formats.</p>

<table border="1" cellpadding="6" cellspacing="0" width="100%">
<thead><tr><th>Target</th><th>Current Status</th><th>Action Required</th><th>Timescale</th><th>Responsibility</th><th>Success Criteria</th><th>Cost/Resource</th></tr></thead>
<tbody>
<tr>
<td>School website meets WCAG 2.1 Level AA accessibility standards</td>
<td>Partial compliance; not fully audited</td>
<td>Commission accessibility audit of school website; remediate all identified issues; ensure all documents uploaded are accessible (tagged PDFs, alt text on images); ongoing monitoring</td>
<td>Year 1 (audit and remediation)</td>
<td>IT Lead / Office Manager</td>
<td>WCAG 2.1 AA compliance confirmed by audit; regular accessibility checks built into website update process</td>
<td>IT budget</td>
</tr>
<tr>
<td>Key school communications available in alternative formats on request</td>
<td>Available in large print on request; other formats not routinely offered</td>
<td>Establish process for providing newsletters, letters, reports and policies in large print, audio, Braille, easy-read and translated formats; publicise availability to parents</td>
<td>Year 1 (process), ongoing</td>
<td>Office Manager / {{senco_name}}</td>
<td>All requests fulfilled within 5 working days; information about alternative formats included in admissions pack and school website</td>
<td>Admin/translation budget</td>
</tr>
<tr>
<td>Communication aids available for pupils who need them</td>
<td>Some PECS resources; limited AAC provision</td>
<td>Assess communication needs of current and prospective pupils; procure appropriate AAC devices and communication aids; train staff in their use; liaise with Speech and Language Therapy service</td>
<td>Years 1-2</td>
<td>{{senco_name}} / SaLT</td>
<td>All pupils with communication needs have appropriate aids; staff confident in supporting their use</td>
<td>SEND budget / EHCP funding</td>
</tr>
<tr>
<td>Colour contrast and readability standards applied to all school-produced materials</td>
<td>Inconsistent application</td>
<td>Produce guidance for staff on accessible document design (font size, spacing, colour contrast, plain language); apply to all templates; train staff</td>
<td>Year 1</td>
<td>Office Manager / {{senco_name}}</td>
<td>All school-produced materials meet minimum accessibility standards; templates updated</td>
<td>Staff time</td>
</tr>
</tbody>
</table>

<h2>6. Links to Other Policies</h2>
<p>6.1 This plan should be read in conjunction with the school''s:</p>
<ul>
<li>SEND Policy and SEND Information Report</li>
<li>Equality Information and Objectives</li>
<li>Admissions Policy</li>
<li>Health and Safety Policy</li>
<li>Behaviour Policy (reasonable adjustments for disabled pupils)</li>
</ul>

<h2>7. Consultation</h2>
<p>7.1 This plan has been developed in consultation with:</p>
<ul>
<li>Disabled pupils and their parents/carers</li>
<li>Staff (including those with disabilities)</li>
<li>External professionals (educational psychologist, occupational therapist, sensory impairment service)</li>
<li>The governing body</li>
</ul>

<h2>8. Monitoring and Review</h2>
<p>8.1 Progress against this plan will be reviewed <strong>annually</strong> by the SENCO and reported to the governing body.</p>
<p>8.2 The plan will be revised and republished every <strong>three years</strong> or sooner if significant changes are required.</p>
<p>8.3 This plan is published on the school''s website.</p>'
);

-- ============================================================
-- 7. SEND INFORMATION REPORT & POLICY
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'SEND Information Report and Policy',
  'Statutory SEND Information Report covering all 14 questions from Schedule 1 of SEND Regulations 2014, plus comprehensive SEND policy. Per Children and Families Act 2014 s.69 and SEND Code of Practice 2015.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'CFA2014-S69-SENDCOP',
  'Children and Families Act 2014 / SEND Code of Practice 2015 / Special Educational Needs and Disability Regulations 2014',
  '{"required_fields":["school_name","senco_name","senco_contact","send_governor","la_local_offer_url","review_date"],"optional_fields":["headteacher_name","senco_qualifications"]}',
  '<h1>SEND Information Report and Policy</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>SENCO:</strong> {{senco_name}}<br/>
<strong>SENCO Contact:</strong> {{senco_contact}}<br/>
<strong>SEND Governor:</strong> {{send_governor}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Introduction</h2>
<p>1.1 This report fulfils the statutory requirement under <strong>Section 69 of the Children and Families Act 2014</strong> and <strong>Regulation 51 and Schedule 1 of the Special Educational Needs and Disability Regulations 2014</strong> for schools to publish a SEND Information Report on their website.</p>
<p>1.2 It also serves as the school''s SEND Policy, setting out our approach to identifying and supporting pupils with special educational needs and disabilities.</p>
<p>1.3 This report is updated annually and approved by the governing body.</p>

<h2>2. What Are Special Educational Needs?</h2>
<p>2.1 A child or young person has SEN if they have a learning difficulty or disability which calls for special educational provision to be made for them (Children and Families Act 2014, s.20).</p>
<p>2.2 A child has a learning difficulty or disability if they:</p>
<ul>
<li>Have a significantly greater difficulty in learning than the majority of others of the same age; or</li>
<li>Have a disability which prevents or hinders them from making use of facilities of a kind generally provided for others of the same age in mainstream schools</li>
</ul>

<h2>3. The Fourteen Questions (SEND Regulations 2014, Schedule 1)</h2>

<h3>3.1 The Kinds of SEND Provision Made at the School</h3>
<p>{{school_name}} makes provision for pupils across the four broad areas of need identified in the SEND Code of Practice 2015:</p>
<ul>
<li><strong>Communication and Interaction:</strong> Including speech, language and communication needs (SLCN) and autistic spectrum conditions (ASC). Provision includes speech and language therapy (direct and indirect), social communication groups, visual supports, communication aids and AAC devices.</li>
<li><strong>Cognition and Learning:</strong> Including moderate learning difficulties (MLD), severe learning difficulties (SLD), specific learning difficulties (SpLD) such as dyslexia, dyscalculia and dyspraxia. Provision includes targeted literacy and numeracy interventions, specialist resources, pre-teaching, overlearning strategies and multi-sensory approaches.</li>
<li><strong>Social, Emotional and Mental Health (SEMH):</strong> Including anxiety, depression, self-harm, attachment difficulties, ADHD and conduct disorders. Provision includes nurture support, ELSA (Emotional Literacy Support Assistant), counselling, social skills groups, behaviour support plans and CAMHS liaison.</li>
<li><strong>Sensory and/or Physical:</strong> Including hearing impairment (HI), visual impairment (VI), multi-sensory impairment (MSI) and physical disabilities. Provision includes specialist equipment, environmental modifications, physiotherapy and occupational therapy programmes, and support from sensory impairment advisory services.</li>
</ul>

<h3>3.2 Policies for Identifying and Assessing SEND</h3>
<p>The school uses a <strong>graduated approach</strong> to identifying and meeting SEND, following the cycle of <strong>Assess, Plan, Do, Review</strong>:</p>
<ul>
<li><strong>Assess:</strong> Early identification through baseline assessments, ongoing teacher assessment, screening tools (e.g., phonics screening, reading age tests, dyslexia screening), analysis of progress data, teacher concerns, parent/pupil voice, and external professional assessments (educational psychologist, speech therapist, occupational therapist)</li>
<li><strong>Plan:</strong> Where a pupil is identified as having SEN, the SENCO and class teacher will agree the support to be provided, the expected outcomes, and a review date. This is recorded on a SEN Support Plan (Individual Education Plan/Provision Map)</li>
<li><strong>Do:</strong> The class teacher remains responsible for the pupil''s learning, with additional support from TAs, specialists and external agencies as set out in the plan</li>
<li><strong>Review:</strong> The effectiveness of the support is reviewed at least termly, with parents and the pupil involved in the review. The plan is adjusted based on progress</li>
</ul>
<p>Where a pupil''s needs are significant and sustained, and the school''s SEN Support provision is insufficient, the school will request an <strong>Education, Health and Care (EHC) needs assessment</strong> from the local authority.</p>

<h3>3.3 The Name and Contact Details of the SENCO</h3>
<p><strong>SENCO:</strong> {{senco_name}}<br/>
<strong>Contact:</strong> {{senco_contact}}</p>
<p>The SENCO holds (or is working towards) the <strong>National Award for SEN Co-ordination (NASENCO)</strong> as required by the SEND Code of Practice 2015 (para 6.85). The SENCO is a qualified teacher and a member of the school''s senior leadership team.</p>

<h3>3.4 Approach to Teaching Pupils with SEND</h3>
<p>The school''s approach is founded on <strong>Quality First Teaching (QFT)</strong>:</p>
<ul>
<li>All teachers are teachers of pupils with SEND</li>
<li>Lessons are planned to address potential areas of difficulty and to remove barriers to learning</li>
<li>Reasonable adjustments are made routinely for disabled pupils (Equality Act 2010)</li>
<li>Teaching strategies include scaffolding, pre-teaching of key vocabulary, overlearning, multi-sensory approaches, visual supports, and flexible grouping</li>
<li>Formative assessment is used to identify misconceptions and adjust teaching in real time</li>
</ul>

<h3>3.5 How Adaptations Are Made to the Curriculum and Learning Environment</h3>
<ul>
<li>Visual timetables and task boards for pupils who need routine and predictability</li>
<li>Sensory spaces and quiet areas for pupils who experience sensory overload</li>
<li>Modified resources (enlarged text, coloured paper/overlays, simplified language, adapted worksheets)</li>
<li>Alternative recording methods (scribe, voice recorder, word processor, mind maps)</li>
<li>Flexible seating arrangements and access to movement breaks</li>
<li>Modified PE activities and equipment</li>
<li>Exam access arrangements (extra time, reader, scribe, rest breaks, separate room)</li>
</ul>

<h3>3.6 Additional Support Available</h3>
<ul>
<li>Teaching Assistant support (in-class and withdrawal for targeted interventions)</li>
<li>Specialist interventions: phonics catch-up programmes, precision teaching, sensory diets, motor skills programmes</li>
<li>Speech and Language Therapy (commissioned or via EHCP)</li>
<li>Occupational Therapy (commissioned or via EHCP)</li>
<li>Educational Psychology service (LA or commissioned)</li>
<li>CAMHS liaison and mental health support</li>
<li>Sensory impairment advisory services (hearing, vision)</li>
<li>Specialist outreach from special schools</li>
</ul>

<h3>3.7 Activities Available Outside the Classroom</h3>
<p>All pupils with SEND are encouraged and supported to participate in:</p>
<ul>
<li>Extra-curricular clubs and activities, with reasonable adjustments made as needed</li>
<li>School trips and visits, with individual risk assessments and support plans</li>
<li>Residential visits, with appropriate care plans and staffing ratios</li>
<li>Sports events and competitions, with adapted participation where needed</li>
</ul>

<h3>3.8 Support for Improving Emotional and Social Development</h3>
<ul>
<li>PSHE curriculum including emotional wellbeing, resilience, healthy relationships and anti-bullying</li>
<li>Social skills groups and friendship programmes</li>
<li>Nurture provision (nurture groups, nurture breakfasts)</li>
<li>ELSA (Emotional Literacy Support Assistant) sessions</li>
<li>Counselling (school counsellor or external service)</li>
<li>Anti-bullying strategy with clear reporting and response procedures</li>
<li>Attendance support and monitoring</li>
<li>Peer mentoring and buddy systems</li>
</ul>

<h3>3.9 Complaints Procedure for SEND</h3>
<p>If a parent/carer has a concern about the SEND provision for their child, they should:</p>
<ol>
<li>Discuss the concern with the class teacher in the first instance</li>
<li>If unresolved, raise the matter with the SENCO ({{senco_name}})</li>
<li>If still unresolved, follow the school''s formal <strong>Complaints Procedure</strong></li>
<li>Parents also have the right to request mediation from the local authority and, in relation to EHC plans, to appeal to the <strong>First-tier Tribunal (Special Educational Needs and Disability)</strong></li>
</ol>

<h3>3.10 How the School Involves Other Bodies</h3>
<p>The school works in partnership with:</p>
<ul>
<li>The local authority SEND team and Educational Psychology service</li>
<li>Health services (NHS Speech and Language Therapy, Occupational Therapy, Physiotherapy, CAMHS, Paediatrics, School Nursing)</li>
<li>Social care services (Early Help, Children''s Social Care)</li>
<li>Voluntary organisations (parent support groups, specialist charities)</li>
<li>Other schools (for transition planning and moderation)</li>
</ul>

<h3>3.11 Contact Details for the LA Local Offer</h3>
<p>The Local Authority''s Local Offer provides information about services and support available for children and young people with SEND aged 0-25.</p>
<p><strong>Local Offer URL:</strong> {{la_local_offer_url}}</p>

<h3>3.12 How the School Is Accessible to Disabled Pupils</h3>
<p>Please refer to the school''s <strong>Accessibility Plan</strong> (published separately on the school website) which sets out how the school increases access for disabled pupils across curriculum, physical environment and information.</p>

<h3>3.13 How Resources Are Allocated and Matched to Need</h3>
<ul>
<li><strong>Notional SEND budget:</strong> The school receives a notional SEND budget as part of its delegated funding. This is used to fund the first 6,000 pounds of additional support for each pupil with SEN</li>
<li><strong>EHCP funding:</strong> Where a pupil has an Education, Health and Care Plan, the school receives additional top-up funding from the local authority to deliver the provision specified in the plan</li>
<li><strong>Pupil Premium:</strong> Where pupils with SEND are also eligible for Pupil Premium, this additional funding is used to support their achievement</li>
<li>The SENCO, in consultation with the headteacher and governing body, decides on the deployment of resources to meet the needs of individual pupils, guided by the SEN Code of Practice and the school''s SEND provision map</li>
</ul>

<h3>3.14 How Pupils with SEND Engage in Activities Alongside Non-SEND Peers</h3>
<p>The school is committed to inclusive practice:</p>
<ul>
<li>Pupils with SEND are taught in mainstream classes alongside their peers for the vast majority of the school day</li>
<li>Withdrawal for targeted intervention is time-limited and planned to minimise disruption to the broad curriculum</li>
<li>Inclusive PE with adapted equipment and modified activities</li>
<li>Accessible technology enabling full participation in computing and digital learning</li>
<li>All school events, assemblies, trips and celebrations are inclusive with appropriate support</li>
</ul>

<h2>4. Transition Planning</h2>
<ul>
<li><strong>EYFS to KS1:</strong> Enhanced transition including additional visits, photo books, social stories, meetings between EYFS and KS1 staff, and parental meetings</li>
<li><strong>KS2 to KS3:</strong> Liaison with secondary SENCO, additional transition visits, transfer of SEND records, meetings with parents and pupil, involvement of external professionals as appropriate</li>
<li><strong>KS4 to Post-16:</strong> Careers guidance, liaison with post-16 providers, involvement of the LA where the young person has an EHC plan (annual review in Year 9 onwards must include transition planning)</li>
</ul>

<h2>5. Working with Parents</h2>
<p>The school is committed to working in partnership with parents/carers:</p>
<ul>
<li>Parents are involved at every stage of the graduated approach</li>
<li>Person-centred reviews are held at least termly for pupils on SEN Support and at least annually for those with EHC plans</li>
<li>SEND surgeries/drop-in sessions are available each term</li>
<li>The SENCO is available by appointment and can be contacted via {{senco_contact}}</li>
<li>Information about the school''s SEND provision is published on the school website</li>
</ul>

<h2>6. Training for Staff</h2>
<p>6.1 The SENCO provides regular training and updates to all staff on SEND matters.</p>
<p>6.2 Staff have access to CPD on specific areas of need (e.g., autism awareness, dyslexia-friendly teaching, attachment and trauma, de-escalation).</p>
<p>6.3 Teaching assistants receive training on specific interventions they deliver.</p>

<h2>7. Evaluating Effectiveness</h2>
<p>7.1 The effectiveness of SEND provision is evaluated through:</p>
<ul>
<li>Pupil progress data (termly tracking against individual targets)</li>
<li>Analysis of attainment gaps between SEND and non-SEND pupils</li>
<li>Review of interventions (entry/exit data, impact analysis)</li>
<li>Pupil and parent voice (surveys, reviews)</li>
<li>External moderation and peer review</li>
<li>Governing body monitoring (SEND governor visits, reports)</li>
</ul>

<h2>8. Role of the SEND Governor</h2>
<p><strong>SEND Governor:</strong> {{send_governor}}</p>
<p>The SEND Governor meets with the SENCO at least termly to:</p>
<ul>
<li>Review the school''s SEND provision and progress against the SEND development plan</li>
<li>Monitor the school''s compliance with statutory requirements</li>
<li>Report to the full governing body on SEND matters</li>
<li>Ensure the school''s SEND budget is being spent effectively</li>
</ul>

<h2>9. Review</h2>
<p>This report and policy is reviewed annually and published on the school''s website.</p>
<p>Next review date: {{review_date}}</p>'
);


-- ============================================================
-- 8. ADMISSIONS POLICY
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Admissions Policy',
  'Statutory admissions policy per School Admissions Code 2021. Covers PAN, oversubscription criteria, waiting lists, in-year admissions, appeals, deferred entry, and summer-born children.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'SAC-2021',
  'School Admissions Code 2021 / School Admissions Appeals Code 2022 / Education Act 1996',
  '{"required_fields":["school_name","admission_number","academic_year","la_name","review_date"],"optional_fields":["faith_designation","supplementary_form_url","appeals_clerk_contact"]}',
  '<h1>Admissions Policy</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Published Admission Number (PAN):</strong> {{admission_number}}<br/>
<strong>Academic Year:</strong> {{academic_year}}<br/>
<strong>Local Authority:</strong> {{la_name}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Introduction</h2>
<p>1.1 This policy sets out the arrangements for admission to {{school_name}} for the academic year {{academic_year}}. It has been determined in accordance with the <strong>School Admissions Code 2021</strong> and the <strong>Education Act 1996</strong>.</p>
<p>1.2 The Published Admission Number (PAN) for the school is <strong>{{admission_number}}</strong>. The school will admit up to this number of pupils in the relevant year group. Applications will not be refused where the number of applications does not exceed the PAN.</p>

<h2>2. Application Process</h2>
<h3>2.1 Normal Admissions Round</h3>
<p>Applications for admission at the normal point of entry (Reception for primary / Year 7 for secondary) must be made through the <strong>{{la_name}} coordinated admissions scheme</strong>.</p>
<ul>
<li><strong>Application deadline:</strong> 15 January (primary) / 31 October (secondary) of the preceding academic year, or as set by the local authority</li>
<li><strong>National Offer Day:</strong> 16 April (primary) / 1 March (secondary), or the next working day</li>
<li><strong>Acceptance deadline:</strong> As specified in the offer letter (typically 2 weeks)</li>
</ul>

<h3>2.2 In-Year Admissions</h3>
<p>Applications for admission at any time other than the normal point of entry (in-year admissions) should be made directly to the school. The school will notify the local authority of the application and its outcome.</p>
<p>Where a place is available in the relevant year group, the school will admit the child. Where the year group is full, the oversubscription criteria below will be applied and parents will be informed of their right to appeal.</p>
<p>The school participates in the local authority''s <strong>Fair Access Protocol</strong> for the admission of hard-to-place pupils, as required by the School Admissions Code 2021.</p>

<h2>3. Oversubscription Criteria</h2>
<p>3.1 Where the number of applications exceeds the Published Admission Number, places will be allocated in the following priority order:</p>

<h3>Priority 1: Looked After Children and Previously Looked After Children</h3>
<p>Children who are looked after by a local authority (within the meaning of Section 22 of the Children Act 1989) and children who were previously looked after but ceased to be so because they were adopted (under the Adoption and Children Act 2002), or became subject to a child arrangements order or special guardianship order. This includes children who appear to have been in state care outside of England and ceased to be in state care as a result of being adopted (in accordance with the provisions of the Immigration Act 2014).</p>

<h3>Priority 2: Children with an Education, Health and Care Plan</h3>
<p>Children with an Education, Health and Care Plan that names {{school_name}} will be admitted. These children are admitted through a separate process under the Children and Families Act 2014 and are not counted against the oversubscription criteria; they are mentioned here for completeness.</p>

<h3>Priority 3: Children with Exceptional Medical or Social Need</h3>
<p>Children for whom it can be demonstrated that there are exceptional medical, social or welfare reasons that make it essential for the child to attend {{school_name}} rather than any other school. Applications under this criterion must be supported by written evidence from a relevant professional (e.g., doctor, social worker, psychologist) at the time of application. The evidence must set out why this school is the only school that can meet the child''s needs.</p>

<h3>Priority 4: Siblings</h3>
<p>Children who have a sibling attending {{school_name}} at the time of admission. A sibling is defined as a full brother or sister, half-brother or half-sister, step-brother or step-sister, adopted brother or sister, or foster brother or sister, living at the <strong>same home address</strong> as the applicant child. This includes children of the parent''s partner where they live at the same address.</p>

<h3>Priority 5: Children of Staff at the School</h3>
<p>Children of members of staff at the school where:</p>
<ul>
<li>The member of staff has been employed at the school for <strong>two or more years</strong> at the time of application; or</li>
<li>The member of staff has been recruited to fill a <strong>vacant post for which there is a demonstrable skills shortage</strong></li>
</ul>

<h3>Priority 6: Distance</h3>
<p>Children who live nearest to the school. Distance will be measured in a <strong>straight line</strong> from the front door of the child''s home address to the main entrance of the school, using the local authority''s geographical information system (GIS). Where a child lives at more than one address, the address used will be the one where the child spends the majority of school nights (Sunday to Thursday).</p>

<h2>4. Tie-Breaker</h2>
<p>4.1 Where two or more applicants have equal priority under the oversubscription criteria (including equal distance), places will be allocated by <strong>random allocation (lottery)</strong>. The draw will be supervised by an independent person and the process will be recorded.</p>
<p>4.2 <strong>Multiple births:</strong> Where the last available place is offered to a child from a multiple birth (twin, triplet, etc.), the school will admit all siblings from that multiple birth, even if this means exceeding the PAN.</p>

<h2>5. Waiting List</h2>
<p>5.1 Where the school is oversubscribed, a waiting list will be maintained for at least the <strong>autumn term</strong> of the admission year (until 31 December as a minimum).</p>
<p>5.2 The waiting list is ranked in accordance with the oversubscription criteria above and <strong>NOT by the date of application</strong>. A child''s position on the waiting list may change if a later applicant has a higher priority under the criteria.</p>
<p>5.3 Looked After Children and Previously Looked After Children, and those with an EHC Plan naming the school, take precedence over the waiting list.</p>

<h2>6. Late Applications</h2>
<p>6.1 Applications received after the published deadline will be considered as <strong>late applications</strong> and will be processed after all on-time applications, unless exceptional circumstances apply.</p>
<p>6.2 Exceptional circumstances may include:</p>
<ul>
<li>Family bereavement at or close to the deadline</li>
<li>Serious illness of the parent/carer at or close to the deadline</li>
<li>Family having recently moved into the area with no prior knowledge of the deadline</li>
</ul>
<p>6.3 Evidence of exceptional circumstances must be provided with the application.</p>

<h2>7. Right of Appeal</h2>
<p>7.1 Parents who are not offered a place have a <strong>statutory right to appeal</strong> to an independent appeal panel, as set out in the <strong>School Admissions Appeals Code 2022</strong>.</p>
<p>7.2 To exercise this right, parents should write to the school (or local authority for coordinated admissions) within <strong>20 school days</strong> of receiving the decision letter, setting out the grounds for appeal.</p>
<p>7.3 The independent appeal panel will consider the case and its decision is binding on the school and the local authority.</p>
<p>7.4 For infant classes (Reception, Year 1, Year 2), appeals are limited by the infant class size legislation (Education Act 2002, s.1). The appeal can only succeed if the panel finds that the admission arrangements did not comply with admissions law and the child would have been offered a place, or that the decision was not one that a reasonable admission authority would have made.</p>

<h2>8. Deferred Entry (Primary Phase)</h2>
<p>8.1 Parents offered a place in Reception may <strong>defer their child''s entry</strong> until later in the school year, but not beyond the point at which the child reaches compulsory school age (the term after the child''s fifth birthday) and not beyond the beginning of the final term of the school year.</p>
<p>8.2 Parents may also request that their child attends <strong>part-time</strong> until the child reaches compulsory school age.</p>

<h2>9. Summer-Born Children</h2>
<p>9.1 Parents of summer-born children (born between 1 April and 31 August) may request that their child is admitted to <strong>Reception at compulsory school age</strong> (i.e., in the September following their fifth birthday), rather than Year 1.</p>
<p>9.2 The school (as admission authority) will consider each request on its individual merits, taking into account the parent''s views, the headteacher''s views, information about the child''s academic, social and emotional development, and any relevant medical history and professional views.</p>
<p>9.3 The decision will be communicated to the parent in writing with reasons.</p>

<h2>10. Faith-Based Criteria (If Applicable)</h2>
<p>10.1 If {{school_name}} is a school with a religious character (voluntary aided, voluntary controlled or academy with religious designation), additional faith-based oversubscription criteria may apply. These would include:</p>
<ul>
<li>Completion of a <strong>Supplementary Information Form (SIF)</strong></li>
<li>Verification of religious practice (e.g., regular attendance at a place of worship, confirmed by a member of the clergy)</li>
<li>Priority for baptised/confirmed members of the relevant faith</li>
</ul>
<p>10.2 Faith-based criteria will be applied in accordance with the School Admissions Code 2021 and will not disadvantage applicants from other faiths or no faith beyond the published criteria.</p>

<h2>11. Review</h2>
<p>11.1 This policy is determined annually by the governing body (or trust board for academies) and is published on the school''s website.</p>
<p>11.2 Next review date: {{review_date}}</p>'
);

-- ============================================================
-- 9. ACCEPTABLE USE POLICY -- STAFF
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Acceptable Use Policy - Staff',
  'Staff acceptable use of technology policy per KCSIE 2024 and DfE Filtering and Monitoring Standards 2023. Covers school systems, personal devices, social media, data protection, and consequences of breach.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'KCSIE-2024-AUP',
  'KCSIE 2024 / DfE Meeting Digital and Technology Standards in Schools and Colleges 2023 / DfE Filtering and Monitoring Standards',
  '{"required_fields":["school_name","dsl_name","it_manager","review_date"],"optional_fields":["headteacher_name","data_protection_officer"]}',
  '<h1>Acceptable Use Policy -- Staff</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Designated Safeguarding Lead:</strong> {{dsl_name}}<br/>
<strong>IT Manager/Lead:</strong> {{it_manager}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Purpose and Scope</h2>
<p>1.1 This Acceptable Use Policy (AUP) sets out the rules and expectations for the use of technology by all adults at {{school_name}}.</p>
<p>1.2 This policy applies to <strong>all staff, governors, volunteers, supply staff, visiting professionals and contractors</strong> who use the school''s IT systems or bring personal devices onto school premises.</p>
<p>1.3 All adults covered by this policy must read, understand and sign the agreement section before being granted access to school IT systems.</p>

<h2>2. Legal and Regulatory Framework</h2>
<ul>
<li>Keeping Children Safe in Education (KCSIE) 2024</li>
<li>DfE Meeting Digital and Technology Standards in Schools and Colleges 2023</li>
<li>DfE Filtering and Monitoring Standards for Schools and Colleges 2023</li>
<li>UK General Data Protection Regulation (UK GDPR) and Data Protection Act 2018</li>
<li>Computer Misuse Act 1990</li>
<li>Copyright, Designs and Patents Act 1988</li>
<li>Malicious Communications Act 1988</li>
<li>Communications Act 2003</li>
<li>Online Safety Act 2023</li>
</ul>

<h2>3. School Systems -- Acceptable Use</h2>
<p>3.1 School IT systems (email, internet, MIS, cloud storage, VLE/LMS, printers, phones) are provided for <strong>professional and educational purposes</strong>.</p>
<p>3.2 All professional communication must use the <strong>school email address</strong>. Staff must not use personal email accounts for any school business.</p>
<p>3.3 When sending emails:</p>
<ul>
<li>Use professional and appropriate language at all times</li>
<li>Use BCC when sending to multiple recipients where personal data (email addresses) should not be shared between recipients</li>
<li>Do not send sensitive or confidential information by email unless encrypted or via approved secure systems</li>
<li>Be aware that school emails may be subject to Freedom of Information or Data Subject Access Requests</li>
</ul>
<p>3.4 Internet access is provided for professional use. Limited personal use during breaks is permitted provided it does not interfere with duties or breach any other aspect of this policy.</p>
<p>3.5 Staff must not access, download or distribute any material that is:</p>
<ul>
<li>Illegal (including indecent images of children -- this constitutes a criminal offence)</li>
<li>Pornographic, sexually explicit or offensive</li>
<li>Discriminatory, hateful or promoting extremism</li>
<li>Defamatory or in breach of copyright</li>
</ul>

<h2>4. Passwords and Security</h2>
<p>4.1 Passwords must be:</p>
<ul>
<li>At least 12 characters in length, combining upper and lower case letters, numbers and special characters</li>
<li>Unique to each system (not reused across personal and school accounts)</li>
<li>Changed immediately if compromise is suspected</li>
<li>Changed at least every 90 days, or as required by the school''s IT security policy</li>
</ul>
<p>4.2 Passwords must <strong>never be shared</strong> with anyone, including colleagues, IT support or managers. IT support will never ask for a password.</p>
<p>4.3 <strong>Two-factor authentication (2FA)</strong> must be enabled on all accounts where available, including email, MIS and cloud storage.</p>
<p>4.4 Devices must be locked (screen lock) whenever left unattended, even briefly.</p>

<h2>5. Personal Devices</h2>
<p>5.1 <strong>Photographs of pupils:</strong> Staff must <strong>never</strong> take photographs or videos of pupils on personal devices (including personal mobile phones). All photographs of pupils must be taken on school devices and stored on school systems only.</p>
<p>5.2 Personal mobile phones should be kept on silent and out of sight during teaching time and when supervising pupils. They may be used during non-contact time in staff areas only.</p>
<p>5.3 If the school operates a <strong>Bring Your Own Device (BYOD)</strong> scheme, personal devices used for school work must comply with the school''s IT security requirements (encryption, passcode, remote wipe capability, approved MDM software).</p>
<p>5.4 No school data (pupil data, staff data, assessment data, financial data) may be stored on personal devices or personal cloud storage accounts (e.g., personal Google Drive, Dropbox, iCloud).</p>

<h2>6. Social Media</h2>
<p>6.1 Staff must <strong>not</strong> connect with or accept connection requests from current pupils on any personal social media platform.</p>
<p>6.2 Staff must <strong>not</strong> post any content that:</p>
<ul>
<li>Identifies or could identify pupils, parents or colleagues (including photographs)</li>
<li>Makes reference to the school, its staff, pupils or parents in a way that could be considered inappropriate, unprofessional or damaging to the school''s reputation</li>
<li>Shares confidential information about the school, its staff, pupils or operations</li>
</ul>
<p>6.3 Staff must not use the school''s name, logo or branding on personal social media without the headteacher''s written permission.</p>
<p>6.4 Staff should be aware that online activity (even on personal accounts, in personal time) that brings the school into disrepute or raises safeguarding concerns may result in disciplinary action.</p>
<p>6.5 <strong>Official school social media accounts</strong> must be operated by designated staff only, using school devices and school accounts. Content must be approved before posting and must comply with GDPR (consent for pupil images).</p>

<h2>7. Filtering and Monitoring</h2>
<p>7.1 In accordance with <strong>DfE Filtering and Monitoring Standards 2023</strong>, all use of school IT systems (including internet access) is <strong>filtered and monitored</strong>.</p>
<p>7.2 Staff should be aware that:</p>
<ul>
<li>Internet activity is logged and may be reviewed</li>
<li>Email content may be monitored for safeguarding purposes</li>
<li>Monitoring alerts are generated for concerning activity and are reviewed by the DSL ({{dsl_name}})</li>
<li>Keyword and phrase monitoring is in place for safeguarding-related terms</li>
</ul>
<p>7.3 Staff must <strong>not</strong> attempt to circumvent filtering or monitoring systems, including through the use of VPNs, proxy servers, personal mobile data hotspots or any other means. Attempted circumvention is a serious breach of this policy.</p>

<h2>8. Data Protection</h2>
<p>8.1 All use of school data must comply with the <strong>UK GDPR and Data Protection Act 2018</strong>.</p>
<p>8.2 School data must only be accessed, stored and shared via <strong>approved school platforms</strong> (school email, school cloud storage, school MIS).</p>
<p>8.3 Any transfer of personal data outside the school (e.g., to the local authority, external agencies) must follow the school''s data protection procedures, including encryption where appropriate.</p>
<p>8.4 Data taken off-site (e.g., for remote working) must be on encrypted devices only, and staff must ensure a secure working environment (screen not visible to others, secure WiFi connection, no use of public WiFi for accessing school systems without VPN).</p>

<h2>9. Copyright</h2>
<p>9.1 Staff must respect intellectual property rights and not copy, distribute or use copyrighted material without appropriate licence or permission.</p>
<p>9.2 Software must only be installed on school devices with approval from the IT manager. All software must be properly licensed.</p>

<h2>10. Remote and Home Working</h2>
<p>10.1 When working remotely, staff must:</p>
<ul>
<li>Use the school''s VPN where provided for accessing school systems</li>
<li>Ensure their working environment is secure (screen not visible to household members or visitors when displaying pupil/staff data)</li>
<li>Lock devices when not in use</li>
<li>Not use public WiFi networks to access school systems unless using VPN</li>
<li>Ensure printed materials containing personal data are stored securely and returned to school for secure disposal</li>
</ul>

<h2>11. Reporting</h2>
<p>11.1 Staff must immediately report:</p>
<ul>
<li>Any actual or suspected security incident (data breach, lost device, unauthorised access) to the IT manager ({{it_manager}}) and Data Protection Officer</li>
<li>Any suspicious emails (phishing, malware) to the IT manager -- do not click links or open attachments</li>
<li>Any safeguarding concerns arising from online activity (own or others'') to the DSL ({{dsl_name}})</li>
<li>Any accidental access to inappropriate content to the IT manager and DSL</li>
</ul>

<h2>12. Consequences of Breach</h2>
<p>12.1 Breach of this policy may result in:</p>
<ul>
<li>Withdrawal of access to school IT systems</li>
<li>Disciplinary action up to and including dismissal</li>
<li>Referral to the Teaching Regulation Agency (for teachers, where the breach constitutes misconduct)</li>
<li>Criminal prosecution (where the breach constitutes a criminal offence)</li>
<li>Report to the Information Commissioner''s Office (where the breach involves personal data)</li>
</ul>

<h2>13. Agreement</h2>
<p>I have read, understood and agree to abide by this Acceptable Use Policy. I understand that breach of this policy may result in disciplinary action and/or criminal proceedings.</p>
<p><strong>Name:</strong> ___________________________<br/>
<strong>Role:</strong> ___________________________<br/>
<strong>Signature:</strong> ___________________________<br/>
<strong>Date:</strong> ___________________________</p>'
);

-- ============================================================
-- 10. ONLINE SAFETY POLICY
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Online Safety Policy',
  'Comprehensive online safety policy per KCSIE 2024 covering education, filtering, monitoring, specific online safety issues (cyberbullying, CSEA, sexting, grooming, radicalisation, AI), incident response, and mobile phones.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'KCSIE-2024-ONLINE',
  'KCSIE 2024 / DfE Filtering and Monitoring Standards 2023 / Education Act 2011 / DfE Teaching Online Safety in Schools',
  '{"required_fields":["school_name","dsl_name","it_lead","filtering_provider","monitoring_provider","review_date"],"optional_fields":["headteacher_name","computing_lead"]}',
  '<h1>Online Safety Policy</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Designated Safeguarding Lead:</strong> {{dsl_name}}<br/>
<strong>IT Lead:</strong> {{it_lead}}<br/>
<strong>Filtering Provider:</strong> {{filtering_provider}}<br/>
<strong>Monitoring Provider:</strong> {{monitoring_provider}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Purpose and Scope</h2>
<p>1.1 This policy sets out how {{school_name}} will protect pupils, staff and the wider school community from online harm and ensure the safe and responsible use of technology.</p>
<p>1.2 This policy applies to the <strong>whole school community</strong>: pupils, staff, governors, parents/carers, volunteers and visitors.</p>
<p>1.3 This policy should be read in conjunction with the school''s Safeguarding/Child Protection Policy, Staff Acceptable Use Policy, Anti-Bullying Policy, Behaviour Policy, and Data Protection Policy.</p>

<h2>2. Roles and Responsibilities</h2>
<p>2.1 <strong>Designated Safeguarding Lead ({{dsl_name}}):</strong> Has overall responsibility for online safety as part of their safeguarding role. Receives and acts on monitoring alerts, leads on online safety incidents, reports to governors, ensures training is delivered.</p>
<p>2.2 <strong>IT Lead ({{it_lead}}):</strong> Responsible for technical implementation of filtering and monitoring, maintaining security of school systems, advising on technology risks, supporting the DSL with technical investigations.</p>
<p>2.3 <strong>All Staff:</strong> Vigilance in identifying online safety concerns, reporting to DSL, modelling safe online behaviour, delivering online safety education within the curriculum, following the Acceptable Use Policy.</p>
<p>2.4 <strong>Governors:</strong> Strategic oversight of online safety, ensuring the school meets DfE standards for filtering and monitoring, reviewing this policy annually.</p>
<p>2.5 <strong>Pupils:</strong> Following the school''s online safety rules, reporting concerns, treating others with respect online.</p>
<p>2.6 <strong>Parents/Carers:</strong> Supporting the school''s online safety approach at home, reporting concerns to the school, attending information sessions.</p>

<h2>3. Education</h2>
<p>3.1 Online safety is taught through the <strong>PSHE and Computing curriculum</strong>, assemblies, tutor time, and dedicated events (e.g., Safer Internet Day).</p>
<p>3.2 Education is <strong>age-appropriate</strong> and covers:</p>
<ul>
<li>Online consent and privacy (managing personal information, understanding data collection)</li>
<li>Online relationships (healthy vs unhealthy, recognising grooming, consent in digital contexts)</li>
<li>Online wellbeing (screen time, social media impact, comparison culture, self-image)</li>
<li>Critical thinking and media literacy (recognising misinformation, fake news, bias, AI-generated content)</li>
<li>Reporting abuse and seeking help (CEOP, Childline, school reporting routes)</li>
<li>Healthy online habits and digital resilience</li>
<li>Copyright and intellectual property</li>
<li>The law relating to online activity (harassment, image sharing, fraud)</li>
</ul>

<h2>4. Filtering</h2>
<p>4.1 The school meets the <strong>DfE Filtering Standards 2023</strong> through the following provision:</p>
<ul>
<li>Filtering provider: {{filtering_provider}}</li>
<li>Filtering is applied across all school devices and the school network (including WiFi)</li>
<li>Filtering is <strong>age-appropriate</strong>, with different levels for staff and pupils where applicable</li>
<li>Filtering blocks access to illegal content (CSAM via IWF URL list), content harmful to children, and content inappropriate for the school environment</li>
<li>Filtering <strong>cannot be circumvented</strong> by users (VPN, proxy, alternative DNS blocked)</li>
<li>Filtering is <strong>reviewed regularly</strong> by the IT lead and DSL, with overblocking/underblocking monitored and addressed</li>
</ul>
<p>4.2 <strong>Senior leadership annual check:</strong> At least annually, the headteacher (or delegated senior leader) and DSL will review the effectiveness of the filtering system, including testing sample sites, reviewing the block/allow lists, and confirming the system meets DfE standards.</p>

<h2>5. Monitoring</h2>
<p>5.1 The school meets the <strong>DfE Monitoring Standards 2023</strong> through the following provision:</p>
<ul>
<li>Monitoring provider: {{monitoring_provider}}</li>
<li><strong>Proactive monitoring alerts</strong> are sent to the DSL for concerning online activity (self-harm, violence, extremism, sexual content, bullying, drug references)</li>
<li>Keyword and phrase monitoring is active across school devices and accounts</li>
<li>Monitoring is <strong>proportionate to risk</strong> and considers the balance between safeguarding and privacy</li>
<li>Staff are made aware that their use of school systems is monitored (via the AUP)</li>
</ul>

<h2>6. Specific Online Safety Issues</h2>

<h3>6.1 Cyberbullying</h3>
<p><strong>Definition:</strong> Bullying that takes place using technology (social media, messaging, gaming, websites, email, phone).</p>
<p><strong>Response:</strong> All reports taken seriously; evidence preserved (screenshots); investigated under Anti-Bullying Policy; sanctions applied as per Behaviour Policy; support for victim and perpetrator; parents informed; reported to police if criminal threshold met.</p>

<h3>6.2 Online Child Sexual Abuse (CSEA)</h3>
<p><strong>Recognition:</strong> Staff trained to recognise indicators of online sexual abuse including grooming behaviours, changes in behaviour, secrecy around device use, unexplained gifts.</p>
<p><strong>Response:</strong> Immediate report to DSL, who will refer to MASH/Children''s Social Care and/or the National Crime Agency (NCA) via CEOP. Staff must NOT view or search for indecent images of children (IIOC) -- this is a criminal offence.</p>

<h3>6.3 Youth-Produced Sexual Imagery (Sexting)</h3>
<p><strong>Definition:</strong> The sharing of sexual imagery (photos or videos) produced by and/or shared between young people.</p>
<p><strong>Response:</strong> Following KCSIE guidance and UKCIS guidance on sharing of nudes and semi-nudes:</p>
<ul>
<li>Do NOT view, copy or print the image (unless unavoidable to assess the nature of the image)</li>
<li>Report immediately to DSL</li>
<li>DSL conducts a risk assessment considering: age of those involved, content of image(s), whether shared with consent, extent of sharing, any coercion or exploitation</li>
<li>Involve police where: there is evidence of coercion or exploitation, the image involves a child under 13, there is reason to believe a child is at risk of harm, the image involves an adult</li>
<li>Confiscate device but do NOT search it (police to conduct search if needed)</li>
</ul>

<h3>6.4 Online Grooming</h3>
<p><strong>Warning signs:</strong> Secrecy about online activity, new online ''friends'' (especially adults), receiving unexplained gifts (including online currency/game items), changes in behaviour, withdrawal, sexualised language or behaviour.</p>
<p><strong>Response:</strong> Report to DSL immediately; DSL refers to MASH/Children''s Social Care and CEOP.</p>

<h3>6.5 Radicalisation Online</h3>
<p><strong>Context:</strong> Under the Prevent duty (Counter-Terrorism and Security Act 2015), the school must have due regard to the need to prevent people from being drawn into terrorism.</p>
<p><strong>Response:</strong> Staff who are concerned that a pupil is being radicalised (including through online content) must report to the DSL. The DSL will make a Prevent/Channel referral to the local authority or police as appropriate.</p>

<h3>6.6 Harmful Online Content</h3>
<p>The school educates pupils about and responds to:</p>
<ul>
<li><strong>Self-harm and suicide content:</strong> Immediate safeguarding response, CAMHS referral</li>
<li><strong>Eating disorder content:</strong> Safeguarding response, health referral</li>
<li><strong>Violence and gore:</strong> Education about impact, sanctions if shared deliberately</li>
<li><strong>Misogyny and incel content:</strong> Education, challenge attitudes, safeguarding if radicalisation risk</li>
<li><strong>Gambling:</strong> Education about risks, referral to support services</li>
</ul>

<h3>6.7 Online Challenges and Hoaxes</h3>
<p>The school monitors for emerging online challenges/hoaxes, provides timely education to pupils, communicates with parents, and responds to any harm caused.</p>

<h3>6.8 Gaming</h3>
<p>Education covers: age ratings (PEGI), in-game communication risks, excessive use, in-game purchases, online predators in gaming environments.</p>

<h3>6.9 Generative AI</h3>
<p>The school''s approach to generative AI tools:</p>
<ul>
<li><strong>Appropriate use:</strong> AI may be used as a learning tool where directed by staff, with pupils understanding AI output must be critically evaluated and verified</li>
<li><strong>Academic integrity:</strong> Pupils must not present AI-generated work as their own; staff will educate on academic honesty in the context of AI</li>
<li><strong>Data privacy:</strong> Pupils must not input personal data or identifying information into AI tools</li>
<li><strong>Content generation risks:</strong> AI tools may generate inaccurate, biased or inappropriate content; staff and pupils should be aware of this</li>
</ul>

<h2>7. Social Media</h2>
<p>7.1 <strong>Official school social media accounts</strong> are managed by designated staff, use approved platforms, and comply with safeguarding and data protection requirements.</p>
<p>7.2 <strong>Staff personal use:</strong> See Staff Acceptable Use Policy. Staff must not connect with current pupils on personal social media.</p>
<p>7.3 <strong>Parental use:</strong> Parents are asked to follow the school''s social media guidelines, including not photographing/filming other people''s children at school events for social media, and not posting negative or identifying content about pupils or staff in school-related social media groups.</p>

<h2>8. Mobile Phones -- Pupils</h2>
<p>8.1 The school''s policy on pupil mobile phones is as follows (select/adapt as applicable):</p>
<ul>
<li>Mobile phones are not permitted on school premises / must be handed in at the start of the day / may be brought to school but must remain switched off and in bags during the school day</li>
<li>Smartwatches with communication or camera capabilities are subject to the same rules</li>
<li>The school may confiscate devices under Section 91 of the Education Act 2011</li>
</ul>

<h2>9. Incident Response</h2>
<p>9.1 Online safety incidents will be managed as follows:</p>
<ol>
<li><strong>Report:</strong> Any concern reported to DSL immediately</li>
<li><strong>Assess:</strong> DSL assesses the nature and severity of the incident</li>
<li><strong>Evidence:</strong> Preserve evidence (screenshots, logs) but do NOT view illegal content (IIOC)</li>
<li><strong>Confiscate:</strong> Devices may be confiscated under Education Act 2011 s.91; do NOT search the device if illegal content suspected (police to search)</li>
<li><strong>Refer:</strong> Report to MASH/CEOP/Police as appropriate</li>
<li><strong>Support:</strong> Provide pastoral support to those involved</li>
<li><strong>Sanction:</strong> Apply behaviour policy as appropriate</li>
<li><strong>Record:</strong> Log on safeguarding/behaviour system</li>
<li><strong>Inform:</strong> Notify parents (unless doing so would put a child at greater risk)</li>
<li><strong>Review:</strong> Learn lessons and update practice/policy as needed</li>
</ol>

<h2>10. Review</h2>
<p>10.1 This policy is reviewed annually by the governing body and updated in response to new guidance, incidents or emerging risks.</p>
<p>10.2 Next review date: {{review_date}}</p>'
);


-- ============================================================
-- 11. BEHAVIOUR POLICY
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Behaviour Policy',
  'Comprehensive behaviour policy per DfE Behaviour in Schools guidance 2024. Covers school ethos, rewards, sanctions, searching/screening/confiscation, use of reasonable force, anti-bullying, peer-on-peer abuse, and behaviour outside school.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DFE-BIS-2024',
  'DfE Behaviour in Schools - Advice for Headteachers and School Staff 2024 / Education and Inspections Act 2006 s.89 / Education Act 2011 / DfE Searching, Screening and Confiscation 2022 / DfE Use of Reasonable Force 2013',
  '{"required_fields":["school_name","headteacher_name","behaviour_lead","review_date"],"optional_fields":["dsl_name","senco_name","chair_of_governors"]}',
  '<h1>Behaviour Policy</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Headteacher:</strong> {{headteacher_name}}<br/>
<strong>Behaviour Lead:</strong> {{behaviour_lead}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Ethos and Values</h2>
<p>1.1 {{school_name}} is committed to creating a positive, safe and respectful environment where all pupils can learn and thrive. We believe that high standards of behaviour are essential for effective teaching and learning, and for the wellbeing of the whole school community.</p>
<p>1.2 Our behaviour culture is built on <strong>high expectations for all</strong>, applied consistently, fairly and proportionately. We focus on developing positive behaviour through recognition and reward, while maintaining clear and understood consequences for behaviour that falls below the expected standard.</p>

<h2>2. School Rules and Expectations</h2>
<p>2.1 Our school expectations are:</p>
<ul>
<li><strong>Be Ready</strong> -- arrive on time, be prepared to learn, have equipment</li>
<li><strong>Be Respectful</strong> -- treat everyone with kindness and courtesy, listen to others, follow instructions, care for the environment</li>
<li><strong>Be Safe</strong> -- follow safety rules, keep hands and feet to yourself, report concerns, look after each other</li>
</ul>
<p>2.2 These expectations apply at all times: in lessons, during break and lunch, in corridors and communal areas, on school trips, and when representing the school.</p>

<h2>3. Roles and Responsibilities</h2>
<p>3.1 <strong>Governing Body:</strong> Sets the general framework for the behaviour policy under Section 89 of the Education and Inspections Act 2006. Reviews the policy annually. Monitors exclusion data and behavioural trends.</p>
<p>3.2 <strong>Headteacher:</strong> Determines the detail of the behaviour policy within the framework set by governors. Ensures consistent implementation. Makes decisions on exclusions.</p>
<p>3.3 <strong>All Staff:</strong> Responsible for consistent implementation of the behaviour policy. Model positive behaviour. Use de-escalation strategies. Record and report incidents as required.</p>
<p>3.4 <strong>Pupils:</strong> Follow school rules and expectations. Report bullying and concerns. Treat others with respect.</p>
<p>3.5 <strong>Parents/Carers:</strong> Support the school''s behaviour expectations. Work in partnership with the school when concerns arise. Attend meetings when requested. Model positive behaviour and attitudes.</p>

<h2>4. Classroom Management</h2>
<p>4.1 Teachers are responsible for establishing clear routines and expectations within their classrooms.</p>
<p>4.2 Effective classroom management includes:</p>
<ul>
<li>Clear, consistent routines (entering the room, starting work, transitions, end of lesson)</li>
<li>Positive reinforcement of expected behaviour (praise, recognition)</li>
<li>Planned, graduated consequences for behaviour that falls below expectations</li>
<li>Calm, assertive communication</li>
<li>De-escalation strategies before consequences are applied</li>
<li>Seating plans that support learning and positive behaviour</li>
<li>Engaging, well-paced lessons that minimise opportunities for off-task behaviour</li>
</ul>

<h2>5. Rewards</h2>
<p>5.1 Positive behaviour is recognised and rewarded through:</p>
<ul>
<li>Verbal praise (specific and genuine)</li>
<li>Merit points / house points / stickers / stamps</li>
<li>Certificates and awards (weekly, termly, annual)</li>
<li>Positive notes or phone calls home to parents/carers</li>
<li>Privileges and responsibilities (e.g., leading activities, representing the school)</li>
<li>Celebration assemblies</li>
<li>Head teacher awards / gold awards for exceptional behaviour or effort</li>
</ul>

<h2>6. Sanctions</h2>
<p>6.1 Sanctions are applied in a <strong>graduated, proportionate</strong> manner. The following sequence represents the typical escalation, but staff will use professional judgement to select the most appropriate response based on the context:</p>
<ol>
<li><strong>Verbal reminder:</strong> A private, calm reminder of the expected behaviour</li>
<li><strong>Formal warning:</strong> A clear statement that the behaviour is unacceptable, with the consequence explained</li>
<li><strong>Consequence:</strong> Detention, loss of privilege, time out, or relocation within the classroom</li>
<li><strong>Internal exclusion / removal from class:</strong> Sent to another classroom or designated space with work, for a defined period</li>
<li><strong>SLT involvement:</strong> Referred to senior leadership for further sanction and/or parental contact</li>
<li><strong>Fixed-term suspension:</strong> In accordance with DfE Suspension and Permanent Exclusion from Maintained Schools, Academies and Pupil Referral Units in England 2023</li>
<li><strong>Permanent exclusion:</strong> For the most serious offences or persistent disruptive behaviour, as a last resort</li>
</ol>
<p>6.2 Sanctions must <strong>never</strong> be humiliating, degrading or designed to embarrass a pupil.</p>

<h2>7. Detentions</h2>
<p>7.1 Teachers have a legal power to issue detentions (Education Act 2011). Parents do not need to consent.</p>
<p>7.2 <strong>Break and lunchtime detentions:</strong> May be issued without prior notice. Staff must ensure the pupil has reasonable time to eat, drink and use the toilet.</p>
<p>7.3 <strong>After-school detentions:</strong> Reasonable notice must be given (at least 24 hours for pupils under 18), taking into account the pupil''s age, transport arrangements, and any caring responsibilities.</p>
<p>7.4 Parents will be notified in advance of after-school detentions.</p>

<h2>8. Searching, Screening and Confiscation</h2>
<p>8.1 <strong>Searching with consent:</strong> Any member of staff may ask a pupil to turn out their pockets, bag or locker with the pupil''s consent. If consent is refused, the school may conduct a search without consent as below, or apply a sanction for the refusal.</p>
<p>8.2 <strong>Searching without consent (statutory power):</strong> Under Section 550ZA of the Education Act 1996 (as inserted by the Education Act 2011), the headteacher and authorised staff may search pupils without consent for:</p>
<ul>
<li><strong>Prohibited items:</strong> Knives or weapons, alcohol, illegal drugs, stolen items, tobacco and cigarette papers, vapes, fireworks, pornographic images, any article that the member of staff reasonably suspects has been or is likely to be used to commit an offence, cause personal injury or damage to property</li>
<li><strong>Any item banned by the school rules</strong></li>
</ul>
<p>8.3 Searches without consent should normally be conducted by <strong>two members of staff</strong> (the searcher and a witness), and the searcher should be the same sex as the pupil. Opposite-sex searches are permitted where there is reason to believe there is a risk that serious harm will be caused if the search is not conducted immediately and it is not reasonably practicable for a same-sex search.</p>
<p>8.4 <strong>Strip searches</strong> should only ever be carried out by the police. School staff should never conduct a strip search.</p>
<p>8.5 <strong>Confiscation:</strong> Staff may confiscate any prohibited or banned item found during a search. Prohibited items (weapons, drugs, child sexual abuse images) must be handed to the police. Other items may be returned to the pupil or parent, retained or disposed of at the school''s discretion.</p>
<p>8.6 <strong>Electronic devices:</strong> Under Section 550ZC of the Education Act 1996, staff may examine data on electronic devices if they have reasonable cause to suspect it contains evidence of a breach of school rules, a criminal offence, pornographic images, or may be useful for a safeguarding investigation. Staff must NOT view content suspected to be indecent images of children (IIOC) -- hand the device to the police.</p>
<p>8.7 All searches must be <strong>recorded</strong> (date, time, pupil, reason, who searched, what was found, outcome).</p>

<h2>9. Use of Reasonable Force</h2>
<p>9.1 All school staff have a <strong>legal power to use reasonable force</strong> to prevent pupils from committing an offence, injuring themselves or others, or damaging property, and to maintain good order and discipline (Education and Inspections Act 2006, s.93).</p>
<p>9.2 Force may be used in the following circumstances (this is not exhaustive):</p>
<ul>
<li>To prevent a pupil from attacking a member of staff or another pupil</li>
<li>To prevent a pupil from hurting themselves</li>
<li>To remove a disruptive pupil from a classroom where they have refused to leave</li>
<li>To prevent a pupil from causing damage to property</li>
<li>To prevent a pupil from leaving a supervised area where leaving would put them at risk</li>
</ul>
<p>9.3 Force must <strong>never</strong> be used as a punishment. Any force used must be <strong>reasonable, proportionate and necessary</strong> in the circumstances.</p>
<p>9.4 Following any incident involving the use of force:</p>
<ul>
<li>The incident must be recorded promptly and in detail</li>
<li>The headteacher must be informed</li>
<li>Parents must be informed as soon as reasonably practicable</li>
<li>Post-incident support must be provided to the pupil, the staff member involved, and any witnesses</li>
<li>A debrief will take place to consider whether the force used was appropriate and whether any changes to practice are needed</li>
</ul>

<h2>10. Pupil Support and Behaviour Interventions</h2>
<p>10.1 The school recognises that behaviour may be a form of communication of unmet need.</p>
<p>10.2 Where a pupil''s behaviour is persistent or concerning, the school will:</p>
<ul>
<li>Consider whether an undiagnosed SEND may be contributing (assessment pathway via SENCO)</li>
<li>Develop a <strong>Pastoral Support Plan (PSP)</strong> with clear targets, strategies, support and review dates</li>
<li>Make <strong>reasonable adjustments</strong> for pupils with disabilities (Equality Act 2010)</li>
<li>Consider referral to external agencies (CAMHS, Early Help, Educational Psychology)</li>
<li>Consider alternative provision or a managed move where appropriate</li>
</ul>

<h2>11. Anti-Bullying</h2>
<p>11.1 Bullying (including cyberbullying) is not tolerated at {{school_name}}. Full details of the school''s approach are set out in the separate <strong>Anti-Bullying Policy</strong>.</p>
<p>11.2 Key principles: all reports are taken seriously; investigated promptly; victim supported; perpetrator held to account and supported to change behaviour; parents involved; incidents recorded and monitored by characteristic.</p>

<h2>12. Sexual Violence and Sexual Harassment</h2>
<p>12.1 The school follows <strong>KCSIE 2024 Part 5</strong> in responding to reports of sexual violence and sexual harassment between children.</p>
<p>12.2 All reports are taken seriously. The DSL will conduct an initial risk assessment and determine the appropriate response (internal management, Early Help, referral to Children''s Social Care, referral to police).</p>
<p>12.3 The school maintains a culture of <strong>zero tolerance</strong> for sexual violence and harassment, while recognising the importance of a proportionate and supportive response.</p>

<h2>13. Peer-on-Peer Abuse</h2>
<p>13.1 The school recognises that children can abuse other children and that this can take many forms (physical, emotional, sexual, financial, online).</p>
<p>13.2 All staff are trained to recognise and report peer-on-peer abuse. It is never acceptable, and will not be dismissed as ''banter'' or ''just having a laugh''.</p>
<p>13.3 All allegations are reported to the DSL and managed under safeguarding procedures.</p>

<h2>14. Behaviour Outside School</h2>
<p>14.1 Under Section 89(5) of the Education and Inspections Act 2006, the school may discipline pupils for behaviour outside school where it is reasonable to do so. This includes:</p>
<ul>
<li>Behaviour on the journey to and from school</li>
<li>Behaviour on school trips and off-site activities</li>
<li>Online conduct that affects members of the school community or brings the school into disrepute</li>
<li>Behaviour that could have repercussions for the orderly running of the school</li>
<li>Behaviour that poses a threat to another pupil or member of the public</li>
</ul>

<h2>15. Suspensions and Permanent Exclusions</h2>
<p>15.1 The headteacher may suspend or permanently exclude a pupil in accordance with <strong>DfE guidance on Suspension and Permanent Exclusion 2023</strong>.</p>
<p>15.2 Suspension and exclusion are used as a last resort, and only where allowing the pupil to remain in school would seriously harm the education or welfare of the pupil or others.</p>
<p>15.3 Full details, including the process for representation and independent review panels, are available in the school''s Exclusions Policy (or available on request).</p>

<h2>16. Pupil Voice</h2>
<p>16.1 Pupils are consulted on the behaviour policy through school council, surveys and focus groups. Their views are considered when the policy is reviewed.</p>

<h2>17. Recording and Monitoring</h2>
<p>17.1 Behaviour incidents are recorded on the school''s behaviour management system. Data is analysed termly by:</p>
<ul>
<li>Type of incident</li>
<li>Protected characteristic (ethnicity, gender, SEND, FSM)</li>
<li>Year group</li>
<li>Time and location</li>
<li>Staff involvement</li>
</ul>
<p>17.2 Patterns and trends are reported to the governing body termly. Disproportionality in sanctions by characteristic is monitored and acted upon.</p>

<h2>18. Mental Health</h2>
<p>18.1 The school recognises that <strong>behaviour may be a communication of unmet need</strong>, including mental health difficulties.</p>
<p>18.2 Staff are trained to recognise signs of mental health difficulties and to respond with empathy while maintaining high expectations.</p>
<p>18.3 Where behaviour is linked to identified SEND or mental health needs, the school will follow the SEND assessment pathway and make reasonable adjustments to sanctions and support.</p>

<h2>19. Review</h2>
<p>19.1 This policy is reviewed annually by the governing body.</p>
<p>19.2 Next review date: {{review_date}}</p>'
);

-- ============================================================
-- 12. ANTI-BULLYING POLICY
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Anti-Bullying Policy',
  'Detailed anti-bullying policy covering all forms of bullying including prejudice-based and cyberbullying, with prevention strategies, 5-step response process, recording and monitoring requirements.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'EIA2006-S89-BULLY',
  'Education and Inspections Act 2006 s.89 / Equality Act 2010 / DfE Preventing and Tackling Bullying 2017 / KCSIE 2024 / Protection from Harassment Act 1997',
  '{"required_fields":["school_name","anti_bullying_lead","review_date"],"optional_fields":["dsl_name","senco_name","headteacher_name"]}',
  '<h1>Anti-Bullying Policy</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Anti-Bullying Lead:</strong> {{anti_bullying_lead}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Introduction</h2>
<p>1.1 {{school_name}} is committed to providing a safe, caring and inclusive environment where every pupil is valued and respected. Bullying of any kind is unacceptable, and this policy sets out how we prevent, identify, respond to and monitor bullying.</p>
<p>1.2 Under Section 89 of the <strong>Education and Inspections Act 2006</strong>, the headteacher must determine measures to prevent all forms of bullying among pupils. This policy fulfils that requirement.</p>

<h2>2. Definition of Bullying</h2>
<p>2.1 Bullying is behaviour by an individual or group, usually <strong>repeated over time</strong>, that <strong>intentionally hurts</strong> another individual or group either physically or emotionally, and involves an <strong>imbalance of power</strong>.</p>
<p>2.2 Bullying is distinguished from one-off conflicts or disagreements by its repetitive nature, the intent to cause harm, and the power imbalance between those involved.</p>
<p>2.3 However, single serious incidents (particularly online) can constitute bullying and will be treated as such.</p>

<h2>3. Forms of Bullying</h2>
<ul>
<li><strong>Physical:</strong> Hitting, kicking, pushing, spitting, taking or damaging belongings, any form of physical violence</li>
<li><strong>Verbal:</strong> Name-calling, threats, taunting, mocking, making offensive comments</li>
<li><strong>Emotional:</strong> Excluding from groups, spreading rumours, humiliating, manipulating friendships, intimidation</li>
<li><strong>Online/Cyber:</strong> Bullying via social media, messaging apps, gaming platforms, email, websites, sharing images without consent, creating fake profiles, online exclusion, repeated unwanted contact</li>
</ul>

<h2>4. Prejudice-Based Bullying</h2>
<p>4.1 The school takes particularly seriously bullying that is motivated by prejudice or directed at a protected characteristic:</p>
<ul>
<li><strong>Racial bullying:</strong> Based on ethnicity, nationality or skin colour. Includes racist language, jokes, graffiti, exclusion. Protected under the Equality Act 2010. All racial incidents are recorded and reported to the local authority.</li>
<li><strong>Homophobic, biphobic and transphobic bullying:</strong> Directed at someone because of their actual or perceived sexual orientation or gender identity. Includes use of ''gay'' as a pejorative term.</li>
<li><strong>Disability-related bullying:</strong> Targeting a pupil because of a disability or perceived disability. Includes mocking, excluding, refusing to work with, taking advantage of.</li>
<li><strong>Sexist bullying:</strong> Based on gender, including sexual harassment, unwanted sexual attention, gender-based derogatory language.</li>
<li><strong>Religious bullying:</strong> Targeting someone because of their religion, faith or lack of faith.</li>
<li><strong>Appearance-related bullying:</strong> Based on physical appearance, weight, height, clothing.</li>
<li><strong>SEN-related bullying:</strong> Targeting pupils with special educational needs.</li>
<li><strong>Bullying of young carers:</strong> Targeting pupils with caring responsibilities at home.</li>
<li><strong>Bullying of looked-after children:</strong> Targeting children in the care system.</li>
</ul>

<h2>5. Sexual Bullying and Harassment</h2>
<p>5.1 Sexual bullying includes sexual or sexist language, unwanted touching, sexual innuendo, demanding sexual favours, and sharing of sexual images without consent.</p>
<p>5.2 This is taken extremely seriously and managed in accordance with <strong>KCSIE 2024 Part 5</strong>. Where the behaviour may constitute a criminal offence, the police will be informed.</p>

<h2>6. Signs and Symptoms</h2>
<p>6.1 All staff should be alert to the following signs that a pupil may be being bullied:</p>
<ul>
<li>Anxiety, fearfulness, reluctance to attend school or travel on the school bus</li>
<li>Withdrawal from social activities, becoming isolated</li>
<li>Deterioration in academic performance</li>
<li>Unexplained injuries, damaged clothing or broken belongings</li>
<li>Missing belongings or money</li>
<li>Changes in eating or sleeping patterns</li>
<li>Self-harm, suicidal thoughts or attempted suicide</li>
<li>Reluctance to use the toilet at school (often a sign of being targeted in less supervised spaces)</li>
<li>Becoming aggressive or unreasonable (sometimes a response to being bullied)</li>
<li>Giving improbable excuses for any of the above</li>
</ul>

<h2>7. Prevention</h2>
<p>7.1 The school prevents bullying through:</p>
<ul>
<li><strong>Culture:</strong> Promoting a culture of respect, kindness and inclusion, underpinned by the school''s values</li>
<li><strong>Curriculum:</strong> PSHE lessons, assemblies, tutor time activities, and cross-curricular opportunities to explore themes of respect, empathy, diversity and conflict resolution</li>
<li><strong>Events:</strong> Anti-Bullying Week (November), Safer Internet Day, themed assemblies and workshops</li>
<li><strong>Peer support:</strong> Anti-bullying ambassadors/champions, peer mentors, buddy systems</li>
<li><strong>Restorative practice:</strong> Developing pupils'' ability to resolve conflicts constructively</li>
<li><strong>Staff training:</strong> All staff receive annual training on recognising, preventing and responding to bullying; new staff receive induction training</li>
<li><strong>Pupil voice:</strong> Regular anti-bullying surveys, school council involvement in policy development</li>
<li><strong>Parental engagement:</strong> Information sessions, resources shared through newsletters, clear reporting routes publicised</li>
</ul>

<h2>8. Reporting</h2>
<p>8.1 The school provides multiple routes for reporting bullying:</p>
<ul>
<li>Tell any member of staff (class teacher, form tutor, TA, lunchtime supervisor, any adult)</li>
<li>Tell a peer mentor or anti-bullying ambassador</li>
<li>Use the school''s worry box / online reporting system</li>
<li>Parent/carer reports to school (phone, email, in person)</li>
<li>Anonymous reports (investigated where possible, but anonymity may limit the school''s ability to take action)</li>
</ul>
<p>8.2 <strong>No barrier to reporting:</strong> Pupils will never be made to feel that reporting is ''telling tales'' or will result in negative consequences for them. All reports will be taken seriously.</p>

<h2>9. Responding -- Five-Step Process</h2>

<h3>Step 1: Listen and Take Seriously</h3>
<p>Listen to the pupil (or parent) calmly and without judgement. Reassure them that they are right to report. Do not promise confidentiality, but explain that information will only be shared with those who need to know in order to help.</p>

<h3>Step 2: Investigate Promptly</h3>
<p>Investigate within <strong>24 hours</strong> of the report being received. Interview the pupil who reported, the alleged perpetrator(s), and any witnesses, separately and sensitively. Gather evidence (including online evidence -- screenshots, messages). Consider whether the situation meets the definition of bullying or is a one-off conflict (both will be addressed, but the response may differ).</p>

<h3>Step 3: Record All Incidents</h3>
<p>Record the report, the investigation, the findings and the outcome on the school''s behaviour/safeguarding system. Ensure the record captures the type of bullying (including any prejudice-based element).</p>

<h3>Step 4: Apply Appropriate Sanctions</h3>
<p>Sanctions are graduated and proportionate, following the school''s Behaviour Policy. They may include: apology (genuine, not forced), loss of privileges, detention, internal exclusion, fixed-term suspension, or permanent exclusion in the most serious cases. The purpose of sanctions is to signal that the behaviour is unacceptable and to deter repetition.</p>

<h3>Step 5: Follow Up</h3>
<p>Follow up with <strong>both the victim and the perpetrator</strong> at intervals of 1 week, 2 weeks and 4 weeks to ensure the bullying has stopped, the victim feels safe, and the perpetrator is being supported to change behaviour. Record follow-up on the system.</p>

<h2>10. Cyberbullying -- Specific Response</h2>
<ul>
<li><strong>Evidence:</strong> Ask the pupil (or help them) to take screenshots of the bullying. Do NOT delete messages or posts until evidence has been preserved.</li>
<li><strong>School jurisdiction:</strong> The school can take action in relation to cyberbullying that occurs outside school where it affects the school community (Education and Inspections Act 2006, s.89(5)).</li>
<li><strong>Platform reporting:</strong> Report the content to the social media platform/service provider for removal.</li>
<li><strong>Police involvement:</strong> Report to the police where the content may constitute a criminal offence under the Malicious Communications Act 1988, Communications Act 2003, Protection from Harassment Act 1997, or the Online Safety Act 2023 (offences related to intimate image sharing).</li>
<li><strong>Block:</strong> Advise the pupil on how to block the perpetrator and adjust privacy settings.</li>
</ul>

<h2>11. Support for Victims</h2>
<ul>
<li>Pastoral support from form tutor / key adult</li>
<li>Counselling referral (school counsellor or external service)</li>
<li>Safety plan (what to do if it happens again, safe spaces, trusted adults)</li>
<li>Monitoring by staff (increased vigilance in identified hotspot times/locations)</li>
<li>Parent/carer involved and updated throughout</li>
</ul>

<h2>12. Support for Perpetrators</h2>
<ul>
<li>Understand root cause (is the perpetrator themselves a victim? Are there SEND, home or wellbeing issues?)</li>
<li>Behaviour modification programme (empathy work, restorative conversations, social skills)</li>
<li>Clear expectations and consequences for further incidents</li>
<li>Monitoring and review</li>
<li>Parental involvement and support</li>
</ul>

<h2>13. Support for Bystanders</h2>
<ul>
<li>Empower bystanders to report without fear of retaliation</li>
<li>Educate on the role of the bystander (upstander vs passive bystander)</li>
<li>Support those who witnessed bullying and may be affected</li>
</ul>

<h2>14. Working with Parents</h2>
<ul>
<li>Parents of both victim and perpetrator are notified promptly when bullying is confirmed</li>
<li>Parents are involved in the resolution process</li>
<li>Parents are provided with resources and guidance on supporting their child (victim or perpetrator)</li>
<li>Parents are directed to external support services where appropriate</li>
</ul>

<h2>15. Recording and Monitoring</h2>
<p>15.1 All bullying incidents are recorded on the school''s management information system.</p>
<p>15.2 Data is analysed <strong>termly</strong> by:</p>
<ul>
<li>Type of bullying (physical, verbal, emotional, cyber, prejudice-based)</li>
<li>Protected characteristic involved</li>
<li>Year group</li>
<li>Time and location of incidents</li>
<li>Outcome and effectiveness of intervention</li>
</ul>
<p>15.3 A summary is reported to the governing body each term. The governing body monitors trends and ensures the policy is effective.</p>
<p>15.4 Findings inform the annual review of the policy and the school''s equality objectives.</p>

<h2>16. Staff Who Bully</h2>
<p>16.1 Allegations of bullying by staff members will be investigated under the school''s <strong>Staff Disciplinary Procedure</strong> and may constitute gross misconduct.</p>
<p>16.2 Allegations of bullying by staff against pupils may also require a safeguarding response under KCSIE 2024 Part 4 (allegations against staff).</p>

<h2>17. When Bullying Constitutes a Criminal Offence</h2>
<p>17.1 The school will report to the police where bullying behaviour may constitute:</p>
<ul>
<li>Harassment (Protection from Harassment Act 1997)</li>
<li>Threats to kill or cause serious harm</li>
<li>Assault (physical or sexual)</li>
<li>Sharing of intimate images without consent (Online Safety Act 2023)</li>
<li>Malicious communications (Malicious Communications Act 1988)</li>
<li>Sending grossly offensive communications (Communications Act 2003, s.127)</li>
</ul>

<h2>18. Training</h2>
<p>18.1 All staff receive anti-bullying training annually, covering recognition, prevention, response and recording.</p>
<p>18.2 New staff receive induction training on this policy within their first week.</p>
<p>18.3 Governors receive training on their oversight role.</p>

<h2>19. Review</h2>
<p>19.1 This policy is reviewed annually. Pupils, parents and staff are consulted as part of the review.</p>
<p>19.2 Next review date: {{review_date}}</p>'
);

-- ============================================================
-- 13. CHARGING AND REMISSIONS POLICY
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Charging and Remissions Policy',
  'Statutory charging and remissions policy per Education Act 1996 ss.449-462. Covers what schools can and cannot charge for, voluntary contributions, residential trips, music tuition, and remissions for disadvantaged pupils.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'EA1996-S449-462',
  'Education Act 1996 ss.449-462 / DfE Charging for School Activities 2023 / Education (Prescribed Public Examinations) Order',
  '{"required_fields":["school_name","review_date"],"optional_fields":["headteacher_name","finance_officer","chair_of_governors"]}',
  '<h1>Charging and Remissions Policy</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Introduction</h2>
<p>1.1 This policy sets out the circumstances in which {{school_name}} will make charges for activities and the circumstances in which charges will be waived or reduced (remissions). It complies with <strong>Sections 449-462 of the Education Act 1996</strong> and the <strong>DfE guidance on Charging for School Activities (2023)</strong>.</p>

<h2>2. Legal Principle</h2>
<p>2.1 Education provided during school hours is <strong>free of charge</strong>. No charge may be made for admitting pupils to maintained schools or academies.</p>
<p>2.2 The Education Act 1996 permits charges to be made in certain defined circumstances, as set out below.</p>

<h2>3. What the School CANNOT Charge For</h2>
<p>3.1 The school will <strong>not</strong> charge for:</p>
<ul>
<li><strong>Admission</strong> to the school</li>
<li><strong>Education provided during school hours</strong> (including the supply of any materials, books, instruments or other equipment necessary for the delivery of the National Curriculum or statutory religious education)</li>
<li><strong>Entry to prescribed public examinations</strong> where the pupil has been prepared for the examination by the school (first attempt)</li>
<li><strong>Materials or equipment</strong> required for National Curriculum subjects or statutory religious education</li>
<li><strong>Supply teacher costs</strong> to cover for an absent teacher</li>
<li><strong>Transport</strong> to and from school, or transport between school sites where the pupil is enrolled at both, during normal school hours</li>
<li><strong>Transporting registered pupils to other premises</strong> where the governing body or local authority has arranged for pupils to be educated</li>
</ul>

<h2>4. What the School CAN Charge For</h2>
<p>4.1 <strong>Optional extras:</strong> Activities that take place wholly or mainly outside school hours and are not part of the National Curriculum, statutory religious education or examination preparation. These are offered as ''optional extras'' and participation is voluntary. The charge may include:</p>
<ul>
<li>Teaching and non-teaching staff costs (including travel/subsistence)</li>
<li>Materials, equipment and transport costs</li>
<li>Admission charges to venues</li>
<li>Insurance costs</li>
</ul>
<p>4.2 <strong>Board and lodging on residential trips:</strong> The school may charge for the cost of board and lodging on residential trips, even where the educational activities take place during school hours. The charge must not exceed the actual cost of the board and lodging. No charge is made for the education element of any residential trip that takes place during school hours.</p>
<p>4.3 <strong>Individual or small-group instrumental music tuition:</strong> The school may charge for vocal or instrumental tuition provided to individual pupils or groups of up to four, provided that the tuition is <strong>not part of the National Curriculum</strong> or a prescribed public examination syllabus being followed by the pupil. Tuition that forms part of the first access (whole-class) programme is free.</p>
<p>4.4 <strong>Examination resits:</strong> The school may charge for examination entry where the pupil is resitting and <strong>no further preparation</strong> has been provided by the school.</p>
<p>4.5 <strong>Community facilities:</strong> The school may charge for the use of school premises and facilities by the community (lettings), in accordance with a separate lettings policy.</p>
<p>4.6 <strong>Extended services and wraparound care:</strong> The school may charge for before-school, after-school and holiday club provision.</p>
<p>4.7 <strong>Damage to school property:</strong> Where a pupil''s behaviour results in wilful damage to school property, or where school property is lost by a pupil, the school may charge the parent/carer for the cost of repair or replacement.</p>
<p>4.8 <strong>Examination subject changes:</strong> The school may charge for additional costs incurred where a pupil changes an examination entry after the school''s published deadline.</p>

<h2>5. Residential Trips</h2>
<p>5.1 <strong>Residential trips during school hours:</strong> No charge will be made for the educational element. A charge will be made for board and lodging, except for pupils eligible for remission (see Section 7).</p>
<p>5.2 <strong>Residential trips outside school hours:</strong> Where the trip is an optional extra (wholly or mainly outside school hours and not required for the curriculum), the full cost may be charged.</p>
<p>5.3 Residential trips will not proceed unless sufficient funding (through a combination of charges, voluntary contributions and school subsidy) is available to cover the cost.</p>

<h2>6. Voluntary Contributions</h2>
<p>6.1 The school may from time to time <strong>request voluntary contributions</strong> from parents/carers for the benefit of the school or to support school activities (including trips and visits during school hours).</p>
<p>6.2 <strong>Important:</strong></p>
<ul>
<li>Contributions are <strong>genuinely voluntary</strong>. There is no obligation to contribute.</li>
<li><strong>No pupil will be excluded from an activity</strong> because their parent/carer has not contributed or cannot afford to contribute.</li>
<li>However, if insufficient voluntary contributions are received, the school may need to <strong>cancel the activity</strong>.</li>
<li>The school will make clear in all communications that contributions are voluntary and that no pupil will be disadvantaged by non-payment.</li>
</ul>

<h2>7. Remissions (Fee Waivers)</h2>
<p>7.1 The school will <strong>remit (waive) the charge</strong> for board and lodging on residential trips for pupils whose parents/carers are in receipt of one or more of the following benefits:</p>
<ul>
<li>Income Support</li>
<li>Income-based Jobseeker''s Allowance</li>
<li>Income-related Employment and Support Allowance</li>
<li>Universal Credit (where net earned income does not exceed 7,400 pounds per annum)</li>
<li>Child Tax Credit (where annual gross income is no more than 16,190 pounds and not also in receipt of Working Tax Credit other than during the 4-week run-on period)</li>
<li>The guarantee element of Pension Credit</li>
<li>Support under Part VI of the Immigration and Asylum Act 1999</li>
</ul>
<p>7.2 These are the same criteria used to determine eligibility for <strong>Free School Meals</strong>.</p>
<p>7.3 <strong>Extended remissions:</strong> At the discretion of the governing body, the school may also offer reduced charges or full remissions to families experiencing financial hardship who do not meet the criteria above. Requests should be made in confidence to the headteacher.</p>

<h2>8. Music Tuition</h2>
<p>8.1 The school may charge for individual or small-group vocal or instrumental tuition that is <strong>not part of the National Curriculum</strong>.</p>
<p>8.2 The school <strong>cannot charge</strong> for tuition where it is part of the whole-class curriculum (e.g., first-access music programmes such as Wider Opportunities).</p>
<p>8.3 The school will offer <strong>concessionary rates</strong> for pupils eligible for Pupil Premium and will seek additional funding (e.g., from music hubs) to support access to music tuition for all pupils regardless of financial circumstances.</p>

<h2>9. Breakage and Damage</h2>
<p>9.1 The school may charge for the cost of repairing or replacing property where a pupil has <strong>wilfully damaged</strong> school property, or where school property has been <strong>lost</strong> by a pupil.</p>
<p>9.2 This includes library books, textbooks, IT equipment and other school resources.</p>
<p>9.3 Charges will reflect the actual cost of repair or replacement.</p>

<h2>10. Refund Policy</h2>
<p>10.1 Where an activity is cancelled by the school, all charges paid will be refunded in full.</p>
<p>10.2 Where a pupil withdraws from a chargeable activity, a refund may be offered at the school''s discretion, depending on whether the costs have already been committed. Refunds are more likely where reasonable notice of withdrawal is given.</p>

<h2>11. Review</h2>
<p>11.1 This policy is reviewed annually by the governing body as part of the annual budget setting process.</p>
<p>11.2 Next review date: {{review_date}}</p>'
);

-- ============================================================
-- 14. PAY POLICY
-- ============================================================
INSERT INTO compliance_templates (
  id, template_type, name, description, school_phase, jurisdiction,
  maintained_by, version, is_statutory, dfe_reference, source_reference,
  json_schema, content_html
) VALUES (
  gen_random_uuid(),
  'policy',
  'Pay Policy',
  'School pay policy per STPCD covering teacher pay ranges, progression, UPS application, leadership pay, TLRs, SEN allowances, support staff pay, and annual review process.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'STPCD-2024',
  'School Teachers'' Pay and Conditions Document 2024 / Education Act 2002 / Equality Act 2010',
  '{"required_fields":["school_name","review_date"],"optional_fields":["headteacher_name","hr_contact","chair_of_governors","pay_committee_chair"]}',
  '<h1>Pay Policy</h1>
<p><strong>School:</strong> {{school_name}}<br/>
<strong>Review Date:</strong> {{review_date}}</p>

<h2>1. Introduction</h2>
<p>1.1 This policy sets out the framework for making decisions on teachers'' and support staff pay at {{school_name}}. It has been developed in accordance with the <strong>School Teachers'' Pay and Conditions Document (STPCD) 2024</strong>, the <strong>Education Act 2002</strong>, and the <strong>Equality Act 2010</strong>.</p>
<p>1.2 The governing body is responsible for adopting a pay policy and for making decisions on pay in accordance with that policy. The day-to-day management of pay matters is delegated to the headteacher, with oversight from the Pay Committee of the governing body.</p>

<h2>2. Scope</h2>
<p>2.1 This policy applies to all staff employed by the governing body of {{school_name}}, including:</p>
<ul>
<li>Teachers on the main pay range (MPR)</li>
<li>Teachers on the upper pay range (UPR)</li>
<li>Leading practitioners</li>
<li>Unqualified teachers</li>
<li>Leadership group (headteacher, deputy headteacher(s), assistant headteacher(s))</li>
<li>Support staff</li>
</ul>

<h2>3. Teacher Pay Ranges</h2>
<h3>3.1 Main Pay Range (MPR)</h3>
<p>Teachers will be placed on the main pay range on appointment, with the starting point determined by the headteacher taking into account the teacher''s qualifications, experience and the school''s ability to recruit. The MPR consists of points M1 to M6 (or as defined in the current STPCD).</p>

<h3>3.2 Upper Pay Range (UPR)</h3>
<p>Teachers who have reached the top of the MPR may apply to progress to the upper pay range. The UPR consists of points UPS1 to UPS3 (or as defined in the current STPCD). See Section 5 for the application process.</p>

<h3>3.3 Leading Practitioner Range</h3>
<p>Leading practitioner posts are for teachers whose primary purpose includes modelling and leading improvement of teaching skills across the school. The pay range is set by the governing body within the range specified in the STPCD.</p>

<h3>3.4 Unqualified Teacher Range</h3>
<p>Teachers without Qualified Teacher Status are placed on the unqualified teacher pay range as defined in the STPCD. On gaining QTS, the teacher will be transferred to the main pay range.</p>

<h3>3.5 Leadership Group</h3>
<p>See Section 6 below.</p>

<h2>4. Teacher Pay Progression</h2>
<p>4.1 Pay progression for teachers on the MPR and UPR is based on the <strong>annual appraisal review</strong>, as required by the Education (School Teachers'' Appraisal) (England) Regulations 2012.</p>
<p>4.2 Teachers will be eligible for pay progression where they have demonstrated:</p>
<ul>
<li>Sustained high quality of teaching, as evidenced through appraisal observations, work scrutiny, pupil progress data and other monitoring</li>
<li>Achievement of (or substantial progress towards) their appraisal objectives</li>
<li>Compliance with <strong>Part 2 of the Teachers'' Standards</strong> (personal and professional conduct)</li>
</ul>
<p>4.3 Pay progression is not automatic. The governing body (via the Pay Committee) will make decisions on progression based on the headteacher''s recommendation and the evidence from the appraisal process.</p>
<p>4.4 Where a teacher is subject to capability proceedings, pay progression will not be awarded.</p>

<h2>5. Application to the Upper Pay Range</h2>
<p>5.1 A teacher on the top of the MPR may apply to the headteacher to be assessed for progression to the upper pay range.</p>
<p>5.2 Applications may be submitted <strong>once per year</strong>, by 31 October (or another date set by the school).</p>
<p>5.3 The application must be supported by evidence that the teacher:</p>
<ul>
<li>Is <strong>highly competent</strong> in all elements of the Teachers'' Standards</li>
<li>Has made a <strong>substantial and sustained contribution</strong> to the school beyond their own classroom</li>
</ul>
<p>5.4 The headteacher will assess the application against the criteria and make a recommendation to the Pay Committee.</p>
<p>5.5 The teacher will be notified of the outcome in writing, with reasons. If unsuccessful, the teacher will be given feedback and may reapply the following year.</p>

<h2>6. Leadership Pay</h2>
<h3>6.1 Headteacher</h3>
<p>The headteacher''s pay is set within an <strong>Individual School Range (ISR)</strong>, determined by the governing body in accordance with the STPCD. The ISR is calculated based on the school''s group size (determined by pupil numbers and other factors as defined in the STPCD).</p>
<p>The headteacher''s pay is reviewed annually by the Pay Committee (which must not include staff members). Progression within the ISR is based on the annual appraisal.</p>
<p><strong>Safeguarding:</strong> Where a headteacher''s pay would otherwise decrease as a result of organisational change (e.g., reduction in school roll), pay safeguarding provisions in the STPCD will apply.</p>

<h3>6.2 Deputy and Assistant Headteachers</h3>
<p>Pay ranges for deputy and assistant headteachers are set by the governing body within the leadership pay range specified in the STPCD. The pay range must not overlap with the headteacher''s ISR (unless the STPCD permits this in specific circumstances).</p>
<p>Progression within the range is based on annual appraisal.</p>

<h2>7. Teaching and Learning Responsibility (TLR) Payments</h2>
<p>7.1 <strong>TLR1 and TLR2</strong> payments are awarded for sustained additional responsibility in the context of the school''s staffing structure for teaching and learning. To be eligible for a TLR, the responsibility must:</p>
<ul>
<li>Be focused on teaching and learning</li>
<li>Require the exercise of a teacher''s professional skills and judgement</li>
<li>Be a significant responsibility not required of all classroom teachers</li>
<li>For TLR1: include line management of a significant number of people</li>
</ul>
<p>7.2 TLR values are set within the ranges defined in the STPCD.</p>
<p>7.3 <strong>TLR3</strong> payments are fixed-term payments for clearly time-limited projects or one-off responsibilities. They are for a minimum of one term and a maximum of three years.</p>

<h2>8. SEN Allowance</h2>
<p>8.1 A SEN allowance is payable to a classroom teacher where the governing body determines that:</p>
<ul>
<li>The teacher is engaged in teaching pupils with special educational needs (in any context, not only in special schools); AND</li>
<li>The teacher''s work involves a <strong>mandatory qualification</strong> in teaching pupils with SEN; OR</li>
<li>The teacher teaches in a SEN unit, special school, or is otherwise engaged in a role that requires specialist SEN expertise</li>
</ul>
<p>8.2 The value of the SEN allowance is set within the range defined in the STPCD, determined by the governing body taking into account the structure of the school''s SEN provision and the qualifications and expertise required.</p>

<h2>9. Recruitment and Retention Payments</h2>
<p>9.1 The governing body may award a recruitment or retention incentive payment to a teacher where there is evidence that such a payment is necessary to recruit or retain the teacher.</p>
<p>9.2 The payment may be a one-off or recurring. Recurring payments are reviewed annually and may be withdrawn if the circumstances that justified them no longer apply (with reasonable notice).</p>

<h2>10. Support Staff Pay</h2>
<p>10.1 Support staff are paid in accordance with the <strong>National Joint Council (NJC) for Local Government Services</strong> pay scales (commonly known as the ''Green Book'').</p>
<p>10.2 Posts are evaluated using a recognised job evaluation scheme to ensure equal pay for work of equal value.</p>
<p>10.3 Incremental progression within the grade is subject to satisfactory performance, assessed through the annual appraisal process.</p>
<p>10.4 Where a support staff role is restructured or upgraded following job evaluation, the employee will be placed on the appropriate point of the new grade.</p>

<h2>11. Part-Time and Temporary Contracts</h2>
<p>11.1 Part-time teachers are paid a proportion of the full-time salary, calculated as: (number of sessions or hours worked / full-time equivalent sessions or hours) x full-time salary.</p>
<p>11.2 Part-time support staff are paid on a pro-rata basis of the full-time equivalent salary and hours.</p>
<p>11.3 Teachers and support staff on temporary contracts receive the same pay and conditions as permanent staff on the same grade/point, on a pro-rata basis.</p>

<h2>12. Pay Review Process</h2>
<p>12.1 All pay is reviewed annually, with effect from <strong>1 September</strong>.</p>
<p>12.2 The <strong>Pay Committee</strong> of the governing body is responsible for making pay decisions. The committee comprises at least three governors (who are not staff members) and may seek advice from the headteacher (except when determining the headteacher''s own pay).</p>
<p>12.3 The headteacher provides the Pay Committee with pay recommendations for all staff, supported by evidence from the appraisal process.</p>
<p>12.4 Teachers and support staff are notified in writing of the outcome of their pay review, including the right to appeal.</p>

<h2>13. Pay Appeals</h2>
<p>13.1 Any employee who is dissatisfied with a pay decision may appeal in writing to the Chair of Governors within <strong>10 working days</strong> of receiving written notification of the decision.</p>
<p>13.2 The appeal will be heard by a panel of governors who were not involved in the original pay decision.</p>
<p>13.3 The appeal panel may uphold the original decision, increase the pay award, or refer the matter back to the Pay Committee for reconsideration.</p>
<p>13.4 The decision of the appeal panel is final.</p>

<h2>14. Publication</h2>
<p>14.1 The school publishes its pay ranges for teaching and leadership staff on the school''s website, as required.</p>

<h2>15. Equality</h2>
<p>15.1 The governing body is committed to ensuring that pay decisions are free from unlawful discrimination on any ground, including all <strong>protected characteristics</strong> under the Equality Act 2010.</p>
<p>15.2 Pay data will be monitored by protected characteristic (where data is available) to ensure there are no pay gaps that cannot be justified by objective criteria.</p>
<p>15.3 The governing body will comply with the Equality Act 2010 (Gender Pay Gap Information) Regulations 2017 where applicable (organisations with 250+ employees).</p>

<h2>16. Review</h2>
<p>16.1 This policy is reviewed annually by the governing body, in advance of the annual pay review.</p>
<p>16.2 Next review date: {{review_date}}</p>'
);

-- ============================================================
-- End of HR/Governance/Equality templates
-- ============================================================

