"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileText,
  HelpCircle,
  Landmark,
  Layers,
  NotebookPen,
  MessageSquareText,
  Mic,
  PoundSterling,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  buildExpectedFundingSchedule,
  reconcileFundingReceipts,
  summarizeFundingReconciliation,
  type FundingReconciliationStatus,
} from "@/lib/send/funding-reconciliation";

type ViewId =
  | "setup"
  | "today"
  | "pupils"
  | "pupil"
  | "diary"
  | "ehcp"
  | "notes"
  | "meetings"
  | "evidence"
  | "documents"
  | "funding"
  | "leadership";

type Pupil = {
  id: string;
  name: string;
  year: string;
  className: string;
  status: "EHCP" | "SEN Support" | "Monitoring";
  primaryNeed: string;
  keyWorker: string;
  nextStep: string;
  risk: "High" | "Medium" | "Low";
  reviewDue: string;
  provision: string;
  fundingBand: string;
  fundingAnnual: number;
  evidenceReady: number;
  openActions: number;
  attendance: string;
  attainment: string;
  parentVoice: "Captured" | "Needed";
};

type SendAction = {
  id: string;
  pupilId: string;
  title: string;
  owner: string;
  due: string;
  source: "Annual review" | "APDR" | "Funding" | "Evidence" | "Transition" | "Teacher";
  priority: "High" | "Medium" | "Low";
  status?: "Not started" | "In progress" | "Waiting" | "Done";
  output?: string;
};

type DiaryEvent = {
  id: string;
  pupilId: string;
  title: string;
  date: string;
  time: string;
  type: "Statutory" | "Meeting" | "Evidence" | "Funding" | "Follow-up";
  expectation: string;
  nextAction: string;
};

type CaseNote = {
  id: string;
  pupilId: string;
  date: string;
  author: string;
  category: "Parent contact" | "Professional advice" | "Provision" | "Concern" | "Decision";
  note: string;
  linkedAction: string;
};

type UploadRecord = {
  id: string;
  pupilId: string;
  title: string;
  source: string;
  status: "Uploaded" | "Needs upload" | "Summarised";
  summary: string;
  creates: string;
};

type FundingCalculationLine = {
  id: string;
  label: string;
  calculationType: "Base" | "Add-on" | "Agreed change";
  basis: string;
  annualAmount: number;
  monthlyAmount: number;
  evidence: string;
  effectiveFrom: string;
  status: "Current" | "Forecast";
};

type FundingForecastLine = {
  period: string;
  dueDate: string;
  expectedAmount: number;
  receivedAmount: number;
  status: "Received" | "Shortfall" | "Forecast from agreed change";
  basis: string;
};

type EhcpProvisionLine = {
  id: string;
  pupilId: string;
  sectionFProvision: string;
  legalExpectation: string;
  deliveryOwner: string;
  frequency: string;
  evidenceLogged: number;
  evidenceExpected: number;
  lastEvidence: string;
  nextCheck: string;
  status: "On track" | "Evidence gap" | "At risk";
  linkedEvidence: string[];
};

const pupils: Pupil[] = [
  {
    id: "amelia",
    name: "Amelia R.",
    year: "Year 5",
    className: "5B",
    status: "EHCP",
    primaryNeed: "Autism / communication",
    keyWorker: "Mrs Khan",
    nextStep: "Annual review pack due",
    risk: "High",
    reviewDue: "In 12 days",
    provision: "1:1 TA, SALT programme, sensory breaks",
    fundingBand: "Band 3",
    fundingAnnual: 12000,
    evidenceReady: 78,
    openActions: 5,
    attendance: "94.2%",
    attainment: "Below ARE in writing",
    parentVoice: "Captured",
  },
  {
    id: "jacob",
    name: "Jacob M.",
    year: "Year 3",
    className: "3A",
    status: "SEN Support",
    primaryNeed: "Specific literacy difficulty",
    keyWorker: "SENCO",
    nextStep: "APDR review overdue",
    risk: "Medium",
    reviewDue: "Overdue 8 days",
    provision: "Daily phonics intervention, precision teaching",
    fundingBand: "No top-up",
    fundingAnnual: 0,
    evidenceReady: 62,
    openActions: 3,
    attendance: "96.8%",
    attainment: "Reading improving",
    parentVoice: "Needed",
  },
  {
    id: "sofia",
    name: "Sofia B.",
    year: "Year 6",
    className: "6C",
    status: "EHCP",
    primaryNeed: "SEMH / anxiety",
    keyWorker: "Pastoral lead",
    nextStep: "Transition meeting",
    risk: "High",
    reviewDue: "In 26 days",
    provision: "ELSA, transition visits, reduced anxiety plan",
    fundingBand: "Band 2",
    fundingAnnual: 8400,
    evidenceReady: 84,
    openActions: 4,
    attendance: "91.5%",
    attainment: "Expected in maths",
    parentVoice: "Captured",
  },
  {
    id: "noah",
    name: "Noah T.",
    year: "Year 2",
    className: "2D",
    status: "Monitoring",
    primaryNeed: "Speech and language",
    keyWorker: "Class teacher",
    nextStep: "Gather teacher evidence",
    risk: "Low",
    reviewDue: "In 41 days",
    provision: "Language group, visual timetable",
    fundingBand: "No top-up",
    fundingAnnual: 0,
    evidenceReady: 45,
    openActions: 2,
    attendance: "97.1%",
    attainment: "Working below in speaking/listening",
    parentVoice: "Needed",
  },
];

const openActions: SendAction[] = [
  {
    id: "a1",
    pupilId: "amelia",
    title: "Upload latest SALT report before annual review",
    owner: "SENCO",
    due: "Today",
    source: "Evidence",
    priority: "High",
  },
  {
    id: "a2",
    pupilId: "amelia",
    title: "Check October top-up underpayment with finance",
    owner: "Business Manager",
    due: "Tomorrow",
    source: "Funding",
    priority: "High",
  },
  {
    id: "a3",
    pupilId: "amelia",
    title: "Confirm provision wording is specific and quantified",
    owner: "SENCO",
    due: "2 days",
    source: "Annual review",
    priority: "High",
  },
  {
    id: "a4",
    pupilId: "amelia",
    title: "Send draft annual review agenda to parent/carer",
    owner: "SEND Admin",
    due: "3 days",
    source: "Annual review",
    priority: "Medium",
  },
  {
    id: "a5",
    pupilId: "amelia",
    title: "Add class teacher evidence to review pack",
    owner: "Class Teacher",
    due: "5 days",
    source: "Teacher",
    priority: "Medium",
  },
  {
    id: "a6",
    pupilId: "jacob",
    title: "Complete overdue APDR review notes",
    owner: "SENCO",
    due: "Overdue",
    source: "APDR",
    priority: "High",
  },
  {
    id: "a7",
    pupilId: "jacob",
    title: "Collect parent view for next SEN Support cycle",
    owner: "Class Teacher",
    due: "This week",
    source: "APDR",
    priority: "Medium",
  },
  {
    id: "a8",
    pupilId: "jacob",
    title: "Update literacy intervention impact score",
    owner: "TA Lead",
    due: "Friday",
    source: "Evidence",
    priority: "Low",
  },
  {
    id: "a9",
    pupilId: "sofia",
    title: "Book secondary transition meeting",
    owner: "Pastoral Lead",
    due: "2 days",
    source: "Transition",
    priority: "High",
  },
  {
    id: "a10",
    pupilId: "sofia",
    title: "Request receiving school SENCO comments",
    owner: "SEND Admin",
    due: "This week",
    source: "Transition",
    priority: "Medium",
  },
  {
    id: "a11",
    pupilId: "sofia",
    title: "Attach anxiety plan to transition pack",
    owner: "Pastoral Lead",
    due: "Next week",
    source: "Evidence",
    priority: "Medium",
  },
  {
    id: "a12",
    pupilId: "sofia",
    title: "Review Band 2 funding end date",
    owner: "Business Manager",
    due: "Next week",
    source: "Funding",
    priority: "Low",
  },
  {
    id: "a13",
    pupilId: "noah",
    title: "Gather teacher observation evidence",
    owner: "Class Teacher",
    due: "This week",
    source: "Teacher",
    priority: "Medium",
  },
  {
    id: "a14",
    pupilId: "noah",
    title: "Send speech and language parent questionnaire",
    owner: "SEND Admin",
    due: "Friday",
    source: "Evidence",
    priority: "Medium",
  },
];

const diaryEvents: DiaryEvent[] = [
  {
    id: "d1",
    pupilId: "amelia",
    title: "EHCP annual review preparation deadline",
    date: "Mon 18 May",
    time: "09:00",
    type: "Statutory",
    expectation: "Evidence, views, agenda and provision/funding check ready before meeting papers are shared.",
    nextAction: "Upload SALT report and confirm quantified provision wording.",
  },
  {
    id: "d2",
    pupilId: "amelia",
    title: "Annual review meeting",
    date: "Thu 21 May",
    time: "13:30",
    type: "Meeting",
    expectation: "Run the SEND EHCP Annual Review meeting template and capture actions, amendments and LA paperwork.",
    nextAction: "Send agenda and professional evidence pack.",
  },
  {
    id: "d3",
    pupilId: "jacob",
    title: "APDR review catch-up",
    date: "Wed 13 May",
    time: "15:20",
    type: "Follow-up",
    expectation: "Review assess-plan-do-review cycle, parent view and intervention impact.",
    nextAction: "Complete overdue review notes and set new outcomes.",
  },
  {
    id: "d4",
    pupilId: "sofia",
    title: "Secondary transition meeting",
    date: "Fri 15 May",
    time: "10:00",
    type: "Meeting",
    expectation: "Confirm receiving school adjustments, anxiety plan, visits and evidence transfer.",
    nextAction: "Request receiving SENCO comments.",
  },
  {
    id: "d5",
    pupilId: "amelia",
    title: "LA top-up funding receipt expected",
    date: "Fri 29 May",
    time: "All day",
    type: "Funding",
    expectation: "Finance confirms whether September/October backdated top-up has landed.",
    nextAction: "If still short, send LA query pack.",
  },
];

