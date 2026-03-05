"use client";

/**
 * DomainManager Component
 *
 * UI for managing approved browser domains for Ed's automation.
 * Allows admins to add, edit, and remove approved domains.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Globe, Plus, Trash2, Edit, Shield, CheckCircle2 } from 'lucide';
import { useAuth } from '@/context/SupabaseAuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface ApprovedDomain {
  id: string;
  domain: string;
  description?: string;
  category: 'government' | 'internal' | 'vendor' | 'other';
  requires_auth: boolean;
  auth_method?: string;
  allowed_paths: string[];
  denied_paths: string[];
  max_session_duration: number;
  is_active: boolean;
  created_at: string;
}

const CATEGORY_CONFIGS = {
  government: { label: 'Government', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  internal: { label: 'Internal', color: 'bg-green-100 text-green-700 border-green-300' },
  vendor: { label: 'Vendor', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700 border-gray-300' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface DomainManagerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DomainManager({ open: controlledOpen, onOpenChange }: DomainManagerProps) {
  const { organizationId } = useAuth();
  const [domains, setDomains] = useState<ApprovedDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newCategory, setNewCategory] = useState<ApprovedDomain['category']>('other');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch approved domains
  useEffect(() => {
    if (organizationId) {
      fetchDomains();
    }
  }, [organizationId]);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/browser/domains');
      if (response.ok) {
        const { domains: fetchedDomains } = await response.json();
        setDomains(fetchedDomains || []);
      }
    } catch (error) {
      console.error('[DomainManager] Failed to fetch domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Domain is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/browser/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.toLowerCase().trim(),
          description: newDescription || undefined,
          category: newCategory,
          requiresAuth: false,
        }),
      });

      if (response.ok) {
        const { domain: addedDomain } = await response.json();
        setDomains((prev) => [addedDomain, ...prev]);
        setNewDomain('');
        setNewDescription('');
        setNewCategory('other');
        setIsAddDialogOpen(false);
        toast.success('Domain approved successfully');
      } else if (response.status === 409) {
        toast.error('This domain is already approved');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to approve domain');
      }
    } catch (error) {
      console.error('[DomainManager] Failed to add domain:', error);
      toast.error('Failed to approve domain');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`Remove ${domainName} from approved domains?`)) {
      return;
    }

    try {
      const response = await fetch('/api/browser/domains', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      if (response.ok) {
        setDomains((prev) => prev.filter((d) => d.id !== domainId));
        toast.success('Domain removed');
      } else {
        toast.error('Failed to remove domain');
      }
    } catch (error) {
      console.error('[DomainManager] Failed to remove domain:', error);
      toast.error('Failed to remove domain');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Approved Domains
              </CardTitle>
              <CardDescription>
                Manage which websites Ed can access for automation
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading approved domains...
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No approved domains yet. Add a domain to enable Ed to browse it.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Domain
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{domain.domain}</p>
                      {domain.description && (
                        <p className="text-xs text-muted-foreground">{domain.description}</p>
                      )}
                    </div>
                    <Badge className={CATEGORY_CONFIGS[domain.category].color}>
                      {CATEGORY_CONFIGS[domain.category].label}
                    </Badge>
                    {domain.requires_auth && (
                      <Badge variant="outline">Auth Required</Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDomain(domain.id, domain.domain)}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Domain Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve New Domain</DialogTitle>
            <DialogDescription>
              Add a domain to Ed&apos;s approved list. Ed will be able to browse this website
              to help with your tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="e.g., hse.gov.uk"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addDomain()}
              />
              <p className="text-xs text-muted-foreground">
                Enter just the domain name (e.g., hse.gov.uk), not the full URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={newCategory} onValueChange={(v) => setNewCategory(v as any)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Government (GOV.UK, NHS)</SelectItem>
                  <SelectItem value="internal">Internal (School Systems)</SelectItem>
                  <SelectItem value="vendor">Vendor / Service Provider</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g., HSE Legionella guidance"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Protected by guardrails</p>
                <p className="text-blue-700 mt-1">
                  Ed will never enter passwords, payment details, or sensitive personal information.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addDomain} disabled={isSubmitting || !newDomain.trim()}>
              {isSubmitting ? 'Adding...' : 'Approve Domain'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DomainManager;
