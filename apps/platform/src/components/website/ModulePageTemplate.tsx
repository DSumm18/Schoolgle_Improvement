import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { moduleThemes } from "@/lib/moduleThemes";
interface Props {
  moduleSlug: string;
  howEdHelps: { title: string; desc: string }[];
  typicalJobs: string[];
  whatItCovers: string[];
}
export default function ModulePageTemplate({
  moduleSlug,
  howEdHelps,
  typicalJobs,
  whatItCovers,
}: Props) {
  const theme = Object.hasOwn(moduleThemes, moduleSlug)
    ? moduleThemes[moduleSlug]
    : undefined;
  if (!theme) return null;
  return (
    <div>
      <section className="sg-wrap sg-section">
        <p className="sg-eyebrow">Schoolgle / {theme.name}</p>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight max-w-4xl">
          {theme.outcome}
        </h1>
        <p className="sg-lead mt-7">
          Bring the people, tasks and evidence into view. Start with the{" "}
          {theme.name.toLowerCase()} work your team wants to make easier.
        </p>
        <div className="sg-actions">
          <Link href="/#early-access" className="sg-button">
            Discuss your school <ArrowRight size={17} />
          </Link>
          <Link href="/modules" className="sg-text-link">
            All modules
          </Link>
        </div>
        <p className="sg-small">
          This is a module overview, not a guarantee that every workflow is
          available in your package. We will confirm current availability,
          demonstrate the relevant workflow and agree the scope before you
          commit.
        </p>
      </section>
      <section className="sg-section sg-soft">
        <div className="sg-wrap">
          <p className="sg-eyebrow">The work behind the module</p>
          <h2 className="mb-10">A clearer way forward.</h2>
          <div className="sg-product-grid">
            {howEdHelps.map((item, i) => (
              <div
                className="sg-product-card"
                style={{ borderTopColor: theme.accentHex }}
                key={item.title}
              >
                <p className="sg-card-number">0{i + 1}</p>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="sg-wrap sg-section">
        <div className="sg-ed">
          <div>
            <p className="sg-eyebrow">Practical support</p>
            <h2>
              What your team
              <br />
              can work on.
            </h2>
            <ul className="mt-8 space-y-4">
              {typicalJobs.map((job) => (
                <li key={job} className="flex gap-3 text-muted-foreground">
                  <Check size={18} className="shrink-0 text-primary" />
                  {job}
                </li>
              ))}
            </ul>
          </div>
          <div className="sg-ed-notes">
            <p className="sg-eyebrow">At a glance</p>
            <h3>Workflows to discuss</h3>
            {whatItCovers.map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        </div>
      </section>
      <section className="sg-wrap pb-20">
        <div className="sg-ed-notes">
          <p className="sg-eyebrow">Before sharing school data</p>
          <h3>Clear information. Informed decisions.</h3>
          <p className="text-muted-foreground my-5 leading-relaxed">
            Review the data involved, the services that process it and the
            appropriate access for your team. Professional decisions remain with
            the responsible people.
          </p>
          <Link href="/data-protection" className="sg-text-link">
            Read the data protection information <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