const caseNotes: CaseNote[] = [
  {
    id: "n1",
    pupilId: "amelia",
    date: "09 May",
    author: "SENCO",
    category: "Professional advice",
    note: "SALT report references sensory overload after unstructured times. Needs to be reflected in provision and review questions.",
    linkedAction: "Upload latest SALT report before annual review",
  },
  {
    id: "n2",
    pupilId: "amelia",
    date: "08 May",
    author: "Business Manager",
    category: "Decision",
    note: "October top-up payment appears lower than agreed Band 3 monthly profile. Hold until remittance is checked.",
    linkedAction: "Check October top-up underpayment with finance",
  },
  {
    id: "n3",
    pupilId: "jacob",
    date: "07 May",
    author: "Class Teacher",
    category: "Provision",
    note: "Daily precision teaching has improved decoding accuracy. Parent view still needed before APDR can be closed.",
    linkedAction: "Collect parent view for next SEN Support cycle",
  },
  {
    id: "n4",
    pupilId: "sofia",
    date: "06 May",
    author: "Pastoral Lead",
    category: "Concern",
    note: "Attendance dip coincides with transition anxiety. Add transition visits and named receiving-school contact to plan.",
    linkedAction: "Book secondary transition meeting",
  },
];

const uploadRecords: UploadRecord[] = [
  {
    id: "u1",
    pupilId: "amelia",
    title: "SALT report - April 2026",
    source: "Drive / Professional reports",
    status: "Needs upload",
    summary: "Expected to confirm communication targets, sensory profile and adult support recommendations.",
    creates: "Evidence item, annual review prompt and provision wording check.",
  },
  {
    id: "u2",
    pupilId: "amelia",
    title: "Parent annual review views",
    source: "Parent form",
    status: "Summarised",
    summary: "Parent wants clearer sensory break plan and consistency at lunchtimes.",
    creates: "Parent voice section and meeting agenda item.",
  },
  {
    id: "u3",
    pupilId: "sofia",
    title: "Anxiety transition plan",
    source: "Pastoral folder",
    status: "Uploaded",
    summary: "Current plan lists trusted adults, triggers, and phased secondary transition visits.",
    creates: "Transition evidence pack and secondary SENCO briefing.",
  },
  {
    id: "u4",
    pupilId: "jacob",
    title: "Literacy intervention impact record",
    source: "Teacher upload",
    status: "Uploaded",
    summary: "Shows improved phonics accuracy but spelling generalisation remains weak.",
    creates: "APDR impact note and next planned intervention.",
  },
];

const fundingCalculationLines: Record<string, FundingCalculationLine[]> = {
  amelia: [
    {
      id: "amelia-base",
      label: "Base Element 3 top-up",
      calculationType: "Base",
      basis: "Bradford mainstream Band 3 base allocation",
      annualAmount: 9000,
      monthlyAmount: 750,
      evidence: "Final EHCP Section F and LA banding notice",
      effectiveFrom: "01 Sep 2026",
      status: "Current",
    },
    {
      id: "amelia-communication-addon",
      label: "Communication and interaction add-on",
      calculationType: "Add-on",
      basis: "SALT programme and adult-mediated communication support",
      annualAmount: 1800,
      monthlyAmount: 150,
      evidence: "SALT report - April 2026",
      effectiveFrom: "01 Sep 2026",
      status: "Current",
    },
    {
      id: "amelia-review-increase",
      label: "Agreed LA increase from annual review",
      calculationType: "Agreed change",
      basis: "Additional sensory regulation support agreed after review evidence",
      annualAmount: 1200,
      monthlyAmount: 100,
      evidence: "Annual review minutes and LA panel agreement",
      effectiveFrom: "01 Nov 2026",
      status: "Forecast",
    },
  ],
  sofia: [
    {
      id: "sofia-base",
      label: "Base Element 3 top-up",
      calculationType: "Base",
      basis: "Bradford mainstream Band 2 base allocation",
      annualAmount: 7200,
      monthlyAmount: 600,
      evidence: "Final EHCP and transition plan",
      effectiveFrom: "01 Sep 2026",
      status: "Current",
    },
    {
      id: "sofia-transition-addon",
      label: "Transition support add-on",
      calculationType: "Add-on",
      basis: "Enhanced transition package for secondary transfer",
      annualAmount: 1200,
      monthlyAmount: 100,
      evidence: "Secondary transition meeting record",
      effectiveFrom: "01 Sep 2026",
      status: "Current",
    },
  ],
};

const fundingForecastLines: Record<string, FundingForecastLine[]> = {
  amelia: [
    {
      period: "September 2026",
      dueDate: "01 Nov 2026",
      expectedAmount: 1000,
      receivedAmount: 1000,
      status: "Received",
      basis: "Band 3 base plus communication add-on",
    },
    {
      period: "October 2026",
      dueDate: "01 Nov 2026",
      expectedAmount: 1000,
      receivedAmount: 750,
      status: "Shortfall",
      basis: "Band 3 base plus communication add-on",
    },
    {
      period: "November 2026",
      dueDate: "01 Dec 2026",
      expectedAmount: 1100,
      receivedAmount: 0,
      status: "Forecast from agreed change",
      basis: "Band 3 plus agreed annual review increase",
    },
    {
      period: "December 2026",
      dueDate: "01 Jan 2027",
      expectedAmount: 1100,
      receivedAmount: 0,
      status: "Forecast from agreed change",
      basis: "Band 3 plus agreed annual review increase",
    },
  ],
};

const ehcpProvisionLines: EhcpProvisionLine[] = [
  {
    id: "ehcp-amelia-ta",
    pupilId: "amelia",
    sectionFProvision: "Daily adult support during English and unstructured transitions",
    legalExpectation: "1:1 TA support, sensory regulation prompts and structured transition plan",
    deliveryOwner: "Mrs Khan",
    frequency: "Daily",
    evidenceLogged: 17,
    evidenceExpected: 20,
    lastEvidence: "TA provision log - 08 May",
    nextCheck: "Weekly provision evidence check - Mon 11 May",
    status: "On track",
    linkedEvidence: ["TA timetable", "Provision log", "Class teacher observation"],
  },
  {
    id: "ehcp-amelia-salt",
    pupilId: "amelia",
    sectionFProvision: "SALT programme targets embedded across classroom routines",
    legalExpectation: "Weekly SALT programme delivered by trained adult and reviewed against targets",
    deliveryOwner: "SENCO / SALT",
    frequency: "Weekly",
    evidenceLogged: 2,
    evidenceExpected: 4,
    lastEvidence: "SALT report awaiting upload",
    nextCheck: "Upload SALT report before annual review pack closes",
    status: "Evidence gap",
    linkedEvidence: ["SALT report - April 2026", "Intervention record", "Annual review agenda item"],
  },
  {
    id: "ehcp-amelia-equipment",
    pupilId: "amelia",
    sectionFProvision: "Sensory toolkit available and used after lunch",
    legalExpectation: "Agreed sensory resources purchased, available and reviewed for impact",
    deliveryOwner: "SEND Admin",
    frequency: "Available daily",
    evidenceLogged: 1,
    evidenceExpected: 1,
    lastEvidence: "Purchase order and classroom photo uploaded",
    nextCheck: "Confirm impact with parent/carer at review",
    status: "On track",
    linkedEvidence: ["Purchase order", "Resource photo", "Parent view"],
  },
  {
    id: "ehcp-sofia-transition",
    pupilId: "sofia",
    sectionFProvision: "Enhanced secondary transition package",
    legalExpectation: "Named receiving-school contact, transition visits and anxiety plan",
    deliveryOwner: "Pastoral lead",
    frequency: "Fortnightly until transfer",
    evidenceLogged: 3,
    evidenceExpected: 4,
    lastEvidence: "Transition plan uploaded",
    nextCheck: "Receiving SENCO comments due this week",
    status: "At risk",
    linkedEvidence: ["Transition plan", "Receiving school comments", "Pupil voice"],
  },
];

const documentOutputs = [
  {
    title: "Annual review report",
    source: "Meeting minutes + evidence pack",
    status: "Ready to generate",
    output: "LA-ready review report with views, outcomes, provision, amendments and actions.",
  },
  {
    title: "EHCP amendment request",
    source: "Meeting decisions",
    status: "Draft",
    output: "Specific wording changes for needs, outcomes and provision.",
  },
  {
    title: "LA funding query",
    source: "Funding reconciliation",
    status: "Needs approval",
    output: "Finance-backed query with expected/received payments and evidence links.",
  },
  {
    title: "Teacher one-page plan",
    source: "Pupil profile + provision notes",
    status: "Ready to generate",
    output: "Classroom strategies, triggers, adjustments, provision and review date.",
  },
  {
    title: "Parent meeting summary",
    source: "Meeting minutes",
    status: "Ready to generate",
    output: "Plain-English summary of what was discussed, agreed and happens next.",
  },
];

