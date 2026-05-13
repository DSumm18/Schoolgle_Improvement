# GIAS Extended SEN Provision Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, source-labelled pipeline that imports and reconciles GIAS SEN provision details for any school/trust/LA by URN.

**Architecture:** Add a dedicated `school_gias_extended_profiles` warehouse table, a small parser/reconciliation library, a protected API route, and Trust Assessor integration. The official GIAS/export source is preferred; live GIAS page parsing is fallback; DfE SEN school-level data is used as a consistency check rather than a fake source for provision type.

**Tech Stack:** Supabase Postgres migrations, Next.js API routes, TypeScript, Vitest, existing Schoolgle auth/API helpers.

---

## File Map

- Create `apps/platform/supabase/migrations/20260506_school_gias_extended_profiles.sql` — new table, indexes, RLS-friendly grants.
- Create `apps/platform/src/lib/dfe/gias-extended-profile.ts` — types, parser, normalisers, reconciliation logic.
- Create `apps/platform/src/lib/dfe/gias-extended-profile.test.ts` — parser and reconciliation tests.
- Create `apps/platform/src/app/api/dfe/gias-extended-profiles/route.ts` — fetch profiles by organisation tree.
- Create `apps/platform/src/app/api/dfe/gias-extended-profiles/route.test.ts` — scoped route test.
- Modify `apps/platform/src/app/api/trust-analysis/public-data-report/route.ts` — join extended profiles into report output.
- Modify `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx` — type and render confidence/source-labelled provision insight.
- Modify `docs/DFE_INTEGRATION_SETUP.md` — document source priority and fields.

Do not commit automatically. The user did not ask for a commit.

---

## Task 1: Add Warehouse Table

**Files:**
- Create: `apps/platform/supabase/migrations/20260506_school_gias_extended_profiles.sql`

- [ ] **Step 1: Create migration**

```sql
create table if not exists public.school_gias_extended_profiles (
  urn integer primary key,
  school_name text,
  sen_provision_type text,
  resourced_provision_type text,
  resourced_provision_on_roll integer,
  resourced_provision_capacity integer,
  sen_unit_on_roll integer,
  sen_unit_capacity integer,
  gias_last_confirmed date,
  source_url text not null,
  source_method text not null check (source_method in ('bulk_export', 'gias_page_scrape', 'manual_verified')),
  source_fetched_at timestamptz not null default now(),
  confidence_status text not null check (confidence_status in ('verified', 'missing', 'conflicting', 'stale', 'manual_verified')),
  validation_notes jsonb not null default '[]'::jsonb,
  raw_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_school_gias_extended_profiles_confidence
  on public.school_gias_extended_profiles(confidence_status);

create index if not exists idx_school_gias_extended_profiles_source_fetched_at
  on public.school_gias_extended_profiles(source_fetched_at);

alter table public.school_gias_extended_profiles enable row level security;

drop policy if exists "service role manages school gias extended profiles" on public.school_gias_extended_profiles;
create policy "service role manages school gias extended profiles"
  on public.school_gias_extended_profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select on public.school_gias_extended_profiles to authenticated;
grant all on public.school_gias_extended_profiles to service_role;
```

- [ ] **Step 2: Verify migration syntax**

Run: `Get-Content apps/platform/supabase/migrations/20260506_school_gias_extended_profiles.sql`

Expected: SQL above is present with no placeholder text.

---

## Task 2: Add Parser And Reconciliation Library

**Files:**
- Create: `apps/platform/src/lib/dfe/gias-extended-profile.ts`
- Create: `apps/platform/src/lib/dfe/gias-extended-profile.test.ts`

- [ ] **Step 1: Write tests first**

