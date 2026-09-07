export interface ModuleContent {
  howEdHelps: { title: string; desc: string }[];
  typicalJobs: string[];
  whatItCovers: string[];
}

export const moduleContent: Record<string, ModuleContent> = {
  governance: {
    howEdHelps: [
      {
        title: "A clearer board conversation",
        desc: "Bring the evidence behind a question together before the meeting. Governors can focus on what it means and what leaders will do next.",
      },
      {
        title: "Actions with an owner",
        desc: "Record the decision, who is taking it forward and when the board will review it. Keep the follow-up visible between meetings.",
      },
      {
        title: "Continuity when people change",
        desc: "Keep governance records and responsibilities organised so new governors can find the context without relying on a handover conversation.",
      },
    ],
    typicalJobs: [
      "Preparing a focused board agenda",
      "Recording decisions and actions",
      "Following up governor visits",
      "Keeping training records current",
      "Reviewing policy ownership",
      "Tracking meeting follow-up",
    ],
    whatItCovers: [
      "Governor directory",
      "Meeting organisation",
      "Visit records",
      "Training records",
      "Policy review",
      "Action tracking",
    ],
  },
  teaching: {
    howEdHelps: [
      {
        title: "Start with what pupils need",
        desc: "Use assessment evidence to identify a question worth investigating. Keep the source and the limits of that evidence visible.",
      },
      {
        title: "Use research with judgement",
        desc: "Connect improvement questions to research-informed approaches. A toolkit finding starts a professional conversation; it does not prescribe what will work in your class.",
      },
      {
        title: "Keep review manageable",
        desc: "Agree what the team will try, what evidence will be useful and when to review it. Avoid collecting another spreadsheet just because you can.",
      },
    ],
    typicalJobs: [
      "Reviewing assessment evidence",
      "Planning a focused improvement action",
      "Discussing evidence in moderation",
      "Choosing research to explore",
      "Recording a review decision",
      "Connecting classroom and leadership questions",
    ],
    whatItCovers: [
      "Assessment conversations",
      "Evidence-informed planning",
      "Moderation context",
      "Improvement actions",
      "Review and reflection",
      "Teacher-approved decisions",
    ],
  },
  improvement: {
    howEdHelps: [
      {
        title: "Evidence Discovery",
        desc: "Review evidence from school-authorised source folders and connect it to relevant Ofsted or SIAMS questions. Keep the original source and professional review visible.",
      },
      {
        title: "Drafting the SEF",
        desc: "Use source evidence and your own judgement to prepare a self-evaluation draft for leaders to check and refine.",
      },
      {
        title: "Strategic Nudges",
        desc: "Turn an identified evidence gap into an action with an owner and review date. A suggested action still needs the school’s judgement.",
      },
    ],
    typicalJobs: [
      "Mapping evidence to Ofsted sub-headings",
      "Preparing SIAMS self-evaluation notes",
      "Maintaining the live Action Plan",
      "Reviewing lesson observation trends",
      "Preparing briefing notes for Governors",
      "Preparing evidence-based leadership conversations",
    ],
    whatItCovers: [
      "Ofsted toolkit and inspection framework",
      "SIAMS Framework for Church Schools",
      "Self-Evaluation (SEF) Writing",
      "School Improvement Planning (SIP)",
      "Evidence Management",
      "Stakeholder Reporting",
    ],
  },
  compliance: {
    howEdHelps: [
      {
        title: "Policy Version Control",
        desc: "Keep policy ownership, source links and review dates visible. Check version history in the school’s source system before relying on a document.",
      },
      {
        title: "Statutory Check Reminders",
        desc: "Organise due dates and responsibilities for relevant checks. Review overdue work and use the school’s escalation arrangements; a reminder does not guarantee completion.",
      },
      {
        title: "Audit Log Generation",
        desc: "Bring recorded checks, findings and follow-up evidence into a review. The record is only as complete as the information the school has captured.",
      },
    ],
    typicalJobs: [
      "Managing policy review cycles",
      "Coordinating H&S walk-throughs",
      "Maintaining the Risk Register",
      "Tracking governor meeting actions",
      "Monitoring website compliance",
      "Logging statutory incidents",
    ],
    whatItCovers: [
      "Statutory Policy Management",
      "Risk & Incident Tracking",
      "Health & Safety Compliance",
      "Governor Portal & Minutes",
      "Website Compliance Monitoring",
      "Audit Readiness",
    ],
  },
  estates: {
    howEdHelps: [
      {
        title: "Asset Lifecycle Tracking",
        desc: "Connect assets, inspection findings and maintenance records so the team can plan repairs with competent advice and an agreed budget.",
      },
      {
        title: "Energy Usage Insights",
        desc: "Review available utility information and investigate unusual usage. Check the data period, building context and costs before choosing a change.",
      },
      {
        title: "Contractor Compliance",
        desc: "Keep relevant contractor documents and review dates organised. Responsible staff must verify the checks and site arrangements appropriate to the work.",
      },
    ],
    typicalJobs: [
      "Scheduling planned maintenance (PPM)",
      "Managing site helpdesk tickets",
      "Tracking energy consumption & costs",
      "Coordinating building projects",
      "Managing contractor site access",
      "Compliance with DfE Estates guidance",
    ],
    whatItCovers: [
      "Planned & Reactive Maintenance",
      "Energy & Carbon Management",
      "Contractor & Asset Tracking",
      "Health & Safety (Premises)",
      "Project Management Hub",
      "Condition Surveys & Audits",
    ],
  },
  finance: {
    howEdHelps: [
      {
        title: "Budget Status Reports",
        desc: "Use clearly labelled budget information to prepare summaries for budget holders. Check the period, assumptions and source figures before acting.",
      },
      {
        title: "PP Impact Analysis",
        desc: "Review Pupil Premium spending alongside delivery and pupil outcome evidence. A relationship between spending and progress does not by itself establish an intervention’s impact.",
      },
      {
        title: "Procurement Guide",
        desc: "Prepare a renewal brief and compare like-for-like quotations. Include service scope and whole-contract costs, then follow the school’s purchasing procedures.",
      },
    ],
    typicalJobs: [
      "Monthly budget monitoring",
      "Producing Pupil Premium reports",
      "Tracking Sports Premium impact",
      "Analysing procurement savings",
      "Preparing SFVS compliance data",
      "Assisting with 3-year forecasting",
    ],
    whatItCovers: [
      "Strategic Budget Monitoring",
      "Pupil & Sports Premium Tracking",
      "Value for Money (VfM) Analysis",
      "SFVS & Financial Compliance",
      "Grants & Funding Management",
      "Audit & CFR Preparation",
    ],
  },
  hr: {
    howEdHelps: [
      {
        title: "Wellbeing Pulse Checks",
        desc: "Plan proportionate staff feedback and agree how it will be used. Small teams require care: a survey should not be described as anonymous unless its design supports that claim.",
      },
      {
        title: "Performance Review Guide",
        desc: "Prepare review conversations using agreed objectives, relevant evidence and professional development priorities.",
      },
      {
        title: "Return-to-Work Assistant",
        desc: "Organise the return-to-work conversation, appropriate records and agreed support. Managers remain responsible for the process and follow-up.",
      },
    ],
    typicalJobs: [
      "Managing staff performance reviews",
      "Tracking professional development (CPD)",
      "Reviewing staff absence and wellbeing information",
      "Maintaining the SCR and induction logs",
      "Supporting recruitment and onboarding",
      "Coordinating teacher appraisal cycles",
    ],
    whatItCovers: [
      "Staff Performance Management",
      "Wellbeing & Morale Tracking",
      "Absence & Attendance Analysis",
      "Single Central Record (SCR)",
      "Recruitment & Onboarding Hub",
      "CPD & Training Records",
    ],
  },
  send: {
    howEdHelps: [
      {
        title: "EHCP Progress Mapping",
        desc: "Connect agreed EHCP outcomes with appropriate provision records and review evidence. A recorded plan does not establish that support happened or that an outcome was achieved.",
      },
      {
        title: "Provision Map Efficiency",
        desc: "Review provision delivery, costs and evidence with the SENCO. Consider the child’s needs and the limits of the evidence before making a support decision.",
      },
      {
        title: "Parent Liaison Support",
        desc: "Prepare clear updates for families through the school’s agreed process. Staff should check accuracy, sensitive details and the next steps before sharing.",
      },
    ],
    typicalJobs: [
      "Mapping EHCP outcomes",
      "Evaluating intervention impact",
      "Preparing for annual reviews",
      "Drafting parent communication",
      "Managing the SEND register",
      "Tracking funding and resources",
    ],
    whatItCovers: [
      "EHCP Management",
      "Provision Mapping",
      "Intervention Analysis",
      "SEND Compliance & Audit",
      "Resource & Funding Tracking",
      "Transition Planning",
    ],
  },
};
