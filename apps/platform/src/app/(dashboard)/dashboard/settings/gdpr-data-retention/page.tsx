"use client";

import Link from "next/link";
import { AlertTriangle, Archive, Database, Download, FileClock, ShieldCheck, Trash2 } from "lucide-react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/SupabaseAuthContext";

type RetentionDataset = {
  id: string;
  import_type: string;
  source_label: string | null;
  source_filename: string | null;
  academic_year: string | null;
  is_current: boolean;
  total_rows: number;
  imported_rows: number;
  archive_candidate_rows: number;
  created_at: string;
};

type RetentionCohort = {
  yearGroup: string;
  total: number;
  current: number;
  archiveCandidates: number;
  archived: number;
  inactive: number;
};

type RetentionResponse = {
  setupRequired?: boolean;
  message?: string;
  datasets: RetentionDataset[];
  cohorts: RetentionCohort[];
};

export default function GDPRDataRetentionPage() {
  const { organizationId, session } = useAuth();
  const token = session?.access_token;
  const { data, isLoading } = useSWR<RetentionResponse>(
    organizationId && token ? ["/api/settings/gdpr-data-retention", token] : null,
    async ([url, accessToken]: [string, string]) => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard/settings" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
            <FileClock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">GDPR Data Retention</h1>
            <p className="text-sm text-muted-foreground">
              Review imported pupil datasets, archive leaver cohorts, and plan export/anonymise/delete actions.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/70">
        <CardContent className="flex gap-3 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Deletion is permanent.</p>
            <p>
              Once identifiable pupil data is deleted, Schoolgle cannot report on those pupils individually or restore
              the records unless the school re-imports them from source files. Export first where you need an offline
              retention record.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading retention data…</CardContent>
        </Card>
      ) : data?.setupRequired ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{data.message}</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Archive className="h-5 w-5" />
                Year Group Data Sets
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Year group</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Current</th>
                    <th className="py-2">Archive candidates</th>
                    <th className="py-2">Archived</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.cohorts ?? []).map((cohort) => (
                    <tr key={cohort.yearGroup} className="border-b last:border-0">
                      <td className="py-3 font-medium">{cohort.yearGroup}</td>
                      <td className="py-3">{cohort.total}</td>
                      <td className="py-3">{cohort.current}</td>
                      <td className="py-3">
                        {cohort.archiveCandidates > 0 ? (
                          <Badge className="bg-amber-100 text-amber-800">{cohort.archiveCandidates} review</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-3">{cohort.archived}</td>
                      <td className="flex flex-wrap gap-2 py-3">
                        <Button variant="outline" size="sm">
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm">
                          <Archive className="mr-1.5 h-3.5 w-3.5" />
                          Archive
                        </Button>
                        <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(data?.cohorts ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        No pupil datasets have been imported yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5" />
                Recent Pupil Imports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.datasets ?? []).map((dataset) => (
                <div key={dataset.id} className="flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{dataset.source_label || dataset.source_filename || "Pupil import"}</p>
                      {dataset.is_current && <Badge className="bg-green-100 text-green-700">Current</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dataset.academic_year || "No academic year"} · {dataset.imported_rows}/{dataset.total_rows} rows · {new Date(dataset.created_at).toLocaleString()}
                    </p>
                  </div>
                  {dataset.archive_candidate_rows > 0 && (
                    <Badge className="w-fit bg-amber-100 text-amber-800">{dataset.archive_candidate_rows} archive candidates</Badge>
                  )}
                </div>
              ))}
              {(data?.datasets ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No import versions recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-cyan-200">
            <CardContent className="flex gap-3 p-4 text-sm text-cyan-950">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
              <p>
                Action buttons are intentionally surfaced here with the safety model visible. Archive should be reversible;
                delete and anonymise require a second confirmation and should create a retention audit event.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
