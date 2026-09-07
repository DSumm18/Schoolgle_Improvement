import type { Metadata } from "next";
import Image from "next/image";
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
import styles from "./worlds.module.css";

export const metadata: Metadata = {
  title: "Schoolgle Worlds | Choose your adventure · Free playtest",
  description:
    "Uncover the Great Fire of London, explore Ancient Egypt and investigate the Gunpowder Plot. Free educational adventures for children, with no account needed.",
};

const otherWorlds = [
  {
    id: "nile",
    title: "Ancient Egypt",
    subtitle: "Nile Quest",
    era: "A journey along the Nile",
    image: "/worlds/art/nile-key-art.webp",
    alt: "Illustrated Ancient Egyptian adventure beside the Nile and pyramids.",
    tagline: "Follow the river. Discover its secrets.",
    story:
      "Bring water to a garden, share a harvest between boats and explore light and shadows. Follow the evidence to a careful archaeological discovery.",
    detail: "Seven missions · History, maths, English and science",
    age: "Start here: ages 7–11",
    play: "Play Nile Quest",
  },
  {
    id: "plot",
    title: "The Gunpowder Plot",
    subtitle: "The Midnight Letter",
    era: "London · 1605",
    image: "/worlds/art/plot-key-art.webp",
    alt: "Illustrated mystery adventure in London at the time of the Gunpowder Plot.",
    tagline: "A sealed warning. An unfolding mystery.",
    story:
      "Dress for 1605, open the warning letter and investigate the clues. Discover who played each part, and what the evidence can — and cannot — tell us.",
    detail: "Five discoveries · History, reading and evidence",
    age: "Start here: ages 6–9, with grown-up help",
    play: "Play The Midnight Letter",
  },
];

