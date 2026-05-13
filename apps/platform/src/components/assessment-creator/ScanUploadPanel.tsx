"use client";

import type { ScanPageMatch } from "@/lib/assessment-creator/types";

interface ScanUploadPanelProps {
  uploading: boolean;
  matches: ScanPageMatch[];
  onUpload: (fileName: string) => void;
}

export function ScanUploadPanel({ uploading, matches, onUpload }: ScanUploadPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground">Upload completed papers</h2>
      <p className="mt-1 text-sm text-gray-600">
        Scan the paper pack, then let Schoolgle match each QR-coded page before the teacher reviews any proposed marks.
      </p>

      <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50 px-6 py-10 text-center">
        <span className="text-sm font-semibold text-blue-950">{uploading ? "Matching papers..." : "Upload scan batch"}</span>
        <span className="mt-1 text-xs text-blue-800">One PDF from the copier, or photos from a tablet</span>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file.name);
          }}
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-sky-950">Testing the prototype?</p>
          <p className="text-xs text-sky-800">Use a sample scanned batch so we can walk the full teacher approval journey today.</p>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => onUpload("sample-year-5-maths-scan-batch.pdf")}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Use sample scanned batch
        </button>
      </div>

      {matches.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground">Matched pages</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {matches.map((match) => (
              <div key={match.pageId} className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-medium text-emerald-950">{match.pageId}</p>
                <p className="text-xs text-emerald-800">Pseudonym: {match.pupilHash}</p>
                <p className="text-xs text-emerald-800">Status: {match.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
