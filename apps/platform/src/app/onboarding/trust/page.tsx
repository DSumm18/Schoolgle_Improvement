/**
 * Trust Onboarding Wizard
 *
 * Multi-step self-service onboarding for academy trusts.
 *
 * Steps:
 * 1. Trust Identification
 * 2. School Selection
 * 3. Module Selection
 * 4. Pricing Breakdown
 * 5. Invoicing Options
 * 6. Contract Review
 * 7. Payment Instructions
 * 8. User Provisioning
 * 9. Complete
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

// Step components
import { Step1_TrustSearch } from "@/components/onboarding/steps/Step1_TrustSearch";
import { Step2_SchoolSelection } from "@/components/onboarding/steps/Step2_SchoolSelection";
import { Step3_ModuleSelection } from "@/components/onboarding/steps/Step3_ModuleSelection";
import { Step4_PricingBreakdown } from "@/components/onboarding/steps/Step4_PricingBreakdown";
import { Step5_InvoicingOptions } from "@/components/onboarding/steps/Step5_InvoicingOptions";
import { Step6_ContractReview } from "@/components/onboarding/steps/Step6_ContractReview";
import { Step7_PaymentInstructions } from "@/components/onboarding/steps/Step7_PaymentInstructions";
import { Step8_UserProvisioning } from "@/components/onboarding/steps/Step8_UserProvisioning";
import { Step9_Complete } from "@/components/onboarding/steps/Step9_Complete";

interface OnboardingData {
  // Step 1
  trustName: string;
  trustCode: string;
  trustData: any;

  // Step 2
  selectedSchools: any[];

  // Step 3
  schoolModules: { urn: string; modules: string[] }[];

  // Step 4
  pricingResult: any;

  // Step 5
  invoicingOption: "trust" | "individual" | "split";
  startDate: string;
  endDate: string;

  // Step 6
  contractId: string;
  contractPdfUrl: string;

  // Step 7
  paymentReference: string;
  remittanceUploaded: boolean;

  // Step 8
  trustUsers: any[];
  schoolUsers: any[];
}

export default function TrustOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding data state
  const [data, setData] = useState<OnboardingData>({
    trustName: "",
    trustCode: "",
    trustData: null,
    selectedSchools: [],
    schoolModules: [],
    pricingResult: null,
    invoicingOption: "trust",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    contractId: "",
    contractPdfUrl: "",
    paymentReference: "",
    remittanceUploaded: false,
    trustUsers: [],
    schoolUsers: []
  });

  // Load saved progress from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem("onboarding_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
      } catch (e) {
        console.error("Failed to load saved progress:", e);
      }
    }
  }, []);

  // Save progress to session storage
  const saveProgress = (newData: Partial<OnboardingData>, step?: number) => {
    const updated = { ...data, ...newData };
    setData(updated);

    const toSave = {
      ...updated,
      currentStep: step || currentStep
    };

    sessionStorage.setItem("onboarding_data", JSON.stringify(toSave));
  };

  // Navigation handlers
  const goToStep = (step: number) => {
    setCurrentStep(step);
    saveProgress({}, step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextStep = () => {
    if (currentStep < 9) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1_TrustSearch
            data={data}
            onUpdate={(newData) => saveProgress(newData)}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <Step2_SchoolSelection
            data={data}
            onUpdate={(newData) => saveProgress(newData)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <Step3_ModuleSelection
            data={data}
            onUpdate={(newData) => saveProgress(newData)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <Step4_PricingBreakdown
            data={data}
            onUpdate={(newData) => saveProgress(newData)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <Step5_InvoicingOptions
            data={data}
            onUpdate={(newData) => saveProgress(newData)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 6:
        return (
          <Step6_ContractReview
            data={data}
            onUpdate={(newData) => saveProgress(newData)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 7:
        return (
          <Step7_PaymentInstructions
            data={data}
            onUpdate={(newData) => saveProgress(newData)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 8:
        return (
          <Step8_UserProvisioning
            data={data}
            onUpdate={(newData) => saveProgress(newData)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 9:
        return (
          <Step9_Complete
            data={data}
            onUpdate={(newData) => saveProgress(newData)}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Schoolgle</h1>
                <p className="text-sm text-gray-500">Trust Onboarding</p>
              </div>
            </div>
            {currentStep > 1 && currentStep < 9 && (
              <button
                onClick={() => {
                  if (confirm("Exit onboarding? Your progress will be saved.")) {
                    router.push("/dashboard");
                  }
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Save & Exit
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep < 9 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of 8
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / 8) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / 8) * 100}%` }}
              />
            </div>
            {/* Step labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500 hidden md:flex">
              <span>Trust</span>
              <span>Schools</span>
              <span>Modules</span>
              <span>Pricing</span>
              <span>Invoice</span>
              <span>Contract</span>
              <span>Payment</span>
              <span>Users</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStep()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2026 Schoolgle Limited. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
