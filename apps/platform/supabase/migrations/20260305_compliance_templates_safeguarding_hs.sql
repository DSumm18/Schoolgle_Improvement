-- ============================================================
-- COMPLIANCE MODULE: EXPERT-LEVEL SAFEGUARDING & HEALTH & SAFETY TEMPLATES
-- 12 comprehensive templates for UK school compliance
-- Legislation: KCSIE 2024, Working Together 2023, Children Act 1989/2004,
--   Education Act 2002 s.175/157, HSWA 1974, MHSWR 1999, RRFSO 2005,
--   RIDDOR 2013, Public Interest Disclosure Act 1998, DPA 2018
-- All content designed to pass Ofsted/DfE/HSE scrutiny
-- ============================================================

INSERT INTO compliance_templates (id, template_type, name, description, school_phase, jurisdiction, maintained_by, version, is_statutory, dfe_reference, source_reference, json_schema, content_html) VALUES

-- ============================================================
-- 1. SAFEGUARDING & CHILD PROTECTION POLICY
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'Safeguarding and Child Protection Policy (Comprehensive)',
  'The single most important school policy. Fully aligned with Keeping Children Safe in Education 2024, Working Together to Safeguard Children 2023, Children Act 1989/2004, and Education Act 2002 s.175/157. Covers all statutory safeguarding requirements including DSL responsibilities, types of abuse, specific safeguarding issues, safer recruitment, allegations management, online safety, and multi-agency working.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'Keeping Children Safe in Education 2024',
  'KCSIE 2024 / Working Together 2023 / Children Act 1989 & 2004 / Education Act 2002 s.175/157',
  '{"required_fields": ["school_name", "school_address", "school_phone", "school_email", "headteacher_name", "dsl_name", "dsl_contact", "deputy_dsl_name", "chair_of_governors", "safeguarding_governor", "local_authority", "mash_phone", "mash_email", "lado_name", "lado_phone", "lado_email", "police_referral_phone", "prevent_contact", "senco_name", "review_date"], "optional_fields": ["trust_name", "trust_safeguarding_lead", "channel_phone", "nspcc_helpline", "childline_number", "dpo_name", "school_website"]}',
  '<h1>Safeguarding and Child Protection Policy</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Designated Safeguarding Lead (DSL)</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dsl_name}} — {{dsl_contact}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Deputy DSL(s)</strong></td><td style="padding:8px;border:1px solid #ccc;">{{deputy_dsl_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Safeguarding Governor</strong></td><td style="padding:8px;border:1px solid #ccc;">{{safeguarding_governor}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Chair of Governors</strong></td><td style="padding:8px;border:1px solid #ccc;">{{chair_of_governors}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Local Authority</strong></td><td style="padding:8px;border:1px solid #ccc;">{{local_authority}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>MASH/Children''s Social Care</strong></td><td style="padding:8px;border:1px solid #ccc;">{{mash_phone}} / {{mash_email}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>LADO</strong></td><td style="padding:8px;border:1px solid #ccc;">{{lado_name}} — {{lado_phone}} / {{lado_email}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Policy Review Date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Introduction and Ethos</h2>
<p>{{school_name}} recognises that safeguarding and promoting the welfare of children is everyone''s responsibility. Everyone who comes into contact with children and their families has a role to play. We take an ''it could happen here'' approach and always act in the best interests of the child.</p>
<p>This policy applies to all staff (including supply staff and agency workers), volunteers, governors, contractors, and visitors. It should be read alongside:</p>
<ul>
<li><strong>Keeping Children Safe in Education 2024 (KCSIE)</strong> — statutory guidance that all staff must read Part 1 (or Annex B if working directly with children)</li>
<li><strong>Working Together to Safeguard Children 2023</strong> — inter-agency statutory guidance</li>
<li><strong>Children Act 1989</strong> — defines ''significant harm'' and the duty to investigate</li>
<li><strong>Children Act 2004</strong> — establishes Local Safeguarding Children Partnerships (LSCPs)</li>
<li><strong>Education Act 2002, Section 175 (maintained schools) / Section 157 (independent schools and academies)</strong> — duty to safeguard and promote welfare</li>
<li>The school''s Staff Code of Conduct, Behaviour Policy, Anti-Bullying Policy, Online Safety Policy, Whistleblowing Policy, and Safer Recruitment Policy</li>
</ul>
<p>This policy is reviewed <strong>annually</strong> and updated whenever DfE issues revised statutory guidance. The governing body approves the policy and ensures its implementation is monitored through termly reports from the DSL and an annual Section 175/157 safeguarding audit.</p>

<h2>2. Key Principles</h2>
<ul>
<li>The welfare of the child is paramount (Children Act 1989, s.1)</li>
<li>All children, regardless of age, gender, ability, culture, race, language, religion, or sexual identity, have equal rights to protection</li>
<li>All staff have an equal responsibility to act on any suspicion or disclosure that may suggest a child is at risk of harm or in need of early help</li>
<li>Pupils and staff involved in child protection issues will receive appropriate support</li>
<li>We operate safer recruitment procedures and ensure that all appropriate checks are carried out on staff and volunteers who work with children (KCSIE 2024, Part 3)</li>
<li>We work in partnership with parents, carers, and other agencies to safeguard children</li>
</ul>

<h2>3. Roles and Responsibilities</h2>

<h3>3.1 The Governing Body</h3>
<p>The governing body has a strategic leadership responsibility for safeguarding arrangements. Governors will:</p>
<ul>
<li>Ensure the school has an effective safeguarding policy and procedures in place that are compliant with DfE statutory guidance</li>
<li>Appoint a <strong>named safeguarding governor</strong> ({{safeguarding_governor}}) who champions safeguarding at board level and liaises with the DSL</li>
<li>Ensure a senior member of staff is appointed as the Designated Safeguarding Lead (DSL) with appropriate status, authority, time, funding, and resources</li>
<li>Ensure all staff receive appropriate safeguarding and child protection training at induction and at regular intervals (at least annually)</li>
<li>Ensure safer recruitment practices are followed, including at least one member of every recruitment panel being Safer Recruitment trained</li>
<li>Ensure the school contributes to inter-agency working in line with Working Together 2023</li>
<li>Ensure that a referral is made to the DBS and/or Teaching Regulation Agency (TRA) where a member of staff is dismissed or resigns in circumstances that would have led to dismissal for safeguarding reasons</li>
<li>Review this policy annually and approve it at a full governing body meeting</li>
<li>Receive termly safeguarding reports from the DSL (anonymised and aggregated) and scrutinise the effectiveness of safeguarding arrangements</li>
<li>Ensure that children are taught about safeguarding, including online safety, through the curriculum (RSHE)</li>
</ul>

<h3>3.2 The Headteacher</h3>
<p>The headteacher ({{headteacher_name}}) is responsible for:</p>
<ul>
<li>The implementation of this policy and ensuring it is followed by all staff</li>
<li>Allocating sufficient time and resources for the DSL and deputy DSL(s) to carry out their roles effectively, including attending inter-agency meetings, contributing to assessments, and managing referrals</li>
<li>Ensuring all staff feel able to raise concerns and that whistleblowing procedures are in place and widely publicised</li>
<li>Managing allegations against staff (unless the allegation is against the headteacher, in which case the chair of governors manages the process)</li>
<li>Ensuring the school site is secure and that visitors are appropriately managed and supervised</li>
</ul>

<h3>3.3 The Designated Safeguarding Lead (DSL)</h3>
<p>The DSL ({{dsl_name}}) is the senior member of staff with lead responsibility for safeguarding and child protection. The DSL must be a member of the senior leadership team. The DSL''s responsibilities include:</p>

<h4>Referrals</h4>
<ul>
<li>Referring cases of suspected abuse and neglect to {{local_authority}} children''s social care (MASH: {{mash_phone}}) and supporting staff who make referrals directly</li>
<li>Referring cases to the Channel programme where there is a radicalisation concern (Prevent duty)</li>
<li>Referring cases where a crime may have been committed to the police (101 or 999 in emergencies)</li>
<li>Referring cases to the Disclosure and Barring Service (DBS) where a person is dismissed or leaves due to risk/harm to a child</li>
<li>Referring cases to the Teaching Regulation Agency (TRA) as appropriate</li>
</ul>

<h4>Working with Others</h4>
<ul>
<li>Acting as a point of contact with the three safeguarding partners (local authority, health, police) under Working Together 2023</li>
<li>Liaising with the headteacher to inform them of safeguarding issues and ongoing enquiries under Section 47 of the Children Act 1989</li>
<li>Liaising with staff on matters of safety and safeguarding, including sharing relevant information with teachers and support staff as appropriate under the principle of ''need to know''</li>
<li>Acting as a source of support, advice, and expertise for all staff</li>
<li>Attending, or ensuring an appropriately informed deputy attends, child protection conferences, core group meetings, and other multi-agency meetings</li>
</ul>

<h4>Training</h4>
<ul>
<li>Undergoing training to provide them with the knowledge and skills required to carry out the role — updated at least every two years (KCSIE 2024, Annex C)</li>
<li>In addition to formal training, updating knowledge and skills at regular intervals (at least annually) through safeguarding briefings, e-bulletins from the LSCP, and attendance at network events</li>
<li>Ensuring all staff receive safeguarding training at induction (including Part 1 or Annex B of KCSIE, the school''s safeguarding policy, the staff code of conduct, the behaviour policy, the role of the DSL, and online safety) and that this training is regularly updated (at least annually)</li>
</ul>

<h4>Record Keeping</h4>
<ul>
<li>Maintaining detailed, accurate, and secure safeguarding records using the school''s safeguarding recording system (e.g., CPOMS, MyConcern, or equivalent)</li>
<li>Ensuring records include a clear chronology of concern, actions taken, decisions made, and outcomes</li>
<li>Ensuring records are stored securely and separately from the pupil''s main educational file</li>
<li>Ensuring safeguarding records are transferred to the new school when a child moves, separately from the main pupil file and marked ''confidential — for attention of DSL only'', and that a receipt of transfer is obtained</li>
</ul>

<h4>Information Sharing</h4>
<ul>
<li>Understanding the importance of information sharing, both within the school and with external agencies, and ensuring that fears about sharing information do not stand in the way of the need to promote the welfare and protect the safety of children (HM Government: Information Sharing guidance 2018)</li>
<li>Sharing information lawfully under UK GDPR Article 6(1)(d) (vital interests) and (e) (public task), and with regard to the Data Protection Act 2018 Schedule 1 conditions for processing special category data</li>
</ul>

<h3>3.4 Deputy DSL(s)</h3>
<p>{{deputy_dsl_name}} is/are trained to the same standard as the DSL. The deputy DSL(s) act in the DSL''s absence. Whilst the activities of the DSL can be delegated to an appropriately trained deputy, the ultimate lead responsibility for safeguarding and child protection remains with the DSL and cannot be delegated.</p>

<h3>3.5 All Staff</h3>
<p>All staff have a responsibility to:</p>
<ul>
<li>Read and understand Part 1 (or Annex B) of KCSIE 2024 and sign the staff acknowledgement form</li>
<li>Be aware of the school''s safeguarding policy, the staff code of conduct, the behaviour policy, the role of the DSL, and how to report concerns</li>
<li>Be alert to the signs and indicators of abuse and neglect</li>
<li>Report any concerns about a child to the DSL (or deputy DSL) <strong>immediately</strong> — staff should not investigate concerns themselves</li>
<li>If in exceptional circumstances the DSL or deputy is not available, staff should not delay in making a referral directly to children''s social care ({{mash_phone}})</li>
<li>If a child is in immediate danger, call 999</li>
<li>Maintain an attitude of ''it could happen here'' regarding safeguarding</li>
<li>Follow the school''s acceptable use of technology policy and ensure their online conduct is consistent with professional standards</li>
</ul>

<h2>4. Categories of Abuse (KCSIE 2024, Part 1)</h2>
<p>All staff should be aware that abuse, neglect, and safeguarding issues are rarely standalone events. In many cases, multiple issues will overlap with one another. Staff should be aware of the following categories:</p>

<h3>4.1 Physical Abuse</h3>
<p>A form of abuse which may involve hitting, shaking, throwing, poisoning, burning or scalding, drowning, suffocating, or otherwise causing physical harm to a child. Physical harm may also be caused when a parent or carer fabricates the symptoms of, or deliberately induces, illness in a child (fabricated or induced illness — FII).</p>
<p><strong>Indicators may include:</strong> unexplained injuries such as bruises, cuts, burns, bite marks, or fractures; injuries inconsistent with the explanation offered; injuries in unusual locations (e.g., torso, back, buttocks, face in pre-mobile babies); multiple injuries at different stages of healing; reluctance to undress for PE; flinching when approached; aggressive behaviour.</p>

<h3>4.2 Emotional Abuse</h3>
<p>The persistent emotional maltreatment of a child that causes severe and adverse effects on the child''s emotional development. It may involve conveying to a child that they are worthless or unloved, inadequate, or valued only insofar as they meet the needs of another person. It may include not giving the child opportunity to express their views, deliberately silencing them, or ''making fun'' of what they say. It may feature age- or developmentally-inappropriate expectations being imposed. It may involve seeing or hearing the ill-treatment of another (domestic abuse). It may involve serious bullying (including cyberbullying), causing children to frequently feel frightened or in danger, or the exploitation or corruption of children.</p>
<p><strong>Indicators may include:</strong> over-reaction to mistakes; continual self-deprecation; delayed physical, mental, or emotional development; sudden speech disorders; self-harm; fear of new situations; inappropriate emotional responses; neurotic behaviour (e.g., rocking, hair twisting); extremes of passivity or aggression.</p>

<h3>4.3 Sexual Abuse</h3>
<p>Involves forcing or enticing a child or young person to take part in sexual activities, not necessarily involving violence, whether or not the child is aware of what is happening. Activities may involve physical contact, including assault by penetration (e.g., rape or oral sex) or non-penetrative acts such as masturbation, kissing, rubbing, and touching outside of clothing. Sexual abuse includes non-contact activities, such as involving children in looking at, or in the production of, sexual images, watching sexual activities, encouraging children to behave in sexually inappropriate ways, or grooming a child in preparation for abuse. Sexual abuse can take place online, and technology can be used to facilitate offline abuse.</p>
<p><strong>Indicators may include:</strong> age-inappropriate sexual behaviour or knowledge; sexualised language; sexual drawings; self-harm; changes in behaviour; avoidance of certain adults; regression; urinary infections or sexually transmitted infections; reluctance to undress; pain, itching, or bleeding in the genital/anal area; pregnancy in an underage young person.</p>

<h3>4.4 Neglect</h3>
<p>The persistent failure to meet a child''s basic physical and/or psychological needs, likely to result in the serious impairment of the child''s health or development. Neglect may occur during pregnancy as a result of maternal substance abuse. Once a child is born, neglect may involve a parent or carer failing to: provide adequate food, clothing, and shelter (including exclusion from home or abandonment); protect a child from physical and emotional harm or danger; ensure adequate supervision (including the use of inadequate care-givers); ensure access to appropriate medical care or treatment. It may also include neglect of, or unresponsiveness to, a child''s basic emotional needs.</p>
<p><strong>Indicators may include:</strong> constant hunger; poor personal hygiene; inadequate clothing; frequent lateness or non-attendance; untreated medical or dental problems; low self-esteem; poor social relationships; compulsive stealing or scavenging; tiredness; failure to thrive (underweight for age without medical explanation); being left alone or with inappropriate carers.</p>

<h2>5. Specific Safeguarding Issues</h2>
<p>All staff should be aware of the following specific safeguarding issues. Staff do not need to be experts but should maintain an attitude of ''it could happen here'' and report any concerns to the DSL.</p>

<h3>5.1 Child Sexual Exploitation (CSE)</h3>
<p>CSE is a form of child sexual abuse. It occurs where an individual or group takes advantage of an imbalance of power to coerce, manipulate, or deceive a child into sexual activity (a) in exchange for something the victim needs or wants, and/or (b) for the financial advantage or increased status of the perpetrator or facilitator. The victim may have been sexually exploited even if the sexual activity appears consensual. CSE does not always involve physical contact; it can also occur through the use of technology. CSE can affect any child, including boys and young men.</p>
<p><strong>Warning signs may include:</strong> going missing for periods; acquisition of money, clothes, or mobile phones without explanation; association with older individuals or groups; involvement in gangs; substance misuse; changes in emotional wellbeing; sexually transmitted infections; evidence of sexual activity in under-13s.</p>

