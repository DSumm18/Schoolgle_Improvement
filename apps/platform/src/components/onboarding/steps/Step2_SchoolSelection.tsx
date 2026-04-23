/**
 * Step 2: School Selection
 *
 * User selects which schools from the trust to onboard.
 * Can filter by phase (primary/secondary) and select all.
 */

import { useState } from "react";

interface Step2Props {
  data: any;
  onUpdate: (newData: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step2_SchoolSelection({ data, onUpdate, onNext, onPrev }: Step2Props) {
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(
    new Set(data.selectedSchools?.map((s: any) => s.urn) || [])
  );
  const [filter, setFilter] = useState<"all" | "primary" | "secondary">>("all");
  const [showConfirm, setShowConfirm] = useState(false);

  const schools = data.trustData?.schools || [];

  const filteredSchools = schools.filter((school: any) => {
    if (filter === "all") return true;
    return school.phase?.toLowerCase().includes(filter);
  });

  const toggleSchool = (urn: string) => {
    const newSelected = new Set(selectedSchools);
    if (newSelected.has(urn)) {
      newSelected.delete(urn);
    } else {
      newSelected.add(urn);
    }
    setSelectedSchools(newSelected);
  };

  const selectAll = () => {
    const newSelected = new Set(filteredSchools.map((s: any) => s.urn));
    setSelectedSchools(newSelected);
  };

  const clearAll = () => {
    setSelectedSchools(new Set());
  };

  const handleNext = () => {
    if (selectedSchools.size === 0) {
      alert("Please select at least one school");
      return;
    }

    const selected = schools.filter((s: any) => selectedSchools.has(s.urn));
    onUpdate({ selectedSchools: selected });
    setShowConfirm(true);
  };

  const confirmSelection = () => {
    const selected = schools.filter((s: any) => selectedSchools.has(s.urn));
    onUpdate({ selectedSchools: selected });
    setShowConfirm(false);
    onNext();
  };

  const totalPupils = schools
    .filter((s: any) => selectedSchools.has(s.urn))
    .reduce((sum: number, s: any) => sum + (s.pupilCount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Schools</h2>
        <p className="text-gray-600">
          Choose which schools from {data.trustData?.trustName} to onboard
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Schools
          </button>
          <button
            onClick={() => setFilter("primary")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "primary"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Primary
          </button>
          <button
            onClick={() => setFilter("secondary")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "secondary"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Secondary
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Selection Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Selected: <span className="font-bold text-gray-900">{selectedSchools.size} of {schools.length} schools</span>
            </span>
            <span className="text-gray-600">
              Total pupils: <span className="font-bold text-gray-900">{totalPupils.toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* School List */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredSchools.map((school: any) => {
            const isSelected = selectedSchools.has(school.urn);
            const isPrimary = school.phase?.toLowerCase().includes("primary");

            return (
              <div
                key={school.urn}
                onClick={() => toggleSchool(school.urn)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  <div>
                    <h4 className={`font-semibold ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                      {school.name}
                    </h4>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      <span>URN: {school.urn}</span>
                      <span className={`px-2 py-0.5 rounded ${
                        isPrimary
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {school.phase || "Unknown"}
                      </span>
                      <span>{school.pupilCount || 0} pupils</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={selectedSchools.size === 0}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          Continue →
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirm Selection</h3>
            <p className="text-gray-600 mb-6">
              You've selected <span className="font-bold text-blue-600">{selectedSchools.size}</span> of{" "}
              <span className="font-bold">{schools.length}</span> schools in{" "}
              <span className="font-bold">{data.trustData?.trustName}</span>.
            </p>
            <p className="text-gray-500 mb-6 text-sm">
              You can always add more schools later. Continue?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Go Back
              </button>
              <button
                onClick={confirmSelection}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
