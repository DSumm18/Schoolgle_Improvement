"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    School, Building2, Users, CheckCircle, ArrowRight, ArrowLeft,
    Mail, Lock, User, Globe, FileText, CreditCard, Receipt,
    Shield, Zap, BarChart3, PenTool, Check, AlertCircle
} from 'lucide-react';
import OrigamiParticles from '@/components/OrigamiParticles';
import SchoolgleAnimatedLogo from '@/components/SchoolgleAnimatedLogo';

type Step = 'welcome' | 'account-type' | 'details' | 'schools' | 'plan' | 'contract' | 'payment' | 'complete';
type AccountType = 'school' | 'trust' | null;
type PaymentMethod = 'card' | 'invoice';

interface SchoolData {
    id: string;
    name: string;
    urn: string;
    phase: string;
    isChurchSchool: boolean;
}

export default function SignupPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('welcome');
    const [accountType, setAccountType] = useState<AccountType>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [contractSigned, setContractSigned] = useState(false);
    const [signatureName, setSignatureName] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
    
    // Form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        jobTitle: '',
        phone: '',
        organisationName: '',
        urn: '',
        address: '',
        postcode: '',
        localAuthority: '',
        phase: 'primary',
        isChurchSchool: false,
        diocese: '',
        trustName: '',
        trustWebsite: '',
        numberOfSchools: '',
        selectedPlan: 'professional',
        schools: [] as SchoolData[],
        // Invoice details
        invoiceEmail: '',
        purchaseOrderNumber: '',
        invoiceAddress: ''
    });

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const steps: Step[] = accountType === 'trust' 
        ? ['welcome', 'account-type', 'details', 'schools', 'plan', 'contract', 'payment', 'complete']
        : ['welcome', 'account-type', 'details', 'plan', 'contract', 'payment', 'complete'];

    const currentStepIndex = steps.indexOf(currentStep);
    const progress = ((currentStepIndex) / (steps.length - 1)) * 100;

    const nextStep = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex]);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex]);
        }
    };

    const getPlanPrice = () => {
        const prices = {
            core: { monthly: 149, annual: 1499 },
            professional: { monthly: 249, annual: 2499 },
            enterprise: { monthly: 399, annual: 3999 }
        };
        return prices[formData.selectedPlan as keyof typeof prices].annual;
    };

    const getTotalPrice = () => {
        const basePrice = getPlanPrice();
        if (accountType === 'trust' && formData.schools.length > 1) {
            const discount = formData.schools.length >= 6 ? 0.20 : formData.schools.length >= 3 ? 0.15 : 0;
            return Math.round(basePrice * formData.schools.length * (1 - discount));
        }
        return basePrice;
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
        nextStep();
    };

    return (
        <div className="min-h-screen bg-gray-50 relative overflow-hidden">
            {/* Origami Particle Background */}
            <OrigamiParticles text="Welcome" opacity={0.25} shape="hexagon" />

            {/* Progress Bar */}
            {currentStep !== 'welcome' && currentStep !== 'complete' && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
                    <div 
                        className="h-full bg-gray-900 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* Header */}
            <header className="relative z-10 px-6 py-4 flex items-center justify-between bg-white/95 backdrop-blur-sm overflow-visible">
                <div className="flex items-center relative" style={{ minHeight: '96px' }}>
                    {/* Container for logo text - center point for orbits */}
                    <a href="/" className="relative z-10 flex items-center justify-center" style={{ width: '140px', position: 'relative' }}>
                        <span className="text-xl font-semibold text-gray-900 whitespace-nowrap">
                            Schoolgle
                        </span>
                        {/* Animated planets orbiting around the center of "Schoolgle" text */}
                        <div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible pointer-events-none" 
                            style={{ 
                                width: 200, 
                                height: 200
                            }}
                        >
                            <SchoolgleAnimatedLogo size={200} showText={false} />
                        </div>
                    </a>
                </div>
                {currentStep !== 'welcome' && currentStep !== 'complete' && (
                    <div className="text-sm text-gray-500">
                        Step {currentStepIndex} of {steps.length - 2}
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <div className="w-full max-w-xl">
                    
                    {/* Step: Welcome */}
                    {currentStep === 'welcome' && (
                        <div className="text-center space-y-8 animate-in fade-in duration-500">
                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold text-gray-900">
                                    Inspection readiness,<br />simplified.
                                </h1>
                                <p className="text-lg text-gray-600">
                                    Join hundreds of UK schools preparing smarter for Ofsted.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 py-6">
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                    <Zap className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-900">Save 120+ hours</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                    <Shield className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-900">Ofsted 2025</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                    <BarChart3 className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-900">Real-time tracking</p>
                                </div>
                            </div>

                            <button
                                onClick={nextStep}
                                className="w-full py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                Get Started <ArrowRight className="w-5 h-5" />
                            </button>
                            
                            <p className="text-sm text-gray-500">
                                Already have an account? <a href="/login" className="text-gray-900 font-medium hover:underline">Sign in</a>
                            </p>
                        </div>
                    )}

                    {/* Step: Account Type */}
                    {currentStep === 'account-type' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">How will you use Schoolgle?</h2>
                                <p className="text-gray-600">Select your organisation type</p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => { setAccountType('school'); nextStep(); }}
                                    className="w-full p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-900 transition-colors text-left group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-900 transition-colors">
                                            <School className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">Individual School</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Standalone school, academy, or maintained school
                                            </p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                                    </div>
                                </button>

                                <button
                                    onClick={() => { setAccountType('trust'); nextStep(); }}
                                    className="w-full p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-900 transition-colors text-left group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-900 transition-colors">
                                            <Building2 className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">Multi-Academy Trust</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Trust managing multiple schools with central oversight
                                            </p>
                                            <span className="inline-block mt-2 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                Volume discounts available
                                            </span>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                                    </div>
                                </button>
                            </div>

                            <button onClick={prevStep} className="w-full text-center text-gray-500 hover:text-gray-900 text-sm">
                                ← Back
                            </button>
                        </div>
                    )}

                    {/* Step: Details */}
                    {currentStep === 'details' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Your details</h2>
                                <p className="text-gray-600">We'll use this to set up your account</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => updateFormData('firstName', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                            placeholder="Jane"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => updateFormData('lastName', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                            placeholder="Smith"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateFormData('email', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                        placeholder="jane.smith@school.ac.uk"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => updateFormData('password', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                        placeholder="Min 8 characters"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
                                    <input
                                        type="text"
                                        value={formData.jobTitle}
                                        onChange={(e) => updateFormData('jobTitle', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                        placeholder="Headteacher"
                                    />
                                </div>

                                <hr className="my-4" />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {accountType === 'trust' ? 'Trust name' : 'School name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={accountType === 'trust' ? formData.trustName : formData.organisationName}
                                        onChange={(e) => updateFormData(accountType === 'trust' ? 'trustName' : 'organisationName', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                        placeholder={accountType === 'trust' ? 'Inspire Academy Trust' : 'Oakwood Primary School'}
                                    />
                                </div>

                                {accountType === 'school' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">URN</label>
                                                <input
                                                    type="text"
                                                    value={formData.urn}
                                                    onChange={(e) => updateFormData('urn', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                                    placeholder="123456"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                                                <select
                                                    value={formData.phase}
                                                    onChange={(e) => updateFormData('phase', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                                >
                                                    <option value="primary">Primary</option>
                                                    <option value="secondary">Secondary</option>
                                                    <option value="special">Special</option>
                                                    <option value="all-through">All-through</option>
                                                </select>
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.isChurchSchool}
                                                onChange={(e) => updateFormData('isChurchSchool', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-900">Church school</span>
                                                <span className="block text-sm text-gray-500">Enables SIAMS framework</span>
                                            </div>
                                        </label>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={prevStep} className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors">
                                    Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    Continue <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Add Schools (Trust only) */}
                    {currentStep === 'schools' && accountType === 'trust' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Add your schools</h2>
                                <p className="text-gray-600">You can add more schools later</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
                                {formData.schools.map((school, index) => (
                                    <div key={school.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{school.name}</p>
                                            <p className="text-sm text-gray-500">URN: {school.urn}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                updateFormData('schools', formData.schools.filter((_, i) => i !== index));
                                            }}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 space-y-3">
                                    <input id="schoolName" type="text" placeholder="School name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input id="schoolUrn" type="text" placeholder="URN" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                                        <select id="schoolPhase" className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                                            <option value="primary">Primary</option>
                                            <option value="secondary">Secondary</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const name = (document.getElementById('schoolName') as HTMLInputElement).value;
                                            const urn = (document.getElementById('schoolUrn') as HTMLInputElement).value;
                                            const phase = (document.getElementById('schoolPhase') as HTMLSelectElement).value;
                                            if (name && urn) {
                                                updateFormData('schools', [...formData.schools, { id: `s-${Date.now()}`, name, urn, phase, isChurchSchool: false }]);
                                                (document.getElementById('schoolName') as HTMLInputElement).value = '';
                                                (document.getElementById('schoolUrn') as HTMLInputElement).value = '';
                                            }
                                        }}
                                        className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                        + Add school
                                    </button>
                                </div>

                                {formData.schools.length >= 3 && (
                                    <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                                        ✓ {formData.schools.length >= 6 ? '20%' : '15%'} volume discount will be applied
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={prevStep} className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors">
                                    Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Plan Selection */}
                    {currentStep === 'plan' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Choose your plan</h2>
                                <p className="text-gray-600">12-month subscription, auto-renews annually</p>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { id: 'core', name: 'Core', price: 1499, features: ['Full Ofsted Framework', 'Action Planning', 'Ed AI Coach', 'Basic Reports', '10 Users'] },
                                    { id: 'professional', name: 'Professional', price: 2499, popular: true, features: ['Everything in Core', 'SIAMS Framework', 'One-Click Reports', 'Voice Observations', 'Mock Inspector AI', 'Unlimited Users'] },
                                    { id: 'enterprise', name: 'Enterprise', price: 3999, features: ['Everything in Professional', 'Trust Dashboard', 'Cross-school Analytics', 'Dedicated Support', 'On-site Training'] }
                                ].map(plan => (
                                    <button
                                        key={plan.id}
                                        onClick={() => updateFormData('selectedPlan', plan.id)}
                                        className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                                            formData.selectedPlan === plan.id 
                                                ? 'border-gray-900 bg-gray-50' 
                                                : 'border-gray-200 bg-white hover:border-gray-400'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                                                    {plan.popular && (
                                                        <span className="text-xs font-medium bg-gray-900 text-white px-2 py-0.5 rounded">
                                                            Most popular
                                                        </span>
                                                    )}
                                                </div>
                                                <ul className="mt-2 space-y-1">
                                                    {plan.features.slice(0, 3).map((f, i) => (
                                                        <li key={i} className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900">£{plan.price.toLocaleString()}</p>
                                                <p className="text-sm text-gray-500">/year</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {accountType === 'trust' && formData.schools.length > 1 && (
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{formData.schools.length} schools × £{getPlanPrice().toLocaleString()}</span>
                                        <span className="text-gray-900">£{(getPlanPrice() * formData.schools.length).toLocaleString()}</span>
                                    </div>
                                    {formData.schools.length >= 3 && (
                                        <div className="flex justify-between text-sm text-green-600 mt-1">
                                            <span>Volume discount ({formData.schools.length >= 6 ? '20%' : '15%'})</span>
                                            <span>-£{((getPlanPrice() * formData.schools.length) - getTotalPrice()).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <hr className="my-2" />
                                    <div className="flex justify-between font-semibold">
                                        <span>Annual total</span>
                                        <span>£{getTotalPrice().toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={prevStep} className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors">
                                    Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Contract */}
                    {currentStep === 'contract' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Service Agreement</h2>
                                <p className="text-gray-600">Please review and sign to continue</p>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-700" />
                                    <span className="font-medium text-gray-900">Schoolgle Service Agreement</span>
                                </div>
                                
                                <div className="p-4 h-64 overflow-y-auto text-sm text-gray-600 space-y-4">
                                    <p><strong>SCHOOLGLE SERVICE AGREEMENT</strong></p>
                                    <p>This Agreement is entered into between Schoolgle Ltd ("Provider") and the subscribing organisation ("Customer").</p>
                                    
                                    <p><strong>1. SUBSCRIPTION TERM</strong></p>
                                    <p>1.1 The initial subscription term is 12 months from the date of activation.</p>
                                    <p>1.2 The subscription will automatically renew for successive 12-month periods unless cancelled in writing at least 30 days before the renewal date.</p>
                                    
                                    <p><strong>2. FEES AND PAYMENT</strong></p>
                                    <p>2.1 Annual subscription fee: £{getTotalPrice().toLocaleString()}</p>
                                    <p>2.2 Payment is due within 30 days of invoice date.</p>
                                    <p>2.3 Fees are non-refundable except as required by law.</p>
                                    <p>2.4 Price may increase by up to 5% upon renewal with 60 days notice.</p>
                                    
                                    <p><strong>3. AUTO-RENEWAL</strong></p>
                                    <p>3.1 This agreement will automatically renew at the end of each subscription period.</p>
                                    <p>3.2 An invoice will be issued 30 days before renewal date.</p>
                                    <p>3.3 To cancel, written notice must be received 30 days before renewal.</p>
                                    
                                    <p><strong>4. DATA PROTECTION</strong></p>
                                    <p>4.1 The Provider will process personal data in accordance with UK GDPR.</p>
                                    <p>4.2 A Data Processing Agreement is incorporated by reference.</p>
                                    
                                    <p><strong>5. SERVICE LEVEL</strong></p>
                                    <p>5.1 The Provider aims for 99.5% uptime availability.</p>
                                    <p>5.2 Support is provided via email during UK business hours.</p>
                                    
                                    <p><strong>6. LIMITATION OF LIABILITY</strong></p>
                                    <p>6.1 The Provider's total liability shall not exceed the fees paid in the preceding 12 months.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="text-sm text-gray-600">
                                        I have read and agree to the Service Agreement, <a href="/privacy" className="underline">Privacy Policy</a>, and <a href="/terms" className="underline">Terms of Service</a>
                                    </span>
                                </label>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Electronic Signature (type your full name)
                                    </label>
                                    <div className="relative">
                                        <PenTool className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={signatureName}
                                            onChange={(e) => setSignatureName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent font-serif italic"
                                            placeholder="Jane Smith"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        By typing your name, you are signing this agreement electronically
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={prevStep} className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors">
                                    Back
                                </button>
                                <button
                                    onClick={() => { setContractSigned(true); nextStep(); }}
                                    disabled={!agreedToTerms || !signatureName.trim()}
                                    className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Sign & Continue <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Payment */}
                    {currentStep === 'payment' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
                                <p className="text-gray-600">Choose how you'd like to pay</p>
                            </div>

                            {/* Payment Method Toggle */}
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                        paymentMethod === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                                    }`}
                                >
                                    <CreditCard className="w-5 h-5" /> Pay by Card
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('invoice')}
                                    className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                        paymentMethod === 'invoice' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                                    }`}
                                >
                                    <Receipt className="w-5 h-5" /> Pay by Invoice
                                </button>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
                                {paymentMethod === 'card' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Card number</label>
                                            <input
                                                type="text"
                                                placeholder="1234 5678 9012 3456"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                                                <input
                                                    type="text"
                                                    placeholder="123"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                                            <p className="font-medium">Invoice Payment</p>
                                            <p>An invoice will be sent to your finance team. Payment is due within 30 days.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice email</label>
                                            <input
                                                type="email"
                                                value={formData.invoiceEmail || formData.email}
                                                onChange={(e) => updateFormData('invoiceEmail', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                                placeholder="finance@school.ac.uk"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order Number (optional)</label>
                                            <input
                                                type="text"
                                                value={formData.purchaseOrderNumber}
                                                onChange={(e) => updateFormData('purchaseOrderNumber', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                                placeholder="PO-12345"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice address</label>
                                            <textarea
                                                value={formData.invoiceAddress}
                                                onChange={(e) => updateFormData('invoiceAddress', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                                rows={3}
                                                placeholder="School address for invoice"
                                            />
                                        </div>
                                    </>
                                )}

                                <hr />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{formData.selectedPlan.charAt(0).toUpperCase() + formData.selectedPlan.slice(1)} Plan</span>
                                        <span className="text-gray-900">£{getPlanPrice().toLocaleString()}</span>
                                    </div>
                                    {accountType === 'trust' && formData.schools.length > 1 && (
                                        <>
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>× {formData.schools.length} schools</span>
                                            </div>
                                            {formData.schools.length >= 3 && (
                                                <div className="flex justify-between text-sm text-green-600">
                                                    <span>Volume discount</span>
                                                    <span>-{formData.schools.length >= 6 ? '20%' : '15%'}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <hr />
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Total (annual)</span>
                                        <span>£{getTotalPrice().toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={prevStep} className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors">
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Processing...' : paymentMethod === 'card' ? 'Pay & Subscribe' : 'Request Invoice'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Complete */}
                    {currentStep === 'complete' && (
                        <div className="text-center space-y-6 animate-in fade-in duration-500">
                            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-gray-900">Welcome to Schoolgle!</h2>
                                <p className="text-gray-600">
                                    {paymentMethod === 'invoice' 
                                        ? 'Your invoice has been sent. Your account is active.'
                                        : 'Your subscription is active.'}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-5 border border-gray-200 text-left space-y-3">
                                <h3 className="font-medium text-gray-900">Next steps:</h3>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                                        Complete your first self-assessment
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                                        Upload evidence documents
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                                        Invite your team
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                Go to Dashboard <ArrowRight className="w-5 h-5" />
                            </button>

                            {paymentMethod === 'invoice' && (
                                <p className="text-sm text-gray-500">
                                    Invoice sent to {formData.invoiceEmail || formData.email}
                                </p>
                            )}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
