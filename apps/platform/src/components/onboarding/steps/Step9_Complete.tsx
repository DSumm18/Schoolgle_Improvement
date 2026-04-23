/**
 * Step 9: Complete
 *
 * Success message and next steps.
 */

import { useRouter } from "next/navigation";

interface Step9Props {
  data: any;
  onUpdate: (newData: any) => void;
}

export function Step9_Complete({ data }: Step9Props) {
  const router = useRouter();

  const goToDashboard = () => {
    sessionStorage.removeItem("onboarding_data");
    router.push("/dashboard");
  };

  return (
    <div className="max-w-3xl mx-auto text-center">
      {/* Success Animation */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Schoolgle!</h1>
        <p className="text-xl text-gray-600">Your trust setup is complete</p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Setup Summary</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{data.selectedSchools?.length}</p>
            <p className="text-gray-600">Schools</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{data.trustUsers?.length + data.schoolUsers?.reduce((sum: number, s: any) => sum + s.users?.length, 0)}</p>
            <p className="text-gray-600">Users</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{data.pricingResult?.summary?.total}</p>
            <p className="text-gray-600">Annual Cost</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{new Date(data.startDate).toLocaleDateString("en-GB")}</p>
            <p className="text-gray-600">Start Date</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What Happens Next?</h2>

        <div className="space-y-4 text-left">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Check your email</p>
              <p className="text-gray-600 text-sm">Users will receive login credentials shortly</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Payment confirmation</p>
              <p className="text-gray-600 text-sm">We'll confirm your payment within 24 hours</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Access activates on {new Date(data.startDate).toLocaleDateString("en-GB")}</p>
              <p className="text-gray-600 text-sm">Your modules will be available on the contract start date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={goToDashboard}
        className="px-12 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-green-700 shadow-lg"
      >
        Go to Dashboard
      </button>

      <p className="text-gray-500 text-sm mt-4">
        Questions? Contact us at{" "}
        <a href="mailto:hello@schoolgle.co.uk" className="text-blue-600 hover:underline">
          hello@schoolgle.co.uk
        </a>
      </p>
    </div>
  );
}
