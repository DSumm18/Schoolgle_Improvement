import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const envPath of [".env.local", ".env", "apps/platform/.env.local", "apps/platform/.env"]) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

const args = new Set(process.argv.slice(2));
const applySafe = args.has("--apply-safe");
const jsonOutput = args.has("--json");

const STOP_WORDS = new Set([
  "school",
  "primary",
  "academy",
  "the",
  "and",
  "of",
  "co",
  "c",
  "e",
  "ce",
  "church",
  "england",
  "voluntary",
  "controlled",
  "aided",
  "community",
]);

function normalizePostcode(value) {
  return (value ?? "").toUpperCase().replace(/\s+/g, "");
}

function normalizeName(value) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token))
    .join(" ");
}

function similarity(left, right) {
  const leftTokens = new Set(normalizeName(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalizeName(right).split(" ").filter(Boolean));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }
  return intersection / Math.max(leftTokens.size, rightTokens.size);
}

function statusFor(org, dfeSchool) {
  if (!org.urn) return "missing_urn";
  if (!dfeSchool) return "urn_not_found";
  const orgPostcode = normalizePostcode(org.address?.postcode);
  const dfePostcode = normalizePostcode(dfeSchool.postcode);
  const nameScore = similarity(org.name, dfeSchool.name);
  const nameMatch = nameScore >= 0.45;
  const postcodeMatch = !!orgPostcode && !!dfePostcode && orgPostcode === dfePostcode;
  if (!nameMatch && !postcodeMatch) return "mismatch";
  if (!nameMatch || !postcodeMatch) return "warning";
  return "valid";
}

async function findCandidates(supabase, org, storedUrn) {
  const candidates = new Map();
  const orgPostcode = normalizePostcode(org.address?.postcode);

  if (org.address?.postcode) {
    const { data } = await supabase
      .from("schools")
      .select("urn,name,postcode,la_name,type_name,status_name")
      .eq("postcode", org.address.postcode)
      .limit(10);

    for (const row of data ?? []) {
      if (Number(row.urn) === storedUrn) continue;
      const score = similarity(org.name, row.name);
      candidates.set(row.urn, {
        ...row,
        score,
        samePostcode: normalizePostcode(row.postcode) === orgPostcode,
      });
    }
  }

  for (const term of normalizeName(org.name).split(" ").filter((token) => token.length >= 5).slice(0, 3)) {
    const { data } = await supabase
      .from("schools")
      .select("urn,name,postcode,la_name,type_name,status_name")
      .ilike("name", `%${term}%`)
      .limit(20);

    for (const row of data ?? []) {
      if (Number(row.urn) === storedUrn) continue;
      const score = similarity(org.name, row.name);
      if (score < 0.45 && normalizePostcode(row.postcode) !== orgPostcode) continue;
      candidates.set(row.urn, {
        ...row,
        score,
        samePostcode: normalizePostcode(row.postcode) === orgPostcode,
      });
    }
  }

  return [...candidates.values()]
    .sort((left, right) => Number(right.samePostcode) - Number(left.samePostcode) || right.score - left.score)
    .slice(0, 5);
}

function safeCorrection(issue) {
  const candidate = issue.candidates[0];
  if (!candidate) return null;
  if (issue.status !== "mismatch" && issue.status !== "urn_not_found") return null;
  if (!candidate.samePostcode || candidate.score < 0.9) return null;
  return candidate;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: organizations, error } = await supabase
  .from("organizations")
  .select("id,name,urn,address,local_authority,school_type,organization_type,parent_organization_id")
  .not("urn", "is", null)
  .order("created_at");

if (error) throw error;

const issues = [];

for (const org of organizations ?? []) {
  const storedUrn = Number(org.urn);
  const { data: dfeSchool } = Number.isFinite(storedUrn)
    ? await supabase
        .from("schools")
        .select("urn,name,postcode,la_name,type_name,status_name")
        .eq("urn", storedUrn)
        .maybeSingle()
    : { data: null };

  const status = statusFor(org, dfeSchool);
  if (status === "valid") continue;

  const candidates = await findCandidates(supabase, org, storedUrn);
  issues.push({
    id: org.id,
    name: org.name,
    status,
    storedUrn: org.urn,
    orgPostcode: org.address?.postcode ?? null,
    dfeSchool,
    candidates,
  });
}

const safeCorrections = issues
  .map((issue) => ({ issue, correction: safeCorrection(issue) }))
  .filter((entry) => entry.correction);

const applied = [];

if (applySafe) {
  for (const { issue, correction } of safeCorrections) {
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        urn: String(correction.urn),
        school_type: correction.type_name ?? undefined,
        local_authority: correction.la_name ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issue.id);

    if (updateError) throw updateError;
    applied.push({
      id: issue.id,
      name: issue.name,
      fromUrn: issue.storedUrn,
      toUrn: correction.urn,
      dfeName: correction.name,
    });
  }
}

const result = {
  checked: organizations?.length ?? 0,
  counts: issues.reduce((acc, issue) => {
    acc[issue.status] = (acc[issue.status] ?? 0) + 1;
    return acc;
  }, {}),
  safeCorrections: safeCorrections.map(({ issue, correction }) => ({
    id: issue.id,
    name: issue.name,
    fromUrn: issue.storedUrn,
    toUrn: correction.urn,
    dfeName: correction.name,
    postcode: correction.postcode,
  })),
  applied,
  unresolved: issues
    .filter((issue) => !safeCorrection(issue))
    .map((issue) => ({
      id: issue.id,
      name: issue.name,
      status: issue.status,
      storedUrn: issue.storedUrn,
      dfeName: issue.dfeSchool?.name ?? null,
      note:
        issue.status === "warning"
          ? "Stored URN/name match, but organization postcode is missing or incomplete."
          : "Not safe to auto-correct without human review.",
    })),
};

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Checked ${result.checked} organizations.`);
  console.log(`Issues: ${JSON.stringify(result.counts)}`);
  console.log(`Safe corrections: ${result.safeCorrections.length}`);
  for (const correction of result.safeCorrections) {
    console.log(`  ${correction.name}: ${correction.fromUrn} -> ${correction.toUrn} (${correction.dfeName}, ${correction.postcode})`);
  }
  if (applySafe) {
    console.log(`Applied corrections: ${result.applied.length}`);
  } else {
    console.log("Dry run only. Re-run with --apply-safe to apply high-confidence corrections.");
  }
}
