"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  CheckCircle,
  Crown,
  Building2,
  CreditCard,
  FileText,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  product: string;
  priceMonthly: number;
  priceAnnual: number;
  minPupils: number | null;
  maxPupils: number | null;
  features: Record<string, any>;
}

const FEATURE_LABELS: Record<string, string> = {
  voice: "Voice interaction",
  languages: "Multi-language support",
  tool_help: "Tool guidance",
  school_knowledge: "School knowledge base",
  act_mode: "Task automation",
};

export default function UpgradePage() {
  const router = useRouter();
  const { user, organizationId } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "invoice">("card");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        const response = await fetch("/api/subscription/plans?product=ed_pro");
        const data = await response.json();
        setPlans(data.plans || []);
        const medium = data.plans?.find((p: Plan) => p.id === "ed_pro_medium");
        if (medium) setSelectedPlan(medium.id);
      } catch (err) {
        console.error("Error loading plans:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  async function handleUpgrade() {
    if (!selectedPlan || !organizationId) return;
    setSubmitting(true);
    setError(null);

    try {
      if (paymentMethod === "card") {
        const response = await fetch("/api/subscription/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            planId: selectedPlan,
            successUrl: `${window.location.origin}/dashboard/account?upgraded=true`,
            cancelUrl: `${window.location.origin}/dashboard/account/upgrade`,
          }),
        });
        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else if (data.code === 'STRIPE_NOT_CONFIGURED') {
          // Stripe not set up - suggest invoice instead
          setError("Card payments are not yet available. Please use the invoice option below.");
          setPaymentMethod("invoice");
        } else {
          throw new Error(data.error || "Failed to create checkout session");
        }
      } else {
        const response = await fetch("/api/subscription/invoice-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            userId: user?.id,
            planId: selectedPlan,
          }),
        });
        if (!response.ok) throw new Error("Failed to request invoice");
        router.push("/dashboard/account?invoice=requested");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Upgrade to Ed Pro
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Choose the plan that fits your school
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                  selectedPlan === plan.id
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {plan.id === "ed_pro_medium" && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(plan.features).map(([key, value]) =>
                        value ? (
                          <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded">
                            <CheckCircle size={12} className="text-emerald-500" />
                            {FEATURE_LABELS[key] || key}
                          </span>
                        ) : null
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      £{(plan.priceAnnual / 100).toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-500">/year</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>
              {selectedPlanData ? (
                <>
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <Crown className="text-emerald-600" size={20} />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{selectedPlanData.name}</div>
                      <div className="text-sm text-gray-500">Annual subscription</div>
                    </div>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-600 dark:text-gray-400">Total</span>
                    <span className="text-xl font-bold">£{(selectedPlanData.priceAnnual / 100).toFixed(2)}</span>
                  </div>
                  <div className="mb-6 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Payment method</label>
                    <button onClick={() => setPaymentMethod("card")} className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 ${paymentMethod === "card" ? "border-emerald-500" : "border-gray-200 dark:border-gray-700"}`}>
                      <CreditCard size={20} />
                      <div className="text-left">
                        <div className="font-medium">Pay by card</div>
                        <div className="text-xs text-gray-500">Instant access</div>
                      </div>
                    </button>
                    <button onClick={() => setPaymentMethod("invoice")} className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 ${paymentMethod === "invoice" ? "border-emerald-500" : "border-gray-200 dark:border-gray-700"}`}>
                      <FileText size={20} />
                      <div className="text-left">
                        <div className="font-medium">Invoice / Bank Transfer</div>
                        <div className="text-xs text-gray-500">Access after payment</div>
                      </div>
                    </button>
                  </div>
                  {error && <div className="mb-4 p-3 bg-red-50 rounded-lg text-red-700 text-sm">{error}</div>}
                  <button onClick={handleUpgrade} disabled={submitting} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-300 text-white rounded-lg font-semibold flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight size={18} />}
                    {paymentMethod === "card" ? "Continue to payment" : "Request invoice"}
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Select a plan</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-4">
          <Building2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Part of a Multi-Academy Trust?</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              We offer 10% discount for trust-wide purchases of £10,000+.{" "}
              <a href="mailto:sales@schoolgle.co.uk" className="underline">Contact us</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

