import {
  Shield,
  ShieldCheck,
  Building2,
  Users,
  PoundSterling,
  GraduationCap,
  Heart,
  LayoutDashboard,
  FileText,
  TrendingUp,
  Target,
  Clock,
  BookOpen,
  FilePlus,
  CheckSquare,
  Mail,
  ClipboardList,
  Briefcase,
  HelpCircle,
  Zap,
  Gamepad2,
  Church,
  Lock,
  FileEdit,
  MessageSquare,
  BarChart3,
  ClipboardCheck,
  AlertTriangle,
  FileSearch,
  QrCode,
  Calendar,
  Eye,
  UserCheck,
  ThumbsUp,
  Scale,
  Accessibility,
  Brain,
  Globe,
  Sparkles,
  Settings,
  Radio,
  Megaphone,
  Monitor,
  Video,
  Palette,
  Siren,
  PenTool,
  FileImage,
  Newspaper,
  Database,
  Network,
  Robot,
  Mic,
  MessageCircle,
  FormInput,
} from "lucide-react";

export type Role =
  | "admin"
  | "headteacher"
  | "slt"
  | "teacher"
  | "governor"
  | "caretaker"
  | "viewer";

export interface ModuleDefinition {
  id: string;
  name: string;
  color: string;
  icon: any;
  description: string;
  requiredPermissions: Role[];
  planet: string; // Which planet this belongs to
  subcategories?: SubcategoryDefinition[]; // Optional 2-level hierarchy
}

export interface SubcategoryDefinition {
  id: string;
  name: string;
  icon: any;
  description: string;
}

export interface AppDefinition {
  id: string;
  moduleId: string;
  subcategoryId?: string; // Optional: group apps within subcategories
  name: string;
  route: string;
  icon: any;
  shortDescription: string;
  requiredPermissions: Role[];
}

// ============================================================================
// SCHOOLGLE SOLAR SYSTEM - 7 PLANETS + ED (THE MOON)
// ============================================================================

export const MODULES: ModuleDefinition[] = [
  // =========================================================================
  // MERCURY - SCHOOL IMPROVEMENT (Ofsted Readiness, SEF, SDP, Evidence)
  // =========================================================================
  {
    id: "improvement",
    name: "School Improvement",
    color: "gray",    // Mercury = gray
    icon: Shield,
    description: "Ofsted and SIAMS readiness, SEF, SDP, evidence, and premium funding.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
    planet: "Mercury",
  },

  // =========================================================================
  // VENUS - GOVERNANCE & RISK (Board oversight, risk register, ICFP)
  // =========================================================================
  {
    id: "governance",
    name: "Governance",
    color: "amber",   // Venus = yellow/amber
    icon: ShieldCheck,
    description: "Board oversight, risk register, strategic planning, and ICFP.",
    requiredPermissions: ["admin", "headteacher", "slt", "governor"],
    planet: "Venus",
  },

  // =========================================================================
  // EARTH - BUSINESS OPERATIONS (Estates, HR, Finance)
  // =========================================================================
  {
    id: "estates",
    name: "Business",
    color: "blue",    // Earth = blue
    icon: Building2,
    description: "Estates, HR, and Finance — business operations and management.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
    planet: "Earth",
    subcategories: [
      {
        id: "estates",
        name: "Estates",
        icon: Building2,
        description: "Property management, maintenance, compliance, and facilities.",
      },
      {
        id: "hr",
        name: "HR & People",
        icon: Users,
        description: "Staff management, HR processes, and personnel records.",
      },
      {
        id: "finance",
        name: "Finance",
        icon: PoundSterling,
        description: "Budget planning, financial monitoring, and procurement.",
      },
      {
        id: "communications",
        name: "Communications",
        icon: Radio,
        description: "Notices, meetings, and school communications.",
      },
    ],
  },

  // =========================================================================
  // MARS - COMPLIANCE & SAFEGUARDING (Policies, SCR, DSL, GDPR)
  // =========================================================================
  {
    id: "compliance",
    name: "Compliance",
    color: "red",     // Mars = red
    icon: ShieldCheck,
    description: "Statutory policies, safeguarding, SCR, GDPR, and compliance management.",
    requiredPermissions: ["admin", "headteacher", "slt", "governor"],
    planet: "Mars",
  },

  // =========================================================================
  // JUPITER - COMMUNICATIONS (Notices, Video, Calendar, Emergency, Website)
  // =========================================================================
  {
    id: "communications",
    name: "Communications",
    color: "orange",  // Jupiter = orange/banded
    icon: Radio,
    description: "Notices, video meetings, calendar, emergency broadcasts, and website.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher", "caretaker"],
    planet: "Jupiter",
  },

  // =========================================================================
  // SATURN - SCHOOLGLE INTELLIGENCE (Data analytics, Canvas, benchmarks)
  // =========================================================================
  {
    id: "intelligence",
    name: "Schoolgle Intelligence",
    color: "purple",  // Saturn = purple (wisdom, premium analytics) - NOT gold (avoids yellow duplication with Venus)
    icon: Brain,
    description: "Data analytics, Canvas, attendance, SEND, behaviour, and school intelligence.",
    requiredPermissions: ["admin", "headteacher", "slt"],
    planet: "Saturn",
  },

  // =========================================================================
  // URANUS - TEACHING & LEARNING (Lesson planning, resources, assessment)
  // =========================================================================
  {
    id: "teaching-learning",
    name: "Teaching & Learning",
    color: "cyan",    // Uranus = cyan/blue
    icon: GraduationCap,
    description: "Lesson planning, resources, assessment, and classroom tools.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
    planet: "Uranus",
  },
];

