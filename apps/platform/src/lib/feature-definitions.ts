import {
  Wrench,
  Shield,
  Camera,
  Bell,
  FileCheck,
  ClipboardList,
  Building2,
  Users,
  AlertTriangle,
  Eye,
  Zap,
  Calendar,
  Mail,
  BookOpen,
  Search,
  HardHat,
} from "lucide-react";
import { createElement } from "react";
import type { Feature } from "@/components/ui/feature-discovery";

export const ESTATES_FEATURES: Feature[] = [
  {
    id: "estates-dashboard",
    title: "Compliance Dashboard",
    description:
      "See all your statutory compliance at a glance with RAG status across every domain.",
    icon: createElement(Building2, { className: "h-4 w-4" }),
    module: "estates",
    category: "Getting Started",
    link: "/estates-compliance",
    steps: [
      "View the dashboard to see overall compliance status",
      "Click any domain card to drill into specific checks",
      "Use the urgency sort to prioritise your day",
    ],
  },
  {
    id: "estates-daily-checks",
    title: "Daily Checks",
    description:
      "Morning and evening checklists for site managers. Complete checks with a single tap.",
    icon: createElement(ClipboardList, { className: "h-4 w-4" }),
    module: "estates",
    category: "Getting Started",
    link: "/estates-compliance",
    steps: [
      'Find the "Today\'s Tasks" card at the top',
      "Tap a check to mark it complete",
      "Celebrate with confetti when you finish!",
    ],
  },
  {
    id: "estates-vision-ai",
    title: "Room Scan with AI",
    description:
      "Take a photo of any room and AI will identify fire safety issues, damage, hazards, and more.",
    icon: createElement(Camera, { className: "h-4 w-4" }),
    module: "estates",
    category: "AI Features",
    link: "/estates-compliance/room-checks",
    isNew: true,
    steps: [
      "Go to Room Checks",
      "Point your camera at the room",
      "AI analyses fire safety, H&S, damage, COSHH",
      "Issues auto-create helpdesk tickets",
    ],
  },
  {
    id: "estates-helpdesk",
    title: "Helpdesk Tickets",
    description:
      "Log maintenance requests and track them through to resolution. Auto-created from AI scans.",
    icon: createElement(Wrench, { className: "h-4 w-4" }),
    module: "estates",
    category: "Day-to-Day",
    link: "/estates-compliance/helpdesk",
    steps: [
      'Click "New Ticket" to report an issue',
      "Set priority, category, and location",
      "Track progress through open → in progress → resolved",
    ],
  },
  {
    id: "estates-assets",
    title: "Asset Register",
    description:
      "Track every asset with maintenance schedules, warranty info, and condition monitoring.",
    icon: createElement(HardHat, { className: "h-4 w-4" }),
    module: "estates",
    category: "Day-to-Day",
    link: "/estates-compliance/assets",
    steps: [
      "Browse your asset register",
      "Add new assets with location and condition",
      "Set maintenance schedules and warranty dates",
    ],
  },
  {
    id: "estates-contractors",
    title: "Contractor Management",
    description:
      "Manage contractors, verify their compliance documents, and track who's on site.",
    icon: createElement(Users, { className: "h-4 w-4" }),
    module: "estates",
    category: "Day-to-Day",
    link: "/estates-compliance/contractors",
    steps: [
      "Add contractors with contact details",
      "Request compliance documents via email",
      "Verify documents and track expiry dates",
    ],
  },
  {
    id: "estates-evidence",
    title: "Evidence Capture",
    description:
      "Upload photos and documents as tamper-proof evidence for inspections and audits.",
    icon: createElement(FileCheck, { className: "h-4 w-4" }),
    module: "estates",
    category: "Compliance & Evidence",
    link: "/estates-compliance/evidence",
    steps: [
      "Upload photos with GPS and timestamp",
      "Evidence is hash-verified for audit defence",
      "Link evidence to specific compliance checks",
    ],
  },
  {
    id: "estates-reports",
    title: "Generate Reports",
    description:
      "One-click compliance reports for governors, trustees, or inspectors.",
    icon: createElement(FileCheck, { className: "h-4 w-4" }),
    module: "estates",
    category: "Compliance & Evidence",
    link: "/estates-compliance/reports",
    steps: [
      "Select report type and date range",
      "AI compiles evidence and status",
      "Download as PDF or share via link",
    ],
  },
  {
    id: "estates-notifications",
    title: "Smart Notifications",
    description:
      "Get reminded about upcoming tasks and overdue compliance checks via email and in-app.",
    icon: createElement(Bell, { className: "h-4 w-4" }),
    module: "estates",
    category: "Smart Features",
    isNew: true,
    steps: [
      "Notifications appear in the bell icon (top right)",
      "Email reminders sent 7, 3, and 1 days before due",
      "Overdue tasks are escalated automatically",
    ],
  },
];

