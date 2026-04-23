/**
 * Step 4: Pricing Breakdown
 *
 * Shows detailed pricing with volume discounts applied.
 */

import { useState, useEffect } from "react";

interface Step4Props {
  data: any;
  onUpdate: (newData: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step4_PricingBreakdown({ data, onUpdate, onNext, onPrev }: Step4Props) {
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculatePricing();
  }, [data]);

  const calculatePricing = async () => {
    const requestBody = {
      schools: data.selectedSchools?.map((school: any) => {
        const schoolData = data.schoolModules?.find((m: any) => m.urn === school.urn);
        return {
          urn: school.urn,
          name: school.name,
          modules: schoolData?.modules || []
        };
      }) || [],
      billingOption: data.invoicingOption || "trust"
    };

    try {
      const response = await fetch("/api/onboarding/calculate-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      setPricing(result);
      onUpdate({ pricingResult: result });
    } catch (error) {
      console.error("Pricing calculation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 mt-4">Calculating pricing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Pricing Breakdown</h2>
        <p className="text-gray-600">Review your subscription costs</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* School Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Per-School Costs</h3>
          <div className="space-y-3">
            {pricing?.schools?.map((school: any) => (
              <div key={school.urn} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{school.name}</p>
                  <p className="text-sm text-gray-500">
                    {school.modules?.map((m: any) => m.name).join(", ") || "No modules"}
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-900">£{school.subtotal}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-gray-200 pt-6">
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Subtotal ({pricing?.summary?.schoolCount} schools)</span>
              <span className="font-semibold text-gray-900">£{pricing?.summary?.subtotal}</span>
            </div>

            {pricing?.summary?.discount && (
              <div className="flex justify-between text-lg">
                <span className="text-green-600">
                  Discount ({pricing.summary.discount.percentage}%)
                </span>
                <span className="font-semibold text-green-600">
                  -£{pricing.summary.discount.amount}
                </span>
              </div>
            )}

            <div className="flex justify-between text-2xl pt-4 border-t border-gray-200">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-blue-600">£{pricing?.summary?.total}</span>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4">
              Billed: {pricing?.summary?.billingOption === "trust" ? "Single invoice to Trust" : "Per school"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onPrev} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium">
          ← Back
        </button>
        <button onClick={onNext} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Continue →
        </button>
      </div>
    </div>
  );
}
