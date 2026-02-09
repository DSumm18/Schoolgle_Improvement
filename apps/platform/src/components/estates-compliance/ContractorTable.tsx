'use client';

/**
 * ContractorTable Component
 *
 * Table view for displaying multiple contractors with sorting and filtering support.
 */

import Link from 'next/link';
import { Contractor, ContractorStatus } from '@/types/estates-compliance';

interface ContractorTableProps {
  contractors: Contractor[];
}

const statusConfig: Record<ContractorStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800' },
  restricted: { label: 'Restricted', className: 'bg-red-100 text-red-800' },
  under_review: { label: 'Under Review', className: 'bg-yellow-100 text-yellow-800' },
};

export function ContractorTable({ contractors }: ContractorTableProps) {
  if (contractors.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-12 text-center text-muted-foreground">
          No contractors found matching your filters.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr className="text-left text-sm">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Services</th>
              <th className="px-4 py-3 font-medium">Accreditations</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contractors.map((contractor) => {
              const status = statusConfig[contractor.status] || statusConfig.active;

              return (
                <tr key={contractor.id} className="text-sm hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contractor.company_name}</span>
                      {contractor.is_preferred && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          Preferred
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{contractor.contact_name || '-'}</div>
                    <div className="text-xs text-muted-foreground">
                      {contractor.contact_email || contractor.contact_phone || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {contractor.services?.slice(0, 2).map((service) => (
                        <span
                          key={service.service_type}
                          className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs"
                        >
                          {service.service_type.replace('_', ' ')}
                        </span>
                      ))}
                      {contractor.services && contractor.services.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{contractor.services.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {contractor.accreditations?.slice(0, 2).map((acc, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700"
                        >
                          {acc.certificate_type}
                        </span>
                      ))}
                      {contractor.accreditations && contractor.accreditations.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{contractor.accreditations.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/estates-compliance/contractors/${contractor.id}`}
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
                      >
                        View
                      </Link>
                      <Link
                        href={`/estates-compliance/contractors/${contractor.id}/edit`}
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
