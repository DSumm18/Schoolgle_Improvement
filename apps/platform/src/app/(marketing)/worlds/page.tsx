import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Gamepad2,
  Monitor,
  NotebookPen,
  Volume2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Schoolgle Worlds | Free educational games · Playtest",
  description:
    "Explore Ancient Egypt, investigate the Gunpowder Plot and discover the Great Fire of London. Try Schoolgle Worlds free, with local fictional practice and no account.",
};

const worlds = [
  {
    id: "nile",
    name: "Nile Quest",
    era: "Ancient Egypt",
    number: "01",
    subjects: "History · Maths · English · Science",
    description:
      "Follow the river, explore a pyramid landscape and investigate a careful discovery. Build an exhibition from what you learn.",
    task: "Share 24 baskets equally between three boats, explain your method, then investigate how a shadow changes.",
    detail: "Seven missions, plus optional maths practice",
    color: "#d8aa53",
    sky: "#172e43",
  },
  {
    id: "plot",
    name: "The Midnight Letter",
    era: "London, 1605",
    number: "02",
    subjects: "History · Reading and evidence",
    description:
      "Put on an outfit inspired by 1605, open a sealed warning and piece together the story of the Gunpowder Plot.",
    task: "Find the warning in an adapted letter. Decide what the evidence tells you — and what it cannot tell you about its writer.",
    detail: "Five discoveries and return recall practice",
    color: "#b8b0e2",
    sky: "#191f37",
  },
  {
    id: "fire",
    name: "The Great Fire of London",
    era: "London, 1666",
    number: "03",
    subjects: "History · Enquiry and explanation",
    description:
      "Explore a city of timber, compare historical sources and help tell the story of Londoners and their rebuilding city.",
    task: "Predict what a gap might change in a paper street. Test your plan, explain the result, then try a different layout.",
    detail: "Five discoveries and a personal exhibition",
    color: "#d7bd86",
    sky: "#183a43",
  },
];