```ts
import { describe, expect, it } from "vitest";
import {
  parseGiasExtendedProfileHtml,
  reconcileGiasExtendedProfile,
} from "./gias-extended-profile";

const shawcloughHtml = `
<dl>
  <dt>Type of SEN provision</dt><dd>ASD - Autistic Spectrum Disorder and PMLD - Profound and Multiple Learning Difficulty</dd>
  <dt>Type of resourced provision</dt><dd>Resourced provision and SEN unit</dd>
  <dt>Resourced provision number on roll</dt><dd>7</dd>
  <dt>Resourced provision capacity</dt><dd>8</dd>
  <dt>Special Educational Needs (SEN) unit number on roll</dt><dd>21</dd>
  <dt>Special Educational Needs (SEN) unit capacity</dt><dd>20</dd>
  <dt>Date last changed / confirmed</dt><dd>22 January 2026</dd>
</dl>`;

describe("parseGiasExtendedProfileHtml", () => {
  it("extracts SEN provision fields from a GIAS details page", () => {
    const profile = parseGiasExtendedProfileHtml({
      urn: 105766,
      schoolName: "Shawclough Community Primary School",
      sourceUrl: "https://www.get-information-schools.service.gov.uk/establishments/establishment/details/105766",
      html: shawcloughHtml,
      fetchedAt: "2026-05-06T10:00:00.000Z",
    });

    expect(profile.sen_provision_type).toBe("ASD - Autistic Spectrum Disorder and PMLD - Profound and Multiple Learning Difficulty");
    expect(profile.resourced_provision_type).toBe("Resourced provision and SEN unit");
    expect(profile.resourced_provision_on_roll).toBe(7);
    expect(profile.resourced_provision_capacity).toBe(8);
    expect(profile.sen_unit_on_roll).toBe(21);
    expect(profile.sen_unit_capacity).toBe(20);
    expect(profile.gias_last_confirmed).toBe("2026-01-22");
  });

  it("marks missing provision fields instead of inventing values", () => {
    const profile = parseGiasExtendedProfileHtml({
      urn: 105765,
      schoolName: "Castleton Primary School",
      sourceUrl: "https://www.get-information-schools.service.gov.uk/establishments/establishment/details/105765",
      html: "<dl><dt>Type of resourced provision</dt><dd>Not recorded</dd></dl>",
      fetchedAt: "2026-05-06T10:00:00.000Z",
    });

    expect(profile.resourced_provision_type).toBeNull();
    expect(profile.confidence_status).toBe("missing");
  });
});

describe("reconcileGiasExtendedProfile", () => {
  it("verifies matching GIAS and SEN-file provision flags", () => {
    const result = reconcileGiasExtendedProfile(
      {
        urn: 105766,
        school_name: "Shawclough Community Primary School",
        resourced_provision_type: "Resourced provision and SEN unit",
        sen_provision_type: "ASD - Autistic Spectrum Disorder",
        resourced_provision_on_roll: 7,
        resourced_provision_capacity: 8,
        sen_unit_on_roll: 21,
        sen_unit_capacity: 20,
        confidence_status: "missing",
        validation_notes: [],
      },
      { urn: 105766, SEN_Unit: 1, RP_Unit: 1 },
    );

    expect(result.confidence_status).toBe("verified");
    expect(result.validation_notes).toContain("GIAS provision flags align with DfE SEN school-level file.");
  });

  it("flags conflicting provision indicators", () => {
    const result = reconcileGiasExtendedProfile(
      {
        urn: 105778,
        school_name: "Marland Hill Community Primary School",
        resourced_provision_type: "Resourced provision",
        sen_provision_type: "HI - Hearing Impairment",
        resourced_provision_on_roll: null,
        resourced_provision_capacity: null,
        sen_unit_on_roll: null,
        sen_unit_capacity: null,
        confidence_status: "missing",
        validation_notes: [],
      },
      { urn: 105778, SEN_Unit: 0, RP_Unit: 0 },
    );

    expect(result.confidence_status).toBe("conflicting");
    expect(result.validation_notes.join(" ")).toContain("GIAS indicates resourced provision");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd apps/platform; npx vitest run src/lib/dfe/gias-extended-profile.test.ts`

Expected: fails because `gias-extended-profile.ts` does not exist.

- [ ] **Step 3: Implement library**

