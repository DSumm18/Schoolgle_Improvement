"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  ArrowLeft,
  Search,
  School,
  MapPin,
  Building2,
  Users,
  CheckCircle,
  Loader2,
  AlertCircle,
  Check,
  Crown,
  Sparkles,
  Star,
} from "lucide-react";

interface DFESchoolData {
  urn: number;
  name: string;
  la_name?: string;
  la_code?: string;
  type_name?: string;
  phase_name?: string;
  status_name?: string;
  trust_name?: string;
  trust_uid?: string;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  town?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  website?: string;
  religious_character?: string;
  religious_ethos?: string;
  denomination?: string;
}

type Step = "urn" | "confirm" | "details" | "modules" | "user" | "complete";

type SubscriptionPlan = "core" | "professional" | "enterprise";
type PaymentMethod = "card" | "direct_debit" | "invoice" | "manual";

interface SubscriptionConfig {
  plan: SubscriptionPlan;
  userLimit: number;
  startTrial: boolean;
  paymentMethod: PaymentMethod;
}

interface AdminUser {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface ModuleCategory {
  name: string;
  modules: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

// Mock school data for testing without DFE database
const MOCK_SCHOOLS: Record<string, DFESchoolData> = {
  "123456": {
    urn: 123456,
    name: "Grove House Primary School",
    la_name: "East Sussex",
    la_code: "886",
    type_name: "Academy converter",
    phase_name: "Primary",
    status_name: "Open",
    trust_name: "Aurora Academies Trust",
    trust_uid: "TR12345",
    address_line1: "123 School Lane",
    address_line2: "",
    address_line3: "",
    town: "Eastbourne",
    postcode: "BN21 1AA",
    phone: "01323 123456",
    email: "office@grovehouseprimary.co.uk",
    website: "https://www.grovehouseprimary.co.uk",
    religious_character: "Does not apply",
  },
  "789012": {
    urn: 789012,
    name: "St Mary's Church of England Secondary School",
    la_name: "West Sussex",
    la_code: "887",
    type_name: "Voluntary aided school",
    phase_name: "Secondary",
    status_name: "Open",
    trust_name: null,
    trust_uid: null,
    address_line1: "456 High Street",
    address_line2: "",
    address_line3: "",
    town: "Chichester",
    postcode: "PO19 1BB",
    phone: "01243 234567",
    email: "admin@stmarysce.co.uk",
    website: "https://www.stmarysce.co.uk",
    religious_character: "Church of England",
  },
  "345678": {
    urn: 345678,
    name: "The King's Academy",
    la_name: "Kent County Council",
    la_code: "886",
    type_name: "Academy",
    phase_name: "All-through",
    status_name: "Open",
    trust_name: "Future Academies Trust",
    trust_uid: "TR67890",
    address_line1: "Academy Way",
    address_line2: "",
    address_line3: "",
    town: "Maidstone",
    postcode: "ME15 6XX",
    phone: "01622 345678",
    email: "info@kingsacademy.org.uk",
    website: "https://www.kingsacademy.org.uk",
    religious_character: "None",
  },
};

// Plan definitions
const PLANS = {
  core: {
    name: "Core",
    description: "Essential compliance and improvement tools",
    icon: Building2,
    color: "gray",
    price: "£990",
    userLimit: 3,
  },
  professional: {
    name: "Professional",
    description: "Extended features for growing schools",
    icon: Sparkles,
    color: "blue",
    price: "£1,490",
    userLimit: 5,
  },
  enterprise: {
    name: "Enterprise",
    description: "Complete platform for MATs and large schools",
    icon: Crown,
    color: "amber",
    price: "£2,490",
    userLimit: 10,
  },
};

// Module categories
const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    name: "Leadership & Governance",
    modules: [
      { id: "ofsted-readiness", name: "Ofsted Readiness", description: "SEF support, evidence tracking" },
      { id: "governance", name: "Governance", description: "Board meetings, training tracker" },
      { id: "actions-hub", name: "Actions Hub", description: "EEF-backed improvement tasks" },
      { id: "intelligence", name: "School Intelligence", description: "DfE data analysis" },
    ],
  },
  {
    name: "Operations & Compliance",
    modules: [
      { id: "estates-compliance", name: "Estates Compliance", description: "Statutory checks, assets" },
      { id: "hr-people", name: "HR & People", description: "Staff directory, contracts" },
      { id: "safeguarding", name: "Safeguarding", description: "DSL dashboard, concern logging" },
      { id: "attendance", name: "Attendance", description: "Registers, persistent absence" },
      { id: "behaviour", name: "Behaviour", description: "Incidents, consequences" },
    ],
  },
  {
    name: "Engagement",
    modules: [
      { id: "communications", name: "Communications", description: "Comms hub, video rooms" },
      { id: "calendar", name: "Calendar", description: "Term dates, events" },
      { id: "surveys", name: "Surveys", description: "Stakeholder feedback" },
    ],
  },
  {
    name: "Data & Advanced",
    modules: [
      { id: "canvas", name: "Canvas Data", description: "Smart data ingestion" },
      { id: "admissions", name: "Admissions", description: "Applications, waiting lists" },
      { id: "school-meals", name: "School Meals", description: "FSM tracking" },
      { id: "cover", name: "Cover Management", description: "Supply teacher cover" },
    ],
  },
];

