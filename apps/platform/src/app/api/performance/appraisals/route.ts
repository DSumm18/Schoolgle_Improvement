import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Data ───────────────────────────────────────────────────────

const DEMO_APPRAISALS = [
  {
    id: "demo-appraisal-1",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "Sarah Mitchell",
    staff_email: "s.mitchell@school.example",
    role: "Head of English",
    role_type: "teacher",
    pay_scale: "UPS 3",
    appraiser_name: "James Wilson",
    status: "end_year_review",
    objectives: [
      {
        id: "obj-1",
        title: "Improve KS4 English Literature results",
        description:
          "Increase Grade 5+ from 62% to 70% through targeted intervention programme",
        sdp_link: "Raise attainment in English across all key stages",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "On track - mock results show 67% at Grade 5+",
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-2",
        title: "Develop whole-school literacy strategy",
        description:
          "Create and implement cross-curricular literacy policy with staff CPD",
        sdp_link: "Improve literacy outcomes school-wide",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Policy drafted, 2 of 4 training sessions delivered",
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-3",
        title: "Lead departmental peer observation programme",
        description:
          "Establish and embed regular peer observations in English department",
        sdp_link: "Quality of teaching and learning",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: false,
        },
        mid_year_progress: "Programme launched, 80% of department engaged",
        end_year_outcome: null,
        rating: null,
      },
    ],
    mid_year_review: {
      date: "2026-02-10",
      overall_progress: "good",
      evidence_notes:
        "Strong progress on objectives 1 and 3. Objective 2 needs acceleration in spring term.",
      reviewer_comments:
        "Sarah has made excellent progress. Mock results are very encouraging.",
      completed: true,
    },
    end_year_review: null,
    cpd_completed: [
      {
        title: "NPQ Leading Literacy",
        date: "2025-11-15",
        provider: "Ambition Institute",
      },
      {
        title: "Exam Board Standardisation",
        date: "2026-01-20",
        provider: "AQA",
      },
    ],
    cpd_planned: [
      {
        title: "Senior Leadership Aspiration Programme",
        date: "2026-06-01",
        provider: "Local TSH",
      },
    ],
    observations: [
      {
        date: "2025-11-08",
        focus: "Questioning techniques",
        judgement: "good",
        feedback:
          "Effective use of Bloom's taxonomy. Consider more cold-calling.",
      },
      {
        date: "2026-03-05",
        focus: "Differentiation for SEND",
        judgement: "outstanding",
        feedback: "Excellent scaffolding and adaptive teaching.",
      },
    ],
    pay_recommendation: null,
    is_ect: false,
    ect_term: null,
    ect_mentor: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-03-05T00:00:00Z",
  },
  {
    id: "demo-appraisal-2",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "David Chen",
    staff_email: "d.chen@school.example",
    role: "Teacher of Mathematics",
    role_type: "teacher",
    pay_scale: "MPS 4",
    appraiser_name: "Lisa Thompson",
    status: "mid_year_review",
    objectives: [
      {
        id: "obj-4",
        title: "Raise Year 11 Maths attainment",
        description: "Increase Grade 4+ from 58% to 65%",
        sdp_link: "Raise attainment in Mathematics",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Mocks at 61% - some progress",
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-5",
        title: "Implement mastery approach in KS3",
        description:
          "Pilot mastery curriculum in Year 7 with at least 2 units per term",
        sdp_link: "Curriculum development",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "3 units completed, positive student feedback",
        end_year_outcome: null,
        rating: null,
      },
    ],
    mid_year_review: {
      date: "2026-02-12",
      overall_progress: "satisfactory",
      evidence_notes:
        "Progress on Objective 1 is slower than hoped. Mastery pilot going well.",
      reviewer_comments:
        "Needs additional support with targeted intervention groups.",
      completed: true,
    },
    end_year_review: null,
    cpd_completed: [
      {
        title: "Mastery Maths Training",
        date: "2025-10-18",
        provider: "NCETM",
      },
    ],
    cpd_planned: [],
    observations: [
      {
        date: "2025-12-01",
        focus: "Use of assessment",
        judgement: "requires_improvement",
        feedback:
          "Mini-whiteboard use was effective but needs to act on information gathered more swiftly.",
      },
    ],
    pay_recommendation: null,
    is_ect: false,
    ect_term: null,
    ect_mentor: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-02-12T00:00:00Z",
  },
  {
    id: "demo-appraisal-3",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "Emma Roberts",
    staff_email: "e.roberts@school.example",
    role: "ECT - Teacher of Science",
    role_type: "teacher",
    pay_scale: "MPS 1",
    appraiser_name: "Mark Stevens",
    status: "mid_year_review",
    objectives: [
      {
        id: "obj-6",
        title: "Develop effective behaviour management",
        description:
          "Consistently apply school behaviour policy, reduce behaviour incidents by 50%",
        sdp_link: "Behaviour and attitudes",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Significant improvement - incidents down 40%",
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-7",
        title: "Plan effective sequences of lessons",
        description:
          "Demonstrate clear learning progressions across all teaching groups",
        sdp_link: "Quality of education",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Good progress with mentor support",
        end_year_outcome: null,
        rating: null,
      },
    ],
    mid_year_review: {
      date: "2026-02-08",
      overall_progress: "good",
      evidence_notes:
        "Emma is making strong progress against all Teachers' Standards.",
      reviewer_comments: "On track for successful completion of ECT induction.",
      completed: true,
    },
    end_year_review: null,
    cpd_completed: [
      {
        title: "ECT Induction Programme - Term 1",
        date: "2025-12-15",
        provider: "Teaching School Hub",
      },
      {
        title: "ECT Induction Programme - Term 2",
        date: "2026-03-01",
        provider: "Teaching School Hub",
      },
    ],
    cpd_planned: [
      {
        title: "ECT Induction Programme - Term 3",
        date: "2026-06-01",
        provider: "Teaching School Hub",
      },
    ],
    observations: [
      {
        date: "2025-10-15",
        focus: "Lesson structure",
        judgement: "satisfactory",
        feedback:
          "Clear objectives but needs to check understanding more regularly.",
      },
      {
        date: "2026-01-22",
        focus: "Behaviour management",
        judgement: "good",
        feedback: "Excellent improvement. Calm, consistent approach.",
      },
      {
        date: "2026-03-08",
        focus: "Adaptive teaching",
        judgement: "good",
        feedback: "Good differentiation for SEND students.",
      },
    ],
    pay_recommendation: null,
    is_ect: true,
    ect_term: 4,
    ect_mentor: "Dr. Patricia Okonkwo",
    ect_assessments: [
      {
        term: 1,
        date: "2025-10-31",
        outcome: "on_track",
        assessor: "Mark Stevens",
      },
      {
        term: 2,
        date: "2025-12-19",
        outcome: "on_track",
        assessor: "Mark Stevens",
      },
      {
        term: 3,
        date: "2026-03-07",
        outcome: "on_track",
        assessor: "Mark Stevens",
      },
    ],
    ect_teachers_standards: {
      ts1_expectations: "met",
      ts2_progress: "met",
      ts3_subject: "working_towards",
      ts4_planning: "met",
      ts5_adapt: "working_towards",
      ts6_assessment: "working_towards",
      ts7_behaviour: "met",
      ts8_professional: "met",
    },
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-03-08T00:00:00Z",
  },
  {
    id: "demo-appraisal-4",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "James Wilson",
    staff_email: "j.wilson@school.example",
    role: "Deputy Headteacher",
    role_type: "leader",
    pay_scale: "L18",
    appraiser_name: "Margaret Thornton (HT)",
    status: "end_year_review",
    objectives: [
      {
        id: "obj-8",
        title: "Lead whole-school attendance strategy",
        description: "Reduce persistent absence from 18% to below 14%",
        sdp_link: "Improve attendance",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "PA reduced to 15.2% - on track",
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-9",
        title: "Develop middle leader capacity",
        description:
          "Implement structured middle leader development programme for 8 HoDs",
        sdp_link: "Leadership development",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Programme running, 6 of 8 HoDs engaged",
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-10",
        title: "Embed new behaviour policy",
        description:
          "Full implementation of revised behaviour policy with staff buy-in measured at 85%+",
        sdp_link: "Behaviour and attitudes",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Policy embedded, staff survey shows 88% buy-in",
        end_year_outcome: null,
        rating: null,
      },
    ],
    mid_year_review: {
      date: "2026-02-05",
      overall_progress: "outstanding",
      evidence_notes:
        "Exceptional progress across all objectives. Attendance strategy particularly impactful.",
      reviewer_comments:
        "James continues to demonstrate outstanding leadership.",
      completed: true,
    },
    end_year_review: null,
    cpd_completed: [
      {
        title: "NPQ Headship",
        date: "2025-11-01",
        provider: "Ambition Institute",
      },
    ],
    cpd_planned: [],
    observations: [],
    pay_recommendation: null,
    is_ect: false,
    ect_term: null,
    ect_mentor: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-02-05T00:00:00Z",
  },
  {
    id: "demo-appraisal-5",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "Priya Sharma",
    staff_email: "p.sharma@school.example",
    role: "Head of Year 9",
    role_type: "teacher",
    pay_scale: "UPS 1",
    appraiser_name: "James Wilson",
    status: "objectives_set",
    objectives: [
      {
        id: "obj-11",
        title: "Improve Year 9 option choices process",
        description:
          "Redesign options process with improved careers guidance integration",
        sdp_link: "Personal development",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: null,
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-12",
        title: "Reduce fixed-term exclusions in Year 9",
        description:
          "Reduce FTE from 12 to below 6 through restorative approaches",
        sdp_link: "Behaviour and attitudes",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: null,
        end_year_outcome: null,
        rating: null,
      },
    ],
    mid_year_review: null,
    end_year_review: null,
    cpd_completed: [],
    cpd_planned: [
      {
        title: "Restorative Practice Level 2",
        date: "2026-04-20",
        provider: "Local Authority",
      },
    ],
    observations: [
      {
        date: "2025-11-20",
        focus: "Pastoral lesson delivery",
        judgement: "good",
        feedback: "Engaging PSHE session on healthy relationships.",
      },
    ],
    pay_recommendation: null,
    is_ect: false,
    ect_term: null,
    ect_mentor: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2025-10-30T00:00:00Z",
  },
  {
    id: "demo-appraisal-6",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "Tom Baker",
    staff_email: "t.baker@school.example",
    role: "ECT - Teacher of History",
    role_type: "teacher",
    pay_scale: "MPS 1",
    appraiser_name: "Sarah Mitchell",
    status: "mid_year_review",
    objectives: [
      {
        id: "obj-13",
        title: "Develop strong subject knowledge for GCSE",
        description:
          "Complete all GCSE History modules with confidence, evidenced by scheme of work annotations",
        sdp_link: "Quality of education",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Good progress - 3 of 4 modules completed",
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-14",
        title: "Build effective assessment practice",
        description:
          "Use formative assessment consistently, with student feedback showing improvement",
        sdp_link: "Quality of education",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Developing well with mentor support",
        end_year_outcome: null,
        rating: null,
      },
    ],
    mid_year_review: {
      date: "2026-02-14",
      overall_progress: "good",
      evidence_notes:
        "Tom is developing well as an ECT. Subject knowledge is a strength.",
      reviewer_comments: "On track for successful completion.",
      completed: true,
    },
    end_year_review: null,
    cpd_completed: [
      {
        title: "ECT Induction - Term 1",
        date: "2025-12-15",
        provider: "Teaching School Hub",
      },
      {
        title: "ECT Induction - Term 2",
        date: "2026-03-01",
        provider: "Teaching School Hub",
      },
    ],
    cpd_planned: [],
    observations: [
      {
        date: "2025-11-05",
        focus: "Explanation and modelling",
        judgement: "good",
        feedback: "Strong subject knowledge evident.",
      },
      {
        date: "2026-02-01",
        focus: "Assessment for learning",
        judgement: "good",
        feedback: "Effective use of exit tickets.",
      },
    ],
    pay_recommendation: null,
    is_ect: true,
    ect_term: 4,
    ect_mentor: "Sarah Mitchell",
    ect_assessments: [
      {
        term: 1,
        date: "2025-10-31",
        outcome: "on_track",
        assessor: "Sarah Mitchell",
      },
      {
        term: 2,
        date: "2025-12-19",
        outcome: "on_track",
        assessor: "Sarah Mitchell",
      },
      {
        term: 3,
        date: "2026-03-07",
        outcome: "on_track",
        assessor: "Sarah Mitchell",
      },
    ],
    ect_teachers_standards: {
      ts1_expectations: "met",
      ts2_progress: "working_towards",
      ts3_subject: "met",
      ts4_planning: "met",
      ts5_adapt: "working_towards",
      ts6_assessment: "working_towards",
      ts7_behaviour: "met",
      ts8_professional: "met",
    },
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-03-07T00:00:00Z",
  },
  {
    id: "demo-appraisal-7",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "Karen Phillips",
    staff_email: "k.phillips@school.example",
    role: "SENCO",
    role_type: "leader",
    pay_scale: "UPS 3 + TLR 1",
    appraiser_name: "Margaret Thornton (HT)",
    status: "pay_recommendation",
    objectives: [
      {
        id: "obj-15",
        title: "Implement graduated approach across school",
        description:
          "Ensure all teachers use the graduated approach consistently",
        sdp_link: "SEND provision",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress:
          "80% of teachers trained, audit shows 70% compliance",
        end_year_outcome:
          "All teachers trained. Audit shows 92% compliance. External review commended approach.",
        rating: "exceptional",
      },
      {
        id: "obj-16",
        title: "Reduce EHCP assessment waiting times",
        description:
          "Work with LA to reduce waiting time from 26 weeks to 20 weeks",
        sdp_link: "SEND provision",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress:
          "Average now 23 weeks through improved submission quality",
        end_year_outcome:
          "Average 19 weeks achieved. New submission template created and shared with LA.",
        rating: "exceptional",
      },
    ],
    mid_year_review: {
      date: "2026-02-03",
      overall_progress: "outstanding",
      evidence_notes:
        "Karen has driven transformational improvement in SEND provision.",
      reviewer_comments:
        "Outstanding progress. Should be considered for UPS progression.",
      completed: true,
    },
    end_year_review: {
      date: "2026-07-10",
      overall_rating: "exceptional",
      evidence_summary:
        "All objectives exceeded. External SEND review rated provision as outstanding. Staff confidence in SEND significantly improved.",
      reviewer_comments: "Exceptional year. Recommending pay progression.",
      areas_for_development:
        "Consider pursuing NASENCO accreditation. Develop succession planning for SEND team.",
      completed: true,
    },
    cpd_completed: [
      { title: "NASENCO Module 1", date: "2025-10-01", provider: "UCL" },
      { title: "NASENCO Module 2", date: "2026-01-15", provider: "UCL" },
      {
        title: "Autism Education Trust Training",
        date: "2026-03-10",
        provider: "AET",
      },
    ],
    cpd_planned: [],
    observations: [
      {
        date: "2026-01-18",
        focus: "SEND review meeting",
        judgement: "outstanding",
        feedback: "Excellent person-centred approach.",
      },
    ],
    pay_recommendation: {
      type: "progression",
      current_scale: "UPS 3 + TLR 1",
      recommended_scale: "UPS 3 + TLR 1 (maintained)",
      justification:
        "Exceptional performance across all objectives. Graduated approach now embedded school-wide.",
      status: "pending_headteacher",
      submitted_date: "2026-07-12",
    },
    is_ect: false,
    ect_term: null,
    ect_mentor: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-07-12T00:00:00Z",
  },
  {
    id: "demo-appraisal-8",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "Michael Obi",
    staff_email: "m.obi@school.example",
    role: "Teacher of PE",
    role_type: "teacher",
    pay_scale: "MPS 6",
    appraiser_name: "James Wilson",
    status: "pay_recommendation",
    objectives: [
      {
        id: "obj-17",
        title: "Develop extra-curricular sport programme",
        description:
          "Increase student participation in after-school sports by 30%",
        sdp_link: "Personal development",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Participation up 25% with new clubs added",
        end_year_outcome:
          "Participation up 42%. 3 new clubs established. School Games Gold achieved.",
        rating: "good",
      },
      {
        id: "obj-18",
        title: "Improve GCSE PE theory outcomes",
        description: "Raise Grade 5+ from 55% to 65%",
        sdp_link: "Raise attainment",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Mock results at 60%",
        end_year_outcome: "Final results: 68% at Grade 5+. Target exceeded.",
        rating: "good",
      },
    ],
    mid_year_review: {
      date: "2026-02-10",
      overall_progress: "good",
      evidence_notes: "Michael has made good progress on both objectives.",
      reviewer_comments:
        "Strong contribution to school life beyond the classroom.",
      completed: true,
    },
    end_year_review: {
      date: "2026-07-08",
      overall_rating: "good",
      evidence_summary:
        "Both objectives met/exceeded. Strong extra-curricular contribution. Good GCSE results.",
      reviewer_comments:
        "Consistently good performance. Ready for UPS threshold.",
      areas_for_development: "Develop assessment practice in core PE lessons.",
      completed: true,
    },
    cpd_completed: [
      { title: "AfPE Conference", date: "2025-11-05", provider: "AfPE" },
    ],
    cpd_planned: [],
    observations: [
      {
        date: "2025-11-12",
        focus: "Practical lesson - Basketball",
        judgement: "good",
        feedback: "Excellent pace and challenge.",
      },
      {
        date: "2026-05-20",
        focus: "Theory lesson - Anatomy",
        judgement: "good",
        feedback: "Good use of models and retrieval practice.",
      },
    ],
    pay_recommendation: {
      type: "ups_threshold",
      current_scale: "MPS 6",
      recommended_scale: "UPS 1",
      justification:
        "Sustained good performance over 2 years. Substantial contribution to wider school life. Ready for UPS.",
      status: "pending_headteacher",
      submitted_date: "2026-07-10",
    },
    is_ect: false,
    ect_term: null,
    ect_mentor: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-07-10T00:00:00Z",
  },
  {
    id: "demo-appraisal-9",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "Lisa Thompson",
    staff_email: "l.thompson@school.example",
    role: "Head of Mathematics",
    role_type: "leader",
    pay_scale: "UPS 2 + TLR 2",
    appraiser_name: "James Wilson",
    status: "end_year_review",
    objectives: [
      {
        id: "obj-19",
        title: "Raise KS4 Maths attainment",
        description: "Increase Grade 4+ from 62% to 70%",
        sdp_link: "Raise attainment in Mathematics",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Mocks at 65% - on track",
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-20",
        title: "Develop department CPD programme",
        description:
          "Implement structured CPD for maths team including lesson study",
        sdp_link: "Staff development",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "2 lesson study cycles completed",
        end_year_outcome: null,
        rating: null,
      },
    ],
    mid_year_review: {
      date: "2026-02-07",
      overall_progress: "good",
      evidence_notes:
        "Good progress. Lesson study having positive impact on department culture.",
      reviewer_comments:
        "Lisa has developed a strong collaborative culture in Maths.",
      completed: true,
    },
    end_year_review: null,
    cpd_completed: [
      {
        title: "NCETM Secondary PD Lead",
        date: "2025-10-12",
        provider: "NCETM",
      },
    ],
    cpd_planned: [],
    observations: [
      {
        date: "2025-12-03",
        focus: "Mixed attainment teaching",
        judgement: "good",
        feedback: "Effective use of varied tasks for challenge.",
      },
    ],
    pay_recommendation: null,
    is_ect: false,
    ect_term: null,
    ect_mentor: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-02-07T00:00:00Z",
  },
  {
    id: "demo-appraisal-10",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "Angela Foster",
    staff_email: "a.foster@school.example",
    role: "Office Manager",
    role_type: "support",
    pay_scale: "SCP 18",
    appraiser_name: "Margaret Thornton (HT)",
    status: "pay_recommendation",
    objectives: [
      {
        id: "obj-21",
        title: "Implement new MIS system",
        description:
          "Lead migration from SIMS to Arbor with minimal disruption",
        sdp_link: "School infrastructure",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress:
          "Migration 80% complete, staff trained on core modules",
        end_year_outcome:
          "Migration complete. All staff trained. Parent app launched. Zero data loss.",
        rating: "exceptional",
      },
      {
        id: "obj-22",
        title: "Streamline admissions process",
        description:
          "Reduce admissions processing time by 40% through digital forms",
        sdp_link: "School infrastructure",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Digital forms live, processing time reduced 25%",
        end_year_outcome:
          "Processing time reduced 50%. Parent satisfaction improved significantly.",
        rating: "good",
      },
    ],
    mid_year_review: {
      date: "2026-02-06",
      overall_progress: "outstanding",
      evidence_notes: "Angela has managed the MIS migration brilliantly.",
      reviewer_comments: "Exceptional project management skills demonstrated.",
      completed: true,
    },
    end_year_review: {
      date: "2026-07-05",
      overall_rating: "good",
      evidence_summary:
        "Both objectives met/exceeded. MIS migration was a significant undertaking managed exceptionally well.",
      reviewer_comments:
        "Outstanding contribution to school operations this year.",
      areas_for_development: "Develop skills in data analysis and reporting.",
      completed: true,
    },
    cpd_completed: [
      {
        title: "Arbor MIS Admin Training",
        date: "2025-09-20",
        provider: "Arbor Education",
      },
      { title: "GDPR Refresher", date: "2026-01-10", provider: "SchoolBus" },
    ],
    cpd_planned: [],
    observations: [],
    pay_recommendation: {
      type: "increment",
      current_scale: "SCP 18",
      recommended_scale: "SCP 19",
      justification:
        "Excellent performance. MIS migration managed superbly. Consistently exceeds expectations.",
      status: "pending_governors",
      submitted_date: "2026-07-08",
    },
    is_ect: false,
    ect_term: null,
    ect_mentor: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-07-08T00:00:00Z",
  },
  {
    id: "demo-appraisal-11",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "Robert Hayes",
    staff_email: "r.hayes@school.example",
    role: "Site Manager",
    role_type: "support",
    pay_scale: "SCP 14",
    appraiser_name: "Angela Foster",
    status: "objectives_set",
    objectives: [
      {
        id: "obj-23",
        title: "Complete fire safety remediation works",
        description:
          "Oversee completion of all fire safety actions from recent audit",
        sdp_link: "Health and safety",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: null,
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-24",
        title: "Reduce energy costs by 15%",
        description:
          "Implement energy-saving measures including LED lighting and heating controls",
        sdp_link: "Financial sustainability",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: null,
        end_year_outcome: null,
        rating: null,
      },
    ],
    mid_year_review: null,
    end_year_review: null,
    cpd_completed: [
      { title: "IOSH Managing Safely", date: "2025-10-25", provider: "IOSH" },
    ],
    cpd_planned: [],
    observations: [],
    pay_recommendation: null,
    is_ect: false,
    ect_term: null,
    ect_mentor: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2025-10-31T00:00:00Z",
  },
  {
    id: "demo-appraisal-12",
    cycle_id: "demo-cycle-2025",
    organization_id: "demo",
    staff_name: "Margaret Thornton",
    staff_email: "m.thornton@school.example",
    role: "Headteacher",
    role_type: "leader",
    pay_scale: "L21",
    appraiser_name: "Chair of Governors",
    status: "mid_year_review",
    objectives: [
      {
        id: "obj-25",
        title: "Improve overall Progress 8 score",
        description: "Raise P8 from -0.15 to at least +0.1",
        sdp_link: "School improvement",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Internal predictions suggest P8 around +0.05",
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-26",
        title: "Prepare school for Ofsted inspection",
        description:
          "Ensure all documentation, evidence, and staff preparation is complete",
        sdp_link: "Quality assurance",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "Mock inspection completed. Action plan in place.",
        end_year_outcome: null,
        rating: null,
      },
      {
        id: "obj-27",
        title: "Reduce persistent absence to below national",
        description: "Reduce PA from 18% to below 15% (national average)",
        sdp_link: "Attendance improvement",
        smart_criteria: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          time_bound: true,
        },
        mid_year_progress: "PA at 15.2% - strong progress",
        end_year_outcome: null,
        rating: null,
      },
    ],
    mid_year_review: {
      date: "2026-01-28",
      overall_progress: "good",
      evidence_notes:
        "School is making good progress under Margaret's leadership. Attendance improvement is notable.",
      reviewer_comments: "Governors are pleased with the direction of travel.",
      completed: true,
    },
    end_year_review: null,
    cpd_completed: [
      {
        title: "DfE Headteacher Standards Briefing",
        date: "2025-11-20",
        provider: "DfE",
      },
    ],
    cpd_planned: [],
    observations: [],
    pay_recommendation: null,
    is_ect: false,
    ect_term: null,
    ect_mentor: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-01-28T00:00:00Z",
  },
];

