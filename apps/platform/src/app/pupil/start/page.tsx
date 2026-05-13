"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, QrCode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type PupilPass = {
  pass_codename: string;
  pass_colour: string | null;
  pass_animal: string | null;
  pass_badge: string | null;
  current_class: string | null;
};

export default function PupilStartPage() {
  const params = useSearchParams();
  const token = params.get("t") || "";
  const [pupil, setPupil] = useState<PupilPass | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) {
        setError("This pass is missing its QR code token. Ask your teacher for help.");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/pupil/start?t=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "This pass could not be opened. Ask your teacher for help.");
      } else {
        setPupil(data.pupil);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-emerald-100 p-6 flex items-center justify-center">
      <section className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border p-8 text-center space-y-6">
        {loading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-sky-600" />
            <h1 className="text-2xl font-black">Opening your pass...</h1>
          </>
        ) : error ? (
          <>
            <QrCode className="h-14 w-14 mx-auto text-amber-600" />
            <h1 className="text-2xl font-black">Ask your teacher</h1>
            <p className="text-slate-600">{error}</p>
          </>
        ) : pupil ? (
          <>
            <div className="mx-auto h-24 w-24 rounded-full bg-sky-100 flex items-center justify-center text-5xl">
              {animalEmoji(pupil.pass_animal)}
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-sky-600">Schoolgle Pupil Pass</p>
              <h1 className="text-4xl font-black mt-1">Hi {pupil.pass_codename}</h1>
              <p className="text-slate-500 mt-2">{pupil.current_class || "Ready to learn"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <Sparkles className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold">No activities are open right now.</p>
              <p className="text-sm text-slate-500 mt-1">Your teacher will open Class Builder, an assessment, or a lesson activity when it is time.</p>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              Check again
            </Button>
          </>
        ) : null}
      </section>
    </main>
  );
}

function animalEmoji(animal: string | null) {
  const key = animal?.toLowerCase();
  if (key === "fox") return "🦊";
  if (key === "panda") return "🐼";
  if (key === "owl") return "🦉";
  if (key === "turtle") return "🐢";
  if (key === "bee") return "🐝";
  if (key === "lion") return "🦁";
  if (key === "otter") return "🦦";
  if (key === "robin") return "🐦";
  return "⭐";
}
