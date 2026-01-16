export interface ModuleContent {
    howEdHelps: { title: string; desc: string }[];
    typicalJobs: string[];
    whatItCovers: string[];
}

export const moduleContent: Record<string, ModuleContent> = {
    improvement: {
        howEdHelps: [
            {
                title: "Evidence Discovery",
                desc: "Ed scans your drives and systems of record to find evidence that matches specific Ofsted/SIAMS framework points."
            },
            {
                title: "Drafting the SEF",
                desc: "Based on found evidence and your input, Ed drafts sections of your Self-Evaluation Form, ensuring professional tone and alignment."
            },
            {
                title: "Strategic Nudges",
                desc: "If a framework area is weak, Ed proactively suggests actions to bridge the gap before your next inspection window."
            }
        ],
        typicalJobs: [
            "Mapping evidence to Ofsted sub-headings",
            "Generating terminal SIAMS reports",
            "Maintaining the live Action Plan",
            "Reviewing lesson observation trends",
            "Preparing briefing notes for Governors",
            "Simulating 'Deep Dive' questions"
        ],
        whatItCovers: [
            "Ofsted Inspection Framework (EIF)",
            "SIAMS Framework for Church Schools",
            "Self-Evaluation (SEF) Writing",
            "School Improvement Planning (SIP)",
            "Evidence Management",
            "Stakeholder Reporting"
        ]
    },
    compliance: {
        howEdHelps: [
            {
                title: "Policy Version Control",
                desc: "Ed tracks every change in your policies, ensuring you're always running on the latest version and previous drafts are archived safely."
            },
            {
                title: "Statutory Check Reminders",
                desc: "Never miss a health and safety check or fire drill. Ed proactively alerts the right staff when statutory tasks are due."
            },
            {
                title: "Audit Log Generation",
                desc: "Coming up to a review? Ed can generate a complete log of all compliance activities, ready for governors or inspectors."
            }
        ],
        typicalJobs: [
            "Managing policy review cycles",
            "Coordinating H&S walk-throughs",
            "Maintaining the Risk Register",
            "Tracking governor meeting actions",
            "Monitoring website compliance",
            "Logging statutory incidents"
        ],
        whatItCovers: [
            "Statutory Policy Management",
            "Risk & Incident Tracking",
            "Health & Safety Compliance",
            "Governor Portal & Minutes",
            "Website Compliance Monitoring",
            "Audit Readiness"
        ]
    },
    estates: {
        howEdHelps: [
            {
                title: "Asset Lifecycle Tracking",
                desc: "Ed keeps a detailed history of your school's physical assets, forecasting when repairs or replacements will be needed."
            },
            {
                title: "Energy Usage Insights",
                desc: "By analysing utility data, Ed highlights patterns of high usage and suggests simple, low-cost ways to reduce carbon footprint."
            },
            {
                title: "Contractor Compliance",
                desc: "Ed manages the paperwork for external contractors, ensuring DBS checks and risk assessments are valid before they step on site."
            }
        ],
        typicalJobs: [
            "Scheduling planned maintenance (PPM)",
            "Managing site helpdesk tickets",
            "Tracking energy consumption & costs",
            "Coordinating building projects",
            "Managing contractor site access",
            "Compliance with DfE Estates guidance"
        ],
        whatItCovers: [
            "Planned & Reactive Maintenance",
            "Energy & Carbon Management",
            "Contractor & Asset Tracking",
            "Health & Safety (Premises)",
            "Project Management Hub",
            "Condition Surveys & Audits"
        ]
    },
    finance: {
        howEdHelps: [
            {
                title: "Budget Status Reports",
                desc: "Ed translates complex spreadsheets into plain-English summaries for budget holders, making financial oversight intuitive."
            },
            {
                title: "PP Impact Analysis",
                desc: "Ed helps cross-reference Pupil Premium spend with student progress data to show the true impact of your interventions."
            },
            {
                title: "Procurement Guide",
                desc: "Need to renew a contract? Ed can help draft tenders and compare quotes to ensure you're getting the best value for public money."
            }
        ],
        typicalJobs: [
            "Monthly budget monitoring",
            "Producing Pupil Premium reports",
            "Tracking Sports Premium impact",
            "Analysing procurement savings",
            "Preparing SFVS compliance data",
            "Assisting with 3-year forecasting"
        ],
        whatItCovers: [
            "Strategic Budget Monitoring",
            "Pupil & Sports Premium Tracking",
            "Value for Money (VfM) Analysis",
            "SFVS & Financial Compliance",
            "Grants & Funding Management",
            "Audit & CFR Preparation"
        ]
    },
    hr: {
        howEdHelps: [
            {
                title: "Wellbeing Pulse Checks",
                desc: "Ed can conduct anonymous, gentle check-ins with staff to gauge wellbeing and highlight morale trends before they lead to burnout."
            },
            {
                title: "Performance Review Guide",
                desc: "Ed helps staff and leaders prepare for mid-year and annual reviews by gathering progress evidence and suggesting professional goals."
            },
            {
                title: "Return-to-Work Assistant",
                desc: "Upon a staff member's return from absence, Ed helps ensure all necessary documentation is completed correctly and support plans are in place."
            }
        ],
        typicalJobs: [
            "Managing staff performance reviews",
            "Tracking professional development (CPD)",
            "Analyzing staff absence and wellbeing patterns",
            "Maintaining the SCR and induction logs",
            "Supporting recruitment and onboarding",
            "Coordinating teacher appraisal cycles"
        ],
        whatItCovers: [
            "Staff Performance Management",
            "Wellbeing & Morale Tracking",
            "Absence & Attendance Analysis",
            "Single Central Record (SCR)",
            "Recruitment & Onboarding Hub",
            "CPD & Training Records"
        ]
    },
    send: {
        howEdHelps: [
            {
                title: "EHCP Progress Mapping",
                desc: "Ed helps map specific outcomes from EHCPs to daily classroom evidence, ensuring every child's progress is visible and trackable."
            },
            {
                title: "Provision Map Efficiency",
                desc: "Are your interventions working? Ed analyzes the cost vs. impact of different provisions to help the SENDCo optimize support."
            },
            {
                title: "Parent Liaison Support",
                desc: "Ed can help draft compassionate, structured updates for parents, ensuring they feel informed and involved in their child's journey."
            }
        ],
        typicalJobs: [
            "Mapping EHCP outcomes",
            "Evaluating intervention impact",
            "Preparing for annual reviews",
            "Drafting parent communication",
            "Managing the SEND register",
            "Tracking funding and resources"
        ],
        whatItCovers: [
            "EHCP Management",
            "Provision Mapping",
            "Intervention Analysis",
            "SEND Compliance & Audit",
            "Resource & Funding Tracking",
            "Transition Planning"
        ]
    }
};
