"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { TaskScheduler } from "@/components/estates-compliance/TaskScheduler";
import type { ComplianceDomain } from "@/types/estates-compliance";

export default function NewComplianceTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organizationId } = useAuth();
  const initialDomain =
    (searchParams.get("domain") as ComplianceDomain | null) || "legionella";
  const initialAssetId =
    searchParams.get("assetId") || searchParams.get("asset_id") || null;
  const initialTitle = searchParams.get("title") || "";
  const initialDescription = searchParams.get("description") || "";
  const initialCheckId = searchParams.get("checkId") || null;

  if (!organizationId) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Loading your school workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/estates-compliance/tasks"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tasks
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Create Compliance Task
        </h1>
        <p className="mt-1 text-muted-foreground">
          Schedule a statutory check or a custom estates compliance task.
        </p>
      </div>

      <TaskScheduler
        organizationId={organizationId}
        initialDomain={initialDomain}
        initialAssetId={initialAssetId}
        initialTitle={initialTitle}
        initialDescription={initialDescription}
        initialCheckId={initialCheckId}
        onSuccess={() => router.push("/estates-compliance/tasks")}
        onCancel={() => router.push("/estates-compliance/tasks")}
      />
    </div>
  );
}