<h3>5.2 Child Criminal Exploitation (CCE) and County Lines</h3>
<p>CCE is where an individual or group takes advantage of an imbalance of power to coerce, control, manipulate, or deceive a child into any criminal activity (a) in exchange for something the victim needs or wants, and/or (b) for the financial or other advantage of the perpetrator or facilitator, and/or (c) through violence or the threat of violence. CCE often involves gang exploitation and ''county lines'' — a term used to describe gangs and organised criminal networks involved in exporting illegal drugs into suburban areas, market towns, and rural areas using dedicated mobile phone lines. Children are exploited to move drugs and money, and are often used as couriers.</p>
<p><strong>Warning signs may include:</strong> persistently going missing or being found out of area; unexplained acquisition of money, clothes, or mobile phones; excessive receipt of texts or phone calls; relationships with controlling or significantly older individuals; leaving home without explanation; signs of self-harm or significant changes in emotional wellbeing; carrying weapons; involvement in criminality.</p>

<h3>5.3 Female Genital Mutilation (FGM)</h3>
<p>FGM comprises all procedures involving partial or total removal of the external female genitalia, or other injury to the female genital organs, for non-medical reasons. FGM is illegal in the UK (Female Genital Mutilation Act 2003, as amended by the Serious Crime Act 2015). It is also illegal to take a child abroad for FGM or to assist anyone in carrying out FGM.</p>
<p><strong>Section 5B of the FGM Act 2003 places a mandatory reporting duty on teachers.</strong> If a teacher, in the course of their work, discovers that FGM appears to have been carried out on a girl under 18, they <strong>must</strong> report this to the police (call 101). This is a personal duty and cannot be transferred to the DSL. Failure to report is not a criminal offence, but it may result in disciplinary action.</p>
<p><strong>Risk factors may include:</strong> a family from a community known to practise FGM; a child being taken abroad for a prolonged period; a child talking about a ''special procedure'' or ''becoming a woman''; a child confiding that they are going to have a ''special procedure'' or asking for help.</p>

<h3>5.4 Forced Marriage</h3>
<p>Forcing a person into a marriage is a criminal offence under the Anti-Social Behaviour, Crime and Policing Act 2014. A forced marriage is one entered into without the full and free consent of one or both parties and where violence, threats, or any other form of coercion is used. This includes marriages involving children under 16, which cannot be lawful (Marriage and Civil Partnership (Minimum Age) Act 2022 — it is now an offence to arrange the marriage of a person under 18 in England and Wales).</p>
<p>Staff should <strong>never</strong> attempt to intervene directly as a mediator or speak to the family about a suspected forced marriage, as this may increase the risk to the child. Concerns should be reported to the DSL who will refer to the Forced Marriage Unit (020 7008 0151) and/or children''s social care.</p>

<h3>5.5 Honour-Based Abuse (HBA)</h3>
<p>So-called ''honour-based'' abuse encompasses incidents or crimes which have been committed to protect or defend the honour of the family and/or the community, including FGM, forced marriage, and practices such as breast ironing. Abuse committed in the context of preserving ''honour'' often involves a wider network of family or community pressure and can include multiple perpetrators. All forms of HBA are abuse and should be treated as such.</p>

<h3>5.6 Radicalisation and the Prevent Duty</h3>
<p>Under the Counter-Terrorism and Security Act 2015, schools have a duty to have ''due regard to the need to prevent people from being drawn into terrorism'' (the Prevent duty). This applies to all types of extremism, including far-right, Islamist, and other forms. Staff should be alert to changes in behaviour that may indicate a child is being radicalised and should report concerns to the DSL.</p>
<p>The DSL will make a referral to the local Prevent team/Channel panel ({{prevent_contact}}) where there is a concern. Channel is a voluntary, confidential programme which provides support to individuals at risk of being drawn into terrorism.</p>
<p><strong>Indicators of vulnerability to radicalisation may include:</strong> expressing support for extremist ideologies or groups; accessing extremist material online; possessing extremist literature; using extremist narratives and a restricted range of views; significant changes in appearance (particularly in combination with other indicators); withdrawal from friends, family, or peer groups; attending meetings/events run by extremist organisations.</p>

<h3>5.7 Peer-on-Peer Abuse (Child-on-Child Abuse)</h3>
<p>All staff should be aware that children can abuse other children (often referred to as peer-on-peer or child-on-child abuse) and that it can happen both inside and outside of school and online. It is important that all staff recognise the indicators and signs of peer-on-peer abuse and know how to identify it and respond to reports. All staff should understand that even if there are no reported cases, it does not mean it is not happening — it may be that children have not reported it.</p>
<p>Peer-on-peer abuse can include (but is not limited to):</p>
<ul>
<li><strong>Bullying (including cyberbullying)</strong> — prejudice-based and discriminatory bullying</li>
<li><strong>Abuse in intimate personal relationships between peers</strong></li>
<li><strong>Physical abuse</strong> — hitting, kicking, shaking, biting, hair pulling, or otherwise causing physical harm</li>
<li><strong>Sexual violence and sexual harassment</strong> — see section 5.8 below</li>
<li><strong>Consensual and non-consensual sharing of nude and semi-nude images and/or videos</strong> (also known as ''sexting'' or ''youth produced sexual imagery'')</li>
<li><strong>Causing someone to engage in sexual activity without consent</strong></li>
<li><strong>Upskirting</strong> — a criminal offence under the Voyeurism (Offences) Act 2019</li>
<li><strong>Initiation/hazing type violence and rituals</strong></li>
</ul>
<p>The school will never pass off peer-on-peer abuse as ''banter'', ''just having a laugh'', ''part of growing up'', or ''boys being boys''. Such attitudes normalise abuse and can lead to a culture that facilitates it.</p>

<h3>5.8 Sexual Violence and Sexual Harassment</h3>
<p>Sexual violence refers to sexual offences under the Sexual Offences Act 2003, including rape (s.1) and assault by penetration (s.2). Sexual harassment means ''unwanted conduct of a sexual nature'' that can occur online and offline and can include sexual comments, sexual ''jokes'' or taunting, physical behaviour such as deliberately brushing against someone, online sexual harassment including non-consensual sharing of images and videos, sexualised online bullying, unwanted sexual comments on social media, and sexual exploitation.</p>
<p>It is important that staff understand that all of the above can constitute sexual harassment and that all sexual violence and sexual harassment is unacceptable and will not be tolerated. The school''s response follows the guidance in KCSIE 2024, Part 5. Reports will be managed by the DSL, who will consider the needs of the victim, alleged perpetrator, and any witnesses.</p>

<h3>5.9 Upskirting</h3>
<p>The Voyeurism (Offences) Act 2019 makes upskirting a criminal offence. ''Upskirting'' typically involves taking a photograph under a person''s clothing without their knowledge, with the intention of viewing their genitals or buttocks, for sexual gratification or to cause humiliation, distress, or alarm. It is a criminal offence and should be reported to the DSL and, where appropriate, the police.</p>

<h3>5.10 Serious Violence</h3>
<p>All staff should be aware of the indicators which may signal children are at risk from, or are involved with, serious violent crime. These may include: increased absence from school; a change in friendships or relationships with older individuals or groups; a significant decline in performance; signs of self-harm or a significant change in wellbeing; signs of assault; unexplained injuries; unexplained gifts or new possessions. Staff should report concerns to the DSL who will consider whether a referral to children''s social care and/or the police is required.</p>

<h3>5.11 Domestic Abuse</h3>
<p>The Domestic Abuse Act 2021 recognises children who see, hear, or experience the effects of domestic abuse as victims in their own right. Exposure to domestic abuse can have a serious, long-lasting emotional and psychological impact on children. Operation Encompass operates in many areas to ensure that schools are informed at the start of the next school day when a child has been involved in or exposed to a domestic incident. The DSL is the key point of contact for Operation Encompass notifications.</p>

<h3>5.12 Mental Health</h3>
<p>All staff should be aware that mental health problems can be an indicator that a child has suffered or is at risk of suffering abuse, neglect, or exploitation. Staff should report concerns about a child''s mental health to the DSL, who will consider whether a referral to CAMHS, Early Help, or children''s social care is appropriate. The school''s approach to mental health is detailed in our Mental Health and Wellbeing Policy.</p>

<h3>5.13 Online Safety</h3>
<p>Technology is a significant component in many safeguarding and wellbeing issues. Children are at risk of abuse and other risks online as well as face-to-face. In many cases, abuse will take place concurrently both online and offline. The breadth of issues classified within online safety is considerable, but can be categorised into four areas of risk:</p>
<ul>
<li><strong>Content:</strong> being exposed to illegal, inappropriate, or harmful content (e.g., pornography, fake news, racism, misogyny, self-harm, suicide, anti-Semitism, radicalisation, and extremism)</li>
<li><strong>Contact:</strong> being subjected to harmful online interaction with other users (e.g., commercial advertising, adults posing as children or young adults, sexual exploitation and grooming)</li>
<li><strong>Conduct:</strong> personal online behaviour that increases the likelihood of, or causes, harm (e.g., making, sending, and receiving explicit images, sharing other explicit images, and online bullying)</li>
<li><strong>Commerce:</strong> risks such as online gambling, inappropriate advertising, phishing, and financial scams</li>
</ul>
<p>The school''s approach to online safety is detailed in our Online Safety Policy, and staff should follow the acceptable use agreement they signed at induction.</p>

<h2>6. Early Help</h2>
<p>All staff should be aware of the early help process and understand their role in it. Early help means providing support as soon as a problem emerges, at any point in a child''s life, from the foundation years through to the teenage years. Any staff member who identifies a child who may benefit from early help should discuss this with the DSL in the first instance.</p>
<p>The DSL will consider the appropriate action, which may include:</p>
<ul>
<li>Providing in-school support or a pastoral intervention</li>
<li>Undertaking or contributing to an Early Help Assessment (EHA)</li>
<li>Referring to external services (e.g., CAMHS, school nursing, family support, speech and language therapy)</li>
<li>Making a referral to children''s social care if the child is assessed as being at risk of significant harm</li>
</ul>
<p>Staff should not assume that ''someone else'' will report a concern. If early help is not effective or the situation escalates, the DSL will refer to children''s social care. <strong>If a child is in immediate danger, any member of staff should call 999 without delay.</strong></p>

<h2>7. Referral Procedures</h2>
<ol>
<li>Staff recognise a concern about a child''s welfare or safety (see sections 4 and 5 above)</li>
<li>Staff record the concern factually, using the child''s own words where possible, without delay — using the school''s safeguarding recording system or a Record of Concern form</li>
<li>Staff report the concern to the DSL ({{dsl_name}}) or deputy DSL ({{deputy_dsl_name}}) <strong>immediately</strong> — the same day</li>
<li>The DSL evaluates the concern and decides on the appropriate course of action:
  <ul>
  <li><strong>Monitor and support internally</strong> (with clear rationale recorded)</li>
  <li><strong>Seek early help</strong> through local services</li>
  <li><strong>Refer to children''s social care</strong> via MASH ({{mash_phone}} / {{mash_email}})</li>
  <li><strong>Report to the police</strong> ({{police_referral_phone}} or 999 in emergency)</li>
  </ul>
</li>
<li>Where a referral is made to children''s social care, the DSL will follow up in writing within 48 hours if no acknowledgement is received</li>
<li>If a member of staff disagrees with the DSL''s decision not to refer, they have the right to make a referral to children''s social care directly (KCSIE 2024, paragraph 82)</li>
</ol>
<p><strong>If a child makes a disclosure of abuse, staff should:</strong></p>
<ul>
<li>Listen carefully and calmly without expressing shock or disbelief</li>
<li>Reassure the child that they are right to tell and it is not their fault</li>
<li>Not promise confidentiality — explain that the information will need to be shared with people who can help</li>
<li>Not ask leading questions — let the child use their own words and record exactly what the child said</li>
<li>Not investigate or ask the child to repeat their account to anyone else</li>
<li>Record the disclosure as soon as possible, using the child''s own words in quotation marks</li>
<li>Report to the DSL immediately</li>
</ul>

<h2>8. Children with Special Educational Needs and Disabilities (SEND)</h2>
<p>The school recognises that children with SEND can be <strong>3.4 times more likely</strong> to be abused or neglected than their peers (NSPCC, 2014). Additional barriers can exist when recognising abuse and neglect in children with SEND, including:</p>
<ul>
<li>Assumptions that indicators of possible abuse (e.g., behaviour, mood, injury) relate to the child''s disability without further exploration</li>
<li>Communication barriers that make it difficult for the child to disclose abuse</li>
<li>A reluctance to challenge parents/carers of children with SEND</li>
<li>The potential for children with SEND to be more vulnerable to bullying and peer-on-peer abuse</li>
<li>Being more prone to peer group isolation</li>
<li>Increased dependence on others for personal care and physical support</li>
</ul>
<p>The DSL will work closely with the SENCO ({{senco_name}}) to ensure that safeguarding concerns relating to children with SEND are identified and addressed promptly. Staff should apply the same professional curiosity and thresholds of concern to children with SEND as to all other children.</p>

<h2>9. Looked After Children and Previously Looked After Children</h2>
<p>The school recognises that looked after children and previously looked after children are a particularly vulnerable group. The DSL will ensure that staff have the skills, knowledge, and understanding to keep looked after children safe. The designated teacher for looked after children will work with the virtual school head to promote the educational achievement of looked after children and to ensure that their personal education plans (PEPs) consider safeguarding matters.</p>

<h2>10. Children Missing Education (CME)</h2>
<p>A child going missing from education is a potential indicator of abuse or neglect and may also indicate involvement in criminal exploitation or other safeguarding risks, including travelling to conflict zones, FGM, or forced marriage. The school has procedures in place to identify children who are missing from education, in accordance with DfE guidance ''Children Missing Education'' (2016). The school will inform the local authority of any pupil who is about to be deleted from the admission register where they:</p>
<ul>
<li>Have been taken out of school by their parents to be home educated (elective home education)</li>
<li>Have ceased to attend school and no longer live within reasonable distance of the school</li>
<li>Have been certified as unlikely to be in a fit state of health to attend school</li>
<li>Are in custody for more than four months</li>
<li>Have been permanently excluded</li>
</ul>
<p>The school will hold at least two emergency contact numbers for every pupil and will follow up unexplained absences without delay.</p>

<h2>11. Private Fostering</h2>
<p>A private fostering arrangement is one made privately (without the involvement of the local authority) for the care of a child under 16 (under 18 if disabled) by someone other than a parent or close relative, with the intention that it should last for 28 days or more. Staff should notify the DSL if they become aware of a private fostering arrangement. The local authority must be informed of all private fostering arrangements.</p>

<h2>12. Safer Recruitment (KCSIE 2024, Part 3)</h2>
<p>The school follows DfE safer recruitment guidance to ensure that all reasonable steps are taken to prevent unsuitable people from working with children. This includes:</p>
<ul>
<li>At least one member of every interview panel having completed Safer Recruitment training (accredited by the DfE or equivalent)</li>
<li>Requesting an enhanced DBS certificate (with barred list check for regulated activity) for all staff, supply staff, and volunteers</li>
<li>Checking the DBS children''s barred list before or as soon as practicable after appointment</li>
<li>Verifying identity from current photographic ID and proof of address</li>
<li>Obtaining a separate barred list check if an individual will start work in regulated activity before the DBS certificate is available</li>
<li>Checking the Teaching Regulation Agency (TRA) teacher services system for prohibition orders, interim prohibition orders, and sanctions</li>
<li>Section 128 direction checks (for management positions in independent schools, academies, and free schools)</li>
<li>Checking right to work in the UK</li>
<li>For candidates who have lived or worked outside the UK, making further checks including obtaining a letter of professional standing and/or criminal record check from the relevant country</li>
<li>Verifying qualifications (original certificates)</li>
<li>Obtaining references (at least two, including from current/most recent employer) before interview</li>
<li>Exploring any gaps in employment history during interview</li>
<li>Conducting online/social media checks on shortlisted candidates (noting that this should be done by someone not on the interview panel and shared with the panel only where relevant information is found)</li>
<li>Maintaining a Single Central Record (SCR) of all checks carried out on staff, supply staff, volunteers, and governors, in accordance with KCSIE 2024, paragraphs 268-270</li>
</ul>

<h2>13. Allegations Against Staff (KCSIE 2024, Part 4)</h2>

<h3>13.1 Allegations That May Meet the Harms Threshold</h3>
<p>An allegation may relate to a member of staff (including supply staff, volunteers, and contractors) who has:</p>
<ul>
<li>Behaved in a way that has harmed a child, or may have harmed a child</li>
<li>Possibly committed a criminal offence against or related to a child</li>
<li>Behaved towards a child or children in a way that indicates they may pose a risk of harm to children</li>
<li>Behaved or may have behaved in a way that indicates they may not be suitable to work with children (transferable risk)</li>
</ul>
<p>Where an allegation is made against a member of staff, the headteacher (or chair of governors, if the allegation is against the headteacher) will:</p>
<ol>
<li>Not investigate the allegation themselves but contact the LADO ({{lado_name}}, {{lado_phone}}) within one working day</li>
<li>Discuss the allegation with the LADO and agree the appropriate course of action (which may include a strategy discussion, police investigation, children''s social care investigation, and/or an internal disciplinary investigation)</li>
<li>Consider whether the individual should be suspended (suspension is a neutral act and should not be the default — alternatives include reassignment to non-contact duties)</li>
<li>Ensure that the individual is informed of the allegation as soon as possible and given an explanation of the likely course of action (unless informing them would jeopardise a police or children''s social care investigation)</li>
<li>Make a referral to the DBS and/or TRA if the individual is dismissed or resigns before the conclusion of the investigation</li>
</ol>

