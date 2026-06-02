"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle, Loader2, Lock, ShieldAlert } from "lucide-react";
import SchoolgleAnimatedLogo from "@/components/SchoolgleAnimatedLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { getPasswordResetValidationError } from "@/lib/auth/password-reset";

export default function ResetPasswordPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(Boolean(data.session));
      setCheckingSession(false);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = getPasswordResetValidationError(password, confirmPassword);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.updateUser({ password });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message || "Could not update your password. Please try again.");
      return;
    }

    setUpdated(true);
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center animated-mesh p-6 font-sans">
      <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white/85 p-8 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mb-8 flex flex-col items-center text-center">
          <SchoolgleAnimatedLogo size={56} showText={false} />
          <h1 className="mt-5 text-3xl font-black text-slate-900 dark:text-white">
            Choose a new password
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
            Use a password that is at least 8 characters and not shared elsewhere.
          </p>
        </div>

        {checkingSession ? (
          <div className="flex items-center justify-center gap-3 rounded-xl bg-slate-100 px-4 py-6 text-sm font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <Loader2 className="animate-spin" />
            Checking reset link
          </div>
        ) : updated ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Password updated</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                You can now continue into Schoolgle with your new password.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard">Continue to dashboard</Link>
            </Button>
          </div>
        ) : !hasRecoverySession ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Reset link expired</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Please request a new password reset email and use the latest link.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={submitting}
              />
            </div>

            {errorMsg && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {errorMsg}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Updating password
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
