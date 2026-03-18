"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  Loader2,
  Lock,
  ArrowLeft,
  ChevronDown,
  Check,
  AlertTriangle,
  Save,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

interface OrgMember {
  user_id: string;
  email: string;
  role: string;
  display_name?: string;
  created_at: string;
}

const ROLES = [
  {
    value: "admin",
    label: "Admin",
    color: "bg-red-100 text-red-700",
    desc: "Full system access, manage users",
  },
  {
    value: "headteacher",
    label: "Headteacher",
    color: "bg-purple-100 text-purple-700",
    desc: "Full data + approval authority",
  },
  {
    value: "slt",
    label: "SLT",
    color: "bg-blue-100 text-blue-700",
    desc: "Full data, class management",
  },
  {
    value: "teacher",
    label: "Teacher",
    color: "bg-green-100 text-green-700",
    desc: "Own class data only",
  },
  {
    value: "governor",
    label: "Governor",
    color: "bg-amber-100 text-amber-700",
    desc: "Aggregated data, governance",
  },
  {
    value: "viewer",
    label: "Viewer",
    color: "bg-slate-100 text-slate-700",
    desc: "Read-only dashboard",
  },
];

const MODULE_ACCESS: {
  module: string;
  roles: string[];
}[] = [
  {
    module: "Dashboard Overview",
    roles: ["admin", "headteacher", "slt", "teacher", "governor", "viewer"],
  },
  {
    module: "Teaching & Learning",
    roles: ["admin", "headteacher", "slt", "teacher"],
  },
  { module: "Attendance", roles: ["admin", "headteacher", "slt", "teacher"] },
  { module: "Behaviour", roles: ["admin", "headteacher", "slt", "teacher"] },
  { module: "SEND", roles: ["admin", "headteacher", "slt", "sendco"] },
  { module: "Safeguarding", roles: ["admin", "headteacher", "slt"] },
  { module: "HR & People", roles: ["admin", "headteacher", "slt"] },
  { module: "Finance", roles: ["admin", "headteacher", "slt"] },
  { module: "Estates", roles: ["admin", "headteacher", "slt", "caretaker"] },
  { module: "Compliance", roles: ["admin", "headteacher", "slt"] },
  { module: "Governance", roles: ["admin", "headteacher", "governor"] },
  { module: "Intelligence & Data", roles: ["admin", "headteacher", "slt"] },
  { module: "Settings & Admin", roles: ["admin", "headteacher"] },
];

export default function PrivilegesPage() {
  const { user, organization } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orgId = organization?.id;
  const userRole = organization?.role;
  const isAdmin = ["admin", "headteacher"].includes(userRole || "");

  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select("user_id, role, created_at")
        .eq("organization_id", orgId)
        .order("role")
        .order("created_at");

      if (error) throw error;

      // Get emails from auth - we can only get the current user's email easily
      // For a production app you'd have a users table or use admin API
      const enriched: OrgMember[] = (data || []).map((m) => ({
        ...m,
        email: m.user_id === user?.id ? user?.email || "" : m.user_id,
        display_name: m.user_id === user?.id ? "You" : undefined,
      }));

      setMembers(enriched);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId, user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === user?.id) return; // Can't change own role
    setSaving(userId);
    setError(null);
    try {
      const { error } = await supabase
        .from("organization_members")
        .update({ role: newRole })
        .eq("organization_id", orgId)
        .eq("user_id", userId);

      if (error) throw error;
      await fetchMembers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold mb-1">Admin Access Only</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              User privileges are managed by your school&apos;s admin or
              headteacher.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading user privileges...
        </div>
      </div>
    );
  }

  const filtered = members.filter(
    (m) =>
      !search ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/settings")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Settings
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          User Privileges
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage who can access what across the platform. Changes take effect
          immediately.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Member list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Organization Members ({members.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-900 w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((member) => {
              const currentRole = ROLES.find((r) => r.value === member.role);
              const isYou = member.user_id === user?.id;

              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1.5">
                        {member.email}
                        {isYou && (
                          <Badge className="text-[9px] bg-blue-100 text-blue-600">
                            YOU
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentRole?.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isYou ? (
                      <Badge className={`${currentRole?.color} text-xs`}>
                        {currentRole?.label}
                      </Badge>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.user_id, e.target.value)
                        }
                        disabled={saving === member.user_id}
                        className="text-xs border rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 font-medium"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {saving === member.user_id && (
                      <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Module access matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">
            Module Access by Role
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-slate-50 dark:bg-slate-900">
                <th className="text-left px-4 py-2 font-bold">Module</th>
                {ROLES.map((r) => (
                  <th key={r.value} className="text-center px-2 py-2 font-bold">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULE_ACCESS.map((mod) => (
                <tr
                  key={mod.module}
                  className="border-b hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <td className="px-4 py-2 font-medium">{mod.module}</td>
                  {ROLES.map((r) => (
                    <td key={r.value} className="text-center px-2 py-2">
                      {mod.roles.includes(r.value) ? (
                        <Check className="w-3.5 h-3.5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Data visibility rules */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-200">
        <CardContent className="py-4">
          <h3 className="text-sm font-bold mb-2 text-blue-900 dark:text-blue-200">
            Data Visibility Rules
          </h3>
          <ul className="space-y-1.5 text-xs text-blue-700 dark:text-blue-300">
            <li>
              <Check className="w-3 h-3 inline mr-1" />
              <strong>Teachers</strong> only see attendance, behaviour, and
              assessment data for their <strong>assigned classes</strong> (set
              in Class Assignments)
            </li>
            <li>
              <Check className="w-3 h-3 inline mr-1" />
              <strong>SLT+</strong> always see whole-school data across all
              modules
            </li>
            <li>
              <Check className="w-3 h-3 inline mr-1" />
              <strong>Governors</strong> see aggregated whole-school data but{" "}
              <strong>not individual pupil records</strong>
            </li>
            <li>
              <Check className="w-3 h-3 inline mr-1" />
              <strong>Ed AI</strong> automatically filters responses based on
              the user&apos;s role and class assignments
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
