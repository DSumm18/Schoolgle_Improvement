"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Crown,
  ArrowUpRight,
  FileText,
  Sparkles,
} from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  planId: string;
  planName: string;
  priceAnnual: number;
  features: Record<string, any>;
  trialEnd: string | null;
  periodEnd: string | null;
  autoRenew: boolean;
  paymentMethod: string | null;
  daysRemaining: number | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  issuedDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  paymentReference: string;
  pdfUrl: string | null;
}

export default function AccountPage() {
  const { user, organizationId, organization } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      loadAccountData();
    }
  }, [organizationId]);

  async function loadAccountData() {
    setLoading(true);
    try {
      // Load subscription
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
          subscription_plans (
            name,
            price_annual,
            features
          )
        `)
        .eq("organization_id", organizationId)
        .in("status", ["trialing", "active", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub) {
        const plan = sub.subscription_plans as any;
        const endDate = sub.status === "trialing" ? sub.trial_end : sub.current_period_end;
        let daysRemaining = null;
        if (endDate) {
          const diff = new Date(endDate).getTime() - Date.now();
          daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        setSubscription({
          id: sub.id,
          status: sub.status,
          planId: sub.plan_id,
          planName: plan?.name || "Unknown",
          priceAnnual: plan?.price_annual || 0,
          features: plan?.features || {},
          trialEnd: sub.trial_end,
          periodEnd: sub.current_period_end,
          autoRenew: sub.auto_renew,
          paymentMethod: sub.payment_method,
          daysRemaining,
        });
      }

      // Load invoices
      const { data: invs } = await supabase
        .from("invoices")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(12);

      setInvoices(
        (invs || []).map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          amount: inv.amount,
          status: inv.status,
          issuedDate: inv.issued_date,
          dueDate: inv.due_date,
          paidDate: inv.paid_date,
          paymentReference: inv.payment_reference,
          pdfUrl: inv.pdf_url,
        }))
      );
    } catch (error) {
      console.error("Error loading account data:", error);
    } finally {
      setLoading(false);
    }
  }

  function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { icon: any; text: string; className: string }> = {
      trialing: {
        icon: Clock,
        text: "Trial",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      },
      active: {
        icon: CheckCircle,
        text: "Active",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
      },
      past_due: {
        icon: AlertTriangle,
        text: "Past Due",
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
      },
      paid: {
        icon: CheckCircle,
        text: "Paid",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
      },
      sent: {
        icon: Clock,
        text: "Sent",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      },
      overdue: {
        icon: AlertTriangle,
        text: "Overdue",
        className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      },
    };

    const { icon: Icon, text, className } = config[status] || config.sent;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
        <Icon size={12} />
        {text}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account & Billing</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your subscription and view invoices
        </p>
      </div>

      {/* Subscription Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Plan</h2>
            {subscription && <StatusBadge status={subscription.status} />}
          </div>
        </div>

        {subscription ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="text-amber-500" size={20} />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {subscription.planName}
                  </h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  £{(subscription.priceAnnual / 100).toFixed(0)}/year
                </p>
              </div>

              {subscription.status === "trialing" && subscription.daysRemaining !== null && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {subscription.daysRemaining}
                  </div>
                  <div className="text-sm text-gray-500">days left in trial</div>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {Object.entries(subscription.features).map(([key, value]) => (
                value && (
                  <div key={key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Sparkles size={14} className="text-emerald-500" />
                    <span className="capitalize">{key.replace(/_/g, " ")}</span>
                  </div>
                )
              ))}
            </div>

            {/* Renewal Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.status === "trialing" ? "Trial ends" : "Renews on"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {subscription.status === "trialing" && subscription.trialEnd
                      ? new Date(subscription.trialEnd).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : subscription.periodEnd
                      ? new Date(subscription.periodEnd).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Not set"}
                  </div>
                </div>
              </div>

              {subscription.status === "trialing" ? (
                <a
                  href="/dashboard/account/upgrade"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  Upgrade Now
                  <ArrowUpRight size={14} />
                </a>
              ) : (
                <span className="text-sm text-gray-500">
                  {subscription.autoRenew ? "Auto-renew enabled" : "Auto-renew disabled"}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Active Subscription
            </h3>
            <p className="text-gray-500 mb-4">
              Start your free trial to access Ed and all premium features.
            </p>
            <a
              href="/dashboard/account/trial"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
            >
              Start Free Trial
              <ArrowUpRight size={16} />
            </a>
          </div>
        )}
      </div>

      {/* Payment Method */}
      {subscription && subscription.status !== "trialing" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Method</h2>
          </div>
          <div className="p-6">
            {subscription.paymentMethod ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {subscription.paymentMethod.replace("_", " ")}
                    </div>
                    <div className="text-sm text-gray-500">
                      {subscription.paymentMethod === "card" && "•••• •••• •••• ••••"}
                      {subscription.paymentMethod === "direct_debit" && "Direct Debit active"}
                      {subscription.paymentMethod === "invoice" && "Pay by invoice"}
                    </div>
                  </div>
                </div>
                <button className="text-sm text-emerald-600 hover:text-emerald-500 font-medium">
                  Update
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">No payment method on file</p>
                <button className="text-emerald-600 hover:text-emerald-500 font-medium text-sm">
                  Add payment method
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoices</h2>
        </div>

        {invoices.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <FileText size={18} className="text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.issuedDate
                        ? new Date(invoice.issuedDate).toLocaleDateString("en-GB")
                        : "Draft"}
                      {" · "}
                      £{(invoice.amount / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={invoice.status} />
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Download size={18} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p>No invoices yet</p>
          </div>
        )}

        {/* Bank Transfer Info */}
        {subscription && subscription.paymentMethod === "invoice" && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-900">
            <div className="text-sm">
              <div className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                Paying by bank transfer?
              </div>
              <div className="text-blue-700 dark:text-blue-400">
                Use your invoice's payment reference (e.g., SCH-XXXXXX) when making the transfer so we can match your payment.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

