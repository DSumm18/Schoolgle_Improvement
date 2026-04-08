import { redirect } from "next/navigation";
import { getServerMCAdmin } from "@/lib/mission-control/auth";

/**
 * Server Component that gates Mission Control access.
 * Redirects non-admin users to /mission-control/not-authorized.
 *
 * Note: The not-authorized page is intentionally NOT behind the gate.
 */
export async function MCAdminGate({ children }: { children: React.ReactNode }) {
  const admin = await getServerMCAdmin();

  if (!admin) {
    redirect("/not-authorized");
  }

  return <>{children}</>;
}
