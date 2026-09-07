"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  HeartHandshake,
  ChartNoAxesCombined,
  ClipboardCheck,
  Check,
  Sparkles,
} from "lucide-react";
import LatestResearch from "./LatestResearch";
import EarlyAccessForm from "./EarlyAccessForm";

const workflows = [
  {
    name: "Finance",
    icon: ChartNoAxesCombined,
    color: "#f59e0b",
    image: "/marketing/screenshots/finance-budget-monitor.png",
    title: "Know where the budget is heading.",
    text: "Bring budget lines, actuals and commitments into the same conversation. See the pressures, then decide what needs attention.",
    href: "/modules/finance",
    details: [
      "Budget and commitments together",
      "Clearer questions for governors",
      "The detail behind the headline",
    ],
  },
  {
    name: "SEND & inclusion",
    icon: HeartHandshake,
    color: "#10b981",
    image: "/marketing/screenshots/send-inclusion-hub.png",
    title: "Keep the next step in sight.",
    text: "A shared view of the SEND register, provision and review dates. Less time piecing things together; more time talking about the support a child needs.",
    href: "/modules/send",
    details: [
      "Register and review dates",
      "Provision and evidence",
      "Professional judgement stays central",
    ],
  },
];
const products = [
  {
    name: "Estates & compliance",
    icon: Building2,
    color: "#14b8a6",
    href: "/modules/estates",
    kicker: "For the people who keep school running",
    text: "Know what's due, who's responsible and where the evidence lives. From routine checks to the job that needs chasing.",
  },
  {
    name: "School improvement",
    icon: ClipboardCheck,
    color: "#0ea5e9",
    href: "/modules/improvement",
    kicker: "For heads and improvement teams",
    text: "Connect evidence, findings and actions. Keep the story of improvement current, with sources you can go back to.",
  },
  {
    name: "Governance",
    icon: ChartNoAxesCombined,
    color: "#f59e0b",
    href: "/modules/governance",
    kicker: "For governors and trust leaders",
    text: "A clearer line from the question a board asks to the evidence, the decision and the person taking it forward.",
  },
];
export default function SchoolgleHome() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const current = workflows[active];
  return (
    <>
      <section className="sg-hero">
        <div className="sg-wrap sg-hero-grid">
          <div>
            <p className="sg-eyebrow">
              <span />
              Built around real school life
            </p>
            <h1>
              More time for
              <br />
              what <span className="sg-emphasis">matters.</span>
            </h1>
            <p className="sg-lead">
              The checks. The evidence. The next thing to chase. Schoolgle
              brings them together, so your team can get on with the work that
              makes a difference.
            </p>
            <div className="sg-actions">
              <Link href="/#early-access" className="sg-button">
                Let&apos;s talk about your school <ArrowRight size={17} />
              </Link>
              <Link href="#product-tour" className="sg-text-link">
                See it in action <ArrowUpRight size={17} />
              </Link>
            </div>
            <p className="sg-small">
              For school leaders, business managers and trusts.
            </p>
          </div>
          <div className="sg-hero-proof">
            <div className="sg-proof-heading">
              <span className="sg-dot" />
              One school. A clearer picture.
              <span className="sg-proof-label">Product preview</span>
            </div>
            <Image
              src="/marketing/screenshots/finance-budget-monitor.png"
              alt="Schoolgle Budget Monitor showing a budget overview, expenditure and forecast"
              width={1440}
              height={900}
              priority
              sizes="(max-width: 1000px) 100vw, 55vw"
              className="sg-hero-image"
            />
            <div className="sg-proof-footer">
              <Check size={17} />
              See the numbers. Ask better questions.
              <Link
                href="#product-tour"
                aria-label="Explore the product preview"
              >
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
        <div className="sg-wrap sg-principles">
          <span>School improvement</span>
          <span>Estates & compliance</span>
          <span>SEND & inclusion</span>
          <span>Finance</span>
          <span>Governance</span>
        </div>
      </section>
      <section className="sg-section sg-wrap" id="product-tour">
        <div className="sg-section-heading">
          <div>
            <p className="sg-eyebrow">Inside Schoolgle</p>
            <h2>
              Less piecing together.
              <br />
              More seeing what to do.
            </h2>
          </div>
          <p>
            Real screens from the product. Choose a view and take a closer look.
          </p>
        </div>
        <div className="sg-tabs" role="tablist" aria-label="Product previews">
          {workflows.map((w, i) => (
            <button
              key={w.name}
              id={`tour-tab-${i}`}
              role="tab"
              aria-selected={i === active}
              aria-controls="product-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                let next = i;
                if (e.key === "ArrowRight" || e.key === "ArrowLeft")
                  next = (i + 1) % workflows.length;
                else if (e.key === "Home") next = 0;
                else if (e.key === "End") next = workflows.length - 1;
                else return;
                e.preventDefault();
                setActive(next);
                document.getElementById(`tour-tab-${next}`)?.focus();
              }}
            >
              <w.icon size={17} />
              {w.name}
            </button>
          ))}
        </div>
        <div
          className="sg-tour"
          id="product-panel"
          role="tabpanel"
          aria-labelledby={`tour-tab-${active}`}
          tabIndex={0}
        >
          <motion.div
            key={active}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="sg-tour-image"
          >
            <Image
              src={current.image}
              alt={`${current.name}: actual Schoolgle product screen`}
              width={1440}
              height={900}
              sizes="(max-width: 1000px) 100vw, 65vw"
            />
          </motion.div>
          <div className="sg-tour-copy">
            <p className="sg-eyebrow" style={{ color: current.color }}>
              {current.name}
            </p>
            <h3>{current.title}</h3>
            <p>{current.text}</p>
            <ul>
              {current.details.map((d) => (
                <li key={d}>
                  <Check size={16} />
                  {d}
                </li>
              ))}
            </ul>
            <Link className="sg-text-link" href={current.href}>
              Explore {current.name.toLowerCase()} <ArrowRight size={16} />
            </Link>
            <small>
              Product screenshots show example views, not a promise of results
              for your school.
            </small>
          </div>
        </div>
      </section>
      <section className="sg-section sg-soft" id="preview">
        <div className="sg-wrap">
          <div className="sg-section-heading">
            <div>
              <p className="sg-eyebrow">Start where you need us</p>
              <h2>
                One problem worth solving.
                <br />A good place to begin.
              </h2>
            </div>
            <Link href="/modules" className="sg-text-link">
              Explore all modules <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="sg-product-grid">
            {products.map((p, i) => (
              <motion.div
                key={p.name}
                initial={false}
                whileHover={reduce ? {} : { y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={p.href}
                  className="sg-product-card"
                  style={{ borderTopColor: p.color }}
                >
                  <p className="sg-card-number">
                    0{i + 1}
                    <p.icon size={24} style={{ color: p.color }} />
                  </p>
                  <p className="sg-small">{p.kicker}</p>
                  <h3>{p.name}</h3>
                  <p>{p.text}</p>
                  <span className="sg-text-link">
                    Take a closer look <ArrowRight size={17} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section id="meet-ed" className="sg-section sg-wrap">
        <div className="sg-ed">
          <div>
            <p className="sg-eyebrow">
              <Sparkles size={16} />
              Meet Ed
            </p>
            <h2>
              A helping hand.
              <br />
              With your school in mind.
            </h2>
            <p>
              Sometimes you need an answer. Sometimes you need help making sense
              of the next step. Ed is Schoolgle&apos;s assistant for school work:
              helping with questions, drafts and the information your team has
              available.
            </p>
            <p>
              You bring the context and make the decisions. Ed helps with the
              legwork.
            </p>
            <Link href="/ed-staff" className="sg-button">
              Meet your assistant <ArrowRight size={17} />
            </Link>
          </div>
          <div className="sg-ed-notes">
            <p className="sg-eyebrow">A useful place to start</p>
            <h3>
              Bring us the task
              <br />
              that eats your time.
            </h3>
            <div>
              <span>01</span>
              <p>The evidence you keep hunting for.</p>
            </div>
            <div>
              <span>02</span>
              <p>The update you write in three different places.</p>
            </div>
            <div>
              <span>03</span>
              <p>The follow-up that slips between teams.</p>
            </div>
            <p className="sg-small">
              We&apos;ll walk through what Schoolgle can help with and what still
              needs a person.
            </p>
          </div>
        </div>
      </section>
      <LatestResearch />
      <section className="sg-section sg-wrap">
        <div className="sg-trust">
          <div>
            <p className="sg-eyebrow">On your side</p>
            <h2>
              Good tools should make
              <br />
              school life simpler.
            </h2>
            <p>
              That&apos;s the reason we&apos;re building Schoolgle. Start with a specific
              problem, see the product and ask the awkward questions. We&apos;ll work
              through the fit with you.
            </p>
          </div>
          <div>
            <Link href="/data-protection">
              <span>For your data protection officer</span>
              <ArrowUpRight size={19} />
            </Link>
            <Link href="/ai-governance">
              <span>How we approach AI</span>
              <ArrowUpRight size={19} />
            </Link>
            <Link href="/contact">
              <span>Talk to a real person</span>
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>
      </section>
      <EarlyAccessForm />
    </>
  );
}
