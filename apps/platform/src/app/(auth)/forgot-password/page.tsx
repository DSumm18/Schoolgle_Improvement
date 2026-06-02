"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import SchoolgleAnimatedLogo from "@/components/SchoolgleAnimatedLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { normalizePasswordResetEmail } from "@/lib/auth/password-reset";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = normalizePasswordResetEmail(email);
    if (!normalizedEmail) {
      setErrorMsg("Enter your email address.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message || "Could not send a reset email. Please try again.");
      return;
    }

    setSentTo(normalizedEmail);
  }

  return (
    <div className="min-h-screen flex items-center justify-center animated-mesh p-6 font-sans">
      <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white/85 p-8 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mb-8 flex flex-col items-center text-center">
          <SchoolgleAnimatedLogo size={56} showText={false} />
          <h1 className="mt-5 text-3xl font-black text-slate-900 dark:text-white">
            Reset your password
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
            Enter your Schoolgle email and we will send a secure reset link.
          </p>
        </div>

        {sentTo ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Mail size={22} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Check your email</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                If an account exists for {sentTo}, the reset link will arrive shortly.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@school.org"
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
                  Sending reset link
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Return to login
        </Link>
      </div>
    </div>
  );
}