/**
 * GET /api/performance/appraisals
 * Return appraisals, optionally filtered by cycle, status, role_type
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const url = new URL(request.url);
  const cycleId = url.searchParams.get("cycle_id");
  const status = url.searchParams.get("status");
  const roleType = url.searchParams.get("role_type");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("staff_appraisals")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (cycleId) query = query.eq("cycle_id", cycleId);
  if (status) query = query.eq("status", status);
  if (roleType) query = query.eq("role_type", roleType);

  const { data, error } = await query;

  if (error) {
    console.error("[Performance Appraisals] DB error:", error);
  }

  // Return demo data if no real data
  if (!data || data.length === 0) {
    let filtered = [...DEMO_APPRAISALS];
    if (cycleId && cycleId !== "demo-cycle-2025") filtered = [];
    if (status) filtered = filtered.filter((a) => a.status === status);
    if (roleType) filtered = filtered.filter((a) => a.role_type === roleType);
    return apiSuccess({ appraisals: filtered, demo: true });
  }

  return apiSuccess({ appraisals: data, demo: false });
});

/**
 * POST /api/performance/appraisals
 * Create a new appraisal
 */
export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const body = await request.json();

  const {
    cycle_id,
    staff_name,
    staff_email,
    role,
    role_type,
    pay_scale,
    appraiser_name,
    is_ect,
    ect_mentor,
  } = body;

  if (!cycle_id || !staff_name || !role) {
    return apiError("Cycle, staff name, and role are required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("staff_appraisals")
    .insert({
      cycle_id,
      organization_id: organizationId,
      staff_name,
      staff_email: staff_email || null,
      role,
      role_type: role_type || "teacher",
      pay_scale: pay_scale || null,
      appraiser_name: appraiser_name || null,
      status: "not_started",
      objectives: [],
      mid_year_review: null,
      end_year_review: null,
      cpd_completed: [],
      cpd_planned: [],
      observations: [],
      pay_recommendation: null,
      is_ect: is_ect || false,
      ect_term: null,
      ect_mentor: ect_mentor || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[Performance Appraisals] Create error:", error);
    return apiError("Failed to create appraisal", 500);
  }

  return apiSuccess(data, 201);
});
