"use client";

import React, { useState, useCallback } from "react";
import { InputForm } from "@/components/hr/maternity-calculator/InputForm";
import { ResultsDisplay } from "@/components/hr/maternity-calculator/ResultsDisplay";
import {
  calculateEntitlements,
  CalculatorInputs,
  CalculationResults,
} from "@/lib/hr/calculationEngine";
import { Baby } from "lucide-react";
import {
  ModulePageHeader,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";

export default function MaternityLeaveCalculatorPage() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    role: "teacher",
    schoolType: "maintained",
    serviceYears: 2,
    serviceMonths: 0,
    laServiceYears: 2,
    laServiceMonths: 0,
    academyPolicy: "statutory",
    annualSalary: 35000,
    isAnnualised: "yes",
    leaveType: "maternity",
    ewcOrPlacementDate: "",
    leaveStartDate: "",
    returnIntent: "yes",
    splMotherWeeksTaken: 10,
    splPartnerWeeksToTake: 12,
  });
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [error, setError] = useState<string>("");

  const handleInputChange = useCallback((event: any) => {
    const { name, value, type, checked } = event.target || event;
    const isCheckbox = type === "checkbox";

    setInputs((prev: any) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));

    setResults(null);
    setError("");
  }, []);

  const handleCalculate = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      setError("");

      if (!inputs.ewcOrPlacementDate) {
        setError(
          "Please enter the Expected Week of Childbirth or Placement Date.",
        );
        return;
      }

      try {
        const calculatedResults = calculateEntitlements(inputs);
        setResults(calculatedResults);
      } catch (err: any) {
        setError(err.message || "Calculation error");
      }
    },
    [inputs],
  );

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="hr"
        icon={Baby}
        label="HR & People"
        title="Parental Pay Calculator"
        description="Estimate entitlements for maternity, paternity, and adoption leave based on current UK law."
      />

      <div className="max-w-2xl">
        <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <InputForm
            inputs={inputs}
            handleInputChange={handleInputChange}
            handleCalculate={handleCalculate}
          />
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-800/30">
            {error}
          </div>
        )}

        {results && (
          <div className="mt-6">
            <ResultsDisplay results={results} />
          </div>
        )}
      </div>

      <div className="max-w-2xl">
        <ModuleFeatureBanner
          moduleId="hr"
          title="Important Notice"
          description="This calculator provides estimates only based on current UK law (April 2024 rates). Always verify calculations with your HR department or payroll provider."
        />
      </div>
    </div>
  );
}
