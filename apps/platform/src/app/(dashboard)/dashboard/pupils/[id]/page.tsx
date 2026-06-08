"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  GraduationCap,
  Heart,
  Loader2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type ProfileResponse = {
  pupil: {
    id: string;
    pupil_id: string;
    source_pupil_ref?: string | null;
    display_name: string;
    year_group?: string | null;
    current_class?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    send_status?: string | null;
    ehcp?: boolean | null;
    primary_need?: string | null;
    fsm_eligible?: boolean | null;
    pupil_premium?: boolean | null;
    eal?: boolean | null;
    is_active?: boolean | null;
    source?: {
      import_source?: string | null;
      imported_at?: string | null;
      pupil_record_status?: string | null;
      archive_candidate?: boolean | null;
    };
  };
  cards: Array<{
    id: string;
    title: string;
    status: string;
    metric?: string;
    description: string;
    href?: string;
  }>;
  modules: {
    send?: {
      register?: {
        id: string;
        sen_status?: string | null;
        primary_need?: string | null;
        secondary_need?: string | null;
        has_ehcp?: boolean | null;
        ehcp_annual_review_due?: string | null;
        date_identified?: string | null;
      } | null;
      active_provisions: number;
      open_actions: number;
    };
    assessment_work?: {
      evidence_items: number;
      status: string;
    };
  };
  data_inventory: Array<{
    moduleId: string;
    label: string;
    sensitivity: string;
    retentionOwner: string;
    includedInDsarExport: boolean;
  }>;
};

export default function PupilProfilePage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      const headers: HeadersInit = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const res = await fetch(`/api/pupils/${params.id}/profile`, { headers });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || "Could not load pupil profile");
        setLoading(false);
        return;
      }
      setProfile(data);
      setLoading(false);
    }

    loadProfile().catch((err) => {
      if (!cancelled) {
        setError(err.message || "Could not load pupil profile");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [params.id, session?.access_token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Link href="/dashboard/settings/data-upload" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to data upload
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p className="font-semibold">Pupil profile could not be loaded</p>
          <p className="mt-1 text-sm">{error || "The pupil record was not found."}</p>
        </div>
      </div>
    );
  }

  const sendRegister = profile.modules.send?.register;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/settings/data-upload" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to data upload
        </Link>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          Pupil profile spine
        </span>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <UserRound className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-950">{profile.pupil.display_name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {profile.pupil.current_class || "Class not set"} · {profile.pupil.year_group ? `Year ${profile.pupil.year_group}` : "Year not set"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.pupil.send_status && <Badge>SEND {profile.pupil.send_status}</Badge>}
                {profile.pupil.ehcp && <Badge>EHCP</Badge>}
                {profile.pupil.pupil_premium && <Badge>PP</Badge>}
                {profile.pupil.eal && <Badge>EAL</Badge>}
                {profile.pupil.source?.archive_candidate && <Badge tone="amber">Archive review</Badge>}
              </div>
            </div>
          </div>
          <div className="grid min-w-72 gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
            <Field label="Schoolgle ID" value={profile.pupil.pupil_id} />
            <Field label="Source ref" value={profile.pupil.source_pupil_ref || "Not supplied"} />
            <Field label="DOB" value={profile.pupil.date_of_birth || "Not supplied"} />
            <Field label="Last imported" value={formatDate(profile.pupil.source?.imported_at)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {profile.cards.map((card) => (
          <Link
            key={card.id}
            href={card.href || "#"}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <ModuleIcon id={card.id} />
              {card.metric && <span className="text-2xl font-black text-slate-900">{card.metric}</span>}
            </div>
            <h2 className="font-bold text-slate-950">{card.title}</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-sky-600">{card.status}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <Heart className="h-5 w-5 text-violet-600" />
            SEND connection
          </h2>
          {sendRegister ? (
            <div className="mt-4 grid gap-3 text-sm">
              <Field label="Status" value={sendRegister.sen_status || "Not set"} />
              <Field label="Primary need" value={sendRegister.primary_need || "Not set"} />
              <Field label="Secondary need" value={sendRegister.secondary_need || "None recorded"} />
              <Field label="Identified" value={formatDate(sendRegister.date_identified)} />
              <Field label="Annual review due" value={formatDate(sendRegister.ehcp_annual_review_due)} />
              <Field label="Active provisions" value={String(profile.modules.send?.active_provisions ?? 0)} />
              <Field label="Open SEND actions" value={String(profile.modules.send?.open_actions ?? 0)} />
              <Link href={`/dashboard/send?pupil=${sendRegister.id}`} className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                Open in SEND
                <BookOpen className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">No linked SEND register record yet</p>
              <p className="mt-1">If this child appears in the SEND import, the SEND module should link back to this profile using the Schoolgle pupil spine.</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            GDPR data inventory
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This is the control list for DSAR export, archive, anonymise and delete tooling. App records stay in their own tables, but the spine knows where to look.
          </p>
          <div className="mt-4 space-y-3">
            {profile.data_inventory.map((item) => (
              <div key={item.moduleId} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.moduleId} · retention: {item.retentionOwner}</p>
                  </div>
                  <SensitivityBadge sensitivity={item.sensitivity} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "amber" }) {
  const className = tone === "amber"
    ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800"
    : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700";
  return <span className={className}>{children}</span>;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value || "Not set"}</span>
    </div>
  );
}

function ModuleIcon({ id }: { id: string }) {
  const className = "h-5 w-5";
  const wrapper = "flex h-10 w-10 items-center justify-center rounded-xl";
  if (id === "send") return <span className={`${wrapper} bg-violet-100 text-violet-700`}><Heart className={className} /></span>;
  if (id === "assessment-work") return <span className={`${wrapper} bg-blue-100 text-blue-700`}><GraduationCap className={className} /></span>;
  if (id === "gdpr") return <span className={`${wrapper} bg-emerald-100 text-emerald-700`}><Database className={className} /></span>;
  return <span className={`${wrapper} bg-sky-100 text-sky-700`}><FileText className={className} /></span>;
}

function SensitivityBadge({ sensitivity }: { sensitivity: string }) {
  if (sensitivity === "highly_restricted") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700"><AlertTriangle className="h-3 w-3" />Restricted</span>;
  }
  if (sensitivity === "special_category") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700"><ShieldCheck className="h-3 w-3" />Special</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" />Standard</span>;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
