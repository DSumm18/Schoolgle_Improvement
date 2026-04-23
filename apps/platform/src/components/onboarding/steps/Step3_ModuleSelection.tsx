/**
 * Step 3: Module Selection
 *
 * User selects modules for each school.
 * Shows live pricing and allows mix & match.
 */

import { useState, useEffect } from "react";

interface Step3Props {
  data: any;
  onUpdate: (newData: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step3_ModuleSelection({ data, onUpdate, onNext, onPrev }: Step3Props) {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolModules, setSchoolModules] = useState<
    Map<string, Set<string>>
  >(new Map());

  // Available modules (hardcoded for now, will fetch from API)
  const availableModules = [
    {
      id: "school-improvement",
      name: "School Improvement",
      description: "Ofsted readiness, SEF, improvement planning",
      price: 500,
      color: "blue",
      icon: "🎯"
    },
    {
      id: "business-management",
      name: "Business Management",
      description: "Estates, HR, governance, compliance",
      price: 400,
      color: "green",
      icon: "💼"
    },
    {
      id: "school-intelligence",
      name: "School Intelligence",
      description: "DfE census, pupil data, assessment tracking",
      price: 300,
      color: "orange",
      icon: "🧠"
    }
  ];

  useEffect(() => {
    // Initialize school modules from saved data
    const savedModules = new Map<string, Set<string>>();
    data.selectedSchools?.forEach((school: any) => {
      savedModules.set(school.urn, new Set());
    });
    setSchoolModules(savedModules);
    setLoading(false);
  }, [data.selectedSchools]);

  const toggleModule = (urn: string, moduleId: string) => {
    const newModules = new Map(schoolModules);
    const schoolModules = newModules.get(urn) || new Set();

    if (schoolModules.has(moduleId)) {
      schoolModules.delete(moduleId);
    } else {
      schoolModules.add(moduleId);
    }

    newModules.set(urn, schoolModules);
    setSchoolModules(newModules);
  };

  const applyToAll = (moduleId: string) => {
    const newModules = new Map(schoolModules);
    data.selectedSchools?.forEach((school: any) => {
      const schoolModules = newModules.get(school.urn) || new Set();
      schoolModules.add(moduleId);
      newModules.set(school.urn, schoolModules);
    });
    setSchoolModules(newModules);
  };

  const removeFromAll = (moduleId: string) => {
    const newModules = new Map(schoolModules);
    data.selectedSchools?.forEach((school: any) => {
      const schoolModules = newModules.get(school.urn) || new Set();
      schoolModules.delete(moduleId);
      newModules.set(school.urn, schoolModules);
    });
    setSchoolModules(newModules);
  };

  const calculatePricing = () => {
    let subtotal = 0;
    const breakdown: any[] = [];

    data.selectedSchools?.forEach((school: any) => {
      const schoolModules = schoolModules.get(school.urn) || new Set();
      const schoolTotal = Array.from(schoolModules).reduce((sum, moduleId) => {
        const module = availableModules.find((m) => m.id === moduleId);
        return sum + (module?.price || 0);
      }, 0);

      subtotal += schoolTotal;

      breakdown.push({
        urn: school.urn,
        name: school.name,
        modules: Array.from(schoolModules),
        subtotal: schoolTotal
      });
    });

    return { subtotal, breakdown };
  };

  const handleNext = () => {
    const pricing = calculatePricing();

    // Check at least one module selected
    const totalModules = Array.from(schoolModules.values()).reduce(
      (sum, set) => sum + set.size,
      0
    );

    if (totalModules === 0) {
      alert("Please select at least one module for at least one school");
      return;
    }

    // Convert Map to array for storage
    const schoolModulesArray = data.selectedSchools?.map((school: any) => ({
      urn: school.urn,
      modules: Array.from(schoolModules.get(school.urn) || [])
    }));

    onUpdate({
      schoolModules: schoolModulesArray,
      pricingResult: pricing
    });

    onNext();
  };

  const pricing = calculatePricing();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Modules</h2>
        <p className="text-gray-600">
          Choose which modules to enable for each school
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: School List */}
        <div className="lg:col-span-2 space-y-4">
          {data.selectedSchools?.map((school: any) => {
            const schoolModules = schoolModules.get(school.urn) || new Set();

            return (
              <div key={school.urn} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{school.name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableModules.map((module) => {
                    const isSelected = schoolModules.has(module.id);

                    return (
                      <div
                        key={module.id}
                        onClick={() => toggleModule(school.urn, module.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-2xl">{module.icon}</span>
                          {isSelected && (
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <h4 className={`font-semibold mb-1 ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                          {module.name}
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">{module.description}</p>
                        <p className={`font-bold ${isSelected ? "text-blue-600" : "text-gray-700"}`}>
                          £{module.price}/year
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Pricing Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing Summary</h3>

            {/* Apply to All Buttons */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Quick Actions:</p>
              <div className="space-y-2">
                {availableModules.map((module) => (
                  <div key={module.id} className="flex gap-2">
                    <button
                      onClick={() => applyToAll(module.id)}
                      className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                    >
                      +{module.icon} All
                    </button>
                    <button
                      onClick={() => removeFromAll(module.id)}
                      className="flex-1 px-3 py-2 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                    >
                      -{module.icon} All
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3 mb-6">
              {pricing.breakdown.map((item: any) => (
                <div key={item.urn} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1">{item.name}</span>
                  <span className="font-semibold text-gray-900">£{item.subtotal}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">£{pricing.subtotal}</span>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Volume discounts applied in next step
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Review Pricing →
        </button>
      </div>
    </div>
  );
}
