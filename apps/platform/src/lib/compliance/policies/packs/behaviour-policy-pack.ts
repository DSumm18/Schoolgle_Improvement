import type { PolicyQualitySource } from "../policy-quality-analyser";

export type BehaviourPolicyDraftInput = {
  schoolName: string;
  schoolLogoUrl?: string;
  primaryColor?: string;
  approvalBody?: string;
  reviewCycle?: string;
  nextReviewDate?: string;
};

export type BehaviourPolicyDraft = {
  title: string;
  markdown: string;
  formattedHtml: string;
  downloadFileName: string;
  sources: PolicyQualitySource[];
  assumptions: string[];
};

export type BehaviourPolicyDraftPreview = {
  title: string;
  summary: string;
  draft: BehaviourPolicyDraft;
};

const SOURCES = [
  {
    id: "dfe-behaviour-in-schools-2024",
    title: "Behaviour in schools: advice for headteachers and school staff",
    authority: "dfe_advice",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/behaviour-in-schools--2",
    lastChecked: "2026-05-01",
  },
  {
    id: "govuk-school-behaviour-exclusions",
    title: "School behaviour and exclusions",
    authority: "govuk_advice",
    publisher: "GOV.UK",
    url: "https://www.gov.uk/school-behaviour-exclusions/school-behaviour-policy",
    lastChecked: "2026-05-01",
  },
  {
    id: "dfe-suspension-permanent-exclusion-2023",
    title:
      "Suspension and permanent exclusion from maintained schools, academies and pupil referral units in England",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/school-exclusion",
    lastChecked: "2026-05-01",
  },
  {
    id: "dfe-preventing-tackling-bullying",
    title: "Preventing and tackling bullying",
    authority: "dfe_advice",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/preventing-and-tackling-bullying",
    lastChecked: "2026-05-01",
  },
  {
    id: "equality-act-2010",
    title: "Equality Act 2010",
    authority: "legislation",
    publisher: "UK Government",
    url: "https://www.legislation.gov.uk/ukpga/2010/15/contents",
    lastChecked: "2026-05-01",
  },
  {
    id: "send-code-of-practice",
    title: "SEND code of practice: 0 to 25 years",
    authority: "statutory_guidance",
    publisher: "Department for Education / Department of Health",
    url: "https://www.gov.uk/government/publications/send-code-of-practice-0-to-25",
    lastChecked: "2026-05-01",
  },
] satisfies PolicyQualitySource[];

export const BEHAVIOUR_POLICY_PACK = {
  id: "behaviour-policy-dfe-2024",
  requirementId: "behaviour-policy",
  title: "Behaviour Policy Pack",
  version: "1.0.0",
  lastChecked: "2026-05-01",
  sources: SOURCES,
  baselineShouldScore: 100,
};

