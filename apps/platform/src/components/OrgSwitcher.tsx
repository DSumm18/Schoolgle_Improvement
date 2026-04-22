"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Building2, School } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/SupabaseAuthContext";

interface Organization {
  id: string;
  name: string;
  organization_type: 'school' | 'trust' | 'local_authority';
  parent_organization_id: string | null;
}

interface OrgSwitcherProps {
  currentOrgId: string;
  onOrgChange: (orgId: string) => void;
}

export default function OrgSwitcher({ currentOrgId, onOrgChange }: OrgSwitcherProps) {
  const { user, session, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccessibleOrgs() {
      // Wait for auth to finish loading and session to be available
      if (authLoading) {
        return;
      }

      if (!session) {
        console.log('[OrgSwitcher] No session available, skipping fetch');
        setLoading(false);
        return;
      }

      try {
        // Ensure the Supabase client has the current session token
        // This is critical to prevent 401 errors
        if (session?.access_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token || '',
          });
          if (sessionError) {
            console.error('[OrgSwitcher] Error setting session:', sessionError);
          }
        }

        // Call the get_user_accessible_orgs function via RPC
        const { data: orgIds, error: rpcError } = await supabase
          .rpc('get_user_accessible_orgs');

        if (rpcError) {
          console.error('Error fetching accessible orgs:', rpcError);
          // Fallback: fetch user's direct memberships
          if (!user?.id) {
            console.error('[OrgSwitcher] No user ID available for fallback');
            setLoading(false);
            return;
          }
          
          const { data: memberships, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id);

          if (memberError) {
            console.error('Error fetching memberships:', memberError);
            setLoading(false);
            return;
          }

          const directOrgIds = memberships?.map((m: { organization_id: string }) => m.organization_id) || [];
          if (directOrgIds.length === 0) {
            setLoading(false);
            return;
          }

          const { data: orgs, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, organization_type, parent_organization_id')
            .in('id', directOrgIds);

          if (orgError) {
            console.error('Error fetching organizations:', orgError);
            setLoading(false);
            return;
          }

          const orgsArray1 = (orgs || []) as Organization[];
          setOrganizations(orgsArray1);
          setCurrentOrg(orgsArray1.find((o: Organization) => o.id === currentOrgId) || orgsArray1[0] || null);
          setLoading(false);
          return;
        }

        // Fetch organizations using the accessible org IDs
        if (orgIds && orgIds.length > 0) {
          const { data: orgs, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, organization_type, parent_organization_id')
            .in('id', orgIds);

          if (orgError) {
            console.error('Error fetching organizations:', orgError);
            setLoading(false);
            return;
          }

          const orgsArray2 = (orgs || []) as Organization[];
          setOrganizations(orgsArray2);
          setCurrentOrg(orgsArray2.find((o: Organization) => o.id === currentOrgId) || orgsArray2[0] || null);
        }
      } catch (error) {
        console.error('Error in fetchAccessibleOrgs:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && !authLoading && session) {
      fetchAccessibleOrgs();
    } else if (!authLoading && !session) {
      // Auth finished loading but no session - stop loading
      setLoading(false);
    }
  }, [user, currentOrgId, session, authLoading]);

  const handleOrgSelect = (org: Organization) => {
    setCurrentOrg(org);
    onOrgChange(org.id);
    setIsOpen(false);
  };

  // Group orgs hierarchically: each trust with its accessible children beneath;
  // standalone schools (no parent, or parent not in the user's list) go last.
  const groups = useMemo(() => {
    const byId = new Map(organizations.map((o) => [o.id, o]));
    const trusts = organizations
      .filter((o) => o.organization_type === 'trust' || o.organization_type === 'local_authority')
      .sort((a, b) => a.name.localeCompare(b.name));

    const trustGroups = trusts.map((trust) => ({
      trust,
      children: organizations
        .filter((o) => o.parent_organization_id === trust.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));

    const accessibleTrustIds = new Set(trusts.map((t) => t.id));
    const standalone = organizations
      .filter((o) =>
        o.organization_type === 'school' &&
        (!o.parent_organization_id || !accessibleTrustIds.has(o.parent_organization_id)) &&
        // Orphans whose parent IS in the list would already be rendered under that parent,
        // so this filter keeps only genuine standalones.
        !trustGroups.some((g) => g.children.some((c) => c.id === o.id)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return { trustGroups, standalone };
  }, [organizations]);

  if (loading) {
    return (
      <div className="px-4 py-2 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return null;
  }

  if (organizations.length === 1) {
    return (
      <div className="px-4 py-2 bg-gray-50 rounded-lg flex items-center gap-2">
        {currentOrg?.organization_type === 'trust' ? (
          <Building2 size={16} className="text-gray-600" />
        ) : (
          <School size={16} className="text-gray-600" />
        )}
        <span className="text-sm font-medium text-gray-900">{currentOrg?.name}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors w-full text-left"
      >
        {currentOrg?.organization_type === 'trust' ? (
          <Building2 size={16} className="text-gray-600" />
        ) : (
          <School size={16} className="text-gray-600" />
        )}
        <span className="text-sm font-medium text-gray-900 flex-1 truncate">
          {currentOrg?.name}
        </span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            {groups.trustGroups.map(({ trust, children }) => (
              <div key={trust.id} className="border-b border-gray-100 last:border-b-0">
                {/* Trust row */}
                <button
                  onClick={() => handleOrgSelect(trust)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                    trust.id === currentOrgId ? 'bg-blue-50' : ''
                  }`}
                >
                  <Building2 size={16} className="text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {trust.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {trust.organization_type.replace('_', ' ')} · {children.length} {children.length === 1 ? 'school' : 'schools'}
                    </div>
                  </div>
                  {trust.id === currentOrgId && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </button>
                {/* Child schools indented */}
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleOrgSelect(child)}
                    className={`w-full pl-10 pr-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left ${
                      child.id === currentOrgId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <School size={14} className="text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-800 truncate">
                        {child.name}
                      </div>
                    </div>
                    {child.id === currentOrgId && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            ))}
            {groups.standalone.length > 0 && (
              <div className="border-t border-gray-100">
                <div className="px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  Standalone schools
                </div>
                {groups.standalone.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgSelect(org)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                      org.id === currentOrgId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <School size={16} className="text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {org.name}
                      </div>
                    </div>
                    {org.id === currentOrgId && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

