import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
for (const envPath of [".env.local", "apps/platform/.env.local"]) {
  if (fs.existsSync(path.join(ROOT, envPath))) {
    dotenv.config({ path: path.join(ROOT, envPath), override: false, quiet: true });
  }
}

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg.startsWith("--")) {
    const [key, value] = arg.slice(2).split("=");
    args.set(key, value ?? process.argv[index + 1]);
    if (!arg.includes("=")) index += 1;
  }
}

const limit = Number(args.get("limit") ?? 1000);
const concurrency = Number(args.get("concurrency") ?? 12);
const outDir = path.join(ROOT, "outputs");
const outPrefix = args.get("out") ?? `class-builder-bulk-${limit}`;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const stopWords = new Set(
  "primary school church england voluntary controlled aided community academy the and of st saint ce cofe c e first nursery partnership learning federation schools catholic methodist all our lady virgin junior infant infants juniors ltd trust".split(
    " ",
  ),
);

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round1(value) {
  return value == null || !Number.isFinite(value) ? "" : Math.round(value * 10) / 10;
}

function csvCell(value) {
  const stringValue = String(value ?? "");
  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue;
}

function primaryYearCount(school) {
  const lowAge = numeric(school.statutory_low_age);
  const highAge = numeric(school.statutory_high_age);
  if (lowAge == null || highAge == null) return 7;
  if (highAge <= 8) return Math.max(1, highAge - lowAge);
  const startAge = lowAge <= 4 ? 4 : lowAge;
  const endAge = highAge >= 11 ? 10 : highAge - 1;
  return Math.max(1, endAge - startAge + 1);
}

function tokens(value) {
  return [
    ...new Set(
      String(value ?? "")
        .toLowerCase()
        .replace(/&/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .split(" ")
        .filter((token) => token.length > 2 && !stopWords.has(token)),
    ),
  ];
}

function hasRuralSignal(school) {
  const text = [school.name, school.locality, school.town, school.county, school.website]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /village|rural|church of england|cofe|c of e|ce primary|county primary|first school|federation|federated|moorland|peak|dale|valley|fell|wold|shire|parish/.test(
    text,
  );
}

function formEntryBand(formEntry) {
  if (formEntry < 0.45) return "micro";
  if (formEntry < 0.7) return "half-form";
  if (formEntry <= 1.05) return "one-form";
  if (formEntry <= 1.3) return "small one-form";
  return "larger";
}

function analyseSchool(school) {
  const nor = numeric(school.number_of_pupils);
  const capacity = numeric(school.school_capacity);
  const yearCount = primaryYearCount(school);
  const pupilsPerYear = nor == null ? null : nor / yearCount;
  const capacityPerYear = capacity == null ? null : capacity / yearCount;
  const formEntry = capacityPerYear ? capacityPerYear / 30 : pupilsPerYear ? pupilsPerYear / 30 : null;
  const ruralSignal = hasRuralSignal(school);
  const evidence = [];
  let score = 0;

  if (nor >= 55 && nor <= 150) score += 40;
  else if (nor >= 35 && nor < 55) score += 25;
  else if (nor > 150 && nor <= 210) score += 18;
  else if (nor < 35) score += 8;

  if (capacity >= 70 && capacity <= 150) score += 34;
  else if (capacity > 150 && capacity <= 210) score += 18;
  else if (capacity < 70) score += 12;

  if (capacityPerYear >= 10 && capacityPerYear <= 22) score += 25;
  else if (capacityPerYear > 22 && capacityPerYear <= 30) score += 12;
  else if (capacityPerYear < 10) score += 8;

  if (pupilsPerYear >= 8 && pupilsPerYear <= 22) score += 18;
  else if (pupilsPerYear > 22 && pupilsPerYear <= 30) score += 8;
  else if (pupilsPerYear < 8) score += 5;

  if (ruralSignal) score += 10;
  if (/federation|federated/i.test([school.name, school.website].join(" "))) score += 5;
  if (/academy/i.test(school.type_name ?? "")) score -= 2;
  if (nor < 20) score -= 14;
  if (capacity < 40) score -= 8;

  if (nor != null) evidence.push(`NOR ${nor}; approx ${round1(pupilsPerYear)} pupils per primary year`);
  if (capacity != null) {
    evidence.push(
      `capacity ${capacity}; estimated PAN/capacity per year ${round1(capacityPerYear)} (${formEntryBand(formEntry ?? 0)})`,
    );
  }
  if (ruralSignal) evidence.push("village/rural/church/federation signal");
  if (capacityPerYear && capacityPerYear < 30) {
    evidence.push("capacity below full 30-place class per year");
  }

  let confidence = "low";
  if (score >= 86 && ((capacityPerYear && capacityPerYear <= 22) || (pupilsPerYear && pupilsPerYear <= 18)) && nor >= 35) {
    confidence = "high";
  } else if (score >= 62) {
    confidence = "medium";
  }

  return { score, confidence, yearCount, pupilsPerYear, capacityPerYear, formEntry, evidence };
}

function normaliseWebsite(website) {
  if (!website) return null;
  let value = website.trim();
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function absoluteUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function cleanHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#64;|&commat;/gi, "@")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmails(html) {
  const decoded = html
    .replace(/&#64;|&commat;|\s*\[at\]\s*|\s*\(at\)\s*/gi, "@")
    .replace(/\s*\[dot\]\s*|\s*\(dot\)\s*/gi, ".");
  const emails = [...decoded.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)]
    .map((match) => match[0].toLowerCase().replace(/[),.;:'"<>]+$/, ""))
    .filter((email) => !/(example|sentry|wixpress|wordpress|schema|domain\.com|email\.com)/i.test(email))
    .filter((email) => !/\.(jpg|jpeg|png|gif|webp|svg|pdf)$/i.test(email))
    .filter((email) => {
      const domain = email.split("@")[1] ?? "";
      return domain.split(".").every((label) => label.length > 0);
    });
  return [...new Set(emails)];
}

function extractLinks(html, base) {
  const links = [];
  for (const match of html.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)) {
    const url = absoluteUrl(match[1], base);
    if (url) links.push(url);
  }
  return [...new Set(links)];
}

function isContactLink(url) {
  return /(contact|office|about|staff|team|headteacher|welcome|school-information|statutory|key-information|who-we-are|governance)/i.test(
    url,
  );
}

function isClassLink(url) {
  return /(class|classes|curriculum|year-|year_|year%20|our-school|children|learning|pupils|phase|keystage|key-stage)/i.test(
    url,
  );
}

function isSameHost(url, baseUrl) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const baseHost = new URL(baseUrl).hostname.replace(/^www\./, "");
    return host === baseHost;
  } catch {
    return false;
  }
}

