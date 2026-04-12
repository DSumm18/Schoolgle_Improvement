import { redirect } from "next/navigation";

export default function EvidencePage({
  params,
}: {
  params: { domain: string; checkId: string };
}) {
  redirect(`/estates-compliance/${params.domain}/${params.checkId}`);
}