export const COMPLIANCE_FEATURES: Feature[] = [
  {
    id: "compliance-dashboard",
    title: "Compliance Hub",
    description:
      "Central view of all statutory compliance — policies, training, GDPR, safeguarding, and more.",
    icon: createElement(Shield, { className: "h-4 w-4" }),
    module: "compliance",
    category: "Getting Started",
    link: "/dashboard/compliance",
    steps: [
      "View compliance health score",
      "Check each domain for overdue items",
      "Use quick actions to address issues",
    ],
  },
  {
    id: "compliance-policies",
    title: "Policy Management",
    description:
      "Create, review, and approve school policies with version history and acknowledgement tracking.",
    icon: createElement(BookOpen, { className: "h-4 w-4" }),
    module: "compliance",
    category: "Core Features",
    link: "/dashboard/compliance/policies",
    steps: [
      "Browse templates or create a new policy",
      "Edit with the built-in editor",
      "Send for review and track acknowledgements",
    ],
  },
  {
    id: "compliance-training",
    title: "Training Tracker",
    description:
      "Track staff training completion and set up automatic reminders for renewals.",
    icon: createElement(BookOpen, { className: "h-4 w-4" }),
    module: "compliance",
    category: "Core Features",
    link: "/dashboard/compliance/training",
    steps: [
      "View training matrix for all staff",
      "Record completed training with certificates",
      "Set renewal dates for auto-reminders",
    ],
  },
  {
    id: "compliance-gdpr",
    title: "GDPR Management",
    description:
      "Handle DPIAs, Subject Access Requests, and data breach reporting with guided workflows.",
    icon: createElement(Shield, { className: "h-4 w-4" }),
    module: "compliance",
    category: "Data Protection",
    link: "/dashboard/compliance/gdpr",
    steps: [
      "Complete DPIAs with the step-by-step wizard",
      "Log and track Subject Access Requests",
      "Report data breaches within 72 hours",
    ],
  },
  {
    id: "compliance-scr",
    title: "Single Central Record",
    description:
      "Digital SCR with document verification and gap analysis for Ofsted readiness.",
    icon: createElement(Search, { className: "h-4 w-4" }),
    module: "compliance",
    category: "Safeguarding",
    link: "/dashboard/compliance/scr",
    isNew: true,
    steps: [
      "Add staff members to the SCR",
      "Upload and verify DBS, right to work documents",
      "Run gap analysis to find missing checks",
    ],
  },
  {
    id: "compliance-concerns",
    title: "Low-Level Concerns",
    description:
      "Confidential logging of low-level safeguarding concerns with pattern analysis.",
    icon: createElement(AlertTriangle, { className: "h-4 w-4" }),
    module: "compliance",
    category: "Safeguarding",
    link: "/dashboard/compliance/concerns",
    steps: [
      "Log a concern with date and details",
      "System tracks patterns across individuals",
      "Generate reports for DSL review",
    ],
  },
  {
    id: "compliance-complaints",
    title: "Complaints Tracker",
    description:
      "Track formal complaints through your school's complaints procedure with timeline.",
    icon: createElement(AlertTriangle, { className: "h-4 w-4" }),
    module: "compliance",
    category: "Records",
    link: "/dashboard/compliance/complaints",
    steps: [
      "Log the complaint with stage and details",
      "Track through informal → formal → panel → appeal",
      "Record outcomes and monitor timelines",
    ],
  },
  {
    id: "compliance-foi",
    title: "FOI Requests",
    description:
      "Track Freedom of Information requests and ensure you respond within the 20-day deadline.",
    icon: createElement(Mail, { className: "h-4 w-4" }),
    module: "compliance",
    category: "Records",
    link: "/dashboard/compliance/foi",
    steps: [
      "Log the FOI request with date received",
      "Track the 20-working-day deadline",
      "Record your response and any exemptions",
    ],
  },
  {
    id: "compliance-dpo",
    title: "DPO Service",
    description:
      "Outsourced Data Protection Officer service with expert support via Vrisk partnership.",
    icon: createElement(Shield, { className: "h-4 w-4" }),
    module: "compliance",
    category: "Data Protection",
    link: "/dashboard/compliance/dpo",
    steps: [
      "Review DPO service packages",
      "Contact DPO for expert guidance",
      "Track DPO recommendations",
    ],
  },
];

export const ALL_FEATURES = [...ESTATES_FEATURES, ...COMPLIANCE_FEATURES];