const tabs: { id: ViewId; label: string; icon: typeof CalendarClock }[] = [
  { id: "setup", label: "Setup", icon: ClipboardCheck },
  { id: "today", label: "SEND Today", icon: CalendarClock },
  { id: "pupils", label: "SEND Register", icon: UsersRound },
  { id: "pupil", label: "Pupil File", icon: UserRound },
  { id: "diary", label: "SENCO Diary", icon: CalendarClock },
  { id: "leadership", label: "Leadership", icon: Layers },
];

const pupilFileViews: ViewId[] = ["pupil", "ehcp", "notes", "meetings", "evidence", "documents", "funding"];

const helpCopy = {
  setup:
    "Setup is where a school connects MIS data, chooses the local authority funding model, imports pupils, assigns owners and confirms meeting/evidence templates.",
  today:
    "This is the SENCO's morning screen. It only shows work that needs a decision, action, meeting or deadline check.",
  oneView:
    "One pupil, one truth: needs, EHCP/APDR, provision, evidence, funding, meetings and actions in one place.",
  diary:
    "Diary turns statutory dates, reviews, funding receipts, meetings and follow-ups into one SENCO working calendar.",
  notes:
    "Notes and uploads are linked to the pupil, action, meeting, evidence pack and document output so context is not lost.",
  meeting:
    "The meeting copilot turns an agenda into minutes, actions, evidence and draft paperwork. The human stays in control.",
  evidence:
    "Evidence packs check whether the school has enough current information before annual review, EHCP request, funding or LA submission.",
  documents:
    "Documents are generated from approved meeting minutes, evidence and pupil records, then reviewed before sending.",
  funding:
    "Funding reconciliation compares agreed top-up funding with LA payment files so finance and SEND teams see variances clearly.",
  leadership:
    "Leadership reports roll pupil-level work into SLT, governor, trust and Ofsted inclusion evidence without rebuilding spreadsheets.",
};

const setupSteps = [
  {
    id: "school",
    title: "Confirm school and local authority",
    owner: "School admin",
    status: "Complete",
    detail:
      "Sets the LA rule pack, funding year, payment schedule and statutory workflow defaults.",
  },
  {
    id: "mis",
    title: "Import MIS data: Arbor API, connected sheet or CSV",
    owner: "Data manager",
    status: "Ready",
    detail:
      "Imports pupil roll, year/class, SEN status, primary need, attendance and contextual flags.",
  },
  {
    id: "evidence",
    title: "Connect Drive/SharePoint evidence folder",
    owner: "SENCO",
    status: "Ready",
    detail:
      "Keeps original files in the school folder while Schoolgle stores links, summaries and evidence status.",
  },
  {
    id: "roles",
    title: "Assign owners and permissions",
    owner: "Headteacher",
    status: "Needs review",
    detail:
      "Sets who can see SEND records, run meetings, approve documents and view funding.",
  },
  {
    id: "funding",
    title: "Load LA funding bands and payment dates",
    owner: "Business manager",
    status: "Needs review",
    detail:
      "Configures bands, points, annual values, expected receipt dates and backdating rules.",
  },
  {
    id: "templates",
    title: "Review meeting and evidence templates",
    owner: "SENCO",
    status: "Ready",
    detail:
      "Annual review, APDR, EHCP request, funding review, transition and parent meeting templates.",
  },
];

const statusStyles: Record<
  FundingReconciliationStatus,
  { label: string; className: string; explanation: string }
> = {
  matched: {
    label: "Matched",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    explanation: "The expected amount has arrived.",
  },
  underpaid: {
    label: "Underpaid",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    explanation: "Some money arrived, but less than expected.",
  },
  overpaid: {
    label: "Overpaid",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
    explanation: "More money arrived than expected.",
  },
  overdue: {
    label: "Overdue",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    explanation: "The due date has passed and no matching receipt is recorded.",
  },
  expected_later: {
    label: "Expected later",
    className: "bg-slate-50 text-slate-700 ring-slate-200",
    explanation: "The payment is forecast but not due yet.",
  },
  unmatched_receipt: {
    label: "Unmatched",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
    explanation: "A payment line needs a human match or ignore decision.",
  },
};

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