export default function CreateSchoolPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Dev mode bypass for testing without auth
  const devModeBypass = process.env.NODE_ENV === "development";

  // Initialize to true in dev mode to avoid loading state
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(devModeBypass ? true : null);
  const [currentStep, setCurrentStep] = useState<Step>("urn");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdSchool, setCreatedSchool] = useState<any>(null);

  // URN Lookup State
  const urnInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [schoolData, setSchoolData] = useState<DFESchoolData | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Mock Mode for testing without DFE database (default OFF - use real DFE data)
  const [mockMode, setMockMode] = useState(false);

  // Subscription State
  const [subscription, setSubscription] = useState<SubscriptionConfig>({
    plan: "core",
    userLimit: 3,
    startTrial: true,
    paymentMethod: "manual",
  });

  // Modules State
  const [selectedModules, setSelectedModules] = useState<string[]>([
    "ofsted-readiness",
    "estates-compliance",
    "hr-people",
    "governance",
    "actions-hub",
  ]);

  // Admin User State
  const [admin, setAdmin] = useState<AdminUser>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  // Check super admin access (bypassed in dev mode)
  useEffect(() => {
    // In dev mode, bypass auth check for testing
    if (devModeBypass) {
      setIsSuperAdmin(true);
      return;
    }

    async function checkAccess() {
      if (!user?.id) {
        setIsSuperAdmin(false);
        return;
      }

      try {
        const res = await fetch("/api/admin/subscriptions");
        setIsSuperAdmin(res.ok);
      } catch {
        setIsSuperAdmin(false);
      }
    }

    if (user) checkAccess();
  }, [user]);

  // Attach native click handler for React 19 compatibility
  useEffect(() => {
    const button = searchButtonRef.current;
    if (!button) return;

    const handleClick = (e: Event) => {
      e.preventDefault();
      console.log('Native click handler fired!');
      handleSearch();
    };

    button.addEventListener('click', handleClick);
    return () => button.removeEventListener('click', handleClick);
  }, [mockMode]); // Re-attach when mockMode changes since handleSearch depends on it

  // Update modules when plan changes
  useEffect(() => {
    const planModules = getDefaultModulesForPlan(subscription.plan);
    setSelectedModules(planModules);
    setSubscription(prev => ({ ...prev, userLimit: PLANS[subscription.plan].userLimit }));
  }, [subscription.plan]);

  const handleSearch = async () => {
    console.log('handleSearch called!');
    // Get value from uncontrolled input ref
    const urn = urnInputRef.current?.value?.trim() || "";
    console.log('URN from ref:', urn);

    if (!urn || urn.length < 5) {
      setLookupError("Please enter a valid URN (6 digits)");
      return;
    }

    console.log('Setting isSearching to true');
    setIsSearching(true);
    setLookupError(null);
    setSchoolData(null);

    // Mock mode - use predefined mock data
    if (mockMode) {
      console.log('Mock mode active, looking for URN:', urn);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

      const mockSchool = MOCK_SCHOOLS[urn];
      console.log('Mock school found:', mockSchool ? mockSchool.name : 'NOT FOUND');

      if (mockSchool) {
        setSchoolData(mockSchool);
        console.log('Setting currentStep to confirm');
        setCurrentStep("confirm");
      } else {
        setLookupError(
          `School not found in mock database. Try: 123456, 789012, or 345678`
        );
      }
      setIsSearching(false);
      return;
    }

    // Live mode - call DFE API
    try {
      const res = await fetch(`/api/school/lookup?urn=${urn}`);
      const data = await res.json();

      if (data.success && data.school) {
        setSchoolData(data.school);
        setCurrentStep("confirm");
      } else {
        setLookupError(data.error || "School not found");
      }
    } catch (err: any) {
      setLookupError(err.message || "Failed to lookup school");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    setCurrentStep("details");
  };

  const handleBack = () => {
    if (currentStep === "confirm") {
      setCurrentStep("urn");
    } else if (currentStep === "details") {
      setCurrentStep("confirm");
    } else if (currentStep === "modules") {
      setCurrentStep("details");
    } else if (currentStep === "user") {
      setCurrentStep("modules");
    } else if (currentStep === "complete") {
      router.push("/admin");
    } else {
      router.push("/admin");
    }
  };

  const handleSubmit = async () => {
    // Validate admin user
    if (!admin.email || !admin.password || !admin.firstName || !admin.lastName) {
      setSubmitError("Please fill in all admin user fields");
      setCurrentStep("user");
      return;
    }

    if (admin.password !== admin.confirmPassword) {
      setSubmitError("Passwords do not match");
      setCurrentStep("user");
      return;
    }

    if (admin.password.length < 8) {
      setSubmitError("Password must be at least 8 characters");
      setCurrentStep("user");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/admin/create-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school: schoolData,
          subscription: {
            ...subscription,
            enabledModules: selectedModules,
          },
          admin: {
            email: admin.email,
            password: admin.password,
            firstName: admin.firstName,
            lastName: admin.lastName,
            displayName: `${admin.firstName} ${admin.lastName}`,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create school");
      }

      setCreatedSchool(data.data);
      setCurrentStep("complete");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create school");
      setIsSubmitting(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getStepNumber = (step: Step): number => {
    const steps: Step[] = ["urn", "confirm", "details", "modules", "user"];
    return steps.indexOf(step) + 1;
  };

  const isStepComplete = (step: Step): boolean => {
    const currentIdx = ["urn", "confirm", "details", "modules", "user", "complete"].indexOf(currentStep);
    const stepIdx = ["urn", "confirm", "details", "modules", "user", "complete"].indexOf(step);
    return currentIdx > stepIdx;
  };

  if (isSuperAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-4">Super admin access required</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New School</h1>
              <p className="text-sm text-gray-500">
                {currentStep === "urn" && "Step 1 of 5: Look up school"}
                {currentStep === "confirm" && "Step 2 of 5: Confirm school details"}
                {currentStep === "details" && "Step 3 of 5: Configure subscription"}
                {currentStep === "modules" && "Step 4 of 5: Select modules"}
                {currentStep === "user" && "Step 5 of 5: Create admin user"}
                {currentStep === "complete" && "School created successfully"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep !== "complete" && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              {["urn", "confirm", "details", "modules", "user"].map((step, idx) => {
                const isComplete = isStepComplete(step as Step);
                const isCurrent = step === currentStep;
                const isPast = idx < ["urn", "confirm", "details", "modules", "user"].indexOf(currentStep);

                return (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded transition-colors ${
                      isComplete || isCurrent ? "bg-gray-900" : "bg-gray-200"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-6">
        {/* Step 1: URN Lookup */}
        {currentStep === "urn" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <School className="w-8 h-8 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Look Up School
              </h2>
              <p className="text-gray-500">
                Enter the school's URN to fetch details from the DfE database
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School URN
                </label>
                <div className="flex gap-3">
                  <input
                    ref={urnInputRef}
                    type="text"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.nextElementSibling?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                      }
                    }}
                    placeholder="Enter 6-digit URN (e.g., 123456)"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                    autoFocus
                    style={{ color: '#1f2937' }}
                  />
                  <button
                    ref={searchButtonRef}
                    onClick={() => {
                      const urn = urnInputRef.current?.value?.trim() || "";
                      if (!urn || urn.length < 5) {
                        setLookupError("Please enter a valid URN (6 digits)");
                        return;
                      }
                      setIsSearching(true);
                      setLookupError(null);
                      setSchoolData(null);

                      if (mockMode) {
                        setTimeout(async () => {
                          const mockSchool = MOCK_SCHOOLS[urn];
                          if (mockSchool) {
                            setSchoolData(mockSchool);
                            setCurrentStep("confirm");
                            setIsSearching(false);
                          } else {
                            setLookupError(`School not found in mock mode. Try: 123456, 789012, or 345678`);
                            setIsSearching(false);
                          }
                        }, 500);
                      } else {
                        // Live DFE lookup
                        fetch(`/api/school/lookup?urn=${urn}`)
                          .then(res => res.json())
                          .then(data => {
                            if (data.success && data.school) {
                              setSchoolData(data.school);
                              setCurrentStep("confirm");
                              setIsSearching(false);
                            } else {
                              setLookupError(data.error || "School not found in DFE database");
                              setIsSearching(false);
                            }
                          })
                          .catch(err => {
                            setLookupError("Failed to lookup school. Please try again.");
                            setIsSearching(false);
                          });
                      }
                    }}
                    disabled={isSearching}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Look Up
                      </>
                    )}
                  </button>
                </div>
                {lookupError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {lookupError}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Find URN:</strong>{" "}
                  <a
                    href="https://get-information-schools.service.gov.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-900 font-medium"
                  >
                    Get Information about Schools (GIAS)
                    <span className="ml-1">→</span>
                  </a>
                  {" "}and search for your school
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Confirm School Details */}
        {currentStep === "confirm" && schoolData && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                School Found
              </h2>
              <p className="text-gray-500">
                Please confirm this is the correct school
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {schoolData.name}
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">URN</p>
                  <p className="font-medium text-gray-900">{schoolData.urn}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phase</p>
                  <p className="font-medium text-gray-900">
                    {schoolData.phase_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium text-gray-900">
                    {schoolData.type_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Local Authority</p>
                  <p className="font-medium text-gray-900">
                    {schoolData.la_name || "N/A"}
                  </p>
                </div>
                {schoolData.trust_name && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Trust</p>
                    <p className="font-medium text-gray-900">
                      {schoolData.trust_name}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-gray-700">
                      {[schoolData.address_line1, schoolData.address_line2, schoolData.address_line3]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="text-gray-700">
                      {schoolData.town}
                      {schoolData.postcode && `, ${schoolData.postcode}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {(schoolData.phone || schoolData.email || schoolData.website) && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 gap-2 text-sm">
                  {schoolData.phone && (
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="text-gray-900">{schoolData.phone}</p>
                    </div>
                  )}
                  {schoolData.email && (
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="text-gray-900">{schoolData.email}</p>
                    </div>
                  )}
                  {schoolData.website && (
                    <div>
                      <p className="text-gray-500">Website</p>
                      <a
                        href={schoolData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {schoolData.website}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Religious Character */}
              {schoolData.religious_character && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-500 text-sm">Religious Character</p>
                  <p className="text-gray-900 font-medium">
                    {schoolData.religious_character}
                  </p>
                </div>
              )}

              {/* Status */}
              {schoolData.status_name && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    schoolData.status_name === "Open"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {schoolData.status_name}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                This is Correct - Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Subscription Configuration */}
        {currentStep === "details" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Configure Subscription
              </h2>
              <p className="text-gray-500">
                Select the plan and configure user limits
              </p>
            </div>

            {/* Plan Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Plan
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.entries(PLANS) as [SubscriptionPlan, typeof PLANS[keyof typeof PLANS]][]).map(
                  ([planId, plan]) => {
                    const Icon = plan.icon;
                    const isSelected = subscription.plan === planId;

                    return (
                      <button
                        key={planId}
                        onClick={() => setSubscription(prev => ({ ...prev, plan: planId }))}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle className="w-5 h-5 text-gray-900" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-5 h-5 ${isSelected ? "text-gray-900" : "text-gray-400"}`} />
                          <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{plan.description}</p>
                        <p className="text-lg font-bold text-gray-900">{plan.price}/year</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Default: {plan.userLimit} user seats
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* User Limit */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Limit: <span className="font-bold text-gray-900">{subscription.userLimit} users</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={subscription.userLimit}
                onChange={(e) => setSubscription(prev => ({ ...prev, userLimit: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>50</span>
              </div>
            </div>

            {/* Trial Toggle */}
            <div className="mb-8">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Start Free Trial?</h4>
                  <p className="text-sm text-gray-500">
                    7-day free trial with full access to selected modules
                  </p>
                </div>
                <button
                  onClick={() => setSubscription(prev => ({ ...prev, startTrial: !prev.startTrial }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    subscription.startTrial ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      subscription.startTrial ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={subscription.paymentMethod}
                onChange={(e) => setSubscription(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="manual">Manual (invoice later)</option>
                <option value="invoice">Invoice</option>
                <option value="card">Card (via Stripe)</option>
                <option value="direct_debit">Direct Debit (GoCardless)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep("modules")}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Continue to Modules
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Module Selection */}
        {currentStep === "modules" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Select Modules
              </h2>
              <p className="text-gray-500">
                Choose which modules this school can access ({selectedModules.length} selected)
              </p>
            </div>

            {/* Quick Select by Plan */}
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 mr-2">Quick select:</span>
              <button
                onClick={() => setSelectedModules(getDefaultModulesForPlan("core"))}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedModules.length === getDefaultModulesForPlan("core").length &&
                  JSON.stringify(selectedModules.sort()) === JSON.stringify(getDefaultModulesForPlan("core").sort())
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
              >
                Core
              </button>
              <button
                onClick={() => setSelectedModules(getDefaultModulesForPlan("professional"))}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedModules.length === getDefaultModulesForPlan("professional").length &&
                  JSON.stringify(selectedModules.sort()) === JSON.stringify(getDefaultModulesForPlan("professional").sort())
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
              >
                Professional
              </button>
              <button
                onClick={() => setSelectedModules(getDefaultModulesForPlan("enterprise"))}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedModules.length === getDefaultModulesForPlan("enterprise").length &&
                  JSON.stringify(selectedModules.sort()) === JSON.stringify(getDefaultModulesForPlan("enterprise").sort())
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
              >
                Enterprise
              </button>
              <button
                onClick={() => setSelectedModules([])}
                className="px-3 py-1 text-xs rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Clear All
              </button>
            </div>

            {/* Module Categories */}
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {MODULE_CATEGORIES.map(category => (
                <div key={category.name} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{category.name}</h4>
                  <div className="space-y-2">
                    {category.modules.map(module => {
                      const isSelected = selectedModules.includes(module.id);
                      return (
                        <label
                          key={module.id}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleModule(module.id)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className={`font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                              {module.name}
                            </span>
                            <p className="text-sm text-gray-500">{module.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep("user")}
                disabled={selectedModules.length === 0}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to User ({selectedModules.length} modules selected)
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Create Admin User */}
        {currentStep === "user" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Create Admin User
              </h2>
              <p className="text-gray-500">
                Set up the first admin account for {schoolData?.name}
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={admin.firstName}
                    onChange={(e) => setAdmin(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={admin.lastName}
                    onChange={(e) => setAdmin(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={admin.email}
                  onChange={(e) => setAdmin(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="headteacher@school.co.uk"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={admin.password}
                  onChange={(e) => setAdmin(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {admin.password && admin.password.length < 8 && (
                  <p className="mt-1 text-sm text-red-600">Password must be at least 8 characters</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={admin.confirmPassword}
                  onChange={(e) => setAdmin(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {admin.confirmPassword && admin.password !== admin.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                )}
              </div>

              {submitError && currentStep === "user" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {submitError}
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-900 mb-1">Summary</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• School: {schoolData?.name}</li>
                  <li>• Plan: {PLANS[subscription.plan].name}</li>
                  <li>• User Limit: {subscription.userLimit}</li>
                  <li>• Modules: {selectedModules.length} selected</li>
                  <li>• Trial: {subscription.startTrial ? "7 days" : "No"}</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6 max-w-md mx-auto">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !admin.email ||
                  !admin.password ||
                  !admin.firstName ||
                  !admin.lastName ||
                  admin.password.length < 8 ||
                  admin.password !== admin.confirmPassword
                }
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating School...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Create School
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Complete: Success */}
        {currentStep === "complete" && createdSchool && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              School Created Successfully!
            </h2>
            <p className="text-gray-500 mb-8">
              {createdSchool.organization?.name} has been set up and is ready to use.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 text-left max-w-md mx-auto mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Setup Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Organization</span>
                  <span className="font-medium text-gray-900">{createdSchool.organization?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">URN</span>
                  <span className="font-medium text-gray-900">{createdSchool.organization?.urn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium text-gray-900 capitalize">{createdSchool.subscription?.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium ${
                    createdSchool.subscription?.status === "trialing"
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}>
                    {createdSchool.subscription?.status === "trialing" ? "Trial (7 days)" : "Active"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Admin Email</span>
                  <span className="font-medium text-gray-900">{createdSchool.admin?.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-8">
              <p className="text-sm text-blue-800">
                <strong>Next steps:</strong> The admin user can now log in with their credentials.
                {createdSchool.subscription?.status === "trialing" && " They have 7 days of full access before payment is required."}
              </p>
            </div>

            <div className="flex gap-3 max-w-md mx-auto">
              <button
                onClick={() => router.push("/admin")}
                className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Back to Admin Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function getDefaultModulesForPlan(plan: SubscriptionPlan): string[] {
  switch (plan) {
    case "core":
      return [
        "ofsted-readiness",
        "estates-compliance",
        "hr-people",
        "governance",
        "actions-hub",
      ];
    case "professional":
      return [
        "ofsted-readiness",
        "estates-compliance",
        "hr-people",
        "governance",
        "actions-hub",
        "intelligence",
        "safeguarding",
        "attendance",
        "behaviour",
      ];
    case "enterprise":
      return [
        "ofsted-readiness",
        "estates-compliance",
        "hr-people",
        "governance",
        "actions-hub",
        "intelligence",
        "safeguarding",
        "attendance",
        "behaviour",
        "communications",
        "calendar",
        "surveys",
        "admissions",
        "school-meals",
        "cover",
        "canvas",
      ];
    default:
      return [
        "ofsted-readiness",
        "estates-compliance",
        "hr-people",
        "governance",
        "actions-hub",
      ];
  }
}