<h3>13.2 Low-Level Concerns (KCSIE 2024, Part 4, Section 2)</h3>
<p>A low-level concern is any concern — no matter how small, and even if no more than a ''nagging doubt'' — that an adult working in or on behalf of the school may have acted in a way that is inconsistent with the staff code of conduct, including inappropriate conduct outside of work, but that does not meet the harms threshold set out above.</p>
<p>Examples may include (but are not limited to):</p>
<ul>
<li>Being over-friendly with children</li>
<li>Having favourites</li>
<li>Taking photographs of children on their personal mobile phone</li>
<li>Engaging with a child on a one-to-one basis in a secluded area or behind a closed door</li>
<li>Using inappropriate sexualised, intimidating, or discriminatory language</li>
</ul>
<p>All low-level concerns should be reported to the headteacher (or the DSL if the concern is about the headteacher''s behaviour in a non-safeguarding context, or the chair of governors if the concern is about the headteacher). Low-level concerns will be recorded using the school''s Low-Level Concern Form. Records of low-level concerns will be reviewed periodically to identify any patterns of behaviour. Where a pattern of behaviour is identified, the school may take action in accordance with its disciplinary procedures and/or make a referral to the LADO.</p>

<h2>14. Whistleblowing</h2>
<p>The school recognises that children cannot be expected to raise concerns in an environment where staff fail to do so. All staff should feel able to raise concerns about poor or unsafe practice and potential failures in the school''s safeguarding regime, and know that such concerns will be taken seriously by the senior leadership team. The school''s Whistleblowing Policy (available from the school office and staff shared drive) sets out the process for raising concerns.</p>
<p>Where a staff member feels unable to raise a concern with their employer, or feels that a concern is not being addressed, they should contact:</p>
<ul>
<li><strong>Ofsted:</strong> 0300 123 3155 / whistleblowing@ofsted.gov.uk</li>
<li><strong>NSPCC Whistleblowing Helpline:</strong> 0800 028 0285 / help@nspcc.org.uk</li>
<li><strong>Local Authority Designated Officer (LADO):</strong> {{lado_name}}, {{lado_phone}}</li>
</ul>

<h2>15. Training</h2>
<ul>
<li><strong>All staff:</strong> Receive safeguarding training at induction and updated training at least annually, plus regular safeguarding updates (e.g., via email, staff meetings, briefings) as required (KCSIE 2024, paragraph 12)</li>
<li><strong>DSL and deputy DSL(s):</strong> Formal safeguarding training updated at least every two years (KCSIE 2024, Annex C), plus regular updates to knowledge and skills (at least annually)</li>
<li><strong>Governors:</strong> Safeguarding training at induction, updated regularly</li>
<li><strong>Safer Recruitment:</strong> At least one person on every interview panel must have completed accredited Safer Recruitment training</li>
<li><strong>Prevent:</strong> All staff receive Prevent awareness training (online or face-to-face)</li>
<li><strong>FGM:</strong> Teachers are made aware of their mandatory reporting duty</li>
</ul>
<p>Training records are maintained by the school and monitored by the safeguarding governor.</p>

<h2>16. Visitors and Contractors</h2>
<p>All visitors to the school must sign in and out at reception, wear a visitor''s badge, and be accompanied by a member of staff at all times unless they hold a current enhanced DBS certificate (with barred list check) and written confirmation has been obtained. Contractors working on the school site are required to provide evidence of DBS checks for their workers. The school will determine the level of supervision required based on whether the contractor will have unsupervised access to children.</p>

<h2>17. Use of School Premises by Other Organisations</h2>
<p>Where the governing body allows other organisations to use school premises for activities involving children (e.g., sports clubs, tutoring), the governing body will ensure that the organisation has appropriate safeguarding policies and procedures in place, and that there is clarity about the party responsible for safeguarding during the activity.</p>

<h2>18. Record Keeping and Confidentiality</h2>
<p>Safeguarding records are stored securely and separately from the pupil''s main educational file. Access is restricted to the DSL, deputy DSL, and headteacher on a ''need-to-know'' basis. Records are retained in accordance with the IRMS Information Management Toolkit for Schools (safeguarding records: DOB + 25 years, or date of last entry + 25 years, whichever is longer). Records are shared with children''s social care, the police, or other agencies as required to safeguard children.</p>