export function buildBehaviourPolicyDraft({
  schoolName,
  schoolLogoUrl,
  primaryColor = "#7c3aed",
  approvalBody = "Governing body",
  reviewCycle = "Annual",
  nextReviewDate = "1 September 2026",
}: BehaviourPolicyDraftInput): BehaviourPolicyDraft {
  const markdown = `
# Behaviour Policy

**School:** ${schoolName}
**Approval route:** ${approvalBody}
**Review cycle:** ${reviewCycle}
**Next review:** ${nextReviewDate}

## 1. Purpose and principles

${schoolName} expects all pupils to behave well, show respectful conduct and follow clear school rules. The policy supports a calm, safe and purposeful learning environment where pupils, staff, parents and governors understand the standards of behaviour expected.

## 2. Behaviour rules and expectations

Pupils are expected to follow school rules, meet the expected standard of conduct, listen to adults, show respect to others, move around school safely, care for property and contribute positively to lessons and wider school life.

## 3. Rewards, praise, consequences and sanctions

Staff use rewards and praise to recognise positive behaviour. Where behaviour falls below expectations, staff apply consequences and sanctions consistently, proportionately and fairly. Sanctions may include reminders, restorative conversations, loss of privileges, detention where age-appropriate, removal from class where necessary, and escalation to senior leaders.

## 4. Bullying prevention and response

Bullying, including anti-bullying concerns linked to protected characteristics or cyberbullying, is not tolerated. The school prevents bullying through curriculum work, supervision, pupil voice and clear reporting routes. Staff record bullying concerns, investigate them, support affected pupils, respond to pupils who have bullied and communicate with parents or carers where appropriate.

## 5. Outside-school and online behaviour

The school may respond to online behaviour, cyber incidents, off-site conduct, behaviour outside school, and behaviour to and from school where it affects pupils, staff, the reputation of the school, safety, learning or orderly conduct.

## 6. SEND, disability, equality and reasonable adjustments

The school considers SEND, SEN, disability, equality duties and individual circumstances when applying this policy. Staff make reasonable adjustments where required and consider whether behaviour may be linked to a pupil's special educational needs, disability, wellbeing, trauma or other vulnerability. Behaviour support should align with individual plans where these are in place.

## 7. Behaviour powers and interventions

Relevant behaviour powers and interventions may include detention, removal from class, searching, confiscation, and reasonable force where lawful and necessary. Staff use these powers proportionately, safely and in line with school procedures, safeguarding expectations and statutory guidance.

## 8. Suspension and permanent exclusion

Serious or persistent breaches of this policy may lead to suspension or permanent exclusion. Decisions about suspension and permanent exclusion are made by the headteacher in line with statutory guidance, taking account of evidence, context, SEND, equality duties, safeguarding and the need to maintain a safe school community.

## 9. Roles and responsibilities

The headteacher is responsible for the implementation of this policy. Staff model expected behaviour, teach routines, apply rewards and sanctions consistently and record concerns. Governors monitor the effectiveness of the policy. Pupils are expected to meet behaviour expectations. Parents and carers support the school by reinforcing expectations and working with staff.

## 10. Approval, publication and review

This policy is approved by ${approvalBody}, published or made available on the school website, and reviewed on a ${reviewCycle.toLowerCase()} basis or sooner if guidance changes. The next review is due on ${nextReviewDate}.
`.trim();
  const formattedHtml = buildFormattedPolicyHtml({
    schoolName,
    schoolLogoUrl,
    primaryColor,
    approvalBody,
    reviewCycle,
    nextReviewDate,
  });

  return {
    title: "Behaviour Policy",
    markdown,
    formattedHtml,
    downloadFileName: `${slugify(schoolName)}-behaviour-policy-draft.doc`,
    sources: SOURCES,
    assumptions: [
      "This is a school-review draft, not legal advice.",
      "Local routines, staff names and escalation thresholds should be checked before approval.",
      "The source file remains the approved policy until leaders approve and publish a replacement.",
    ],
  };
}

export function buildBehaviourPolicyDraftPreview({
  mode,
  schoolName,
  schoolLogoUrl,
  primaryColor,
  existingFileName,
  weakAreas = [],
}: {
  mode: "missing_policy" | "improve_existing";
  schoolName: string;
  schoolLogoUrl?: string;
  primaryColor?: string;
  existingFileName?: string;
  weakAreas?: string[];
}): BehaviourPolicyDraftPreview {
  const draft = buildBehaviourPolicyDraft({
    schoolName,
    schoolLogoUrl,
    primaryColor,
  });
  const title =
    mode === "missing_policy"
      ? "New Behaviour Policy draft"
      : "Improved Behaviour Policy draft";
  const summary =
    mode === "missing_policy"
      ? "Schoolgle has generated a source-backed baseline Behaviour Policy draft because no current policy was matched."
      : `Schoolgle has generated a source-backed improved draft for ${existingFileName || "the current Behaviour Policy"}${weakAreas.length ? `, focused on: ${weakAreas.join(", ")}.` : "."}`;

  return { title, summary, draft };
}

