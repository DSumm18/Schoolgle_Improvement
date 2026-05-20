"use client";

import { useState, useEffect, useMemo, useLayoutEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronRight, Building2, School } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/SupabaseAuthContext";

interface Organization {
  id: string;
  name: string;
  organization_type: 'school' | 'trust' | 'local_authority';
  parent_organization_id: string | null;
  role?: string;
  settings?: {
    logo_url?: string | null;
    trust_logo_url?: string | null;
  } | null;
}

interface OrgSwitcherProps {
  currentOrgId: string;
  onOrgChange: (orgId: string) => void;
}

const ORG_SWITCHER_SCROLL_KEY = "schoolgle-org-switcher-scroll-top";

export default function OrgSwitcher({ currentOrgId, onOrgChange }: OrgSwitcherProps) {
  const { user, session, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);
  const dropdownScrollRef = useRef<HTMLDivElement | null>(null);
  const selectedOrgButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastDropdownScrollTopRef = useRef(0);

  const activeOrgId = currentOrg?.id || currentOrgId;

  const persistDropdownScroll = useCallback((scrollTop: number) => {
    lastDropdownScrollTopRef.current = scrollTop;
    try {
      sessionStorage.setItem(ORG_SWITCHER_SCROLL_KEY, String(scrollTop));
    } catch {
      // Session storage may be unavailable in restricted browser contexts.
    }
  }, []);

  const readStoredDropdownScroll = useCallback(() => {
    if (lastDropdownScrollTopRef.current > 0) {
      return lastDropdownScrollTopRef.current;
    }

    try {
      const stored = Number(sessionStorage.getItem(ORG_SWITCHER_SCROLL_KEY) || 0);
      return Number.isFinite(stored) ? stored : 0;
    } catch {
      return 0;
    }
  }, []);

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
        const response = await fetch('/api/organizations/accessible', {
          headers: session.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });

        if (response.ok) {
          const data = await response.json();
          const orgsArray = (data.organizations || []) as Organization[];
          setOrganizations(orgsArray);
          setCurrentOrg(orgsArray.find((o: Organization) => o.id === currentOrgId) || orgsArray[0] || null);
          setLoading(false);
          return;
        }

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
            .select('id, name, organization_type, parent_organization_id, settings')
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
            .select('id, name, organization_type, parent_organization_id, settings')
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
    if (dropdownScrollRef.current) {
      persistDropdownScroll(dropdownScrollRef.current.scrollTop);
    }
    setExpandedParentId(
      org.organization_type === 'trust' || org.organization_type === 'local_authority'
        ? org.id
        : org.parent_organization_id,
    );
    setCurrentOrg(org);
    onOrgChange(org.id);
    setIsOpen(false);
  };

  const getLogoUrl = (org?: Organization | null) => {
    if (!org) return null;
    return org.organization_type === 'trust' || org.organization_type === 'local_authority'
      ? org.settings?.trust_logo_url || org.settings?.logo_url || null
      : org.settings?.logo_url || null;
  };

  const OrgMark = ({ org, size = 'md' }: { org?: Organization | null; size?: 'sm' | 'md' }) => {
    const logoUrl = getLogoUrl(org);
    const dimensions = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
    const iconSize = size === 'sm' ? 14 : 16;
    const isTrust = org?.organization_type === 'trust' || org?.organization_type === 'local_authority';

    return (
      <span className={`${dimensions} shrink-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm flex items-center justify-center`}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={org?.name ? `${org.name} logo` : 'Organization logo'}
            className="h-full w-full object-contain p-0.5"
          />
        ) : isTrust ? (
          <Building2 size={iconSize} className="text-muted-foreground" />
        ) : (
          <School size={iconSize} className="text-muted-foreground" />
        )}
      </span>
    );
  };

  // Group orgs hierarchically: each trust with its accessible children beneath;
  // standalone schools (no parent, or parent not in the user's list) go last.
  const groups = useMemo(() => {
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

  const activeParentGroupId = useMemo(() => {
    const activeOrg = organizations.find((org) => org.id === activeOrgId);
    if (!activeOrg) return null;

    if (
      activeOrg.organization_type === 'trust' ||
      activeOrg.organization_type === 'local_authority'
    ) {
      return activeOrg.id;
    }

    const hasAccessibleParent = groups.trustGroups.some(
      ({ trust }) => trust.id === activeOrg.parent_organization_id,
    );

    return hasAccessibleParent ? activeOrg.parent_organization_id : null;
  }, [activeOrgId, groups.trustGroups, organizations]);

  useEffect(() => {
    if (!isOpen || expandedParentId || !activeParentGroupId) return;
    setExpandedParentId(activeParentGroupId);
  }, [activeParentGroupId, expandedParentId, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !dropdownScrollRef.current) return;

    const storedScrollTop = readStoredDropdownScroll();
    if (storedScrollTop > 0) {
      dropdownScrollRef.current.scrollTop = storedScrollTop;
      return;
    }

    if (typeof selectedOrgButtonRef.current?.scrollIntoView === "function") {
      selectedOrgButtonRef.current.scrollIntoView({
        block: "nearest",
      });
    }
  }, [activeOrgId, groups, isOpen, readStoredDropdownScroll]);

  if (loading) {
    return (
      <div className="px-4 py-2 bg-muted rounded-lg animate-pulse">
        <div className="h-4 w-32 bg-muted-foreground/20 rounded"></div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return null;
  }

  if (organizations.length === 1) {
    return (
      <div className="px-3 py-2 bg-card border border-border rounded-lg flex items-center gap-2">
        <OrgMark org={currentOrg} />
        <span className="text-sm font-medium text-foreground truncate">{currentOrg?.name}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (isOpen && dropdownScrollRef.current) {
            persistDropdownScroll(dropdownScrollRef.current.scrollTop);
          }
          if (!isOpen) {
            setExpandedParentId(activeParentGroupId);
          }
          setIsOpen(!isOpen);
        }}
        className="px-3 py-2 bg-card hover:bg-accent border border-border rounded-lg flex items-center gap-2 transition-colors w-full text-left"
      >
        <OrgMark org={currentOrg} />
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {currentOrg?.name}
        </span>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              if (dropdownScrollRef.current) {
                persistDropdownScroll(dropdownScrollRef.current.scrollTop);
              }
              setIsOpen(false);
            }}
          />
          <div
            ref={dropdownScrollRef}
            data-testid="org-switcher-menu"
            onScroll={(event) => persistDropdownScroll(event.currentTarget.scrollTop)}
            className="absolute top-full left-0 mt-2 w-full bg-popover text-popover-foreground rounded-lg shadow-lg border border-border z-20 max-h-96 overflow-y-auto"
          >
            {groups.trustGroups.map(({ trust, children }) => {
              const isExpanded = expandedParentId === trust.id;

              return (
              <div key={trust.id} className="border-b border-border last:border-b-0">
                {/* Parent organization group row */}
                <button
                  ref={
                    trust.id === activeOrgId && !isExpanded
                      ? selectedOrgButtonRef
                      : null
                  }
                  onClick={() => {
                    if (children.length === 0) {
                      handleOrgSelect(trust);
                      return;
                    }

                    setExpandedParentId((current) =>
                      current === trust.id ? null : trust.id,
                    );
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left ${
                    trust.id === activeOrgId ? 'bg-primary/10' : ''
                  }`}
                >
                  <OrgMark org={trust} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {trust.name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {trust.organization_type.replace('_', ' ')} · {children.length} {children.length === 1 ? 'school' : 'schools'}
                    </div>
                  </div>
                  {children.length > 0 && (
                    isExpanded ? (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground" />
                    )
                  )}
                  {trust.id === activeOrgId && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </button>
                {isExpanded && (
                  <div className="bg-muted/20">
                    <button
                      ref={trust.id === activeOrgId ? selectedOrgButtonRef : null}
                      onClick={() => handleOrgSelect(trust)}
                      className={`w-full pl-10 pr-4 py-2 flex items-center gap-2 hover:bg-accent transition-colors text-left ${
                        trust.id === activeOrgId ? 'bg-primary/10' : ''
                      }`}
                    >
                      <OrgMark org={trust} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground truncate">
                          Open {trust.name} overview
                        </div>
                      </div>
                      {trust.id === activeOrgId && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </button>
                    {/* Child schools indented */}
                {children.map((child) => (
                  <button
                    key={child.id}
                    ref={child.id === activeOrgId ? selectedOrgButtonRef : null}
                    onClick={() => handleOrgSelect(child)}
                    className={`w-full pl-10 pr-4 py-2 flex items-center gap-2 hover:bg-accent transition-colors text-left ${
                      child.id === activeOrgId ? 'bg-primary/10' : ''
                    }`}
                  >
                    <OrgMark org={child} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">
                        {child.name}
                      </div>
                    </div>
                    {child.id === activeOrgId && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </button>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
            {groups.standalone.length > 0 && (
              <div className="border-t border-border">
                <div className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                  Standalone schools
                </div>
                {groups.standalone.map((org) => (
                  <button
                    key={org.id}
                    ref={org.id === activeOrgId ? selectedOrgButtonRef : null}
                    onClick={() => handleOrgSelect(org)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left ${
                      org.id === activeOrgId ? 'bg-primary/10' : ''
                    }`}
                  >
                    <OrgMark org={org} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {org.name}
                      </div>
                    </div>
                    {org.id === activeOrgId && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
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