```ts
export type GiasConfidenceStatus = "verified" | "missing" | "conflicting" | "stale" | "manual_verified";

export type GiasExtendedProfile = {
  urn: number;
  school_name: string;
  sen_provision_type: string | null;
  resourced_provision_type: string | null;
  resourced_provision_on_roll: number | null;
  resourced_provision_capacity: number | null;
  sen_unit_on_roll: number | null;
  sen_unit_capacity: number | null;
  gias_last_confirmed: string | null;
  source_url?: string;
  source_method?: "bulk_export" | "gias_page_scrape" | "manual_verified";
  source_fetched_at?: string;
  confidence_status: GiasConfidenceStatus;
  validation_notes: string[];
  raw_snapshot?: Record<string, unknown>;
};

export type SenSchoolLevelFlags = {
  urn: number;
  SEN_Unit?: number | null;
  RP_Unit?: number | null;
};

export function parseGiasExtendedProfileHtml(args: {
  urn: number;
  schoolName: string;
  sourceUrl: string;
  html: string;
  fetchedAt: string;
}): GiasExtendedProfile {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(dt|dd|div|p|li|tr|th|td|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]+/g, " ");

  const valueAfter = (label: string) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*\\n\\s*([^\\n]+)`, "i"));
    const value = match?.[1]?.trim();
    if (!value || value === "—" || /^not recorded$/i.test(value)) return null;
    return value;
  };

  const parseIntValue = (label: string) => {
    const value = valueAfter(label);
    if (!value) return null;
    const parsed = Number.parseInt(value.replace(/,/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const parseDate = (label: string) => {
    const value = valueAfter(label);
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  };

  const profile: GiasExtendedProfile = {
    urn: args.urn,
    school_name: args.schoolName,
    sen_provision_type: valueAfter("Type of SEN provision"),
    resourced_provision_type: valueAfter("Type of resourced provision"),
    resourced_provision_on_roll: parseIntValue("Resourced provision number on roll"),
    resourced_provision_capacity: parseIntValue("Resourced provision capacity"),
    sen_unit_on_roll: parseIntValue("Special Educational Needs (SEN) unit number on roll"),
    sen_unit_capacity: parseIntValue("Special Educational Needs (SEN) unit capacity"),
    gias_last_confirmed: parseDate("Date last changed / confirmed"),
    source_url: args.sourceUrl,
    source_method: "gias_page_scrape",
    source_fetched_at: args.fetchedAt,
    confidence_status: "missing",
    validation_notes: [],
    raw_snapshot: {},
  };

  const hasProvision =
    Boolean(profile.sen_provision_type) ||
    Boolean(profile.resourced_provision_type) ||
    profile.resourced_provision_on_roll !== null ||
    profile.sen_unit_on_roll !== null;
  profile.confidence_status = hasProvision ? "verified" : "missing";
  return profile;
}

export function reconcileGiasExtendedProfile(
  profile: GiasExtendedProfile,
  senFlags?: SenSchoolLevelFlags | null,
): GiasExtendedProfile {
  const notes = [...profile.validation_notes];
  if (!senFlags) {
    return { ...profile, confidence_status: profile.confidence_status === "verified" ? "verified" : "missing", validation_notes: notes };
  }

  const giasHasRp = /resourced provision/i.test(profile.resourced_provision_type ?? "");
  const giasHasSenUnit = /sen unit/i.test(profile.resourced_provision_type ?? "") || profile.sen_unit_on_roll !== null || profile.sen_unit_capacity !== null;
  const senFileHasRp = Number(senFlags.RP_Unit ?? 0) > 0;
  const senFileHasSenUnit = Number(senFlags.SEN_Unit ?? 0) > 0;

  if ((giasHasRp && !senFileHasRp) || (giasHasSenUnit && !senFileHasSenUnit)) {
    if (giasHasRp && !senFileHasRp) notes.push("GIAS indicates resourced provision but DfE SEN school-level file does not flag RP_Unit.");
    if (giasHasSenUnit && !senFileHasSenUnit) notes.push("GIAS indicates SEN unit but DfE SEN school-level file does not flag SEN_Unit.");
    return { ...profile, confidence_status: "conflicting", validation_notes: notes };
  }

  if ((senFileHasRp && !giasHasRp) || (senFileHasSenUnit && !giasHasSenUnit)) {
    if (senFileHasRp && !giasHasRp) notes.push("DfE SEN school-level file flags RP_Unit but GIAS provision type is missing.");
    if (senFileHasSenUnit && !giasHasSenUnit) notes.push("DfE SEN school-level file flags SEN_Unit but GIAS provision type is missing.");
    return { ...profile, confidence_status: "conflicting", validation_notes: notes };
  }

  if (giasHasRp || giasHasSenUnit || senFileHasRp || senFileHasSenUnit) {
    notes.push("GIAS provision flags align with DfE SEN school-level file.");
    return { ...profile, confidence_status: "verified", validation_notes: notes };
  }

  return { ...profile, confidence_status: "missing", validation_notes: notes };
}
```

- [ ] **Step 4: Run tests**

Run: `cd apps/platform; npx vitest run src/lib/dfe/gias-extended-profile.test.ts`

Expected: tests pass.

---

## Task 3: Add Protected API Route

**Files:**
- Create: `apps/platform/src/app/api/dfe/gias-extended-profiles/route.ts`
- Create: `apps/platform/src/app/api/dfe/gias-extended-profiles/route.test.ts`

- [ ] **Step 1: Implement route**

```ts
import { NextRequest } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function asUrn(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const organizationId = req.nextUrl.searchParams.get("organizationId") || auth.organizationId;
  if (!organizationId) return apiError("organizationId required", 400);

  const supabase = createServiceRoleClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .or(`user_id.eq.${auth.userId},auth_id.eq.${auth.userId}`)
    .maybeSingle();

  if (!membership) return apiError("Not authorised to view this organisation", 403);

  const { data: orgRows, error: orgError } = await supabase
    .from("organizations")
    .select("id,name,urn,parent_organization_id")
    .or(`id.eq.${organizationId},parent_organization_id.eq.${organizationId}`);

  if (orgError) return apiError(orgError.message, 500);

  const urns = Array.from(new Set((orgRows ?? []).map((row) => asUrn(row.urn)).filter((urn): urn is number => urn !== null)));
  if (urns.length === 0) return apiSuccess({ profiles: [], coverage: { urn_count: 0, profile_count: 0 } });

  const { data: profiles, error: profileError } = await supabase
    .from("school_gias_extended_profiles")
    .select("*")
    .in("urn", urns)
    .order("school_name");

  if (profileError) return apiError(profileError.message, 500);

  return apiSuccess({
    profiles: profiles ?? [],
    coverage: {
      urn_count: urns.length,
      profile_count: profiles?.length ?? 0,
      missing_count: urns.length - (profiles?.length ?? 0),
    },
  });
});
```

- [ ] **Step 2: Add route tests**

Create a Vitest test that mocks `protectedRoute` and `createServiceRoleClient`, verifies the route scopes URNs to the selected org tree, and only queries `school_gias_extended_profiles` for those URNs.

- [ ] **Step 3: Run route tests**

Run: `cd apps/platform; npx vitest run src/app/api/dfe/gias-extended-profiles/route.test.ts`

Expected: route test passes.

---

## Task 4: Feed Trust Assessor Public Report

**Files:**
- Modify: `apps/platform/src/app/api/trust-analysis/public-data-report/route.ts`

- [ ] **Step 1: Query extended profiles**

After `urns` is created, query:

```ts
const { data: giasExtendedRaw, error: giasExtendedError } = await supabase
  .from("school_gias_extended_profiles")
  .select("*")
  .in("urn", urns.length > 0 ? urns : [-1]);

if (giasExtendedError) return apiError(giasExtendedError.message, 500);

const giasExtendedByUrn = new Map(
  (giasExtendedRaw ?? []).map((profile) => [Number(profile.urn), profile] as const),
);
```

- [ ] **Step 2: Attach provision profile to every school**

Inside the `schools = reportOrgRows.map(...)` object, add:

```ts
const giasExtended = urn ? giasExtendedByUrn.get(urn) : null;
```

Return:

```ts
provision: giasExtended ? {
  sen_provision_type: giasExtended.sen_provision_type,
  resourced_provision_type: giasExtended.resourced_provision_type,
  resourced_provision_on_roll: giasExtended.resourced_provision_on_roll,
  resourced_provision_capacity: giasExtended.resourced_provision_capacity,
  sen_unit_on_roll: giasExtended.sen_unit_on_roll,
  sen_unit_capacity: giasExtended.sen_unit_capacity,
  confidence_status: giasExtended.confidence_status,
  validation_notes: giasExtended.validation_notes,
  source_url: giasExtended.source_url,
  source_fetched_at: giasExtended.source_fetched_at,
} : null,
```

- [ ] **Step 3: Update data quality notes**

Replace the current SEN note with:

```ts
`${schools.filter((school) => school.provision).length}/${schools.length} schools have extended GIAS SEN provision profiles; missing profiles are labelled rather than inferred.`
```

- [ ] **Step 4: Verify endpoint**

Run Rebecca login fetch:

```powershell
@'
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/platform/.env.local' });
require('dotenv').config({ path: '.env.local' });
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false }});
(async()=> {
  const login = await anon.auth.signInWithPassword({ email: 'r.craddock@rochdalecouncil.co.uk', password: 'david123' });
  const token = login.data.session.access_token;
  const res = await fetch('http://localhost:3000/api/trust-analysis/public-data-report?organizationId=00550909-a77e-45ea-9b8a-d814ba91e3a6', { headers: { authorization: `Bearer ${token}` }});
  const json = await res.json();
  console.log(JSON.stringify((json.data || json).schools.filter(s => s.provision).map(s => ({ name: s.name, provision: s.provision })), null, 2));
})();
'@ | node -
```

Expected after seed/import: Shawclough, Marland Hill and Boarshaw show provision profiles.

---

## Task 5: Add Seed/Import Utility For First Verified Profiles

**Files:**
- Create: `apps/platform/scripts/import-gias-extended-profiles.ts`

- [ ] **Step 1: Add script with explicit source URLs**

The first pass may seed verified Rochdale examples from GIAS pages already checked, but must mark `source_method = 'gias_page_scrape'` and retain source URLs.

```ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const rows = [
  {
    urn: 105766,
    school_name: "Shawclough Community Primary School",
    sen_provision_type: "ASD - Autistic Spectrum Disorder and PMLD - Profound and Multiple Learning Difficulty",
    resourced_provision_type: "Resourced provision and SEN unit",
    resourced_provision_on_roll: 7,
    resourced_provision_capacity: 8,
    sen_unit_on_roll: 21,
    sen_unit_capacity: 20,
    gias_last_confirmed: "2026-01-22",
    source_url: "https://www.get-information-schools.service.gov.uk/establishments/establishment/details/105766",
    source_method: "gias_page_scrape",
    confidence_status: "verified",
    validation_notes: ["Initial verified import from live GIAS page and DfE SEN school-level provision flags."],
    raw_snapshot: {},
  },
  {
    urn: 105778,
    school_name: "Marland Hill Community Primary School",
    sen_provision_type: "HI - Hearing Impairment",
    resourced_provision_type: "Resourced provision",
    resourced_provision_on_roll: null,
    resourced_provision_capacity: null,
    sen_unit_on_roll: null,
    sen_unit_capacity: null,
    gias_last_confirmed: "2025-11-10",
    source_url: "https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/105778",
    source_method: "gias_page_scrape",
    confidence_status: "verified",
    validation_notes: ["Initial verified import from live GIAS page and DfE SEN school-level provision flags."],
    raw_snapshot: {},
  },
  {
    urn: 105787,
    school_name: "Boarshaw Community Primary School",
    sen_provision_type: "SLCN - Speech, language and Communication and ASD - Autistic Spectrum Disorder",
    resourced_provision_type: "SEN unit",
    resourced_provision_on_roll: null,
    resourced_provision_capacity: null,
    sen_unit_on_roll: 24,
    sen_unit_capacity: 24,
    gias_last_confirmed: "2026-03-18",
    source_url: "https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/105787",
    source_method: "gias_page_scrape",
    confidence_status: "verified",
    validation_notes: ["Initial verified import from live GIAS page and DfE SEN school-level provision flags."],
    raw_snapshot: {},
  },
];

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.from("school_gias_extended_profiles").upsert(
    rows.map((row) => ({ ...row, source_fetched_at: new Date().toISOString(), updated_at: new Date().toISOString() })),
    { onConflict: "urn" },
  );
  if (error) throw error;
  console.log(`Imported ${rows.length} GIAS extended profiles`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Run utility only after migration exists**

Run: `cd apps/platform; npx tsx scripts/import-gias-extended-profiles.ts`

Expected: `Imported 3 GIAS extended profiles`.

---

## Task 6: Render Provision Insight In Trust Assessor

**Files:**
- Modify: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx`

- [ ] **Step 1: Extend `PublicDataSchoolReport` type**

Add:

```ts
provision?: {
  sen_provision_type: string | null;
  resourced_provision_type: string | null;
  resourced_provision_on_roll: number | null;
  resourced_provision_capacity: number | null;
  sen_unit_on_roll: number | null;
  sen_unit_capacity: number | null;
  confidence_status: "verified" | "missing" | "conflicting" | "stale" | "manual_verified";
  validation_notes: string[];
  source_url: string | null;
  source_fetched_at: string | null;
} | null;
```

- [ ] **Step 2: Render only verified/conflicting labelled claims**

In the school card, after the SEN/EAL line, render:

```tsx
{school.provision && (
  <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-xs text-emerald-950">
    <div className="font-semibold">
      SEN provision: {school.provision.sen_provision_type ?? school.provision.resourced_provision_type ?? "Provision recorded"}
    </div>
    <div>
      {school.provision.resourced_provision_type ?? "No resourced provision type recorded"}
      {school.provision.resourced_provision_capacity !== null && ` · RP capacity ${school.provision.resourced_provision_capacity}`}
      {school.provision.sen_unit_capacity !== null && ` · SEN unit capacity ${school.provision.sen_unit_capacity}`}
    </div>
    <div className="mt-1 uppercase tracking-wide text-emerald-700">
      Source confidence: {school.provision.confidence_status}
    </div>
  </div>
)}
```

- [ ] **Step 3: Avoid claims when missing**

Do not render a “no provision” claim unless the profile exists with a verified `Not recorded` source. Missing profile means “not imported yet”, not “none”.

---

## Task 7: Document The Source Contract

**Files:**
- Modify: `docs/DFE_INTEGRATION_SETUP.md`

- [ ] **Step 1: Add GIAS extended profile section**

Add:

```md
## GIAS Extended SEN Provision Profiles

Schoolgle stores provision-specific GIAS fields in `school_gias_extended_profiles`, keyed by URN.

Source priority:

1. Official GIAS bulk/export data when available.
2. Live GIAS establishment page scrape for fields not present in the current warehouse import.
3. DfE SEN school-level underlying data for validation of SEN unit/RP flags.
4. Manual verification only with explicit source URL and confidence status.

Trust Assessor must not infer provision type from pupil need counts alone. Provision claims must show confidence status and source.
```

- [ ] **Step 2: Verify docs**

Run: `Select-String -LiteralPath docs/DFE_INTEGRATION_SETUP.md -Pattern "GIAS Extended SEN Provision Profiles"`

Expected: one match.

---

## Final Verification

- [ ] Run parser tests:

`cd apps/platform; npx vitest run src/lib/dfe/gias-extended-profile.test.ts`

- [ ] Run route tests:

`cd apps/platform; npx vitest run src/app/api/dfe/gias-extended-profiles/route.test.ts`

- [ ] Verify public report endpoint shows PA `43/43` and provision profiles where imported.

- [ ] Verify no hardcoded school-specific provision claims exist in Trust Assessor page outside test fixtures or seed script.

