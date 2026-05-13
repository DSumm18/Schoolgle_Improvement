import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Gauge,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAiModelRegistryByArea,
  getAiModelRegistrySummary,
} from "@/lib/ai/model-registry";

const costStyles: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-rose-100 text-rose-700 border-rose-200",
};

const qualityStyles: Record<string, string> = {
  fast: "bg-sky-100 text-sky-700 border-sky-200",
  balanced: "bg-indigo-100 text-indigo-700 border-indigo-200",
  premium: "bg-purple-100 text-purple-700 border-purple-200",
  specialist: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  fallback: "bg-slate-100 text-slate-700 border-slate-200",
  planned: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function AiModelsPage() {
  const summary = getAiModelRegistrySummary();
  const entries = getAiModelRegistryByArea();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <Cpu className="h-4 w-4" />
            AI Governance
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            AI Model Registry
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            A central view of which approved AI models power each application,
            skill, extraction workflow and assistant capability. Use this when
            reviewing quality, cost, privacy posture, or switching model
            providers.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back to settings
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Gauge className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-xs text-muted-foreground">Registry entries</p>
              <p className="text-xl font-bold">{summary.totalEntries}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Active uses</p>
              <p className="text-xl font-bold">{summary.activeEntries}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <div>
              <p className="text-xs text-muted-foreground">High-cost areas</p>
              <p className="text-xl font-bold">{summary.highCostEntries}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">
                Approved families
              </p>
              <p className="text-xl font-bold">
                {summary.providerFamilies.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-indigo-100 bg-indigo-50/60">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="font-semibold text-indigo-950">
                Non-negotiable provider rule
              </h2>
              <p className="mt-1 text-sm text-indigo-900/80">
                Schoolgle customer data may only be sent to OpenAI, Anthropic,
                Google, Meta Llama, Mistral, or Microsoft models unless a DPA,
                regional transfer and GDPR review has been completed.
              </p>
            </div>
            <Badge className="w-fit border-emerald-200 bg-emerald-100 text-emerald-700">
              Enforced in tests
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Applications and skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-3 pr-4 font-semibold">Area</th>
                  <th className="py-3 pr-4 font-semibold">Primary model</th>
                  <th className="py-3 pr-4 font-semibold">Fallbacks</th>
                  <th className="py-3 pr-4 font-semibold">Route</th>
                  <th className="py-3 pr-4 font-semibold">Risk / data</th>
                  <th className="py-3 pr-4 font-semibold">Cost</th>
                  <th className="py-3 pr-4 font-semibold">Quality</th>
                  <th className="py-3 pr-4 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b align-top last:border-0">
                    <td className="py-4 pr-4">
                      <div className="font-semibold">{entry.area}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {entry.capability}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge
                          variant="outline"
                          className={statusStyles[entry.status]}
                        >
                          {entry.status}
                        </Badge>
                        <Badge variant="outline">{entry.owner}</Badge>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs">
                        {entry.primaryModel}
                      </code>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.providerFamilies.map((family) => (
                          <Badge key={family} variant="secondary">
                            {family}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col gap-1">
                        {entry.fallbackModels.map((model) => (
                          <code
                            key={model}
                            className="w-fit rounded bg-slate-100 px-2 py-1 text-xs"
                          >
                            {model}
                          </code>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 pr-4">{entry.route}</td>
                    <td className="py-4 pr-4">
                      <div>{entry.dataClassification}</div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Reviewed {entry.lastReviewed}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant="outline" className={costStyles[entry.costTier]}>
                        {entry.costTier}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge
                        variant="outline"
                        className={qualityStyles[entry.qualityTier]}
                      >
                        {entry.qualityTier}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="max-w-[260px] space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {entry.decisionNotes}
                        </p>
                        {entry.sourceFiles.map((sourceFile) => (
                          <div
                            key={sourceFile}
                            className="flex items-center gap-1 text-xs text-slate-600"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <code className="break-all">{sourceFile}</code>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Maintained from{" "}
        <code>apps/platform/src/lib/ai/model-registry.ts</code>. Any new AI
        feature should add an entry here and pass the model registry tests before
        release.
      </p>
    </div>
  );
}
