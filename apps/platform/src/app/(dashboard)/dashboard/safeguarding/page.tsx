"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Shield,
  AlertTriangle,
  Eye,
  FileText,
  Phone,
  Users,
  Clock,
  Plus,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  CircleDot,
  ArrowRight,
  Calendar,
  MapPin,
  MessageSquare,
  User,
  Lock,
  ExternalLink,
  Filter,
  Search,
  Download,
  RefreshCw,
  Activity,
  TrendingUp,
  Megaphone,
  CircleAlert,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Baby,
  Brain,
  Wifi,
  Heart,
  Home,
  Syringe,
  GraduationCap,
  Scale,
  HandHelping,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Concern {
  id: string;
  reference_number: string;
  pupil_pseudonym_label: string;
  pupil_pseudonym_id: string | null;
  category: string;
  severity: "red" | "amber" | "green";
  status: string;
  description: string;
  location: string | null;
  date_of_concern: string;
  time_of_concern: string | null;
  witnesses: string | null;
  is_anonymous: boolean;
  reported_by: string | null;
  triage_outcome: string | null;
  triage_notes: string | null;
  assigned_to: string | null;
  follow_up_date: string | null;
  body_map_data: BodyMapMark[] | null;
  immediate_actions_taken: string | null;
  created_at: string;
  updated_at: string;
}

interface ChronologyEntry {
  id: string;
  concern_id: string;
  entry_type: string;
  description: string;
  recorded_by: string | null;
  entry_date: string;
  metadata: Record<string, unknown> | null;
}

interface Referral {
  id: string;
  concern_id: string;
  reference_number: string;
  referral_type: string;
  referred_to_agency: string;
  referred_to_contact: string | null;
  referral_reason: string | null;
  referral_date: string;
  referred_by: string;
  urgency: string;
  outcome_status: string;
  outcome_notes: string | null;
  outcome_date: string | null;
}

