"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";

type ImportStatus =
  | "complete"
  | "error"
  | "skipped_no_records"
  | "skipped_duplicate"
  | "dry_run";

interface ImportResult {
  file_name: string;
  status: ImportStatus;
  assessment_type?: string;
  years?: number[];
  pupil_count?: number;
  record_count?: number;
  inserted_count?: number;
  duplicate_of?: string | null;
  warnings?: string[];
  error?: string;
}

interface ImportResponse {
  plan?: {
    summary: {
      totalFiles: number;
      importableFiles: number;
      duplicateFiles: number;
      emptyFiles: number;
    };
  };
  summary?: {
    files_processed: number;
    files_complete: number;
    files_errored: number;
    files_skipped_duplicate?: number;
    total_records_inserted: number;
    dry_run: boolean;
    source: string;
  };
  imports?: ImportResult[];
}

function statusLabel(status: ImportStatus): string {
  switch (status) {
    case "complete":
      return "Imported";
    case "dry_run":
      return "Ready";
    case "skipped_duplicate":
      return "Duplicate";
    case "skipped_no_records":
      return "No records";
    case "error":
      return "Error";
  }
}

export default function CtfImportPage() {
  const { organization } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const selectedSummary = useMemo(() => {
    const xmlFiles = files.filter((file) =>
      file.name.toLowerCase().endsWith(".xml"),
    );
    return {
      total: files.length,
      xml: xmlFiles.length,
      nonXml: files.length - xmlFiles.length,
    };
  }, [files]);

  async function submitImport(dryRun: boolean) {
    setBusy(true);
    setError(null);

    try {
      const formData = new FormData();
      for (const file of files) {
        if (file.name.toLowerCase().endsWith(".xml")) {
          formData.append("files", file, file.name);
        }
      }
      formData.append("dryRun", dryRun ? "true" : "false");

      const response = await fetch("/api/imports/assessment-xml", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error ?? "CTF import failed");
      }

      setResult(payload.data ?? payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "CTF import failed");
    } finally {
      setBusy(false);
    }
  }

  const isSchoolOrg = organization?.organization_type === "school";
  const canSubmit = selectedSummary.xml > 0 && !busy;
  const canImport = canSubmit && isSchoolOrg;

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Assessment imports
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          Upload CTF XML files
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Upload all Foundation, Phonics, KS1 and KS2 CTF XML exports for the
          currently selected school. Schoolgle will infer the assessment type,
          spot repeated exports, show a dry-run plan, and only then import the
          pseudonymised pupil assessment records.
        </p>
        <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="font-semibold text-foreground">
            Current import target: {organization?.name ?? "Loading..."}
          </div>
          <div className="mt-1 text-muted-foreground">
            {isSchoolOrg
              ? "This is a school-level workspace, so imports can be written here after a dry-run."
              : "This is a trust-level workspace. You can dry-run files here, but switch to the individual school in the sidebar before importing."}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <label className="block text-sm font-medium text-foreground">
          Choose CTF XML files
        </label>
        <input
          className="mt-3 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700"
          multiple
          accept=".xml,text/xml,application/xml"
          type="file"
          onChange={(event) => {
            setFiles(Array.from(event.target.files ?? []));
            setResult(null);
            setError(null);
          }}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span>{selectedSummary.xml} XML file(s) selected</span>
          {selectedSummary.nonXml > 0 ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              {selectedSummary.nonXml} non-XML file(s) ignored
            </span>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() => submitImport(true)}
            type="button"
          >
            {busy ? "Checking..." : "Dry run first"}
          </button>
          <button
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canImport}
            onClick={() => submitImport(false)}
            type="button"
          >
            {busy ? "Importing..." : "Import selected files"}
          </button>
        </div>
        {!isSchoolOrg ? (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            Select the individual school first using the organisation switcher
            in the left sidebar. CTFs should not be imported into the trust
            overview.
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>

      {result ? (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Import plan
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {result.summary?.dry_run
                  ? "No records were written. Review this plan, then import."
                  : "Import completed using the checked plan."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="font-bold text-foreground">
                  {result.plan?.summary.totalFiles ?? result.summary?.files_processed ?? 0}
                </div>
                <div className="text-slate-500">Files</div>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <div className="font-bold text-green-700">
                  {result.plan?.summary.importableFiles ?? result.summary?.files_complete ?? 0}
                </div>
                <div className="text-green-700">Usable</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <div className="font-bold text-amber-700">
                  {result.plan?.summary.duplicateFiles ??
                    result.summary?.files_skipped_duplicate ??
                    0}
                </div>
                <div className="text-amber-700">Duplicates</div>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <div className="font-bold text-blue-700">
                  {result.summary?.total_records_inserted ?? 0}
                </div>
                <div className="text-blue-700">Inserted</div>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Years</th>
                  <th className="px-4 py-3">Pupils</th>
                  <th className="px-4 py-3">Records</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(result.imports ?? []).map((item) => (
                  <tr key={item.file_name}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.file_name}
                      {item.duplicate_of ? (
                        <div className="text-xs text-amber-700">
                          Same content as {item.duplicate_of}
                        </div>
                      ) : null}
                      {item.error ? (
                        <div className="text-xs text-red-700">{item.error}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700">
                      {item.assessment_type ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.years?.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.pupil_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.record_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {statusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
