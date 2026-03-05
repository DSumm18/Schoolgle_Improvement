'use client';

// Force dynamic rendering to avoid build errors
export const dynamic = 'force-dynamic';

/**
 * Evidence Library Page
 *
 * Browse all evidence
 * Filter by domain, type, date
 * View evidence linked to checks/assets
 * Upload new evidence
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EstatesEvidence, EvidenceType, EvidenceStatus } from '@/types/estates-compliance';
import { useAuth } from '@/context/SupabaseAuthContext';

const evidenceTypes: { value: EvidenceType; label: string; icon: string }[] = [
  { value: 'certificate', label: 'Certificate', icon: '📜' },
  { value: 'report', label: 'Report', icon: '📄' },
  { value: 'photo', label: 'Photo', icon: '📷' },
  { value: 'log', label: 'Log/Record', icon: '📋' },
  { value: 'document', label: 'Document', icon: '📁' },
  { value: 'video', label: 'Video', icon: '🎥' },
  { value: 'other', label: 'Other', icon: '📎' },
];

const statusConfig: Record<EvidenceStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  verified: { label: 'Verified', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-800' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-600' },
};

const complianceDomains = [
  { value: 'fire', label: 'Fire Safety' },
  { value: 'legionella', label: 'Legionella' },
  { value: 'asbestos', label: 'Asbestos' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'gas', label: 'Gas Safety' },
  { value: 'lifting', label: 'Lifting Operations' },
  { value: 'playground', label: 'Playground Safety' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'water', label: 'Water Hygiene' },
];

export default function EvidenceLibraryPage() {
  const { organizationId, session } = useAuth();
  const [evidence, setEvidence] = useState<EstatesEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [filters, setFilters] = useState({
    evidence_type: '',
    status: '',
    compliance_domain: '',
    search: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    if (organizationId) {
      fetchEvidence();
      fetchStats();
    }
  }, [organizationId]);

  const fetchEvidence = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('organization_id', organizationId || '');

      if (filters.evidence_type) params.append('evidence_type', filters.evidence_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.compliance_domain) params.append('compliance_domain', filters.compliance_domain);
      if (filters.search) params.append('search', filters.search);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/estates/evidence?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch evidence');
      }
      const data = await response.json();
      setEvidence(data.data || []);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load evidence');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/estates/evidence/stats?organization_id=${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchEvidence();
  };

  const clearFilters = () => {
    setFilters({
      evidence_type: '',
      status: '',
      compliance_domain: '',
      search: '',
      date_from: '',
      date_to: '',
    });
    setTimeout(applyFilters, 0);
  };

  const handleDelete = async (evidenceId: string) => {
    if (!confirm('Are you sure you want to delete this evidence?')) {
      return;
    }

    try {
      const response = await fetch(`/api/estates/evidence/${evidenceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete evidence');
      }

      fetchEvidence();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete evidence');
    }
  };

  const isExpiringSoon = (expiryDate: string | undefined) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Evidence Library</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading evidence...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Evidence Library</h1>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Error: {error}
        </div>
      </div>
    );
  }

  const hasEvidence = evidence.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/estates-compliance" className="hover:text-foreground">
              Estates Compliance
            </Link>
            <span>/</span>
            <span>Evidence Library</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Library</h1>
          <p className="text-muted-foreground mt-1">
            {hasEvidence ? `${evidence.length} item${evidence.length !== 1 ? 's' : ''} in library` : 'Upload and manage compliance evidence'}
          </p>
        </div>
        <div className="flex gap-2">
          {hasEvidence && (
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </button>
          )}
          <Link
            href="/estates-compliance/evidence/upload"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upload Evidence
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Evidence</div>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Pending Verification</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_verification || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Expiring Soon</div>
            <div className="text-2xl font-bold text-orange-600">{stats.expiring_soon || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Verified</div>
            <div className="text-2xl font-bold text-green-600">{stats.by_status?.verified || 0}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filters.evidence_type}
            onChange={(e) => handleFilterChange('evidence_type', e.target.value)}
          >
            <option value="">All Types</option>
            {evidenceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="archived">Archived</option>
          </select>

          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filters.compliance_domain}
            onChange={(e) => handleFilterChange('compliance_domain', e.target.value)}
          >
            <option value="">All Domains</option>
            {complianceDomains.map((domain) => (
              <option key={domain.value} value={domain.value}>
                {domain.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search..."
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />

          <input
            type="date"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            placeholder="From date"
          />

          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Evidence Grid/List */}
      {hasEvidence ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evidence.map((item) => {
              const typeInfo = evidenceTypes.find((t) => t.value === item.evidence_type);
              const statusInfo = statusConfig[item.status];
              const expiring = isExpiringSoon(item.expiry_date);

              return (
                <div key={item.id} className="group relative rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                  {expiring && (
                    <div className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                      Expiring Soon
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{typeInfo?.icon || '📎'}</span>
                    <div className="flex gap-1">
                      {item.file_url && (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-accent"
                          title="View file"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.compliance_domain && (
                      <span className="text-xs rounded bg-muted px-1.5 py-0.5">
                        {item.compliance_domain}
                      </span>
                    )}
                    <span className={`text-xs rounded px-1.5 py-0.5 ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    {item.issuing_body && (
                      <div>Issued by: {item.issuing_body}</div>
                    )}
                    {item.expiry_date && (
                      <div className={expiring ? 'text-orange-600' : ''}>
                        Expires: {new Date(item.expiry_date).toLocaleDateString()}
                      </div>
                    )}
                    <div>
                      Added: {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Linked entities */}
                  {(item.asset_id || item.task_id || item.contractor_id) && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">Linked to:</div>
                      <div className="flex flex-wrap gap-1">
                        {item.asset_id && (
                          <Link
                            href={`/estates-compliance/assets/${item.asset_id}`}
                            className="text-xs rounded bg-blue-50 text-blue-700 px-1.5 py-0.5 hover:bg-blue-100"
                          >
                            Asset
                          </Link>
                        )}
                        {item.task_id && (
                          <Link
                            href={`/estates-compliance/tasks/${item.task_id}`}
                            className="text-xs rounded bg-green-50 text-green-700 px-1.5 py-0.5 hover:bg-green-100"
                          >
                            Task
                          </Link>
                        )}
                        {item.contractor_id && (
                          <Link
                            href={`/estates-compliance/contractors/${item.contractor_id}`}
                            className="text-xs rounded bg-purple-50 text-purple-700 px-1.5 py-0.5 hover:bg-purple-100"
                          >
                            Contractor
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs rounded-full bg-muted px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-sm">
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Domain</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Expiry</th>
                    <th className="px-4 py-3 font-medium">Date Added</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {evidence.map((item) => {
                    const typeInfo = evidenceTypes.find((t) => t.value === item.evidence_type);
                    const statusInfo = statusConfig[item.status];

                    return (
                      <tr key={item.id} className="text-sm hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1">
                            <span>{typeInfo?.icon || '📎'}</span>
                            <span className="capitalize">{item.evidence_type}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.compliance_domain || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {item.file_url && (
                              <a
                                href={item.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
                              >
                                View
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <span className="text-2xl">📁</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No evidence yet</h3>
          <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
            Get started by uploading your first evidence. You can upload certificates, reports, photos, and more.
          </p>
          <Link
            href="/estates-compliance/evidence/upload"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upload Your First Evidence
          </Link>
        </div>
      )}
    </div>
  );
}
