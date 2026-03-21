"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
  Search,
  School,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
  Building2,
  Mail,
  Calendar,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Settings,
  Plus,
  Minus,
} from "lucide-react";

interface SchoolSearchResult {
  id: string;
  name: string;
  urn: string | null;
  localAuthority: string | null;
  schoolType: string | null;
  memberCount: number;
  subscription: {
    status: string;
    planId: string;
    daysRemaining: number | null;
  } | null;
}

interface SchoolDetail {
  id: string;
  name: string;
  urn: string | null;
  localAuthority: string | null;
  schoolType: string | null;
  address: any;
  settings: any;
  createdAt: string;
  members: {
    userId: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: string;
  }[];
  subscription: {
    id: string;
    status: string;
    planId: string;
    trialEnd: string | null;
    periodEnd: string | null;
    autoRenew: boolean;
    paymentMethod: string | null;
    enabledModules: string[] | null;
    userLimit: number | null;
  } | null;
  invoices: {
    id: string;
    invoiceNumber: string;
    amount: number;
    total: number;
    status: string;
    issuedDate: string | null;
    dueDate: string | null;
    paidDate: string | null;
  }[];
}

export default function SuperAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SchoolSearchResult[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    expiringSoon: 0,
  });

  // Show toast message
  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Check if user is super admin
  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user?.id) return;

      // user.id is UUID but super_admins.user_id is TEXT - need to cast
      const { data, error } = await supabase
        .from("super_admins")
        .select("access_level")
        .eq("user_id", user.id.toLowerCase()) // Store as lowercase text
        .maybeSingle();

      if (error || !data) {
        setIsSuperAdmin(false);
        router.push("/dashboard");
        return;
      }

      setIsSuperAdmin(true);
      loadStats();
    }

    if (!authLoading && user) {
      checkSuperAdmin();
    }
  }, [user, authLoading, router]);

  // Load dashboard stats
  async function loadStats() {
    try {
      // Get total schools
      const { count: totalSchools } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });

      // Get subscription stats
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("status, current_period_end, trial_end");

      const now = new Date();
      const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      let active = 0;
      let trial = 0;
      let expiring = 0;

      (subs || []).forEach((sub) => {
        if (sub.status === "active") active++;
        if (sub.status === "trialing") trial++;

        const endDate = sub.status === "trialing" ? sub.trial_end : sub.current_period_end;
        if (endDate && new Date(endDate) <= sevenDays && new Date(endDate) > now) {
          expiring++;
        }
      });

      setStats({
        totalSchools: totalSchools || 0,
        activeSubscriptions: active,
        trialSubscriptions: trial,
        expiringSoon: expiring,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  // Search schools by name or URN
  async function searchSchools() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // First get organizations
      let orgQuery = supabase
        .from("organizations")
        .select("id, name, urn, local_authority, school_type")
        .limit(20);

      if (/^\d+$/.test(searchQuery.trim())) {
        orgQuery = orgQuery.eq("urn", searchQuery.trim());
      } else {
        orgQuery = orgQuery.ilike("name", `%${searchQuery.trim()}%`);
      }

      const { data: orgs, error: orgError } = await orgQuery;

      if (orgError) {
        console.error("Search error:", orgError);
        showToast("Search failed", "error");
        return;
      }

      // Get member counts and subscriptions for each org
      const results: SchoolSearchResult[] = await Promise.all(
        (orgs || []).map(async (org) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from("organization_members")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", org.id);

          // Get subscription
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("status, plan_id, trial_end, current_period_end")
            .eq("organization_id", org.id)
            .maybeSingle();

          let daysRemaining = null;
          if (sub) {
            const endDate = sub.status === "trialing" ? sub.trial_end : sub.current_period_end;
            if (endDate) {
              const diff = new Date(endDate).getTime() - Date.now();
              daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }
          }

          return {
            id: org.id,
            name: org.name,
            urn: org.urn,
            localAuthority: org.local_authority,
            schoolType: org.school_type,
            memberCount: memberCount || 0,
            subscription: sub ? {
              status: sub.status,
              planId: sub.plan_id,
              daysRemaining,
            } : null,
          };
        })
      );

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      showToast("Search failed", "error");
    } finally {
      setLoading(false);
    }
  }

  // Load school details
  async function loadSchoolDetail(schoolId: string) {
    setLoading(true);
    try {
      // Get organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", schoolId)
        .single();

      if (orgError || !org) {
        console.error("Error loading school:", orgError);
        showToast("Failed to load school details", "error");
        return;
      }

      // Get members with user emails from auth
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id, role, created_at, auth_id")
        .eq("organization_id", schoolId);

      // Get user emails from auth.users
      const memberIds = (members || []).map(m => m.auth_id || m.user_id).filter(Boolean);
      const { data: authUsers } = memberIds.length > 0 ? await supabase.auth.admin.listUsers() : { data: { users: [] } };

      const userEmails = new Map(
        (authUsers?.users || []).map((u: any) => [u.id, u.email])
      );

      const membersWithEmail = (members || []).map((m: any) => ({
        userId: m.user_id,
        email: userEmails.get(m.auth_id || m.user_id) || "Unknown",
        displayName: userEmails.get(m.auth_id || m.user_id)?.split("@")[0] || "Unknown",
        role: m.role,
        createdAt: m.created_at,
      }));

      // Get subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("*")
        .eq("organization_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(10);

      setSelectedSchool({
        id: org.id,
        name: org.name,
        urn: org.urn,
        localAuthority: org.local_authority,
        schoolType: org.school_type,
        address: org.address,
        settings: org.settings,
        createdAt: org.created_at,
        members: membersWithEmail,
        subscription: sub ? {
          id: sub.id,
          status: sub.status,
          planId: sub.plan_id,
          trialEnd: sub.trial_end,
          periodEnd: sub.current_period_end,
          autoRenew: sub.auto_renew,
          paymentMethod: sub.payment_method,
          enabledModules: sub.enabled_modules,
          userLimit: sub.user_limit,
        } : null,
        invoices: (invoices || []).map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          amount: inv.amount,
          total: inv.total || inv.amount,
          status: inv.status,
          issuedDate: inv.issued_date,
          dueDate: inv.due_date,
          paidDate: inv.paid_date,
        })),
      });
    } catch (error) {
      console.error("Error loading school detail:", error);
      showToast("Failed to load school details", "error");
    } finally {
      setLoading(false);
    }
  }

  // Create or update subscription
  async function updateSubscription(orgId: string, planId: string, status: string = "active") {
    try {
      // Check if subscription exists
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("organization_id", orgId)
        .maybeSingle();

      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);

      if (existing) {
        await supabase
          .from("subscriptions")
          .update({
            plan_id: planId,
            status,
            current_period_end: periodEnd.toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("subscriptions")
          .insert({
            organization_id: orgId,
            plan_id: planId,
            status,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          });
      }

      showToast(`Subscription ${existing ? "updated" : "created"} successfully`);
      loadSchoolDetail(orgId);
      loadStats();
    } catch (error) {
      console.error("Error updating subscription:", error);
      showToast("Failed to update subscription", "error");
    }
  }

  // Extend trial
  async function extendTrial(days: number) {
    if (!selectedSchool?.subscription) return;

    try {
      const currentEnd = selectedSchool.subscription.trialEnd
        ? new Date(selectedSchool.subscription.trialEnd)
        : new Date();

      currentEnd.setDate(currentEnd.getDate() + days);

      await supabase
        .from("subscriptions")
        .update({
          trial_end: currentEnd.toISOString(),
          status: "trialing",
        })
        .eq("id", selectedSchool.subscription.id);

      showToast(`Trial extended by ${days} days`);
      loadSchoolDetail(selectedSchool.id);
    } catch (error) {
      console.error("Error extending trial:", error);
      showToast("Failed to extend trial", "error");
    }
  }

  // Update enabled modules
  async function updateModules(modules: string[]) {
    if (!selectedSchool?.subscription) return;

    try {
      await supabase
        .from("subscriptions")
        .update({ enabled_modules: modules })
        .eq("id", selectedSchool.subscription.id);

      showToast("Modules updated");
      loadSchoolDetail(selectedSchool.id);
    } catch (error) {
      console.error("Error updating modules:", error);
      showToast("Failed to update modules", "error");
    }
  }

  // Impersonate - switch to view as this school
  async function impersonateSchool(schoolId: string, schoolName: string) {
    sessionStorage.setItem("impersonateOrgId", schoolId);
    sessionStorage.setItem("impersonateOrgName", schoolName);
    sessionStorage.setItem("impersonateBy", user?.email || "admin");
    router.push("/dashboard");
  }

  // Status badge component
  function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { icon: any; color: string; bg: string }> = {
      active: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
      trialing: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
      past_due: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
      cancelled: { icon: XCircle, color: "text-gray-600", bg: "bg-gray-50" },
      expired: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    };

    const { icon: Icon, color, bg } = config[status] || config.expired;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color} ${bg}`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  if (authLoading || isSuperAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const allModules = [
    "ofsted-readiness",
    "estates-compliance",
    "hr-people",
    "governance",
    "actions-hub",
    "intelligence",
    "safeguarding",
    "attendance",
    "behaviour",
    "communications",
    "calendar",
    "surveys",
    "canvas",
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-gray-400 hover:text-white">
                <ArrowLeft size={20} />
              </a>
              <div>
                <h1 className="text-xl font-semibold">Super Admin</h1>
                <p className="text-sm text-gray-400">Schoolgle Management Console</p>
              </div>
            </div>
            <button
              onClick={loadStats}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards - Now clickable */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => { setSearchQuery(""); setSearchResults([]); loadSchoolDetail(""); }}
            className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <Building2 size={20} className="text-gray-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalSchools}</div>
                <div className="text-sm text-gray-400">Total Schools</div>
              </div>
            </div>
          </button>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-900/50 rounded-lg">
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                <div className="text-sm text-gray-400">Active</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/50 rounded-lg">
                <Clock size={20} className="text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.trialSubscriptions}</div>
                <div className="text-sm text-gray-400">Trials</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-900/50 rounded-lg">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.expiringSoon}</div>
                <div className="text-sm text-gray-400">Expiring (7d)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Search Panel */}
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-semibold mb-3">Find School</h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchSchools()}
                    placeholder="Search by name or URN..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={searchSchools}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-[500px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <School size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Enter a school name or URN to search</p>
                  <p className="text-xs mt-2">Try "Aurora" or "Rawdon"</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {searchResults.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => loadSchoolDetail(school.id)}
                      className="w-full p-4 text-left hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{school.name}</div>
                          <div className="text-sm text-gray-400">
                            {school.urn && <span className="mr-3">URN: {school.urn}</span>}
                            {school.memberCount > 0 && <span className="mr-3">{school.memberCount} users</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {school.subscription && (
                            <StatusBadge status={school.subscription.status} />
                          )}
                          <ChevronRight size={18} className="text-gray-500" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* School Detail Panel */}
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            {selectedSchool ? (
              <>
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{selectedSchool.name}</h2>
                      <div className="text-sm text-gray-400 mt-1">
                        {selectedSchool.urn && <span className="mr-3">URN: {selectedSchool.urn}</span>}
                        {selectedSchool.schoolType && <span className="capitalize">{selectedSchool.schoolType}</span>}
                      </div>
                    </div>
                    {selectedSchool.subscription && (
                      <StatusBadge status={selectedSchool.subscription.status} />
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {/* Subscription Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-400">Subscription</h3>
                      {selectedSchool.subscription && (
                        <button
                          onClick={() => updateSubscription(selectedSchool.id, "core", "active")}
                          className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded"
                        >
                          Create Subscription
                        </button>
                      )}
                    </div>
                    {selectedSchool.subscription ? (
                      <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Plan</span>
                          <span className="capitalize">{selectedSchool.subscription.planId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status</span>
                          <StatusBadge status={selectedSchool.subscription.status} />
                        </div>
                        {selectedSchool.subscription.status === "trialing" && selectedSchool.subscription.trialEnd && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Trial Ends</span>
                              <span>{new Date(selectedSchool.subscription.trialEnd).toLocaleDateString()}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-700 flex gap-2">
                              <button
                                onClick={() => extendTrial(7)}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                              >
                                +7 Days
                              </button>
                              <button
                                onClick={() => extendTrial(30)}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                              >
                                +30 Days
                              </button>
                            </div>
                          </>
                        )}
                        {selectedSchool.subscription.periodEnd && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Renews</span>
                            <span>{new Date(selectedSchool.subscription.periodEnd).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">User Limit</span>
                          <span>{selectedSchool.subscription.userLimit || "Unlimited"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Auto-renew</span>
                          <span>{selectedSchool.subscription.autoRenew ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <p className="text-gray-500 mb-3">No subscription found</p>
                        <button
                          onClick={() => updateSubscription(selectedSchool.id, "core", "active")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                        >
                          Create Subscription
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Module Access */}
                  {selectedSchool.subscription && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Module Access</h3>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-2">
                          {allModules.map((module) => {
                            const isEnabled = selectedSchool.subscription?.enabledModules?.includes(module);
                            return (
                              <button
                                key={module}
                                onClick={() => {
                                  const current = selectedSchool.subscription?.enabledModules || [];
                                  const updated = isEnabled
                                    ? current.filter((m) => m !== module)
                                    : [...current, module];
                                  updateModules(updated);
                                }}
                                className={`text-xs px-2 py-2 rounded transition-colors ${
                                  isEnabled
                                    ? "bg-emerald-600 text-white"
                                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                }`}
                              >
                                {isEnabled ? <Plus size={12} className="inline mr-1" /> : <Minus size={12} className="inline mr-1" />}
                                {module.replace("-", " ")}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Members Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Members ({selectedSchool.members.length})
                    </h3>
                    <div className="bg-gray-800 rounded-lg divide-y divide-gray-700 max-h-40 overflow-y-auto">
                      {selectedSchool.members.map((member) => (
                        <div key={member.userId} className="p-3 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{member.displayName}</div>
                            <div className="text-xs text-gray-400">{member.email}</div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-700 rounded capitalize">
                            {member.role}
                          </span>
                        </div>
                      ))}
                      {selectedSchool.members.length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">No members found</div>
                      )}
                    </div>
                  </div>

                  {/* Invoices Section */}
                  {selectedSchool.invoices.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">
                        Recent Invoices
                      </h3>
                      <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
                        {selectedSchool.invoices.map((inv) => (
                          <div key={inv.id} className="p-3 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{inv.invoiceNumber}</div>
                              <div className="text-xs text-gray-400">
                                £{((inv.total || inv.amount) / 100).toFixed(2)}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              inv.status === "paid" ? "bg-emerald-900/50 text-emerald-400" :
                              inv.status === "overdue" ? "bg-red-900/50 text-red-400" :
                              "bg-gray-700 text-gray-400"
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => impersonateSchool(selectedSchool.id, selectedSchool.name)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={14} />
                        View as School
                      </button>
                      <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                        <Settings size={14} />
                        Settings
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-8 text-gray-500">
                <div className="text-center">
                  <School size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Select a school to view details</p>
                  <p className="text-sm mt-2">Try searching for "Aurora" or "Rawdon"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
