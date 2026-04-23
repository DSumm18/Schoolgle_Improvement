"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  ArrowLeft,
  Building2,
  Users,
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  UserPlus,
  Trash2,
  Edit,
  Save,
  Ban,
  CheckSquare,
  Square
} from "lucide-react";

interface SubscriptionDetail {
  id: string;
  plan: string;
  status: string;
  final_price_annual: number;
  current_period_end: string;
  enabled_modules: string[];
  user_limit: number;
  storage_limit_gb: number;
  auto_renew: boolean;
  payment_method: string;
}

interface OrganizationDetail {
  id: string;
  name: string;
  urn: string | null;
  local_authority: string | null;
  school_type: string | null;
  created_at: string;
}

interface Member {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  amount_due: number;
  invoice_date: string;
  due_date: string;
}

const ALL_MODULES = [
  { id: "ofsted-readiness", name: "Ofsted Readiness", category: "Compliance" },
  { id: "estates-compliance", name: "Estates Compliance", category: "Operations" },
  { id: "hr-people", name: "HR & People", category: "Operations" },
  { id: "governance", name: "Governance", category: "Leadership" },
  { id: "actions-hub", name: "Actions Hub", category: "Improvement" },
  { id: "intelligence", name: "School Intelligence", category: "Data" },
  { id: "safeguarding", name: "Safeguarding", category: "Compliance" },
  { id: "attendance", name: "Attendance", category: "Operations" },
  { id: "behaviour", name: "Behaviour", category: "Operations" },
  { id: "communications", name: "Communications", category: "Engagement" },
  { id: "calendar", name: "Calendar", category: "Operations" },
  { id: "surveys", name: "Surveys", category: "Engagement" },
  { id: "admissions", name: "Admissions", category: "Operations" },
  { id: "school-meals", name: "School Meals", category: "Operations" },
  { id: "cover", name: "Cover Management", category: "Operations" },
  { id: "canvas", name: "Canvas Data", category: "Data" },
  { id: "ed-chat", name: "Ed AI Chat", category: "AI" },
  { id: "ed-voice", name: "Ed Voice", category: "AI" },
  { id: "ed-embed", name: "Ed Website Chat", category: "AI" },
  { id: "form-helper", name: "Form Helper", category: "AI" },
];