async function fetchHtml(url) {
  const variants = [url];
  if (url.startsWith("https://")) variants.push(url.replace("https://", "http://"));
  for (const variant of variants) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(variant, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 Schoolgle contact research" },
      });
      clearTimeout(timer);
      const contentType = response.headers.get("content-type") ?? "";
      if (response.ok && /text|html|xml/i.test(contentType)) {
        return { url: response.url, html: await response.text(), status: response.status };
      }
    } catch {
      // Try next variant.
    }
  }
  return null;
}

function scoreEmail(email, school, sourceUrl) {
  let score = 0;
  const lowerEmail = email.toLowerCase();
  for (const token of tokens(school.name ?? school.school_name)) {
    if (lowerEmail.includes(token)) score += 60;
    if (sourceUrl.toLowerCase().includes(token)) score += 20;
  }
  for (const token of tokens(school.website ?? "")) {
    if (lowerEmail.includes(token)) score += 8;
  }
  if (/head|headteacher|principal/.test(lowerEmail)) score += 35;
  if (/office|admin|enquir|contact|info|school/.test(lowerEmail)) score += 25;
  if (/safeguard|dsl|senco|clerk|governor|finance|bursar|nursery|absence|attendance/.test(lowerEmail)) score -= 30;
  if (/careline|ncb\.org|childline|nspcc|facebook|twitter|x\.com|youtube|instagram|support@.*eschool/.test(lowerEmail)) {
    score -= 80;
  }
  return score;
}

function classifyEmail(email) {
  if (!email) return "";
  if (/safeguard|dsl|senco|clerk|governor|finance|bursar|nursery|absence|attendance/i.test(email)) return "do-not-use";
  if (/head|headteacher|principal/i.test(email)) return "head/named";
  if (/office|admin|enquir|contact|info|school/i.test(email)) return "office/general";
  return "other-public";
}

