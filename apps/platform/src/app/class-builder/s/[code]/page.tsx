"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, CheckCircle2, Heart, Loader2, RotateCcw, Sparkles, Star, Users, X } from "lucide-react";

type Pupil = {
  id: string;
  first_name: string;
  last_name: string;
};

type Session = {
  id: string;
  title: string;
  status: "draft" | "open" | "closed";
  year_group: string;
  current_class: string | null;
  school_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
};

type DetectedBarcode = { rawValue?: string };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
};

export default function ClassBuilderSurveyPage() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const code = params.code;
  const pupilToken = searchParams.get("t") || "";
  const [session, setSession] = useState<Session | null>(null);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [submittedPupilIds, setSubmittedPupilIds] = useState<string[]>([]);
  const [pupilId, setPupilId] = useState("");
  const [friendshipIds, setFriendshipIds] = useState<string[]>([]);
  const [workWellIds, setWorkWellIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("");
  const [choiceMessage, setChoiceMessage] = useState("");
  const choiceMessageTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      const query = pupilToken ? `?t=${encodeURIComponent(pupilToken)}` : "";
      const res = await fetch(`/api/class-builder/public/${code}${query}`);
      const data = await res.json();
      if (res.ok) {
        setSession(data.session);
        setPupils(data.pupils);
        setSubmittedPupilIds(data.submittedPupilIds ?? []);
        if (data.selectedPupilId) {
          setPupilId(data.selectedPupilId);
        }
      } else {
        setErrors([data.error || "Survey not found"]);
      }
      setLoading(false);
    }
    if (code) load();
  }, [code, pupilToken]);

  useEffect(
    () => () => {
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
      }
      scanStreamRef.current?.getTracks().forEach((track) => track.stop());
      scanStreamRef.current = null;
      if (choiceMessageTimerRef.current) {
        window.clearTimeout(choiceMessageTimerRef.current);
        choiceMessageTimerRef.current = null;
      }
    },
    [],
  );

  const availableChoices = useMemo(
    () => pupils.filter((pupil) => pupil.id !== pupilId),
    [pupils, pupilId],
  );
  const choiceCount = friendshipIds.length + workWellIds.length;
  const selectedPupil = pupils.find((pupil) => pupil.id === pupilId);
  const schoolName = session?.school_name || "Rawdon St Peter's C of E Primary School";
  const surveyLabel = session ? cohortLabel(session.title, session.year_group) : "";

  function showChoiceMessage() {
    setChoiceMessage(choiceCount === 0 ? "Lovely choice!" : "Choice saved!");
    if (choiceMessageTimerRef.current) {
      window.clearTimeout(choiceMessageTimerRef.current);
    }
    choiceMessageTimerRef.current = window.setTimeout(() => {
      setChoiceMessage("");
      choiceMessageTimerRef.current = null;
    }, 1300);
  }

  async function submit() {
    setErrors([]);
    if (!pupilId) {
      setErrors(["Choose your name first."]);
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/class-builder/public/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pupilId, pupilToken, friendshipIds, workWellIds }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setErrors(data.errors || [data.error || "Could not submit"]);
      return;
    }
    setSubmitted(true);
  }

  function resetForNextPupil() {
    window.location.href = `/class-builder/s/${code}`;
  }

  async function startScanner() {
    setErrors([]);
    setScannerMessage("Starting camera...");
    setScannerOpen(true);

    const BarcodeDetector = (
      window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;

    if (!BarcodeDetector) {
      setScannerMessage(
        "This browser cannot scan QR codes inside the page. Use the tablet/phone camera app, or choose the pupil name as backup.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      scanStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      setScannerMessage("Hold the pupil QR code up to the camera.");

      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        const codes = await detector.detect(videoRef.current);
        const rawValue = codes[0]?.rawValue;
        if (!rawValue) return;

        const token = extractPupilToken(rawValue);
        if (!token) {
          setScannerMessage("That QR code is not a Schoolgle pupil pass.");
          return;
        }

        stopScanner();
        window.location.href = `/class-builder/s/${code}?t=${encodeURIComponent(token)}`;
      }, 500);
    } catch {
      setScannerMessage(
        "Camera access was blocked or unavailable. Use the device camera app, or choose the pupil name as backup.",
      );
    }
  }

  function stopScanner() {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    scanStreamRef.current?.getTracks().forEach((track) => track.stop());
    scanStreamRef.current = null;
    setScannerOpen(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-sky-50 p-6">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </main>
    );
  }

  if (!session || errors.includes("Survey not found")) {
    return (
      <Message
        title={errors.includes("Survey not found") ? "Survey not found" : "Survey not available"}
        text={errors[0] || "Please ask your teacher for a new link."}
      />
    );
  }

  if (session.status !== "open") {
    return (
      <Message
        title="This survey is closed"
        text="Your teacher will let you know if it opens again."
      />
    );
  }

  if (submitted) {
    return (
      <SuccessScreen
        schoolName={schoolName}
        logoUrl={session.logo_url}
        pupilName={selectedPupil ? nameOf(selectedPupil) : "pupil"}
        onReset={resetForNextPupil}
      />
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f0f9ff_0%,#fdf4ff_55%,#fff7ed_100%)] p-4 md:p-8">
      <FloatingSparkles />
      <div className="relative z-10 max-w-3xl mx-auto space-y-5">
        <div className="text-center pt-6">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white p-2 shadow-lg shadow-sky-100 rotate-3">
            {session.logo_url ? (
              <img
                src={session.logo_url}
                alt={`${schoolName} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              <Users className="w-8 h-8 text-sky-600" />
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">
            {schoolName} Class Builder
          </h1>
          {surveyLabel && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-black text-sky-700 shadow-sm ring-1 ring-sky-100">
              <Sparkles className="h-4 w-4 text-amber-400" />
              {surveyLabel}
            </div>
          )}
          <p className="text-slate-600 mt-1">
            {selectedPupil
              ? `Hi ${selectedPupil.first_name}. Pick the people who help you feel happy and ready to learn.`
              : "Take turns at the teacher device. Choose your name, make your choices, then press send."}
          </p>
        </div>

        <Card className="border-0 shadow-xl shadow-sky-100/70">
          <CardContent className="p-5 md:p-6 space-y-5">
            {selectedPupil ? (
              <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <div className="flex items-center gap-3">
                  <StepBubble number={1} />
                  <div>
                    <p className="text-base font-black text-slate-900">
                      Pupil pass recognised
                    </p>
                    <p className="text-sm font-semibold text-emerald-700">
                      Hello {nameOf(selectedPupil)} - now choose your people.
                    </p>
                  </div>
                  <CheckCircle2 className="ml-auto h-6 w-6 text-emerald-600" />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
                <label className="flex items-center gap-2 text-base font-bold text-slate-800">
                  <StepBubble number={1} />
                  Choose your name
                </label>
                <p className="mt-1 text-sm text-slate-600">
                  Names are in first-name order. If you have a pupil QR pass, the teacher can scan it instead.
                </p>
                <Select
                  value={pupilId}
                  onValueChange={(value) => {
                    setPupilId(value);
                    setFriendshipIds((ids) => ids.filter((id) => id !== value));
                    setWorkWellIds((ids) => ids.filter((id) => id !== value));
                  }}
                >
                  <SelectTrigger className="mt-2 h-12 bg-white">
                    <SelectValue placeholder="Find your name" />
                  </SelectTrigger>
                  <SelectContent>
                    {pupils.map((pupil) => (
                      <SelectItem key={pupil.id} value={pupil.id}>
                        {nameOf(pupil)}
                        {submittedPupilIds.includes(pupil.id) ? " (already done)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={startScanner}
                  className="mt-3 h-11 w-full rounded-2xl border-sky-200 bg-white text-sm font-black text-sky-700"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Or scan a pupil QR pass
                </Button>
                {scannerOpen && (
                  <div className="mt-3 rounded-2xl border border-sky-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-700">{scannerMessage}</p>
                      <button
                        type="button"
                        onClick={stopScanner}
                        className="rounded-full bg-slate-100 p-2 text-slate-700"
                        aria-label="Close QR scanner"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      className="aspect-video w-full rounded-xl bg-slate-900 object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {choiceMessage && (
              <div className="flex justify-center">
                <div className="inline-flex animate-bounce items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800 shadow-sm ring-1 ring-amber-200">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {choiceMessage}
                </div>
              </div>
            )}

            <ChoiceBlock
              title="Friends"
              helper="Pick up to 3 people you enjoy spending time with."
              step={2}
              icon={<Heart className="w-5 h-5 text-rose-500" />}
              pupils={availableChoices}
              selectedIds={friendshipIds}
              onChange={setFriendshipIds}
              onChoiceMade={showChoiceMessage}
              disabled={!pupilId}
            />

            <ChoiceBlock
              title="People I work well with"
              helper="Pick up to 3 people who help you learn well."
              step={3}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              pupils={availableChoices}
              selectedIds={workWellIds}
              onChange={setWorkWellIds}
              onChoiceMade={showChoiceMessage}
              disabled={!pupilId}
            />

            {errors.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}

            <Button
              className="w-full h-12 text-base rounded-2xl bg-gradient-to-r from-sky-600 to-fuchsia-600 shadow-lg shadow-sky-100 transition hover:scale-[1.01]"
              onClick={submit}
              disabled={submitting || !pupilId}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {choiceCount > 0 ? `Send my ${choiceCount} choice${choiceCount === 1 ? "" : "s"}` : "Send my choices"}
            </Button>
            <p className="text-center text-xs text-slate-500">
              Your teacher sees the answers. Other pupils do not.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function ChoiceBlock({
  title,
  helper,
  step,
  icon,
  pupils,
  selectedIds,
  onChange,
  onChoiceMade,
  disabled,
}: {
  title: string;
  helper: string;
  step: number;
  icon: ReactNode;
  pupils: Pupil[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onChoiceMade: () => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <StepBubble number={step} />
        {icon}
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        {selectedIds.length > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
            {selectedIds.length}/3
          </span>
        )}
      </div>
      <p className="mb-3 text-sm text-slate-500">{helper}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[0, 1, 2].map((index) => (
          <Select
            key={index}
            value={selectedIds[index] || "none"}
            disabled={disabled}
            onValueChange={(value) => {
              const next = [...selectedIds];
              if (value === "none") {
                next.splice(index, 1);
              } else {
                if (next[index] !== value) {
                  onChoiceMade();
                }
                next[index] = value;
              }
              onChange([...new Set(next.filter(Boolean))].slice(0, 3));
            }}
          >
            <SelectTrigger className="h-12 rounded-xl bg-white">
              <SelectValue placeholder={`Choice ${index + 1}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No choice</SelectItem>
              {pupils
                .filter(
                  (pupil) =>
                    pupil.id === selectedIds[index] ||
                    !selectedIds.includes(pupil.id),
                )
                .map((pupil) => (
                  <SelectItem key={pupil.id} value={pupil.id}>
                    {nameOf(pupil)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      {selectedIds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const pupil = pupils.find((item) => item.id === id);
            if (!pupil) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-100"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {nameOf(pupil)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SuccessScreen({
  schoolName,
  logoUrl,
  pupilName,
  onReset,
}: {
  schoolName: string;
  logoUrl?: string | null;
  pupilName: string;
  onReset: () => void;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,#e0f2fe,#fce7f3,#ffedd5)] p-6">
      <FloatingSparkles />
      <Confetti />
      <Card className="relative z-10 max-w-lg w-full border-0 shadow-2xl shadow-sky-100">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 animate-bounce items-center justify-center rounded-[2rem] bg-white p-2 shadow-sm">
            {logoUrl ? (
              <img src={logoUrl} alt={`${schoolName} logo`} className="h-full w-full object-contain" />
            ) : (
              <CheckCircle2 className="w-11 h-11 text-emerald-600" />
            )}
          </div>
          <div className="mx-auto mb-4 w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
            Choices saved
          </div>
          <h1 className="text-3xl font-black text-slate-900">Brilliant, {pupilName}!</h1>
          <p className="mt-2 text-slate-600">
            Thank you. Your choices have been saved for your teacher.
          </p>
          <Button
            type="button"
            onClick={onReset}
            className="mt-6 h-12 w-full rounded-2xl bg-sky-600 text-base font-black shadow-lg shadow-sky-100"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Back to start for the next pupil
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

function Message({
  title,
  text,
  done,
}: {
  title: string;
  text: string;
  done?: boolean;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,#e0f2fe,#fce7f3,#ffedd5)] p-6">
      {done && <Confetti />}
      <Card className="relative z-10 max-w-md w-full border-0 shadow-xl shadow-sky-100">
        <CardContent className="p-8 text-center">
          {done && (
            <div className="mx-auto mb-4 flex h-16 w-16 animate-bounce items-center justify-center rounded-3xl bg-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          )}
          <h1 className="text-2xl font-black text-slate-900">{title}</h1>
          <p className="text-slate-600 mt-2">{text}</p>
        </CardContent>
      </Card>
    </main>
  );
}

function nameOf(pupil: Pupil) {
  return `${pupil.first_name} ${pupil.last_name}`;
}

function cohortLabel(title: string, fallback: string) {
  const [, label] = title.split(" - ");
  return label?.trim() || fallback;
}

function extractPupilToken(value: string) {
  try {
    const url = new URL(value);
    return url.searchParams.get("t");
  } catch {
    const match = value.match(/[?&]t=([^&]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

function StepBubble({ number }: { number: number }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-black text-white shadow-sm">
      {number}
    </span>
  );
}

function FloatingSparkles() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {["top-16 left-[12%]", "top-28 right-[18%]", "bottom-28 left-[20%]", "bottom-20 right-[14%]"].map(
        (position, index) => (
          <Sparkles
            key={position}
            className={`absolute h-6 w-6 animate-pulse text-amber-300 ${position}`}
            style={{ animationDelay: `${index * 350}ms` }}
          />
        ),
      )}
    </div>
  );
}

function Confetti() {
  const pieces = [
    "left-[8%] bg-sky-400",
    "left-[18%] bg-fuchsia-400",
    "left-[28%] bg-amber-400",
    "left-[38%] bg-emerald-400",
    "left-[50%] bg-rose-400",
    "left-[62%] bg-violet-400",
    "left-[74%] bg-cyan-400",
    "left-[86%] bg-orange-400",
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {pieces.map((piece, index) => (
        <span
          key={piece}
          className={`absolute top-[-24px] h-4 w-2 rounded-full ${piece}`}
          style={{
            animation: "classBuilderConfetti 1.8s ease-out infinite",
            animationDelay: `${index * 120}ms`,
            transform: `rotate(${index * 31}deg)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes classBuilderConfetti {
          0% {
            opacity: 0;
            transform: translateY(0) rotate(0deg);
          }
          12% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(110vh) rotate(540deg);
          }
        }
      `}</style>
    </div>
  );
}
