import { redirect } from "next/navigation";

export default function CompletePage({
  params,
}: {
  params: { domain: string; checkId: string };
}) {
  redirect(`/estates-compliance/${params.domain}/${params.checkId}`);
}
