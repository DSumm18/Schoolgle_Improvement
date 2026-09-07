import type { Metadata } from "next";
import InsightsLibrary from "@/components/website/InsightsLibrary";

export const metadata: Metadata = {
  title:
    "School reports, research and practical briefings | Schoolgle Insights",
  description:
    "Read Schoolgle's briefings on Ofsted, EEF evidence, SEND, workforce, estates and school finance. Findings, limitations and practical next steps, with original sources.",
  alternates: { canonical: "https://www.schoolgle.co.uk/insights" },
};

export default function InsightsPage() {
  return <InsightsLibrary />;
}