function WorldScene({
  id,
  color,
  sky,
}: {
  id: string;
  color: string;
  sky: string;
}) {
  return (
    <svg
      viewBox="0 0 480 225"
      className="w-full"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="480" height="225" fill={sky} />
      <circle cx="389" cy="49" r="25" fill={color} opacity=".85" />
      <path
        d="M0 185Q140 153 270 187T480 178V225H0Z"
        fill={color}
        opacity=".12"
      />
      {id === "nile" ? (
        <>
          <path d="M60 185 171 56 282 185Z" fill="#bd924e" />
          <path d="m171 56 111 129h-85Z" fill="#795e36" />
          <path d="m252 186 72-85 80 85Z" fill="#aa8347" />
          <path d="m324 101 80 85h-61Z" fill="#6f5835" />
          <path d="M0 209Q143 175 263 207T480 203V225H0Z" fill="#599899" />
          <path
            d="M29 181v-67m0 11q-17-25-29-9m29 9q16-28 35-13m-35 13q-3-29 9-35"
            stroke="#729987"
            strokeWidth="6"
            fill="none"
          />
        </>
      ) : (
        <>
          {[22, 94, 166, 302, 374].map((x, i) => (
            <g key={x}>
              <path
                d={`M${x} 190v-70l27-28 27 28v70Z`}
                fill={i % 2 ? "#9c8968" : "#b6a27c"}
              />
              <path
                d={`m${x - 5} 124 32-36 32 36M${x + 27} 119v71M${x} 153h54m-54-30 54 67m0-67-54 67`}
                stroke="#4a443b"
                strokeWidth="5"
                fill="none"
              />
              <rect x={x + 9} y="132" width="9" height="13" fill={color} />
              <rect x={x + 37} y="161" width="9" height="14" fill={color} />
            </g>
          ))}
          <path d="M231 190V84h8V56h11V34h7v22h11v28h8v106Z" fill="#8c958e" />
          <path d="M230 92h47m-41 10h35" stroke={sky} strokeWidth="5" />
          <path d="M0 204Q165 179 280 207T480 202V225H0Z" fill="#447a83" />
          {id === "plot" && (
            <g transform="translate(320 38) rotate(-12)">
              <rect width="46" height="31" rx="2" fill="#e7d5ae" />
              <path d="m0 0 23 20L46 0" stroke="#a3916d" fill="none" />
              <circle cx="23" cy="20" r="6" fill="#a3584d" />
            </g>
          )}
        </>
      )}
      <path
        d="M19 38h3m75-14h3m109 14h3m68-14h3"
        stroke="#f9ebc8"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function WorldsPage() {
  return (
    <main className="text-foreground">
      <section className="border-b border-border bg-muted/30 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold tracking-wide">
            <Compass size={16} aria-hidden="true" /> Schoolgle Worlds
            <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
              Playtest
            </span>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Free educational games for children.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Step into history. Make a prediction. Follow the evidence. Try
                three interactive adventures built for curious primary school
                children.
              </p>
            </div>
            <div className="lg:pl-8">
              <a
                href="#choose-world"
                className="inline-flex min-h-12 items-center gap-3 rounded-full bg-primary px-7 py-4 font-bold text-primary-foreground shadow-lg shadow-primary/15 transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                Choose your adventure{" "}
                <ArrowRight size={19} aria-hidden="true" />
              </a>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Free public prototype. No account needed.
                <br />
                Play together first, then tell us what could be clearer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="choose-world"
        aria-labelledby="worlds-heading"
        className="scroll-mt-24 px-6 py-16"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Pick a place. Start a story.
              </p>
              <h2
                id="worlds-heading"
                className="mt-3 text-3xl font-bold tracking-tight"
              >
                Three worlds to investigate
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Each link starts local practice as Alex, a fictional learner. Your
              own game choices create the practice record.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {worlds.map((world) => (
              <article
                key={world.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
              >
                <WorldScene id={world.id} color={world.color} sky={world.sky} />
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {world.number} / {world.era}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight">
                    {world.name}
                  </h3>
                  <p className="mt-2 text-xs font-semibold text-primary">
                    {world.subjects}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {world.description}
                  </p>
                  <div className="my-5 rounded-2xl bg-muted/60 p-4">
                    <p className="text-xs font-bold">One thing you will do</p>
                    <p className="mt-2 text-sm leading-relaxed">{world.task}</p>
                  </div>
                  <p className="mb-4 mt-auto text-xs text-muted-foreground">
                    {world.detail}
                  </p>
                  <a
                    href={`/worlds/play/index.html?game=${world.id}&demo=1`}
                    className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4"
                    aria-label={`Play ${world.name}`}
                  >
                    Play {world.id === "fire" ? "the Great Fire" : world.name}
                    <ArrowRight size={17} aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Illustrations introduce each setting. Games contain interpreted 3D
            landscapes and modern teaching puzzles; they are not exact
            historical reconstructions.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="start-heading"
        className="border-y border-border bg-muted/30 px-6 py-14"
      >
        <div className="mx-auto max-w-7xl">
          <h2 id="start-heading" className="text-2xl font-bold tracking-tight">
            A simple start, with room for support
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <Monitor className="mb-4 text-primary" aria-hidden="true" />
              <h3 className="font-bold">Computer or tablet</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Use the on-screen controls with a mouse or touch. Keyboard
                controls and movement guidance are explained inside each game. A
                larger screen gives the worlds more room.
              </p>
            </div>
            <div>
              <Volume2 className="mb-4 text-primary" aria-hidden="true" />
              <h3 className="font-bold">Choose your support</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Explore the controls and comfort settings for larger text,
                reduced motion and read-aloud support where available. Text
                stays available to read. Check the experience with your child
                before independent play.
              </p>
            </div>
            <div>
              <Gamepad2 className="mb-4 text-primary" aria-hidden="true" />
              <h3 className="font-bold">Practice without registration</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                No pupil name, date of birth or school is needed. Alex’s
                practice saves in this browser, so it can continue here. Use the
                grown-up view to clear that practice before another playtester
                starts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="teachers-heading" className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              For teachers and families
            </p>
            <h2
              id="teachers-heading"
              className="mt-3 text-3xl font-bold tracking-tight"
            >
              See the thinking behind the gems.
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Open the grown-up or teacher view inside a game to inspect the
              answers, corrections and help used on this device. In Nile Quest,
              the record also includes submitted sharing models and calculations
              where the activity asks for them.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              For example, inspect a child’s boat shares, ask why the groups are
              equal, then try a fresh sharing task with counters. In the Fire
              investigation, compare their prediction with the observed result
              and their new plan.
            </p>
            <Link
              href="/contact"
              className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full border border-border px-6 py-3 font-semibold transition-colors hover:bg-muted"
            >
              Share playtest feedback{" "}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="space-y-5">
            <div className="rounded-2xl border border-border p-6">
              <BookOpen className="mb-3 text-primary" aria-hidden="true" />
              <h3 className="font-bold">A teaching purpose for each task</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The in-game guides map selected tasks to England’s primary
                curriculum, explain what a response shows and suggest classroom
                follow-up. Nile combines subjects; the London adventures focus
                on history and evidence. These are selected activities, not a
                complete curriculum scheme.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <NotebookPen className="mb-3 text-primary" aria-hidden="true" />
              <h3 className="font-bold">An honest view of the evidence</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Practice records come from actual interactions, even though Alex
                is fictional. A completed task or a gem total does not establish
                mastery. The guides explain the EEF-informed design rationale;
                EEF has not endorsed this product, and improved learning
                outcomes have not yet been demonstrated.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16" aria-labelledby="prototype-heading">
        <div className="mx-auto max-w-7xl rounded-3xl border border-border bg-muted/40 p-7 md:p-10">
          <h2 id="prototype-heading" className="text-xl font-bold">
            What this playtest includes
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            Playable adventures, a local practice record and teaching guidance
            are available free. School accounts, verified pupil links and a
            shared class dashboard are not connected. Progress does not sync
            between devices. Please use this public version for fictional
            practice, and do not enter or upload real pupil information.
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            We are testing clarity, controls, accessibility and whether the
            activities support useful learning conversations. Teachers and
            families can share this page so others can try it and give feedback.
          </p>
          <a
            href="#choose-world"
            className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-primary underline underline-offset-4"
          >
            Find your first adventure{" "}
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </section>
    </main>
  );
}
