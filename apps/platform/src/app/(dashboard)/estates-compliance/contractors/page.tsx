'use client';

/**
 * Contractors Register Page
 *
 * Manage external contractors and service agreements.
 * Features filtering, sorting, and status tracking.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Contractor } from '@/types/estates-compliance';
import { ContractorTable } from '@/components/estates-compliance/ContractorTable';
import { ContractorCard } from '@/components/estates-compliance/ContractorCard';
import { useAuth } from '@/context/SupabaseAuthContext';
import { ArrowUpDown, Filter, Search, Building2, CheckCircle, AlertCircle, Clock, FileText, Users } from 'lucide-react';

type ViewMode = 'table' | 'grid';
type TabMode = 'contractors' | 'contracts' | 'expiring';
type SortField = 'company_name' | 'service_type' | 'status' | 'preferred' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function ContractorsPage() {
  const { organizationId, session } = useAuth();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [activeTab, setActiveTab] = useState<TabMode>('contractors');
  const [sortField, setSortField] = useState<SortField>('company_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState({
    service_type: '',
    status: '',
    preferred_only: false,
    search: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    if (activeTab === 'contractors' && organizationId) {
      fetchContractors(controller.signal);
    }
    return () => controller.abort('Component updated or unmounted');
  }, [activeTab, organizationId, filters]);

  const fetchContractors = useCallback(async (signal?: AbortSignal) => {
    // If already aborted, don't start
    if (signal?.aborted) return;

    // Use a local controller to manage the fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Contractors fetch timed out'), 30000);

    // Link the passed signal to our local controller
    const onAbort = () => controller.abort(signal?.reason);
    if (signal) {
      if (signal.aborted) onAbort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }

    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append('organization_id', organizationId || '');
      if (filters.service_type) params.append('service_type', filters.service_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.preferred_only) params.append('preferred_only', 'true');
      if (filters.search) params.append('search', filters.search);

      console.log('[ContractorsPage] Fetching:', `/api/estates/contractors?${params.toString()}`);
      const response = await fetch(`/api/estates/contractors?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ContractorsPage] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch contractors: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[ContractorsPage] Received data:', { count: data.contractors?.length });

      let contractors = data.contractors || [];
      contractors = sortContractors(contractors);
      setContractors(contractors);
    } catch (err: any) {
      const errorString = typeof err === 'string' ? err : err?.message || '';
      const isAbort = err.name === 'AbortError' || errorString.toLowerCase().includes('abort') || errorString.toLowerCase().includes('unmounted') || errorString.toLowerCase().includes('refreshed');

      if (isAbort) {
        console.info('[ContractorsPage] Fetch aborted:', errorString);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load contractors');
      }
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onAbort);
      setLoading(false);
    }
  }, [organizationId, filters, session, sortField, sortOrder]);

  const sortContractors = (contractors: Contractor[]) => {
    return [...contractors].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'company_name':
          comparison = a.company_name.localeCompare(b.company_name);
          break;
        case 'service_type':
          comparison = (a.services?.[0]?.service || '').localeCompare(b.services?.[0]?.service || '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'preferred':
          comparison = (a.preferred ? 1 : 0) - (b.preferred ? 1 : 0);
          break;
        case 'created_at':
          comparison = new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setContractors(sortContractors(contractors));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      restricted: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchContractors();
  };

  const stats = {
    total: contractors.length,
    active: contractors.filter(c => c.status === 'active').length,
    preferred: contractors.filter(c => c.preferred).length,
    expiring: 0, // Would calculate from contracts
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Link href="/estates-compliance" className="hover:text-gray-900 dark:hover:text-gray-200 font-medium">
              Estates Compliance
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">Contractors</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Contractor Register</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
            Manage external contractors and service agreements
          </p>
        </div>
        {activeTab === 'contractors' && (
          <div className="flex gap-2">
            <Link
              href="/estates-compliance/contractors/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Add Contractor
            </Link>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {activeTab === 'contractors' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} icon={<Building2 className="w-5 h-5" />} />
          <StatCard label="Active" value={stats.active} icon={<CheckCircle className="w-5 h-5 text-green-600" />} variant="success" />
          <StatCard label="Preferred" value={stats.preferred} icon={<AlertCircle className="w-5 h-5 text-blue-600" />} variant="info" />
          <StatCard label="Expiring Soon" value={stats.expiring} icon={<Clock className="w-5 h-5 text-amber-600" />} variant="warning" />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          <button
            onClick={() => setActiveTab('contractors')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'contractors'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
          >
            Contractors
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'contracts'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
          >
            Contracts
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'expiring'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
          >
            Expiring Soon
          </button>
        </nav>
      </div>

      {activeTab === 'contracts' && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-16 text-center bg-white dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contracts View</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            View and manage all contractor agreements and service contracts.
          </p>
        </div>
      )}

      {activeTab === 'expiring' && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-16 text-center bg-white dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Expiring Contracts</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Track contracts that are expiring soon and need renewal.
          </p>
        </div>
      )}

      {activeTab === 'contractors' && (
        <>
          {/* Filters */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contractors..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.service_type}
                onChange={(e) => handleFilterChange('service_type', e.target.value)}
              >
                <option value="">All Services</option>
                <option value="legionella">Legionella Control</option>
                <option value="fire">Fire Safety</option>
                <option value="electrical">Electrical Testing</option>
                <option value="gas">Gas Safety</option>
                <option value="asbestos">Asbestos Management</option>
                <option value="lift">Lift Maintenance</option>
                <option value="playground">Playground Inspection</option>
              </select>

              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="restricted">Restricted</option>
              </select>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={filters.preferred_only}
                  onChange={(e) => handleFilterChange('preferred_only', e.target.checked)}
                />
                Preferred only
              </label>

              <button
                onClick={applyFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Contractors */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400 font-medium">Loading contractors...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-400 font-medium">Error: {error}</p>
            </div>
          ) : contractors.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-16 text-center bg-white dark:bg-gray-900">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No contractors yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Add contractors who provide compliance services to your school. Track their accreditations,
                insurance, and contracts.
              </p>
              <Link
                href="/estates-compliance/contractors/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Add Your First Contractor
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {contractors.length} contractor{contractors.length !== 1 ? 's' : ''} found
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'table'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    Grid
                  </button>
                </div>
              </div>

              {viewMode === 'table' ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr className="text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <th className="px-4 py-3">
                            <button
                              onClick={() => handleSort('company_name')}
                              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              Company
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="px-4 py-3">Services</th>
                          <th className="px-4 py-3">Contact</th>
                          <th className="px-4 py-3">
                            <button
                              onClick={() => handleSort('status')}
                              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              Status
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="px-4 py-3">Accreditations</th>
                          <th className="px-4 py-3">Insurance</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {contractors.map((contractor) => (
                          <tr key={contractor.id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white">{contractor.company_name}</div>
                                  {contractor.preferred && (
                                    <span className="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400">
                                      <AlertCircle className="w-3 h-3 mr-0.5" />
                                      Preferred
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {contractor.services?.slice(0, 2).map((service, i) => (
                                  <span key={i} className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                                    {service.service}
                                  </span>
                                ))}
                                {contractor.services && contractor.services.length > 2 && (
                                  <span className="px-2 py-0.5 text-xs font-medium text-gray-500">
                                    +{contractor.services.length - 2} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              <div className="text-sm">{contractor.contact_name}</div>
                              <div className="text-xs">{contractor.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold border ${getStatusColor(contractor.status)}`}>
                                {contractor.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {contractor.accreditations && contractor.accreditations.length > 0 ? (
                                  <span>{contractor.accreditations.length} accreditations</span>
                                ) : (
                                  <span className="text-gray-400">None</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {contractor.insurance_certificates && contractor.insurance_certificates.length > 0 ? (
                                  <span>{contractor.insurance_certificates.length} policies</span>
                                ) : (
                                  <span className="text-gray-400">None</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/estates-compliance/contractors/${contractor.id}`}
                                className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {contractors.map((contractor) => (
                    <ContractorCard key={contractor.id} contractor={contractor} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'info' | 'warning';
}

function StatCard({ label, value, icon, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  };

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
        </div>
        {icon && <div className="text-gray-400 dark:text-gray-500">{icon}</div>}
      </div>
    </div>
  );
}