interface BodyMapMark {
  id: string;
  x: number;
  y: number;
  side: "front" | "back";
  label: string;
  notes: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const KCSIE_CATEGORIES: {
  value: string;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "physical_abuse",
    label: "Physical Abuse",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  {
    value: "emotional_abuse",
    label: "Emotional Abuse",
    icon: <Heart className="w-4 h-4" />,
  },
  {
    value: "sexual_abuse",
    label: "Sexual Abuse",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  { value: "neglect", label: "Neglect", icon: <UserX className="w-4 h-4" /> },
  {
    value: "child_sexual_exploitation",
    label: "Child Sexual Exploitation (CSE)",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  {
    value: "child_criminal_exploitation",
    label: "Child Criminal Exploitation (CCE)",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  {
    value: "radicalisation",
    label: "Radicalisation / Prevent",
    icon: <Megaphone className="w-4 h-4" />,
  },
  {
    value: "fgm",
    label: "Female Genital Mutilation (FGM)",
    icon: <CircleAlert className="w-4 h-4" />,
  },
  {
    value: "forced_marriage",
    label: "Forced Marriage",
    icon: <Scale className="w-4 h-4" />,
  },
  {
    value: "honour_based",
    label: "Honour-Based Abuse",
    icon: <Scale className="w-4 h-4" />,
  },
  {
    value: "peer_on_peer",
    label: "Peer-on-Peer / Child-on-Child Abuse",
    icon: <Users className="w-4 h-4" />,
  },
  {
    value: "online_safety",
    label: "Online Safety / Cyber",
    icon: <Wifi className="w-4 h-4" />,
  },
  {
    value: "mental_health",
    label: "Mental Health",
    icon: <Brain className="w-4 h-4" />,
  },
  {
    value: "self_harm",
    label: "Self-Harm / Suicidal Ideation",
    icon: <Heart className="w-4 h-4" />,
  },
  {
    value: "domestic_abuse",
    label: "Domestic Abuse (Household)",
    icon: <Home className="w-4 h-4" />,
  },
  {
    value: "substance_misuse",
    label: "Substance Misuse",
    icon: <Syringe className="w-4 h-4" />,
  },
  {
    value: "missing_education",
    label: "Children Missing Education (CME)",
    icon: <GraduationCap className="w-4 h-4" />,
  },
  {
    value: "private_fostering",
    label: "Private Fostering",
    icon: <Baby className="w-4 h-4" />,
  },
  {
    value: "contextual_safeguarding",
    label: "Contextual Safeguarding",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    value: "other",
    label: "Other Concern",
    icon: <FileText className="w-4 h-4" />,
  },
];

const TRIAGE_OUTCOMES: { value: string; label: string; description: string }[] =
  [
    {
      value: "monitor",
      label: "Monitor",
      description: "Continue to observe and document",
    },
    {
      value: "early_help",
      label: "Early Help Assessment",
      description: "Initiate early help referral",
    },
    {
      value: "referral_cscs",
      label: "Referral to CSCS",
      description: "Children's Social Care Services",
    },
    {
      value: "referral_police",
      label: "Referral to Police",
      description: "Report to police",
    },
    {
      value: "referral_lado",
      label: "Referral to LADO",
      description: "Local Authority Designated Officer",
    },
    {
      value: "referral_mash",
      label: "Referral to MASH",
      description: "Multi-Agency Safeguarding Hub",
    },
    {
      value: "internal_support",
      label: "Internal Support",
      description: "School-based support plan",
    },
    {
      value: "no_further_action",
      label: "No Further Action",
      description: "No safeguarding concerns identified",
    },
    {
      value: "escalate_dsl",
      label: "Escalate to DSL",
      description: "Escalate to Designated Safeguarding Lead",
    },
  ];

const SEVERITY_CONFIG = {
  red: {
    label: "Immediate Danger",
    bg: "bg-red-500",
    bgLight: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    ring: "ring-red-500",
  },
  amber: {
    label: "Concern / Monitoring",
    bg: "bg-amber-500",
    bgLight: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    ring: "ring-amber-500",
  },
  green: {
    label: "Low-Level / Resolved",
    bg: "bg-green-500",
    bgLight: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    ring: "ring-green-500",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  open: {
    label: "Open",
    icon: <CircleDot className="w-4 h-4" />,
    color: "text-blue-600",
  },
  triaged: {
    label: "Triaged",
    icon: <Eye className="w-4 h-4" />,
    color: "text-purple-600",
  },
  referred: {
    label: "Referred",
    icon: <ExternalLink className="w-4 h-4" />,
    color: "text-orange-600",
  },
  monitoring: {
    label: "Monitoring",
    icon: <Activity className="w-4 h-4" />,
    color: "text-cyan-600",
  },
  closed: {
    label: "Closed",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-green-600",
  },
};

const ENTRY_TYPE_ICONS: Record<string, React.ReactNode> = {
  concern_raised: <AlertCircle className="w-4 h-4 text-red-500" />,
  status_change: <RefreshCw className="w-4 h-4 text-blue-500" />,
  severity_change: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  triage: <Eye className="w-4 h-4 text-purple-500" />,
  note: <FileText className="w-4 h-4 text-gray-500" />,
  phone_call: <Phone className="w-4 h-4 text-green-500" />,
  meeting: <Users className="w-4 h-4 text-blue-500" />,
  parent_contact: <User className="w-4 h-4 text-indigo-500" />,
  agency_contact: <ExternalLink className="w-4 h-4 text-orange-500" />,
  disclosure: <MessageSquare className="w-4 h-4 text-red-500" />,
  observation: <Eye className="w-4 h-4 text-cyan-500" />,
  referral_made: <ArrowRight className="w-4 h-4 text-orange-500" />,
  referral_outcome: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  follow_up: <Clock className="w-4 h-4 text-amber-500" />,
  review: <Search className="w-4 h-4 text-blue-500" />,
  escalation: <TrendingUp className="w-4 h-4 text-red-500" />,
  closure: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  reopened: <RefreshCw className="w-4 h-4 text-red-500" />,
};

// ─── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_CONCERNS: Concern[] = [
  {
    id: "sg-001",
    reference_number: "SG-2026-001",
    pupil_pseudonym_label: "Pupil A",
    pupil_pseudonym_id: "h_a1b2c3",
    category: "physical_abuse",
    severity: "red",
    status: "referred",
    description:
      "Pupil presented with unexplained bruising on upper left arm and flinched when touched. Pupil initially reluctant to discuss but eventually stated 'someone at home did it'. Immediate referral to DSL initiated. Pupil appeared distressed but calmed after being given space.",
    location: "Year 4 Classroom",
    date_of_concern: "2026-03-08",
    time_of_concern: "09:15",
    witnesses: "Mrs Thompson (TA)",
    is_anonymous: false,
    reported_by: "user-teacher-01",
    triage_outcome: "referral_mash",
    triage_notes:
      "Immediate referral required. Clear disclosure of physical harm at home. MASH contacted within 1 hour.",
    assigned_to: "user-dsl-01",
    follow_up_date: "2026-03-11",
    body_map_data: [
      {
        id: "bm-1",
        x: 25,
        y: 35,
        side: "front",
        label: "Bruising",
        notes:
          "Approximately 5cm purple bruise on upper left arm, consistent with grip marks",
      },
    ],
    immediate_actions_taken:
      "Pupil kept in school, given water, reassured they were safe. DSL informed immediately.",
    created_at: "2026-03-08T09:20:00Z",
    updated_at: "2026-03-08T10:45:00Z",
  },
  {
    id: "sg-002",
    reference_number: "SG-2026-002",
    pupil_pseudonym_label: "Pupil B",
    pupil_pseudonym_id: "h_d4e5f6",
    category: "neglect",
    severity: "amber",
    status: "monitoring",
    description:
      "Pupil has arrived at school without appropriate clothing for the third consecutive week. Uniform is unwashed and ill-fitting. Pupil appears tired and has mentioned not having breakfast. Lunch account shows declining balance. Previous pastoral checks noted similar patterns last term.",
    location: "School Reception",
    date_of_concern: "2026-03-06",
    time_of_concern: "08:45",
    witnesses: null,
    is_anonymous: false,
    reported_by: "user-teacher-02",
    triage_outcome: "early_help",
    triage_notes:
      "Pattern of neglect indicators. Early Help assessment initiated. Family support worker to visit.",
    assigned_to: "user-dsl-01",
    follow_up_date: "2026-03-13",
    body_map_data: null,
    immediate_actions_taken:
      "Breakfast provided. Spare uniform offered. Previous concerns cross-referenced.",
    created_at: "2026-03-06T08:50:00Z",
    updated_at: "2026-03-07T14:30:00Z",
  },
  {
    id: "sg-003",
    reference_number: "SG-2026-003",
    pupil_pseudonym_label: "Pupil C",
    pupil_pseudonym_id: "h_g7h8i9",
    category: "online_safety",
    severity: "amber",
    status: "triaged",
    description:
      "Pupil reported to class teacher that they have been receiving threatening messages on social media from an older individual. The individual has asked for photos. Pupil showed teacher the messages on their phone during break time. Screenshots taken as evidence.",
    location: "ICT Suite",
    date_of_concern: "2026-03-07",
    time_of_concern: "11:30",
    witnesses: null,
    is_anonymous: false,
    reported_by: "user-teacher-03",
    triage_outcome: "referral_police",
    triage_notes:
      "Potential grooming behaviour. Screenshots preserved. Police referral required under KCSIE guidance.",
    assigned_to: "user-dsl-01",
    follow_up_date: "2026-03-10",
    body_map_data: null,
    immediate_actions_taken:
      "Screenshots taken and securely stored. Phone secured. Parents to be contacted by DSL.",
    created_at: "2026-03-07T11:35:00Z",
    updated_at: "2026-03-07T15:20:00Z",
  },
  {
    id: "sg-004",
    reference_number: "SG-2026-004",
    pupil_pseudonym_label: "Pupil D",
    pupil_pseudonym_id: "h_j0k1l2",
    category: "self_harm",
    severity: "red",
    status: "open",
    description:
      "During PE lesson, pupil's sleeve rolled up revealing multiple superficial cuts on forearm in various stages of healing. When asked about them, pupil became upset and asked to leave. Pupil stated 'I can't talk about it'. Pupil collected from PE and taken to welfare room.",
    location: "Sports Hall",
    date_of_concern: "2026-03-10",
    time_of_concern: "14:00",
    witnesses: "Mr Richards (PE Teacher)",
    is_anonymous: false,
    reported_by: "user-teacher-04",
    triage_outcome: null,
    triage_notes: null,
    assigned_to: null,
    follow_up_date: null,
    body_map_data: [
      {
        id: "bm-2",
        x: 72,
        y: 42,
        side: "front",
        label: "Cuts",
        notes:
          "Multiple superficial cuts on left forearm, various stages of healing (some fresh, some scarred)",
      },
    ],
    immediate_actions_taken:
      "Pupil taken to welfare room. First aider assessed. DSL notified. Pupil given water and reassured.",
    created_at: "2026-03-10T14:05:00Z",
    updated_at: "2026-03-10T14:05:00Z",
  },
  {
    id: "sg-005",
    reference_number: "SG-2026-005",
    pupil_pseudonym_label: "Pupil E",
    pupil_pseudonym_id: "h_m3n4o5",
    category: "peer_on_peer",
    severity: "amber",
    status: "triaged",
    description:
      "Multiple pupils reported that Pupil E is being targeted by a group of Year 6 pupils. Incidents include name-calling, exclusion from activities, and having belongings hidden. One incident involved pushing in the corridor. Pupil E has become increasingly withdrawn and attendance has dropped.",
    location: "Playground / Corridors",
    date_of_concern: "2026-03-05",
    time_of_concern: "13:15",
    witnesses: "Three Year 5 pupils (statements taken)",
    is_anonymous: false,
    reported_by: "user-teacher-05",
    triage_outcome: "internal_support",
    triage_notes:
      "Bullying investigation initiated. Restorative justice meeting planned. Support plan for Pupil E.",
    assigned_to: "user-pastoral-01",
    follow_up_date: "2026-03-12",
    body_map_data: null,
    immediate_actions_taken:
      "Witness statements collected. Year 6 pupils spoken to individually. Parents of all parties informed.",
    created_at: "2026-03-05T13:20:00Z",
    updated_at: "2026-03-06T09:00:00Z",
  },
  {
    id: "sg-006",
    reference_number: "SG-2026-006",
    pupil_pseudonym_label: "Pupil F",
    pupil_pseudonym_id: "h_p6q7r8",
    category: "domestic_abuse",
    severity: "red",
    status: "referred",
    description:
      "Pupil disclosed to TA during quiet reading that 'daddy hits mummy and she cries'. Pupil appeared anxious and asked TA not to tell anyone. Disclosure was carefully managed following KCSIE TED approach. Pupil was reassured. Information passed to DSL immediately via secure concern form.",
    location: "Year 2 Reading Corner",
    date_of_concern: "2026-03-04",
    time_of_concern: "10:45",
    witnesses: null,
    is_anonymous: false,
    reported_by: "user-ta-01",
    triage_outcome: "referral_cscs",
    triage_notes:
      "Clear disclosure of domestic abuse. CSCS contacted same day. Operation Encompass check requested.",
    assigned_to: "user-dsl-01",
    follow_up_date: "2026-03-07",
    body_map_data: null,
    immediate_actions_taken:
      "Disclosure recorded verbatim. DSL informed within 15 minutes. Pupil returned to class with TA support.",
    created_at: "2026-03-04T10:50:00Z",
    updated_at: "2026-03-04T16:30:00Z",
  },
  {
    id: "sg-007",
    reference_number: "SG-2026-007",
    pupil_pseudonym_label: "Pupil G",
    pupil_pseudonym_id: "h_s9t0u1",
    category: "mental_health",
    severity: "green",
    status: "monitoring",
    description:
      "Pupil has been displaying increased anxiety around school transitions and lunchtimes. Reluctant to enter classroom in mornings, tearful at drop-off. Parents have shared that pupil is having nightmares. No safeguarding concerns at home — parents engaged and supportive.",
    location: "Year 1 Entrance",
    date_of_concern: "2026-03-03",
    time_of_concern: "08:55",
    witnesses: "Mrs Patel (Class Teacher)",
    is_anonymous: false,
    reported_by: "user-teacher-06",
    triage_outcome: "internal_support",
    triage_notes:
      "Anxiety support plan created. ELSA sessions arranged. Parents kept informed. No external referral needed at this stage.",
    assigned_to: "user-senco-01",
    follow_up_date: "2026-03-17",
    body_map_data: null,
    immediate_actions_taken:
      "Meet and greet at gate arranged. Safe space identified. SENCO informed.",
    created_at: "2026-03-03T09:00:00Z",
    updated_at: "2026-03-05T11:00:00Z",
  },
  {
    id: "sg-008",
    reference_number: "SG-2026-008",
    pupil_pseudonym_label: "Pupil H",
    pupil_pseudonym_id: "h_v2w3x4",
    category: "radicalisation",
    severity: "amber",
    status: "triaged",
    description:
      "ICT monitoring software flagged searches related to extremist content. Pupil has also been making comments in class that suggest exposure to radical viewpoints. RE teacher noted a change in rhetoric over the past 3 weeks. Prevent referral being considered.",
    location: "ICT Suite / Year 6 Classroom",
    date_of_concern: "2026-03-09",
    time_of_concern: "14:30",
    witnesses: "Miss Ahmed (RE Teacher), IT Monitoring System",
    is_anonymous: false,
    reported_by: "user-teacher-07",
    triage_outcome: "escalate_dsl",
    triage_notes:
      "Prevent referral pathway initiated. DSL consulting with Local Authority Prevent lead.",
    assigned_to: "user-dsl-01",
    follow_up_date: "2026-03-11",
    body_map_data: null,
    immediate_actions_taken:
      "ICT search logs preserved. RE teacher notes documented. DSL briefed.",
    created_at: "2026-03-09T14:35:00Z",
    updated_at: "2026-03-09T16:00:00Z",
  },
  {
    id: "sg-009",
    reference_number: "SG-2026-009",
    pupil_pseudonym_label: "Pupil I",
    pupil_pseudonym_id: "h_y5z6a7",
    category: "missing_education",
    severity: "amber",
    status: "open",
    description:
      "Pupil has been absent for 8 consecutive school days. No communication from parents despite multiple contact attempts (phone, text, email, home visit attempted). Pupil was previously on 92% attendance. Last contact with family was 12 days ago. Neighbours report family may have moved.",
    location: "N/A",
    date_of_concern: "2026-03-10",
    time_of_concern: null,
    witnesses: null,
    is_anonymous: false,
    reported_by: "user-admin-01",
    triage_outcome: null,
    triage_notes: null,
    assigned_to: null,
    follow_up_date: null,
    body_map_data: null,
    immediate_actions_taken:
      "Daily phone calls logged. Home visit attempted (no answer). CME referral form being prepared.",
    created_at: "2026-03-10T10:00:00Z",
    updated_at: "2026-03-10T10:00:00Z",
  },
  {
    id: "sg-010",
    reference_number: "SG-2026-010",
    pupil_pseudonym_label: "Pupil J",
    pupil_pseudonym_id: "h_b8c9d0",
    category: "contextual_safeguarding",
    severity: "green",
    status: "closed",
    description:
      "Community police officer shared intelligence that a known individual has been approaching children at the park adjacent to school. Two pupils from our school use this park regularly. Parents informed via targeted letter. Risk assessment updated for after-school activities.",
    location: "External - Adjacent Park",
    date_of_concern: "2026-02-28",
    time_of_concern: null,
    witnesses: "PC Morris (Community Police)",
    is_anonymous: false,
    reported_by: "user-dsl-01",
    triage_outcome: "monitor",
    triage_notes:
      "Parents informed. Staff briefed on heightened awareness. Gate supervision increased. Police handling externally.",
    assigned_to: "user-dsl-01",
    follow_up_date: "2026-03-14",
    body_map_data: null,
    immediate_actions_taken:
      "Staff briefing issued. Gate supervision enhanced. Parents of identified pupils contacted directly.",
    created_at: "2026-02-28T15:00:00Z",
    updated_at: "2026-03-05T09:00:00Z",
  },
];

const DEMO_CHRONOLOGY: Record<string, ChronologyEntry[]> = {
  "sg-001": [
    {
      id: "ch-001",
      concern_id: "sg-001",
      entry_type: "concern_raised",
      description:
        "Concern raised: Physical abuse (RED). Unexplained bruising observed on upper left arm.",
      recorded_by: "Mrs Williams (Year 4 Teacher)",
      entry_date: "2026-03-08T09:20:00Z",
      metadata: null,
    },
    {
      id: "ch-002",
      concern_id: "sg-001",
      entry_type: "disclosure",
      description:
        "Pupil stated 'someone at home did it' when asked about bruising. Disclosure managed using TED approach.",
      recorded_by: "Mrs Williams (Year 4 Teacher)",
      entry_date: "2026-03-08T09:25:00Z",
      metadata: null,
    },
    {
      id: "ch-003",
      concern_id: "sg-001",
      entry_type: "escalation",
      description:
        "DSL (Mrs Johnson) informed immediately. Pupil taken to welfare room.",
      recorded_by: "Mrs Williams (Year 4 Teacher)",
      entry_date: "2026-03-08T09:30:00Z",
      metadata: null,
    },
    {
      id: "ch-004",
      concern_id: "sg-001",
      entry_type: "triage",
      description:
        "Triaged: Referral to MASH. Immediate referral required due to clear disclosure of physical harm.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-08T09:45:00Z",
      metadata: null,
    },
    {
      id: "ch-005",
      concern_id: "sg-001",
      entry_type: "phone_call",
      description:
        "Called MASH. Reference given: MASH-2026-4521. Social worker assigned: Ms Carter.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-08T10:15:00Z",
      metadata: null,
    },
    {
      id: "ch-006",
      concern_id: "sg-001",
      entry_type: "referral_made",
      description:
        "Referral made to MASH - Ref: REF-2026-001. Written referral submitted via secure portal.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-08T10:30:00Z",
      metadata: null,
    },
    {
      id: "ch-007",
      concern_id: "sg-001",
      entry_type: "parent_contact",
      description:
        "Mother contacted and informed of referral (in line with MASH guidance). Father not contacted per MASH instruction.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-08T11:00:00Z",
      metadata: null,
    },
    {
      id: "ch-008",
      concern_id: "sg-001",
      entry_type: "status_change",
      description: "Status changed from 'open' to 'referred'.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-08T10:45:00Z",
      metadata: null,
    },
  ],
  "sg-002": [
    {
      id: "ch-010",
      concern_id: "sg-002",
      entry_type: "concern_raised",
      description:
        "Concern raised: Neglect (AMBER). Third week of arriving without appropriate clothing.",
      recorded_by: "Mr Davies (Reception Staff)",
      entry_date: "2026-03-06T08:50:00Z",
      metadata: null,
    },
    {
      id: "ch-011",
      concern_id: "sg-002",
      entry_type: "note",
      description:
        "Cross-referenced with previous term's concerns. Similar pattern noted in November 2025.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-06T10:00:00Z",
      metadata: null,
    },
    {
      id: "ch-012",
      concern_id: "sg-002",
      entry_type: "triage",
      description:
        "Triaged: Early Help Assessment. Pattern of neglect indicators building. Family support needed.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-06T14:00:00Z",
      metadata: null,
    },
    {
      id: "ch-013",
      concern_id: "sg-002",
      entry_type: "parent_contact",
      description:
        "Home visit conducted. Mother was receptive. Financial difficulties disclosed. Signposted to local food bank and uniform scheme.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-07T14:30:00Z",
      metadata: null,
    },
  ],
  "sg-004": [
    {
      id: "ch-020",
      concern_id: "sg-004",
      entry_type: "concern_raised",
      description:
        "Concern raised: Self-Harm (RED). Multiple cuts observed on forearm during PE.",
      recorded_by: "Mr Richards (PE Teacher)",
      entry_date: "2026-03-10T14:05:00Z",
      metadata: null,
    },
    {
      id: "ch-021",
      concern_id: "sg-004",
      entry_type: "observation",
      description:
        "First aider assessed cuts. Confirmed superficial but multiple, in various healing stages. No immediate medical attention required.",
      recorded_by: "Mrs Green (First Aider)",
      entry_date: "2026-03-10T14:15:00Z",
      metadata: null,
    },
  ],
  "sg-006": [
    {
      id: "ch-030",
      concern_id: "sg-006",
      entry_type: "concern_raised",
      description:
        "Concern raised: Domestic abuse (RED). Pupil disclosed 'daddy hits mummy and she cries'.",
      recorded_by: "Miss Khan (TA)",
      entry_date: "2026-03-04T10:50:00Z",
      metadata: null,
    },
    {
      id: "ch-031",
      concern_id: "sg-006",
      entry_type: "disclosure",
      description:
        "Verbatim record of disclosure: 'Daddy hits mummy and she cries. Sometimes he shouts really loud and I hide under my bed.' TED approach used.",
      recorded_by: "Miss Khan (TA)",
      entry_date: "2026-03-04T10:55:00Z",
      metadata: null,
    },
    {
      id: "ch-032",
      concern_id: "sg-006",
      entry_type: "triage",
      description:
        "Triaged: Referral to CSCS. Clear disclosure of domestic abuse. Operation Encompass check requested.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-04T11:30:00Z",
      metadata: null,
    },
    {
      id: "ch-033",
      concern_id: "sg-006",
      entry_type: "phone_call",
      description:
        "CSCS referral made by phone. Written referral to follow within 24 hours. CSCS ref: CS-2026-8817.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-04T12:00:00Z",
      metadata: null,
    },
    {
      id: "ch-034",
      concern_id: "sg-006",
      entry_type: "referral_made",
      description:
        "Written referral submitted to CSCS. All supporting documentation attached.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-04T15:00:00Z",
      metadata: null,
    },
    {
      id: "ch-035",
      concern_id: "sg-006",
      entry_type: "agency_contact",
      description:
        "Operation Encompass confirmed domestic incident at address on 03/03/2026. Police attended.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-05T09:00:00Z",
      metadata: null,
    },
    {
      id: "ch-036",
      concern_id: "sg-006",
      entry_type: "referral_outcome",
      description:
        "CSCS accepted referral. Section 47 enquiry initiated. Social worker visiting family today.",
      recorded_by: "Mrs Johnson (DSL)",
      entry_date: "2026-03-07T10:00:00Z",
      metadata: null,
    },
  ],
};

const DEMO_REFERRALS: Record<string, Referral[]> = {
  "sg-001": [
    {
      id: "ref-001",
      concern_id: "sg-001",
      reference_number: "REF-2026-001",
      referral_type: "mash",
      referred_to_agency: "Bradford MASH",
      referred_to_contact: "Ms Carter (Social Worker)",
      referral_reason: "Clear disclosure of physical abuse at home",
      referral_date: "2026-03-08",
      referred_by: "Mrs Johnson (DSL)",
      urgency: "urgent",
      outcome_status: "assessment_in_progress",
      outcome_notes: "Strategy discussion scheduled for 11/03/2026",
      outcome_date: null,
    },
  ],
  "sg-006": [
    {
      id: "ref-002",
      concern_id: "sg-006",
      reference_number: "REF-2026-002",
      referral_type: "cscs",
      referred_to_agency: "Bradford CSCS",
      referred_to_contact: "Mr Thompson (Duty Social Worker)",
      referral_reason: "Disclosure of domestic abuse",
      referral_date: "2026-03-04",
      referred_by: "Mrs Johnson (DSL)",
      urgency: "urgent",
      outcome_status: "accepted",
      outcome_notes: "Section 47 enquiry initiated",
      outcome_date: "2026-03-07",
    },
  ],
};

// ─── Helper Functions ───────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCategoryLabel(cat: string): string {
  const found = KCSIE_CATEGORIES.find((c) => c.value === cat);
  return (
    found?.label ||
    cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function getCategoryIcon(cat: string): React.ReactNode {
  const found = KCSIE_CATEGORIES.find((c) => c.value === cat);
  return found?.icon || <FileText className="w-4 h-4" />;
}

function daysAgo(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(followUpDate: string | null): boolean {
  if (!followUpDate) return false;
  return new Date(followUpDate) < new Date();
}

// ─── Body Map Component ─────────────────────────────────────────────────────

function BodyMap({
  marks,
  side,
  onAddMark,
  readOnly = false,
}: {
  marks: BodyMapMark[];
  side: "front" | "back";
  onAddMark?: (x: number, y: number) => void;
  readOnly?: boolean;
}) {
  const sideMarks = marks.filter((m) => m.side === side);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (readOnly || !onAddMark) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      onAddMark(x, y);
    },
    [onAddMark, readOnly],
  );

  return (
    <div className="relative">
      <div className="text-xs font-semibold text-center text-gray-500 mb-1 uppercase">
        {side}
      </div>
      <svg
        viewBox="0 0 100 200"
        className={`w-full max-w-[160px] mx-auto ${!readOnly ? "cursor-crosshair" : ""}`}
        onClick={handleClick}
      >
        {/* Human outline */}
        {side === "front" ? (
          <>
            {/* Head */}
            <ellipse
              cx="50"
              cy="18"
              rx="12"
              ry="14"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Neck */}
            <line
              x1="50"
              y1="32"
              x2="50"
              y2="38"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Torso */}
            <path
              d="M 30 38 L 30 100 L 70 100 L 70 38 Z"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Arms */}
            <path
              d="M 30 42 L 15 70 L 10 90"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <path
              d="M 70 42 L 85 70 L 90 90"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Hands */}
            <ellipse
              cx="8"
              cy="93"
              rx="4"
              ry="5"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <ellipse
              cx="92"
              cy="93"
              rx="4"
              ry="5"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Legs */}
            <path
              d="M 35 100 L 32 145 L 28 180"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <path
              d="M 65 100 L 68 145 L 72 180"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Feet */}
            <path
              d="M 28 180 L 22 185 L 20 188"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <path
              d="M 72 180 L 78 185 L 80 188"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Shoulder lines */}
            <line
              x1="30"
              y1="42"
              x2="70"
              y2="42"
              stroke="#94a3b8"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            {/* Waist line */}
            <line
              x1="30"
              y1="75"
              x2="70"
              y2="75"
              stroke="#94a3b8"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          </>
        ) : (
          <>
            {/* Head back */}
            <ellipse
              cx="50"
              cy="18"
              rx="12"
              ry="14"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Neck */}
            <line
              x1="50"
              y1="32"
              x2="50"
              y2="38"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Torso */}
            <path
              d="M 30 38 L 30 100 L 70 100 L 70 38 Z"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Spine */}
            <line
              x1="50"
              y1="38"
              x2="50"
              y2="100"
              stroke="#94a3b8"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            {/* Arms */}
            <path
              d="M 30 42 L 15 70 L 10 90"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <path
              d="M 70 42 L 85 70 L 90 90"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Hands */}
            <ellipse
              cx="8"
              cy="93"
              rx="4"
              ry="5"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <ellipse
              cx="92"
              cy="93"
              rx="4"
              ry="5"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Legs */}
            <path
              d="M 35 100 L 32 145 L 28 180"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <path
              d="M 65 100 L 68 145 L 72 180"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Feet */}
            <path
              d="M 28 180 L 22 185 L 20 188"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <path
              d="M 72 180 L 78 185 L 80 188"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* Shoulder lines */}
            <line
              x1="30"
              y1="42"
              x2="70"
              y2="42"
              stroke="#94a3b8"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          </>
        )}

        {/* Marks */}
        {sideMarks.map((mark, i) => (
          <g key={mark.id}>
            <circle
              cx={mark.x}
              cy={mark.y}
              r="4"
              fill="rgba(239, 68, 68, 0.3)"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
            <text
              x={mark.x}
              y={mark.y + 1.5}
              textAnchor="middle"
              fontSize="5"
              fill="#ef4444"
              fontWeight="bold"
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Body Map Notes Panel ───────────────────────────────────────────────────

function BodyMapNotes({ marks }: { marks: BodyMapMark[] }) {
  if (marks.length === 0) return null;
  return (
    <div className="space-y-2">
      {marks.map((mark, i) => (
        <div key={mark.id} className="flex items-start gap-2 text-sm">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
            {i + 1}
          </span>
          <div>
            <span className="font-medium text-gray-900">{mark.label}</span>
            <span className="text-gray-500"> ({mark.side})</span>
            <p className="text-gray-600 mt-0.5">{mark.notes}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Chronology Timeline Component ──────────────────────────────────────────

function ChronologyTimeline({ entries }: { entries: ChronologyEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>No chronology entries yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="relative flex items-start gap-3 pl-2">
            <div className="relative z-10 flex-shrink-0 w-5 h-5 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center mt-0.5">
              {ENTRY_TYPE_ICONS[entry.entry_type] || (
                <CircleDot className="w-3 h-3 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500">
                  {formatDateTime(entry.entry_date)}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 capitalize">
                  {entry.entry_type.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-gray-800 mt-0.5">
                {entry.description}
              </p>
              {entry.recorded_by && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Recorded by: {entry.recorded_by}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Concern Detail Panel ───────────────────────────────────────────────────

function ConcernDetailPanel({
  concern,
  chronology,
  referrals,
  onClose,
  onTriage,
  onAddChronologyEntry,
}: {
  concern: Concern;
  chronology: ChronologyEntry[];
  referrals: Referral[];
  onClose: () => void;
  onTriage: (concernId: string, outcome: string, notes: string) => void;
  onAddChronologyEntry: (
    concernId: string,
    entryType: string,
    description: string,
  ) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "chronology" | "referrals" | "bodymap" | "triage"
  >("overview");
  const [triageOutcome, setTriageOutcome] = useState(
    concern.triage_outcome || "",
  );
  const [triageNotes, setTriageNotes] = useState(concern.triage_notes || "");
  const [newEntryType, setNewEntryType] = useState("note");
  const [newEntryDesc, setNewEntryDesc] = useState("");

  const sev = SEVERITY_CONFIG[concern.severity];
  const statusConfig = STATUS_CONFIG[concern.status] || STATUS_CONFIG.open;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div
          className={`sticky top-0 z-10 ${sev.bgLight} border-b ${sev.border} p-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${sev.bg}`} />
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {concern.reference_number}
                </h2>
                <p className="text-sm text-gray-600">
                  {concern.pupil_pseudonym_label} &mdash;{" "}
                  {formatCategoryLabel(concern.category)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${sev.bgLight} ${sev.text} font-medium border ${sev.border}`}
            >
              {sev.label}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white ${statusConfig.color} font-medium border border-gray-200`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>
            {concern.is_anonymous && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                <Lock className="w-3 h-3" /> Anonymous
              </span>
            )}
            {isOverdue(concern.follow_up_date) &&
              concern.status !== "closed" && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium animate-pulse">
                  <AlertCircle className="w-3 h-3" /> Follow-up overdue
                </span>
              )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            {[
              {
                key: "overview",
                label: "Overview",
                icon: <FileText className="w-4 h-4" />,
              },
              {
                key: "chronology",
                label: `Chronology (${chronology.length})`,
                icon: <Clock className="w-4 h-4" />,
              },
              {
                key: "referrals",
                label: `Referrals (${referrals.length})`,
                icon: <ExternalLink className="w-4 h-4" />,
              },
              {
                key: "bodymap",
                label: "Body Map",
                icon: <User className="w-4 h-4" />,
              },
              {
                key: "triage",
                label: "Triage",
                icon: <Eye className="w-4 h-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-4">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {concern.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    Date of Concern
                  </div>
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(concern.date_of_concern)}
                    {concern.time_of_concern &&
                      ` at ${concern.time_of_concern}`}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Location</div>
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {concern.location || "Not specified"}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Witnesses</div>
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-gray-400" />
                    {concern.witnesses || "None recorded"}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    Follow-up Date
                  </div>
                  <div
                    className={`text-sm font-medium flex items-center gap-1.5 ${isOverdue(concern.follow_up_date) ? "text-red-600" : ""}`}
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    {concern.follow_up_date
                      ? formatDate(concern.follow_up_date)
                      : "Not set"}
                  </div>
                </div>
              </div>

              {concern.immediate_actions_taken && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-700 mb-1">
                    Immediate Actions Taken
                  </h3>
                  <p className="text-sm text-blue-800">
                    {concern.immediate_actions_taken}
                  </p>
                </div>
              )}

              {concern.triage_outcome && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-700 mb-1">
                    Triage Decision
                  </h3>
                  <p className="text-sm font-medium text-purple-800">
                    {TRIAGE_OUTCOMES.find(
                      (t) => t.value === concern.triage_outcome,
                    )?.label || concern.triage_outcome}
                  </p>
                  {concern.triage_notes && (
                    <p className="text-sm text-purple-700 mt-1">
                      {concern.triage_notes}
                    </p>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-400 flex items-center justify-between pt-2 border-t">
                <span>Created: {formatDateTime(concern.created_at)}</span>
                <span>Updated: {formatDateTime(concern.updated_at)}</span>
              </div>
            </>
          )}

          {/* Chronology Tab */}
          {activeTab === "chronology" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Chronology Timeline
                </h3>
                <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Download className="w-3 h-3" /> Export
                </button>
              </div>

              <ChronologyTimeline entries={chronology} />

              {/* Add Entry Form */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Add Chronology Entry
                </h4>
                <div className="space-y-3">
                  <select
                    value={newEntryType}
                    onChange={(e) => setNewEntryType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="note">General Note</option>
                    <option value="phone_call">Phone Call</option>
                    <option value="meeting">Meeting</option>
                    <option value="parent_contact">Parent Contact</option>
                    <option value="agency_contact">Agency Contact</option>
                    <option value="disclosure">Disclosure</option>
                    <option value="observation">Observation</option>
                    <option value="follow_up">Follow-Up</option>
                    <option value="review">Review</option>
                  </select>
                  <textarea
                    value={newEntryDesc}
                    onChange={(e) => setNewEntryDesc(e.target.value)}
                    placeholder="Describe what happened, who was involved, actions taken..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <button
                    onClick={() => {
                      if (newEntryDesc.trim()) {
                        onAddChronologyEntry(
                          concern.id,
                          newEntryType,
                          newEntryDesc,
                        );
                        setNewEntryDesc("");
                      }
                    }}
                    disabled={!newEntryDesc.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Entry
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Referrals Tab */}
          {activeTab === "referrals" && (
            <>
              {referrals.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <ExternalLink className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No referrals made for this concern</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((ref) => (
                    <div
                      key={ref.id}
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-gray-900">
                              {ref.reference_number}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                ref.outcome_status === "accepted"
                                  ? "bg-green-100 text-green-700"
                                  : ref.outcome_status === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : ref.outcome_status ===
                                        "assessment_in_progress"
                                      ? "bg-blue-100 text-blue-700"
                                      : ref.outcome_status === "declined"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {ref.outcome_status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {ref.referred_to_agency}
                            {ref.referred_to_contact &&
                              ` (${ref.referred_to_contact})`}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            ref.urgency === "urgent"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {ref.urgency}
                        </span>
                      </div>
                      {ref.referral_reason && (
                        <p className="text-sm text-gray-700 mt-2">
                          {ref.referral_reason}
                        </p>
                      )}
                      {ref.outcome_notes && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          {ref.outcome_notes}
                        </p>
                      )}
                      <div className="text-xs text-gray-400 mt-2 flex items-center gap-3">
                        <span>Referred: {formatDate(ref.referral_date)}</span>
                        <span>By: {ref.referred_by}</span>
                        {ref.outcome_date && (
                          <span>Outcome: {formatDate(ref.outcome_date)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Body Map Tab */}
          {activeTab === "bodymap" && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Body Map
              </h3>
              <div className="grid grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4 bg-white">
                <BodyMap
                  marks={concern.body_map_data || []}
                  side="front"
                  readOnly
                />
                <BodyMap
                  marks={concern.body_map_data || []}
                  side="back"
                  readOnly
                />
              </div>
              {concern.body_map_data && concern.body_map_data.length > 0 ? (
                <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Injury Notes
                  </h4>
                  <BodyMapNotes marks={concern.body_map_data} />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4 mt-2">
                  <p className="text-sm">
                    No body map markings recorded for this concern
                  </p>
                </div>
              )}
            </>
          )}

          {/* Triage Tab */}
          {activeTab === "triage" && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Triage Decision
              </h3>
              <div className="space-y-3">
                {TRIAGE_OUTCOMES.map((outcome) => (
                  <label
                    key={outcome.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      triageOutcome === outcome.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="triage"
                      value={outcome.value}
                      checked={triageOutcome === outcome.value}
                      onChange={(e) => setTriageOutcome(e.target.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {outcome.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {outcome.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Triage Notes
                </label>
                <textarea
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder="Record your rationale for this triage decision..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              <button
                onClick={() => {
                  if (triageOutcome) {
                    onTriage(concern.id, triageOutcome, triageNotes);
                  }
                }}
                disabled={!triageOutcome}
                className="mt-3 w-full px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Triage Decision
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Report Concern Modal ───────────────────────────────────────────────────

function ReportConcernModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: Partial<Concern>) => void;
}) {
  const [step, setStep] = useState(1);
  const [pupilName, setPupilName] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState<"red" | "amber" | "green" | "">("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateOfConcern, setDateOfConcern] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [timeOfConcern, setTimeOfConcern] = useState("");
  const [witnesses, setWitnesses] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [immediateActions, setImmediateActions] = useState("");
  const [bodyMapSide, setBodyMapSide] = useState<"front" | "back">("front");
  const [bodyMapMarks, setBodyMapMarks] = useState<BodyMapMark[]>([]);
  const [pendingMark, setPendingMark] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [markLabel, setMarkLabel] = useState("");
  const [markNotes, setMarkNotes] = useState("");

  const handleAddBodyMapMark = (x: number, y: number) => {
    setPendingMark({ x, y });
    setMarkLabel("");
    setMarkNotes("");
  };

  const confirmMark = () => {
    if (pendingMark && markLabel) {
      setBodyMapMarks([
        ...bodyMapMarks,
        {
          id: `bm-new-${Date.now()}`,
          x: pendingMark.x,
          y: pendingMark.y,
          side: bodyMapSide,
          label: markLabel,
          notes: markNotes,
        },
      ]);
      setPendingMark(null);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      pupil_pseudonym_label: pupilName || "Unknown Pupil",
      category,
      severity: severity as "red" | "amber" | "green",
      description,
      location,
      date_of_concern: dateOfConcern,
      time_of_concern: timeOfConcern || null,
      witnesses: witnesses || null,
      is_anonymous: isAnonymous,
      immediate_actions_taken: immediateActions || null,
      body_map_data: bodyMapMarks.length > 0 ? bodyMapMarks : null,
    });
    onClose();
  };

  const canProceedStep1 = pupilName && category && severity;
  const canProceedStep2 = description.length >= 20;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Report a Safeguarding Concern
            </h2>
            <p className="text-sm text-gray-500">
              Step {step} of 3 &mdash;{" "}
              {step === 1
                ? "Pupil & Category"
                : step === 2
                  ? "Description & Context"
                  : "Body Map & Review"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-3">
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? "bg-red-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: Pupil & Category */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pupil Name / Identifier
                </label>
                <input
                  type="text"
                  value={pupilName}
                  onChange={(e) => setPupilName(e.target.value)}
                  placeholder="e.g., Pupil K or use pseudonym"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Names are pseudonymised in the system for GDPR compliance
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KCSIE Category
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {KCSIE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                        category === cat.value
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {cat.icon}
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity (RAG)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["red", "amber", "green"] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverity(sev)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        severity === sev
                          ? `${SEVERITY_CONFIG[sev].border} ${SEVERITY_CONFIG[sev].bgLight} ring-2 ${SEVERITY_CONFIG[sev].ring}`
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${SEVERITY_CONFIG[sev].bg} mx-auto mb-1`}
                      />
                      <div
                        className={`text-xs font-semibold ${SEVERITY_CONFIG[sev].text}`}
                      >
                        {sev.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {SEVERITY_CONFIG[sev].label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded"
                />
                <label
                  htmlFor="anonymous"
                  className="text-sm text-gray-700 flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" /> Submit anonymously
                </label>
              </div>
            </>
          )}

          {/* Step 2: Description & Context */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What happened? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you saw, heard, or were told. Use the child's exact words where possible. Include who was involved, what happened, and when..."
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {description.length}/20 minimum characters. Be factual; record
                  observations, not opinions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={dateOfConcern}
                    onChange={(e) => setDateOfConcern(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={timeOfConcern}
                    onChange={(e) => setTimeOfConcern(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Year 3 Classroom, Playground, Corridor"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Witnesses
                </label>
                <input
                  type="text"
                  value={witnesses}
                  onChange={(e) => setWitnesses(e.target.value)}
                  placeholder="Names and roles of any witnesses"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Immediate Actions Taken
                </label>
                <textarea
                  value={immediateActions}
                  onChange={(e) => setImmediateActions(e.target.value)}
                  placeholder="What actions did you take immediately? (e.g., first aid, moved child to safe space, informed DSL)"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>
            </>
          )}

          {/* Step 3: Body Map & Review */}
          {step === 3 && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Body Map (optional)
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Click on the body outline to mark areas of concern. This is
                  particularly useful for physical injuries.
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setBodyMapSide("front")}
                    className={`px-3 py-1 text-xs rounded-lg ${bodyMapSide === "front" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setBodyMapSide("back")}
                    className={`px-3 py-1 text-xs rounded-lg ${bodyMapSide === "back" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    Back
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <BodyMap
                    marks={bodyMapMarks}
                    side={bodyMapSide}
                    onAddMark={handleAddBodyMapMark}
                  />
                  <div>
                    {pendingMark ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">
                          Add mark details:
                        </p>
                        <input
                          type="text"
                          value={markLabel}
                          onChange={(e) => setMarkLabel(e.target.value)}
                          placeholder="Type (e.g., Bruise, Cut, Mark)"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                        />
                        <textarea
                          value={markNotes}
                          onChange={(e) => setMarkNotes(e.target.value)}
                          placeholder="Describe size, colour, shape..."
                          rows={2}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={confirmMark}
                            disabled={!markLabel}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Add Mark
                          </button>
                          <button
                            onClick={() => setPendingMark(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 text-xs py-4">
                        Click on the body outline to add a mark
                      </div>
                    )}
                    {bodyMapMarks.length > 0 && (
                      <div className="mt-3">
                        <BodyMapNotes marks={bodyMapMarks} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Review */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Review Your Concern
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pupil:</span>
                    <span className="font-medium text-gray-900">
                      {pupilName || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium text-gray-900">
                      {formatCategoryLabel(category)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Severity:</span>
                    <span
                      className={`font-medium ${SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]?.text || ""}`}
                    >
                      {(severity || "").toUpperCase()} &mdash;{" "}
                      {SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]
                        ?.label || ""}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(dateOfConcern)}
                      {timeOfConcern ? ` at ${timeOfConcern}` : ""}
                    </span>
                  </div>
                  {location && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium text-gray-900">
                        {location}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Anonymous:</span>
                    <span className="font-medium text-gray-900">
                      {isAnonymous ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Body map marks:</span>
                    <span className="font-medium text-gray-900">
                      {bodyMapMarks.length}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Description:</p>
                    <p className="text-sm text-gray-800">{description}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  By submitting this concern, it will be immediately visible to
                  the Designated Safeguarding Lead (DSL). For RED (immediate
                  danger) concerns, also contact the DSL directly in person or
                  by phone.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl flex items-center justify-between">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {step > 1 ? "Back" : "Cancel"}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Shield className="w-4 h-4" /> Submit Concern
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── API Data Types ─────────────────────────────────────────────────────────

interface DashboardData {
  summary: {
    total_active: number;
    by_severity: { red: number; amber: number; green: number };
    by_status: {
      open: number;
      triaged: number;
      referred: number;
      monitoring: number;
    };
    by_category: Record<string, number>;
    overdue_follow_ups: number;
    recent_7_days: number;
    closed_this_year: number;
    open_untriaged: number;
    total_referrals: number;
    referral_outcomes: Record<string, number>;
  };
  recent_concerns: Concern[];
  overdue_concerns: Concern[];
  referrals: Referral[];
}

// ─── Main Dashboard Page ────────────────────────────────────────────────────

export default function SafeguardingPage() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [allReferrals, setAllReferrals] = useState<Referral[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<
    DashboardData["summary"] | null
  >(null);
  const [overdueConcernsList, setOverdueConcernsList] = useState<Concern[]>([]);
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null);
  const [selectedChronology, setSelectedChronology] = useState<
    ChronologyEntry[]
  >([]);
  const [selectedReferrals, setSelectedReferrals] = useState<Referral[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fetchedRef = useRef(false);

  // ── Fetch dashboard data from API ──
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/safeguarding");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch (${res.status})`);
      }
      const json = await res.json();
      const data: DashboardData = json.data;
      setConcerns(data.recent_concerns || []);
      setAllReferrals(data.referrals || []);
      setDashboardSummary(data.summary);
      setOverdueConcernsList(data.overdue_concerns || []);
    } catch (err) {
      console.error("Failed to fetch safeguarding dashboard:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      // Fall back to demo data if API is not available
      setConcerns(DEMO_CONCERNS);
      setAllReferrals(Object.values(DEMO_REFERRALS).flat());
      setOverdueConcernsList(
        DEMO_CONCERNS.filter((c) => isOverdue(c.follow_up_date)),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchDashboard();
    }
  }, [fetchDashboard]);

  // ── Fetch concern detail (chronology + referrals) ──
  const fetchConcernDetail = useCallback(async (concern: Concern) => {
    setSelectedConcern(concern);
    setSelectedChronology([]);
    setSelectedReferrals([]);

    try {
      const res = await fetch(`/api/safeguarding/concerns/${concern.id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedChronology(json.data?.chronology || []);
        setSelectedReferrals(json.data?.referrals || []);
      } else {
        // Fall back to demo data
        setSelectedChronology(DEMO_CHRONOLOGY[concern.id] || []);
        setSelectedReferrals(DEMO_REFERRALS[concern.id] || []);
      }
    } catch {
      setSelectedChronology(DEMO_CHRONOLOGY[concern.id] || []);
      setSelectedReferrals(DEMO_REFERRALS[concern.id] || []);
    }
  }, []);

  // Stats (from API summary or calculated from local data)
  const activeConcerns = concerns.filter((c) => c.status !== "closed");
  const redCount =
    dashboardSummary?.by_severity.red ??
    activeConcerns.filter((c) => c.severity === "red").length;
  const amberCount =
    dashboardSummary?.by_severity.amber ??
    activeConcerns.filter((c) => c.severity === "amber").length;
  const greenCount =
    dashboardSummary?.by_severity.green ??
    activeConcerns.filter((c) => c.severity === "green").length;
  const overdueConcerns =
    overdueConcernsList.length > 0
      ? overdueConcernsList
      : activeConcerns.filter((c) => isOverdue(c.follow_up_date));
  const openUntriaged = concerns.filter(
    (c) => c.status === "open" && !c.triage_outcome,
  );

  // Filtered concerns
  const filteredConcerns = concerns.filter((c) => {
    if (filterSeverity !== "all" && c.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (c.reference_number || "").toLowerCase().includes(q) ||
        (c.pupil_pseudonym_label || "").toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        formatCategoryLabel(c.category).toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handlers
  const handleReportConcern = async (data: Partial<Concern>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/safeguarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pupil_pseudonym_label: data.pupil_pseudonym_label || "Unknown Pupil",
          pupil_pseudonym_id: data.pupil_pseudonym_id || null,
          category: data.category || "other",
          severity: data.severity || "amber",
          description: data.description || "",
          location: data.location || null,
          date_of_concern:
            data.date_of_concern || new Date().toISOString().split("T")[0],
          time_of_concern: data.time_of_concern || null,
          witnesses: data.witnesses || null,
          is_anonymous: data.is_anonymous || false,
          body_map_data: data.body_map_data || null,
          immediate_actions_taken: data.immediate_actions_taken || null,
        }),
      });

      if (res.ok) {
        // Refresh the dashboard data
        await fetchDashboard();
      } else {
        // Fall back to local state update
        const newConcern: Concern = {
          id: `sg-new-${Date.now()}`,
          reference_number: `SG-2026-${String(concerns.length + 1).padStart(3, "0")}`,
          pupil_pseudonym_label: data.pupil_pseudonym_label || "Unknown Pupil",
          pupil_pseudonym_id: null,
          category: data.category || "other",
          severity: data.severity || "amber",
          status: "open",
          description: data.description || "",
          location: data.location || null,
          date_of_concern:
            data.date_of_concern || new Date().toISOString().split("T")[0],
          time_of_concern: data.time_of_concern || null,
          witnesses: data.witnesses || null,
          is_anonymous: data.is_anonymous || false,
          reported_by: data.is_anonymous ? null : "current-user",
          triage_outcome: null,
          triage_notes: null,
          assigned_to: null,
          follow_up_date: null,
          body_map_data: data.body_map_data || null,
          immediate_actions_taken: data.immediate_actions_taken || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setConcerns([newConcern, ...concerns]);
      }
    } catch {
      // Fall back to local state update on network error
      const newConcern: Concern = {
        id: `sg-new-${Date.now()}`,
        reference_number: `SG-2026-${String(concerns.length + 1).padStart(3, "0")}`,
        pupil_pseudonym_label: data.pupil_pseudonym_label || "Unknown Pupil",
        pupil_pseudonym_id: null,
        category: data.category || "other",
        severity: data.severity || "amber",
        status: "open",
        description: data.description || "",
        location: data.location || null,
        date_of_concern:
          data.date_of_concern || new Date().toISOString().split("T")[0],
        time_of_concern: data.time_of_concern || null,
        witnesses: data.witnesses || null,
        is_anonymous: data.is_anonymous || false,
        reported_by: data.is_anonymous ? null : "current-user",
        triage_outcome: null,
        triage_notes: null,
        assigned_to: null,
        follow_up_date: null,
        body_map_data: data.body_map_data || null,
        immediate_actions_taken: data.immediate_actions_taken || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConcerns([newConcern, ...concerns]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriage = async (
    concernId: string,
    outcome: string,
    notes: string,
  ) => {
    try {
      const res = await fetch(`/api/safeguarding/concerns/${concernId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "triaged",
          triage_outcome: outcome,
          triage_notes: notes,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const updated = json.data?.concern;
        if (updated) {
          setConcerns(
            concerns.map((c) =>
              c.id === concernId ? { ...c, ...updated } : c,
            ),
          );
          if (selectedConcern?.id === concernId) {
            setSelectedConcern({ ...selectedConcern, ...updated });
          }
          return;
        }
      }
    } catch {
      // Fall through to local update
    }

    // Local fallback
    setConcerns(
      concerns.map((c) =>
        c.id === concernId
          ? {
              ...c,
              triage_outcome: outcome,
              triage_notes: notes,
              status: "triaged",
              updated_at: new Date().toISOString(),
            }
          : c,
      ),
    );
    if (selectedConcern?.id === concernId) {
      setSelectedConcern({
        ...selectedConcern,
        triage_outcome: outcome,
        triage_notes: notes,
        status: "triaged",
        updated_at: new Date().toISOString(),
      });
    }
  };

  const handleAddChronologyEntry = async (
    concernId: string,
    entryType: string,
    description: string,
  ) => {
    const newEntry: ChronologyEntry = {
      id: `ch-new-${Date.now()}`,
      concern_id: concernId,
      entry_type: entryType,
      description,
      recorded_by: null,
      entry_date: new Date().toISOString(),
      metadata: null,
    };

    try {
      const res = await fetch("/api/safeguarding/chronology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concern_id: concernId,
          entry_type: entryType,
          description,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const entry = json.data?.entry;
        if (entry) {
          setSelectedChronology((prev) => [...prev, entry]);
          return;
        }
      }
    } catch {
      // Fall through to local update
    }

    // Local fallback
    setSelectedChronology((prev) => [...prev, newEntry]);
  };

  // Category stats for dashboard
  const categoryStats =
    dashboardSummary?.by_category ??
    activeConcerns.reduce<Record<string, number>>((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});

  const topCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safeguarding</h1>
            <p className="text-sm text-gray-500">
              Loading safeguarding data...
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Error / Fallback Banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Showing sample data
            </p>
            <p className="text-xs text-amber-700">
              Could not connect to the live API ({error}). Displaying demo data
              instead. All pupil names shown are pseudonymised.
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safeguarding</h1>
            <p className="text-sm text-gray-500">
              CPOMS-style concern logging &amp; chronology
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="px-3 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            disabled={submitting}
            className="px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Report Concern
          </button>
        </div>
      </div>

      {/* Overdue Follow-ups Banner */}
      {overdueConcerns.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">
              {overdueConcerns.length} Overdue Follow-Up
              {overdueConcerns.length !== 1 ? "s" : ""}
            </h3>
            <div className="mt-2 space-y-1">
              {overdueConcerns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => fetchConcernDetail(c)}
                  className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                  <span className="font-mono text-xs">
                    {c.reference_number}
                  </span>
                  <span>{c.pupil_pseudonym_label}</span>
                  <span className="text-red-500 text-xs">
                    ({daysAgo(c.follow_up_date!)} days overdue)
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Untriaged Open Concerns Warning */}
      {openUntriaged.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-800">
              {openUntriaged.length} Concern
              {openUntriaged.length !== 1 ? "s" : ""} Awaiting Triage
            </h3>
            <p className="text-xs text-blue-700 mt-0.5">
              These concerns have been reported but not yet triaged by the DSL.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {openUntriaged.map((c) => (
                <button
                  key={c.id}
                  onClick={() => fetchConcernDetail(c)}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-white border border-blue-200 rounded-full text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${SEVERITY_CONFIG[c.severity].bg}`}
                  />
                  {c.reference_number}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RAG Severity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["red", "amber", "green"] as const).map((sev) => {
          const config = SEVERITY_CONFIG[sev];
          const count =
            sev === "red"
              ? redCount
              : sev === "amber"
                ? amberCount
                : greenCount;
          const sevConcerns = activeConcerns.filter((c) => c.severity === sev);

          return (
            <button
              key={sev}
              onClick={() =>
                setFilterSeverity(filterSeverity === sev ? "all" : sev)
              }
              className={`relative overflow-hidden rounded-xl border-2 p-5 text-left transition-all ${
                filterSeverity === sev
                  ? `${config.border} ${config.bgLight} ring-2 ${config.ring}`
                  : `border-gray-200 hover:${config.bgLight}`
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-3xl font-bold ${config.text}`}>
                    {count}
                  </div>
                  <div className="text-sm font-medium text-gray-700 mt-1">
                    {config.label}
                  </div>
                </div>
                <div
                  className={`w-12 h-12 rounded-full ${config.bg} bg-opacity-20 flex items-center justify-center`}
                >
                  <div className={`w-6 h-6 rounded-full ${config.bg}`} />
                </div>
              </div>
              {sevConcerns.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Latest: {sevConcerns[0].pupil_pseudonym_label} &mdash;{" "}
                    {formatCategoryLabel(sevConcerns[0].category)}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {activeConcerns.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Active Concerns</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {concerns.filter((c) => c.status === "open").length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Open</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {concerns.filter((c) => c.status === "triaged").length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Triaged</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {concerns.filter((c) => c.status === "referred").length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Referred</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {concerns.filter((c) => c.status === "closed").length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Closed</div>
        </div>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Active Concerns by Category
          </h3>
          <div className="space-y-2">
            {topCategories.map(([cat, count]) => {
              const maxCount = topCategories[0][1];
              const width = Math.max(10, (count / maxCount) * 100);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-40 flex items-center gap-1.5 text-sm text-gray-700 flex-shrink-0">
                    {getCategoryIcon(cat)}
                    <span className="truncate">{formatCategoryLabel(cat)}</span>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-red-400 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {count}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filter:</span>
          </div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Severities</option>
            <option value="red">Red (Immediate)</option>
            <option value="amber">Amber (Concern)</option>
            <option value="green">Green (Low-Level)</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="triaged">Triaged</option>
            <option value="referred">Referred</option>
            <option value="monitoring">Monitoring</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Categories</option>
            {KCSIE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search concerns..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          {(filterSeverity !== "all" ||
            filterStatus !== "all" ||
            filterCategory !== "all" ||
            searchQuery) && (
            <button
              onClick={() => {
                setFilterSeverity("all");
                setFilterStatus("all");
                setFilterCategory("all");
                setSearchQuery("");
              }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Concerns List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3 flex items-center justify-between bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            Concerns ({filteredConcerns.length})
          </h3>
          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Download className="w-3 h-3" /> Export Chronology
          </button>
        </div>

        {filteredConcerns.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Shield className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No concerns match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConcerns.map((concern) => {
              const sev = SEVERITY_CONFIG[concern.severity];
              const statusCfg =
                STATUS_CONFIG[concern.status] || STATUS_CONFIG.open;
              const overdue =
                isOverdue(concern.follow_up_date) &&
                concern.status !== "closed";

              return (
                <button
                  key={concern.id}
                  onClick={() => fetchConcernDetail(concern)}
                  className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-start gap-4 ${overdue ? "bg-red-50/30" : ""}`}
                >
                  {/* Severity indicator */}
                  <div
                    className={`w-3 h-3 rounded-full ${sev.bg} flex-shrink-0 mt-1.5`}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-semibold text-gray-900">
                        {concern.reference_number}
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {concern.pupil_pseudonym_label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sev.bgLight} ${sev.text} font-medium`}
                      >
                        {concern.severity.toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs ${statusCfg.color}`}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      {concern.is_anonymous && (
                        <Lock className="w-3 h-3 text-gray-400" />
                      )}
                      {overdue && (
                        <span className="text-xs text-red-600 font-medium animate-pulse flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      {getCategoryIcon(concern.category)}
                      <span>{formatCategoryLabel(concern.category)}</span>
                      <span className="text-gray-300">|</span>
                      <span>{formatDate(concern.date_of_concern)}</span>
                      {concern.location && (
                        <>
                          <span className="text-gray-300">|</span>
                          <MapPin className="w-3 h-3" />
                          <span>{concern.location}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {concern.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Referral Tracking Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-orange-500" />
            Active Referrals
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {allReferrals.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No referrals recorded yet.
            </div>
          )}
          {allReferrals.map((ref) => {
            const concern = concerns.find((c) => c.id === ref.concern_id);
            return (
              <div key={ref.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-gray-900">
                      {ref.reference_number}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-800">
                      {ref.referred_to_agency}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ref.outcome_status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : ref.outcome_status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : ref.outcome_status === "assessment_in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ref.outcome_status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {concern?.pupil_pseudonym_label} &mdash;{" "}
                    {concern ? formatCategoryLabel(concern.category) : ""}{" "}
                    &mdash; Referred: {formatDate(ref.referral_date)}
                  </div>
                  {ref.outcome_notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      {ref.outcome_notes}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ref.urgency === "urgent"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {ref.urgency}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* KCSIE Quick Reference */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <HandHelping className="w-4 h-4 text-blue-500" />
          KCSIE 2025 Quick Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="font-semibold text-red-800 text-xs mb-1">
              If a child is in immediate danger:
            </h4>
            <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
              <li>Contact Police: 999</li>
              <li>Inform DSL immediately</li>
              <li>Do NOT wait to submit a form</li>
              <li>Secure the safety of the child first</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-800 text-xs mb-1">
              Key principles when recording:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Record facts, not opinions</li>
              <li>
                Use the child&apos;s exact words (TED: Tell, Explain, Describe)
              </li>
              <li>Note date, time, location, and witnesses</li>
              <li>
                Do NOT investigate &mdash; that is for social care / police
              </li>
              <li>Do NOT promise confidentiality to a child</li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-semibold text-amber-800 text-xs mb-1">
              Key contacts:
            </h4>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>DSL: Mrs Johnson (ext. 201)</li>
              <li>Deputy DSL: Mr Ahmed (ext. 203)</li>
              <li>Local Authority MASH: 01onal 555 0100</li>
              <li>NSPCC Helpline: 0808 800 5000</li>
              <li>Childline: 0800 1111</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-semibold text-green-800 text-xs mb-1">
              Information sharing (KCSIE 2025):
            </h4>
            <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
              <li>
                Fear of sharing information must NOT prevent protecting children
              </li>
              <li>
                GDPR does not prevent child protection concerns being shared
              </li>
              <li>Share on a &quot;need to know&quot; basis</li>
              <li>Keep written records of all decisions and rationale</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center text-xs text-gray-400 pb-4">
        <p>
          All data is encrypted at rest and in transit. Access is restricted to
          DSL and authorised staff only.
        </p>
        <p className="mt-1">
          Aligned with Keeping Children Safe in Education (KCSIE) 2025 statutory
          guidance.
        </p>
      </div>

      {/* Modals */}
      {showReportModal && (
        <ReportConcernModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportConcern}
        />
      )}

      {selectedConcern && (
        <ConcernDetailPanel
          concern={selectedConcern}
          chronology={selectedChronology}
          referrals={selectedReferrals}
          onClose={() => setSelectedConcern(null)}
          onTriage={handleTriage}
          onAddChronologyEntry={handleAddChronologyEntry}
        />
      )}
    </div>
  );
}
