export type ReconciliationPupil = {
  pupil_id: string;
  source_pupil_ref?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  year_group?: string | null;
  current_class?: string | null;
  class_name?: string | null;
  is_active?: boolean | null;
};

export type PupilImportChange = {
  field: "first_name" | "last_name" | "year_group" | "current_class";
  before: string | null;
  after: string | null;
};

export type PupilImportReconciliation = {
  matched: Array<{
    existing_pupil_id: string;
    imported_pupil_id: string;
    match_key: "pupil_id" | "source_pupil_ref";
  }>;
  changed: Array<{
    pupil_id: string;
    changes: PupilImportChange[];
  }>;
  newPupils: ReconciliationPupil[];
  archiveCandidates: Array<ReconciliationPupil & { reason: "not_in_latest_import" }>;
  deleteCandidates: [];
};

export function buildPupilImportReconciliation({
  existingPupils,
  importedPupils,
}: {
  existingPupils: ReconciliationPupil[];
  importedPupils: ReconciliationPupil[];
}): PupilImportReconciliation {
  const existingByPupilId = new Map(existingPupils.map((pupil) => [pupil.pupil_id, pupil]));
  const existingBySourceRef = new Map(
    existingPupils
      .filter((pupil) => normaliseKey(pupil.source_pupil_ref))
      .map((pupil) => [normaliseKey(pupil.source_pupil_ref), pupil]),
  );
  const matchedExistingIds = new Set<string>();
  const matched: PupilImportReconciliation["matched"] = [];
  const changed: PupilImportReconciliation["changed"] = [];
  const newPupils: ReconciliationPupil[] = [];

  for (const imported of importedPupils) {
    const byPupilId = existingByPupilId.get(imported.pupil_id);
    const bySourceRef = existingBySourceRef.get(normaliseKey(imported.source_pupil_ref));
    const existing = byPupilId ?? bySourceRef;

    if (!existing) {
      newPupils.push(imported);
      continue;
    }

    matchedExistingIds.add(existing.pupil_id);
    matched.push({
      existing_pupil_id: existing.pupil_id,
      imported_pupil_id: imported.pupil_id,
      match_key: byPupilId ? "pupil_id" : "source_pupil_ref",
    });

    const changes = changedFields(existing, imported);
    if (changes.length > 0) changed.push({ pupil_id: existing.pupil_id, changes });
  }

  const archiveCandidates = existingPupils
    .filter((pupil) => pupil.is_active !== false)
    .filter((pupil) => !matchedExistingIds.has(pupil.pupil_id))
    .map((pupil) => ({ ...pupil, reason: "not_in_latest_import" as const }));

  return {
    matched,
    changed,
    newPupils,
    archiveCandidates,
    deleteCandidates: [],
  };
}

function changedFields(existing: ReconciliationPupil, imported: ReconciliationPupil) {
  const fields: Array<PupilImportChange["field"]> = ["first_name", "last_name", "year_group", "current_class"];
  return fields
    .map((field) => ({
      field,
      before: field === "current_class" ? clean(existing.current_class ?? existing.class_name) : clean(existing[field]),
      after: field === "current_class" ? clean(imported.current_class ?? imported.class_name) : clean(imported[field]),
    }))
    .filter((change) => change.before !== change.after);
}

function clean(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normaliseKey(value: string | null | undefined) {
  return clean(value)?.toUpperCase() ?? "";
}
