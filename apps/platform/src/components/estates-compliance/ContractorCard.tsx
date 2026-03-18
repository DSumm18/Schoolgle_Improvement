"use client";

/**
 * ContractorCard Component
 *
 * Displays a single contractor with key information and quick actions.
 */

import Link from "next/link";
import { Contractor } from "@/types/estates-compliance";

interface ContractorCardProps {
  contractor: Contractor;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-800" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-800" },
  restricted: { label: "Restricted", className: "bg-red-100 text-red-800" },
  under_review: {
    label: "Under Review",
    className: "bg-yellow-100 text-yellow-800",
  },
};

export function ContractorCard({ contractor }: ContractorCardProps) {
  const status = statusConfig[contractor.status] || statusConfig.active;

  return (
    <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base">
              {contractor.company_name}
            </h3>
            {contractor.preferred && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                Preferred
              </span>
            )}
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground mb-3">
        {contractor.contact_name && (
          <p>
            <span className="font-medium">Contact:</span>{" "}
            {contractor.contact_name}
          </p>
        )}
        {contractor.email && (
          <p>
            <span className="font-medium">Email:</span> {contractor.email}
          </p>
        )}
        {contractor.phone && (
          <p>
            <span className="font-medium">Phone:</span> {contractor.phone}
          </p>
        )}
      </div>

      {contractor.services && contractor.services.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {contractor.services.map((service) => (
            <span
              key={service.service_type}
              className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs"
            >
              {service.service_type.replace("_", " ")}
            </span>
          ))}
        </div>
      )}

      {contractor.accreditations && contractor.accreditations.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Accreditations:
          </p>
          <div className="flex flex-wrap gap-1">
            {contractor.accreditations.map((acc, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded bg-green-50 px-2 py-0.5 text-xs text-green-700"
              >
                {acc.type}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t">
        <Link
          href={`/estates-compliance/contractors/${contractor.id}`}
          className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent flex-1"
        >
          View Details
        </Link>
        <Link
          href={`/estates-compliance/contractors/${contractor.id}/edit`}
          className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent flex-1"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
