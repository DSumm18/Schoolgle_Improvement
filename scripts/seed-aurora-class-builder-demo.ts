import { createClient } from "@supabase/supabase-js";
import {
  buildDefaultDestinationClasses,
  classBuilderYearStorageAliases,
  generateClassGroups,
  parseClassBuilderSessionYearGroups,
  type ClassBuilderChoiceInput,
  type ClassBuilderPupil,
} from "../apps/platform/src/lib/class-builder";
import {
  buildPassIdentity,
  createPupilAccessToken,
  encryptPupilAccessToken,
  hashPupilAccessToken,
} from "../apps/platform/src/lib/pupil-pass";

type SeedPupil = ClassBuilderPupil & {
  pupil_id: string;
  is_pupil_premium: boolean;
  primary_need: string | null;
  fsm_eligible: boolean;
  token: string;
  pass_colour: string;
  pass_animal: string;
  pass_badge: string | null;
  pass_codename: string;
};

type CohortSpec = {
  year: string;
  className: string;
  count: number;
  keyStage: "EYFS" | "KS1" | "KS2";
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const AURORA_ORG_NAME = "Aurora Primary";
const ACADEMIC_YEAR = "2025-26";

const cohortSpecs: CohortSpec[] = [
  { year: "R", className: "Acorn", count: 42, keyStage: "EYFS" },
  { year: "1", className: "Birch", count: 36, keyStage: "KS1" },
  { year: "2", className: "Cedar", count: 43, keyStage: "KS1" },
  { year: "3", className: "Elm", count: 46, keyStage: "KS2" },
  { year: "4", className: "Maple", count: 44, keyStage: "KS2" },
  { year: "5", className: "Willow", count: 46, keyStage: "KS2" },
  { year: "6", className: "Oak", count: 43, keyStage: "KS2" },
];

const firstNames = [
  "Ari", "Bramble", "Cleo", "Dax", "Elowen", "Finch", "Goldie", "Huxley",
  "Indigo", "Juno", "Kip", "Lumi", "Marnie", "Nico", "Orla", "Pip",
  "Quinn", "Romy", "Scout", "Teddy", "Una", "Vesper", "Wren", "Xavi",
  "Yara", "Ziggy", "Alba", "Bodhi", "Clover", "Dexter", "Effie", "Felix",
  "Greta", "Harper", "Ivy", "Jasper", "Keira", "Luca", "Mabel", "Nova",
  "Otis", "Pearl", "Rafi", "Sienna", "Toby", "Violet", "Wilf", "Zara",
];

const lastNames = [
  "Bluebell", "Cloud", "Dandelion", "Evergreen", "Foxglove", "Glow", "Hawthorn",
  "Juniper", "Kingfisher", "Lantern", "Meadow", "Nightingale", "Oakley", "Pebble",
  "Quickwood", "River", "Starlight", "Thistle", "Umber", "Vale", "Willowby",
  "Yewtree", "Zephyr", "Bright", "Copper", "Fern", "Grove", "Holly", "Iris",
  "Lake", "Moss", "North", "Puddle", "Rain", "Snow", "Treetop", "Wilder",
];

const primaryNeeds = ["Speech and language", "Cognition and learning", "Social communication", "Sensory support"];

async function main() {
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id,name")
    .eq("name", AURORA_ORG_NAME)
    .single();

  if (orgError || !org) {
    throw new Error(`Could not find ${AURORA_ORG_NAME}: ${orgError?.message ?? "missing"}`);
  }

  await clearAuroraDemo(org.id);

  const pupils = buildDemoPupils();
  await insertClasses(org.id);
  const insertedPupils = await insertPupils(org.id, pupils);
  const sessions = await insertSessions(org.id);

  for (const session of sessions) {
    const cohortPupils = insertedPupils.filter((pupil) => {
      const aliases = classBuilderYearStorageAliases(
        parseClassBuilderSessionYearGroups(session.year_group),
      );
      return aliases.includes(String(pupil.year_group));
    });
    const choices = await insertResponsesAndChoices(session.id, cohortPupils);
    await insertGeneratedGroups(session.id, session.year_group, session.target_class_count, cohortPupils, choices);
  }

  const output = {
    organization: org.name,
    pupils: insertedPupils.length,
    classes: cohortSpecs.length,
    sessions: sessions.map((session) => ({
      title: session.title,
      code: session.survey_code,
      year_group: session.year_group,
      url: `https://www.schoolgle.co.uk/class-builder/s/${session.survey_code}`,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
}

async function clearAuroraDemo(organizationId: string) {
  await must(
    supabase.from("class_builder_sessions").delete().eq("organization_id", organizationId),
    "delete Aurora Class Builder sessions",
  );
  await must(supabase.from("pupils").delete().eq("organization_id", organizationId), "delete Aurora pupils");
  await must(supabase.from("ls_classes").delete().eq("organization_id", organizationId), "delete Aurora classes");
}

function buildDemoPupils(): SeedPupil[] {
  const usedCodenames = new Set<string>();
  const pupils: SeedPupil[] = [];
  let index = 0;

  for (const cohort of cohortSpecs) {
    for (let offset = 0; offset < cohort.count; offset += 1) {
      const pupil_id = `AUR-${String(index + 1).padStart(4, "0")}`;
      const first_name = firstNames[index % firstNames.length];
      const last_name = lastNames[(index * 7 + Math.floor(index / firstNames.length)) % lastNames.length];
      const token = createPupilAccessToken();
      const identity = buildPassIdentity(
        {
          pupil_id,
          pass_colour: null,
          pass_animal: null,
          pass_badge: index % 5 === 0 ? ["Star", "Moon", "Rocket", "Leaf", "Heart"][index % 5] : null,
        },
        usedCodenames,
      );
      const send = index % 3 === 0;
      const ehcp = index % 41 === 0;
      const eal = index % 13 === 0;
      const pupilPremium = index % 9 === 0;

      pupils.push({
        id: "",
        pupil_id,
        first_name,
        last_name,
        year_group: cohort.year,
        current_class: cohort.className,
        gender: index % 2 === 0 ? "F" : "M",
        send_status: ehcp ? "E" : send ? "K" : null,
        ehcp,
        is_eal: eal,
        is_pupil_premium: pupilPremium,
        primary_need: send ? primaryNeeds[index % primaryNeeds.length] : null,
        fsm_eligible: index % 12 === 0,
        token,
        pass_colour: identity.colour,
        pass_animal: identity.animal,
        pass_badge: identity.badge,
        pass_codename: identity.codename,
      });
      index += 1;
    }
  }

  return pupils;
}

async function insertClasses(organizationId: string) {
  const rows = cohortSpecs.map((cohort) => ({
    organization_id: organizationId,
    year_group: cohort.year === "R" ? "Reception" : `Year ${cohort.year}`,
    class_name: cohort.className,
    key_stage: cohort.keyStage,
    room: `Room ${cohort.className}`,
    pupil_count: cohort.count,
    academic_year: ACADEMIC_YEAR,
  }));

  await must(supabase.from("ls_classes").insert(rows), "insert Aurora classes");
}

async function insertPupils(organizationId: string, pupils: SeedPupil[]) {
  const rows = pupils.map((pupil) => ({
    organization_id: organizationId,
    pupil_id: pupil.pupil_id,
    pupil_ref: pupil.pupil_id,
    first_name: pupil.first_name,
    last_name: pupil.last_name,
    year_group: pupil.year_group,
    current_class: pupil.current_class,
    class_name: pupil.current_class,
    gender: pupil.gender,
    send_status: pupil.send_status,
    sen_status: pupil.send_status,
    ehcp: pupil.ehcp,
    has_send_support: Boolean(pupil.send_status),
    is_eal: pupil.is_eal,
    is_pupil_premium: pupil.is_pupil_premium,
    primary_need: pupil.primary_need,
    fsm_eligible: pupil.fsm_eligible,
    is_active: true,
    import_source: "aurora_demo_seed",
    imported_at: new Date().toISOString(),
    pass_colour: pupil.pass_colour,
    pass_animal: pupil.pass_animal,
    pass_badge: pupil.pass_badge,
    pass_codename: pupil.pass_codename,
    pupil_access_token_hash: hashPupilAccessToken(pupil.token),
    pupil_access_token_encrypted: encryptPupilAccessToken(pupil.token),
  }));

  const { data, error } = await supabase.from("pupils").insert(rows).select("*");
  if (error) throw new Error(`insert Aurora pupils: ${error.message}`);
  return (data ?? []).map((row: any, index) => ({
    ...pupils[index],
    id: row.id,
  }));
}

async function insertSessions(organizationId: string) {
  const rows = [
    {
      organization_id: organizationId,
      title: "Aurora Class Builder - Reception + Year 1",
      year_group: "R,1",
      target_class_count: 3,
      status: "open",
      survey_code: "AURR1Y1A",
    },
    {
      organization_id: organizationId,
      title: "Aurora Class Builder - Year 2 + Year 3",
      year_group: "2,3",
      target_class_count: 3,
      status: "open",
      survey_code: "AURY2Y3A",
    },
    {
      organization_id: organizationId,
      title: "Aurora Class Builder - Year 4 + Year 5",
      year_group: "4,5",
      target_class_count: 3,
      status: "open",
      survey_code: "AURY4Y5A",
    },
  ];

  const { data, error } = await supabase
    .from("class_builder_sessions")
    .insert(rows)
    .select("id,title,year_group,target_class_count,survey_code");
  if (error) throw new Error(`insert Aurora sessions: ${error.message}`);
  return data ?? [];
}

async function insertResponsesAndChoices(sessionId: string, pupils: SeedPupil[]) {
  const responseRows = pupils.map((pupil) => ({
    session_id: sessionId,
    pupil_id: pupil.id,
    submitted_at: new Date(Date.now() - 1000 * 60 * (pupils.length - pupils.indexOf(pupil))).toISOString(),
  }));
  const { data: responses, error: responseError } = await supabase
    .from("class_builder_responses")
    .insert(responseRows)
    .select("id,pupil_id");
  if (responseError) throw new Error(`insert Aurora responses: ${responseError.message}`);

  const responseByPupilId = new Map((responses ?? []).map((response: any) => [response.pupil_id, response.id]));
  const choices: ClassBuilderChoiceInput[] = [];
  const ordered = [...pupils].sort((a, b) => `${a.current_class}-${a.first_name}`.localeCompare(`${b.current_class}-${b.first_name}`));
  const popular = ordered.filter((_, index) => index % 17 === 0).map((pupil) => pupil.id);

  for (const [index, pupil] of ordered.entries()) {
    const sameYear = ordered.filter((candidate) => candidate.year_group === pupil.year_group && candidate.id !== pupil.id);
    const otherYear = ordered.filter((candidate) => candidate.year_group !== pupil.year_group && candidate.id !== pupil.id);
    const friendIds = uniqueIds([
      sameYear[(index + 1) % sameYear.length]?.id,
      sameYear[(index + 5) % sameYear.length]?.id,
      popular[index % popular.length],
    ]).filter((id) => id !== pupil.id).slice(0, 3);
    const workIds = uniqueIds([
      otherYear[index % otherYear.length]?.id,
      sameYear[(index + 11) % sameYear.length]?.id,
      otherYear[(index + 7) % otherYear.length]?.id,
    ]).filter((id) => id !== pupil.id && !friendIds.includes(id)).slice(0, 3);

    friendIds.forEach((chosenId, rank) => {
      choices.push({ chooser_pupil_id: pupil.id, chosen_pupil_id: chosenId, choice_type: "friendship", rank: rank + 1 });
    });
    workIds.forEach((chosenId, rank) => {
      choices.push({ chooser_pupil_id: pupil.id, chosen_pupil_id: chosenId, choice_type: "work_well", rank: rank + 1 });
    });
  }

  const choiceRows = choices.map((choice) => ({
    response_id: responseByPupilId.get(choice.chooser_pupil_id),
    chooser_pupil_id: choice.chooser_pupil_id,
    chosen_pupil_id: choice.chosen_pupil_id,
    choice_type: choice.choice_type,
    rank: choice.rank,
  }));

  await must(supabase.from("class_builder_choices").insert(choiceRows), "insert Aurora choices");
  return choices;
}

async function insertGeneratedGroups(
  sessionId: string,
  yearGroup: string,
  targetClassCount: number,
  pupils: SeedPupil[],
  choices: ClassBuilderChoiceInput[],
) {
  const result = generateClassGroups({
    pupils,
    choices,
    targetClassCount,
    destinationClasses: buildDefaultDestinationClasses(yearGroup, targetClassCount),
  });

  await must(
    supabase.from("generated_class_groups").insert(
      result.groups.map((group) => ({
        session_id: sessionId,
        name: group.name,
        pupil_ids: group.pupilIds,
        summary: {
          ...group.summary,
          explanation: result.summary,
        },
      })),
    ),
    "insert Aurora generated groups",
  );
}

function uniqueIds(ids: Array<string | undefined>) {
  return [...new Set(ids.filter(Boolean) as string[])];
}

async function must<T>(promise: PromiseLike<{ data: T | null; error: any }>, label: string) {
  const { error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