function chooseEmail(emails, school, sourceByEmail) {
  return emails
    .map((email) => ({
      email,
      source: sourceByEmail.get(email) ?? "",
      type: classifyEmail(email),
      score: scoreEmail(email, school, sourceByEmail.get(email) ?? ""),
    }))
    .filter((entry) => entry.type !== "do-not-use")
    .sort((a, b) => b.score - a.score || a.email.localeCompare(b.email))[0];
}

function detectClassEvidence(pages) {
  const classPatterns = [
    /\b(?:mixed[- ]age|mixed year|split[- ]year|split year|vertical grouping|composite class(?:es)?)\b/i,
    /\b(?:year|yr)\s*(?:r|[1-6])\s*(?:\/|and|&|\+|-)\s*(?:year|yr)?\s*(?:r|[1-6])\b/i,
    /\b(?:class|classes)\s+(?:1|2|3|4|oak|willow|elm|ash|beech|maple|sycamore|chestnut)\b/i,
  ];

  for (const page of pages) {
    const text = cleanHtml(page.html);
    for (const pattern of classPatterns) {
      const match = text.match(pattern);
      if (match) {
        const index = Math.max(0, match.index - 110);
        const snippet = text.slice(index, Math.min(text.length, match.index + 190));
        return {
          found: "yes",
          type: pattern.source.includes("mixed") ? "explicit mixed/split-age wording" : "public class/year structure page",
          url: page.url,
          snippet,
        };
      }
    }
  }
  return { found: "no", type: "", url: "", snippet: "" };
}

function personalisedOpening(row, classEvidence) {
  if (classEvidence.found === "yes") {
    return `I noticed from public DfE data that ${row.school_name} is a small school, with ${row.nor} pupils on roll and roughly ${row.est_pupils_per_year} pupils per primary year. I also saw that your website shares class or year-group information, so mixed-year class planning may be a familiar job for your team.`;
  }
  if (/federation/i.test(`${row.school_name} ${row.website} ${row.evidence}`)) {
    return `I noticed from public DfE data that ${row.school_name} is a small school, with ${row.nor} pupils on roll and roughly ${row.est_pupils_per_year} pupils per primary year. The school also appears to sit in a federation context, where mixed-age or uneven cohort planning is often a recurring leadership task.`;
  }
  return `I noticed from public DfE data that ${row.school_name} is a small school, with ${row.nor} pupils on roll and roughly ${row.est_pupils_per_year} pupils per primary year. Schools with small cohorts often have to think carefully about mixed-year or uneven class groupings.`;
}

async function enrichSchool(row) {
  const base = normaliseWebsite(row.website);
  const result = {
    best_email: "",
    best_email_type: "",
    email_source_url: "",
    all_public_emails: "",
    contact_urls_checked: "",
    class_evidence_found: "no",
    class_evidence_type: "",
    class_evidence_url: "",
    class_evidence_snippet: "",
    crawl_status: "",
  };

  if (!base) {
    result.crawl_status = "no website";
    result.personalised_opening = personalisedOpening(row, result);
    return result;
  }

  const pages = [];
  const home = await fetchHtml(base);
  if (!home) {
    result.crawl_status = "website fetch failed";
    result.personalised_opening = personalisedOpening(row, result);
    return result;
  }

  pages.push(home);
  const links = extractLinks(home.html, home.url)
    .filter((url) => isSameHost(url, home.url))
    .filter((url) => !/\.(pdf|jpg|jpeg|png|zip|docx?|xlsx?)($|\?)/i.test(url));
  const contactLinks = links.filter(isContactLink).slice(0, 8);
  const classLinks = links.filter(isClassLink).slice(0, 8);
  const selectedLinks = [...new Set([...contactLinks, ...classLinks])].slice(0, 14);

  for (const link of selectedLinks) {
    const page = await fetchHtml(link);
    if (page) pages.push(page);
  }

  const sourceByEmail = new Map();
  for (const page of pages) {
    for (const email of extractEmails(page.html)) {
      if (!sourceByEmail.has(email)) sourceByEmail.set(email, page.url);
    }
  }

  const emails = [...sourceByEmail.keys()].sort(
    (a, b) => scoreEmail(b, row, sourceByEmail.get(b) ?? "") - scoreEmail(a, row, sourceByEmail.get(a) ?? ""),
  );
  const chosen = chooseEmail(emails, row, sourceByEmail);
  if (chosen) {
    result.best_email = chosen.email;
    result.best_email_type = chosen.type;
    result.email_source_url = chosen.source;
  }
  result.all_public_emails = emails.join("; ");
  result.contact_urls_checked = pages.map((page) => page.url).join("; ");

  const classEvidence = detectClassEvidence(pages);
  result.class_evidence_found = classEvidence.found;
  result.class_evidence_type = classEvidence.type;
  result.class_evidence_url = classEvidence.url;
  result.class_evidence_snippet = classEvidence.snippet;
  result.personalised_opening = personalisedOpening(row, classEvidence);
  result.crawl_status = "checked";
  return result;
}