function HelpTip({
  id,
  children,
}: {
  id: keyof typeof helpCopy;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
        aria-label={`Explain ${id}`}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <span className="absolute left-0 top-8 z-30 w-80 rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-normal leading-6 text-slate-600 shadow-xl">
          {helpCopy[id]}
        </span>
      )}
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "rose" | "pink" | "blue" }) {
  const classes = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    pink: "bg-pink-50 text-pink-700 ring-pink-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-transparent ${classes[tone]}`}>
      {children}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const tone = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = "slate",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "slate" | "green" | "amber" | "rose" | "blue" | "pink";
}) {
  const tones = {
    slate: "from-white to-slate-50",
    green: "from-emerald-50 to-white",
    amber: "from-amber-50 to-white",
    rose: "from-rose-50 to-white",
    blue: "from-blue-50 to-white",
    pink: "from-pink-50 to-white",
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${tones[tone]} p-5 shadow-sm`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function ProductHeader({
  currentView,
  setCurrentView,
}: {
  currentView: ViewId;
  setCurrentView: (view: ViewId) => void;
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-[#f7f8fb]/95 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700 ring-1 ring-pink-100">
              <Sparkles className="h-4 w-4" />
              Grove House Primary · SEND & Inclusion Copilot
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              SENCO workbench: pupils, meetings, evidence, provision, funding and reporting.
            </h1>
          </div>
          <div className="rounded-3xl bg-slate-950 p-4 text-white shadow-lg">
            <p className="text-sm text-slate-300">Connected data</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/10 px-3 py-1">Grove House pupils</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Arbor import ready</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Drive evidence</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Meeting recorder</span>
            </div>
            {currentView === "setup" && (
              <button
                type="button"
                onMouseDown={() => setCurrentView("today")}
                onClick={() => setCurrentView("today")}
                className="mt-3 w-full rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
              >
                Start SEND workflow
              </button>
            )}
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = currentView === tab.id || (tab.id === "pupil" && pupilFileViews.includes(currentView));

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentView(tab.id)}
                className={`flex min-w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function actionMatchesDue(action: SendAction, dueFilter: string) {
  if (dueFilter === "All") return true;
  if (dueFilter === "Today") return action.due === "Today";
  if (dueFilter === "Overdue") return action.due === "Overdue" || action.due.toLowerCase().includes("overdue");
  if (dueFilter === "This week") return ["Tomorrow", "2 days", "3 days", "5 days", "This week", "Friday"].includes(action.due);
  if (dueFilter === "Next week") return action.due === "Next week";
  return true;
}

function TodayView({
  selectedPupil,
  setSelectedPupilId,
  setCurrentView,
}: {
  selectedPupil: Pupil;
  setSelectedPupilId: (id: string) => void;
  setCurrentView: (view: ViewId) => void;
}) {
  const [pupilFilter, setPupilFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const highRiskCount = pupils.filter((pupil) => pupil.risk === "High").length;
  const ehcpPupils = pupils.filter((pupil) => pupil.status === "EHCP");
  const filteredActions = openActions.filter((action) => {
    const pupil = pupils.find((item) => item.id === action.pupilId);
    const matchesPupil = pupilFilter === "All" || pupil?.id === pupilFilter;
    const matchesSource = sourceFilter === "All" || action.source === sourceFilter;
    const matchesDue = actionMatchesDue(action, dueFilter);
    const matchesPriority = priorityFilter === "All" || action.priority === priorityFilter;
    return matchesPupil && matchesSource && matchesDue && matchesPriority;
  });
  const openActionCount = openActions.length;
  const visibleActionCount = filteredActions.length;
  const priorityActions = filteredActions.filter((action) => action.priority === "High").slice(0, 5);
  const nextDeadlines = diaryEvents.slice(0, 5);

  const openAction = (action: SendAction) => {
    setSelectedPupilId(action.pupilId);
    setCurrentView(action.source === "Funding" ? "funding" : "pupil");
  };

  return (
    <div className="space-y-6">
      <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-pink-700">SENCO dashboard · first login view</p>
            <h2 className="mt-1 text-2xl font-bold">Check October top-up underpayment with finance</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Amelia R. · Business Manager · Funding · due tomorrow. This opens the pupil funding record and prepares the LA query pack.
            </p>
          </div>
          <button
            type="button"
            onMouseDown={() => openAction(openActions[1])}
            onClick={() => openAction(openActions[1])}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-sm"
          >
            Open funding variance
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="EHCP plans" value="18" detail={`${ehcpPupils.length} shown in this Grove House demo slice.`} tone="pink" />
        <MetricCard label="SEND register" value="84" detail="Full register visible, searchable and imported from MIS." tone="blue" />
        <MetricCard label="Reviews due soon" value="6" detail="Annual review, APDR and transition deadlines." tone="amber" />
        <MetricCard label="Open actions" value={String(openActionCount)} detail="Assigned to SENCO, teachers, finance and support staff." tone="rose" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="High risk pupils" value={String(highRiskCount)} detail="Requires SENCO or SLT review this week." tone="rose" />
        <MetricCard label="Evidence packs ready" value="68%" detail="Target: 90% ready before statutory meetings." tone="green" />
        <MetricCard label="Funding variance" value="£18.4k" detail="Forecast shortfall or timing difference to reconcile." tone="amber" />
        <MetricCard label="Parent/pupil voice" value="72%" detail="Captured before review, APDR or EHCP paperwork." tone="blue" />
      </div>

      <Card className="border-pink-200 bg-gradient-to-br from-white to-pink-50/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Action queue</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This is where the 14 open actions live. The SENCO can filter by pupil, workflow, deadline and priority, then open the exact pupil record.
            </p>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById("open-actions")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            View all 14 actions
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">
            Pupil
            <select
              value={pupilFilter}
              onChange={(event) => setPupilFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-300"
            >
              <option value="All">All pupils</option>
              {pupils.map((pupil) => (
                <option key={pupil.id} value={pupil.id}>{pupil.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Workflow
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-300"
            >
              {["All", "Annual review", "APDR", "Funding", "Evidence", "Transition", "Teacher"].map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Due
            <select
              value={dueFilter}
              onChange={(event) => setDueFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-300"
            >
              {["All", "Today", "Overdue", "This week", "Next week"].map((due) => (
                <option key={due} value={due}>{due}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Priority
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-300"
            >
              {["All", "High", "Medium", "Low"].map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-5">
          {priorityActions.map((action) => {
            const pupil = pupils.find((item) => item.id === action.pupilId);
            const buttonLabel = action.source === "Funding" ? "Open funding action" : "Open pupil action";

            return (
              <div key={action.id} className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <Pill tone="rose">{action.priority}</Pill>
                    <span className="text-xs font-semibold text-slate-500">{action.due}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold leading-6">{action.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {pupil?.name ?? "Unknown pupil"} · {action.owner} · {action.source}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAction(action)}
                  className="mt-4 inline-flex items-center gap-1 text-left text-sm font-semibold text-pink-700"
                >
                  {buttonLabel}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {priorityActions.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-600 xl:col-span-5">
              No high-priority actions match these filters. The full filtered log is still shown below.
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">EHCP plan tracker</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Every EHCP pupil has one current plan, next review, evidence readiness, funding band and next action in one place.
              </p>
            </div>
            <Pill tone="pink">18 EHCP plans</Pill>
          </div>
          <div className="mt-5 space-y-3">
            {ehcpPupils.map((pupil) => {
              const nextAction = openActions.find((action) => action.pupilId === pupil.id);
              return (
                <button
                  key={pupil.id}
                  type="button"
                  onClick={() => {
                    setSelectedPupilId(pupil.id);
                    setCurrentView("pupil");
                  }}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-pink-200 hover:bg-pink-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{pupil.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{pupil.year} · {pupil.primaryNeed}</p>
                    </div>
                    <Pill tone={pupil.risk === "High" ? "rose" : "amber"}>{pupil.reviewDue}</Pill>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence</p>
                      <p className="mt-1 font-bold">{pupil.evidenceReady}% ready</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Funding</p>
                      <p className="mt-1 font-bold">{pupil.fundingBand}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next action</p>
                      <p className="mt-1 font-bold">{nextAction?.title ?? pupil.nextStep}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Next deadlines</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Diary items are pupil-linked. Open one and it takes the SENCO to the pupil file, not a loose diary note.
          </p>
          <div className="mt-5 space-y-3">
            {nextDeadlines.map((event) => {
              const pupil = pupils.find((item) => item.id === event.pupilId);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    setSelectedPupilId(event.pupilId);
                    setCurrentView("pupil");
                  }}
                  className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-pink-200 hover:bg-pink-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Pill tone={event.type === "Statutory" ? "rose" : event.type === "Funding" ? "amber" : "blue"}>{event.type}</Pill>
                    <span className="text-xs font-semibold text-slate-500">{event.date} · {event.time}</span>
                  </div>
                  <h3 className="mt-3 font-bold">{event.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{pupil?.name} · next: {event.nextAction}</p>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              <HelpTip id="today">Today’s priority work</HelpTip>
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No noise. Only the work that moves a pupil, deadline or evidence pack forward.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView("pupils")}
            className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Open pupil list
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {[
            ["Annual review pack due", `${selectedPupil.name} needs parent/professional evidence checked before the review.`, "High", "Open pupil"],
            ["APDR review overdue", "Jacob M. needs review notes and new planned outcomes.", "Medium", "Start APDR"],
            ["Funding variance", "Amelia R. appears £1,250 short against expected LA top-up receipts.", "High", "Check funding"],
            ["Parent voice missing", "Noah T. needs parent/carer views before evidence pack can be marked ready.", "Medium", "Send request"],
          ].map(([title, detail, risk, action]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
                </div>
                <Pill tone={risk === "High" ? "rose" : "amber"}>{risk}</Pill>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView(title === "Funding variance" ? "funding" : "pupil")}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pink-700"
              >
                {action}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="scroll-mt-36" >
        <div id="open-actions" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Open actions log</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These are the actions behind the dashboard. Each action knows its pupil, owner, deadline, source workflow and required output.
            </p>
          </div>
          <Pill tone="blue">{visibleActionCount} shown · {openActionCount} open</Pill>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Pupil</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActions.map((action) => {
                const pupil = pupils.find((item) => item.id === action.pupilId);
                return (
                  <tr key={action.id} className="bg-white">
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => openAction(action)}
                        className="text-left font-semibold text-slate-950 hover:text-pink-700"
                      >
                        {action.title}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{pupil?.name ?? "Unknown"}</td>
                    <td className="px-4 py-4 text-slate-600">{action.owner}</td>
                    <td className="px-4 py-4 font-semibold">{action.due}</td>
                    <td className="px-4 py-4"><Pill>{action.source}</Pill></td>
                    <td className="px-4 py-4">
                      <Pill tone={action.priority === "High" ? "rose" : action.priority === "Medium" ? "amber" : "green"}>
                        {action.priority}
                      </Pill>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {action.output ?? (action.source === "Funding" ? "LA query pack" : action.source === "Evidence" ? "Evidence pack update" : "Pupil record update")}
                    </td>
                  </tr>
                );
              })}
              {filteredActions.length === 0 && (
                <tr className="bg-white">
                  <td colSpan={7} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    No actions match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PupilsView({
  selectedPupilId,
  setSelectedPupilId,
  setCurrentView,
}: {
  selectedPupilId: string;
  setSelectedPupilId: (id: string) => void;
  setCurrentView: (view: ViewId) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const visiblePupils = pupils.filter((pupil) => {
    const matchesQuery = pupil.name.toLowerCase().includes(query.toLowerCase()) || pupil.primaryNeed.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All" || pupil.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Full SEND register</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Search by pupil, filter by need/status, then open the secure one-view. This is where Arbor API data, an Arbor-exported connected sheet, or a CSV import lands and becomes the living register.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill tone="blue">84 pupils on register</Pill>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pupils or needs"
              className="bg-transparent text-sm outline-none"
            />
          </div>
          {["All", "EHCP", "SEN Support", "Monitoring"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                statusFilter === status ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
          <button className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white">
            Import from Arbor
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Pupil</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Need</th>
              <th className="px-4 py-3">Next step</th>
              <th className="px-4 py-3">Evidence</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiblePupils.map((pupil) => (
              <tr key={pupil.id} className={selectedPupilId === pupil.id ? "bg-pink-50/70" : "bg-white"}>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPupilId(pupil.id);
                      setCurrentView("pupil");
                    }}
                    className="text-left font-bold text-slate-950"
                  >
                    {pupil.name}
                    <span className="block text-xs font-medium text-slate-500">{pupil.year} · {pupil.className}</span>
                  </button>
                </td>
                <td className="px-4 py-4"><Pill tone={pupil.status === "EHCP" ? "pink" : pupil.status === "SEN Support" ? "blue" : "slate"}>{pupil.status}</Pill></td>
                <td className="px-4 py-4 text-slate-600">{pupil.primaryNeed}</td>
                <td className="px-4 py-4 text-slate-600">{pupil.nextStep}</td>
                <td className="px-4 py-4">
                  <div className="w-32">
                    <ProgressBar value={pupil.evidenceReady} />
                    <p className="mt-1 text-xs text-slate-500">{pupil.evidenceReady}% ready</p>
                  </div>
                </td>
                <td className="px-4 py-4 font-semibold">{pupil.openActions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PupilView({ pupil, setCurrentView }: { pupil: Pupil; setCurrentView: (view: ViewId) => void }) {
  const pupilNotes = caseNotes.filter((note) => note.pupilId === pupil.id);
  const pupilEvents = diaryEvents.filter((event) => event.pupilId === pupil.id);
  const pupilUploads = uploadRecords.filter((record) => record.pupilId === pupil.id);
  const pupilProvision = ehcpProvisionLines.filter((line) => line.pupilId === pupil.id);
  const provisionCoverage =
    pupilProvision.length > 0
      ? Math.round(
          (pupilProvision.reduce((total, line) => total + Math.min(line.evidenceLogged, line.evidenceExpected), 0) /
            pupilProvision.reduce((total, line) => total + line.evidenceExpected, 0)) *
            100,
        )
      : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pink-700">Confidential pupil file</p>
            <h2 className="text-3xl font-bold">
              <HelpTip id="oneView">{pupil.name}</HelpTip>
            </h2>
            <p className="mt-2 text-slate-600">{pupil.year} · {pupil.className} · Key worker: {pupil.keyWorker}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone={pupil.status === "EHCP" ? "pink" : "blue"}>{pupil.status}</Pill>
              <Pill tone={pupil.risk === "High" ? "rose" : pupil.risk === "Medium" ? "amber" : "green"}>{pupil.risk} risk</Pill>
              <Pill>{pupil.primaryNeed}</Pill>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView("meetings")}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Start pupil meeting
          </button>
        </div>

        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          This is the secure pupil record. Case notes, uploaded reports, professional summaries, meetings, evidence packs, documents and funding checks are stored against this pupil and permission-controlled.
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Next statutory step", pupil.nextStep],
            ["Provision in place", pupil.provision],
            ["EHCP provision evidence", pupil.status === "EHCP" ? `${provisionCoverage}% evidenced` : "Not an EHCP pupil"],
            ["Attendance", pupil.attendance],
            ["Attainment note", pupil.attainment],
            ["Parent voice", pupil.parentVoice],
            ["Review due", pupil.reviewDue],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">Evidence readiness</h3>
            <span className="text-sm font-semibold">{pupil.evidenceReady}%</span>
          </div>
          <ProgressBar value={pupil.evidenceReady} />
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Missing items are converted into actions, meeting prompts or document requests. The aim is to prevent the SENCO rebuilding the evidence story at the last minute.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setCurrentView("diary")}
            className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-pink-200 hover:bg-pink-50"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Diary</p>
            <p className="mt-2 font-bold">{pupilEvents[0]?.date ?? "No date"} · {pupilEvents[0]?.title ?? "No upcoming event"}</p>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView("notes")}
            className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-pink-200 hover:bg-pink-50"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Notes</p>
            <p className="mt-2 font-bold">{pupilNotes.length} current case notes</p>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView("notes")}
            className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-pink-200 hover:bg-pink-50"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Uploads</p>
            <p className="mt-2 font-bold">{pupilUploads.filter((upload) => upload.status === "Needs upload").length} item needs upload</p>
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["EHCP provision", "ehcp"],
            ["Case notes & uploads", "notes"],
            ["Meetings", "meetings"],
            ["Evidence", "evidence"],
            ["Documents", "documents"],
            ["Funding", "funding"],
          ].map(([label, view]) => (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentView(view as ViewId)}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold">Next best actions</h3>
        <div className="mt-4 space-y-3">
          {[
            ["Book annual review", "Invite parent/carer, class teacher, SENCO and relevant professionals."],
            ["Check provision cost", "Compare current provision against funding and staffing cost."],
            ["Request missing view", "Parent/carer or pupil view is needed before pack completion."],
            ["Generate briefing", "Create teacher-facing one-page strategy summary."],
          ].map(([title, detail], index) => (
            <div key={title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DiaryView({
  selectedPupilId,
  setSelectedPupilId,
  setCurrentView,
}: {
  selectedPupilId: string;
  setSelectedPupilId: (id: string) => void;
  setCurrentView: (view: ViewId) => void;
}) {
  const [filter, setFilter] = useState<"All" | DiaryEvent["type"]>("All");
  const visibleEvents = diaryEvents.filter((event) => filter === "All" || event.type === filter);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              <HelpTip id="diary">SENCO diary and deadline tracker</HelpTip>
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Meetings, statutory preparation dates, funding receipts, APDR follow-ups and evidence deadlines in one working list. Sensitive notes and reports are not held here; opening an event takes the SENCO into the confidential pupil file.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["All", "Statutory", "Meeting", "Evidence", "Funding", "Follow-up"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  filter === item ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {visibleEvents.map((event) => {
            const pupil = pupils.find((item) => item.id === event.pupilId);
            const active = event.pupilId === selectedPupilId;

            return (
              <div key={event.id} className={`rounded-3xl border p-5 ${active ? "border-pink-200 bg-pink-50" : "border-slate-200 bg-white"}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={event.type === "Statutory" ? "rose" : event.type === "Funding" ? "amber" : "blue"}>{event.type}</Pill>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{event.date} · {event.time}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold">{event.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{pupil?.name ?? "Unknown pupil"}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{event.expectation}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-950">Next action: {event.nextAction}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPupilId(event.pupilId);
                        setCurrentView("pupil");
                      }}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                    >
                      Open pupil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPupilId(event.pupilId);
                        setCurrentView(event.type === "Meeting" || event.type === "Statutory" ? "meetings" : event.type === "Funding" ? "funding" : "notes");
                      }}
                      className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Do next action
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold">This week</h3>
        <div className="mt-4 space-y-3">
          {[
            ["Statutory prep", "Annual review pack, views and agenda must be ready before papers go out."],
            ["Meeting load", "2 SEND meetings need agenda, invitees, consent and minute outputs."],
            ["Funding checks", "1 backdated receipt is expected; variance becomes an LA query if missing."],
            ["Evidence gaps", "Professional report and provision cost evidence are blocking pack completion."],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <h4 className="font-bold">{title}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EhcpProvisionView({ pupil, setCurrentView }: { pupil: Pupil; setCurrentView: (view: ViewId) => void }) {
  const [emailReady, setEmailReady] = useState(false);
  const provisionLines = ehcpProvisionLines.filter((line) => line.pupilId === pupil.id);
  const totalExpected = provisionLines.reduce((total, line) => total + line.evidenceExpected, 0);
  const totalLogged = provisionLines.reduce((total, line) => total + Math.min(line.evidenceLogged, line.evidenceExpected), 0);
  const evidenceCoverage = totalExpected > 0 ? Math.round((totalLogged / totalExpected) * 100) : 0;
  const gaps = provisionLines.filter((line) => line.status !== "On track");

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pink-700">Confidential pupil file · EHCP provision</p>
            <h2 className="text-2xl font-bold">EHCP Section F provision tracker for {pupil.name}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              This is the operational evidence that the school is delivering the provision written into the EHCP, not just storing the plan. Each line links the legal expectation to delivery, logs, evidence, diary checks and annual review paperwork.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmailReady(true)}
            className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Prepare LA/parent update
          </button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Provision evidence" value={`${evidenceCoverage}%`} detail="Expected delivery evidence logged this cycle." tone={evidenceCoverage >= 90 ? "green" : "amber"} />
        <MetricCard label="Section F lines" value={String(provisionLines.length)} detail="Tracked from the legal EHCP provision wording." tone="blue" />
        <MetricCard label="Gaps to chase" value={String(gaps.length)} detail="Missing evidence or at-risk provision." tone={gaps.length ? "rose" : "green"} />
        <MetricCard label="Annual review prep" value="12 days" detail="Papers, views and evidence need to be ready before the meeting." tone="pink" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-xl font-bold">Provision delivery evidence log</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The SENCO can see whether the one-to-one, therapy programme, equipment or adjustments actually happened, who owns it and what proof is attached.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView("notes")}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Add evidence note/upload
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">EHCP provision</th>
                <th className="px-4 py-3">Owner / frequency</th>
                <th className="px-4 py-3">Evidence</th>
                <th className="px-4 py-3">Next diary check</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {provisionLines.map((line) => (
                <tr key={line.id} className="bg-white">
                  <td className="px-4 py-4">
                    <p className="font-bold">{line.sectionFProvision}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{line.legalExpectation}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <span className="font-semibold text-slate-950">{line.deliveryOwner}</span>
                    <span className="block text-xs">{line.frequency}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-32">
                      <ProgressBar value={Math.round((Math.min(line.evidenceLogged, line.evidenceExpected) / line.evidenceExpected) * 100)} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-600">{line.evidenceLogged}/{line.evidenceExpected} logs · {line.lastEvidence}</p>
                    <p className="mt-1 text-xs text-slate-500">{line.linkedEvidence.join(", ")}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{line.nextCheck}</td>
                  <td className="px-4 py-4">
                    <Pill tone={line.status === "On track" ? "green" : line.status === "Evidence gap" ? "amber" : "rose"}>
                      {line.status}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h3 className="text-xl font-bold">Annual review automation</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The system should start the annual review runway early so the SENCO is not chasing paperwork the week before.
          </p>
          <div className="mt-5 space-y-3">
            {[
              ["16 weeks before", "Create review project, confirm deadline and identify missing Section F evidence."],
              ["12 weeks before", "Book meeting, invite parent/carer, LA, class teacher and professionals."],
              ["8 weeks before", "Request parent, pupil and professional views; chase missing reports."],
              ["4 weeks before", "Circulate agenda, evidence pack and proposed provision questions."],
              ["2 weeks after", "Submit annual review report and track LA decision due within four weeks."],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-bold">{title}</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-bold">Friction removed</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            What the SENCO should be able to generate without rebuilding the file manually.
          </p>
          <div className="mt-5 space-y-3">
            {[
              "Parent/carer evidence request email",
              "Professional report chase email",
              "LA missing provision escalation",
              "Annual review agenda and invite",
              "Provision delivery summary for annual review",
              "Governor/SLT assurance summary without unnecessary detail",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          {emailReady && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Draft created: provision evidence update for parent/carer and LA, with missing evidence actions attached.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function NotesUploadsView({ pupil, setCurrentView }: { pupil: Pupil; setCurrentView: (view: ViewId) => void }) {
  const [noteSaved, setNoteSaved] = useState(false);
  const [uploadAdded, setUploadAdded] = useState(false);
  const defaultNote = `Parent has asked whether sensory breaks can be made more consistent after lunch. Check this against current provision wording and raise in annual review.`;
  const [noteText, setNoteText] = useState(defaultNote);
  const [addedNotes, setAddedNotes] = useState<CaseNote[]>([]);
  const pupilNotes = [...addedNotes, ...caseNotes.filter((note) => note.pupilId === pupil.id)];
  const pupilUploads = uploadRecords.filter((record) => record.pupilId === pupil.id);

  const saveCaseNote = () => {
    const trimmedNote = noteText.trim();
    if (!trimmedNote) return;
    setAddedNotes((notes) => [
      {
        id: `new-${Date.now()}`,
        pupilId: pupil.id,
        date: "Today",
        author: "SENCO",
        category: "Parent contact",
        note: trimmedNote,
        linkedAction: "Confirm provision wording is specific and quantified",
      },
      ...notes,
    ]);
    setNoteSaved(true);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              <HelpTip id="notes">Confidential notes and uploads for {pupil.name}</HelpTip>
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This is inside the pupil file. Working notes, uploaded reports and summaries stay linked to this pupil, action, meeting and document output.
            </p>
          </div>
          <button
            type="button"
            onClick={saveCaseNote}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Save note to {pupil.name}'s file
          </button>
        </div>

        <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">
          Access-controlled SEND information: only authorised users should see case notes, professional reports, EHCP material and funding evidence. Every note/upload needs a pupil link and audit trail.
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">New note</p>
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            className="mt-3 h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none focus:border-pink-300"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>Links to {pupil.name}</Pill>
            <Pill tone="amber">Creates provision wording check</Pill>
            <Pill tone="blue">Available for annual review minutes</Pill>
          </div>
          {noteSaved && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Note saved and linked to the annual review pack.
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {pupilNotes.map((note) => (
            <div key={note.id} className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={note.category === "Concern" ? "rose" : note.category === "Decision" ? "amber" : "blue"}>{note.category}</Pill>
                  <span className="text-xs font-semibold text-slate-500">{note.date} · {note.author}</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">Linked action</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{note.note}</p>
              <p className="mt-3 text-sm font-semibold text-slate-950">{note.linkedAction}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">Upload intake</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Uploads are not just stored; they create summaries, actions, evidence links and draft wording.
            </p>
          </div>
          <button
            type="button"
            onMouseDown={() => setUploadAdded(true)}
            onClick={() => setUploadAdded(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white"
          >
            <Upload className="h-4 w-4" />
            Upload report
          </button>
        </div>

        {uploadAdded && (
          <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <h4 className="font-bold">Report added to intake</h4>
            <p className="mt-2 text-sm leading-6">
              Schoolgle would extract the summary, tag the pupil, update evidence readiness and add any missing actions for review.
            </p>
          </div>
        )}

        {!uploadAdded && (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-5">
            <h4 className="font-bold">Drop a report, plan, form or LA file here</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The intake route stores the source link, creates a summary, tags the pupil, updates evidence readiness and proposes linked actions.
            </p>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {pupilUploads.map((record) => (
            <div key={record.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold">{record.title}</h4>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{record.source}</p>
                </div>
                <Pill tone={record.status === "Needs upload" ? "amber" : record.status === "Summarised" ? "blue" : "green"}>
                  {record.status}
                </Pill>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{record.summary}</p>
              <p className="mt-3 text-sm font-semibold text-slate-950">Creates: {record.creates}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCurrentView("documents")}
          className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        >
          Use notes and uploads in documents
        </button>
      </Card>
    </div>
  );
}

function MeetingsView({ pupil, setCurrentView }: { pupil: Pupil; setCurrentView: (view: ViewId) => void }) {
  const [promptAdded, setPromptAdded] = useState(false);
  const [recording, setRecording] = useState(false);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pink-700">Confidential pupil file · meeting</p>
            <h2 className="text-2xl font-bold">
              <HelpTip id="meeting">Annual Review Meeting Copilot</HelpTip>
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pupil-linked meeting for {pupil.name}. Agenda, consent, transcript, prompts, minutes, actions and documents stay connected to the pupil record.
            </p>
            <p className="mt-2 text-sm font-semibold text-pink-700">
              Uses the existing Schoolgle Meetings engine with the SEND EHCP Annual Review template.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRecording((value) => !value)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white ${recording ? "bg-rose-600" : "bg-slate-950"}`}
            >
              <Mic className="h-4 w-4" />
              {recording ? "Recording live" : "Start recording"}
            </button>
            <button
              type="button"
              onClick={() => setPromptAdded(true)}
              className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {promptAdded ? "Prompt added" : "Add to minutes"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[ 
            "Confirm parent, pupil, school and professional views",
            "Review progress against each EHCP outcome",
            "Check whether provision is specific, quantified and still suitable",
            "Agree amendments, maintain/cease/reassess recommendation",
            "Confirm actions, owners, deadlines and LA paperwork",
            "Generate minutes and annual review report",
          ].map((item, index) => (
            <div key={item} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex gap-3">
                <CheckCircle2 className={`mt-0.5 h-5 w-5 ${index < 2 ? "text-emerald-600" : "text-slate-300"}`} />
                <p className="text-sm font-semibold leading-6">{item}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-bold">Template outputs</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {["Minutes", "Actions", "Annual review report"].map((item) => (
              <div key={item} className="rounded-2xl bg-white p-4 text-sm font-semibold ring-1 ring-slate-100">
                {item}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold">Live statutory prompt</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This appears during the meeting when the discussion suggests a statutory/evidence risk.
        </p>
        <div className="mt-5 rounded-3xl border border-pink-200 bg-pink-50 p-5">
          <Pill tone="pink">Suggested challenge</Pill>
          <p className="mt-3 text-sm font-semibold leading-6">
            "Can we confirm where the provision is described in specific and quantified terms, including frequency, duration and responsible adult?"
          </p>
          <p className="mt-3 text-xs leading-5 text-pink-900/70">
            Why: vague provision makes review, funding and accountability harder. Add this to minutes if agreed.
          </p>
          <button
            type="button"
            onClick={() => setPromptAdded(true)}
            className="mt-4 rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white"
          >
            {promptAdded ? "Added to minutes" : "Use this prompt"}
          </button>
        </div>

        <div className="mt-5 rounded-3xl bg-slate-50 p-5">
          <h4 className="font-bold">Generated after meeting</h4>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>• Minutes with agreed actions</li>
            <li>• Annual review report</li>
            <li>• Evidence pack updates</li>
            <li>• Tasks for SENCO, teacher, finance and parent contact</li>
          </ul>
          <button
            type="button"
            onClick={() => setCurrentView("documents")}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pink-700"
          >
            Create documents from minutes
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}

function EvidenceView({ pupil, setCurrentView }: { pupil: Pupil; setCurrentView: (view: ViewId) => void }) {
  const [generated, setGenerated] = useState(false);
  const evidenceItems = [
    ["Current EHCP", true],
    ["Parent/carer views", pupil.parentVoice === "Captured"],
    ["Pupil views", true],
    ["Teacher evidence", true],
    ["Provision impact notes", true],
    ["Professional reports", false],
    ["Attendance/behaviour context", true],
    ["Funding/provision cost evidence", false],
  ];

  const complete = evidenceItems.filter(([, done]) => done).length;
  const readiness = Math.round((complete / evidenceItems.length) * 100);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pink-700">Confidential pupil file · evidence</p>
            <h2 className="text-2xl font-bold">
              <HelpTip id="evidence">Evidence pack builder</HelpTip>
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Schoolgle checks what is present, what is stale and what is missing before the SENCO sends paperwork to the LA.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGenerated(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            <FileCheck2 className="h-4 w-4" />
            Generate evidence pack
          </button>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">{pupil.name} · Annual review / EHCP pack</h3>
              <p className="mt-1 text-sm text-slate-600">{complete} of {evidenceItems.length} evidence areas complete</p>
            </div>
            <span className="text-3xl font-bold">{readiness}%</span>
          </div>
          <div className="mt-4">
            <ProgressBar value={readiness} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {evidenceItems.map(([label, done]) => (
            <div key={label as string} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-sm font-semibold">{label}</span>
              {done ? <Pill tone="green">Ready</Pill> : <Pill tone="amber">Missing</Pill>}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold">Pack output</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The output is a usable working pack, not just a list: summary, evidence links, missing items, actions and draft wording.
        </p>
        <button
          type="button"
          onClick={() => setGenerated(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        >
          <FileCheck2 className="h-4 w-4" />
          Build pack from evidence
        </button>
        {generated && (
          <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <h4 className="font-bold">Pack generated</h4>
            <p className="mt-2 text-sm leading-6">
              Draft annual review pack created. Two missing evidence actions were added for professional reports and funding cost evidence.
            </p>
            <button
              type="button"
              onClick={() => setCurrentView("funding")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
            >
              Check funding evidence
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

function DocumentsView({ pupil, setCurrentView }: { pupil: Pupil; setCurrentView: (view: ViewId) => void }) {
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pink-700">Confidential pupil file · documents</p>
            <h2 className="text-2xl font-bold">
              <HelpTip id="documents">SEND document builder for {pupil.name}</HelpTip>
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Documents are built from approved meeting minutes, pupil records, uploaded reports, case notes, actions and funding checks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView("meetings")}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Open source meeting
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {documentOutputs.map((document) => (
            <div key={document.title} className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={document.status === "Needs approval" ? "amber" : document.status === "Draft" ? "blue" : "green"}>
                      {document.status}
                    </Pill>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{document.source}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold">{document.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{document.output}</p>
                </div>
                <button
                  type="button"
                  onMouseDown={() => setGeneratedDocument(document.title)}
                  onClick={() => setGeneratedDocument(document.title)}
                  className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Generate {document.title}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold">Draft preview</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Nothing is sent automatically. The SENCO reviews the draft, confirms wording, then exports or shares it.
        </p>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {generatedDocument ?? "Select a document"}
          </p>
          {generatedDocument ? (
            <>
              <h4 className="mt-3 font-bold">{generatedDocument} draft created</h4>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Source pack includes latest notes, meeting agenda items, pupil/parent views, provision evidence, funding check and linked actions.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">Review wording before sending</div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">Attach evidence links from Drive/SharePoint</div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">Create follow-up actions after approval</div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Choose a document from the left to see what will be produced from the working record.
            </p>
          )}
        </div>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => setCurrentView("evidence")}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
          >
            Check evidence sources
          </button>
          <button
            type="button"
            onClick={() => setCurrentView("funding")}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
          >
            Check funding before sending
          </button>
        </div>
      </Card>
    </div>
  );
}

function FundingView({ pupil }: { pupil: Pupil }) {
  const { items, summary } = useMemo(() => {
    const expectedSchedule = buildExpectedFundingSchedule({
      allocationId: `allocation-${pupil.id}`,
      pupilId: pupil.id,
      annualTopUpAmount: pupil.fundingAnnual || 12000,
      effectiveFrom: "2026-09-01",
      effectiveTo: "2026-12-31",
      paymentFrequency: "monthly",
      firstPaymentDueDate: "2026-11-01",
    });

    const reconciliation = reconcileFundingReceipts({
      asOfDate: "2026-11-15",
      expectedSchedule,
      receipts: [
        {
          receiptId: "la-sept",
          pupilId: pupil.id,
          periodStart: "2026-09-01",
          periodEnd: "2026-09-30",
          receivedAmount: 1000,
          receivedDate: "2026-11-01",
        },
        {
          receiptId: "la-oct",
          pupilId: pupil.id,
          periodStart: "2026-10-01",
          periodEnd: "2026-10-31",
          receivedAmount: 750,
          receivedDate: "2026-11-01",
        },
        {
          receiptId: "unmatched-line",
          pupilId: pupil.id,
          periodStart: "2027-01-01",
          periodEnd: "2027-01-31",
          receivedAmount: 640,
          receivedDate: "2026-11-03",
        },
      ],
    });

    return {
      items: reconciliation.items,
      summary: summarizeFundingReconciliation(reconciliation.items),
    };
  }, [pupil]);

  const visibleItems = items.filter((item) => item.status !== "unmatched_receipt");
  const unmatchedItems = items.filter((item) => item.status === "unmatched_receipt");
  const calculationLines = fundingCalculationLines[pupil.id] ?? [
    {
      id: `${pupil.id}-base`,
      label: "Base Element 3 top-up",
      calculationType: "Base" as const,
      basis: `${pupil.fundingBand} current LA allocation`,
      annualAmount: pupil.fundingAnnual,
      monthlyAmount: Math.round((pupil.fundingAnnual / 12) * 100) / 100,
      evidence: "Current LA funding agreement",
      effectiveFrom: "01 Sep 2026",
      status: "Current" as const,
    },
  ];
  const forecastLines = fundingForecastLines[pupil.id] ?? visibleItems.map((item) => ({
    period: item.periodStart,
    dueDate: item.dueDate,
    expectedAmount: item.expectedAmount,
    receivedAmount: item.receivedAmount,
    status: item.status === "matched" ? "Received" as const : item.status === "underpaid" ? "Shortfall" as const : "Forecast from agreed change" as const,
    basis: `${pupil.fundingBand} current LA allocation`,
  }));
  const calculatedAnnualTotal = calculationLines.reduce((total, line) => total + line.annualAmount, 0);
  const calculatedMonthlyTotal = calculationLines.reduce((total, line) => total + line.monthlyAmount, 0);
  const forecastDueTotal = forecastLines.reduce((total, line) => total + line.expectedAmount, 0);
  const forecastReceivedTotal = forecastLines.reduce((total, line) => total + line.receivedAmount, 0);
  const forecastShortfall = forecastDueTotal - forecastReceivedTotal;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pink-700">Confidential pupil file · funding</p>
            <h2 className="text-2xl font-bold">Funding action needed for {pupil.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Schoolgle has found a likely top-up funding variance. Review the evidence, then create a human-approved LA query draft.
            </p>
          </div>
          <button className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white">
            Create draft query
          </button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Transparent funding calculation</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Shows exactly how {pupil.name}'s allocation is made up: base band, add-ons, agreed changes, evidence and effective date.
              </p>
            </div>
            <Pill tone="blue">{currencyFormatter.format(calculatedAnnualTotal)} annual total</Pill>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Calculation line</th>
                  <th className="px-4 py-3">Basis</th>
                  <th className="px-4 py-3">Annual</th>
                  <th className="px-4 py-3">Monthly</th>
                  <th className="px-4 py-3">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calculationLines.map((line) => (
                  <tr key={line.id} className="bg-white">
                    <td className="px-4 py-4">
                      <div className="font-bold">{line.label}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Pill tone={line.calculationType === "Agreed change" ? "amber" : line.calculationType === "Add-on" ? "blue" : "slate"}>
                          {line.calculationType}
                        </Pill>
                        <Pill tone={line.status === "Forecast" ? "amber" : "green"}>{line.status}</Pill>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {line.basis}
                      <span className="block text-xs font-semibold text-slate-500">Effective {line.effectiveFrom}</span>
                    </td>
                    <td className="px-4 py-4 font-bold">{currencyFormatter.format(line.annualAmount)}</td>
                    <td className="px-4 py-4 font-semibold">{currencyFormatter.format(line.monthlyAmount)}</td>
                    <td className="px-4 py-4 text-slate-600">{line.evidence}</td>
                  </tr>
                ))}
                <tr className="bg-pink-50/70">
                  <td className="px-4 py-4 font-bold" colSpan={2}>Calculated allocation</td>
                  <td className="px-4 py-4 font-bold">{currencyFormatter.format(calculatedAnnualTotal)}</td>
                  <td className="px-4 py-4 font-bold">{currencyFormatter.format(calculatedMonthlyTotal)}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-pink-700">Used to forecast expected receipts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-bold">Funding band table</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This is the maintained LA table behind the calculation. Finance/SENCO can update annual values when a local authority publishes new rates.
          </p>
          <div className="mt-5 space-y-3">
            {[
              ["Band 1", "£4,800", "Low-level additional adult support"],
              ["Band 2", "£8,400", "Regular targeted support and transition planning"],
              ["Band 3", "£10,800", "Significant quantified provision"],
              ["Exceptional", "Manual", "Panel-agreed bespoke package"],
            ].map(([band, amount, description]) => (
              <div key={band} className={`rounded-2xl border p-4 ${band === pupil.fundingBand ? "border-pink-200 bg-pink-50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold">{band}</h4>
                  <span className="text-sm font-semibold text-slate-700">{amount}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
          <button className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            Maintain LA band table
          </button>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Expected" value={currencyFormatter.format(summary.expectedTotal)} detail={`${pupil.fundingBand} top-up forecast`} tone="blue" />
        <MetricCard label="Received" value={currencyFormatter.format(summary.receivedTotal)} detail="Matched LA receipt lines" tone="green" />
        <MetricCard label="Outstanding" value={currencyFormatter.format(summary.outstandingTotal)} detail="Needs review or query" tone="rose" />
        <MetricCard label="Backdated due" value={currencyFormatter.format(summary.backdatedOutstandingTotal)} detail="Prior period funding still short" tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                <HelpTip id="funding">Funding reconciliation</HelpTip>
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Upload the LA remittance. Schoolgle matches expected payments to actual receipts and flags variances.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <Upload className="h-4 w-4" />
                Upload LA file
              </button>
              <button className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white">
                Build query pack
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Expected</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Variance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleItems.map((item) => {
                  const style = statusStyles[item.status];
                  return (
                    <tr key={`${item.periodStart}-${item.periodEnd}`}>
                      <td className="px-4 py-4 font-semibold">{item.periodStart}<span className="block text-xs font-medium text-slate-500">Due {item.dueDate}</span></td>
                      <td className="px-4 py-4">{currencyFormatter.format(item.expectedAmount)}</td>
                      <td className="px-4 py-4">{currencyFormatter.format(item.receivedAmount)}</td>
                      <td className={item.varianceAmount < 0 ? "px-4 py-4 font-bold text-rose-700" : "px-4 py-4 font-bold"}>{currencyFormatter.format(item.varianceAmount)}</td>
                      <td className="px-4 py-4">
                        <Pill tone={item.status === "matched" ? "green" : item.status === "underpaid" ? "amber" : item.status === "overdue" ? "rose" : "slate"}>
                          {style.label}
                        </Pill>
                        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">{style.explanation}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {unmatchedItems.length > 0 && (
            <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">
              <strong>{unmatchedItems.length} unmatched receipt line:</strong> {currencyFormatter.format(unmatchedItems[0].receivedAmount)} needs manual match, ignore or query.
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-xl font-bold">Forecast funding schedule</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Combines what is due, what has landed and what is forecast from agreed LA changes.
          </p>
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecastLines.map((line) => (
                  <tr key={line.period} className="bg-white">
                    <td className="px-4 py-4 font-semibold">
                      {line.period}
                      <span className="block text-xs font-medium text-slate-500">Due {line.dueDate}</span>
                    </td>
                    <td className="px-4 py-4">{currencyFormatter.format(line.expectedAmount)}</td>
                    <td className="px-4 py-4">{currencyFormatter.format(line.receivedAmount)}</td>
                    <td className="px-4 py-4">
                      <Pill tone={line.status === "Received" ? "green" : line.status === "Shortfall" ? "rose" : "amber"}>{line.status}</Pill>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{line.basis}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            Forecast due {currencyFormatter.format(forecastDueTotal)} · received {currencyFormatter.format(forecastReceivedTotal)} · remaining/forecast {currencyFormatter.format(forecastShortfall)}.
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <Card>
          <h3 className="text-xl font-bold">LA query pack</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Schoolgle prepares the query. It does not send anything without human approval.
          </p>
          <div className="mt-5 space-y-3">
            {[
              `Funding agreement: ${pupil.fundingBand}, ${currencyFormatter.format(calculatedAnnualTotal)}/year`,
              `Calculation: ${calculationLines.map((line) => `${line.label} ${currencyFormatter.format(line.annualAmount)}`).join(" + ")}`,
              `Expected September-December: ${currencyFormatter.format(forecastDueTotal)}`,
              `Received against matched periods: ${currencyFormatter.format(forecastReceivedTotal)}`,
              `Potential shortfall/forecast still to land: ${currencyFormatter.format(forecastShortfall)}`,
              "Evidence links: EHCP, annual review notes, panel agreement",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <button className="mt-5 w-full rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white">
            Create query from pack
          </button>
        </Card>

        <Card>
          <h3 className="text-xl font-bold">Evidence supporting forecast</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Every forecast or challenge must point back to the pupil record so finance can evidence why the money is due.
          </p>
          <div className="mt-5 space-y-3">
            {[
              ["EHCP Section F", "Quantified provision that drives the base allocation."],
              ["SALT report - April 2026", "Supports the communication and interaction add-on."],
              ["Annual review minutes", "Shows the agreed increase and effective date."],
              ["LA panel agreement", "Confirms the future payment should be forecast."],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-bold">{title}</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
          <button className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            Open linked evidence
          </button>
        </Card>
      </div>
    </div>
  );
}

function LeadershipView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="SEND pupils" value="84" detail="EHCP, SEN Support and monitoring." tone="blue" />
        <MetricCard label="Evidence packs ready" value="68%" detail="Trust-wide current readiness." tone="amber" />
        <MetricCard label="Funding variance" value="£18.4k" detail="Across open reconciliation runs." tone="rose" />
        <MetricCard label="Governor report" value="Ready" detail="Draft can be reviewed this week." tone="green" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-bold">
            <HelpTip id="leadership">Inclusion leadership</HelpTip>
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This is the SLT/trust layer: enough detail to govern and support, without exposing unnecessary sensitive pupil detail.
          </p>
          <div className="mt-5 space-y-3">
            {[
              ["SLT Inclusion Brief", "Weekly summary of risks, deadlines, resource pressure and actions."],
              ["Governor SEND/Inclusion Report", "Termly report with provision, outcomes, funding, statutory deadlines and impact."],
              ["Ofsted Inclusion Evidence Pack", "Evidence that vulnerable/SEND pupils are known, supported and making progress."],
              ["New Staff Briefing Pack", "Teacher-facing strategies and key information for pupils they teach."],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Trust view</h2>
          <div className="mt-5 space-y-4">
            {[
              ["City Hub Primary", 82, "£7.2k variance"],
              ["North Ridge Academy", 74, "£4.1k variance"],
              ["Silsden Primary", 91, "£1.3k variance"],
              ["Oakfield Primary", 63, "£5.8k variance"],
            ].map(([school, readiness, variance]) => (
              <div key={school as string} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{school}</h3>
                  <span className="text-sm font-semibold text-slate-600">{variance}</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={readiness as number} />
                </div>
                <p className="mt-2 text-xs text-slate-500">Evidence readiness {readiness}%</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SafetyBanner() {
  return (
    <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <div className="flex gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-bold">Human-approved, not magic autopilot</h3>
          <p className="mt-1 text-sm leading-6">
            The system drafts, checks and organises. The SENCO, finance team or leader approves decisions, submissions, prompts and LA queries.
          </p>
        </div>
      </div>
    </div>
  );
}

function SetupView({ setCurrentView }: { setCurrentView: (view: ViewId) => void }) {
  const completedCount = setupSteps.filter((step) => step.status === "Complete").length;
  const readyCount = setupSteps.filter((step) => step.status === "Ready").length;
  const reviewCount = setupSteps.filter((step) => step.status === "Needs review").length;
  const setupPercent = Math.round(((completedCount + readyCount * 0.6) / setupSteps.length) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              <HelpTip id="setup">Setup the SEND & Inclusion Copilot</HelpTip>
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              This is the first-run setup a customer should see. It turns messy school data into a working SENCO system: pupils, owners, local authority rules, evidence folders, funding schedules and meeting templates.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-lg">
              <p className="text-sm text-slate-300">Setup readiness</p>
              <p className="mt-2 text-4xl font-bold">{setupPercent}%</p>
              <p className="mt-2 text-sm text-slate-300">
                {completedCount} complete · {readyCount} ready · {reviewCount} need review
              </p>
            </div>
            <button
              type="button"
              onMouseDown={() => setCurrentView("today")}
              onClick={() => setCurrentView("today")}
              className="w-full rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
            >
              Open SEND Today
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <MetricCard label="Imported pupils" value="84" detail="From Arbor API, Arbor-exported connected sheet, or CSV into SEND register." tone="blue" />
          <MetricCard label="Evidence folders" value="1" detail="Schoolgle SEND folder connected." tone="green" />
          <MetricCard label="LA rule pack" value="Draft" detail="Bradford bands/payment dates need approval." tone="amber" />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold">Setup checklist</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Each step creates the actions, permissions and data needed for the rest of the product to work.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView("today")}
            className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Continue to SEND Today
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {setupSteps.map((step, index) => (
            <div key={step.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold">{step.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Owner: {step.owner}
                    </p>
                  </div>
                </div>
                <Pill tone={step.status === "Complete" ? "green" : step.status === "Ready" ? "blue" : "amber"}>
                  {step.status}
                </Pill>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-2xl font-bold">After setup, the working flow is simple</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-6">
          {[
            ["1", "SEND Today", "See what needs doing."],
            ["2", "Pupil", "Open the one-view."],
            ["3", "Diary", "See deadlines and next actions."],
            ["4", "Notes", "Add context and uploads."],
            ["5", "Meeting", "Run the workflow."],
            ["6", "Docs", "Generate outputs."],
          ].map(([number, title, detail]) => (
            <div key={title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <span className="text-xs font-bold text-pink-600">{number}</span>
              <h4 className="mt-2 font-bold">{title}</h4>
              <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function SendFundingDemoPage() {
  const [currentView, setCurrentView] = useState<ViewId>("today");
  const [selectedPupilId, setSelectedPupilId] = useState("amelia");
  const selectedPupil = pupils.find((pupil) => pupil.id === selectedPupilId) ?? pupils[0];
  const goToView = (view: ViewId) => {
    setCurrentView(view);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <ProductHeader currentView={currentView} setCurrentView={goToView} />
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {currentView === "setup" && <SafetyBanner />}

        {currentView === "setup" && <SetupView setCurrentView={goToView} />}
        {currentView === "today" && (
          <TodayView
            selectedPupil={selectedPupil}
            setSelectedPupilId={setSelectedPupilId}
            setCurrentView={goToView}
          />
        )}
        {currentView === "pupils" && (
          <PupilsView
            selectedPupilId={selectedPupilId}
            setSelectedPupilId={setSelectedPupilId}
            setCurrentView={goToView}
          />
        )}
        {currentView === "pupil" && <PupilView pupil={selectedPupil} setCurrentView={goToView} />}
        {currentView === "ehcp" && <EhcpProvisionView pupil={selectedPupil} setCurrentView={goToView} />}
        {currentView === "diary" && (
          <DiaryView
            selectedPupilId={selectedPupilId}
            setSelectedPupilId={setSelectedPupilId}
            setCurrentView={goToView}
          />
        )}
        {currentView === "notes" && <NotesUploadsView pupil={selectedPupil} setCurrentView={goToView} />}
        {currentView === "meetings" && <MeetingsView pupil={selectedPupil} setCurrentView={goToView} />}
        {currentView === "evidence" && <EvidenceView pupil={selectedPupil} setCurrentView={goToView} />}
        {currentView === "documents" && <DocumentsView pupil={selectedPupil} setCurrentView={goToView} />}
        {currentView === "funding" && <FundingView pupil={selectedPupil} />}
        {currentView === "leadership" && <LeadershipView />}
      </div>
    </main>
  );
}
