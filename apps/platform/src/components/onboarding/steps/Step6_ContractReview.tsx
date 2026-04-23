/**
 * Step 6: Contract Review
 *
 * Preview contract and accept terms.
 */

import { useState } from "react";

interface Step6Props {
  data: any;
  onUpdate: (newData: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step6_ContractReview({ data, onUpdate, onNext, onPrev }: Step6Props) {
  const [generating, setGenerating] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const generateContract = async () => {
    setGenerating(true);

    try {
      const response = await fetch("/api/onboarding/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: "placeholder", // Will be set in real flow
          selectedSchools: data.selectedSchools,
          pricing: data.pricingResult?.summary,
          invoicingOption: data.invoicingOption,
          startDate: data.startDate,
          endDate: data.endDate,
          signers: [] // Will be collected separately
        })
      });

      const result = await response.json();
      setContractUrl(result.contract?.pdfUrl);
      onUpdate({ contractId: result.contract?.id, contractPdfUrl: result.contract?.pdfUrl });
    } catch (error) {
      console.error("Contract generation failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleNext = () => {
    if (!accepted) {
      alert("Please accept the contract terms");
      return;
    }
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Contract</h2>
        <p className="text-gray-600">Check the details before proceeding</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Contract Preview */}
        <div className="mb-8">
          {!contractUrl ? (
            <div className="text-center py-12">
              <button
                onClick={generateContract}
                disabled={generating}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium"
              >
                {generating ? "Generating..." : "Generate Contract"}
              </button>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <iframe src={contractUrl} className="w-full h-96" />
            </div>
          )}
        </div>

        {/* Key Terms */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Terms</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Schools</p>
              <p className="font-semibold">{data.selectedSchools?.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Value</p>
              <p className="font-semibold">£{data.pricingResult?.summary?.total}</p>
            </div>
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="font-semibold">{new Date(data.startDate).toLocaleDateString("en-GB")}</p>
            </div>
            <div>
              <p className="text-gray-500">End Date</p>
              <p className="font-semibold">{new Date(data.endDate).toLocaleDateString("en-GB")}</p>
            </div>
          </div>
        </div>

        {/* Accept Terms */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-5 h-5 mt-1"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-700">
              I accept the contract terms and conditions. I understand that my access will activate on the
              contract start date regardless of payment timing.
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onPrev} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium">
          ← Back
        </button>
        <button onClick={handleNext} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Continue to Payment →
        </button>
      </div>
    </div>
  );
}