function buildFormattedPolicyHtml({
  approvalBody,
  nextReviewDate,
  primaryColor,
  reviewCycle,
  schoolLogoUrl,
  schoolName,
}: Required<Pick<BehaviourPolicyDraftInput, "approvalBody" | "nextReviewDate" | "primaryColor" | "reviewCycle" | "schoolName">> &
  Pick<BehaviourPolicyDraftInput, "schoolLogoUrl">): string {
  const escapedSchool = escapeHtml(schoolName);
  const escapedColor = escapeHtml(primaryColor);
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const sections = [
    "Purpose and principles",
    "Behaviour rules and expectations",
    "Rewards, praise, consequences and sanctions",
    "Bullying prevention and response",
    "Outside-school and online behaviour",
    "SEND, disability, equality and reasonable adjustments",
    "Behaviour powers and interventions",
    "Suspension and permanent exclusion",
    "Roles and responsibilities",
    "Approval, publication and review",
    "Standard operating procedures",
  ];
  const sopRows = [
    ["Recording a behaviour incident", "Class teacher / senior leader", "Confirm the school system used to record incidents."],
    ["Responding to bullying concerns", "DSL / behaviour lead", "Confirm investigation, parent contact and pupil support route."],
    ["Escalating serious behaviour", "Headteacher / SLT", "Confirm thresholds for SLT call-out, removal and suspension consideration."],
    ["Reintegration after suspension", "Headteacher / pastoral lead", "Confirm meeting format, support plan and monitoring period."],
    ["Applying reasonable adjustments", "SENCO / class teacher", "Confirm how individual plans are reviewed and shared with staff."],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapedSchool} Behaviour Policy</title>
  <style>
    @page { margin: 18mm 16mm 20mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef2ff;
      color: #172033;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.55;
    }
    .schoolgle-policy-page {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      background: #ffffff;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
      overflow: hidden;
    }
    .schoolgle-policy-cover {
      min-height: 297mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 28mm 24mm;
      background:
        radial-gradient(circle at 85% 18%, rgba(124, 58, 237, 0.15), transparent 30%),
        linear-gradient(135deg, #ffffff 0%, #f8fafc 65%, #f3e8ff 100%);
      border-top: 9mm solid ${escapedColor};
    }
    .logo {
      max-width: 34mm;
      max-height: 28mm;
      object-fit: contain;
      margin-bottom: 12mm;
    }
    .eyebrow {
      color: ${escapedColor};
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    h1 {
      margin: 8mm 0 3mm;
      color: #0f172a;
      font-size: 34pt;
      line-height: 1.05;
      letter-spacing: -0.04em;
    }
    .subtitle {
      max-width: 140mm;
      color: #475569;
      font-size: 13pt;
    }
    .cover-card, .note-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: rgba(255,255,255,0.86);
      padding: 8mm;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4mm;
      margin-top: 10mm;
    }
    .meta-label {
      color: #64748b;
      display: block;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .meta-value {
      color: #0f172a;
      display: block;
      font-size: 11pt;
      font-weight: 700;
      margin-top: 1mm;
    }
    .policy-body {
      padding: 18mm 20mm 20mm;
    }
    .section {
      break-inside: avoid;
      margin-bottom: 8mm;
    }
    h2 {
      border-bottom: 2px solid #e2e8f0;
      color: #0f172a;
      font-size: 18pt;
      margin: 0 0 5mm;
      padding-bottom: 2mm;
    }
    h3 {
      color: #1e293b;
      font-size: 13pt;
      margin: 6mm 0 2mm;
    }
    .contents ol {
      columns: 2;
      column-gap: 12mm;
      margin: 0;
      padding-left: 6mm;
    }
    .contents li { margin-bottom: 2mm; }
    table {
      border-collapse: collapse;
      margin: 4mm 0 7mm;
      width: 100%;
    }
    th, td {
      border: 1px solid #dbe4ef;
      padding: 3mm;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      color: #334155;
      font-size: 9pt;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .source-list {
      display: grid;
      gap: 3mm;
      margin-top: 3mm;
    }
    .source-item {
      border-left: 4px solid ${escapedColor};
      background: #f8fafc;
      padding: 3mm 4mm;
    }
    .source-title { color: #0f172a; font-weight: 700; }
    .source-meta { color: #64748b; font-size: 9pt; }
    .schoolgle-footer {
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 9pt;
      margin-top: 12mm;
      padding-top: 4mm;
    }
    @media print {
      body { background: #fff; }
      .schoolgle-policy-page {
        box-shadow: none;
        margin: 0;
        min-height: auto;
        width: auto;
      }
      .schoolgle-policy-cover { break-after: page; }
      .policy-body { padding: 0; }
    }
  </style>
</head>
<body>
  <main class="schoolgle-policy-page">
    <section class="schoolgle-policy-cover">
      <div>
        ${schoolLogoUrl ? `<img class="logo" src="${escapeHtml(schoolLogoUrl)}" alt="${escapedSchool} logo" />` : ""}
        <div class="eyebrow">Schoolgle Policy Pack</div>
        <h1>Behaviour Policy</h1>
        <p class="subtitle">${escapedSchool} — a source-backed draft policy prepared for school review, adaptation and approval.</p>
      </div>
      <div class="cover-card">
        <span class="meta-label">School</span>
        <span class="meta-value">${escapedSchool}</span>
        <div class="meta-grid">
          <div><span class="meta-label">Approval route</span><span class="meta-value">${escapeHtml(approvalBody)}</span></div>
          <div><span class="meta-label">Review cycle</span><span class="meta-value">${escapeHtml(reviewCycle)}</span></div>
          <div><span class="meta-label">Next review</span><span class="meta-value">${escapeHtml(nextReviewDate)}</span></div>
          <div><span class="meta-label">Generated</span><span class="meta-value">${escapeHtml(today)}</span></div>
        </div>
      </div>
    </section>

    <section class="policy-body">
      <div class="section note-card">
        <h2>Introduction</h2>
        <p>This draft has been prepared from Schoolgle's Behaviour Policy Pack using official and authoritative sources. It should be adapted to match local school routines, named responsibilities, behaviour systems and approval arrangements before publication.</p>
      </div>

      <div class="section contents">
        <h2>Contents</h2>
        <ol>${sections.map((section) => `<li>${escapeHtml(section)}</li>`).join("")}</ol>
      </div>

      <div class="section">
        <h2>Policy details</h2>
        <table>
          <tbody>
            <tr><th>Policy owner</th><td>Headteacher / senior leadership team</td></tr>
            <tr><th>Approval body</th><td>${escapeHtml(approvalBody)}</td></tr>
            <tr><th>Review cycle</th><td>${escapeHtml(reviewCycle)}</td></tr>
            <tr><th>Next review date</th><td>${escapeHtml(nextReviewDate)}</td></tr>
            <tr><th>Status</th><td>Draft for review</td></tr>
          </tbody>
        </table>
      </div>

      ${policySectionsHtml(escapedSchool, approvalBody, reviewCycle, nextReviewDate)}

      <div class="section">
        <h2>Standard operating procedures</h2>
        <p>The policy should be supported by short operational routines so staff know exactly what to do in common situations. Schoolgle can turn these into separate SOPs and assign owners through staff connectors.</p>
        <table>
          <thead><tr><th>SOP</th><th>Suggested owner</th><th>School adaptation needed</th></tr></thead>
          <tbody>
            ${sopRows
              .map(
                ([sop, owner, action]) =>
                  `<tr><td>${escapeHtml(sop)}</td><td>${escapeHtml(owner)}</td><td>${escapeHtml(action)}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Sources checked</h2>
        <div class="source-list">
          ${SOURCES.map(
            (source) => `<div class="source-item">
              <div class="source-title">${escapeHtml(source.title)}</div>
              <div class="source-meta">${escapeHtml(source.publisher)} · ${escapeHtml(source.authority.replace("_", " "))} · checked ${escapeHtml(source.lastChecked)}</div>
              <div class="source-meta">${escapeHtml(source.url)}</div>
            </div>`,
          ).join("")}
        </div>
      </div>

      <div class="schoolgle-footer">
        Generated by Schoolgle Policy Manager. Original Drive files remain the approved source until this draft is reviewed, approved and published.
      </div>
    </section>
  </main>
</body>
</html>`;
}

function policySectionsHtml(
  escapedSchool: string,
  approvalBody: string,
  reviewCycle: string,
  nextReviewDate: string,
): string {
  const paragraphs = [
    ["Purpose and principles", `${escapedSchool} expects all pupils to behave well, show respectful conduct and follow clear school rules. The policy supports a calm, safe and purposeful learning environment where pupils, staff, parents and governors understand the standards of behaviour expected.`],
    ["Behaviour rules and expectations", "Pupils are expected to follow school rules, meet the expected standard of conduct, listen to adults, show respect to others, move around school safely, care for property and contribute positively to lessons and wider school life."],
    ["Rewards, praise, consequences and sanctions", "Staff use rewards and praise to recognise positive behaviour. Where behaviour falls below expectations, staff apply consequences and sanctions consistently, proportionately and fairly. Sanctions may include reminders, restorative conversations, loss of privileges, detention where age-appropriate, removal from class where necessary, and escalation to senior leaders."],
    ["Bullying prevention and response", "Bullying, including anti-bullying concerns linked to protected characteristics or cyberbullying, is not tolerated. The school prevents bullying through curriculum work, supervision, pupil voice and clear reporting routes. Staff record bullying concerns, investigate them, support affected pupils, respond to pupils who have bullied and communicate with parents or carers where appropriate."],
    ["Outside-school and online behaviour", "The school may respond to online behaviour, cyber incidents, off-site conduct, behaviour outside school, and behaviour to and from school where it affects pupils, staff, the reputation of the school, safety, learning or orderly conduct."],
    ["SEND, disability, equality and reasonable adjustments", "The school considers SEND, SEN, disability, equality duties and individual circumstances when applying this policy. Staff make reasonable adjustments where required and consider whether behaviour may be linked to a pupil's special educational needs, disability, wellbeing, trauma or other vulnerability. Behaviour support should align with individual plans where these are in place."],
    ["Behaviour powers and interventions", "Relevant behaviour powers and interventions may include detention, removal from class, searching, confiscation, and reasonable force where lawful and necessary. Staff use these powers proportionately, safely and in line with school procedures, safeguarding expectations and statutory guidance."],
    ["Suspension and permanent exclusion", "Serious or persistent breaches of this policy may lead to suspension or permanent exclusion. Decisions about suspension and permanent exclusion are made by the headteacher in line with statutory guidance, taking account of evidence, context, SEND, equality duties, safeguarding and the need to maintain a safe school community."],
    ["Roles and responsibilities", "The headteacher is responsible for the implementation of this policy. Staff model expected behaviour, teach routines, apply rewards and sanctions consistently and record concerns. Governors monitor the effectiveness of the policy. Pupils are expected to meet behaviour expectations. Parents and carers support the school by reinforcing expectations and working with staff."],
    ["Approval, publication and review", `This policy is approved by ${escapeHtml(approvalBody)}, published or made available on the school website, and reviewed on a ${escapeHtml(reviewCycle.toLowerCase())} basis or sooner if guidance changes. The next review is due on ${escapeHtml(nextReviewDate)}.`],
  ];

  return paragraphs
    .map(
      ([title, body]) => `<div class="section">
        <h2>${escapeHtml(title)}</h2>
        <p>${body}</p>
      </div>`,
    )
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