<h2>19. Key Contacts</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>DSL</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dsl_name}} — {{dsl_contact}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Deputy DSL</strong></td><td style="padding:8px;border:1px solid #ccc;">{{deputy_dsl_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}} — {{school_phone}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Safeguarding Governor</strong></td><td style="padding:8px;border:1px solid #ccc;">{{safeguarding_governor}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Chair of Governors</strong></td><td style="padding:8px;border:1px solid #ccc;">{{chair_of_governors}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>MASH/Children''s Social Care</strong></td><td style="padding:8px;border:1px solid #ccc;">{{mash_phone}} / {{mash_email}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>LADO</strong></td><td style="padding:8px;border:1px solid #ccc;">{{lado_name}} — {{lado_phone}} / {{lado_email}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Police (non-emergency)</strong></td><td style="padding:8px;border:1px solid #ccc;">{{police_referral_phone}} or 101</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Police (emergency)</strong></td><td style="padding:8px;border:1px solid #ccc;">999</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Prevent/Channel</strong></td><td style="padding:8px;border:1px solid #ccc;">{{prevent_contact}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>NSPCC Helpline</strong></td><td style="padding:8px;border:1px solid #ccc;">0808 800 5000</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Childline</strong></td><td style="padding:8px;border:1px solid #ccc;">0800 1111</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>SENCO</strong></td><td style="padding:8px;border:1px solid #ccc;">{{senco_name}}</td></tr>
</table>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Approved by the Governing Body: {{review_date}} | This policy is reviewed annually and whenever DfE issues updated statutory guidance.</p>'
),

-- ============================================================
-- 2. KCSIE STAFF ACKNOWLEDGEMENT FORM
-- ============================================================
(
  gen_random_uuid(),
  'generic_doc',
  'KCSIE Staff Acknowledgement Form',
  'Annual acknowledgement form for staff to confirm they have read and understood Part 1 (and Annex B where applicable) of Keeping Children Safe in Education 2024, the school safeguarding policy, and the staff code of conduct.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'Keeping Children Safe in Education 2024',
  'KCSIE 2024 Part 1 and Annex B',
  '{"required_fields": ["school_name", "academic_year", "review_date"], "optional_fields": ["dsl_name"]}',
  '<h1>KCSIE Staff Acknowledgement Form</h1>
<h2>{{school_name}} — Academic Year {{academic_year}}</h2>

<p>In accordance with Keeping Children Safe in Education (KCSIE) 2024, all staff working in the school must read and confirm their understanding of key safeguarding documents. Please read each statement carefully, tick the relevant box, sign, and return this form to the Designated Safeguarding Lead or school office.</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:20px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Document / Requirement</th>
<th style="padding:10px;border:1px solid #ccc;width:80px;text-align:center;">Confirmed</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:10px;border:1px solid #ccc;">I have read and understood <strong>Part 1 of Keeping Children Safe in Education 2024</strong> (''Safeguarding information for all staff'').</td><td style="padding:10px;border:1px solid #ccc;text-align:center;">&#9744;</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">I have read and understood <strong>Annex B of Keeping Children Safe in Education 2024</strong> (''Further information on specific forms of abuse and safeguarding issues''). <em>Required for all staff who work directly with children.</em></td><td style="padding:10px;border:1px solid #ccc;text-align:center;">&#9744;</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">I have read and understood the school''s <strong>Safeguarding and Child Protection Policy</strong> (current version).</td><td style="padding:10px;border:1px solid #ccc;text-align:center;">&#9744;</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">I have read and understood the school''s <strong>Staff Code of Conduct</strong>.</td><td style="padding:10px;border:1px solid #ccc;text-align:center;">&#9744;</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">I have read and understood the school''s <strong>Behaviour Policy</strong> (including measures to address child-on-child abuse).</td><td style="padding:10px;border:1px solid #ccc;text-align:center;">&#9744;</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">I have read and understood the school''s <strong>Online Safety Policy / Acceptable Use Policy</strong>.</td><td style="padding:10px;border:1px solid #ccc;text-align:center;">&#9744;</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">I understand the role of the <strong>Designated Safeguarding Lead</strong> and know who to report concerns to.</td><td style="padding:10px;border:1px solid #ccc;text-align:center;">&#9744;</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">I understand my duty to report any safeguarding concern about a child to the DSL <strong>immediately</strong> and that I can make a referral to children''s social care directly if needed.</td><td style="padding:10px;border:1px solid #ccc;text-align:center;">&#9744;</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">I understand the school''s <strong>Whistleblowing Policy</strong> and know how to escalate concerns externally (Ofsted, NSPCC).</td><td style="padding:10px;border:1px solid #ccc;text-align:center;">&#9744;</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">I am aware of the <strong>mandatory reporting duty for FGM</strong> (teachers must report directly to the police — this cannot be delegated).</td><td style="padding:10px;border:1px solid #ccc;text-align:center;">&#9744;</td></tr>
</tbody>
</table>

<h3>Declaration</h3>
<p>I confirm that I have read and understood the documents listed above. I understand my responsibilities for safeguarding and child protection, and I will act in accordance with the school''s policies and procedures at all times.</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:20px 0;">
<tr><td style="padding:10px;border:1px solid #ccc;width:30%;"><strong>Full Name (printed)</strong></td><td style="padding:10px;border:1px solid #ccc;">{{staff_name}}</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;"><strong>Job Title / Role</strong></td><td style="padding:10px;border:1px solid #ccc;">{{staff_role}}</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;"><strong>Signature</strong></td><td style="padding:10px;border:1px solid #ccc;height:40px;"></td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:10px;border:1px solid #ccc;">{{date}}</td></tr>
</table>

<p style="margin-top:20px;font-size:0.9em;color:#666;"><em>This form should be completed at the start of each academic year, on appointment (for new staff), or whenever KCSIE is updated. Completed forms are retained by the school as evidence of compliance.</em></p>'
),

-- ============================================================
-- 3. LOW-LEVEL CONCERN FORM
-- ============================================================
(
  gen_random_uuid(),
  'generic_doc',
  'Low-Level Concern Form',
  'Form for recording low-level concerns about adult behaviour in line with KCSIE 2024 Part 4 Section 2. Captures details of the concern, context, and DSL review.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'Keeping Children Safe in Education 2024 Part 4',
  'KCSIE 2024 Part 4 Section 2 / Guidance for Safer Working Practice (Safer Recruitment Consortium) 2022',
  '{"required_fields": ["school_name", "date"], "optional_fields": ["headteacher_name", "dsl_name"]}',
  '<h1>Low-Level Concern Form</h1>
<h2>{{school_name}}</h2>
<p style="background:#fff3cd;padding:12px;border:1px solid #ffc107;border-radius:4px;"><strong>Important:</strong> A low-level concern is any concern — no matter how small, and even if no more than a ''nagging doubt'' — that an adult working in or on behalf of the school may have acted in a way that is inconsistent with the staff code of conduct, including inappropriate conduct outside of work, but that does not meet the harms threshold for referral to the LADO. If the concern <strong>does</strong> meet the harms threshold, do not use this form — report immediately to the headteacher (or chair of governors if the concern is about the headteacher) for LADO referral.</p>

<h3>Section A: Reporter Details</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:35%;"><strong>Your name</strong></td><td style="padding:8px;border:1px solid #ccc;">{{reporter_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Your role</strong></td><td style="padding:8px;border:1px solid #ccc;">{{reporter_role}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date of this report</strong></td><td style="padding:8px;border:1px solid #ccc;">{{date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Is this a self-referral?</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes / No</td></tr>
</table>

<h3>Section B: Details of the Concern</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:35%;"><strong>Name of adult about whom the concern relates</strong></td><td style="padding:8px;border:1px solid #ccc;">{{staff_concerned_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Their role</strong></td><td style="padding:8px;border:1px solid #ccc;">{{staff_concerned_role}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date and time of the incident/behaviour</strong></td><td style="padding:8px;border:1px solid #ccc;">{{incident_date_time}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Location</strong></td><td style="padding:8px;border:1px solid #ccc;">{{incident_location}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Name(s) of child(ren) involved (if any)</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Were there any witnesses?</strong></td><td style="padding:8px;border:1px solid #ccc;">{{witnesses}}</td></tr>
</table>

<h3>Description of the Behaviour or Concern</h3>
<p><em>Please provide a factual, detailed description of the behaviour you observed or were told about. Include direct quotes where possible. Avoid opinions or interpretations — record what you saw or heard.</em></p>
<div style="border:1px solid #ccc;min-height:150px;padding:12px;margin:15px 0;">{{concern_description}}</div>

<h3>Context</h3>
<p><em>Is there any additional context that is relevant (e.g., was this observed during a lesson, break time, school trip)? Have you observed similar behaviour before?</em></p>
<div style="border:1px solid #ccc;min-height:80px;padding:12px;margin:15px 0;">{{concern_context}}</div>

<h3>Have you discussed this concern with the individual?</h3>
<p>Yes / No — If yes, summarise their response:</p>
<div style="border:1px solid #ccc;min-height:80px;padding:12px;margin:15px 0;">{{individual_response}}</div>

<h3>Section C: DSL / Headteacher Review</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:35%;"><strong>Reviewed by</strong></td><td style="padding:8px;border:1px solid #ccc;">{{reviewer_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date of review</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Assessment</strong></td><td style="padding:8px;border:1px solid #ccc;">
&#9744; Behaviour is consistent with the staff code of conduct — no further action<br/>
&#9744; Behaviour is inconsistent with the staff code of conduct — informal conversation with individual<br/>
&#9744; Pattern of behaviour identified — refer to HR / disciplinary process<br/>
&#9744; Concern meets the harms threshold — refer to LADO<br/>
&#9744; Other (specify below)
</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Rationale for decision</strong></td><td style="padding:8px;border:1px solid #ccc;min-height:60px;">{{review_rationale}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Action taken</strong></td><td style="padding:8px;border:1px solid #ccc;">{{action_taken}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Reviewer signature</strong></td><td style="padding:8px;border:1px solid #ccc;height:30px;"></td></tr>
</table>

<p style="margin-top:20px;font-size:0.9em;color:#666;">This form is retained securely by the headteacher. Records of low-level concerns are reviewed periodically to identify patterns of behaviour. Retention: until the individual leaves the school''s employment, then reviewed for continued retention in line with IRMS guidance.</p>'
),

-- ============================================================
-- 4. RECORD OF CONCERN (CHILD)
-- ============================================================
(
  gen_random_uuid(),
  'generic_doc',
  'Record of Concern — Child Safeguarding',
  'Standardised form for recording safeguarding concerns about a child, including factual recording, body map reference, child''s own words, actions taken, and referral tracking. Aligned with KCSIE 2024 and Working Together 2023.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'Keeping Children Safe in Education 2024',
  'KCSIE 2024 / Working Together 2023 / Children Act 1989',
  '{"required_fields": ["school_name", "dsl_name", "date"], "optional_fields": ["mash_phone", "mash_email"]}',
  '<h1>Record of Concern — Child Safeguarding</h1>
<h2>{{school_name}}</h2>
<p style="background:#f8d7da;padding:12px;border:1px solid #f5c6cb;border-radius:4px;"><strong>CONFIDENTIAL</strong> — This form contains sensitive safeguarding information. It must be stored securely and separately from the child''s main educational file. Access is restricted to the DSL, deputy DSL, and headteacher on a ''need-to-know'' basis.</p>

<h3>Section A: Child Details</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:35%;"><strong>Child''s full name</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date of birth</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_dob}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Year group / class</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_year_group}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Gender</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_gender}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Ethnicity</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_ethnicity}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>SEND status</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_send_status}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Looked after / previously looked after</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_lac_status}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Child protection plan / Child in need</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_cp_status}}</td></tr>
</table>

<h3>Section B: Concern Details</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:35%;"><strong>Your name</strong></td><td style="padding:8px;border:1px solid #ccc;">{{reporter_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Your role</strong></td><td style="padding:8px;border:1px solid #ccc;">{{reporter_role}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date and time of concern / disclosure / incident</strong></td><td style="padding:8px;border:1px solid #ccc;">{{incident_date_time}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date and time of this record</strong></td><td style="padding:8px;border:1px solid #ccc;">{{date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Type of concern</strong></td><td style="padding:8px;border:1px solid #ccc;">
&#9744; Disclosure by child<br/>
&#9744; Observation of physical indicators<br/>
&#9744; Observation of behavioural indicators<br/>
&#9744; Information from third party<br/>
&#9744; Allegation<br/>
&#9744; Online safety concern<br/>
&#9744; Other
</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Category of abuse (if identifiable)</strong></td><td style="padding:8px;border:1px solid #ccc;">
&#9744; Physical abuse&emsp;&#9744; Emotional abuse&emsp;&#9744; Sexual abuse&emsp;&#9744; Neglect<br/>
&#9744; CSE&emsp;&#9744; CCE / County lines&emsp;&#9744; Radicalisation&emsp;&#9744; FGM<br/>
&#9744; Peer-on-peer abuse&emsp;&#9744; Domestic abuse&emsp;&#9744; Mental health&emsp;&#9744; Other
</td></tr>
</table>

<h3>Factual Account of the Concern</h3>
<p><em>Record factually what you saw, heard, or were told. Use the child''s own words in quotation marks where a disclosure has been made. Do not include your opinions or interpretations. Note the child''s demeanour and emotional state.</em></p>
<div style="border:1px solid #ccc;min-height:200px;padding:12px;margin:15px 0;">{{concern_description}}</div>

<h3>Body Map</h3>
<p><em>If physical indicators are present, mark the location of injuries/marks on the body map. Note the size, shape, colour, and any other relevant details. Do NOT photograph injuries — use a body map only.</em></p>
<div style="border:1px solid #ccc;min-height:200px;padding:12px;margin:15px 0;text-align:center;">
<p>[Body Map — front and rear outline to be used for marking observed injuries]</p>
<p><em>Description of marks/injuries observed:</em></p>
<p>{{body_map_notes}}</p>
</div>

<h3>Previous Concerns</h3>
<p><em>Are there any previous concerns recorded about this child? If yes, provide dates and brief summary.</em></p>
<div style="border:1px solid #ccc;min-height:60px;padding:12px;margin:15px 0;">{{previous_concerns}}</div>

<h3>Section C: DSL Action and Outcome</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:35%;"><strong>DSL name</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dsl_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date received by DSL</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dsl_received_date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Action taken</strong></td><td style="padding:8px;border:1px solid #ccc;">
&#9744; Internal monitoring and support<br/>
&#9744; Discussion with parents/carers<br/>
&#9744; Early Help referral<br/>
&#9744; Referral to children''s social care (MASH)<br/>
&#9744; Referral to police<br/>
&#9744; Referral to CAMHS or health services<br/>
&#9744; Referral to other agency (specify)<br/>
&#9744; No further action (rationale must be recorded)
</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Rationale for decision</strong></td><td style="padding:8px;border:1px solid #ccc;min-height:60px;">{{dsl_rationale}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Referral reference number (if applicable)</strong></td><td style="padding:8px;border:1px solid #ccc;">{{referral_reference}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Parents/carers informed?</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes / No — If no, state reason (e.g., would increase risk to the child):</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Outcome / follow-up</strong></td><td style="padding:8px;border:1px solid #ccc;">{{outcome}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>DSL signature</strong></td><td style="padding:8px;border:1px solid #ccc;height:30px;"></td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{dsl_action_date}}</td></tr>
</table>

<p style="margin-top:20px;font-size:0.9em;color:#666;">Retention: DOB of child + 25 years, or date of last entry + 25 years (whichever is longer). Transfer to new school with the safeguarding file — marked ''Confidential — for attention of DSL only''.</p>'
),

-- ============================================================
-- 5. WHISTLEBLOWING POLICY
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'Whistleblowing Policy',
  'Comprehensive whistleblowing policy covering qualifying disclosures under the Public Interest Disclosure Act 1998, internal and external escalation routes, protections for whistleblowers, and named contacts. Cross-references safeguarding and KCSIE requirements.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Governance Handbook 2024',
  'Public Interest Disclosure Act 1998 / Employment Rights Act 1996 / KCSIE 2024',
  '{"required_fields": ["school_name", "headteacher_name", "chair_of_governors", "review_date"], "optional_fields": ["trust_name", "trust_ceo", "hr_contact", "school_email"]}',
  '<h1>Whistleblowing Policy</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Chair of Governors</strong></td><td style="padding:8px;border:1px solid #ccc;">{{chair_of_governors}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date Adopted</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Introduction</h2>
<p>{{school_name}} is committed to the highest standards of openness, integrity, and accountability. We encourage all employees, workers, volunteers, governors, and contractors who have serious concerns about any aspect of the school''s work to come forward and voice those concerns without fear of reprisal.</p>
<p>This policy is designed to provide guidance on how to raise concerns internally and, where necessary, externally. It reflects the requirements of the <strong>Public Interest Disclosure Act 1998 (PIDA)</strong> and the <strong>Employment Rights Act 1996</strong>, as well as DfE guidance in <strong>Keeping Children Safe in Education 2024</strong> regarding the duty of staff to report safeguarding concerns.</p>
<p>This policy is not intended as a mechanism for raising matters that are covered by other procedures, such as individual grievances, disciplinary issues, or complaints about services. These should be raised through the appropriate policy.</p>

<h2>2. What Is Whistleblowing?</h2>
<p>Whistleblowing is the reporting of suspected wrongdoing or dangers in the workplace. Under PIDA, a ''qualifying disclosure'' is the disclosure of information that, in the reasonable belief of the worker, is made in the public interest and tends to show one or more of the following:</p>
<ul>
<li>A criminal offence has been committed, is being committed, or is likely to be committed</li>
<li>A person has failed, is failing, or is likely to fail to comply with a legal obligation</li>
<li>A miscarriage of justice has occurred, is occurring, or is likely to occur</li>
<li>The health and safety of an individual has been, is being, or is likely to be endangered</li>
<li>The environment has been, is being, or is likely to be damaged</li>
<li>Information tending to show any of the above has been, is being, or is likely to be deliberately concealed</li>
</ul>

<h2>3. How to Raise a Concern Internally</h2>
<h3>Step 1: Raise with Line Manager or Headteacher</h3>
<p>In the first instance, concerns should be raised with the headteacher ({{headteacher_name}}), either verbally or in writing. If the concern relates to the headteacher, it should be raised with the chair of governors ({{chair_of_governors}}) via the school office marked ''Private and Confidential''.</p>
<h3>Step 2: Acknowledgement</h3>
<p>The recipient will acknowledge the concern within <strong>5 working days</strong> and advise the individual of the proposed next steps, including an indication of the likely timescale for an investigation.</p>
<h3>Step 3: Investigation</h3>
<p>The school will investigate the concern. This may involve an internal investigation, referral to the police, referral to the local authority, or referral to an external auditor, depending on the nature of the concern. The individual raising the concern will be kept informed of progress, subject to any legal or confidentiality constraints.</p>
<h3>Step 4: Outcome</h3>
<p>At the conclusion of the investigation, the school will inform the individual (as far as possible) of the outcome and any actions taken. If the individual is not satisfied with the response, they may escalate the concern externally (see section 4 below).</p>

<h2>4. Raising Concerns Externally</h2>
<p>If the individual feels unable to raise the concern with the school, or if they feel the concern has not been adequately addressed, they may contact the following external bodies:</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Organisation</th>
<th style="padding:8px;border:1px solid #ccc;">Contact Details</th>
<th style="padding:8px;border:1px solid #ccc;">When to Contact</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Ofsted</strong></td><td style="padding:8px;border:1px solid #ccc;">0300 123 3155 / whistleblowing@ofsted.gov.uk</td><td style="padding:8px;border:1px solid #ccc;">Concerns about children''s welfare or education standards</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>NSPCC Whistleblowing Helpline</strong></td><td style="padding:8px;border:1px solid #ccc;">0800 028 0285 / help@nspcc.org.uk</td><td style="padding:8px;border:1px solid #ccc;">Concerns about a child''s safety or welfare</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Police</strong></td><td style="padding:8px;border:1px solid #ccc;">101 (non-emergency) or 999 (emergency)</td><td style="padding:8px;border:1px solid #ccc;">Criminal offences or immediate danger</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Health and Safety Executive (HSE)</strong></td><td style="padding:8px;border:1px solid #ccc;">0300 003 1647 / hse.gov.uk</td><td style="padding:8px;border:1px solid #ccc;">Health and safety risks</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Information Commissioner''s Office (ICO)</strong></td><td style="padding:8px;border:1px solid #ccc;">0303 123 1113 / ico.org.uk</td><td style="padding:8px;border:1px solid #ccc;">Data protection breaches</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Education and Skills Funding Agency (ESFA)</strong></td><td style="padding:8px;border:1px solid #ccc;">academy.questions@education.gov.uk</td><td style="padding:8px;border:1px solid #ccc;">Financial irregularities in academies/free schools</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Local Authority Designated Officer (LADO)</strong></td><td style="padding:8px;border:1px solid #ccc;">Via your local authority</td><td style="padding:8px;border:1px solid #ccc;">Allegations against adults who work with children</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Protect (formerly Public Concern at Work)</strong></td><td style="padding:8px;border:1px solid #ccc;">020 3117 2520 / protect-advice.org.uk</td><td style="padding:8px;border:1px solid #ccc;">Independent, confidential whistleblowing advice</td></tr>
</tbody>
</table>

<h2>5. Protection for Whistleblowers</h2>
<p>The school will not tolerate any form of retaliation, harassment, victimisation, or disadvantage against any individual who raises a genuine concern in good faith under this policy, even if the concern turns out to be unfounded. Under the <strong>Employment Rights Act 1996</strong> (as amended by PIDA), workers who make a qualifying disclosure are protected from:</p>
<ul>
<li>Dismissal (which will be treated as automatically unfair)</li>
<li>Redundancy selection</li>
<li>Any detriment (e.g., denied promotion, denied training, bullying, or harassment)</li>
</ul>
<p>Any staff member who retaliates against a whistleblower will be subject to disciplinary action, which may include dismissal.</p>

<h2>6. Confidentiality</h2>
<p>The school will treat all disclosures in a confidential and sensitive manner. The identity of the whistleblower will not be disclosed without their consent unless required by law (e.g., in the course of a criminal investigation). Where possible, the school will make every effort to protect the identity of the individual raising the concern.</p>

<h2>7. Anonymous Disclosures</h2>
<p>While we encourage individuals to put their name to allegations, anonymous disclosures will be considered at the discretion of the school. In exercising this discretion, the school will consider the seriousness of the issue, the credibility of the concern, and the likelihood of being able to investigate the matter effectively.</p>

<h2>8. False or Malicious Allegations</h2>
<p>If an individual makes an allegation in good faith, which is not confirmed by the investigation, no action will be taken against them. However, if an individual makes an allegation that they know to be untrue or makes an allegation for malicious purposes, disciplinary action may be taken against them.</p>

<h2>9. Safeguarding-Specific Provisions</h2>
<p>KCSIE 2024 is clear that all staff should feel able to raise concerns about poor or unsafe practice and potential failures in the school''s safeguarding regime. This includes concerns about the actions of a colleague, a volunteer, a contractor, a governor, or the headteacher. The school recognises that children cannot be expected to raise concerns in an environment where staff fail to do so.</p>
<p>Where a concern relates to safeguarding, staff should not delay in reporting it. If staff do not feel comfortable raising a safeguarding concern internally, they should contact Ofsted (0300 123 3155) or the NSPCC Whistleblowing Helpline (0800 028 0285) directly.</p>

<h2>10. Record Keeping</h2>
<p>The school will maintain a secure record of all whistleblowing disclosures, investigations, and outcomes. These records will be retained for a minimum of 6 years and will be reviewed by the governing body to identify any systemic issues.</p>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Date adopted: {{review_date}} | Review: annually or following any relevant change in legislation</p>'
),

-- ============================================================
-- 6. HEALTH & SAFETY POLICY
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'Health and Safety Policy (Comprehensive)',
  'Three-part health and safety policy covering Statement of Intent, Organisation (roles and responsibilities), and Arrangements for all key hazard areas. Aligned with Health and Safety at Work etc. Act 1974 and Management of Health and Safety at Work Regulations 1999.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Health and Safety Advice for Schools',
  'Health and Safety at Work etc. Act 1974 / Management of Health and Safety at Work Regulations 1999',
  '{"required_fields": ["school_name", "school_address", "headteacher_name", "chair_of_governors", "hs_coordinator", "review_date"], "optional_fields": ["trust_name", "site_manager", "first_aid_coordinator", "fire_marshal", "school_phone", "la_hs_contact"]}',
  '<h1>Health and Safety Policy</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>H&amp;S Coordinator</strong></td><td style="padding:8px;border:1px solid #ccc;">{{hs_coordinator}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Chair of Governors</strong></td><td style="padding:8px;border:1px solid #ccc;">{{chair_of_governors}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date Adopted</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>PART A: STATEMENT OF INTENT</h2>

<p>The governing body of {{school_name}} recognises and accepts its responsibilities as an employer under the <strong>Health and Safety at Work etc. Act 1974 (HSWA)</strong>, the <strong>Management of Health and Safety at Work Regulations 1999 (MHSWR)</strong>, and all other relevant legislation and approved codes of practice.</p>
<p>The governing body will, so far as is reasonably practicable, ensure:</p>
<ul>
<li>The health, safety, and welfare of all employees, pupils, visitors, contractors, and others affected by the school''s activities</li>
<li>The provision and maintenance of a safe and healthy working environment, including safe access and egress</li>
<li>The provision and maintenance of plant, equipment, and systems of work that are safe and without risks to health</li>
<li>Adequate information, instruction, training, and supervision to enable all employees to carry out their work safely</li>
<li>Arrangements for the safe use, handling, storage, and transport of articles and substances</li>
<li>Adequate provision for first aid, fire safety, and emergency procedures</li>
<li>Consultation with employees on matters affecting their health and safety</li>
<li>The assessment and management of risks to the health and safety of employees and others who may be affected</li>
<li>The provision of sufficient resources (time, money, people) to meet these obligations</li>
</ul>
<p>This policy will be reviewed annually, or more frequently if there are significant changes in legislation, guidance, or the school''s circumstances.</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:20px 0;">
<tr><td style="padding:10px;border:1px solid #ccc;width:50%;"><strong>Signed (Headteacher):</strong><br/><br/>{{headteacher_name}}<br/>Date: {{review_date}}</td><td style="padding:10px;border:1px solid #ccc;"><strong>Signed (Chair of Governors):</strong><br/><br/>{{chair_of_governors}}<br/>Date: {{review_date}}</td></tr>
</table>

<h2>PART B: ORGANISATION — Roles and Responsibilities</h2>

<h3>B1. The Governing Body</h3>
<ul>
<li>Has overall responsibility for health and safety as the employer (or, in academy trusts, the trust board delegates this to the local governing body)</li>
<li>Appoints a named Health and Safety governor to oversee compliance at board level</li>
<li>Ensures adequate resources are allocated for health and safety</li>
<li>Approves this policy and monitors its implementation through termly reports and annual audits</li>
<li>Ensures that the school premises comply with all relevant legislation, including fire safety (RRFSO 2005), asbestos (CAR 2012), legionella (L8 ACOP), and disability access (Equality Act 2010)</li>
</ul>

<h3>B2. The Headteacher</h3>
<p>The headteacher ({{headteacher_name}}) has day-to-day responsibility for health and safety and will:</p>
<ul>
<li>Implement this policy and ensure all staff are aware of their responsibilities</li>
<li>Ensure risk assessments are completed and reviewed regularly for all significant activities and hazards</li>
<li>Report to the governing body on health and safety matters at least termly</li>
<li>Ensure accidents and incidents are recorded, investigated, and reported under RIDDOR where applicable</li>
<li>Ensure fire drills are conducted at least termly (at least once in the first week for new premises or significant layout changes)</li>
<li>Ensure all statutory inspections and maintenance are carried out on time (fire alarm testing, emergency lighting, PAT testing, gas safety, legionella checks, asbestos monitoring, lift inspections, playground inspections)</li>
<li>Ensure new and expectant mothers have a workplace risk assessment</li>
<li>Ensure all contractors are managed safely and comply with the school''s H&amp;S requirements</li>
</ul>

<h3>B3. Health and Safety Coordinator</h3>
<p>The H&amp;S Coordinator ({{hs_coordinator}}) will:</p>
<ul>
<li>Coordinate health and safety activities on a day-to-day basis</li>
<li>Maintain the school''s risk assessment register and ensure assessments are current</li>
<li>Conduct regular health and safety inspections of the premises (at least termly)</li>
<li>Ensure accident/incident records are maintained and trends analysed</li>
<li>Liaise with the local authority, HSE, fire service, and other external agencies as required</li>
<li>Coordinate health and safety training for staff</li>
<li>Maintain records of statutory inspections, maintenance, and testing</li>
</ul>

<h3>B4. All Employees</h3>
<p>Under Section 7 of HSWA 1974, all employees have a duty to:</p>
<ul>
<li>Take reasonable care for their own health and safety and that of others who may be affected by their acts or omissions</li>
<li>Cooperate with the employer so far as is necessary to enable compliance with health and safety duties</li>
<li>Not intentionally or recklessly interfere with or misuse anything provided in the interests of health, safety, or welfare</li>
<li>Report any hazards, defects, accidents, or near-misses to the H&amp;S Coordinator or headteacher without delay</li>
<li>Follow all safe working procedures and use personal protective equipment (PPE) as required</li>
<li>Attend health and safety training as directed</li>
</ul>

<h3>B5. Contractors</h3>
<ul>
<li>All contractors must report to reception, sign in, and receive a briefing on the school''s H&amp;S and safeguarding arrangements before starting work</li>
<li>Contractors must provide risk assessments and method statements (RAMS) for their activities before commencing work</li>
<li>The school will check that contractors have appropriate insurance, qualifications, and (where applicable) DBS checks</li>
<li>The H&amp;S Coordinator will monitor contractor activities on site</li>
</ul>

<h3>B6. Pupils</h3>
<ul>
<li>Pupils are expected to follow all school safety rules and instructions given by staff</li>
<li>Age-appropriate health and safety education is delivered through the curriculum (science, PSHE, design and technology, PE)</li>
<li>Pupils are encouraged to report hazards and safety concerns to staff</li>
</ul>

<h2>PART C: ARRANGEMENTS</h2>

<h3>C1. Risk Assessment (MHSWR 1999, Regulation 3)</h3>
<p>The school will carry out and regularly review risk assessments for all significant hazards. Risk assessments will identify the hazards, who might be harmed and how, existing control measures, risk rating (likelihood x severity), and any additional controls needed. Specific risk assessments will be completed for:</p>
<ul>
<li>General premises hazards (classrooms, corridors, playgrounds, kitchens)</li>
<li>Activities (PE, science experiments, design and technology, drama, cooking)</li>
<li>Educational visits and off-site activities</li>
<li>New and expectant mothers</li>
<li>Young workers (under 18)</li>
<li>Pupils with medical conditions or SEND</li>
<li>Events (e.g., sports day, fetes, performances)</li>
<li>Lone working</li>
<li>Violence and aggression</li>
</ul>

<h3>C2. Fire Safety (Regulatory Reform (Fire Safety) Order 2005)</h3>
<ul>
<li>A fire risk assessment is in place, reviewed annually, and updated after any significant changes to the premises or occupancy</li>
<li>Fire drills are conducted <strong>at least once per term</strong> and records maintained</li>
<li>Fire alarm systems are tested weekly and serviced at least annually by a competent contractor</li>
<li>Emergency lighting is tested monthly (flick test) and annually (full duration test)</li>
<li>Fire extinguishers are inspected annually and serviced in accordance with BS 5306</li>
<li>Fire escape routes are clearly signed, unobstructed, and checked regularly</li>
<li>Personal Emergency Evacuation Plans (PEEPs) are in place for any person with mobility or sensory impairment</li>
<li>Named fire marshals/wardens are appointed for each area/floor and are trained</li>
<li>All staff receive fire safety training at induction and at least annually thereafter</li>
</ul>

<h3>C3. First Aid (Health and Safety (First-Aid) Regulations 1981)</h3>
<ul>
<li>An adequate number of trained first aiders are available on site at all times, including during breaks, before/after school clubs, and school trips</li>
<li>First aid kits are maintained and checked regularly, and their locations are clearly signed</li>
<li>All accidents requiring first aid treatment are recorded in the accident book</li>
<li>Parents/carers are informed of any significant injury or head injury on the same day</li>
<li>Staff administering medication follow the school''s Supporting Pupils with Medical Conditions Policy</li>
<li>An AED (automated external defibrillator) is available on site and staff are trained in its use</li>
</ul>

<h3>C4. Accident Reporting (RIDDOR 2013)</h3>
<ul>
<li>All accidents, incidents, and near-misses are recorded in the school''s accident book</li>
<li>The H&amp;S Coordinator will determine whether an accident is RIDDOR-reportable and, if so, report to the HSE via the online reporting system within the required timescales</li>
<li>RIDDOR-reportable incidents include: death, specified injuries (fractures other than fingers/thumbs/toes, amputations, loss of sight, crush injuries, burns requiring hospital treatment, loss of consciousness, acute illness requiring medical treatment), over-7-day incapacitation of a worker, non-fatal accidents to non-workers resulting in hospital treatment, dangerous occurrences, and occupational diseases</li>
<li>All serious accidents and near-misses are investigated to identify root causes and prevent recurrence</li>
</ul>

<h3>C5. Lone Working</h3>
<ul>
<li>Risk assessments are in place for lone working activities (e.g., site manager working alone, cleaning staff, staff working late)</li>
<li>Staff must not undertake high-risk activities (e.g., working at height, using hazardous substances) when alone on site</li>
<li>A system is in place for lone workers to check in and raise the alarm in an emergency</li>
</ul>

<h3>C6. Manual Handling (Manual Handling Operations Regulations 1992)</h3>
<ul>
<li>Manual handling is avoided where reasonably practicable and mechanical aids are provided</li>
<li>Where manual handling cannot be avoided, risk assessments are completed and staff receive training</li>
<li>This is particularly relevant for EYFS/KS1 staff, site staff, kitchen staff, and staff supporting pupils with physical disabilities</li>
</ul>

<h3>C7. Display Screen Equipment (Health and Safety (Display Screen Equipment) Regulations 1992)</h3>
<ul>
<li>DSE assessments are carried out for all habitual users (admin staff, teachers with significant computer use)</li>
<li>The school will provide suitable equipment (adjustable chairs, monitor stands, wrist rests) where identified by the assessment</li>
<li>Eye tests are offered to DSE users on request and at regular intervals, with the school contributing to the cost of corrective appliances if required</li>
</ul>

<h3>C8. COSHH (Control of Substances Hazardous to Health Regulations 2002)</h3>
<ul>
<li>An inventory of hazardous substances used on site is maintained (e.g., cleaning chemicals, science chemicals, art materials)</li>
<li>COSHH assessments are in place for all hazardous substances, and safety data sheets are available</li>
<li>Hazardous substances are stored securely, labelled correctly, and used in accordance with the manufacturer''s instructions</li>
<li>Appropriate PPE is provided and its use is enforced</li>
</ul>

<h3>C9. Asbestos Management (Control of Asbestos Regulations 2012)</h3>
<ul>
<li>An asbestos management survey has been carried out by a competent person and the asbestos register is maintained and available on site</li>
<li>All staff, including contractors, are made aware of the location of asbestos-containing materials (ACMs) before undertaking any work that may disturb the fabric of the building</li>
<li>ACMs in good condition are managed in situ and inspected regularly (at least annually)</li>
<li>Any damage to, or deterioration of, ACMs is reported immediately and the area is made safe pending professional assessment</li>
<li>No work that may disturb ACMs is permitted without prior reference to the asbestos register and, where necessary, a refurbishment/demolition survey</li>
</ul>

<h3>C10. Legionella Management (HSE Approved Code of Practice L8)</h3>
<ul>
<li>A legionella risk assessment has been carried out by a competent person and is reviewed at least biennially</li>
<li>Routine monitoring is in place: monthly temperature checks of sentinel taps (hot and cold), quarterly flushing of little-used outlets, annual inspection of calorifiers, and regular cleaning/descaling of showerheads</li>
<li>Written records of all monitoring activities are maintained</li>
<li>A named ''responsible person'' oversees legionella management: {{hs_coordinator}}</li>
</ul>

<h3>C11. Electrical Safety</h3>
<ul>
<li>Fixed electrical installation testing (EICR) is carried out at least every 5 years by a competent contractor</li>
<li>Portable appliance testing (PAT) is carried out in accordance with the IET Code of Practice (frequency varies by equipment type and environment)</li>
<li>Staff must not bring personal electrical equipment to school without prior approval and PAT testing</li>
<li>Defective electrical equipment must be taken out of service immediately, labelled ''do not use'', and reported to the site manager</li>
</ul>

<h3>C12. Working at Height (Work at Height Regulations 2005)</h3>
<ul>
<li>Working at height is avoided wherever reasonably practicable</li>
<li>Where working at height is necessary, appropriate equipment (step ladders, kick stools, tower scaffolds) is provided and maintained</li>
<li>Only trained and competent persons may work at height</li>
<li>Standing on chairs, tables, or other furniture is not permitted</li>
</ul>

<h3>C13. Educational Visits (DfE Health and Safety Advice for Schools)</h3>
<ul>
<li>All educational visits are planned, risk-assessed, and approved in accordance with the school''s Educational Visits Policy and the local authority/trust guidelines</li>
<li>An Educational Visits Coordinator (EVC) is appointed and trained</li>
<li>Parental consent is obtained for all off-site activities (blanket consent for routine local visits; specific consent for adventurous activities, residential, and overseas visits)</li>
<li>External providers of adventurous activities hold a current LOtC Quality Badge or equivalent accreditation</li>
<li>Staff-to-pupil ratios are appropriate for the age group, activity, venue, and needs of the pupils</li>
</ul>

<h3>C14. Playground Safety</h3>
<ul>
<li>Playground equipment is inspected in accordance with EN 1176 / EN 1177: operational inspection (daily/weekly visual check), routine inspection (monthly detailed check), and annual main inspection by an independent RPII-registered inspector</li>
<li>Adequate supervision is provided during all break and lunch times</li>
<li>Surface condition is monitored and defects are repaired promptly</li>
</ul>

<h3>C15. Minibus Use</h3>
<ul>
<li>Minibus drivers hold the appropriate licence (D1 or Section 19 permit where applicable)</li>
<li>The minibus is maintained, taxed, insured, and MOT''d (where applicable)</li>
<li>Pre-use vehicle checks are completed by the driver before each journey</li>
<li>A risk assessment is in place for minibus use</li>
</ul>

<h3>C16. New and Expectant Mothers (MHSWR 1999, Regulations 16-18)</h3>
<ul>
<li>Once the school is notified of a pregnancy, a specific risk assessment will be completed and reviewed regularly as the pregnancy progresses</li>
<li>The assessment will consider: working conditions, chemical/biological hazards, manual handling, standing/sitting for long periods, stress, and any medical advice</li>
<li>Where a significant risk is identified, the school will adjust working conditions or hours, offer suitable alternative work, or suspend on full pay if no alternative is available</li>
</ul>

<h3>C17. Stress and Wellbeing</h3>
<ul>
<li>The school recognises that workplace stress can affect health and is committed to managing work-related stress through its Wellbeing Strategy</li>
<li>Risk factors are monitored through staff surveys, absence data, and regular one-to-one meetings</li>
<li>Support is available through the Employee Assistance Programme (EAP), occupational health referral, and flexible working arrangements where possible</li>
</ul>

<h3>C18. Monitoring and Review</h3>
<ul>
<li>Health and safety inspections of the premises are conducted at least termly by the H&amp;S Coordinator, with findings reported to the headteacher and governing body</li>
<li>An annual health and safety audit is conducted, either internally or by the local authority / external consultant</li>
<li>This policy is reviewed annually by the governing body</li>
</ul>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Date adopted: {{review_date}} | Review: annually or following significant incident, legislative change, or premises alteration</p>'
),

-- ============================================================
-- 7. RISK ASSESSMENT TEMPLATE
-- ============================================================
(
  gen_random_uuid(),
  'generic_doc',
  'Risk Assessment Template (Standard 5-Column)',
  'Standard risk assessment template with 5-column format (hazard, who harmed, existing controls, risk rating with likelihood x severity matrix, additional controls). Includes guidance notes, assessor details, and review schedule. Aligned with MHSWR 1999 Regulation 3.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Health and Safety Advice for Schools',
  'Management of Health and Safety at Work Regulations 1999 Regulation 3',
  '{"required_fields": ["school_name", "date"], "optional_fields": ["hs_coordinator", "headteacher_name"]}',
  '<h1>Risk Assessment</h1>
<h2>{{school_name}}</h2>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Assessment title / activity</strong></td><td style="padding:8px;border:1px solid #ccc;">{{assessment_title}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Location</strong></td><td style="padding:8px;border:1px solid #ccc;">{{assessment_location}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Assessor name</strong></td><td style="padding:8px;border:1px solid #ccc;">{{assessor_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Assessor role</strong></td><td style="padding:8px;border:1px solid #ccc;">{{assessor_role}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date of assessment</strong></td><td style="padding:8px;border:1px solid #ccc;">{{date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Review date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Approved by</strong></td><td style="padding:8px;border:1px solid #ccc;">{{approved_by}}</td></tr>
</table>

<h3>Risk Rating Matrix</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;text-align:center;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;" rowspan="2">Likelihood</th>
<th style="padding:8px;border:1px solid #ccc;" colspan="5">Severity</th>
</tr>
<tr style="background:#f0f0f0;">
<th style="padding:6px;border:1px solid #ccc;">1 - Insignificant</th>
<th style="padding:6px;border:1px solid #ccc;">2 - Minor</th>
<th style="padding:6px;border:1px solid #ccc;">3 - Moderate</th>
<th style="padding:6px;border:1px solid #ccc;">4 - Major</th>
<th style="padding:6px;border:1px solid #ccc;">5 - Catastrophic</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px;border:1px solid #ccc;background:#f0f0f0;"><strong>5 - Almost certain</strong></td><td style="padding:6px;border:1px solid #ccc;background:#fff3cd;">5</td><td style="padding:6px;border:1px solid #ccc;background:#ffc107;">10</td><td style="padding:6px;border:1px solid #ccc;background:#ff9800;">15</td><td style="padding:6px;border:1px solid #ccc;background:#f44336;color:#fff;">20</td><td style="padding:6px;border:1px solid #ccc;background:#b71c1c;color:#fff;">25</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;background:#f0f0f0;"><strong>4 - Likely</strong></td><td style="padding:6px;border:1px solid #ccc;background:#c8e6c9;">4</td><td style="padding:6px;border:1px solid #ccc;background:#fff3cd;">8</td><td style="padding:6px;border:1px solid #ccc;background:#ffc107;">12</td><td style="padding:6px;border:1px solid #ccc;background:#ff9800;">16</td><td style="padding:6px;border:1px solid #ccc;background:#f44336;color:#fff;">20</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;background:#f0f0f0;"><strong>3 - Possible</strong></td><td style="padding:6px;border:1px solid #ccc;background:#c8e6c9;">3</td><td style="padding:6px;border:1px solid #ccc;background:#c8e6c9;">6</td><td style="padding:6px;border:1px solid #ccc;background:#fff3cd;">9</td><td style="padding:6px;border:1px solid #ccc;background:#ffc107;">12</td><td style="padding:6px;border:1px solid #ccc;background:#ff9800;">15</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;background:#f0f0f0;"><strong>2 - Unlikely</strong></td><td style="padding:6px;border:1px solid #ccc;background:#c8e6c9;">2</td><td style="padding:6px;border:1px solid #ccc;background:#c8e6c9;">4</td><td style="padding:6px;border:1px solid #ccc;background:#c8e6c9;">6</td><td style="padding:6px;border:1px solid #ccc;background:#fff3cd;">8</td><td style="padding:6px;border:1px solid #ccc;background:#ffc107;">10</td></tr>
<tr><td style="padding:6px;border:1px solid #ccc;background:#f0f0f0;"><strong>1 - Rare</strong></td><td style="padding:6px;border:1px solid #ccc;background:#c8e6c9;">1</td><td style="padding:6px;border:1px solid #ccc;background:#c8e6c9;">2</td><td style="padding:6px;border:1px solid #ccc;background:#c8e6c9;">3</td><td style="padding:6px;border:1px solid #ccc;background:#c8e6c9;">4</td><td style="padding:6px;border:1px solid #ccc;background:#fff3cd;">5</td></tr>
</tbody>
</table>
<p><strong>Risk levels:</strong> <span style="background:#c8e6c9;padding:2px 8px;">1-6 Low</span> <span style="background:#fff3cd;padding:2px 8px;">7-9 Medium</span> <span style="background:#ffc107;padding:2px 8px;">10-12 High</span> <span style="background:#f44336;color:#fff;padding:2px 8px;">13-25 Very High</span></p>

<h3>Risk Assessment</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;width:5%;">No.</th>
<th style="padding:8px;border:1px solid #ccc;width:20%;">Hazard</th>
<th style="padding:8px;border:1px solid #ccc;width:15%;">Who Might Be Harmed and How</th>
<th style="padding:8px;border:1px solid #ccc;width:25%;">Existing Control Measures</th>
<th style="padding:8px;border:1px solid #ccc;width:10%;">Risk Rating (L x S = R)</th>
<th style="padding:8px;border:1px solid #ccc;width:25%;">Additional Controls Needed</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">1</td><td style="padding:8px;border:1px solid #ccc;">{{hazard_1}}</td><td style="padding:8px;border:1px solid #ccc;">{{who_harmed_1}}</td><td style="padding:8px;border:1px solid #ccc;">{{controls_1}}</td><td style="padding:8px;border:1px solid #ccc;">{{risk_rating_1}}</td><td style="padding:8px;border:1px solid #ccc;">{{additional_1}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">2</td><td style="padding:8px;border:1px solid #ccc;">{{hazard_2}}</td><td style="padding:8px;border:1px solid #ccc;">{{who_harmed_2}}</td><td style="padding:8px;border:1px solid #ccc;">{{controls_2}}</td><td style="padding:8px;border:1px solid #ccc;">{{risk_rating_2}}</td><td style="padding:8px;border:1px solid #ccc;">{{additional_2}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">3</td><td style="padding:8px;border:1px solid #ccc;">{{hazard_3}}</td><td style="padding:8px;border:1px solid #ccc;">{{who_harmed_3}}</td><td style="padding:8px;border:1px solid #ccc;">{{controls_3}}</td><td style="padding:8px;border:1px solid #ccc;">{{risk_rating_3}}</td><td style="padding:8px;border:1px solid #ccc;">{{additional_3}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">4</td><td style="padding:8px;border:1px solid #ccc;">{{hazard_4}}</td><td style="padding:8px;border:1px solid #ccc;">{{who_harmed_4}}</td><td style="padding:8px;border:1px solid #ccc;">{{controls_4}}</td><td style="padding:8px;border:1px solid #ccc;">{{risk_rating_4}}</td><td style="padding:8px;border:1px solid #ccc;">{{additional_4}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">5</td><td style="padding:8px;border:1px solid #ccc;">{{hazard_5}}</td><td style="padding:8px;border:1px solid #ccc;">{{who_harmed_5}}</td><td style="padding:8px;border:1px solid #ccc;">{{controls_5}}</td><td style="padding:8px;border:1px solid #ccc;">{{risk_rating_5}}</td><td style="padding:8px;border:1px solid #ccc;">{{additional_5}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">6</td><td style="padding:8px;border:1px solid #ccc;">{{hazard_6}}</td><td style="padding:8px;border:1px solid #ccc;">{{who_harmed_6}}</td><td style="padding:8px;border:1px solid #ccc;">{{controls_6}}</td><td style="padding:8px;border:1px solid #ccc;">{{risk_rating_6}}</td><td style="padding:8px;border:1px solid #ccc;">{{additional_6}}</td></tr>
</tbody>
</table>
<p><em>Add additional rows as needed. Continue numbering sequentially.</em></p>

<h3>Guidance Notes</h3>
<ul>
<li><strong>Hazard:</strong> Something with the potential to cause harm (e.g., wet floor, trailing cables, sharp equipment, chemicals, working at height)</li>
<li><strong>Who might be harmed:</strong> Identify specific groups (e.g., pupils, staff, visitors, contractors, cleaners, pupils with SEND) and how they might be harmed</li>
<li><strong>Existing controls:</strong> What measures are already in place to reduce the risk (e.g., training, warning signs, PPE, procedures, supervision, maintenance schedules)</li>
<li><strong>Risk rating:</strong> Multiply Likelihood (1-5) by Severity (1-5). A rating of 13+ requires immediate action. A rating of 10-12 requires action within a defined timescale. All risks should be reduced to as low as reasonably practicable (ALARP).</li>
<li><strong>Additional controls:</strong> Further measures needed to reduce the risk, with a named person responsible and a target date for implementation</li>
</ul>

<h3>Review Record</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Review Date</th>
<th style="padding:8px;border:1px solid #ccc;">Reviewed By</th>
<th style="padding:8px;border:1px solid #ccc;">Changes Made</th>
<th style="padding:8px;border:1px solid #ccc;">Next Review Due</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td><td style="padding:8px;border:1px solid #ccc;">{{assessor_name}}</td><td style="padding:8px;border:1px solid #ccc;">Initial assessment</td><td style="padding:8px;border:1px solid #ccc;">{{next_review_date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td></tr>
</tbody>
</table>

<p style="margin-top:20px;font-size:0.9em;color:#666;">Risk assessments must be reviewed: annually as a minimum; following any accident or near-miss; when the activity, equipment, or environment changes; or when new information becomes available. Completed assessments are retained for the life of the activity plus 3 years.</p>'
),

-- ============================================================
-- 8. ACCIDENT/INCIDENT & RIDDOR REPORT FORM
-- ============================================================
(
  gen_random_uuid(),
  'generic_doc',
  'Accident/Incident and RIDDOR Report Form',
  'Comprehensive accident and incident reporting form covering injured person details, incident description, witnesses, first aid given, RIDDOR reportability assessment, insurer notification, and preventive actions. Aligned with RIDDOR 2013 and Social Security (Claims and Payments) Regulations 1979 Reg.25.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Health and Safety Advice for Schools',
  'Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013 / Social Security (Claims and Payments) Regulations 1979 Reg.25',
  '{"required_fields": ["school_name", "date"], "optional_fields": ["hs_coordinator", "headteacher_name"]}',
  '<h1>Accident / Incident Report Form</h1>
<h2>{{school_name}}</h2>

<h3>Section A: Injured / Affected Person Details</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Full name</strong></td><td style="padding:8px;border:1px solid #ccc;">{{injured_person_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date of birth</strong></td><td style="padding:8px;border:1px solid #ccc;">{{injured_person_dob}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Status</strong></td><td style="padding:8px;border:1px solid #ccc;">
&#9744; Pupil&emsp;&#9744; Employee&emsp;&#9744; Visitor&emsp;&#9744; Contractor&emsp;&#9744; Volunteer&emsp;&#9744; Other
</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Year group / class (if pupil)</strong></td><td style="padding:8px;border:1px solid #ccc;">{{year_group}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Job title (if employee)</strong></td><td style="padding:8px;border:1px solid #ccc;">{{job_title}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Home address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{injured_person_address}}</td></tr>
</table>

<h3>Section B: Incident Details</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Date of incident</strong></td><td style="padding:8px;border:1px solid #ccc;">{{incident_date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Time of incident</strong></td><td style="padding:8px;border:1px solid #ccc;">{{incident_time}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Exact location</strong></td><td style="padding:8px;border:1px solid #ccc;">{{incident_location}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Activity at time of incident</strong></td><td style="padding:8px;border:1px solid #ccc;">{{activity_at_time}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Supervision at the time</strong></td><td style="padding:8px;border:1px solid #ccc;">{{supervision_details}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Type of incident</strong></td><td style="padding:8px;border:1px solid #ccc;">
&#9744; Slip / trip / fall&emsp;&#9744; Fall from height&emsp;&#9744; Struck by object<br/>
&#9744; Struck against object&emsp;&#9744; Manual handling&emsp;&#9744; Burns / scalds<br/>
&#9744; Contact with chemical&emsp;&#9744; Collision between persons&emsp;&#9744; Sporting injury<br/>
&#9744; Violence / aggression&emsp;&#9744; Road traffic accident&emsp;&#9744; Ill health<br/>
&#9744; Near miss (no injury)&emsp;&#9744; Dangerous occurrence&emsp;&#9744; Other
</td></tr>
</table>

<h3>Description of Incident</h3>
<p><em>Describe exactly what happened, including the sequence of events leading up to the incident. Be factual and specific.</em></p>
<div style="border:1px solid #ccc;min-height:150px;padding:12px;margin:15px 0;">{{incident_description}}</div>

<h3>Injury Details</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Nature of injury</strong></td><td style="padding:8px;border:1px solid #ccc;">{{injury_nature}} (e.g., cut, bruise, fracture, burn, sprain, concussion)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Body part(s) affected</strong></td><td style="padding:8px;border:1px solid #ccc;">{{body_part_affected}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Severity</strong></td><td style="padding:8px;border:1px solid #ccc;">&#9744; Minor (first aid only)&emsp;&#9744; Moderate (medical attention)&emsp;&#9744; Major (hospital treatment)&emsp;&#9744; Fatal</td></tr>
</table>

<h3>Section C: Witnesses</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Witness Name</th>
<th style="padding:8px;border:1px solid #ccc;">Role / Status</th>
<th style="padding:8px;border:1px solid #ccc;">Contact Details</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">{{witness_1_name}}</td><td style="padding:8px;border:1px solid #ccc;">{{witness_1_role}}</td><td style="padding:8px;border:1px solid #ccc;">{{witness_1_contact}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">{{witness_2_name}}</td><td style="padding:8px;border:1px solid #ccc;">{{witness_2_role}}</td><td style="padding:8px;border:1px solid #ccc;">{{witness_2_contact}}</td></tr>
</tbody>
</table>

<h3>Section D: First Aid Treatment</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Was first aid administered?</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes / No</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>First aider name</strong></td><td style="padding:8px;border:1px solid #ccc;">{{first_aider_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Treatment given</strong></td><td style="padding:8px;border:1px solid #ccc;">{{treatment_given}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Was the person taken to hospital?</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes / No — Hospital name: {{hospital_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Was an ambulance called?</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes / No</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Were parents/carers notified? (if pupil)</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes / No — Time notified: {{parent_notified_time}}</td></tr>
</table>

<h3>Section E: RIDDOR Assessment</h3>
<p style="background:#fff3cd;padding:12px;border:1px solid #ffc107;border-radius:4px;">Under the <strong>Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013 (RIDDOR)</strong>, certain incidents must be reported to the Health and Safety Executive (HSE). The H&amp;S Coordinator must assess whether this incident is RIDDOR-reportable.</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Is this incident RIDDOR-reportable?</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes / No / Under review</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>If yes, RIDDOR category</strong></td><td style="padding:8px;border:1px solid #ccc;">
&#9744; Death of any person<br/>
&#9744; Specified injury to a worker (fracture other than fingers/toes, amputation, loss of sight, crush injury, burn requiring hospital treatment, scalping, loss of consciousness, acute illness requiring medical treatment, hypothermia/heat illness/unconsciousness requiring resuscitation)<br/>
&#9744; Over-7-day incapacitation of a worker (not at work for more than 7 consecutive days, not counting day of accident)<br/>
&#9744; Non-fatal accident to a non-worker (pupil/visitor) taken directly to hospital for treatment<br/>
&#9744; Dangerous occurrence (collapse of scaffold, explosion, electrical short circuit causing fire, release of biological agent, etc.)<br/>
&#9744; Occupational disease (carpal tunnel, occupational dermatitis, occupational asthma, etc.)
</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date reported to HSE</strong></td><td style="padding:8px;border:1px solid #ccc;">{{riddor_report_date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>HSE reference number</strong></td><td style="padding:8px;border:1px solid #ccc;">{{riddor_reference}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Employer''s liability insurer notified?</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes / No / Not applicable — Date: {{insurer_notified_date}}</td></tr>
</table>

<h3>Section F: Investigation and Preventive Actions</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Investigated by</strong></td><td style="padding:8px;border:1px solid #ccc;">{{investigator_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Root cause(s)</strong></td><td style="padding:8px;border:1px solid #ccc;">{{root_causes}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Lessons learned</strong></td><td style="padding:8px;border:1px solid #ccc;">{{lessons_learned}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Preventive actions</strong></td><td style="padding:8px;border:1px solid #ccc;">{{preventive_actions}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Responsible person</strong></td><td style="padding:8px;border:1px solid #ccc;">{{responsible_person}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Target completion date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{action_target_date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Risk assessment updated?</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes / No — Date: {{ra_updated_date}}</td></tr>
</table>

<h3>Section G: Form Completion</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Form completed by</strong></td><td style="padding:8px;border:1px solid #ccc;">{{completed_by}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Signature</strong></td><td style="padding:8px;border:1px solid #ccc;height:30px;"></td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Reviewed by headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}} — Date: {{headteacher_review_date}}</td></tr>
</table>

<p style="margin-top:20px;font-size:0.9em;color:#666;">Retention: accident records must be retained for a minimum of 3 years from the date of entry (Reg.25, Social Security (Claims and Payments) Regulations 1979). For incidents involving children, retain until DOB + 25 years. RIDDOR records are retained for a minimum of 3 years.</p>'
),

-- ============================================================
-- 9. FIRE RISK ASSESSMENT
-- ============================================================
(
  gen_random_uuid(),
  'generic_doc',
  'Fire Risk Assessment',
  'Comprehensive fire risk assessment template aligned with the Regulatory Reform (Fire Safety) Order 2005. Covers premises description, fire hazards, people at risk, existing fire safety measures, fire procedures, maintenance schedule, staff training, PEEPs, and action plan.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Fire Safety in New and Existing School Buildings',
  'Regulatory Reform (Fire Safety) Order 2005 / HM Government Fire Safety Risk Assessment: Educational Premises',
  '{"required_fields": ["school_name", "school_address", "headteacher_name", "date"], "optional_fields": ["fire_marshal", "hs_coordinator", "site_manager", "fire_alarm_provider", "local_fire_station"]}',
  '<h1>Fire Risk Assessment</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Responsible Person (Article 3, RRFSO)</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}} (Headteacher)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Assessment carried out by</strong></td><td style="padding:8px;border:1px solid #ccc;">{{assessor_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date of assessment</strong></td><td style="padding:8px;border:1px solid #ccc;">{{date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Review date</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Premises Description</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Building type and construction</strong></td><td style="padding:8px;border:1px solid #ccc;">{{building_type}} (e.g., Victorian brick, 1960s steel-frame, modern timber-frame, modular, mixed)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Number of storeys</strong></td><td style="padding:8px;border:1px solid #ccc;">{{number_of_storeys}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Number of classrooms / teaching spaces</strong></td><td style="padding:8px;border:1px solid #ccc;">{{number_of_classrooms}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Maximum occupancy</strong></td><td style="padding:8px;border:1px solid #ccc;">Pupils: {{max_pupils}} | Staff: {{max_staff}} | Total: {{max_occupancy}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Operating hours</strong></td><td style="padding:8px;border:1px solid #ccc;">{{operating_hours}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Out-of-hours use</strong></td><td style="padding:8px;border:1px solid #ccc;">{{out_of_hours_use}} (e.g., after-school clubs, lettings, breakfast club)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Sleeping accommodation</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes / No (if residential)</td></tr>
</table>

<h2>2. Fire Hazards Identified</h2>

<h3>2.1 Sources of Ignition</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Source</th>
<th style="padding:8px;border:1px solid #ccc;">Present?</th>
<th style="padding:8px;border:1px solid #ccc;">Location</th>
<th style="padding:8px;border:1px solid #ccc;">Controls in Place</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Electrical equipment and installations</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_electrical}}</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_electrical_location}}</td><td style="padding:8px;border:1px solid #ccc;">PAT testing, EICR, no overloaded sockets, no daisy-chaining</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Heating systems (boilers, radiators)</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_heating}}</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_heating_location}}</td><td style="padding:8px;border:1px solid #ccc;">Annual gas safety inspection, boiler room locked, no storage near boiler</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Cooking equipment (kitchen, food tech)</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_cooking}}</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_cooking_location}}</td><td style="padding:8px;border:1px solid #ccc;">Extraction system maintained, fire blanket, supervision</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Science labs (Bunsen burners, chemicals)</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_science}}</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_science_location}}</td><td style="padding:8px;border:1px solid #ccc;">CLEAPSS guidance followed, gas isolation, supervision</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Design and Technology (workshop machinery)</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_dt}}</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_dt_location}}</td><td style="padding:8px;border:1px solid #ccc;">Dust extraction, flammable materials stored correctly</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Arson / deliberate ignition</td><td style="padding:8px;border:1px solid #ccc;">Risk assessed</td><td style="padding:8px;border:1px solid #ccc;">External</td><td style="padding:8px;border:1px solid #ccc;">CCTV, secure perimeter, bins away from buildings, security lighting</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Smoking materials</td><td style="padding:8px;border:1px solid #ccc;">{{ignition_smoking}}</td><td style="padding:8px;border:1px solid #ccc;">N/A</td><td style="padding:8px;border:1px solid #ccc;">No smoking policy on entire site</td></tr>
</tbody>
</table>

<h3>2.2 Sources of Fuel</h3>
<ul>
<li>Paper, card, display materials, books, textiles</li>
<li>Furniture (desks, chairs, soft furnishings)</li>
<li>Cleaning products and chemicals (stored in locked COSHH cupboard)</li>
<li>Gas supply (mains gas to boiler room and kitchen/food technology)</li>
<li>Waste materials (internal bins emptied daily; external bins located away from buildings)</li>
<li>Flammable liquids/solids in science/DT departments (stored in flameproof cabinets per CLEAPSS/COSHH requirements)</li>
</ul>

<h3>2.3 Sources of Oxygen</h3>
<p>Natural ventilation (doors, windows, vents). Mechanical ventilation in kitchen and some areas. No specific oxygen enrichment concerns identified unless medical oxygen is stored on site for pupils with medical needs (if so, location noted and additional controls in place).</p>

<h2>3. People at Risk</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Group</th>
<th style="padding:8px;border:1px solid #ccc;">Specific Risks / Considerations</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">Pupils (general)</td><td style="padding:8px;border:1px solid #ccc;">Young age (especially EYFS — may not understand fire alarms), large numbers, unfamiliar visitors</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Pupils with SEND / mobility impairment</td><td style="padding:8px;border:1px solid #ccc;">May need assistance to evacuate; PEEPs required; consider wheelchair users, sensory impairment, autism (may be distressed by alarms)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">EYFS children</td><td style="padding:8px;border:1px solid #ccc;">Higher staff ratio needed during evacuation; sleeping children; nappy changing areas</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Staff</td><td style="padding:8px;border:1px solid #ccc;">Including new staff, supply teachers (may not know evacuation routes), staff with disabilities</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Visitors and parents</td><td style="padding:8px;border:1px solid #ccc;">Unfamiliar with building layout; visitor sign-in book used for roll call</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Contractors</td><td style="padding:8px;border:1px solid #ccc;">May be working in isolated areas; briefed on fire procedures at sign-in</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Kitchen / catering staff</td><td style="padding:8px;border:1px solid #ccc;">Higher fire risk area; may be in noisy environment and not hear alarm immediately</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">Lone workers (e.g., site manager)</td><td style="padding:8px;border:1px solid #ccc;">May be working alone outside school hours; separate lone worker procedure</td></tr>
</tbody>
</table>

<h2>4. Existing Fire Safety Measures</h2>

<h3>4.1 Detection and Warning</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:40%;"><strong>Fire detection system type</strong></td><td style="padding:8px;border:1px solid #ccc;">{{detection_system_type}} (e.g., L1, L2, L3, M, P1, P2 per BS 5839)</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Detector types</strong></td><td style="padding:8px;border:1px solid #ccc;">Smoke detectors, heat detectors, manual call points</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Weekly testing</strong></td><td style="padding:8px;border:1px solid #ccc;">Yes — Day: {{weekly_test_day}} — Different call point each week</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Annual service</strong></td><td style="padding:8px;border:1px solid #ccc;">Contractor: {{fire_alarm_provider}} — Last serviced: {{last_service_date}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Visual alarm (for hearing-impaired)</strong></td><td style="padding:8px;border:1px solid #ccc;">{{visual_alarm}}</td></tr>
</table>

<h3>4.2 Escape Routes</h3>
<ul>
<li>Number of escape routes: {{number_escape_routes}}</li>
<li>All escape routes are signed with photoluminescent signage to BS 5499</li>
<li>Escape routes are checked daily (part of site manager opening-up procedure) to ensure they are clear and unobstructed</li>
<li>Fire doors are maintained and not wedged open (except those on hold-open devices linked to the fire alarm)</li>
<li>External escape routes lead to the assembly point(s): {{assembly_point}}</li>
</ul>

<h3>4.3 Emergency Lighting</h3>
<ul>
<li>Emergency lighting is installed in all escape routes, stairwells, and areas without natural light</li>
<li>Monthly flick test by site manager; annual 3-hour duration test by competent contractor</li>
<li>Last tested: {{emergency_lighting_last_test}}</li>
</ul>

<h3>4.4 Fire Fighting Equipment</h3>
<ul>
<li>Fire extinguishers are located throughout the building (water, CO2, foam, fire blankets as appropriate)</li>
<li>Extinguishers are inspected annually by a competent contractor and commissioning date recorded</li>
<li>A fire blanket is located in each kitchen and food technology room</li>
<li>Staff are trained in the use of fire extinguishers (training is offered, not mandatory — priority is evacuation)</li>
</ul>

<h3>4.5 Fire Signage</h3>
<ul>
<li>Fire action notices are displayed at every manual call point and in every classroom/office</li>
<li>Fire exit signs are illuminated or photoluminescent</li>
<li>Fire assembly point signage is in place at: {{assembly_point}}</li>
</ul>

<h2>5. Fire Procedures</h2>
<ul>
<li>Fire evacuation procedures are displayed in every room and communicated to all staff, pupils, and visitors</li>
<li>Fire drills are conducted <strong>at least once per term</strong> (minimum 3 per year), with at least one in the first two weeks of the autumn term for new pupils and staff</li>
<li>Drill records include: date, time, evacuation time, number of people evacuated, issues identified, and corrective actions</li>
<li>Roll call is taken at the assembly point using class registers and the visitor sign-in book</li>
</ul>

<h3>Fire Drill Record</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">Date</th>
<th style="padding:8px;border:1px solid #ccc;">Time</th>
<th style="padding:8px;border:1px solid #ccc;">Evacuation Time</th>
<th style="padding:8px;border:1px solid #ccc;">Persons Evacuated</th>
<th style="padding:8px;border:1px solid #ccc;">Issues / Comments</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td><td style="padding:8px;border:1px solid #ccc;"></td></tr>
</tbody>
</table>

<h2>6. Personal Emergency Evacuation Plans (PEEPs)</h2>
<p>A PEEP is required for any person who may have difficulty evacuating the building unaided, including:</p>
<ul>
<li>Wheelchair users or persons with mobility impairment</li>
<li>Persons with visual or hearing impairment</li>
<li>Persons with cognitive or learning disabilities who may need additional support</li>
<li>Pregnant staff members (reviewed as pregnancy progresses)</li>
<li>Persons with temporary mobility issues (e.g., broken leg)</li>
</ul>
<p>PEEPs are developed individually, shared with the person and relevant staff, reviewed regularly, and stored securely.</p>

<h2>7. Action Plan</h2>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<thead>
<tr style="background:#f0f0f0;">
<th style="padding:8px;border:1px solid #ccc;">No.</th>
<th style="padding:8px;border:1px solid #ccc;">Finding / Deficiency</th>
<th style="padding:8px;border:1px solid #ccc;">Risk Level</th>
<th style="padding:8px;border:1px solid #ccc;">Action Required</th>
<th style="padding:8px;border:1px solid #ccc;">Responsible Person</th>
<th style="padding:8px;border:1px solid #ccc;">Target Date</th>
<th style="padding:8px;border:1px solid #ccc;">Completed</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:8px;border:1px solid #ccc;">1</td><td style="padding:8px;border:1px solid #ccc;">{{finding_1}}</td><td style="padding:8px;border:1px solid #ccc;">{{risk_1}}</td><td style="padding:8px;border:1px solid #ccc;">{{action_1}}</td><td style="padding:8px;border:1px solid #ccc;">{{responsible_1}}</td><td style="padding:8px;border:1px solid #ccc;">{{target_1}}</td><td style="padding:8px;border:1px solid #ccc;"></td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">2</td><td style="padding:8px;border:1px solid #ccc;">{{finding_2}}</td><td style="padding:8px;border:1px solid #ccc;">{{risk_2}}</td><td style="padding:8px;border:1px solid #ccc;">{{action_2}}</td><td style="padding:8px;border:1px solid #ccc;">{{responsible_2}}</td><td style="padding:8px;border:1px solid #ccc;">{{target_2}}</td><td style="padding:8px;border:1px solid #ccc;"></td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;">3</td><td style="padding:8px;border:1px solid #ccc;">{{finding_3}}</td><td style="padding:8px;border:1px solid #ccc;">{{risk_3}}</td><td style="padding:8px;border:1px solid #ccc;">{{action_3}}</td><td style="padding:8px;border:1px solid #ccc;">{{responsible_3}}</td><td style="padding:8px;border:1px solid #ccc;">{{target_3}}</td><td style="padding:8px;border:1px solid #ccc;"></td></tr>
</tbody>
</table>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Assessment date: {{date}} | Review: annually, after any significant change to premises, occupancy, or following a fire incident. The responsible person must ensure this assessment remains current.</p>'
),

-- ============================================================
-- 10. STAFF CODE OF CONDUCT
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'Staff Code of Conduct',
  'Comprehensive staff code of conduct covering professional boundaries, relationships with pupils, communication (including social media), physical contact, transporting pupils, photography, and reporting concerns. Aligned with KCSIE 2024 and Guidance for Safer Working Practice 2022.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'Keeping Children Safe in Education 2024',
  'KCSIE 2024 / Guidance for Safer Working Practice (Safer Recruitment Consortium) 2022',
  '{"required_fields": ["school_name", "headteacher_name", "dsl_name", "review_date"], "optional_fields": ["chair_of_governors", "hr_contact", "school_email"]}',
  '<h1>Staff Code of Conduct</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date Adopted</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Introduction</h2>
<p>This code of conduct applies to all staff, volunteers, governors, and contractors at {{school_name}} (''the school''). It sets the expectations for professional behaviour and is designed to help protect children and reduce the risk of allegations being made against adults. It should be read alongside:</p>
<ul>
<li><strong>Keeping Children Safe in Education 2024 (KCSIE)</strong></li>
<li><strong>Guidance for Safer Working Practice for Those Working with Children and Young People in Education Settings (Safer Recruitment Consortium, 2022)</strong></li>
<li>The school''s Safeguarding and Child Protection Policy</li>
<li>The school''s Whistleblowing Policy</li>
<li>The school''s Online Safety / Acceptable Use Policy</li>
<li>The school''s Behaviour Policy</li>
</ul>
<p>All staff must read this code at induction and sign to confirm their understanding. Breaches of this code may result in disciplinary action, which could include dismissal. Serious breaches may also be reported to the DBS, TRA, and/or the police.</p>

<h2>2. Professional Boundaries</h2>
<ul>
<li>Staff must maintain professional boundaries with pupils at all times, both within and outside the school setting</li>
<li>Staff must not develop ''special'' relationships with individual children that could be perceived as favouritism or grooming</li>
<li>Staff should ensure that their behaviour does not give rise to comment or speculation — the actions of adults should be transparent and above reproach</li>
<li>Adults should not rely on their good name or reputation to protect them; they should always operate within the established guidelines</li>
</ul>

<h2>3. Relationships with Pupils</h2>
<ul>
<li>Staff must not engage in any form of relationship with a pupil that is (or could be perceived as) sexual, romantic, or otherwise inappropriate</li>
<li>The Sexual Offences Act 2003, s.16-19, makes it a criminal offence for a person in a position of trust (including teachers and school staff) to engage in sexual activity with a young person under 18 in their care, even where the young person is over the age of consent</li>
<li>Staff must not socialise with pupils outside the school context (e.g., invite them to their home, meet them in social settings) unless in an officially organised school activity</li>
<li>Former pupils: Staff should exercise caution and professional judgement regarding contact with former pupils, particularly where those individuals are under 18</li>
</ul>

<h2>4. Communication (Including Social Media and Personal Devices)</h2>
<ul>
<li>Staff must <strong>not</strong> communicate with pupils using personal email accounts, personal phones (calls, texts, messaging apps), or personal social media accounts</li>
<li>All communication with pupils must be through official school channels (school email, school phone, school-approved platforms such as Class Dojo, Seesaw, Google Classroom, Microsoft Teams)</li>
<li>Staff must not accept pupils (or former pupils under 18) as contacts/friends on personal social media accounts</li>
<li>Staff should review their social media privacy settings to ensure pupils and parents cannot access personal content</li>
<li>Staff must not post photographs or videos of pupils on personal social media accounts</li>
<li>Where parents are known socially (e.g., personal friendships that predate employment), staff should declare this to the headteacher and ensure that professional boundaries are maintained</li>
<li>Staff must not use personal devices to photograph, video, or record pupils unless authorised by the headteacher and for a specific school purpose, using a school-owned device or with images immediately transferred to school systems and deleted from the personal device</li>
</ul>

<h2>5. Dress Code</h2>
<p>Staff should dress in a manner that is professional, appropriate to their role, and which is not likely to be viewed as offensive, revealing, or sexually provocative. Clothing should not distract, embarrass, or offend. Staff working in PE, outdoor education, or practical subjects may dress appropriately for their activity.</p>

<h2>6. Gifts</h2>
<ul>
<li>Staff must not give gifts to individual pupils or receive personal gifts from pupils or parents that could be perceived as a bribe or an attempt to build an inappropriate relationship</li>
<li>Small tokens at the end of term (e.g., stickers, class prizes, book vouchers) given openly as part of a reward system are acceptable</li>
<li>Any gift received from a pupil or parent above a nominal value (guidance: over &pound;10) should be declared to the headteacher</li>
</ul>

<h2>7. Physical Contact</h2>
<ul>
<li>Physical contact with pupils should be appropriate, proportionate, and in response to the pupil''s needs, not the adult''s</li>
<li><strong>Acceptable physical contact may include:</strong> comforting a distressed young child (with consideration of the child''s age and understanding), first aid, restraint to prevent injury (in accordance with the school''s Positive Handling Policy and DfE ''Use of Reasonable Force'' guidance), assisting with intimate/personal care (EYFS/SEND), PE and sports coaching</li>
<li>Staff should be aware that physical contact may be misinterpreted, and should consider the location, the presence of others, the age of the child, and whether the child has given consent</li>
<li>Staff must never use physical force as a punishment</li>
<li>Any use of physical intervention/restraint must be recorded and reported to the headteacher</li>
</ul>

<h2>8. Intimate and Personal Care</h2>
<ul>
<li>Where intimate or personal care is required (e.g., toileting, changing for EYFS or pupils with SEND), a care plan should be in place</li>
<li>Care should be carried out with sensitivity and respect for the child''s dignity and privacy</li>
<li>Staff should ensure another adult is aware that intimate care is being provided</li>
<li>Parents/carers should be informed of the school''s intimate care arrangements</li>
</ul>

<h2>9. One-to-One Situations</h2>
<ul>
<li>Staff should avoid being alone with a child in a room with the door closed or in an area that is not visible to others</li>
<li>Where one-to-one tuition, counselling, or meetings are necessary, staff should ensure that the door is left open, a glass panel is present, or that another adult is informed</li>
<li>Staff should avoid arranging to be alone with a child away from the school premises</li>
</ul>

<h2>10. Transporting Pupils</h2>
<ul>
<li>Staff should not transport pupils in their personal vehicle unless authorised by the headteacher, insured for business use, and with parental consent</li>
<li>Where transport is necessary, another adult should ideally be present in the vehicle</li>
<li>The pupil should sit in the rear of the vehicle</li>
<li>A record should be kept of the journey (date, time, reason, start/end mileage)</li>
</ul>

<h2>11. Educational Visits</h2>
<ul>
<li>Staff should follow the school''s Educational Visits Policy and the guidance of the Educational Visits Coordinator (EVC)</li>
<li>Risk assessments must be completed and approved before any off-site visit</li>
<li>Appropriate staff-to-pupil ratios must be maintained</li>
<li>Staff should not be alone with a child during a residential visit unless in an emergency</li>
</ul>

<h2>12. Photography and Video</h2>
<ul>
<li>Photographs and videos of pupils may only be taken for official school purposes using school-owned equipment</li>
<li>Personal devices must not be used to photograph or film pupils, except in exceptional circumstances authorised by the headteacher</li>
<li>Images must be stored on school systems and not on personal devices or accounts</li>
<li>Parental consent must be obtained for the use of pupil images on the school website, social media, or in press/publicity</li>
</ul>

<h2>13. Confidentiality</h2>
<ul>
<li>Staff must treat all information about pupils, families, and colleagues as confidential</li>
<li>Confidential information must only be shared on a ''need-to-know'' basis or where safeguarding concerns require disclosure</li>
<li>Staff must follow the school''s data protection policies (UK GDPR/DPA 2018)</li>
<li>Confidentiality must never prevent the reporting of safeguarding concerns</li>
</ul>

<h2>14. Declaration of Relationships</h2>
<p>Staff must declare to the headteacher any relationship they have with a pupil''s family member that could be perceived as a conflict of interest (e.g., family relationships, close friendships, romantic relationships). This is to protect both the member of staff and the child.</p>

<h2>15. Reporting Concerns</h2>
<ul>
<li>Staff must report any concerns about a child to the DSL ({{dsl_name}}) immediately — see the school''s Safeguarding and Child Protection Policy</li>
<li>Staff must report any concerns about the conduct of a colleague (including low-level concerns) to the headteacher — see the school''s Whistleblowing Policy</li>
<li>If a staff member receives an allegation about themselves, they should report it immediately to the headteacher and not attempt to investigate it</li>
<li>Staff who are subject to criminal investigations, charges, or convictions (including motoring offences that result in disqualification) must inform the headteacher immediately</li>
</ul>

<h2>16. Conduct Outside of Work</h2>
<p>Staff should be aware that their conduct outside of work, including online activity, could impact their suitability to work with children. Conduct that brings the school into disrepute or which could affect their professional role may result in disciplinary action. This includes (but is not limited to): criminal offences, substance misuse, inappropriate online behaviour, and association with extremist groups.</p>

<h2>17. Acknowledgement</h2>
<p>I have read and understood this Code of Conduct. I agree to abide by its requirements at all times.</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:20px 0;">
<tr><td style="padding:10px;border:1px solid #ccc;width:30%;"><strong>Name</strong></td><td style="padding:10px;border:1px solid #ccc;">{{staff_name}}</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;"><strong>Role</strong></td><td style="padding:10px;border:1px solid #ccc;">{{staff_role}}</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;"><strong>Signature</strong></td><td style="padding:10px;border:1px solid #ccc;height:40px;"></td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:10px;border:1px solid #ccc;">{{date}}</td></tr>
</table>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Date adopted: {{review_date}} | Review: annually or following changes to KCSIE or Safer Working Practice guidance</p>'
),

-- ============================================================
-- 11. COMPLAINTS PROCEDURE
-- ============================================================
(
  gen_random_uuid(),
  'policy',
  'Complaints Procedure',
  'DfE-compliant 3-stage complaints procedure covering informal resolution, formal headteacher investigation, and governor panel hearing. Includes timescales, record keeping, serial/persistent complainers, and right to escalate to Ofsted/ESFA. Aligned with DfE Best Practice Guidance 2019.',
  'all',
  'england',
  'schoolgle_core',
  1,
  true,
  'DfE Best Practice Guidance for School Complaints Procedures 2019',
  'DfE Best Practice Guidance for School Complaints Procedures 2019 / Education (Independent School Standards) Regulations 2014',
  '{"required_fields": ["school_name", "school_address", "school_email", "school_phone", "headteacher_name", "chair_of_governors", "review_date"], "optional_fields": ["trust_name", "trust_complaints_contact", "clerk_to_governors"]}',
  '<h1>Complaints Procedure</h1>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>School</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_email}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #ccc;">{{school_phone}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Headteacher</strong></td><td style="padding:8px;border:1px solid #ccc;">{{headteacher_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Chair of Governors</strong></td><td style="padding:8px;border:1px solid #ccc;">{{chair_of_governors}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date Adopted</strong></td><td style="padding:8px;border:1px solid #ccc;">{{review_date}}</td></tr>
</table>

<h2>1. Introduction</h2>
<p>{{school_name}} is committed to providing an excellent education for all pupils and maintaining positive relationships with parents, carers, and the wider community. We take all concerns and complaints seriously and aim to resolve them promptly and fairly.</p>
<p>This procedure is intended to:</p>
<ul>
<li>Be easily accessible and well publicised</li>
<li>Be simple to understand and use</li>
<li>Be impartial and non-adversarial</li>
<li>Allow swift handling with established timescales</li>
<li>Keep people informed of progress</li>
<li>Ensure a full and fair investigation</li>
<li>Respect confidentiality</li>
<li>Address all points at issue and provide an effective and prompt response</li>
</ul>
<p>This procedure complies with the <strong>DfE Best Practice Guidance for School Complaints Procedures 2019</strong> and, for academies/independent schools, the <strong>Education (Independent School Standards) Regulations 2014</strong>.</p>

<h2>2. What Can Be Complained About</h2>
<p>This procedure covers complaints about any provision of facilities or services that we provide, including but not limited to:</p>
<ul>
<li>The quality of education or teaching</li>
<li>The application of school policies</li>
<li>The behaviour of a member of staff</li>
<li>The school''s failure to follow a published procedure</li>
</ul>
<p>This procedure does <strong>not</strong> cover:</p>
<ul>
<li>Admissions decisions (covered by the Admissions Appeals process)</li>
<li>Statutory assessments of SEND (covered by the SEND Tribunal process)</li>
<li>Matters likely to require a Child Protection investigation</li>
<li>Exclusion decisions (covered by the Independent Review Panel process)</li>
<li>Whistleblowing (covered by the Whistleblowing Policy)</li>
<li>Staff grievances or disciplinary matters (covered by HR procedures)</li>
<li>Complaints about the national curriculum or collective worship (these have separate statutory procedures)</li>
</ul>

<h2>3. How to Make a Complaint</h2>
<p>Concerns and complaints can be made in person, by telephone, or in writing (letter or email). They may also be made by a third party acting on behalf of the complainant, provided that the third party has the complainant''s written consent.</p>

<h2>4. The Three Stages</h2>

<h3>Stage 1: Informal Resolution (5 school days)</h3>
<p>Most concerns can be resolved informally. The complainant should raise the matter with the relevant member of staff (e.g., class teacher, head of year, subject leader) who will try to resolve it promptly. This may involve a meeting, a phone call, or a written response.</p>
<p><strong>Timescale:</strong> The school will try to resolve informal complaints within <strong>5 school days</strong> of the concern being raised.</p>
<p>If the complainant is not satisfied with the outcome at Stage 1, or if the nature of the complaint is such that it cannot appropriately be resolved informally, the complainant may proceed to Stage 2.</p>

<h3>Stage 2: Formal Investigation by the Headteacher (10 school days)</h3>
<p>The complainant should put their complaint in writing (using the Complaint Form available from the school office or website) and send it to the headteacher at {{school_email}} or by post to {{school_address}}. The complaint should include:</p>
<ul>
<li>A clear description of the complaint</li>
<li>Details of what has already been done to try to resolve it</li>
<li>What outcome the complainant is seeking</li>
</ul>
<p>If the complaint is about the headteacher, it should be addressed to the chair of governors ({{chair_of_governors}}) via the school office, marked ''Private and Confidential''.</p>
<p>The headteacher (or chair of governors) will:</p>
<ol>
<li>Acknowledge the complaint in writing within <strong>3 school days</strong></li>
<li>Investigate the complaint, which may include reviewing records, interviewing staff and pupils, and meeting with the complainant</li>
<li>Provide a formal written response within <strong>10 school days</strong> of receiving the complaint, including the findings, a conclusion, and any actions to be taken</li>
<li>If additional time is needed (e.g., for a complex investigation), the complainant will be notified of the delay and given a revised timescale</li>
</ol>

<h3>Stage 3: Governor Panel Hearing (20 school days)</h3>
<p>If the complainant is not satisfied with the outcome at Stage 2, they may request a hearing before a panel of governors. The request must be made in writing to the Clerk to Governors within <strong>10 school days</strong> of receiving the Stage 2 response.</p>

<h4>Panel Composition</h4>
<ul>
<li>The panel will consist of <strong>3 governors</strong> who have not been previously involved in the complaint</li>
<li>One governor will be elected as chair of the panel</li>
<li>The Clerk to Governors will arrange the hearing and act as clerk to the panel</li>
</ul>

<h4>Hearing Procedure</h4>
<ol>
<li>The hearing will be convened within <strong>20 school days</strong> of the request being received</li>
<li>The complainant and the school will be given at least <strong>5 school days'' notice</strong> of the hearing date</li>
<li>Both parties may submit written evidence to the panel at least <strong>3 school days</strong> before the hearing</li>
<li>The complainant may be accompanied by a friend, relative, or advocate (but not a legal representative acting in a professional capacity, unless the school also has legal representation)</li>
<li>At the hearing:
  <ul>
  <li>The complainant presents their case</li>
  <li>The panel may ask questions of the complainant</li>
  <li>The headteacher (or representative) presents the school''s response</li>
  <li>The panel may ask questions of the headteacher</li>
  <li>Both parties may make a final statement</li>
  <li>Both parties and the clerk withdraw while the panel deliberates</li>
  </ul>
</li>
<li>The panel will make a decision and communicate it to the complainant in writing within <strong>5 school days</strong> of the hearing, including reasons for the decision and any recommendations</li>
</ol>

<h4>Possible Outcomes</h4>
<ul>
<li>Dismiss the complaint in whole or in part</li>
<li>Uphold the complaint in whole or in part</li>
<li>Recommend changes to the school''s systems or procedures to prevent a similar situation recurring</li>
</ul>
<p>The decision of the governor panel is <strong>final</strong>. There is no further right of appeal within the school.</p>

<h2>5. After the Procedure Is Completed</h2>
<p>If the complainant remains dissatisfied after completing all three stages of the procedure, they may contact:</p>
<ul>
<li><strong>Ofsted:</strong> 0300 123 1231 / ofsted.gov.uk (for maintained schools)</li>
<li><strong>Education and Skills Funding Agency (ESFA):</strong> education.gov.uk/contactus (for academies and free schools)</li>
<li><strong>Department for Education:</strong> for complaints about independent schools</li>
</ul>
<p>These bodies will normally expect the complainant to have completed the school''s own complaints procedure before they will investigate.</p>

<h2>6. Record Keeping</h2>
<p>The school will maintain a written record of all formal complaints (Stage 2 and Stage 3), including:</p>
<ul>
<li>Date the complaint was received</li>
<li>The nature of the complaint</li>
<li>Whether the complaint was resolved at the formal or panel stage</li>
<li>The actions taken as a result</li>
</ul>
<p>Records are retained for a minimum of 6 years. The governing body will review complaint records annually to identify any patterns or trends.</p>

<h2>7. Serial, Persistent, and Unreasonable Complaints</h2>
<p>The school is committed to dealing with all complaints fairly and impartially. However, the school recognises that there are occasions when a complainant may pursue their complaint in a way that is unreasonable, including:</p>
<ul>
<li>Raising the same complaint repeatedly after the procedure has been completed</li>
<li>Refusing to accept the findings of the investigation or the governor panel decision</li>
<li>Contacting the school excessively (by phone, email, letter, or in person)</li>
<li>Using abusive, threatening, or intimidating language</li>
<li>Making unreasonable demands on the school''s time and resources</li>
</ul>
<p>Where a complainant''s behaviour is considered unreasonable, the school may restrict contact (e.g., requiring written communication only, nominating a single point of contact, or limiting contact to set times). The complainant will be informed of any restrictions in writing.</p>

<p style="margin-top:30px;font-size:0.9em;color:#666;">Version 1.0 | Date adopted: {{review_date}} | Review: annually. A copy of this procedure is available from the school office and on the school website.</p>'
),

-- ============================================================
-- 12. CONSENT FORM (PARENTAL)
-- ============================================================
(
  gen_random_uuid(),
  'generic_doc',
  'Parental Consent Form (Comprehensive)',
  'Multi-purpose parental consent form with separately opt-in consent types covering photographs/video (school use and website/social media/press), educational visits, non-prescription medication, biometric data, and emergency medical treatment. Aligned with UK GDPR Article 6/9 and DPA 2018.',
  'all',
  'england',
  'schoolgle_core',
  1,
  false,
  'DfE Data Protection Toolkit for Schools',
  'UK GDPR Articles 6 and 9 / Data Protection Act 2018 Schedule 1 / Protection of Freedoms Act 2012 s.26',
  '{"required_fields": ["school_name", "academic_year"], "optional_fields": ["headteacher_name", "dpo_name", "dpo_email", "school_email"]}',
  '<h1>Parental Consent Form</h1>
<h2>{{school_name}} — Academic Year {{academic_year}}</h2>

<p>Dear Parent/Carer,</p>
<p>We are required to obtain your consent for certain activities and uses of personal data relating to your child. Please read each section carefully. Each consent type is <strong>separate</strong> — you may give or withhold consent for each one independently. Withholding consent for one activity will not affect your child''s access to any other.</p>
<p>You have the right to <strong>withdraw consent at any time</strong> by contacting the school office in writing at {{school_email}}. Withdrawal of consent will not affect the lawfulness of any processing carried out before withdrawal.</p>

<h3>Pupil Details</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Pupil''s full name</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Date of birth</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_dob}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Year group / class</strong></td><td style="padding:8px;border:1px solid #ccc;">{{child_year_group}}</td></tr>
</table>

<h3>Parent / Carer Details</h3>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:8px;border:1px solid #ccc;width:30%;"><strong>Full name</strong></td><td style="padding:8px;border:1px solid #ccc;">{{parent_name}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Relationship to child</strong></td><td style="padding:8px;border:1px solid #ccc;">{{parent_relationship}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Address</strong></td><td style="padding:8px;border:1px solid #ccc;">{{parent_address}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Contact number</strong></td><td style="padding:8px;border:1px solid #ccc;">{{parent_phone}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ccc;">{{parent_email}}</td></tr>
</table>

<hr/>

<h2>Consent Section 1: Photographs and Video — Internal School Use</h2>
<p>We would like to take photographs and/or video of your child for <strong>internal school use only</strong>, including display within the school building, school newsletters (print), school prospectus, internal training, and communication with parents (e.g., via a parent app). These images will <strong>not</strong> be published online or shared with the media.</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I GIVE consent</strong> for photographs/video of my child to be used for internal school purposes.</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I DO NOT give consent</strong> for photographs/video of my child to be used for internal school purposes.</td></tr>
</table>

<h2>Consent Section 2: Photographs and Video — Website, Social Media, and Press</h2>
<p>We would like to use photographs and/or video of your child on the <strong>school website, official school social media accounts</strong> (e.g., Twitter/X, Facebook, Instagram), and in <strong>press/media coverage</strong> of school events. Your child will not be identified by full name alongside any photograph unless you give additional specific consent at the time.</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I GIVE consent</strong> for photographs/video of my child to be used on the school website, social media, and/or in press coverage.</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I DO NOT give consent</strong> for photographs/video of my child to be used on the school website, social media, and/or in press coverage.</td></tr>
</table>

<h2>Consent Section 3: Educational Visits</h2>
<p>During the academic year, your child may participate in <strong>local educational visits</strong> within walking distance of the school (e.g., local park, library, church, shops) as part of the curriculum. We request blanket consent for these routine local visits. <strong>Separate, specific consent</strong> will be sought for visits involving transport, adventurous activities, residential visits, and overseas trips.</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I GIVE consent</strong> for my child to participate in routine local educational visits.</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I DO NOT give consent</strong> for my child to participate in routine local educational visits.</td></tr>
</table>

<h2>Consent Section 4: Administration of Non-Prescription Medication</h2>
<p>Occasionally, your child may need non-prescription medication during the school day (e.g., paracetamol for headaches, antihistamines for hay fever, cough medicine). We will only administer medication that you have sent in to school, clearly labelled with your child''s name and dosage instructions. <strong>Prescription medication</strong> (e.g., inhalers, EpiPens, prescribed antibiotics) is covered separately under the school''s Supporting Pupils with Medical Conditions Policy and does not require this consent form.</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I GIVE consent</strong> for the school to administer non-prescription medication to my child in accordance with the instructions provided.</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I DO NOT give consent</strong> for the school to administer non-prescription medication to my child.</td></tr>
</table>

<h2>Consent Section 5: Biometric Data</h2>
<p>The school uses biometric data (e.g., fingerprint or palm scan) for the following purposes: {{biometric_purposes}} (e.g., cashless catering, library management). Under <strong>Section 26 of the Protection of Freedoms Act 2012</strong>, we must obtain written consent from at least one parent before processing a child''s biometric data. Your child also has the right to refuse to provide their biometric data at any time, even if you have given consent. An alternative non-biometric method (e.g., PIN code, card) is always available.</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I GIVE consent</strong> for the school to collect and use my child''s biometric data for the purposes described above.</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I DO NOT give consent</strong> for the school to collect and use my child''s biometric data.</td></tr>
</table>

<h2>Consent Section 6: Emergency Medical Treatment</h2>
<p>In the event of a medical emergency where your child requires urgent medical treatment and you cannot be contacted, we need your consent to authorise the school to act <em>in loco parentis</em> and seek appropriate medical treatment for your child, including transport to hospital by ambulance.</p>
<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:15px 0;">
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I GIVE consent</strong> for the school to seek emergency medical treatment for my child if I cannot be contacted.</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">&#9744; <strong>I DO NOT give consent</strong> for the school to seek emergency medical treatment for my child without my prior agreement.</td></tr>
</table>

<hr/>

<h3>Data Retention</h3>
<p>This consent form is valid for the <strong>academic year {{academic_year}}</strong>. A new form will be issued at the start of each academic year. Consent forms are retained for the duration of the pupil''s time at the school plus 1 year, in accordance with the IRMS Information Management Toolkit for Schools.</p>

<h3>Declaration</h3>
<p>I confirm that I have parental responsibility for the child named above and that the information I have provided is correct. I understand that I may withdraw any consent given on this form at any time by contacting the school in writing.</p>

<table style="width:100%;border:1px solid #ccc;border-collapse:collapse;margin:20px 0;">
<tr><td style="padding:10px;border:1px solid #ccc;width:30%;"><strong>Parent/Carer name (printed)</strong></td><td style="padding:10px;border:1px solid #ccc;">{{parent_name}}</td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;"><strong>Signature</strong></td><td style="padding:10px;border:1px solid #ccc;height:40px;"></td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;"><strong>Date</strong></td><td style="padding:10px;border:1px solid #ccc;">{{date}}</td></tr>
</table>

<p style="margin-top:20px;font-size:0.9em;color:#666;">Please return this completed form to the school office. If you have any questions about this form or your data rights, please contact the school office or the Data Protection Officer: {{dpo_name}} ({{dpo_email}}).</p>'
)

ON CONFLICT DO NOTHING;
