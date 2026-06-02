"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import LoginButton from "@/components/LoginButton";
import MicrosoftLoginButton from "@/components/MicrosoftLoginButton";
import SchoolgleAnimatedLogo from "@/components/SchoolgleAnimatedLogo";
import { Sparkles, ShieldCheck, Brain, Rocket, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loading, session, signInWithEmail } = useAuth();
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Enter email and password");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithEmail(email, password);
      router.push(nextPath);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedNext = params.get("next");
    if (requestedNext?.startsWith("/")) {
      setNextPath(requestedNext);
    }
  }, []);

  useEffect(() => {
    if (!loading && (user || session)) {
      router.push(nextPath);
    }
  }, [user, session, loading, router, nextPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-mesh">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center animated-mesh p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 glass-card rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Left Side: Branding & Features */}
        <div className="p-12 bg-slate-900 dark:bg-black/40 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Rocket size={300} strokeWidth={0.5} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <SchoolgleAnimatedLogo size={48} showText={false} />
              <span className="text-2xl font-black tracking-tight font-display">
                Schoolgle
              </span>
            </div>

            <h1 className="text-4xl font-black leading-tight mb-6 font-display">
              Empowering Schools with{" "}
              <span className="text-blue-400">AI-Driven</span> Intelligence.
            </h1>

            <div className="space-y-6">
              <FeatureItem
                icon={<ShieldCheck className="text-emerald-400" />}
                title="Always-On Readiness"
                description="Automated Ofsted and SIAMS evidence mapping."
              />
              <FeatureItem
                icon={<Brain className="text-purple-400" />}
                title="Strategic Analysis"
                description="Real-time intervention modeling and risk assessment."
              />
            </div>
          </div>

          <div className="mt-12 text-slate-400 text-sm font-medium">
            © 2025 Schoolgle. Educational Excellence, Automated.
          </div>
        </div>

        {/* Right Side: Login Actions */}
        <div className="p-12 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md flex flex-col justify-center items-center text-center space-y-10">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20"
            >
              <Sparkles size={12} />
              Secured for Educators
            </motion.div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display">
              {nextPath.includes("deal-finder") ? "Open Deal Finder" : "Welcome Back"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
              {nextPath.includes("deal-finder")
                ? "Sign in to use the free procurement comparison tool."
                : "Sign in to access your school's improvement intelligence engine."}
            </p>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-3">
              <LoginButton />
              <MicrosoftLoginButton />
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase">
                <span className="bg-transparent px-4 text-slate-400 tracking-widest leading-none">
                  Or sign in with email
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-3 text-left">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.org"
                  className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgotten password?
                </Link>
              </div>
              {errorMsg && (
                <p className="text-xs text-red-500 font-medium" role="alert">
                  {errorMsg}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>Sign in</>
                )}
              </button>
            </form>

            <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
              By continuing, you agree to our Terms of Service <br /> and
              Privacy Policy specific to DfE guidelines.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const FeatureItem = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex gap-4">
    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg shrink-0">
      {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 24 })}
    </div>
    <div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);
