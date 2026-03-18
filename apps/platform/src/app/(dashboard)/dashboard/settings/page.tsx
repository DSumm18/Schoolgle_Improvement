"use client";

import { useAuth } from "@/context/SupabaseAuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  Settings2,
  Database,
  BookOpen,
  Shield,
  Zap,
  Users,
  Lock,
  ChevronRight,
  Loader2,
  User,
  Palette,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Tab definitions with role access ───────────────────────

interface SettingsTab {
  id: string;
  label: string;
  icon: any;
  description: string;
  /** Roles that can see this tab. Empty = everyone. */
  roles: string[];
  /** Route to navigate to */
  href: string;
  /** Color accent */
  color: string;
  bgColor: string;
}

const SETTINGS_TABS: SettingsTab[] = [
  {
    id: "account",
    label: "My Account",
    icon: User,
    description: "Your profile, email, and organization memberships",
    roles: [],
    href: "/dashboard/settings/account",
    color: "text-slate-600",
    bgColor: "bg-slate-50 dark:bg-slate-900",
  },
  {
    id: "branding",
    label: "School Branding",
    icon: Palette,
    description:
      "Logo, colours, and contact details for documents and policies",
    roles: ["admin", "headteacher"],
    href: "/dashboard/settings/branding",
    color: "text-slate-600",
    bgColor: "bg-slate-50 dark:bg-slate-900",
  },
  {
    id: "class-assignments",
    label: "Class Assignments",
    icon: BookOpen,
    description:
      "Assign staff to year groups and classes — controls what data teachers see",
    roles: ["admin", "headteacher", "slt"],
    href: "/dashboard/settings/class-assignments",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    id: "data-connections",
    label: "Data Connections",
    icon: Database,
    description:
      "Connect Google Drive to import MIS exports, finance reports, and school documents",
    roles: ["admin", "headteacher", "slt"],
    href: "/dashboard/settings/data-connections",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    id: "user-privileges",
    label: "User Privileges",
    icon: Shield,
    description:
      "Manage who can access what — role assignments, module access, and approval chains",
    roles: ["admin", "headteacher"],
    href: "/dashboard/settings/privileges",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    id: "skills",
    label: "Ed Skill Library",
    icon: Zap,
    description:
      "Enable and configure Ed's autonomous skills — emails, reports, compliance checks",
    roles: ["admin", "headteacher", "slt"],
    href: "/dashboard/settings/skills",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    id: "calendar",
    label: "Calendar Management",
    icon: Calendar,
    description:
      "INSET days, clubs, lettings, parents' evenings, and other school calendar events",
    roles: ["admin", "headteacher", "slt"],
    href: "/dashboard/settings/calendar",
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/20",
  },
  {
    id: "approvals",
    label: "Approvals & Delegation",
    icon: Users,
    description:
      "Spending authority thresholds, approval chains, and delegation rules",
    roles: ["admin", "headteacher", "slt"],
    href: "/dashboard/settings/approvals",
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
  },
];

// ─── Privilege Model Summary ──────────────────────────────

const ROLE_PRIVILEGES = [
  {
    role: "Admin",
    badge: "bg-red-100 text-red-700",
    privileges: [
      "Full system access",
      "Manage users & roles",
      "Data connections",
      "Class assignments",
      "Approval rules",
      "Ed skill configuration",
    ],
  },
  {
    role: "Headteacher",
    badge: "bg-purple-100 text-purple-700",
    privileges: [
      "Full data visibility",
      "Manage users & roles",
      "Data connections",
      "Class assignments",
      "Final approval authority",
      "All module access",
    ],
  },
  {
    role: "SLT",
    badge: "bg-blue-100 text-blue-700",
    privileges: [
      "Full data visibility",
      "Class assignments",
      "Data connections",
      "Intermediate approvals",
      "All module access",
      "Staff management",
    ],
  },
  {
    role: "Teacher",
    badge: "bg-green-100 text-green-700",
    privileges: [
      "Own class data only",
      "Attendance & behaviour for assigned classes",
      "Assessment data for assigned year groups",
      "Teaching & Learning module",
      "Ed chat (class-filtered)",
      "No admin access",
    ],
  },
  {
    role: "Governor",
    badge: "bg-amber-100 text-amber-700",
    privileges: [
      "Whole-school aggregated data",
      "Governance module",
      "Strategic documents (SEF, SDP)",
      "Compliance overview",
      "No pupil-level data",
      "No admin access",
    ],
  },
  {
    role: "Viewer",
    badge: "bg-slate-100 text-slate-700",
    privileges: [
      "Read-only dashboard",
      "No sensitive data",
      "No admin access",
      "No module editing",
    ],
  },
];

function SettingsContent() {
  const { user, organization, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showPrivileges = searchParams.get("view") === "privileges";

  const userRole = organization?.role || "";
  const isSLT = ["admin", "headteacher", "slt"].includes(userRole);
  const isAdmin = ["admin", "headteacher"].includes(userRole);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Filter tabs by user role
  const visibleTabs = SETTINGS_TABS.filter(
    (tab) => tab.roles.length === 0 || tab.roles.includes(userRole),
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your school&apos;s configuration, data sources, and user access
        </p>
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Signed in as</span>
        <Badge variant="outline" className="font-medium capitalize">
          {userRole || "unknown"}
        </Badge>
        <span className="text-sm text-muted-foreground">at</span>
        <span className="text-sm font-medium">
          {organization?.name || "No organization"}
        </span>
      </div>

      {/* Settings cards */}
      <div className="grid gap-3">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className={`${tab.bgColor} border rounded-xl p-4 text-left hover:shadow-md hover:scale-[1.005] transition-all group flex items-center gap-4 w-full`}
            >
              <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                <Icon className={`w-5 h-5 ${tab.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">{tab.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tab.description}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Privilege model — visible to admins */}
      {isAdmin && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role Privilege Matrix
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            What each role can see and do across the platform.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROLE_PRIVILEGES.map((rp) => (
              <Card key={rp.role} className="overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <Badge className={`${rp.badge} text-xs font-bold`}>
                    {rp.role}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <ul className="space-y-1.5">
                    {rp.privileges.map((p) => (
                      <li
                        key={p}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-green-500 mt-0.5">•</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Non-admin view */}
      {!isSLT && (
        <Card>
          <CardContent className="py-8 text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-muted-foreground">
              Additional settings are managed by your school&apos;s leadership
              team. You&apos;ll see data relevant to your assigned classes in
              the dashboard.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
