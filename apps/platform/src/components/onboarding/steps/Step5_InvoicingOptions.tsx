/**
 * Step 5: Invoicing Options
 *
 * User chooses invoicing method and contract dates.
 */

import { useState } from "react";

interface Step5Props {
  data: any;
  onUpdate: (newData: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step5_InvoicingOptions({ data, onUpdate, onNext, onPrev }: Step5Props) {
  const [invoicingOption, setInvoicingOption] = useState(data.invoicingOption || "trust");
  const [startDate, setStartDate] = useState(data.startDate || "");
  const [endDate, setEndDate] = useState(data.endDate || "");
  const [autoRenew, setAutoRenew] = useState(true);

  const handleNext = () => {
    onUpdate({
      invoicingOption,
      startDate,
      endDate
    });
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Invoicing & Contract</h2>
        <p className="text-gray-600">Choose your billing preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Invoicing Option */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoicing Method</h3>
          <div className="space-y-3">
            {[
              { value: "trust", label: "Single invoice to Trust", desc: "Consolidated billing for all schools" },
              { value: "individual", label: "Individual invoices", desc: "Separate invoice per school" },
              { value: "split", label: "Split invoicing", desc: "Custom per-school billing" }
            ].map((option) => (
              <div
                key={option.value}
                onClick={() => setInvoicingOption(option.value)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  invoicingOption === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    invoicingOption === option.value
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}>
                    {invoicingOption === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${invoicingOption === option.value ? "text-blue-900" : "text-gray-900"}`}>
                      {option.label}
                    </p>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Dates */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Period</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRenew"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="autoRenew" className="text-sm text-gray-700">
              Auto-renew for 12 months (can be cancelled with 30 days' notice)
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Summary:</strong> {data.pricingResult?.summary?.schoolCount} schools, £{data.pricingResult?.summary?.total}/year
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onPrev} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium">
          ← Back
        </button>
        <button onClick={handleNext} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Generate Contract →
        </button>
      </div>
    </div>
  );
}
