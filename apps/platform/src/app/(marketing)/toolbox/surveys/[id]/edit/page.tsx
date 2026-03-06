"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const SurveyBuilder = dynamic(
  () =>
    import("@/components/surveys/builder/SurveyBuilder").then(
      (mod) => mod.SurveyBuilder,
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    ),
  },
);

export default function ToolboxSurveyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <SurveyBuilder surveyId={id} isToolbox />;
}
