"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ArrowRight } from "lucide-react";

const EarlyAccessForm = () => {
  const { track } = useAnalytics();
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          school_name: schoolName,
          role: role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        track("waitlist_signup_success", { email, schoolName, role });
        setEmail("");
        setSchoolName("");
        setRole("");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        track("waitlist_signup_error", { email, error: data.error });
      }
    } catch (err: any) {
      setError(
        "Failed to connect to the server. Please check your internet connection.",
      );
      track("waitlist_signup_failed", { email, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="early-access"
      className="py-24 md:py-32 bg-foreground/[0.03] border-t border-border"
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/20 mb-6">
            Early Access
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-4">
            Join the Early Access Pilot
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            We're working with a small group of UK primary schools, trusts, and
            MATs to shape Schoolgle's development.
          </p>

          <div className="text-muted-foreground mb-10 max-w-2xl mx-auto space-y-4 text-left">
            <div className="p-5 rounded-xl bg-card/50 border border-border">
              <h3 className="text-foreground font-bold mb-1.5 text-sm">
                Who the pilot is for
              </h3>
              <p className="text-sm leading-relaxed">
                Headteachers and School Business Managers who understand the
                challenges of inspection readiness and are willing to provide
                honest feedback.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-card/50 border border-border">
              <h3 className="text-foreground font-bold mb-1.5 text-sm">
                What schools get
              </h3>
              <p className="text-sm leading-relaxed">
                Full access to Schoolgle at no cost during the pilot period,
                including Ed, automatic evidence mapping, SEF generation, action
                planning, and priority support.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-card/50 border border-border">
              <h3 className="text-foreground font-bold mb-1.5 text-sm">
                No risk, no commitment
              </h3>
              <p className="text-sm leading-relaxed">
                Completely free. No payment required, no long-term commitment.
                Your data remains yours and can be exported at any time.
              </p>
            </div>
          </div>

          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="max-w-xl mx-auto space-y-4"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                required
                disabled={loading}
                className="w-full px-6 py-4 rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 text-base font-medium transition-all"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="School / Trust (Optional)"
                  disabled={loading}
                  className="w-full px-5 py-3 rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 text-sm font-medium transition-all"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  className="w-full px-5 py-3 rounded-full border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 appearance-none text-sm font-medium transition-all"
                >
                  <option value="" disabled>
                    Select your role (Optional)
                  </option>
                  <option value="headteacher">Headteacher / Principal</option>
                  <option value="sbm">SBM / Finance Lead</option>
                  <option value="trust-lead">Trust / MAT Lead</option>
                  <option value="governor">Governor / Trustee</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {error && (
                <p className="text-destructive text-sm font-bold">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Request Early Access
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>

              <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-4">
                No spam. Pilot updates only. Built for UK schools & trusts.
              </p>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl p-8 max-w-md mx-auto border border-border"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-foreground font-bold text-lg mb-2">
                You're on the list!
              </h3>
              <p className="text-muted-foreground text-sm">
                Thank you for your interest in Schoolgle. We'll be in touch soon
                with more information about the pilot.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Send another request
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default EarlyAccessForm;
