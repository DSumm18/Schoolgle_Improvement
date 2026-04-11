"use client";

import { useState, useEffect } from "react";
import { School, Search, ExternalLink, CheckCircle2, MapPin, Phone } from "lucide-react";
import type { GIASSchool, GIASSchoolSummary } from "@/lib/connectors/gias/types";

interface GIASConnectorCardProps {
  onSchoolSelect?: (school: GIASSchoolSummary) => void;
  defaultURN?: number;
  autoFetch?: boolean;
}

export function GIASConnectorCard({ onSchoolSelect, defaultURN, autoFetch }: GIASConnectorCardProps) {
  const [query, setQuery] = useState(defaultURN?.toString() || "");
  const [school, setSchool] = useState<GIASSchool | null>(null);
  const [results, setResults] = useState<GIASSchoolSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch school data on mount when autoFetch is true
  useEffect(() => {
    if (autoFetch && defaultURN) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, defaultURN]);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSchool(null);
    setResults([]);

    try {
      const isURN = /^\d{5,6}$/.test(query.trim());

      if (isURN) {
        // Direct call to public DfE GIAS API — no auth needed
        const res = await fetch(`https://dfe-digital.github.io/gias-data/schools/${query.trim()}.json`);
        if (!res.ok) {
          setError(res.status === 404 ? "School not found — check the URN" : "Failed to fetch from DfE");
          return;
        }
        const data = await res.json();
        setSchool(data);
      } else {
        // Search goes via our API (needs auth)
        const res = await fetch(`/api/connectors/gias?search=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch");
          return;
        }
        if (data.schools) {
          setResults(data.schools);
        }
      }
    } catch {
      setError("Network error — could not reach GIAS data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d70b8]/10">
          <School className="h-5 w-5 text-[#1d70b8]" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">GIAS School Lookup</h3>
          <p className="text-sm text-gray-500">Search DfE school directory by URN or name</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3 w-3" /> Active
        </span>
      </div>

      {/* Search */}
      <div className="px-5 py-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter URN (e.g. 148201) or school name"
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-[#1d70b8] focus:outline-none focus:ring-1 focus:ring-[#1d70b8]"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="rounded-lg bg-[#1d70b8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d70b8]/90 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Single School Result */}
      {school && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{school.name}</h4>
                <p className="mt-1 text-sm text-gray-600">
                  URN: {school.urn} &middot; {school.phase_of_education} &middot; {school.type}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  school.status === "Open"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {school.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {school.address_1}, {school.postcode}
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {school.phone || "No phone"}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="text-gray-500">LA: {school.local_authority}</span>
              {school.school_website && (
                <a
                  href={school.school_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#1d70b8] hover:underline"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-4">
          <p className="mb-3 text-sm text-gray-500">{results.length} schools found</p>
          <div className="space-y-2">
            {results.map((s) => (
              <button
                key={s.urn}
                onClick={() => {
                  setQuery(s.urn.toString());
                  onSchoolSelect?.(s);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-gray-100 p-3 text-left hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">
                    URN: {s.urn} &middot; {s.phase} &middot; {s.localAuthority} &middot; {s.postcode}
                  </p>
                </div>
                {s.isAcademy && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    Academy
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
