"use client";

import { CheckCircle2, Loader2 } from "lucide-react";

interface LoadingStepsProps {
  currentStep: number;
}

const steps = [
  "Fetching product page...",
  "Extracting product details...",
  "Searching 20+ suppliers...",
  "Calculating savings...",
];

export function LoadingSteps({ currentStep }: LoadingStepsProps) {
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 transition-all duration-300 ${
                isPending ? "opacity-30" : "opacity-100"
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-cyan-500 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  isCurrent ? "text-gray-900 font-medium" : "text-gray-500"
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
