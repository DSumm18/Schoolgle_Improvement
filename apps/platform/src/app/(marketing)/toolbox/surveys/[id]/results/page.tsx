"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const ResultsPage = dynamic(
  () => import("@/app/(dashboard)/dashboard/surveys/[id]/results/page"),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    ),
  },
);

export default function ToolboxSurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ResultsPage params={params} />;
}
