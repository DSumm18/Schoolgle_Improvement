import {
  CheckCircle2,
  Heart,
  QrCode,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

type DemoPupil = {
  name: string;
  className: string;
  gender: "F" | "M";
  tags?: string[];
  pass: string;
  reason: string;
};

const pupils: DemoPupil[] = [
  { name: "Ava Patel", className: "Class 1", gender: "F", tags: ["EAL"], pass: "Blue Fox", reason: "Placed with a strong work-well link and one familiar peer." },
  { name: "Leo Brown", className: "Class 1", gender: "M", tags: ["SEND"], pass: "Green Panda", reason: "Balanced with calm peers and visible support needs." },
  { name: "Mia Clarke", className: "Class 1", gender: "F", pass: "Pink Owl", reason: "Mutual friendship retained without overloading the table." },
  { name: "Noah Evans", className: "Class 1", gender: "M", tags: ["PP"], pass: "Red Lion", reason: "Kept with a positive work partner." },
  { name: "Isla Khan", className: "Class 1", gender: "F", pass: "Purple Bee", reason: "Supports gender balance and table mix." },
  { name: "Oscar Green", className: "Class 1", gender: "M", tags: ["EAL"], pass: "Yellow Turtle", reason: "Placed near a supportive language peer." },
  { name: "Ruby Hall", className: "Class 2", gender: "F", tags: ["SEND", "EHCP"], pass: "Teal Robin", reason: "Flagged for staff review before final seating." },
  { name: "Sam Wilson", className: "Class 2", gender: "M", pass: "Orange Fox", reason: "Popular pupil spread away from other high-demand pupils." },
  { name: "Grace Ali", className: "Class 2", gender: "F", tags: ["PP"], pass: "Blue Otter", reason: "Work-well link retained with balanced support at table." },
  { name: "Theo Young", className: "Class 2", gender: "M", pass: "Red Owl", reason: "Placed with two positive learning choices." },
  { name: "Lily Morris", className: "Class 2", gender: "F", tags: ["EAL"], pass: "Pink Panda", reason: "EAL tag visible for teacher review." },
  { name: "Ben Murphy", className: "Class 2", gender: "M", tags: ["SEND"], pass: "Green Lion", reason: "Balanced SEND spread across the draft classes." },
];

const tables = [
  { label: "Table 1", x: "7%", y: "18%", pupils: pupils.slice(0, 4) },
  { label: "Table 2", x: "39%", y: "18%", pupils: pupils.slice(4, 6) },
  { label: "Table 3", x: "7%", y: "55%", pupils: pupils.slice(6, 10) },
  { label: "Table 4", x: "48%", y: "55%", pupils: pupils.slice(10, 12) },
];

export default function AuroraClassBuilderDemoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f8fafc_0%,#fdf4ff_55%,#ecfeff_100%)] p-8 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border bg-white/85 p-6 shadow-xl shadow-sky-100 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white p-2 shadow-lg ring-1 ring-sky-100">
              <Image
                src="/aurora-logo.svg"
                alt="Aurora Primary School logo"
                width={72}
                height={72}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-600">
                Schoolgle Mini App
              </p>
              <h1 className="text-4xl font-black tracking-tight">Aurora Primary School Class Builder</h1>
              <p className="mt-1 text-slate-600">
                Demo version showing mixed-year surveys, explainable draft classes and seating-plan options.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat value="42" label="Pupils" />
            <Stat value="42" label="Submitted" />
            <Stat value="3" label="Draft classes" />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.4fr]">
          <div className="space-y-6">
            <Card title="Child-friendly survey">
              <div className="rounded-3xl bg-sky-50 p-5 ring-1 ring-sky-100">
                <div className="mb-4 flex items-center gap-3">
                  <Step number="1" />
                  <div>
                    <p className="font-black">Choose your name</p>
                    <p className="text-sm text-slate-600">Names are sorted by first name.</p>
                  </div>
                </div>
                <div className="rounded-2xl border bg-white px-4 py-3 font-semibold text-slate-700">
                  Ava Patel
                </div>
                <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-black text-sky-700">
                  <QrCode className="h-4 w-4" />
                  Or scan a pupil QR pass
                </button>
              </div>
              <ChoiceBlock title="Friends" icon={<Heart className="h-5 w-5 text-rose-500" />} choices={["Mia Clarke", "Leo Brown", "Noah Evans"]} />
              <ChoiceBlock title="People I work well with" icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} choices={["Oscar Green", "Isla Khan", "Grace Ali"]} />
              <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-fuchsia-600 px-4 py-3 text-center font-black text-white shadow-lg">
                Send my choices
              </div>
            </Card>

            <Card title="Explainable grouping">
              <div className="grid gap-3 text-sm">
                <Insight title="Mutual friendships kept" text="Ava + Mia, Grace + Theo, Leo + Oscar" />
                <Insight title="High-demand pupils spread" text="Popular pupils are balanced across draft classes." />
                <Insight title="Inclusion checks visible" text="SEND, EHCP, EAL and PP tags stay visible for teacher review." />
              </div>
            </Card>
          </div>

          <Card title="Inclusive seating planner preview" wide>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <Principle title="Balance" text="Spreads SEND/EHCP/EAL/PP and gender across classes." />
              <Principle title="Relationships" text="Uses friendship and work-well links as an evidence point." />
              <Principle title="Teacher control" text="Staff can drag tables, swap pupils and lock the final plan." />
            </div>

            <div className="rounded-[1.75rem] border bg-gradient-to-b from-slate-50 to-white p-4">
              <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.25em] text-white">
                Whiteboard / front of classroom
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {["SEND", "EHCP", "EAL", "PP", "F/M", "High demand"].map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
              <div
                className="relative mt-4 min-h-[690px] overflow-hidden rounded-[1.5rem] border-2 border-slate-300 bg-white shadow-inner"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              >
                <div className="absolute left-1/2 top-4 w-[72%] -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.25em] text-white">
                  Whiteboard / front
                </div>
                <div className="absolute right-5 top-16 rounded-xl border bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
                  Teacher desk
                </div>
                <div className="absolute bottom-0 left-8 h-12 w-28 rounded-t-xl border-x border-t border-amber-400 bg-amber-100 px-2 pt-2 text-center text-[10px] font-black uppercase text-amber-800">
                  Door
                </div>

                {tables.map((table) => (
                  <div
                    key={table.label}
                    className="absolute w-[300px] rounded-2xl border border-slate-400 bg-slate-50/95 p-3 shadow-xl"
                    style={{ left: table.x, top: table.y }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black uppercase text-slate-500">{table.label}</p>
                        <p className="text-[10px] font-bold text-slate-500">
                          F {table.pupils.filter((p) => p.gender === "F").length} · M{" "}
                          {table.pupils.filter((p) => p.gender === "M").length}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">
                        Balanced
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {table.pupils.map((pupil) => (
                        <PupilCard key={pupil.name} pupil={pupil} />
                      ))}
                      {table.pupils.length < 4 &&
                        Array.from({ length: 4 - table.pupils.length }).map((_, index) => (
                          <div key={index} className="min-h-[82px] rounded-xl border border-dashed bg-white/60 p-2 text-xs text-slate-400">
                            Empty seat
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function Card({ title, children, wide = false }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={`rounded-[2rem] border bg-white/90 p-5 shadow-xl shadow-sky-100/60 ${wide ? "min-h-full" : ""}`}>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-400" />
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function Step({ number }: { number: string }) {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-sky-600 text-sm font-black text-white">
      {number}
    </span>
  );
}

function ChoiceBlock({ title, icon, choices }: { title: string; icon: React.ReactNode; choices: string[] }) {
  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <p className="font-black">{title}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {choices.map((choice) => (
          <div key={choice} className="rounded-2xl border bg-slate-50 px-3 py-2 text-sm font-semibold">
            {choice}
          </div>
        ))}
      </div>
      <div className="mt-3 inline-flex animate-bounce items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
        <Sparkles className="h-3 w-3" />
        Choice saved
      </div>
    </div>
  );
}

function Insight({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-3">
      <p className="font-black">{title}</p>
      <p className="text-slate-600">{text}</p>
    </div>
  );
}

function Principle({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
      <p className="font-black">{title}</p>
      <p>{text}</p>
    </div>
  );
}

function PupilCard({ pupil }: { pupil: DemoPupil }) {
  return (
    <div className="min-h-[96px] rounded-xl border bg-card px-2 py-2 text-left text-xs shadow-sm">
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <CharacterDot pupil={pupil} />
            <p className="max-w-[112px] truncate font-black">{pupil.name}</p>
          </div>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{pupil.pass}</p>
        </div>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[10px] font-black text-slate-700">
          {pupil.gender}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {pupil.tags?.map((tag) => (
          <span key={tag} className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${tagClass(tag)}`}>
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-1.5 rounded-md bg-muted/50 px-1.5 py-1 text-[10px] font-medium leading-tight text-slate-500">
        {pupil.reason}
      </div>
    </div>
  );
}

function CharacterDot({ pupil }: { pupil: DemoPupil }) {
  const colour = pupil.pass.toLowerCase().includes("blue")
    ? "bg-blue-500"
    : pupil.pass.toLowerCase().includes("green")
      ? "bg-emerald-500"
      : pupil.pass.toLowerCase().includes("red")
        ? "bg-red-500"
        : pupil.pass.toLowerCase().includes("yellow")
          ? "bg-amber-400"
          : pupil.pass.toLowerCase().includes("pink")
            ? "bg-pink-500"
            : "bg-purple-500";
  return (
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${colour} text-[11px] font-black text-white`}>
      {pupil.name.slice(0, 1)}
    </span>
  );
}

function tagClass(tag: string) {
  if (tag === "SEND") return "bg-violet-100 text-violet-800";
  if (tag === "EHCP") return "bg-red-100 text-red-800";
  if (tag === "EAL") return "bg-cyan-100 text-cyan-800";
  if (tag === "PP") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}
