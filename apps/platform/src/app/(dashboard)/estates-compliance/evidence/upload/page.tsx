"use client";

export const dynamic = "force-dynamic";

/**
 * Evidence Upload Page
 *
 * Uses the EvidenceManager component that was built but not previously wired.
 * Supports upload, cloud links, and AI verification.
 */

import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { EvidenceManager } from "@/components/estates-compliance/EvidenceManager";

export default function EvidenceUploadPage() {
  const { user, organization } = useAuth();
  const organizationId = organization?.id || "";
  const userId = user?.id || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/estates-compliance" className="hover:text-foreground">
            Estates Compliance
          </Link>
          <span>/</span>
          <Link
            href="/estates-compliance/evidence"
            className="hover:text-foreground"
          >
            Evidence Library
          </Link>
          <span>/</span>
          <span>Upload</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight">Upload Evidence</h1>
        <p className="text-muted-foreground mt-1">
          Add certificates, reports, photos, or compliance documents
        </p>
      </div>

      {/* Evidence Manager — previously built, now wired */}
      {organizationId ? (
        <EvidenceManager organizationId={organizationId} userId={userId} />
      ) : (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          Loading organisation...
        </div>
      )}
    </div>
  );
}
