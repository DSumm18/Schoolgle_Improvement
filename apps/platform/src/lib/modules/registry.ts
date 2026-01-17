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
    Zap
} from 'lucide-react';

export type Role = 'admin' | 'headteacher' | 'slt' | 'teacher' | 'governor' | 'caretaker' | 'viewer';

export interface AppDefinition {
    id: string;
    moduleId: string;
    name: string;
    route: string;
    icon: any;
    shortDescription: string;
    requiredPermissions: Role[];
}

export interface ModuleDefinition {
    id: string;
    name: string;
    color: string;
    icon: any;
    description: string;
    requiredPermissions: Role[];
}

export const MODULES: ModuleDefinition[] = [
    {
        id: 'governance',
        name: 'Governance',
        color: 'gray',
        icon: ShieldCheck,
        description: 'Strategic oversight and governor portal.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'governor']
    },
    {
        id: 'improvement',
        name: 'Inspection Readiness',
        color: 'rose',
        icon: Shield,
        description: 'Ofsted and SIAMS assessment tools.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    },
    {
        id: 'teaching-learning',
        name: 'Teaching & Learning',
        color: 'blue',
        icon: GraduationCap,
        description: 'Classroom tools and pedagogy support.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    },
    {
        id: 'estates',
        name: 'Estates',
        color: 'teal',
        icon: Building2,
        description: 'Premises, maintenance and contractor management.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'caretaker']
    },
    {
        id: 'compliance',
        name: 'Compliance',
        color: 'purple',
        icon: ShieldCheck,
        description: 'Statutory policy and risk management.',
        requiredPermissions: ['admin', 'headteacher', 'slt']
    },
    {
        id: 'finance',
        name: 'Finance',
        color: 'amber',
        icon: PoundSterling,
        description: 'Budget monitoring and procurement.',
        requiredPermissions: ['admin', 'headteacher', 'slt']
    },
    {
        id: 'hr',
        name: 'HR & People',
        color: 'indigo',
        icon: Users,
        description: 'Staff performance and wellbeing.',
        requiredPermissions: ['admin', 'headteacher', 'slt']
    },
    {
        id: 'send',
        name: 'SEND',
        color: 'rose',
        icon: Heart,
        description: 'EHCP and provision mapping.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    }
];

export const APPS: AppDefinition[] = [
    // Improvement Apps
    {
        id: 'ofsted-readiness',
        moduleId: 'improvement',
        name: 'Ofsted Readiness',
        route: '/dashboard/ofsted-readiness',
        icon: Shield,
        shortDescription: 'Track framework compliance.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    },
    {
        id: 'sef-builder',
        moduleId: 'improvement',
        name: 'SEF Builder',
        route: '/dashboard/sef',
        icon: FileText,
        shortDescription: 'Draft self-evaluation reports.',
        requiredPermissions: ['admin', 'headteacher', 'slt']
    },
    {
        id: 'sdp-builder',
        moduleId: 'improvement',
        name: 'SDP Builder',
        route: '/dashboard/sdp',
        icon: TrendingUp,
        shortDescription: 'Manage development plans.',
        requiredPermissions: ['admin', 'headteacher', 'slt']
    },
    {
        id: 'action-plan',
        moduleId: 'improvement',
        name: 'Action Plan',
        route: '/dashboard/action-plan',
        icon: Target,
        shortDescription: 'Track strategic tasks.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    },
    {
        id: 'evidence-vault',
        moduleId: 'improvement',
        name: 'My Evidence',
        route: '/evidence',
        icon: FileText,
        shortDescription: 'Central evidence library.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    },
    {
        id: 'audit-timeline',
        moduleId: 'improvement',
        name: 'Audit Timeline',
        route: '/timeline',
        icon: Clock,
        shortDescription: 'Historical record of changes.',
        requiredPermissions: ['admin', 'headteacher', 'slt']
    },

    // Teaching & Learning Apps
    {
        id: 'lesson-planning',
        moduleId: 'teaching-learning',
        name: 'Lesson Planning',
        route: '/dashboard/teaching-learning/lesson-planning',
        icon: BookOpen,
        shortDescription: 'AI-powered plans.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    },
    {
        id: 'resource-generator',
        moduleId: 'teaching-learning',
        name: 'Resource Generator',
        route: '/dashboard/teaching-learning/resource-generator',
        icon: FilePlus,
        shortDescription: 'Worksheets & materials.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    },
    {
        id: 'assessment-support',
        moduleId: 'teaching-learning',
        name: 'Assessment Support',
        route: '/dashboard/teaching-learning/assessment-support',
        icon: CheckSquare,
        shortDescription: 'Marking & feedback.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    },
    {
        id: 'parent-comms',
        moduleId: 'teaching-learning',
        name: 'Parent Comms',
        route: '/dashboard/teaching-learning/parent-comms',
        icon: Mail,
        shortDescription: 'Draft newsletters & updates.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    },
    {
        id: 'intervention-notes',
        moduleId: 'teaching-learning',
        name: 'Intervention Notes',
        route: '/dashboard/teaching-learning/intervention-notes',
        icon: ClipboardList,
        shortDescription: 'Track support impact.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'teacher']
    },

    // HR Apps
    {
        id: 'hr-home',
        moduleId: 'hr',
        name: 'HR & People',
        route: '/dashboard/hr',
        icon: Users,
        shortDescription: 'HR overview & tools.',
        requiredPermissions: ['admin', 'headteacher', 'slt']
    },
    {
        id: 'maternity-leave-calculator',
        moduleId: 'hr',
        name: 'Maternity Leave Calculator',
        route: '/dashboard/hr/maternity-leave-calculator',
        icon: ClipboardList,
        shortDescription: 'Calculate pay & leave dates.',
        requiredPermissions: ['admin', 'headteacher', 'slt']
    },

    // Estates Apps
    {
        id: 'maintenance-tickets',
        moduleId: 'estates',
        name: 'Maintenance',
        route: '/dashboard/estates/maintenance',
        icon: HelpCircle,
        shortDescription: 'Helpdesk & PPM.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'caretaker']
    },
    {
        id: 'estates-audit',
        moduleId: 'estates',
        name: 'Estates Audit',
        route: '/dashboard/estates/audit',
        icon: ShieldCheck,
        shortDescription: 'Performance audit & compliance.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'caretaker']
    },
    {
        id: 'compliance-checks',
        moduleId: 'estates',
        name: 'Compliance Checks',
        route: '/dashboard/estates/compliance',
        icon: ShieldCheck,
        shortDescription: 'Statutory compliance tracking.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'caretaker']
    },
    {
        id: 'energy-data',
        moduleId: 'estates',
        name: 'Energy & Utilities',
        route: '/dashboard/estates/energy',
        icon: Zap,
        shortDescription: 'Monitor usage & costs.',
        requiredPermissions: ['admin', 'headteacher', 'slt', 'caretaker']
    }
];

export const NAVBAR_CONFIG = [
    {
        id: 'workspace',
        name: 'Workspace',
        items: [
            { id: 'home', name: 'Home', route: '/dashboard', icon: LayoutDashboard, permissions: ['admin', 'headteacher', 'slt', 'teacher', 'governor', 'caretaker', 'viewer'] },
            { id: 'tasks', name: 'My Tasks', route: '/dashboard/tasks', icon: Target, permissions: ['admin', 'headteacher', 'slt', 'teacher', 'governor', 'caretaker', 'viewer'] },
        ]
    }
];

export function getModuleByPath(path: string): ModuleDefinition | undefined {
    // Exact module landing pages
    const module = MODULES.find(m => path === `/dashboard/${m.id}` || path.startsWith(`/dashboard/${m.id}/`));
    if (module) return module;

    // Map apps to modules
    const app = APPS.find(a => path === a.route || path.startsWith(a.route + '/'));
    if (app) return MODULES.find(m => m.id === app.moduleId);

    // Fallback for special cases
    if (path.startsWith('/evidence')) return MODULES.find(m => m.id === 'improvement');
    if (path.startsWith('/timeline')) return MODULES.find(m => m.id === 'improvement');
    if (path.startsWith('/dashboard/sef')) return MODULES.find(m => m.id === 'improvement');
    if (path.startsWith('/dashboard/sdp')) return MODULES.find(m => m.id === 'improvement');

    return undefined;
}

export function canUserAccess(permissionRoles: Role[], userRole: Role | undefined): boolean {
    if (!userRole) return false;
    if (userRole === 'admin' || userRole === 'headteacher') return true;
    return permissionRoles.includes(userRole);
}
