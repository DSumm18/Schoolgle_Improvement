"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Eye,
  ShieldCheck,
  HardHat,
  Calendar,
  Clock,
  FileText,
  Lightbulb,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Star,
  ArrowLeft,
  Sparkles,
  Grid3X3,
  List,
  X,
  Check,
  User,
} from "lucide-react";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { useAuth } from "@/context/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// =====================================================
// TYPES
// =====================================================

type VisitTypeId =
  | "learning_walk"
  | "monitoring"
  | "health_and_safety"
  | "governor_day";

type FocusArea =
  | "quality_of_education"
  | "behaviour"
  | "personal_development"
  | "leadership"
  | "safeguarding"
  | "send"
  | "pupil_premium"
  | "curriculum_subject";

type RAGRating = "green" | "amber" | "red";

type OfstedCategory =
  | "Quality of Education"
  | "Behaviour & Attitudes"
  | "Personal Development"
  | "Leadership & Management"
  | "Safeguarding";

interface VisitAction {
  action: string;
  owner: string;
  deadline: string;
  completed: boolean;
}

interface PlannedVisit {
  id: string;
  visitType: VisitTypeId;
  date: string;
  time: string;
  focusArea: FocusArea;
  rooms: string[];
  staffToMeet: string;
  selectedQuestions: string[];
  documentsToReview: string[];
  status: "planned" | "completed";
  // Record fields (after visit)
  strengths?: string;
  areasForDevelopment?: string;
  actions?: VisitAction[];
  ragRating?: RAGRating;
  evidenceTags?: OfstedCategory[];
  signatureName?: string;
  signatureDate?: string;
  governorName: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const VISIT_TYPES: {
  id: VisitTypeId;
  label: string;
  description: string;
  icon: typeof Eye;
  color: string;
  bgColor: string;
}[] = [
  {
    id: "learning_walk",
    label: "Learning Walk",
    description: "Observe teaching across subjects and year groups",
    icon: Eye,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  {
    id: "monitoring",
    label: "Monitoring Visit",
    description: "Check a specific area: safeguarding, SEND, PP, curriculum",
    icon: ClipboardList,
    color: "text-violet-600",
    bgColor: "bg-violet-50 border-violet-200",
  },
  {
    id: "health_and_safety",
    label: "Health & Safety",
    description: "Premises walkabout with caretaker",
    icon: HardHat,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
  {
    id: "governor_day",
    label: "Governor Day",
    description: "Full day shadowing to experience school life",
    icon: Star,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
  },
];

const FOCUS_AREAS: { id: FocusArea; label: string }[] = [
  { id: "quality_of_education", label: "Quality of Education" },
  { id: "behaviour", label: "Behaviour & Attitudes" },
  { id: "personal_development", label: "Personal Development" },
  { id: "leadership", label: "Leadership & Management" },
  { id: "safeguarding", label: "Safeguarding" },
  { id: "send", label: "SEND" },
  { id: "pupil_premium", label: "Pupil Premium" },
  { id: "curriculum_subject", label: "Curriculum Subject" },
];

const OFSTED_CATEGORIES: OfstedCategory[] = [
  "Quality of Education",
  "Behaviour & Attitudes",
  "Personal Development",
  "Leadership & Management",
  "Safeguarding",
];

const SUGGESTED_QUESTIONS: Record<FocusArea, string[]> = {
  quality_of_education: [
    "How do you ensure curriculum coherence across year groups?",
    "What does retrieval practice look like in your subject?",
    "How do you identify and address gaps in learning?",
    "What CPD have you undertaken recently to improve your practice?",
    "How do you adapt the curriculum for disadvantaged pupils?",
    "Can you explain how the curriculum builds on prior knowledge?",
    "What does effective feedback look like in your classroom?",
    "How do you know pupils are making progress?",
  ],
  behaviour: [
    "How is the school's behaviour policy consistently applied?",
    "What strategies are used to support pupils with challenging behaviour?",
    "How do you create a positive learning environment?",
    "What does the school do to improve attendance?",
    "How are persistent absentees supported?",
    "Can you describe how bullying incidents are recorded and followed up?",
    "How do pupils understand expectations for behaviour?",
    "What is the impact of the rewards system?",
  ],
  personal_development: [
    "How does the school promote pupils' spiritual, moral, social and cultural development?",
    "What enrichment opportunities are available beyond the curriculum?",
    "How do you prepare pupils for life in modern Britain?",
    "What is the school's approach to teaching about protected characteristics?",
    "How do pupils develop their character and resilience?",
    "What careers education and guidance is provided?",
    "How do you promote healthy lifestyles, including mental health?",
    "What leadership opportunities do pupils have?",
  ],
  leadership: [
    "How does the leadership team monitor the quality of education?",
    "What is the school's approach to workload management?",
    "How do you ensure the school's vision is understood by all?",
    "What systems are in place for performance management?",
    "How do governors hold leaders to account?",
    "What is the succession planning strategy?",
    "How do you ensure financial sustainability?",
    "How are middle leaders developed?",
  ],
  safeguarding: [
    "Can you talk me through a recent concern and how it was handled?",
    "How are low-level concerns about staff recorded and monitored?",
    "What is the process for managing allegations against staff?",
    "How do you ensure all staff understand KCSIE requirements?",
    "What does the school do about online safety?",
    "How are vulnerable pupils identified and monitored?",
    "How often is the single central record (SCR) audited?",
    "What training do staff receive on specific safeguarding risks (county lines, FGM, radicalisation)?",
  ],
  send: [
    "How are EHCPs reviewed annually and who is involved?",
    "What does the graduated approach (assess, plan, do, review) look like in practice?",
    "How is the SEND budget allocated and monitored?",
    "How do you track the progress of SEND pupils?",
    "What is the relationship like with the local authority SEND team?",
    "How do you ensure quality first teaching meets SEND pupils' needs?",
    "What specialist provisions or interventions are in place?",
    "How are parents of SEND pupils involved in decision-making?",
  ],
  pupil_premium: [
    "How is the pupil premium strategy reviewed for impact?",
    "What evidence shows the gap is narrowing between PP and non-PP pupils?",
    "How do you identify the specific barriers facing disadvantaged pupils?",
    "What is the school's approach to PP spending on enrichment vs academic support?",
    "How do you ensure PP funding reaches the intended pupils?",
    "What monitoring shows PP pupils are making expected progress?",
    "How are PP pupils represented in higher-attaining groups?",
    "What is the school's attendance data for PP pupils?",
  ],
  curriculum_subject: [
    "What is the intent of this subject's curriculum?",
    "How is the curriculum sequenced to build on prior learning?",
    "What assessment do you use to check pupils understand key concepts?",
    "How do you adapt lessons for different abilities?",
    "What does excellent work look like in this subject?",
    "How are reading and vocabulary developed within this subject?",
    "What CPD have you accessed for this subject?",
    "How does this subject contribute to pupils' broader development?",
  ],
};

const DOCUMENTS_CHECKLIST = [
  "School Development Plan (SDP)",
  "Self-Evaluation Form (SEF)",
  "Behaviour Policy",
  "Safeguarding Policy",
  "SEND Policy & Information Report",
  "Pupil Premium Strategy",
  "Attendance Data",
  "Assessment Data / Progress Tracking",
  "Single Central Record",
  "Staff Training Records",
  "Curriculum Maps",
  "Governor Meeting Minutes",
];

const SAMPLE_ROOMS = [
  "Year 1 Classroom",
  "Year 2 Classroom",
  "Year 3 Classroom",
  "Year 4 Classroom",
  "Year 5 Classroom",
  "Year 6 Classroom",
  "Reception Classroom",
  "Nursery",
  "Hall",
  "Library",
  "ICT Suite",
  "Staff Room",
  "Head's Office",
  "SEND Room",
  "Outdoor Area",
  "Kitchen",
];

// =====================================================
// DEMO DATA
// =====================================================

const DEMO_VISITS: PlannedVisit[] = [
  {
    id: "visit-1",
    visitType: "learning_walk",
    date: "2026-01-15",
    time: "09:00",
    focusArea: "quality_of_education",
    rooms: ["Year 3 Classroom", "Year 5 Classroom", "Year 6 Classroom"],
    staffToMeet: "Mrs Thompson (Maths Lead), Mr Patel (Y5 Teacher)",
    selectedQuestions: [
      "How do you ensure curriculum coherence across year groups?",
      "What does retrieval practice look like in your subject?",
      "How do you know pupils are making progress?",
    ],
    documentsToReview: [
      "Curriculum Maps",
      "Assessment Data / Progress Tracking",
    ],
    status: "completed",
    strengths:
      "Strong use of retrieval practice observed across all three classrooms. Year 5 displayed excellent questioning techniques. Curriculum maps show clear progression in mathematical concepts from Year 3 to Year 6. Pupils could articulate what they were learning and why.",
    areasForDevelopment:
      "Year 3 pupils would benefit from more opportunities to explain their reasoning verbally. Some inconsistency in the use of mathematical vocabulary walls across classrooms.",
    actions: [
      {
        action:
          "Maths Lead to create vocabulary expectations document for each year group",
        owner: "Mrs Thompson",
        deadline: "2026-02-28",
        completed: true,
      },
      {
        action:
          "Peer observation programme for Y3 staff on questioning techniques",
        owner: "Mr Patel",
        deadline: "2026-03-15",
        completed: false,
      },
    ],
    ragRating: "green",
    evidenceTags: ["Quality of Education"],
    signatureName: "Sarah Mitchell",
    signatureDate: "2026-01-15",
    governorName: "Sarah Mitchell",
  },
  {
    id: "visit-2",
    visitType: "monitoring",
    date: "2025-11-20",
    time: "10:00",
    focusArea: "safeguarding",
    rooms: ["Head's Office", "Staff Room", "Reception Classroom"],
    staffToMeet: "Mrs Adams (DSL), Miss Clarke (Deputy DSL)",
    selectedQuestions: [
      "Can you talk me through a recent concern and how it was handled?",
      "How are low-level concerns about staff recorded and monitored?",
      "How often is the single central record (SCR) audited?",
    ],
    documentsToReview: [
      "Safeguarding Policy",
      "Single Central Record",
      "Staff Training Records",
    ],
    status: "completed",
    strengths:
      "SCR fully compliant and regularly audited. DSL was able to articulate clear process for handling concerns. All staff had completed KCSIE training. Low-level concerns log was thorough and well-maintained. The school culture around safeguarding is strong.",
    areasForDevelopment:
      "Some supply staff files had gaps in identity verification. Online safety training for parents could be expanded. CPOMS entries, whilst thorough, could include more specific chronology detail.",
    actions: [
      {
        action:
          "Implement supply staff induction checklist with ID verification step",
        owner: "Mrs Adams",
        deadline: "2025-12-15",
        completed: true,
      },
      {
        action: "Arrange parent online safety workshop",
        owner: "Miss Clarke",
        deadline: "2026-01-31",
        completed: true,
      },
    ],
    ragRating: "green",
    evidenceTags: ["Safeguarding", "Leadership & Management"],
    signatureName: "James Henderson",
    signatureDate: "2025-11-20",
    governorName: "James Henderson",
  },
  {
    id: "visit-3",
    visitType: "monitoring",
    date: "2025-10-08",
    time: "13:30",
    focusArea: "send",
    rooms: ["SEND Room", "Year 2 Classroom", "Year 4 Classroom"],
    staffToMeet: "Mrs Green (SENCO), Miss Brown (TA Lead)",
    selectedQuestions: [
      "How are EHCPs reviewed annually and who is involved?",
      "What does the graduated approach look like in practice?",
      "How do you track the progress of SEND pupils?",
    ],
    documentsToReview: [
      "SEND Policy & Information Report",
      "Assessment Data / Progress Tracking",
    ],
    status: "completed",
    strengths:
      "SENCO has clear systems for tracking SEND pupils. Graduated approach is well-understood by class teachers. TAs are effectively deployed and trained. EHCP annual reviews are timely with good parental involvement.",
    areasForDevelopment:
      "Provision mapping could be more detailed to show impact of interventions. Some class teachers less confident in adapting quality first teaching for SEND pupils. Progress data for SEND pupils not consistently shared with governors.",
    actions: [
      {
        action: "Redesign provision map template to include impact measures",
        owner: "Mrs Green",
        deadline: "2026-01-15",
        completed: false,
      },
      {
        action:
          "SEND progress report to be standing item at full governing body meetings",
        owner: "Mrs Green",
        deadline: "2025-11-01",
        completed: true,
      },
    ],
    ragRating: "amber",
    evidenceTags: ["Quality of Education", "Leadership & Management"],
    signatureName: "Priya Sharma",
    signatureDate: "2025-10-08",
    governorName: "Priya Sharma",
  },
  {
    id: "visit-4",
    visitType: "health_and_safety",
    date: "2025-09-12",
    time: "08:30",
    focusArea: "safeguarding",
    rooms: ["Hall", "Kitchen", "Outdoor Area", "Nursery", "ICT Suite"],
    staffToMeet: "Mr Davies (Site Manager)",
    selectedQuestions: [
      "What is the process for managing allegations against staff?",
      "How do you ensure all staff understand KCSIE requirements?",
    ],
    documentsToReview: ["Behaviour Policy", "Safeguarding Policy"],
    status: "completed",
    strengths:
      "Premises well-maintained. Fire doors and escape routes clear. First aid kits fully stocked. Playground equipment recently inspected. Kitchen hygiene rating 5. Visitor sign-in procedures robust.",
    areasForDevelopment:
      "Some external fencing showing signs of wear near the car park. Emergency lighting test records need updating. Risk assessment for the pond area needs reviewing ahead of spring term.",
    actions: [
      {
        action: "Obtain quotes for perimeter fencing repair",
        owner: "Mr Davies",
        deadline: "2025-10-15",
        completed: true,
      },
      {
        action: "Schedule emergency lighting testing and update records",
        owner: "Mr Davies",
        deadline: "2025-09-30",
        completed: true,
      },
      {
        action: "Review pond area risk assessment",
        owner: "Mr Davies",
        deadline: "2026-03-01",
        completed: false,
      },
    ],
    ragRating: "green",
    evidenceTags: ["Leadership & Management", "Safeguarding"],
    signatureName: "David Okonkwo",
    signatureDate: "2025-09-12",
    governorName: "David Okonkwo",
  },
  {
    id: "visit-5",
    visitType: "governor_day",
    date: "2025-12-05",
    time: "08:00",
    focusArea: "personal_development",
    rooms: [
      "Reception Classroom",
      "Hall",
      "Year 6 Classroom",
      "Library",
      "Staff Room",
    ],
    staffToMeet: "Mrs Wilson (Head), Mr Ali (PSHE Lead), Year 6 School Council",
    selectedQuestions: [
      "How does the school promote pupils' spiritual, moral, social and cultural development?",
      "What enrichment opportunities are available beyond the curriculum?",
      "How do you prepare pupils for life in modern Britain?",
      "What leadership opportunities do pupils have?",
    ],
    documentsToReview: [
      "School Development Plan (SDP)",
      "Self-Evaluation Form (SEF)",
    ],
    status: "completed",
    strengths:
      "Exceptional range of enrichment activities: music, drama, chess club, eco-council. School council is highly active with genuine pupil voice. SMSC evidenced throughout the school - displays, assemblies, and curriculum. Pupils are articulate, polite, and proud of their school. Strong values culture visible throughout the day.",
    areasForDevelopment:
      "Careers education could be more structured from KS1. Some pupils less aware of the wider world beyond their local community. After-school clubs have lower uptake among PP pupils.",
    actions: [
      {
        action: "Develop a whole-school careers education progression map",
        owner: "Mr Ali",
        deadline: "2026-04-01",
        completed: false,
      },
      {
        action: "PP champions initiative to encourage club attendance",
        owner: "Mrs Wilson",
        deadline: "2026-01-20",
        completed: false,
      },
    ],
    ragRating: "green",
    evidenceTags: ["Personal Development", "Leadership & Management"],
    signatureName: "Sarah Mitchell",
    signatureDate: "2025-12-05",
    governorName: "Sarah Mitchell",
  },
];

// =====================================================
// MAIN PAGE COMPONENT
// =====================================================

type ViewMode = "overview" | "plan" | "record" | "view";

export default function GovernorVisitsPage() {
  const { organization } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [activeTab, setActiveTab] = useState<"plan" | "past" | "coverage">(
    "plan",
  );
  const [visits, setVisits] = useState<PlannedVisit[]>(DEMO_VISITS);
  const [selectedVisit, setSelectedVisit] = useState<PlannedVisit | null>(null);

  // Plan form state
  const [planForm, setPlanForm] = useState<{
    visitType: VisitTypeId | "";
    date: string;
    time: string;
    focusArea: FocusArea | "";
    rooms: string[];
    staffToMeet: string;
    selectedQuestions: string[];
    documentsToReview: string[];
  }>({
    visitType: "",
    date: "",
    time: "09:00",
    focusArea: "",
    rooms: [],
    staffToMeet: "",
    selectedQuestions: [],
    documentsToReview: [],
  });

  // Record form state
  const [recordForm, setRecordForm] = useState({
    strengths: "",
    areasForDevelopment: "",
    actions: [] as VisitAction[],
    ragRating: "" as RAGRating | "",
    evidenceTags: [] as OfstedCategory[],
    signatureName: "",
    newAction: "",
    newActionOwner: "",
    newActionDeadline: "",
  });

  const pastVisits = useMemo(
    () =>
      visits
        .filter((v) => v.status === "completed")
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [visits],
  );

  const coverageMatrix = useMemo(() => {
    const matrix: Record<
      OfstedCategory,
      {
        lastVisit: string | null;
        governor: string | null;
        rating: RAGRating | null;
      }
    > = {
      "Quality of Education": {
        lastVisit: null,
        governor: null,
        rating: null,
      },
      "Behaviour & Attitudes": {
        lastVisit: null,
        governor: null,
        rating: null,
      },
      "Personal Development": {
        lastVisit: null,
        governor: null,
        rating: null,
      },
      "Leadership & Management": {
        lastVisit: null,
        governor: null,
        rating: null,
      },
      Safeguarding: { lastVisit: null, governor: null, rating: null },
    };

    pastVisits.forEach((visit) => {
      visit.evidenceTags?.forEach((tag) => {
        if (!matrix[tag].lastVisit || visit.date > matrix[tag].lastVisit!) {
          matrix[tag] = {
            lastVisit: visit.date,
            governor: visit.governorName,
            rating: visit.ragRating || null,
          };
        }
      });
    });

    return matrix;
  }, [pastVisits]);

  const gaps = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoff = sixMonthsAgo.toISOString().split("T")[0];

    return OFSTED_CATEGORIES.filter((cat) => {
      const entry = coverageMatrix[cat];
      return !entry.lastVisit || entry.lastVisit < cutoff;
    });
  }, [coverageMatrix]);

  const handleStartPlan = (visitType: VisitTypeId) => {
    setPlanForm({
      ...planForm,
      visitType,
      date: "",
      time: "09:00",
      focusArea: "",
      rooms: [],
      staffToMeet: "",
      selectedQuestions: [],
      documentsToReview: [],
    });
    setViewMode("plan");
  };

  const handleSavePlan = () => {
    if (!planForm.visitType || !planForm.date || !planForm.focusArea) {
      return;
    }

    const newVisit: PlannedVisit = {
      id: `visit-${Date.now()}`,
      visitType: planForm.visitType as VisitTypeId,
      date: planForm.date,
      time: planForm.time,
      focusArea: planForm.focusArea as FocusArea,
      rooms: planForm.rooms,
      staffToMeet: planForm.staffToMeet,
      selectedQuestions: planForm.selectedQuestions,
      documentsToReview: planForm.documentsToReview,
      status: "planned",
      governorName: "Current Governor",
    };

    setVisits([...visits, newVisit]);
    setViewMode("overview");
    setActiveTab("past");
  };

  const handleStartRecord = (visit: PlannedVisit) => {
    setSelectedVisit(visit);
    setRecordForm({
      strengths: visit.strengths || "",
      areasForDevelopment: visit.areasForDevelopment || "",
      actions: visit.actions || [],
      ragRating: visit.ragRating || "",
      evidenceTags: visit.evidenceTags || [],
      signatureName: visit.signatureName || "",
      newAction: "",
      newActionOwner: "",
      newActionDeadline: "",
    });
    setViewMode("record");
  };

  const handleSaveRecord = () => {
    if (!selectedVisit || !recordForm.ragRating) return;

    const updated = visits.map((v) =>
      v.id === selectedVisit.id
        ? {
            ...v,
            status: "completed" as const,
            strengths: recordForm.strengths,
            areasForDevelopment: recordForm.areasForDevelopment,
            actions: recordForm.actions,
            ragRating: recordForm.ragRating as RAGRating,
            evidenceTags: recordForm.evidenceTags,
            signatureName: recordForm.signatureName,
            signatureDate: new Date().toISOString().split("T")[0],
          }
        : v,
    );
    setVisits(updated);
    setSelectedVisit(null);
    setViewMode("overview");
    setActiveTab("past");
  };

  const handleAddAction = () => {
    if (
      !recordForm.newAction ||
      !recordForm.newActionOwner ||
      !recordForm.newActionDeadline
    )
      return;
    setRecordForm({
      ...recordForm,
      actions: [
        ...recordForm.actions,
        {
          action: recordForm.newAction,
          owner: recordForm.newActionOwner,
          deadline: recordForm.newActionDeadline,
          completed: false,
        },
      ],
      newAction: "",
      newActionOwner: "",
      newActionDeadline: "",
    });
  };

  // =====================================================
  // RENDER: PLAN VIEW
  // =====================================================

  if (viewMode === "plan") {
    const visitTypeInfo = VISIT_TYPES.find(
      (vt) => vt.id === planForm.visitType,
    );
    const suggestedQuestions = planForm.focusArea
      ? SUGGESTED_QUESTIONS[planForm.focusArea as FocusArea]
      : [];

    return (
      <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("overview")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            Plan a {visitTypeInfo?.label || "Visit"}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  Visit Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={planForm.date}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={planForm.time}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, time: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Focus Area *</Label>
                  <Select
                    value={planForm.focusArea}
                    onValueChange={(value) =>
                      setPlanForm({
                        ...planForm,
                        focusArea: value as FocusArea,
                        selectedQuestions: [],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select focus area..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FOCUS_AREAS.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rooms to Visit</Label>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_ROOMS.map((room) => (
                      <button
                        key={room}
                        type="button"
                        onClick={() =>
                          setPlanForm({
                            ...planForm,
                            rooms: planForm.rooms.includes(room)
                              ? planForm.rooms.filter((r) => r !== room)
                              : [...planForm.rooms, room],
                          })
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          planForm.rooms.includes(room)
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {room}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Staff to Meet</Label>
                  <Input
                    value={planForm.staffToMeet}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        staffToMeet: e.target.value,
                      })
                    }
                    placeholder="e.g., Mrs Thompson (Maths Lead), Mr Patel (Y5 Teacher)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI-Suggested Questions */}
            {planForm.focusArea && suggestedQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                    Suggested Questions
                    <Badge
                      variant="outline"
                      className="ml-2 text-violet-600 border-violet-200"
                    >
                      AI-curated
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-slate-500">
                    Select questions to include in your visit plan. These are
                    tailored to your focus area.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suggestedQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setPlanForm({
                            ...planForm,
                            selectedQuestions:
                              planForm.selectedQuestions.includes(question)
                                ? planForm.selectedQuestions.filter(
                                    (q) => q !== question,
                                  )
                                : [...planForm.selectedQuestions, question],
                          })
                        }
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          planForm.selectedQuestions.includes(question)
                            ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              planForm.selectedQuestions.includes(question)
                                ? "bg-violet-600 border-violet-600"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {planForm.selectedQuestions.includes(question) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm">{question}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents to Review */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Documents to Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {DOCUMENTS_CHECKLIST.map((doc) => (
                    <button
                      key={doc}
                      type="button"
                      onClick={() =>
                        setPlanForm({
                          ...planForm,
                          documentsToReview:
                            planForm.documentsToReview.includes(doc)
                              ? planForm.documentsToReview.filter(
                                  (d) => d !== doc,
                                )
                              : [...planForm.documentsToReview, doc],
                        })
                      }
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-colors ${
                        planForm.documentsToReview.includes(doc)
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          planForm.documentsToReview.includes(doc)
                            ? "bg-blue-600 border-blue-600"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {planForm.documentsToReview.includes(doc) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      {doc}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Visit Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  {planForm.date
                    ? new Date(planForm.date).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "No date selected"}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  {planForm.time || "No time set"}
                </div>
                {planForm.focusArea && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Lightbulb className="w-4 h-4" />
                    {
                      FOCUS_AREAS.find((f) => f.id === planForm.focusArea)
                        ?.label
                    }
                  </div>
                )}
                {planForm.rooms.length > 0 && (
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Rooms ({planForm.rooms.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {planForm.rooms.map((room) => (
                        <Badge
                          key={room}
                          variant="outline"
                          className="text-[10px]"
                        >
                          {room}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {planForm.selectedQuestions.length > 0 && (
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Questions ({planForm.selectedQuestions.length})
                    </p>
                    <ul className="space-y-1">
                      {planForm.selectedQuestions.map((q, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-500 dark:text-slate-400 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-violet-400"
                        >
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {planForm.documentsToReview.length > 0 && (
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Documents ({planForm.documentsToReview.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {planForm.documentsToReview.map((doc) => (
                        <Badge
                          key={doc}
                          variant="outline"
                          className="text-[10px]"
                        >
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 mt-3">
                  <Button
                    onClick={handleSavePlan}
                    disabled={
                      !planForm.visitType ||
                      !planForm.date ||
                      !planForm.focusArea
                    }
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Save Visit Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: RECORD VIEW
  // =====================================================

  if (viewMode === "record" && selectedVisit) {
    const visitTypeInfo = VISIT_TYPES.find(
      (vt) => vt.id === selectedVisit.visitType,
    );

    return (
      <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1000px] mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewMode("overview");
              setSelectedVisit(null);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Record Visit Findings</h1>
            <p className="text-sm text-slate-500">
              {visitTypeInfo?.label} -{" "}
              {new Date(selectedVisit.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Strengths Observed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={recordForm.strengths}
                onChange={(e) =>
                  setRecordForm({ ...recordForm, strengths: e.target.value })
                }
                placeholder="Describe the strengths you observed during this visit..."
                rows={5}
              />
            </CardContent>
          </Card>

          {/* Areas for Development */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Areas for Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={recordForm.areasForDevelopment}
                onChange={(e) =>
                  setRecordForm({
                    ...recordForm,
                    areasForDevelopment: e.target.value,
                  })
                }
                placeholder="Describe areas where improvement could be made..."
                rows={5}
              />
            </CardContent>
          </Card>

          {/* Agreed Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agreed Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recordForm.actions.length > 0 && (
                <div className="space-y-2">
                  {recordForm.actions.map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...recordForm.actions];
                          updated[idx] = {
                            ...updated[idx],
                            completed: !updated[idx].completed,
                          };
                          setRecordForm({ ...recordForm, actions: updated });
                        }}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          action.completed
                            ? "bg-emerald-600 border-emerald-600"
                            : "border-slate-300"
                        }`}
                      >
                        {action.completed && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${action.completed ? "line-through text-slate-400" : ""}`}
                        >
                          {action.action}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {action.owner}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{" "}
                            {new Date(action.deadline).toLocaleDateString(
                              "en-GB",
                              { day: "numeric", month: "short" },
                            )}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordForm({
                            ...recordForm,
                            actions: recordForm.actions.filter(
                              (_, i) => i !== idx,
                            ),
                          });
                        }}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Input
                    value={recordForm.newAction}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        newAction: e.target.value,
                      })
                    }
                    placeholder="Action to take..."
                  />
                </div>
                <Input
                  value={recordForm.newActionOwner}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      newActionOwner: e.target.value,
                    })
                  }
                  placeholder="Owner"
                />
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={recordForm.newActionDeadline}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        newActionDeadline: e.target.value,
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAction}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RAG Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Overall RAG Rating for Focus Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {(
                  [
                    {
                      value: "green",
                      label: "Green",
                      color: "bg-emerald-500",
                      desc: "Strong practice, meeting/exceeding expectations",
                    },
                    {
                      value: "amber",
                      label: "Amber",
                      color: "bg-amber-500",
                      desc: "Some good practice but areas for development",
                    },
                    {
                      value: "red",
                      label: "Red",
                      color: "bg-rose-500",
                      desc: "Significant concerns, urgent action needed",
                    },
                  ] as const
                ).map((rating) => (
                  <button
                    key={rating.value}
                    type="button"
                    onClick={() =>
                      setRecordForm({
                        ...recordForm,
                        ragRating: rating.value,
                      })
                    }
                    className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${
                      recordForm.ragRating === rating.value
                        ? "border-slate-900 dark:border-white shadow-lg"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full ${rating.color}`} />
                      <span className="font-semibold">{rating.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{rating.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evidence Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Ofsted Framework Evidence Tags
              </CardTitle>
              <p className="text-sm text-slate-500">
                Link this visit to Ofsted inspection framework categories.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {OFSTED_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setRecordForm({
                        ...recordForm,
                        evidenceTags: recordForm.evidenceTags.includes(cat)
                          ? recordForm.evidenceTags.filter((t) => t !== cat)
                          : [...recordForm.evidenceTags, cat],
                      })
                    }
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      recordForm.evidenceTags.includes(cat)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Governor Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={recordForm.signatureName}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        signatureName: e.target.value,
                      })
                    }
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={new Date().toISOString().split("T")[0]}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode("overview");
                setSelectedVisit(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRecord}
              disabled={!recordForm.ragRating || !recordForm.signatureName}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Visit Record
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: VIEW COMPLETED VISIT
  // =====================================================

  if (viewMode === "view" && selectedVisit) {
    const visitTypeInfo = VISIT_TYPES.find(
      (vt) => vt.id === selectedVisit.visitType,
    );
    const focusLabel =
      FOCUS_AREAS.find((f) => f.id === selectedVisit.focusArea)?.label || "";

    return (
      <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1000px] mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewMode("overview");
              setSelectedVisit(null);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{visitTypeInfo?.label}</h1>
            <p className="text-sm text-slate-500">
              {focusLabel} -{" "}
              {new Date(selectedVisit.date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {selectedVisit.ragRating && (
            <RAGBadge rating={selectedVisit.ragRating} size="lg" />
          )}
        </div>

        {/* Visit Info */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">
                  Governor
                </p>
                <p className="font-medium">{selectedVisit.governorName}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">
                  Time
                </p>
                <p className="font-medium">{selectedVisit.time}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">
                  Rooms Visited
                </p>
                <p className="font-medium">
                  {selectedVisit.rooms.join(", ") || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">
                  Staff Met
                </p>
                <p className="font-medium">
                  {selectedVisit.staffToMeet || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Asked */}
        {selectedVisit.selectedQuestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-violet-600" />
                Questions Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {selectedVisit.selectedQuestions.map((q, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <ChevronRight className="w-4 h-4 mt-0.5 text-violet-400 flex-shrink-0" />
                    {q}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Findings */}
        {selectedVisit.strengths && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Strengths Observed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {selectedVisit.strengths}
              </p>
            </CardContent>
          </Card>
        )}

        {selectedVisit.areasForDevelopment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Areas for Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {selectedVisit.areasForDevelopment}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {selectedVisit.actions && selectedVisit.actions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agreed Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedVisit.actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        action.completed
                          ? "bg-emerald-600 border-emerald-600"
                          : "border-slate-300"
                      }`}
                    >
                      {action.completed && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm ${action.completed ? "line-through text-slate-400" : ""}`}
                      >
                        {action.action}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {action.owner}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{" "}
                          {new Date(action.deadline).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                        {action.completed ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                            Done
                          </Badge>
                        ) : new Date(action.deadline) < new Date() ? (
                          <Badge className="bg-rose-100 text-rose-700 text-[10px]">
                            Overdue
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Evidence Tags & Signature */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs uppercase font-bold text-slate-500 mb-2">
                  Ofsted Evidence Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedVisit.evidenceTags?.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-blue-100 text-blue-700 border-blue-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-slate-500">Signed by</p>
                <p className="font-semibold">{selectedVisit.signatureName}</p>
                <p className="text-xs text-slate-400">
                  {selectedVisit.signatureDate &&
                    new Date(selectedVisit.signatureDate).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =====================================================
  // RENDER: OVERVIEW (DEFAULT)
  // =====================================================

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="governance"
        icon={ClipboardList}
        label="Governor Monitoring"
        title="Visit Planning"
      />

      {/* Visit Type Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Start a New Visit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VISIT_TYPES.map((vt) => {
            const Icon = vt.icon;
            return (
              <motion.div
                key={vt.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer border-2 hover:shadow-md transition-all ${vt.bgColor}`}
                  onClick={() => handleStartPlan(vt.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/50 ${vt.color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{vt.label}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {vt.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Gap Analysis Alert */}
      {gaps.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-400">
                  Coverage Gaps Detected
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                  The following Ofsted areas have not been visited by a governor
                  in the last 6 months: <strong>{gaps.join(", ")}</strong>.
                  Consider scheduling visits to cover these areas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(
          [
            { id: "past", label: "Past Visits", icon: List },
            { id: "coverage", label: "Coverage Matrix", icon: Grid3X3 },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-amber-600 text-amber-700 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Past Visits Tab */}
      {activeTab === "past" && (
        <div className="space-y-3">
          {pastVisits.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                  No completed visits yet
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Plan your first visit using the cards above.
                </p>
              </CardContent>
            </Card>
          ) : (
            pastVisits.map((visit) => {
              const visitTypeInfo = VISIT_TYPES.find(
                (vt) => vt.id === visit.visitType,
              );
              const focusLabel =
                FOCUS_AREAS.find((f) => f.id === visit.focusArea)?.label || "";
              const Icon = visitTypeInfo?.icon || ClipboardList;

              return (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedVisit(visit);
                      setViewMode("view");
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2.5 rounded-lg ${visitTypeInfo?.bgColor || "bg-slate-100"} ${visitTypeInfo?.color || ""}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm">
                              {visitTypeInfo?.label}
                            </h3>
                            <Badge variant="outline" className="text-[10px]">
                              {focusLabel}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(visit.date).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {visit.governorName}
                            </span>
                            {visit.actions && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {
                                  visit.actions.filter((a) => a.completed)
                                    .length
                                }
                                /{visit.actions.length} actions
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {visit.evidenceTags?.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="hidden lg:flex text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {visit.ragRating && (
                            <RAGBadge rating={visit.ragRating} />
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Coverage Matrix Tab */}
      {activeTab === "coverage" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Grid3X3 className="w-5 h-5" />
              Ofsted Coverage Matrix
            </CardTitle>
            <p className="text-sm text-slate-500">
              Shows which Ofsted framework areas have been covered by governor
              visits and when they were last visited.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-slate-500">
                      Ofsted Area
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-slate-500">
                      Last Visit
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-slate-500">
                      Governor
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-slate-500">
                      Rating
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {OFSTED_CATEGORIES.map((cat) => {
                    const entry = coverageMatrix[cat];
                    const isGap = gaps.includes(cat);
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                    return (
                      <tr
                        key={cat}
                        className={`border-b last:border-0 ${isGap ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-sm">{cat}</span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {entry.lastVisit
                            ? new Date(entry.lastVisit).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {entry.governor || "-"}
                        </td>
                        <td className="py-3 px-4">
                          {entry.rating ? (
                            <RAGBadge rating={entry.rating} />
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isGap ? (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                              Needs Visit
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                              Covered
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =====================================================
// HELPER COMPONENTS
// =====================================================

function RAGBadge({
  rating,
  size = "sm",
}: {
  rating: RAGRating;
  size?: "sm" | "lg";
}) {
  const config: Record<RAGRating, { bg: string; text: string; label: string }> =
    {
      green: {
        bg: "bg-emerald-500",
        text: "text-white",
        label: "Green",
      },
      amber: {
        bg: "bg-amber-500",
        text: "text-white",
        label: "Amber",
      },
      red: { bg: "bg-rose-500", text: "text-white", label: "Red" },
    };

  const c = config[rating];
  const sizeClass =
    size === "lg" ? "px-4 py-2 text-sm" : "px-2.5 py-1 text-[10px]";

  return (
    <span
      className={`${c.bg} ${c.text} ${sizeClass} font-bold uppercase rounded-full`}
    >
      {c.label}
    </span>
  );
}
