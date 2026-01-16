"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  Sparkles,
  CheckCircle,
  Shield,
  MessageCircle,
  Globe,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";

const TRIAL_FEATURES = [
  {
    icon: MessageCircle,
    title: "Ed - Your AI Assistant",
    description: "Voice-enabled help in any school tool",
  },
  {
    icon: Globe,
    title: "Multi-language Support",
    description: "Ed speaks and understands multiple languages",
  },
  {
    icon: Zap,
    title: "Smart Tool Guidance",
    description: "Get help with SIMS, Arbor, Bromcom & more",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "No data stored, sessions wiped instantly",
  },
];

export default function StartTrialPage() {
  const router = useRouter();
  const { user, organizationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  async function startTrial() {
    if (!organizationId || !user?.id) {
      setError("Please ensure you're logged in and part of an organization");
      return;
    }

    if (!agreed) {
      setError("Please agree to the terms to continue");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          // Trial already used, redirect to upgrade
          router.push("/dashboard/account/upgrade");
          return;
        }
        throw new Error(data.error || "Failed to start trial");
      }

      // Success - redirect to dashboard with Ed ready
      router.push("/dashboard?trial=started");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Start Your 7-Day Free Trial
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Experience Ed - your AI assistant for every school tool
          </p>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            What's included in your trial
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {TRIAL_FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8">
          <div className="flex gap-4">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Your data stays private
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Ed doesn't store or capture any personal data. Everything discussed in a session is 
                instantly wiped from memory. We're GDPR compliant and built for schools.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I agree to the{" "}
              <a href="/terms" className="text-emerald-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-emerald-600 hover:underline">
                Privacy Policy
              </a>
              . I understand the trial is free for 7 days and no payment is required now.
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={startTrial}
          disabled={loading || !agreed}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Starting trial...
            </>
          ) : (
            <>
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          No credit card required. Cancel anytime.
        </p>

        {/* What happens next */}
        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            What happens after the trial?
          </h3>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>We'll remind you 2 days before your trial ends</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Choose to upgrade or let the trial expire - no automatic charges</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Pay by card or request an invoice - whatever works for your school</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