const PLAN_MODULES = {
  core: ["ofsted-readiness", "estates-compliance", "hr-people", "governance", "actions-hub"],
  professional: ["ofsted-readiness", "estates-compliance", "hr-people", "governance", "actions-hub", "intelligence", "safeguarding", "attendance", "behaviour"],
  enterprise: ["ofsted-readiness", "estates-compliance", "hr-people", "governance", "actions-hub", "intelligence", "safeguarding", "attendance", "behaviour", "communications", "calendar", "surveys", "admissions", "school-meals", "cover", "canvas"],
  ed_in_school: ["ed-chat", "ed-voice", "form-helper"],
  ed_website: ["ed-embed"],
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const organizationId = params.id as string;

  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "modules" | "invoices">("overview");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", displayName: "", role: "member", password: "" });

  // Check super admin and load data
  useEffect(() => {
    async function checkAndLoad() {
      if (!user?.id) return;

      try {
        const res = await fetch("/api/admin/subscriptions");
        if (!res.ok) {
          setIsSuperAdmin(false);
          return;
        }
        setIsSuperAdmin(true);
        await loadData();
      } catch (error) {
        console.error("Error:", error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    if (user) checkAndLoad();
  }, [user, organizationId]);

  async function loadData() {
    try {
      // Load subscription
      const subRes = await fetch(`/api/admin/subscriptions?organizationId=${organizationId}`);
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.data?.[0]) {
          setSubscription(subData.data[0]);
        }
      }

      // Load organization details
      const orgRes = await fetch(`/api/organization/${organizationId}`);
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrganization(orgData.data);
      }

      // Load members
      const memberRes = await fetch(`/api/admin/provision-users?organizationId=${organizationId}`);
      if (memberRes.ok) {
        const memberData = await memberRes.json();
        setMembers(memberData.users || []);
      }

      // Load invoices
      const invRes = await fetch(`/api/admin/invoices?organizationId=${organizationId}`);
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/provision-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          users: [newUser],
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setShowAddUser(false);
        setNewUser({ email: "", displayName: "", role: "member", password: "" });
        await loadData();
      }
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveUser(userId: string) {
    if (!confirm("Are you sure you want to remove this user?")) return;

    try {
      const res = await fetch("/api/admin/provision-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, userId }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error("Error removing user:", error);
    }
  }

  async function handleToggleModule(moduleId: string) {
    if (!subscription) return;

    const enabled = subscription.enabled_modules || [];
    const newModules = enabled.includes(moduleId)
      ? enabled.filter((m) => m !== moduleId)
      : [...enabled, moduleId];

    try {
      const res = await fetch("/api/admin/subscription-modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          action: "update_modules",
          modules: newModules,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubscription((prev) => ({ ...prev!, enabled_modules: newModules }));
      }
    } catch (error) {
      console.error("Error updating modules:", error);
    }
  }

  async function handleUpdateSubscription(action: string, value: any) {
    if (!subscription) return;

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          action,
          ...value,
        }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
    }
  }

  async function handleInvoiceAction(invoiceId: string, action: string) {
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, action }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  }

  if (loading || isSuperAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isSuperAdmin || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <button onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-gray-900 text-white rounded-lg">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const modulesByCategory = ALL_MODULES.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, typeof ALL_MODULES>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-sm text-gray-500">
                {organization.urn && `URN: ${organization.urn} • `}
                {organization.school_type && `${organization.school_type}`}
              </p>
            </div>
          </div>
          <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex gap-6">
          {[
            { id: "overview", label: "Overview", icon: Building2 },
            { id: "users", label: "Users", icon: Users },
            { id: "modules", label: "Modules", icon: CheckSquare },
            { id: "invoices", label: "Invoices", icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
          ))}
        </nav>
      </div>

      <main className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Overview Tab */}
        {activeTab === "overview" && subscription && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-sm text-gray-500 mb-1">Plan</h3>
                <p className="text-2xl font-bold text-gray-900 capitalize">{subscription.plan}</p>
                <p className="text-sm text-gray-600">
                  £{(subscription.final_price_annual / 100).toLocaleString()}/year
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-sm text-gray-500 mb-1">Status</h3>
                <p className={`text-2xl font-bold capitalize ${
                  subscription.status === "active" ? "text-green-600" :
                  subscription.status === "past_due" ? "text-red-600" :
                  "text-gray-600"
                }`}>
                  {subscription.status.replace("_", " ")}
                </p>
                <p className="text-sm text-gray-600">
                  Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-sm text-gray-500 mb-1">Users</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {members.length} / {subscription.user_limit}
                </p>
                <p className="text-sm text-gray-600">
                  {subscription.user_limit - members.length} slots available
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Subscription Actions</h2>
              <div className="flex flex-wrap gap-3">
                {subscription.status === "active" && (
                  <button
                    onClick={() => handleUpdateSubscription("cancel", { reason: "Admin cancelled" })}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
                  >
                    <Ban size={16} /> Cancel Subscription
                  </button>
                )}
                {subscription.status === "cancelled" && (
                  <button
                    onClick={() => handleUpdateSubscription("reactivate", {})}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Reactivate
                  </button>
                )}
                {subscription.status === "past_due" && (
                  <button
                    onClick={() => handleUpdateSubscription("mark_active", {})}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Mark Paid
                  </button>
                )}
                <button
                  onClick={() => router.push(`/admin/invoices/new?organizationId=${organizationId}`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <CreditCard size={16} /> Create Invoice
                </button>
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === "users" && subscription && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Team Members ({members.length} / {subscription.user_limit})
                </h2>
                <p className="text-sm text-gray-500">
                  {subscription.user_limit - members.length} slots remaining
                </p>
              </div>
              <button
                onClick={() => setShowAddUser(true)}
                disabled={members.length >= subscription.user_limit}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
              >
                <UserPlus size={16} /> Add User
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              {members.map((member) => (
                <div key={member.user_id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {member.display_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.display_name || "Unknown"}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                      {member.role}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(member.user_id)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {members.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No users yet. Add your first team member.
                </div>
              )}
            </div>

            {showAddUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-4">Add New User</h3>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={newUser.displayName}
                        onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddUser(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                      >
                        {saving ? "Adding..." : "Add User"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modules Tab */}
        {activeTab === "modules" && subscription && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Module Access</h2>
                <p className="text-sm text-gray-500">
                  {subscription.enabled_modules?.length || 0} of {ALL_MODULES.length} modules enabled
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const planModules = PLAN_MODULES[subscription.plan as keyof typeof PLAN_MODULES] || [];
                    handleToggleModule(""); // Will be handled below
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  Reset to {subscription.plan} defaults
                </button>
                <button
                  onClick={() => handleUpdateSubscription("block_access", {})}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Block All Access
                </button>
              </div>
            </div>

            {Object.entries(modulesByCategory).map(([category, mods]) => (
              <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700">{category}</h3>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {mods.map((module) => {
                    const isEnabled = subscription.enabled_modules?.includes(module.id);
                    return (
                      <button
                        key={module.id}
                        onClick={() => handleToggleModule(module.id)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          isEnabled
                            ? "border-green-300 bg-green-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-sm font-medium ${
                            isEnabled ? "text-green-800" : "text-gray-700"
                          }`}>
                            {module.name}
                          </span>
                          {isEnabled ? (
                            <CheckSquare size={16} className="text-green-600" />
                          ) : (
                            <Square size={16} className="text-gray-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
              <button
                onClick={() => router.push(`/admin/invoices/new?organizationId=${organizationId}`)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
              >
                <CreditCard size={16} /> Create Invoice
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-500">
                      Due: {invoice.due_date} • £{invoice.amount_due.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      invoice.status === "paid" ? "bg-green-100 text-green-700" :
                      invoice.status === "overdue" ? "bg-red-100 text-red-700" :
                      invoice.status === "sent" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {invoice.status}
                    </span>
                    {invoice.status === "sent" && (
                      <button
                        onClick={() => handleInvoiceAction(invoice.id, "send_reminder")}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Send reminder"
                      >
                        <Mail size={16} className="text-gray-500" />
                      </button>
                    )}
                    {invoice.status === "sent" && (
                      <button
                        onClick={() => handleInvoiceAction(invoice.id, "mark_paid")}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Mark as paid"
                      >
                        <CheckCircle size={16} className="text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No invoices yet
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