async function fetchCandidateSchools() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("schools")
      .select(
        "urn,name,la_name,phase_name,type_name,status_name,statutory_low_age,statutory_high_age,school_capacity,number_of_pupils,street,locality,town,county,postcode,website,telephone,head_title,head_first_name,head_last_name",
      )
      .eq("status_name", "Open")
      .eq("phase_name", "Primary")
      .not("number_of_pupils", "is", null)
      .lte("number_of_pupils", 240)
      .range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all
    .map((school) => {
      const analysis = analyseSchool(school);
      const headteacher = [school.head_title, school.head_first_name, school.head_last_name].filter(Boolean).join(" ");
      return {
        score: analysis.score,
        confidence: analysis.confidence,
        urn: school.urn,
        school_name: school.name,
        local_authority: school.la_name,
        phase: school.phase_name,
        type: school.type_name,
        nor: school.number_of_pupils,
        capacity: school.school_capacity,
        est_pupils_per_year: round1(analysis.pupilsPerYear),
        est_capacity_per_year: round1(analysis.capacityPerYear),
        est_form_entry: round1(analysis.formEntry),
        headteacher,
        telephone: school.telephone,
        website: school.website,
        address: [school.street, school.locality, school.town, school.county, school.postcode].filter(Boolean).join(", "),
        evidence: analysis.evidence.join("; "),
      };
    })
    .filter((school) => school.score >= 50)
    .sort((a, b) => b.score - a.score || Number(a.nor) - Number(b.nor))
    .slice(0, limit)
    .map((school, index) => ({ rank: index + 1, ...school }));
}

async function mapLimit(items, workerCount, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runWorker(workerIndex) {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      const item = items[currentIndex];
      const label = `${currentIndex + 1}/${items.length}`;
      console.error(`[${label}] ${item.school_name}`);
      try {
        results[currentIndex] = await worker(item, workerIndex);
      } catch (error) {
        results[currentIndex] = {
          ...item,
          best_email: "",
          best_email_type: "",
          email_source_url: "",
          all_public_emails: "",
          contact_urls_checked: "",
          class_evidence_found: "no",
          class_evidence_type: "",
          class_evidence_url: "",
          class_evidence_snippet: "",
          personalised_opening: `${item.school_name} looks like a small primary where mixed-age or uneven cohort class planning may be relevant.`,
          crawl_status: `error: ${error.message}`,
        };
      }
    }
  }
  await Promise.all(Array.from({ length: workerCount }, (_, index) => runWorker(index)));
  return results;
}

function outreachStatus(row) {
  if (!row.best_email) return "manual lookup - no usable public email found";
  if (row.best_email_type === "do-not-use") return "manual lookup - unsuitable role email only";
  if (row.class_evidence_found === "yes") return "ready - email and class-page evidence";
  return "ready - email and DfE inferred evidence";
}