export const APPS: AppDefinition[] = [
  // =========================================================================
  // MERCURY - SCHOOL IMPROVEMENT APPS
  // =========================================================================
  {
    id: "ofsted-readiness",
    moduleId: "improvement",
    name: "Ofsted Readiness",
    route: "/dashboard/ofsted-readiness",
    icon: Shield,
    shortDescription: "Track framework compliance.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "sef-builder",
    moduleId: "improvement",
    name: "SEF Builder",
    route: "/dashboard/sef",
    icon: FileText,
    shortDescription: "Draft self-evaluation reports.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "sdp-builder",
    moduleId: "improvement",
    name: "SDP Builder",
    route: "/dashboard/sdp",
    icon: TrendingUp,
    shortDescription: "Manage development plans.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "action-plan",
    moduleId: "improvement",
    name: "Action Plan",
    route: "/dashboard/action-plan",
    icon: Target,
    shortDescription: "Track strategic tasks.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "siams-readiness",
    moduleId: "improvement",
    name: "SIAMS Readiness",
    route: "/dashboard/siams",
    icon: Church,
    shortDescription: "Church school inspection preparation.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher", "governor"],
  },
  {
    id: "unified-tasks",
    moduleId: "improvement",
    name: "Tasks",
    route: "/dashboard/tasks",
    icon: CheckSquare,
    shortDescription: "Unified task management across all planets.",
    requiredPermissions: [
      "admin",
      "headteacher",
      "slt",
      "teacher",
      "governor",
      "caretaker",
    ],
  },
  {
    id: "evidence-vault",
    moduleId: "improvement",
    name: "My Evidence",
    route: "/evidence",
    icon: FileText,
    shortDescription: "Central evidence library.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "audit-timeline",
    moduleId: "improvement",
    name: "Audit Timeline",
    route: "/timeline",
    icon: Clock,
    shortDescription: "Historical record of changes.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "data-validation",
    moduleId: "improvement",
    name: "Data Validation",
    route: "/dashboard/data-validation",
    icon: FileSearch,
    shortDescription: "Review AI-extracted data before it flows to modules.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "pupil-premium",
    moduleId: "improvement",
    name: "Pupil Premium",
    route: "/dashboard/pupil-premium",
    icon: Heart,
    shortDescription: "PP strategy, spend tracking, and impact measurement.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "sports-premium",
    moduleId: "improvement",
    name: "Sports Premium",
    route: "/dashboard/sports-premium",
    icon: Accessibility,
    shortDescription: "PE & sport premium strategy and DfE reporting.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "admissions",
    moduleId: "improvement",
    name: "Admissions",
    route: "/dashboard/admissions",
    icon: Users,
    shortDescription: "Admission rounds, applications, and waiting lists.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },

  // =========================================================================
  // VENUS - GOVERNANCE & RISK APPS
  // =========================================================================
  {
    id: "governance-home",
    moduleId: "governance",
    name: "Governance Portal",
    route: "/dashboard/governance",
    icon: ShieldCheck,
    shortDescription: "Governor directory, meetings and oversight.",
    requiredPermissions: ["admin", "headteacher", "slt", "governor"],
  },
  {
    id: "governor-visits",
    moduleId: "governance",
    name: "Visit Planning",
    route: "/dashboard/governance/visits",
    icon: ClipboardList,
    shortDescription: "Plan and record governor monitoring visits.",
    requiredPermissions: ["admin", "headteacher", "slt", "governor"],
  },
  {
    id: "risk-home",
    moduleId: "governance",
    name: "Risk Register",
    route: "/dashboard/risk",
    icon: AlertTriangle,
    shortDescription: "Risk heat map and register overview.",
    requiredPermissions: ["admin", "headteacher", "slt", "governor"],
  },
  {
    id: "risk-decisions",
    moduleId: "governance",
    name: "Risk Decisions",
    route: "/dashboard/risk/decisions",
    icon: FileText,
    shortDescription: "4T decisions and board meeting links.",
    requiredPermissions: ["admin", "headteacher", "slt", "governor"],
  },
  {
    id: "strategic-plan",
    moduleId: "governance",
    name: "Strategic Plan",
    route: "/dashboard/risk/strategic-plan",
    icon: TrendingUp,
    shortDescription: "3-year capital and improvement planning.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "icfp",
    moduleId: "governance",
    name: "ICFP",
    route: "/dashboard/risk/icfp",
    icon: BarChart3,
    shortDescription: "ICFP Magnificent Seven metrics and scenarios.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "trust-dashboard",
    moduleId: "governance",
    name: "Trust Overview",
    route: "/dashboard/risk/trust",
    icon: Building2,
    shortDescription: "Trust-wide risk aggregation and board reporting.",
    requiredPermissions: ["admin", "headteacher", "governor"],
  },

  // =========================================================================
  // EARTH - BUSINESS OPERATIONS APPS (Estates + HR + Finance)
  // =========================================================================

  // Estates Apps
  {
    id: "estates-home",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Estates",
    route: "/dashboard/estates",
    icon: Building2,
    shortDescription: "Estates overview & tools.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "maintenance-tickets",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Maintenance",
    route: "/dashboard/estates/maintenance",
    icon: HelpCircle,
    shortDescription: "Helpdesk & PPM.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "estates-audit",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Estates Audit",
    route: "/dashboard/estates/audit",
    icon: ShieldCheck,
    shortDescription: "Performance audit & compliance.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "compliance-checks",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Compliance Checks",
    route: "/estates-compliance",
    icon: ShieldCheck,
    shortDescription: "Statutory compliance tracking.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "energy-data",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Energy & Utilities",
    route: "/dashboard/estates/energy",
    icon: Zap,
    shortDescription: "Monitor usage & costs.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "floor-plan",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Floor Plan",
    route: "/dashboard/estates/floor-plan",
    icon: Building2,
    shortDescription: "Interactive building map with overlays.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "asset-tags",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Asset Tags",
    route: "/dashboard/estates/asset-tags",
    icon: QrCode,
    shortDescription: "Generate and print QR codes for asset tracking.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "condition-survey",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Condition Survey",
    route: "/dashboard/estates/condition-survey",
    icon: ClipboardCheck,
    shortDescription: "Building condition grading with backlog costing.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "lettings",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Lettings",
    route: "/dashboard/estates/lettings",
    icon: Calendar,
    shortDescription: "Room bookings and lettings income management.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "workflows",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Workflows",
    route: "/dashboard/workflows",
    icon: ClipboardCheck,
    shortDescription: "Ed-orchestrated multi-step processes and checklists.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "sops",
    moduleId: "estates",
    subcategoryId: "estates",
    name: "Procedures (SOPs)",
    route: "/dashboard/sops",
    icon: ClipboardCheck,
    shortDescription:
      "Step-by-step guided checklists for H&S and compliance procedures.",
    requiredPermissions: [
      "admin",
      "headteacher",
      "slt",
      "caretaker",
      "teacher",
    ],
  },

  // HR Apps
  {
    id: "hr-home",
    moduleId: "estates",
    subcategoryId: "hr",
    name: "HR & People",
    route: "/dashboard/hr",
    icon: Users,
    shortDescription: "HR overview & tools.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "maternity-leave-calculator",
    moduleId: "estates",
    subcategoryId: "hr",
    name: "Maternity Leave Calculator",
    route: "/dashboard/hr/maternity-leave-calculator",
    icon: ClipboardList,
    shortDescription: "Calculate pay & leave dates.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "staff-directory",
    moduleId: "estates",
    subcategoryId: "hr",
    name: "Staff Directory",
    route: "/dashboard/hr/people",
    icon: Users,
    shortDescription: "Search and view staff records.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "meeting-companion",
    moduleId: "estates",
    subcategoryId: "hr",
    name: "Meeting Companion",
    route: "/dashboard/hr/meetings",
    icon: ClipboardCheck,
    shortDescription: "AI-guided HR meeting management.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "staff-connectors",
    moduleId: "estates",
    subcategoryId: "hr",
    name: "Staff Connectors",
    route: "/dashboard/connectors",
    icon: Settings,
    shortDescription:
      "Statutory roles, responsibilities, and compliance tracking.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "performance-management",
    moduleId: "estates",
    subcategoryId: "hr",
    name: "Performance Management",
    route: "/dashboard/hr/performance",
    icon: Target,
    shortDescription: "Appraisals, objectives, and pay recommendations.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "cover-management",
    moduleId: "estates",
    subcategoryId: "hr",
    name: "Cover Management",
    route: "/dashboard/hr/cover",
    icon: UserCheck,
    shortDescription: "Staff absence recording and cover arrangements.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },

  // Finance Apps
  {
    id: "finance-home",
    moduleId: "estates",
    subcategoryId: "finance",
    name: "Finance Hub",
    route: "/dashboard/finance",
    icon: PoundSterling,
    shortDescription: "Budget overview and decision engine.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "budget-engine",
    moduleId: "estates",
    subcategoryId: "finance",
    name: "Budget Decisions",
    route: "/dashboard/finance/decisions",
    icon: TrendingUp,
    shortDescription: "AI-powered budget decision cards.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "budget-monitor",
    moduleId: "estates",
    subcategoryId: "finance",
    name: "Budget Monitor",
    route: "/dashboard/finance/monitor",
    icon: BarChart3,
    shortDescription: "Real-time spend tracking by CFR code.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "deal-finder",
    moduleId: "estates",
    subcategoryId: "finance",
    name: "Deal Finder",
    route: "/toolbox/deal-finder",
    icon: Briefcase,
    shortDescription: "Find best prices and raise requisitions.",
    requiredPermissions: [
      "admin",
      "headteacher",
      "slt",
      "teacher",
      "caretaker",
    ],
  },
  {
    id: "payroll-parser",
    moduleId: "estates",
    subcategoryId: "finance",
    name: "Payroll Import",
    route: "/dashboard/finance/payroll",
    icon: Users,
    shortDescription: "Import payroll data for ICFP analysis.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },

  // =========================================================================
  // MARS - COMPLIANCE & SAFEGUARDING APPS
  // =========================================================================

  // Compliance Apps
  {
    id: "compliance-home",
    moduleId: "compliance",
    name: "Compliance Hub",
    route: "/dashboard/compliance",
    icon: ShieldCheck,
    shortDescription: "Overview and health scores.",
    requiredPermissions: ["admin", "headteacher", "slt", "governor"],
  },
  {
    id: "compliance-policies",
    moduleId: "compliance",
    name: "Policies",
    route: "/dashboard/compliance/policies",
    icon: FileText,
    shortDescription: "Statutory policy management.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "compliance-docs",
    moduleId: "compliance",
    name: "Document Builder",
    route: "/dashboard/compliance/docs",
    icon: FileEdit,
    shortDescription: "Incident reports and documents.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "compliance-training",
    moduleId: "compliance",
    name: "Training Checker",
    route: "/dashboard/compliance/training",
    icon: GraduationCap,
    shortDescription: "Staff training compliance.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "compliance-gdpr",
    moduleId: "compliance",
    name: "GDPR Toolkit",
    route: "/dashboard/compliance/gdpr",
    icon: Lock,
    shortDescription: "DPIAs, SARs, and breach log.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "compliance-tasks",
    moduleId: "compliance",
    name: "Compliance Tasks",
    route: "/dashboard/compliance/tasks",
    icon: CheckSquare,
    shortDescription: "Track compliance actions.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "compliance-scr",
    moduleId: "compliance",
    name: "Single Central Record",
    route: "/dashboard/compliance/scr",
    icon: ClipboardList,
    shortDescription: "Digital SCR with DBS and pre-employment checks.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "compliance-complaints",
    moduleId: "compliance",
    name: "Complaints Tracker",
    route: "/dashboard/compliance/complaints",
    icon: Mail,
    shortDescription: "3-stage complaints procedure tracker.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "compliance-concerns",
    moduleId: "compliance",
    name: "Low-Level Concerns",
    route: "/dashboard/compliance/concerns",
    icon: ShieldCheck,
    shortDescription: "Confidential low-level concerns log (DSL only).",
    requiredPermissions: ["admin", "headteacher"],
  },
  {
    id: "compliance-consent",
    moduleId: "compliance",
    name: "Consent Manager",
    route: "/dashboard/compliance/consent",
    icon: FileEdit,
    shortDescription: "Photo, trip and medical consent tracking.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "compliance-foi",
    moduleId: "compliance",
    name: "FOI Tracker",
    route: "/dashboard/compliance/foi",
    icon: FilePlus,
    shortDescription: "Freedom of Information request tracker.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "compliance-dpo",
    moduleId: "compliance",
    name: "DPO Service",
    route: "/dashboard/compliance/dpo",
    icon: Shield,
    shortDescription: "Outsourced DPO service via Vrisk.",
    requiredPermissions: ["admin", "headteacher"],
  },
  {
    id: "compliance-website",
    moduleId: "compliance",
    name: "Website Compliance",
    route: "/dashboard/website-compliance",
    icon: Globe,
    shortDescription: "Scan website against 28+ statutory requirements.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "school-meals",
    moduleId: "compliance",
    name: "School Meals",
    route: "/dashboard/school-meals",
    icon: ClipboardCheck,
    shortDescription:
      "FSM tracking, meal registrations, and dietary management.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },

  // Safeguarding Apps
  {
    id: "safeguarding-home",
    moduleId: "compliance",
    name: "DSL Dashboard",
    route: "/dashboard/safeguarding",
    icon: Eye,
    shortDescription: "Concern logging, triage, and chronology.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },

  // =========================================================================
  // JUPITER - COMMUNICATIONS APPS
  // =========================================================================
  {
    id: "comms-hub",
    moduleId: "communications",
    name: "Comms Hub",
    route: "/dashboard/comms",
    icon: Radio,
    shortDescription: "Overview of all school communications in one place.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "school-notices",
    moduleId: "communications",
    name: "Notices",
    route: "/dashboard/notices",
    icon: Megaphone,
    shortDescription: "School notices, announcements, and quick messages.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "video-rooms",
    moduleId: "communications",
    name: "Video Rooms",
    route: "/dashboard/comms",
    icon: Video,
    shortDescription: "Google Meet, Teams, and Zoom meetings.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "comms-analytics",
    moduleId: "communications",
    name: "Comms Analytics",
    route: "/dashboard/comms/analytics",
    icon: BarChart3,
    shortDescription:
      "Message reach, engagement, and device connectivity stats.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "classroom-display",
    moduleId: "communications",
    name: "Display Setup",
    route: "/display/setup",
    icon: Monitor,
    shortDescription: "Register and manage classroom display boards.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "school-branding",
    moduleId: "communications",
    name: "School Branding",
    route: "/dashboard/settings/branding",
    icon: Palette,
    shortDescription:
      "Logo, colours, motto — used across displays and documents.",
    requiredPermissions: ["admin", "headteacher"],
  },

  // Emergency Planning
  {
    id: "emergency-planning",
    moduleId: "communications",
    name: "Emergency Broadcast",
    route: "/dashboard/emergency-broadcast",
    icon: Siren,
    shortDescription:
      "Zone-aware emergency broadcasts, lockdown, and evacuation alerts.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },
  {
    id: "drill-scheduler",
    moduleId: "communications",
    name: "Drill Scheduler",
    route: "/dashboard/emergency-broadcast/drills",
    icon: Shield,
    shortDescription:
      "Schedule drills, log reports, and track statutory compliance.",
    requiredPermissions: ["admin", "headteacher", "slt", "caretaker"],
  },

  // Calendar App
  {
    id: "calendar-home",
    moduleId: "communications",
    name: "School Calendar",
    route: "/dashboard/calendar",
    icon: Calendar,
    shortDescription: "Term dates, events, and parents' evening.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher", "governor"],
  },

  // Surveys
  {
    id: "surveys-home",
    moduleId: "communications",
    name: "Surveys",
    route: "/dashboard/surveys",
    icon: MessageSquare,
    shortDescription: "Create and manage surveys.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "survey-templates",
    moduleId: "communications",
    name: "Templates",
    route: "/dashboard/surveys/templates",
    icon: ClipboardList,
    shortDescription: "Pre-built survey templates.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "survey-analytics",
    moduleId: "communications",
    name: "Analytics",
    route: "/dashboard/surveys/analytics",
    icon: BarChart3,
    shortDescription: "Cross-survey analytics and insights.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },

  // Website
  {
    id: "website-home",
    moduleId: "communications",
    name: "Website Builder",
    route: "/dashboard/website",
    icon: Globe,
    shortDescription: "Design and manage your school website.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "website-pages",
    moduleId: "communications",
    name: "Pages",
    route: "/dashboard/website/pages",
    icon: FileText,
    shortDescription: "Edit and manage website pages.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "website-design",
    moduleId: "communications",
    name: "Design Studio",
    route: "/dashboard/website/design",
    icon: Palette,
    shortDescription: "Customise colours, fonts, and layout.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "website-news",
    moduleId: "communications",
    name: "News & Blog",
    route: "/dashboard/website/news",
    icon: Newspaper,
    shortDescription: "Publish news articles and updates.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "website-media",
    moduleId: "communications",
    name: "Media Library",
    route: "/dashboard/website/media",
    icon: FileImage,
    shortDescription: "Upload and manage images and files.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "website-compliance",
    moduleId: "communications",
    name: "Web Compliance",
    route: "/dashboard/website/compliance",
    icon: ShieldCheck,
    shortDescription: "DfE statutory website requirements checker.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },

  // =========================================================================
  // SATURN - SCHOOLGLE INTELLIGENCE APPS
  // =========================================================================
  {
    id: "canvas-home",
    moduleId: "intelligence",
    name: "Canvas",
    route: "/dashboard/canvas",
    icon: Database,
    shortDescription: "Data intelligence — ingest, reconcile, visualise.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },
  {
    id: "intelligence-home",
    moduleId: "intelligence",
    name: "School Intelligence",
    route: "/dashboard/intelligence",
    icon: Brain,
    shortDescription: "DfE benchmarks and comparative analytics.",
    requiredPermissions: ["admin", "headteacher", "slt"],
  },

  // Data Suite Apps
  {
    id: "attendance-home",
    moduleId: "intelligence",
    name: "Attendance",
    route: "/dashboard/attendance",
    icon: UserCheck,
    shortDescription: "Registration, absence tracking, and interventions.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },

  {
    id: "behaviour-home",
    moduleId: "intelligence",
    name: "Behaviour",
    route: "/dashboard/behaviour",
    icon: Scale,
    shortDescription: "Incident logging, consequences, and exclusion tracking.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },

  {
    id: "send-home",
    moduleId: "intelligence",
    name: "SEND",
    route: "/dashboard/send",
    icon: Heart,
    shortDescription: "SEN register and provision mapping.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },

  // =========================================================================
  // URANUS - TEACHING & LEARNING APPS
  // =========================================================================
  {
    id: "lesson-studio",
    moduleId: "teaching-learning",
    name: "Lesson Studio",
    route: "/dashboard/teaching-learning/lesson-studio",
    icon: Sparkles,
    shortDescription:
      "AI-powered connected lesson planning that knows your pupils.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "lesson-planning",
    moduleId: "teaching-learning",
    name: "Lesson Planning",
    route: "/dashboard/teaching-learning/lesson-planning",
    icon: BookOpen,
    shortDescription: "AI-powered lesson plans.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "resource-generator",
    moduleId: "teaching-learning",
    name: "Resource Generator",
    route: "/dashboard/teaching-learning/resource-generator",
    icon: FilePlus,
    shortDescription: "Worksheets & materials.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "assessment-support",
    moduleId: "teaching-learning",
    name: "Assessment Support",
    route: "/dashboard/teaching-learning/assessment-support",
    icon: CheckSquare,
    shortDescription: "Marking & feedback.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "parent-comms",
    moduleId: "teaching-learning",
    name: "Parent Comms",
    route: "/dashboard/teaching-learning/parent-comms",
    icon: Mail,
    shortDescription: "Draft newsletters & updates.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "intervention-notes",
    moduleId: "teaching-learning",
    name: "Intervention Notes",
    route: "/dashboard/teaching-learning/intervention-notes",
    icon: ClipboardList,
    shortDescription: "Track support impact.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
  {
    id: "sim-studio",
    moduleId: "teaching-learning",
    name: "Sim Studio",
    route: "/sim-studio",
    icon: Gamepad2,
    shortDescription: "Interactive simulations & assessment quests.",
    requiredPermissions: ["admin", "headteacher", "slt", "teacher"],
  },
];

export const NAVBAR_CONFIG = [
  {
    id: "workspace",
    name: "Workspace",
    items: [
      {
        id: "home",
        name: "Home",
        route: "/dashboard",
        icon: LayoutDashboard,
        permissions: [
          "admin",
          "headteacher",
          "slt",
          "teacher",
          "governor",
          "caretaker",
          "viewer",
        ],
      },
      {
        id: "tasks",
        name: "My Tasks",
        route: "/dashboard/tasks",
        icon: CheckSquare,
        permissions: [
          "admin",
          "headteacher",
          "slt",
          "teacher",
          "governor",
          "caretaker",
          "viewer",
        ],
      },
      {
        id: "calendar",
        name: "Calendar",
        route: "/dashboard/calendar",
        icon: Calendar,
        color: "orange",
        permissions: ["admin", "headteacher", "slt", "teacher", "governor"],
      },
      {
        id: "show-me",
        name: "Show Me",
        route: "/dashboard/show-me",
        icon: Sparkles,
        color: "gray",
        permissions: ["admin", "headteacher", "slt"],
      },
    ],
  },
];

export function getModuleByPath(path: string): ModuleDefinition | undefined {
  // Exact module landing pages
  const module = MODULES.find(
    (m) =>
      path === `/dashboard/${m.id}` || path.startsWith(`/dashboard/${m.id}/`),
  );
  if (module) return module;

  // Map apps to modules
  const app = APPS.find(
    (a) => path === a.route || path.startsWith(a.route + "/"),
  );
  if (app) return MODULES.find((m) => m.id === app.moduleId);

  // Fallback for special cases
  if (path.startsWith("/evidence"))
    return MODULES.find((m) => m.id === "improvement");
  if (path.startsWith("/timeline"))
    return MODULES.find((m) => m.id === "improvement");
  if (path.startsWith("/dashboard/sef"))
    return MODULES.find((m) => m.id === "improvement");
  if (path.startsWith("/dashboard/sdp"))
    return MODULES.find((m) => m.id === "improvement");
  if (path.startsWith("/dashboard/siams"))
    return MODULES.find((m) => m.id === "improvement");
  if (path.startsWith("/dashboard/tasks"))
    return MODULES.find((m) => m.id === "improvement");
  if (path.startsWith("/dashboard/surveys"))
    return MODULES.find((m) => m.id === "communications");
  if (path.startsWith("/dashboard/risk"))
    return MODULES.find((m) => m.id === "governance");
  if (path.startsWith("/dashboard/pupil-premium"))
    return MODULES.find((m) => m.id === "improvement");
  if (path.startsWith("/dashboard/sports-premium"))
    return MODULES.find((m) => m.id === "improvement");
  if (path.startsWith("/dashboard/admissions"))
    return MODULES.find((m) => m.id === "improvement");
  if (path.startsWith("/dashboard/emergency"))
    return MODULES.find((m) => m.id === "communications");
  if (path.startsWith("/dashboard/comms"))
    return MODULES.find((m) => m.id === "communications");
  if (path.startsWith("/dashboard/notices"))
    return MODULES.find((m) => m.id === "communications");
  if (path.startsWith("/display"))
    return MODULES.find((m) => m.id === "communications");
  if (path.startsWith("/dashboard/school-meals"))
    return MODULES.find((m) => m.id === "compliance");
  if (path.startsWith("/dashboard/safeguarding"))
    return MODULES.find((m) => m.id === "compliance");
  if (path.startsWith("/dashboard/attendance"))
    return MODULES.find((m) => m.id === "intelligence");
  if (path.startsWith("/dashboard/send"))
    return MODULES.find((m) => m.id === "intelligence");
  if (path.startsWith("/dashboard/behaviour"))
    return MODULES.find((m) => m.id === "intelligence");
  if (path.startsWith("/dashboard/calendar"))
    return MODULES.find((m) => m.id === "communications");
  if (path.startsWith("/dashboard/website"))
    return MODULES.find((m) => m.id === "communications");
  if (path.startsWith("/dashboard/canvas"))
    return MODULES.find((m) => m.id === "intelligence");
  if (path.startsWith("/dashboard/intelligence"))
    return MODULES.find((m) => m.id === "intelligence");

  return undefined;
}

export function canUserAccess(
  permissionRoles: Role[],
  userRole: Role | undefined,
): boolean {
  if (!userRole) return false;
  if (userRole === "admin" || userRole === "headteacher") return true;
  return permissionRoles.includes(userRole);
}

// ============================================================================
// ED - THE MOON (AI Assistant Add-on)
// ============================================================================
export const ED_ASSISTANTS = [
  {
    id: "ed-chat",
    name: "Ed Chat",
    icon: MessageCircle,
    description: "AI chatbot for staff questions and workflow guidance",
    price: 200,
  },
  {
    id: "ed-voice",
    name: "Ed Voice",
    icon: Mic,
    description: "Voice AI assistant for hands-free data entry and planning",
    price: 300,
  },
  {
    id: "ed-embed",
    name: "Ed Website Chat",
    icon: MessageSquare,
    description: "Parent-facing chatbot for your school website",
    price: 150,
  },
  {
    id: "form-helper",
    name: "Form Helper",
    icon: FormInput,
    description: "AI-powered form automation and data extraction",
    price: 250,
  },
];
