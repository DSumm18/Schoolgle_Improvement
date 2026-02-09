"use client";

/**
 * Browser Domains Admin Page
 *
 * Allows organization administrators to:
 * - View approved domains for their organization
 * - Add new approved domains
 * - Edit domain settings (paths, auth, duration)
 * - Remove approved domains
 * - View domain usage statistics
 */

import { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  Shield,
  Lock,
  Unlock,
  Check,
  X,
  Search,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// TYPES
// ============================================================================

interface ApprovedDomain {
  id: string;
  domain: string;
  description: string | null;
  category: 'government' | 'internal' | 'vendor' | 'other';
  requires_auth: boolean;
  auth_method: string | null;
  auth_config: Record<string, any>;
  allowed_paths: string[];
  denied_paths: string[];
  max_session_duration: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface DomainStats {
  totalSessions: number;
  activeSessions: number;
  lastUsed: string | null;
}

// ============================================================================
// MOCK DATA (Replace with API calls)
// ============================================================================

const mockDomains: ApprovedDomain[] = [
  {
    id: '1',
    domain: 'hse.gov.uk',
    description: 'Health & Safety Executive - RIDDOR reporting',
    category: 'government',
    requires_auth: true,
    auth_method: 'headers',
    auth_config: {},
    allowed_paths: ['/riddor/**'],
    denied_paths: [],
    max_session_duration: 1800,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    is_active: true,
  },
  {
    id: '2',
    domain: 'gov.uk',
    description: 'UK Government services - Pupil Premium, FSM applications',
    category: 'government',
    requires_auth: false,
    auth_method: 'none',
    auth_config: {},
    allowed_paths: ['/**'],
    denied_paths: [],
    max_session_duration: 1800,
    created_at: '2026-01-10T09:00:00Z',
    updated_at: '2026-01-10T09:00:00Z',
    is_active: true,
  },
  {
    id: '3',
    domain: 'schoolgle.co.uk',
    description: 'Internal Schoolgle platform',
    category: 'internal',
    requires_auth: false,
    auth_method: 'none',
    auth_config: {},
    allowed_paths: ['/**'],
    denied_paths: [],
    max_session_duration: 3600,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    is_active: true,
  },
];

const mockStats: Record<string, DomainStats> = {
  '1': { totalSessions: 45, activeSessions: 2, lastUsed: '2026-01-23T10:30:00Z' },
  '2': { totalSessions: 128, activeSessions: 5, lastUsed: '2026-01-23T09:15:00Z' },
  '3': { totalSessions: 892, activeSessions: 12, lastUsed: '2026-01-23T11:00:00Z' },
};

// ============================================================================
// COMPONENTS
// ============================================================================

export default function BrowserDomainsAdmin() {
  const [domains, setDomains] = useState<ApprovedDomain[]>(mockDomains);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<ApprovedDomain | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredDomains = domains.filter((domain) => {
    const matchesSearch =
      domain.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (domain.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === 'all' || domain.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'government':
        return 'bg-blue-100 text-blue-700';
      case 'internal':
        return 'bg-green-100 text-green-700';
      case 'vendor':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'government':
        return '🏛️';
      case 'internal':
        return '🏢';
      case 'vendor':
        return '🏪';
      default:
        return '🌐';
    }
  };

  const handleToggleActive = async (domain: ApprovedDomain) => {
    setLoading(true);
    // TODO: Call API to toggle domain active status
    setDomains((prev) =>
      prev.map((d) =>
        d.id === domain.id ? { ...d, is_active: !d.is_active } : d
      )
    );
    setLoading(false);
  };

  const handleDelete = async (domainId: string) => {
    if (!confirm('Are you sure you want to remove this approved domain?')) {
      return;
    }
    setLoading(true);
    // TODO: Call API to delete domain
    setDomains((prev) => prev.filter((d) => d.id !== domainId));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Browser Domain Management
              </h1>
              <p className="text-sm text-gray-500">
                Manage approved domains for Ed's browser automation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Info Banner */}
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-indigo-900">
                  Security Reminder
                </h3>
                <p className="text-sm text-indigo-700 mt-1">
                  Only add domains that your organization explicitly trusts. Ed will
                  only be able to navigate and interact with approved domains.
                  All browser sessions are logged for audit purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search domains..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="government">Government</option>
            <option value="internal">Internal</option>
            <option value="vendor">Vendor</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Domains List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredDomains.map((domain) => {
            const stats = mockStats[domain.id];
            return (
              <Card key={domain.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getCategoryColor(
                          domain.category
                        )} bg-opacity-50`}
                      >
                        {getCategoryIcon(domain.category)}
                      </div>

                      {/* Domain Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {domain.domain}
                          </h3>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                        {domain.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {domain.description}
                          </p>
                        )}

                        {/* Badges */}
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                              domain.category
                            )}`}
                          >
                            {domain.category}
                          </span>
                          {domain.requires_auth ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Auth Required
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                              <Unlock className="w-3 h-3" />
                              No Auth
                            </span>
                          )}
                          {domain.is_active ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                              <X className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </div>

                        {/* Session Duration */}
                        <p className="text-xs text-gray-500 mt-2">
                          Max session duration:{' '}
                          {Math.floor(domain.max_session_duration / 60)} minutes
                        </p>

                        {/* Path Restrictions */}
                        {(domain.allowed_paths.length > 0 ||
                          domain.denied_paths.length > 0) && (
                          <div className="mt-2 text-xs">
                            {domain.allowed_paths.length > 0 &&
                              domain.allowed_paths[0] !== '/**' && (
                                <div className="text-green-600">
                                  Allowed: {domain.allowed_paths.join(', ')}
                                </div>
                              )}
                            {domain.denied_paths.length > 0 && (
                              <div className="text-red-600">
                                Denied: {domain.denied_paths.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    {stats && (
                      <div className="flex items-center gap-6 px-4 border-l border-gray-200 mx-4">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">
                            {stats.totalSessions}
                          </p>
                          <p className="text-xs text-gray-500">Total Sessions</p>
                        </div>
                        {stats.activeSessions > 0 && (
                          <div className="text-center">
                            <p className="text-lg font-semibold text-green-600">
                              {stats.activeSessions}
                            </p>
                            <p className="text-xs text-gray-500">Active</p>
                          </div>
                        )}
                        {stats.lastUsed && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500">
                              Last used
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(stats.lastUsed).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingDomain(domain)}
                        title="Edit domain"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(domain)}
                        title={domain.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {domain.is_active ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(domain.id)}
                        title="Delete domain"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredDomains.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No domains found
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Add your first approved domain to get started'}
                </p>
                {!searchQuery && categoryFilter === 'all' && (
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Domain
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || editingDomain) && (
        <DomainModal
          domain={editingDomain}
          onClose={() => {
            setShowAddModal(false);
            setEditingDomain(null);
          }}
          onSave={(savedDomain) => {
            if (editingDomain) {
              setDomains((prev) =>
                prev.map((d) => (d.id === editingDomain.id ? savedDomain : d))
              );
            } else {
              setDomains((prev) => [...prev, savedDomain]);
            }
            setShowAddModal(false);
            setEditingDomain(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// DOMAIN MODAL COMPONENT
// ============================================================================

interface DomainModalProps {
  domain: ApprovedDomain | null;
  onClose: () => void;
  onSave: (domain: ApprovedDomain) => void;
}

function DomainModal({ domain, onClose, onSave }: DomainModalProps) {
  const isEditing = !!domain;
  const [formData, setFormData] = useState({
    domain: domain?.domain || '',
    description: domain?.description || '',
    category: domain?.category || 'other',
    requires_auth: domain?.requires_auth || false,
    auth_method: domain?.auth_method || 'none',
    allowed_paths: domain?.allowed_paths.join(', ') || '/**',
    denied_paths: domain?.denied_paths.join(', ') || '',
    max_session_duration: domain?.max_session_duration || 1800,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const savedDomain: ApprovedDomain = {
      id: domain?.id || crypto.randomUUID(),
      domain: formData.domain,
      description: formData.description || null,
      category: formData.category as any,
      requires_auth: formData.requires_auth,
      auth_method: formData.auth_method,
      auth_config: {},
      allowed_paths: formData.allowed_paths
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
      denied_paths: formData.denied_paths
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
      max_session_duration: formData.max_session_duration,
      created_at: domain?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: domain?.is_active ?? true,
    };

    onSave(savedDomain);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Edit Approved Domain' : 'Add Approved Domain'}
          </CardTitle>
          <CardDescription>
            Configure which domains Ed can access for browser automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Domain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain *
              </label>
              <input
                type="text"
                required
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                placeholder="e.g., hse.gov.uk"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter just the domain (e.g., hse.gov.uk), not the full URL
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="e.g., Health & Safety Executive - RIDDOR reporting"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="government">Government</option>
                <option value="internal">Internal</option>
                <option value="vendor">Vendor</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Requires Auth */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_auth"
                checked={formData.requires_auth}
                onChange={(e) =>
                  setFormData({ ...formData, requires_auth: e.target.checked })
                }
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="requires_auth" className="text-sm text-gray-700">
                Requires authentication
              </label>
            </div>

            {formData.requires_auth && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auth Method
                </label>
                <select
                  value={formData.auth_method}
                  onChange={(e) =>
                    setFormData({ ...formData, auth_method: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="none">None</option>
                  <option value="sso">SSO</option>
                  <option value="headers">Headers</option>
                  <option value="credentials">Credentials</option>
                </select>
              </div>
            )}

            {/* Allowed Paths */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowed Paths
              </label>
              <input
                type="text"
                value={formData.allowed_paths}
                onChange={(e) =>
                  setFormData({ ...formData, allowed_paths: e.target.value })
                }
                placeholder="/** or /path1/**, /path2/**"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated glob patterns. Use /** for all paths.
              </p>
            </div>

            {/* Denied Paths */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Denied Paths
              </label>
              <input
                type="text"
                value={formData.denied_paths}
                onChange={(e) =>
                  setFormData({ ...formData, denied_paths: e.target.value })
                }
                placeholder="/admin/**, /settings/**"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated glob patterns to explicitly block
              </p>
            </div>

            {/* Max Session Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Session Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={Math.floor(formData.max_session_duration / 60)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_session_duration: parseInt(e.target.value) * 60,
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {isEditing ? 'Save Changes' : 'Add Domain'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