function emailBody(row) {
  return [
    `Hi ${row.headteacher || "there"},`,
    "",
    row.personalised_opening,
    "",
    "A recent Schoolgle customer came to us with exactly this problem: building fair, balanced classes quickly when year groups do not divide neatly.",
    "",
    "So we built Class Builder, a focused mini-app for heads and teachers who need to organise mixed-year or uneven cohorts without doing the whole thing by spreadsheet.",
    "",
    "It can take into account the information schools already consider, such as pupil friendship preferences, SEND/EHCP, EAL, pupil premium, gender balance, attainment bands, behaviour notes and teacher judgement, then produce draft groupings that leaders can review and adjust.",
    "",
    "It does not decide classes for the school. It just makes the thinking quicker, clearer, easier to check, and easier to explain.",
    "",
    "Would it be useful if I sent a two-minute example using fictional pupil data and a mixed-age primary setup?",
    "",
    "Best,",
    "David",
    "Schoolgle",
  ].join("\n");
}

function writeOutputs(rows) {
  fs.mkdirSync(outDir, { recursive: true });
  const enriched = rows.map((row) => ({
    ...row,
    outreach_email: row.best_email,
    outreach_status: outreachStatus(row),
    subject_line:
      row.class_evidence_found === "yes"
        ? `Class building at ${row.school_name}`
        : "A small thing for mixed-age class planning",
    email_body: emailBody(row),
  }));

  const headers = Object.keys(enriched[0]);
  const allCsv = path.join(outDir, `${outPrefix}-all.csv`);
  const readyCsv = path.join(outDir, `${outPrefix}-ready.csv`);
  const manualCsv = path.join(outDir, `${outPrefix}-manual-lookup.csv`);
  fs.writeFileSync(allCsv, [headers.join(","), ...enriched.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n"));
  fs.writeFileSync(
    readyCsv,
    [
      headers.join(","),
      ...enriched
        .filter((row) => row.outreach_email)
        .map((row) => headers.map((header) => csvCell(row[header])).join(",")),
    ].join("\n"),
  );
  fs.writeFileSync(
    manualCsv,
    [
      headers.join(","),
      ...enriched
        .filter((row) => !row.outreach_email)
        .map((row) => headers.map((header) => csvCell(row[header])).join(",")),
    ].join("\n"),
  );

  const summary = [
    "# Class Builder Bulk Mailing List",
    "",
    `Generated ${new Date().toISOString().slice(0, 10)}.`,
    "",
    `- Total crawled: ${enriched.length}`,
    `- Ready to email: ${enriched.filter((row) => row.outreach_email).length}`,
    `- With public class evidence: ${enriched.filter((row) => row.class_evidence_found === "yes").length}`,
    `- Manual lookup: ${enriched.filter((row) => !row.outreach_email).length}`,
    "",
    "## Files",
    "",
    `- All rows: ${allCsv}`,
    `- Ready rows: ${readyCsv}`,
    `- Manual lookup: ${manualCsv}`,
    "",
    "## First Ready Rows",
    "",
    "| Rank | School | Headteacher | Email | Status | Evidence |",
    "|---:|---|---|---|---|---|",
    ...enriched
      .filter((row) => row.outreach_email)
      .slice(0, 30)
      .map(
        (row) =>
          `| ${row.rank} | ${row.school_name} | ${row.headteacher} | ${row.outreach_email} | ${row.outreach_status} | ${row.personalised_opening.replace(/\|/g, "/")} |`,
      ),
  ].join("\n");
  const summaryMd = path.join(outDir, `${outPrefix}-summary.md`);
  fs.writeFileSync(summaryMd, summary);
  return { allCsv, readyCsv, manualCsv, summaryMd, enriched };
}

const candidates = await fetchCandidateSchools();
console.error(`Loaded ${candidates.length} ranked prospects. Crawling with concurrency ${concurrency}.`);
const enriched = await mapLimit(candidates, concurrency, async (school) => ({ ...school, ...(await enrichSchool(school)) }));
const outputs = writeOutputs(enriched);
console.log(
  JSON.stringify(
    {
      total: outputs.enriched.length,
      ready: outputs.enriched.filter((row) => row.outreach_email).length,
      classEvidence: outputs.enriched.filter((row) => row.class_evidence_found === "yes").length,
      manualLookup: outputs.enriched.filter((row) => !row.outreach_email).length,
      allCsv: outputs.allCsv,
      readyCsv: outputs.readyCsv,
      manualCsv: outputs.manualCsv,
      summaryMd: outputs.summaryMd,
    },
    null,
    2,
  ),
);
