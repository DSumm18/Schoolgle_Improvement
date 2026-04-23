/**
 * Step 7: Payment Instructions
 *
 * Shows payment details and remittance upload.
 */

import { useState } from "react";

interface Step7Props {
  data: any;
  onUpdate: (newData: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step7_PaymentInstructions({ data, onUpdate, onNext, onPrev }: Step7Props) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const paymentReference = `SG-${data.trustName?.replace(/[^A-Z0-9]/g, "").substring(0, 10).toUpperCase()}-${data.selectedSchools?.[0]?.urn || ""}`;

  const handleRemittanceUpload = async (file: File) => {
    setUploading(true);

    try {
      // Upload to Supabase Storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("contractId", data.contractId);

      const response = await fetch("/api/onboarding/upload-remittance", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        setUploaded(true);
        onUpdate({ remittanceUploaded: true });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Details</h2>
        <p className="text-gray-600">Complete your payment to activate access</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Payment Reference */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Reference</h3>
          <p className="text-2xl font-mono font-bold text-blue-600">{paymentReference}</p>
          <p className="text-sm text-blue-700 mt-2">Use this reference when making payment</p>
        </div>

        {/* Bank Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Transfer Details</h3>
          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Account Name</span>
              <span className="font-semibold">Schoolgle Limited</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sort Code</span>
              <span className="font-mono font-semibold">XX-XX-XX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account Number</span>
              <span className="font-mono font-semibold">XXXXXXXX</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3">
              <span className="text-gray-600">Amount</span>
              <span className="text-2xl font-bold text-blue-600">£{data.pricingResult?.summary?.total}</span>
            </div>
          </div>
        </div>

        {/* Remittance Upload */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Remittance</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {uploaded ? (
              <div className="text-green-600">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="font-semibold">Remittance uploaded successfully</p>
              </div>
            ) : (
              <div>
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 mb-4">Upload your remittance advice</p>
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleRemittanceUpload(e.target.files[0])}
                  disabled={uploading}
                  className="hidden"
                  id="remittance"
                />
                <label
                  htmlFor="remittance"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:bg-gray-300"
                >
                  {uploading ? "Uploading..." : "Choose File"}
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Your access will activate on the contract start date ({new Date(data.startDate).toLocaleDateString("en-GB")})
            regardless of when payment is received. We'll confirm payment within 24 hours.
          </p>
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
