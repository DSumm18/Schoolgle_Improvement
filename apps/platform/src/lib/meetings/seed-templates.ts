import type {
  TemplateCategory,
  ComplianceItem,
  PreparationGuide,
} from "./types";

export interface SeedTemplate {
  name: string;
  category: TemplateCategory;
  description: string;
  opening_script: string[];
  closing_script: string[];
  compliance_items: ComplianceItem[];
  preparation_guide: PreparationGuide;
}

export const SEED_TEMPLATES: SeedTemplate[] = [
  // 1. Return to Work — Short-term Absence
  {
    name: "Return to Work — Short-term Absence",
    category: "hr",
    description:
      "Conducted after any period of sickness absence (typically 1–3 days). Ensures the employee is fit to return, identifies any support needed, and maintains the absence record.",
    opening_script: [
      "Thank you for coming in to see me today. This is a routine return-to-work meeting following your recent absence.",
      "The purpose of this meeting is to welcome you back, check that you are well enough to return, and see if there is anything we can do to support you.",
      "This is an informal conversation and nothing you say will be used against you. I just want to make sure you are okay.",
    ],
    closing_script: [
      "Thank you for talking with me today. I hope you feel supported in your return.",
      "I will update your absence record and send you a copy of the notes from this meeting within five working days.",
      "If anything changes or you need further support, please do not hesitate to speak to me or another member of the leadership team.",
    ],
    compliance_items: [
      {
        phrase: "Welcome back. We're glad to see you.",
        category: "Wellbeing",
        is_critical: false,
        order_index: 0,
      },
      {
        phrase:
          "Can you tell me about your absence and how you're feeling now?",
        category: "Absence Detail",
        is_critical: true,
        order_index: 1,
      },
      {
        phrase:
          "Is there anything work-related that contributed to your absence?",
        category: "Root Cause",
        is_critical: true,
        order_index: 2,
      },
      {
        phrase: "Is there anything we can do to support your return?",
        category: "Support",
        is_critical: true,
        order_index: 3,
      },
      {
        phrase:
          "Are you aware of our sickness absence policy and the triggers for formal review?",
        category: "Policy",
        is_critical: true,
        order_index: 4,
      },
      {
        phrase:
          "Is there anything else you'd like to discuss or any support you need?",
        category: "Open",
        is_critical: false,
        order_index: 5,
      },
    ],
    preparation_guide: {
      context_prompts: [
        "Review the employee's absence record before the meeting.",
        "Check whether this absence triggers any policy thresholds.",
        "Consider whether a referral to occupational health is appropriate.",
      ],
      documents_needed: [
        "Employee absence record",
        "Sickness absence policy",
        "Return-to-work form (if applicable)",
      ],
      key_phrases: [
        "Welcome back",
        "Support your return",
        "Sickness absence policy",
        "Triggers for formal review",
      ],
      policy_refs: [
        "School Sickness Absence Policy",
        "ACAS Managing Attendance and Employee Turnover guidance",
      ],
    },
  },

  // 2. Return to Work — Long-term Absence
  {
    name: "Return to Work — Long-term Absence",
    category: "hr",
    description:
      "For absences exceeding 4 weeks. Includes phased return planning, occupational health referral consideration, reasonable adjustments, and wellbeing support.",
    opening_script: [
      "Welcome back. We want to make sure your return is as smooth as possible.",
      "This meeting is to discuss how you are feeling, whether any adjustments would help, and to plan your return together.",
      "There is no rush — take your time, and please let me know if you need a break at any point.",
    ],
    closing_script: [
      "Thank you for being so open with me today. We will put the agreed support in place before your first full day back.",
      "I will send you a written summary of what we have agreed, including any phased return arrangements and reasonable adjustments.",
      "We will schedule a follow-up meeting in [X] weeks to see how things are going. You can contact me at any time before then if you need anything.",
    ],
    compliance_items: [
      {
        phrase:
          "Welcome back. We want to make sure your return is as smooth as possible.",
        category: "Wellbeing",
        is_critical: false,
        order_index: 0,
      },
      {
        phrase: "How are you feeling about coming back to work?",
        category: "Wellbeing",
        is_critical: true,
        order_index: 1,
      },
      {
        phrase:
          "Have there been any changes to your condition that we should be aware of?",
        category: "Medical",
        is_critical: true,
        order_index: 2,
      },
      {
        phrase: "Would a phased return be helpful for you?",
        category: "Adjustments",
        is_critical: true,
        order_index: 3,
      },
      {
        phrase: "Are there any reasonable adjustments we can put in place?",
        category: "Adjustments",
        is_critical: true,
        order_index: 4,
      },
      {
        phrase:
          "Have you been referred to or would you like a referral to occupational health?",
        category: "Medical",
        is_critical: true,
        order_index: 5,
      },
      {
        phrase:
          "Here is your current absence record. Let me explain what happens next under our policy.",
        category: "Policy",
        is_critical: true,
        order_index: 6,
      },
    ],
    preparation_guide: {
      context_prompts: [
        "Review the full absence history and any medical certificates received.",
        "Check whether an occupational health referral has already been made.",
        "Consider what reasonable adjustments might be appropriate.",
        "Prepare a draft phased return plan to discuss.",
      ],
      documents_needed: [
        "Employee absence record",
        "Medical certificates / fit notes",
        "Occupational health report (if available)",
        "Sickness absence policy",
        "Phased return plan template",
      ],
      key_phrases: [
        "Phased return",
        "Reasonable adjustments",
        "Occupational health",
        "Absence record",
      ],
      policy_refs: [
        "School Sickness Absence Policy",
        "Equality Act 2010 — Reasonable Adjustments",
        "ACAS Managing Attendance guidance",
      ],
    },
  },

  // 3. Informal Sickness Review
  {
    name: "Informal Sickness Review",
    category: "hr",
    description:
      "Triggered when an employee hits an absence trigger point. Supportive in tone but ensures the employee understands the formal process that follows if attendance does not improve.",
    opening_script: [
      "Thank you for meeting with me today. I want to start by saying that this is an informal conversation — it is not a disciplinary meeting.",
      "The purpose is to discuss your recent attendance, understand if there are any underlying issues, and see what support we can offer.",
      "I value you as a member of the team and I want to work with you to find a way forward.",
    ],
    closing_script: [
      "Thank you for being honest with me today. I appreciate that these conversations can feel uncomfortable.",
      "To summarise, we have agreed the following actions: [summarise agreed actions].",
      "I will monitor your attendance over the next [X] weeks. If your attendance improves, no further action will be needed. If it does not, the next step would be a formal Stage 1 meeting.",
      "I will send you a written record of this conversation within five working days.",
    ],
    compliance_items: [
      {
        phrase: "This is an informal meeting to discuss your attendance.",
        category: "Meeting Type",
        is_critical: true,
        order_index: 0,
      },
      {
        phrase:
          "I want to understand if there are any underlying issues we can help with.",
        category: "Support",
        is_critical: true,
        order_index: 1,
      },
      {
        phrase:
          "Your current absence record shows [X days / X occasions] in the last [period].",
        category: "Data",
        is_critical: true,
        order_index: 2,
      },
      {
        phrase:
          "This has triggered an informal review under our sickness absence policy.",
        category: "Policy",
        is_critical: true,
        order_index: 3,
      },
      {
        phrase:
          "Is there anything happening at work or at home that is affecting your attendance?",
        category: "Root Cause",
        is_critical: true,
        order_index: 4,
      },
      {
        phrase: "What support can we offer to help improve your attendance?",
        category: "Support",
        is_critical: true,
        order_index: 5,
      },
      {
        phrase:
          "If your attendance does not improve, the next step would be a formal Stage 1 review.",
        category: "Escalation",
        is_critical: true,
        order_index: 6,
      },
    ],
    preparation_guide: {
      context_prompts: [
        "Prepare the employee's absence data: total days, number of occasions, pattern analysis.",
        "Review which policy trigger has been hit.",
        "Consider whether there may be an underlying health condition (Equality Act implications).",
        "Think about what support has already been offered.",
      ],
      documents_needed: [
        "Employee absence record with dates and reasons",
        "Sickness absence policy (trigger points highlighted)",
        "Any previous return-to-work meeting notes",
        "Support services information (EAP, occupational health)",
      ],
      key_phrases: [
        "Informal meeting",
        "Absence trigger",
        "Support",
        "Stage 1 review",
      ],
      policy_refs: [
        "School Sickness Absence Policy — Trigger Points",
        "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      ],
    },
  },

  // 4. Formal Sickness Review (Stage 1 / 2 / 3)
  {
    name: "Formal Sickness Review (Stage 1 / 2 / 3)",
    category: "hr",
    description:
      "Formal meeting under the school's sickness absence procedure. Employee has the right to be accompanied by a trade union representative or colleague.",
    opening_script: [
      "Good [morning/afternoon]. Thank you for attending this meeting.",
      "This is a formal meeting under Stage [X] of our sickness absence procedure. I will explain the purpose and process before we begin.",
      "You have the right to be accompanied by a trade union representative or a workplace colleague. Can you confirm whether you have chosen to bring someone with you today?",
      "I will take notes during this meeting, and you will receive a written record of the discussion and any outcomes within five working days.",
    ],
    closing_script: [
      "Thank you for attending this meeting and for sharing your views.",
      "I will now consider everything that has been discussed before reaching a decision. You will receive the outcome in writing within [X] working days.",
      "You will have the right to appeal any decision made as a result of this meeting. The appeal process is set out in the sickness absence policy.",
      "Do you have any questions before we close?",
    ],
    compliance_items: [
      {
        phrase:
          "This is a formal meeting under Stage [X] of our sickness absence procedure.",
        category: "Meeting Type",
        is_critical: true,
        order_index: 0,
      },
      {
        phrase:
          "You have the right to be accompanied by a trade union representative or workplace colleague.",
        category: "Rights",
        is_critical: true,
        order_index: 1,
      },
      {
        phrase:
          "I will explain the purpose of this meeting and what may happen as a result.",
        category: "Process",
        is_critical: true,
        order_index: 2,
      },
      {
        phrase: "Your absence record for the review period is as follows...",
        category: "Data",
        is_critical: true,
        order_index: 3,
      },
      {
        phrase:
          "Have you received and understood the letter inviting you to this meeting?",
        category: "Process",
        is_critical: true,
        order_index: 4,
      },
      {
        phrase:
          "Is there any medical evidence or mitigating circumstances you wish to present?",
        category: "Evidence",
        is_critical: true,
        order_index: 5,
      },
      {
        phrase: "What support has been offered and what has been the outcome?",
        category: "Support",
        is_critical: true,
        order_index: 6,
      },
      {
        phrase: "I will now explain the possible outcomes of this meeting.",
        category: "Outcomes",
        is_critical: true,
        order_index: 7,
      },
    ],
    preparation_guide: {
      context_prompts: [
        "Confirm the employee received the invitation letter at least 5 working days in advance.",
        "Prepare a chronological summary of all absence, support offered, and previous meetings.",
        "Check whether the employee is accompanied and note who is present.",
        "Have a clear understanding of the possible outcomes at this stage.",
      ],
      documents_needed: [
        "Invitation letter (copy)",
        "Employee absence record (full history)",
        "Notes from any previous informal/formal meetings",
        "Occupational health reports",
        "Sickness absence policy",
        "Medical certificates / fit notes",
      ],
      key_phrases: [
        "Formal meeting",
        "Right to be accompanied",
        "Trade union representative",
        "Possible outcomes",
        "Right of appeal",
      ],
      policy_refs: [
        "School Sickness Absence Policy — Formal Stages",
        "ACAS Code of Practice on Disciplinary and Grievance Procedures",
        "Employment Rights Act 1996 — Section 10 (right to be accompanied)",
      ],
    },
  },

  // 5. Informal Capability Conversation
  {
    name: "Informal Capability Conversation",
    category: "hr",
    description:
      "An early, supportive conversation when concerns about performance or capability first arise. Not a disciplinary matter.",
    opening_script: [
      "Thank you for meeting with me. I want to have an open and honest conversation about how things are going.",
      "I want to be clear that this is not a formal process and it is not a disciplinary matter. This is about support and development.",
      "I want to hear your perspective and work together on a plan that helps you succeed.",
    ],
    closing_script: [
      "Thank you for being so open. I think this has been a productive conversation.",
      "To summarise, we have agreed the following targets and support: [summarise].",
      "We will meet again in [X] weeks to review progress. In the meantime, I am here if you need any help or have any concerns.",
      "I will send you a brief written summary of what we discussed and agreed.",
    ],
    compliance_items: [
      {
        phrase:
          "I want to have an open conversation about how things are going in your role.",
        category: "Opening",
        is_critical: true,
        order_index: 0,
      },
      {
        phrase:
          "I've noticed some areas where I think we can work together to improve.",
        category: "Concerns",
        is_critical: true,
        order_index: 1,
      },
      {
        phrase:
          "This is not a formal process. It's about support and development.",
        category: "Reassurance",
        is_critical: true,
        order_index: 2,
      },
      {
        phrase:
          "Can you share your perspective on how you feel things are going?",
        category: "Employee Voice",
        is_critical: true,
        order_index: 3,
      },
      {
        phrase: "What barriers or challenges are you facing?",
        category: "Root Cause",
        is_critical: true,
        order_index: 4,
      },
      {
        phrase:
          "Let's agree on some specific targets and a timeline for review.",
        category: "Actions",
        is_critical: true,
        order_index: 5,
      },
      {
        phrase: "What training or support would help you?",
        category: "Support",
        is_critical: true,
        order_index: 6,
      },
    ],
    preparation_guide: {
      context_prompts: [
        "Prepare specific, factual examples of the concerns (not opinions or hearsay).",
        "Consider what support, training, or resources could help.",
        "Think about SMART targets that are fair and achievable.",
        "Reflect on whether there are any external factors that may be contributing.",
      ],
      documents_needed: [
        "Performance data or lesson observation notes",
        "Job description and person specification",
        "Capability/appraisal policy",
        "CPD records",
      ],
      key_phrases: [
        "Support and development",
        "Not a formal process",
        "Specific targets",
        "Timeline for review",
      ],
      policy_refs: [
        "School Capability Policy",
        "Teachers' Standards (if applicable)",
        "ACAS Managing Performance guidance",
      ],
    },
  },

  // 6. Wellbeing Check-in
  {
    name: "Wellbeing Check-in",
    category: "hr",
    description:
      "A general wellbeing conversation. Can be scheduled regularly or triggered by concerns. Focuses on the whole person, not just work performance.",
    opening_script: [
      "Thank you for taking the time to meet with me. This is a confidential wellbeing check-in.",
      "There is no agenda or form to fill in — I just want to see how you are doing and whether there is anything I can do to support you.",
      "Nothing you say will be shared with anyone else unless you tell me something that raises a safeguarding concern, in which case I have a duty to act.",
    ],
    closing_script: [
      "Thank you for talking with me today. I really appreciate your openness.",
      "Remember, you can come to me at any time if something is on your mind.",
      "I will follow up on the things we discussed: [summarise any agreed actions].",
      "Take care of yourself, and I will check in again in [X] weeks.",
    ],
    compliance_items: [
      {
        phrase:
          "This is a confidential check-in. Nothing you say will be shared without your consent unless there is a safeguarding concern.",
        category: "Confidentiality",
        is_critical: true,
        order_index: 0,
      },
      {
        phrase: "How are you doing, generally?",
        category: "Wellbeing",
        is_critical: true,
        order_index: 1,
      },
      {
        phrase:
          "Is there anything at work that's causing you stress or concern?",
        category: "Work",
        is_critical: true,
        order_index: 2,
      },
      {
        phrase:
          "Is there anything outside of work that's affecting you that you'd like support with?",
        category: "Personal",
        is_critical: false,
        order_index: 3,
      },
      {
        phrase:
          "Are you aware of the support services available to you, such as our Employee Assistance Programme?",
        category: "Support",
        is_critical: true,
        order_index: 4,
      },
      {
        phrase:
          "Is there anything I can do differently as your manager to support you?",
        category: "Management",
        is_critical: true,
        order_index: 5,
      },
    ],
    preparation_guide: {
      context_prompts: [
        "Reflect on any recent changes in the employee's behaviour or demeanour.",
        "Check whether they have had recent absences or have seemed withdrawn.",
        "Ensure you have a private, comfortable space for the conversation.",
        "Be prepared to listen more than you talk.",
      ],
      documents_needed: [
        "Employee Assistance Programme details",
        "Mental health first aider contact information",
        "Occupational health referral form (in case needed)",
      ],
      key_phrases: [
        "Confidential",
        "How are you doing",
        "Support services",
        "Employee Assistance Programme",
      ],
      policy_refs: [
        "Staff Wellbeing Policy",
        "Safeguarding Policy (disclosure protocol)",
        "Health and Safety at Work Act 1974 — duty of care",
      ],
    },
  },

  // 7. Probation Review
  {
    name: "Probation Review",
    category: "hr",
    description:
      "End-of-probation or mid-probation review meeting. Assesses performance against initial objectives and determines whether probation is passed, extended, or employment ended.",
    opening_script: [
      "Thank you for meeting with me today. This meeting is to review your progress during your probation period.",
      "We will look at the objectives that were set when you started, hear your perspective on how things have gone, and discuss the next steps.",
      "This is a two-way conversation — I want to hear your views as well as share feedback.",
    ],
    closing_script: [
      "Thank you for your contributions during this probation period.",
      "Based on our discussion today, the outcome is: [state outcome — pass / extend / end].",
      "I will confirm this in writing within five working days, along with any ongoing objectives or support.",
      "Do you have any questions or anything else you would like to raise?",
    ],
    compliance_items: [
      {
        phrase:
          "This meeting is to review your progress during your probation period.",
        category: "Purpose",
        is_critical: true,
        order_index: 0,
      },
      {
        phrase:
          "Let's look at the objectives that were set at the start of your employment.",
        category: "Review",
        is_critical: true,
        order_index: 1,
      },
      {
        phrase: "How do you feel you have settled into the role?",
        category: "Employee Voice",
        is_critical: true,
        order_index: 2,
      },
      {
        phrase: "Is there any training or support you feel you still need?",
        category: "Support",
        is_critical: true,
        order_index: 3,
      },
      {
        phrase:
          "I'd like to share feedback from your line manager and colleagues.",
        category: "Feedback",
        is_critical: true,
        order_index: 4,
      },
      {
        phrase: "Based on this review, the outcome is...",
        category: "Outcome",
        is_critical: true,
        order_index: 5,
      },
    ],
    preparation_guide: {
      context_prompts: [
        "Gather feedback from colleagues, line manager, and any relevant stakeholders.",
        "Review the objectives set at the start of employment.",
        "Prepare evidence of performance against each objective.",
        "Consider whether the probation should be passed, extended, or ended — and the rationale.",
      ],
      documents_needed: [
        "Probation objectives / induction plan",
        "Performance evidence (observations, feedback, data)",
        "Contract of employment (probation clause)",
        "Probation policy",
      ],
      key_phrases: ["Probation period", "Objectives", "Feedback", "Outcome"],
      policy_refs: [
        "Probation Policy",
        "Contract of Employment — Probation Clause",
        "ACAS Recruitment and Induction guidance",
      ],
    },
  },

  // 8. Grievance Hearing (Initial)
  {
    name: "Grievance Hearing (Initial)",
    category: "hr",
    description:
      "Formal meeting to hear an employee's grievance. Must follow the ACAS Code of Practice.",
    opening_script: [
      "Good [morning/afternoon]. Thank you for attending this grievance hearing.",
      "You have the right to be accompanied by a trade union representative or a workplace colleague. Can you confirm who is present with you today?",
      "The purpose of this hearing is to listen to your grievance, ask questions to ensure I fully understand it, and determine what steps to take next.",
      "I have received your written grievance dated [date]. I will ask you to explain it in your own words, and then I may ask some clarifying questions.",
    ],
    closing_script: [
      "Thank you for explaining your grievance. I appreciate that raising it may not have been easy.",
      "I will now consider everything you have told me. I may need to carry out further investigation before reaching a decision.",
      "You will receive the outcome in writing within [X] working days.",
      "If you are not satisfied with the outcome, you have the right to appeal. The appeal process is set out in the grievance policy.",
    ],
    compliance_items: [
      {
        phrase:
          "This is a formal grievance hearing. You have the right to be accompanied.",
        category: "Rights",
        is_critical: true,
        order_index: 0,
      },
      {
        phrase: "I have received your written grievance dated [date].",
        category: "Process",
        is_critical: true,
        order_index: 1,
      },
      {
        phrase: "Please explain your grievance in your own words.",
        category: "Employee Voice",
        is_critical: true,
        order_index: 2,
      },
      {
        phrase: "What outcome are you seeking?",
        category: "Resolution",
        is_critical: true,
        order_index: 3,
      },
      {
        phrase:
          "I may need to adjourn to investigate further before reaching a decision.",
        category: "Process",
        is_critical: true,
        order_index: 4,
      },
      {
        phrase:
          "You will receive the outcome in writing within [X] working days.",
        category: "Outcome",
        is_critical: true,
        order_index: 5,
      },
      {
        phrase:
          "You have the right to appeal if you are not satisfied with the outcome.",
        category: "Rights",
        is_critical: true,
        order_index: 6,
      },
    ],
    preparation_guide: {
      context_prompts: [
        "Read the written grievance carefully and identify the key issues.",
        "Consider whether you need to arrange for an impartial hearing officer.",
        "Prepare questions to clarify the nature and scope of the grievance.",
        "Ensure the employee was given at least 5 working days' notice of this hearing.",
      ],
      documents_needed: [
        "Written grievance from the employee",
        "Invitation letter (copy)",
        "Grievance policy",
        "Any relevant correspondence or evidence",
        "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      ],
      key_phrases: [
        "Formal grievance hearing",
        "Right to be accompanied",
        "Written outcome",
        "Right to appeal",
      ],
      policy_refs: [
        "School Grievance Policy",
        "ACAS Code of Practice on Disciplinary and Grievance Procedures",
        "Employment Relations Act 1999 — Section 10",
      ],
    },
  },
];