export default function WorldsPage() {
  return (
    <main className="text-foreground">
      <section
        className={styles.adventures}
        id="choose-world"
        aria-labelledby="worlds-heading"
      >
        <div className={styles.container}>
          <header className={styles.intro}>
            <div>
              <p className={styles.eyebrow}>
                <Compass size={17} aria-hidden="true" /> Schoolgle Worlds{" "}
                <span className={styles.playtest}>Free playtest</span>
              </p>
              <h1 id="worlds-heading">Every world hides a story.</h1>
              <p className={styles.introText}>
                Free educational games for children. Choose your adventure and
                uncover it.
              </p>
            </div>
            <p className={styles.introNote}>
              No account needed.
              <br />
              Curiosity is a good place to start.
            </p>
          </header>

          <section className={styles.learningIntro} aria-labelledby="learning-intro-title">
            <div className={styles.learningOverview}>
              <h2 id="learning-intro-title">An adventure with learning at its heart.</h2>
              <p>
                Explore a story, solve a problem and explain your thinking.
                Schoolgle Worlds offers another way to practise school learning:
                read or listen, try ideas, use feedback and revisit discoveries.
              </p>
              <a href="#fire-title" className={styles.learningJump}>Choose a game <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <div className={styles.subjectOverview}>
              <p><strong>Egypt:</strong> history, maths, English and science —
                share a harvest equally, explain a calculation and explore shadows.</p>
              <p><strong>The London stories:</strong> history and English —
                read clues, compare evidence and explain what happened and why.</p>
            </div>
            <div className={styles.learningFooter}>
              <p>Selected activities linked to England’s primary curriculum.
                Research informs the design; teacher and pupil feedback will help us improve it.</p>
            </div>
            <details className={styles.researchDetails}>
              <summary>For grown-ups: why this approach? Curriculum &amp; EEF research</summary>
              <div className={styles.researchBody}>
                <p><strong>Practice with a purpose.</strong> The Education Endowment
                  Foundation (EEF) highlights how technology can support better
                  practice and assessment when it serves a clear teaching purpose.
                  Our activities ask children to make choices, use feedback and
                  revisit ideas. <a href="https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/digital">Read the EEF digital technology guidance</a>.</p>
                <p><strong>Think about how you learn.</strong> EEF evidence supports
                  explicitly teaching children to plan, check and evaluate their
                  learning within a subject. In the Fire investigation, children
                  predict, test a change, explain the result and try a new layout.
                  A grown-up can help by asking “Why did you choose that?” and
                  “What would you change?” <a href="https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation">Read the EEF metacognition evidence</a>.</p>
                <p><strong>Connected to classroom learning.</strong> The in-game
                  teacher guides map selected tasks to <a href="https://www.gov.uk/government/collections/national-curriculum">England’s primary national curriculum</a>,
                  describe what responses can show and suggest follow-up activities.
                  Each world covers different subjects; together they offer practice,
                  not a complete curriculum scheme.</p>
                <p><strong>Another way to take part.</strong> Stories, text,
                  optional read-aloud and interactive models offer different ways
                  to engage with the same ideas. Children can use the available
                  support without being assigned a fixed “learning style”.</p>
                <p className={styles.researchCaveat}>EEF has not evaluated or endorsed
                  Schoolgle Worlds. These principles inform our design; we have not
                  yet demonstrated improved learning outcomes from these games.</p>
                <a href="#teachers-heading">See what teachers and families can review <ArrowRight size={14} aria-hidden="true" /></a>
              </div>
            </details>
          </section>

          <article className={styles.feature} aria-labelledby="fire-title">
            <div className={styles.featureArt}>
              <Image
                src="/worlds/art/fire-key-art.webp"
                alt="Illustrated Great Fire of London adventure: the city beside the Thames in 1666."
                fill
                priority
                sizes="(max-width: 800px) 100vw, (max-width: 1440px) 60vw, 770px"
                className={styles.art}
              />
              <span className={styles.artLabel}>
                Illustrated adventure artwork
              </span>
            </div>
            <div className={styles.featureCopy}>
              <p className={styles.chapter}>
                <span>Featured adventure</span> London · 1666
              </p>
              <h2 id="fire-title">
                The Great Fire
                <br className={styles.titleBreak} /> of London
              </h2>
              <p className={styles.featureTagline}>
                A city in flames. A story to uncover.
              </p>
              <p className={styles.featureStory}>
                Follow clues from Pudding Lane, explore witness accounts and
                test your own paper-street model. Piece together the story of
                Londoners and build an exhibition about their rebuilding city.
              </p>
              <div className={styles.featureMeta}>
                <span>5 discoveries</span>
                <span>History &amp; enquiry</span>
              </div>
              <a
                href="/worlds/play/index.html?game=fire&demo=1"
                className={styles.playButton}
                aria-label="Play The Great Fire of London"
              >
                Begin the London adventure{" "}
                <ArrowRight size={20} aria-hidden="true" />
              </a>
              <p className={styles.age}>
                Start here: ages 6–9, with grown-up help
              </p>
            </div>
          </article>

          <div className={styles.moreHeading}>
            <h2>Where will you go next?</h2>
            <span>Two more stories waiting to be discovered</span>
          </div>
          <div className={styles.otherWorlds}>
            {otherWorlds.map((world) => (
              <article
                key={world.id}
                className={styles.worldCard}
                aria-labelledby={`${world.id}-title`}
              >
                <div className={styles.cardArt}>
                  <Image
                    src={world.image}
                    alt={world.alt}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 1440px) 50vw, 636px"
                    className={styles.art}
                  />
                  <span className={styles.artLabel}>
                    Illustrated adventure artwork
                  </span>
                </div>
                <div className={styles.cardCopy}>
                  <p className={styles.chapter}>
                    {world.era} <span>{world.subtitle}</span>
                  </p>
                  <h3 id={`${world.id}-title`}>{world.title}</h3>
                  <p className={styles.cardTagline}>{world.tagline}</p>
                  <p className={styles.cardStory}>{world.story}</p>
                  <p className={styles.cardDetail}>{world.detail}</p>
                  <a
                    href={`/worlds/play/index.html?game=${world.id}&demo=1`}
                    className={styles.cardPlay}
                    aria-label={world.play}
                  >
                    {world.play}
                    <ArrowRight size={19} aria-hidden="true" />
                  </a>
                  <p className={styles.age}>{world.age}</p>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.practiceNote}>
            <Compass size={20} aria-hidden="true" />
            <p>
              These links open practice as{" "}
              <strong>Alex, a fictional learner</strong>. Your choices create
              the local practice record. Age ranges are a starting guide:
              explore together and choose the support that helps.
            </p>
          </div>
          <p className={styles.artNote}>
            Artwork introduces each adventure; it is not a gameplay screenshot.
            The games use interpreted 3D settings and modern teaching puzzles,
            rather than exact historical reconstructions.
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
