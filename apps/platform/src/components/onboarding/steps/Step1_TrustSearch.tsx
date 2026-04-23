/**
 * Step 1: Trust Identification
 *
 * User searches for their trust by name or Companies House number.
 * Displays trust preview with school count and region.
 */

import { useState } from "react";

interface Step1Props {
  data: any;
  onUpdate: (newData: any) => void;
  onNext: () => void;
}

export function Step1_TrustSearch({ data, onUpdate, onNext }: Step1Props) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const searchTrust = async () => {
    if (!query || query.length < 2) {
      setError("Please enter at least 2 characters");
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/onboarding/search-trust?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      if (!data.found) {
        setError(data.message || "No trusts found");
        setResults(null);
        return;
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message || "Failed to search for trust");
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  const selectTrust = (trust: any) => {
    onUpdate({
      trustName: trust.trustName,
      trustCode: trust.trustCode,
      trustData: trust
    });
    onNext();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchTrust();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Find Your Trust</h2>
        <p className="text-gray-600">
          Enter your trust name or Companies House number to get started
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Pennine Academies Yorkshire"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={searching}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={searchTrust}
            disabled={searching || !query}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">{error}</p>
            <p className="text-amber-600 text-xs mt-1">
              Contact us at{" "}
              <a href="mailto:hello@schoolgle.co.uk" className="underline">
                hello@schoolgle.co.uk
              </a>{" "}
              for manual setup
            </p>
          </div>
        )}
      </div>

      {/* Search Results */}
      {results && results.found && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Found {results.resultCount} trust{results.resultCount > 1 ? "s" : ""}
          </h3>

          {results.trusts.map((trust: any, index: number) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => selectTrust(trust)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {trust.trustName}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Schools</p>
                      <p className="font-semibold text-gray-900">{trust.schoolCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Primary</p>
                      <p className="font-semibold text-blue-600">{trust.breakdown.primary}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Secondary</p>
                      <p className="font-semibold text-purple-600">{trust.breakdown.secondary}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Pupils</p>
                      <p className="font-semibold text-gray-900">
                        {trust.breakdown.totalPupils.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lottie Placeholder */}
      {!results && !error && !searching && (
        <div className="text-center py-12">
          <div className="inline-block w-64 h-64 bg-gray-100 rounded-xl flex items-center justify-center">
            <p className="text-gray-400 text-sm">Lottie Animation: Trust Search</p>
          </div>
          <p className="text-gray-500 mt-4 text-sm">
            Search for your trust to see available schools
          </p>
        </div>
      )}
    </div>
  );
}
