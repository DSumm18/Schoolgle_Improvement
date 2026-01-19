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
    planName: string;
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
    planName: string;
    trialEnd: string | null;
    periodEnd: string | null;
    autoRenew: boolean;
    paymentMethod: string | null;
  } | null;
  invoices: {
    id: string;
    invoiceNumber: string;
    amount: number;
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
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    expiringSoon: 0,
  });

  // Check if user is super admin
  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("super_admins")
        .select("access_level")
        .eq("user_id", user.id)
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
      // Search by name or URN
      let query = supabase
        .from("organizations")
        .select(`
          id,
          name,
          urn,
          local_authority,
          school_type,
          organization_members(count),
          subscriptions(
            status,
            trial_end,
            current_period_end,
            subscription_plans(name)
          )
        `)
        .limit(20);

      // Check if query looks like a URN (numeric)
      if (/^\d+$/.test(searchQuery.trim())) {
        query = query.eq("urn", searchQuery.trim());
      } else {
        query = query.ilike("name", `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Search error:", error);
        return;
      }

      const results: SchoolSearchResult[] = (data || []).map((org: any) => {
        const sub = org.subscriptions?.[0];
        const plan = sub?.subscription_plans;
        
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
          memberCount: org.organization_members?.[0]?.count || 0,
          subscription: sub ? {
            status: sub.status,
            planName: plan?.name || "Unknown",
            daysRemaining,
          } : null,
        };
      });

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
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
        return;
      }

      // Get members
      const { data: members } = await supabase
        .from("organization_members")
        .select(`
          user_id,
          role,
          created_at,
          users(email, display_name)
        `)
        .eq("organization_id", schoolId);

      // Get subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select(`
          id,
          status,
          plan_id,
          trial_end,
          current_period_end,
          auto_renew,
          payment_method,
          subscription_plans(name)
        `)
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
        members: (members || []).map((m: any) => ({
          userId: m.user_id,
          email: m.users?.email || "Unknown",
          displayName: m.users?.display_name || "Unknown",
          role: m.role,
          createdAt: m.created_at,
        })),
        subscription: sub ? {
          id: sub.id,
          status: sub.status,
          planId: sub.plan_id,
          planName: (sub.subscription_plans as any)?.name || "Unknown",
          trialEnd: sub.trial_end,
          periodEnd: sub.current_period_end,
          autoRenew: sub.auto_renew,
          paymentMethod: sub.payment_method,
        } : null,
        invoices: (invoices || []).map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          amount: inv.amount,
          status: inv.status,
          issuedDate: inv.issued_date,
          dueDate: inv.due_date,
          paidDate: inv.paid_date,
        })),
      });
    } catch (error) {
      console.error("Error loading school detail:", error);
    } finally {
      setLoading(false);
    }
  }

  // Extend trial
  async function extendTrial(subscriptionId: string, days: number) {
    try {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("trial_end")
        .eq("id", subscriptionId)
        .single();

      if (!sub) return;

      const currentEnd = new Date(sub.trial_end);
      currentEnd.setDate(currentEnd.getDate() + days);

      await supabase
        .from("subscriptions")
        .update({ trial_end: currentEnd.toISOString() })
        .eq("id", subscriptionId);

      // Reload school detail
      if (selectedSchool) {
        loadSchoolDetail(selectedSchool.id);
      }
    } catch (error) {
      console.error("Error extending trial:", error);
    }
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
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
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <Building2 size={20} className="text-gray-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalSchools}</div>
                <div className="text-sm text-gray-400">Total Schools</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-900/50 rounded-lg">
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                <div className="text-sm text-gray-400">Active Subscriptions</div>
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
                <div className="text-sm text-gray-400">Active Trials</div>
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
                <div className="text-sm text-gray-400">Expiring (7 days)</div>
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
                    placeholder="Search by school name or URN..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={searchSchools}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-[500px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <School size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Enter a school name or URN to search</p>
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
                            {school.localAuthority && <span>{school.localAuthority}</span>}
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

                <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto">
                  {/* Subscription Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Subscription</h3>
                    {selectedSchool.subscription ? (
                      <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Plan</span>
                          <span>{selectedSchool.subscription.planName}</span>
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
                            <div className="pt-2 border-t border-gray-700">
                              <button
                                onClick={() => extendTrial(selectedSchool.subscription!.id, 7)}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                              >
                                Extend Trial (+7 days)
                              </button>
                            </div>
                          </>
                        )}
                        {selectedSchool.subscription.periodEnd && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Period Ends</span>
                            <span>{new Date(selectedSchool.subscription.periodEnd).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Auto-renew</span>
                          <span>{selectedSchool.subscription.autoRenew ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800 rounded-lg p-3 text-center text-gray-500">
                        No subscription
                      </div>
                    )}
                  </div>

                  {/* Members Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Members ({selectedSchool.members.length})
                    </h3>
                    <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
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
                                £{(inv.amount / 100).toFixed(2)}
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
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                        <Eye size={14} />
                        View as Admin
                      </button>
                      <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                        <Mail size={14} />
                        Send Email
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
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

