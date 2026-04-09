"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  School,
  AlertCircle,
  PoundSterling,
  FileText,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Search,
  MoreVertical,
  Activity,
  MessageSquare,
  Loader2
} from "lucide-react";

interface ContractData {
  organization_id: string;
  contract_type: string;
  contract_status: string;
  active_modules: string[];
  annual_value: number;
  end_date: string;
}

interface OrganizationData {
  id: string;
  name: string;
  org_type: string;
  parent_organization_id: string | null;
  created_at: string;
  contract: ContractData | null;
  open_tickets: number;
}

export default function MissionControlClients() {
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTrusts, setExpandedTrusts] = useState<Set<string>>(new Set());

  async function fetchClients() {
    setLoading(true);
    try {
      const res = await fetch("/api/mission-control/clients");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.clients || []);
      }
    } catch (e) {
      console.error("Failed to fetch CRM clients:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, []);

  const toggleTrust = (id: string) => {
    const next = new Set(expandedTrusts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTrusts(next);
  };

  // Build Hierarchy (MAT -> Schools)
  const trusts = organizations.filter(org => org.org_type === "trust");
  // Some schools might not have a parent_organization_id, treat them as top-level independents
  const independentSchools = organizations.filter(
    org => org.org_type === "school" && !org.parent_organization_id
  );

  const getChildSchools = (trustId: string) => {
    return organizations.filter(org => org.org_type === "school" && org.parent_organization_id === trustId);
  };

  const filteredTrusts = trusts.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredIndependents = independentSchools.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderClientRow = (org: OrganizationData, isChild: boolean = false) => {
    const hasChildren = org.org_type === "trust";
    const isExpanded = expandedTrusts.has(org.id);
    const children = hasChildren ? getChildSchools(org.id) : [];
    
    // Aggregates for MATs
    const totalMRR = hasChildren 
      ? children.reduce((sum, c) => sum + (c.contract?.annual_value || 0), org.contract?.annual_value || 0)
      : org.contract?.annual_value || 0;

    return (
      <div key={org.id} className="flex flex-col">
        <div 
          className={`flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800 ${isChild ? 'bg-zinc-900/30 pl-16' : ''}`}
        >
          {hasChildren ? (
            <button 
              onClick={() => toggleTrust(org.id)}
              className="p-1 rounded hover:bg-zinc-700 transition"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
            </button>
          ) : (
            <div className="w-6" /> // spacer
          )}

          <div className={`p-2 rounded-lg ${hasChildren ? 'bg-indigo-900/30 text-indigo-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
            {hasChildren ? <Building2 className="w-5 h-5" /> : <School className="w-5 h-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-zinc-100 flex items-center gap-2">
              {org.name}
              {org.contract?.contract_status === 'active' && <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-900/30 text-green-400 font-bold uppercase tracking-wider">Active</span>}
            </p>
            <p className="text-xs text-zinc-500 capitalize">{org.org_type} {hasChildren && `• ${children.length} Schools`}</p>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-6">
            {org.open_tickets > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                <AlertCircle className="w-4 h-4" />
                {org.open_tickets} Tickets
              </div>
            )}
            
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-300">£{(totalMRR / 12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}/mo</p>
              <p className="text-xs text-zinc-600">MRR</p>
            </div>

            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors mr-2">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Render nested schools if expanded */}
        {hasChildren && isExpanded && children.map(child => renderClientRow(child, true))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            CRM Pipeline
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage Multi-Academy Trusts, Schools, and Support Tickets
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchClients}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 py-2 text-sm text-white font-medium transition-colors shadow">
            + New Contract
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Total Monthly Recurring Revenue</h3>
          <p className="text-3xl font-bold text-emerald-400">
            £{((organizations.reduce((sum, o) => sum + (o.contract?.annual_value || 0), 0)) / 12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Total Organizations</h3>
          <p className="text-3xl font-bold text-zinc-100 flex items-baseline gap-2">
            {organizations.length} <span className="text-sm font-medium text-zinc-500 lowercase">({trusts.length} MATs)</span>
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Open Support Tickets</h3>
          <p className="text-3xl font-bold text-amber-400">
            {organizations.reduce((sum, o) => sum + o.open_tickets, 0)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search trusts or schools..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/50"><Activity className="w-3 h-3 text-emerald-400"/> Active Clients</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading enterprise CRM...</p>
          </div>
        ) : filteredTrusts.length === 0 && filteredIndependents.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm">No clients match your search.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredTrusts.map(t => renderClientRow(t))}
            {filteredIndependents.map(s => renderClientRow(s))}
          </div>
        )}
      </div>
    </div>
  );
}
