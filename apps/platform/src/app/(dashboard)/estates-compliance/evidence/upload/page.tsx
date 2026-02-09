'use client';

/**
 * Evidence Upload Page
 *
 * Dedicated page for uploading new evidence
 */

import Link from 'next/link';

export default function EvidenceUploadPage() {
  // TODO: Get actual user ID and organization ID from session
  const organizationId = 'org-123';
  const userId = 'user-123';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/estates-compliance" className="hover:text-foreground">
            Estates Compliance
          </Link>
          <span>/</span>
          <Link href="/estates-compliance/evidence" className="hover:text-foreground">
            Evidence Library
          </Link>
          <span>/</span>
          <span>Upload</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight">Upload Evidence</h1>
        <p className="text-muted-foreground mt-1">
          Add new evidence to your estates compliance library
        </p>
      </div>

      {/* Upload Form */}
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          TODO: Integrate EvidenceManager component here
        </p>
      </div>
    </div>
  );
}
