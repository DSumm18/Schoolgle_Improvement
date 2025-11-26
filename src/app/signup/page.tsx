"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    School, Building2, Users, CheckCircle, ArrowRight, ArrowLeft,
    Mail, Lock, User, MapPin, Phone, Globe, Crown, Sparkles,
    CreditCard, Shield, Zap, BarChart3
} from 'lucide-react';

type Step = 'welcome' | 'account-type' | 'details' | 'schools' | 'plan' | 'payment' | 'team' | 'complete';
type AccountType = 'school' | 'trust' | null;

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
    
    // Form data
    const [formData, setFormData] = useState({
        // User details
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        jobTitle: '',
        phone: '',
        
        // School/Trust details
        organisationName: '',
        urn: '',
        address: '',
        localAuthority: '',
        phase: 'primary',
        isChurchSchool: false,
        diocese: '',
        
        // Trust specific
        trustName: '',
        trustWebsite: '',
        numberOfSchools: '',
        
        // Plan
        selectedPlan: 'professional',
        billingCycle: 'annual',
        
        // Schools in trust
        schools: [] as SchoolData[],
        
        // Team invites
        teamInvites: [{ email: '', role: 'slt' }]
    });

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const steps: Step[] = accountType === 'trust' 
        ? ['welcome', 'account-type', 'details', 'schools', 'plan', 'payment', 'team', 'complete']
        : ['welcome', 'account-type', 'details', 'plan', 'payment', 'team', 'complete'];

    const currentStepIndex = steps.indexOf(currentStep);
    const progress = ((currentStepIndex) / (steps.length - 1)) * 100;

    const nextStep = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex]);
        }
    };

    const prevStep = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex]);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        // TODO: Implement actual signup
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
        nextStep();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Progress Bar */}
            {currentStep !== 'welcome' && currentStep !== 'complete' && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
                    <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* Logo */}
            <div className="absolute top-6 left-6 flex items-center gap-2">
                <span className="text-3xl">🏫</span>
                <span className="text-white font-bold text-xl">Schoolgle</span>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-2xl">
                    
                    {/* Step: Welcome */}
                    {currentStep === 'welcome' && (
                        <div className="text-center space-y-8 animate-in fade-in duration-500">
                            <div className="space-y-4">
                                <h1 className="text-5xl font-bold text-white">
                                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Schoolgle</span>
                                </h1>
                                <p className="text-xl text-slate-300">
                                    AI-powered inspection readiness for UK schools
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 py-8">
                                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                                    <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                    <p className="text-white font-medium">Save 120+ hours</p>
                                    <p className="text-sm text-slate-400">on inspection prep</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                                    <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <p className="text-white font-medium">Ofsted 2025</p>
                                    <p className="text-sm text-slate-400">framework aligned</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                                    <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                    <p className="text-white font-medium">Real-time</p>
                                    <p className="text-sm text-slate-400">readiness tracking</p>
                                </div>
                            </div>

                            <button
                                onClick={nextStep}
                                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 mx-auto"
                            >
                                Get Started Free <ArrowRight className="w-5 h-5" />
                            </button>
                            <p className="text-slate-400 text-sm">14-day free trial • No credit card required</p>
                        </div>
                    )}

                    {/* Step: Account Type */}
                    {currentStep === 'account-type' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-white">How will you use Schoolgle?</h2>
                                <p className="text-slate-300">Choose the option that best describes your organisation</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Individual School */}
                                <button
                                    onClick={() => { setAccountType('school'); nextStep(); }}
                                    className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                                        accountType === 'school' 
                                            ? 'border-purple-500 bg-purple-500/10' 
                                            : 'border-white/20 bg-white/5 hover:border-white/40'
                                    }`}
                                >
                                    <School className="w-12 h-12 text-purple-400 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Individual School</h3>
                                    <p className="text-slate-300 text-sm mb-4">
                                        Perfect for standalone schools, academies, or schools not part of a trust
                                    </p>
                                    <ul className="space-y-2 text-sm text-slate-400">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Single school dashboard
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Full Ofsted & SIAMS tracking
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Invite your team
                                        </li>
                                    </ul>
                                </button>

                                {/* Trust/MAT */}
                                <button
                                    onClick={() => { setAccountType('trust'); nextStep(); }}
                                    className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                                        accountType === 'trust' 
                                            ? 'border-pink-500 bg-pink-500/10' 
                                            : 'border-white/20 bg-white/5 hover:border-white/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Building2 className="w-12 h-12 text-pink-400" />
                                        <span className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs font-medium rounded">MAT/TRUST</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Multi-Academy Trust</h3>
                                    <p className="text-slate-300 text-sm mb-4">
                                        For trusts managing multiple schools with centralised oversight
                                    </p>
                                    <ul className="space-y-2 text-sm text-slate-400">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Trust-wide dashboard
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Cross-school comparison
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Volume discounts
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            Centralised billing
                                        </li>
                                    </ul>
                                </button>
                            </div>

                            <button onClick={prevStep} className="text-slate-400 hover:text-white flex items-center gap-2 mx-auto">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        </div>
                    )}

                    {/* Step: Details (School or Trust) */}
                    {currentStep === 'details' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-white">
                                    {accountType === 'trust' ? 'Trust Details' : 'School Details'}
                                </h2>
                                <p className="text-slate-300">Tell us about your organisation</p>
                            </div>

                            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 space-y-4">
                                {/* Personal Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => updateFormData('firstName', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                placeholder="Jane"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => updateFormData('lastName', e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                            placeholder="Smith"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Work Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => updateFormData('email', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                            placeholder="jane.smith@school.ac.uk"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => updateFormData('password', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-4 mt-4">
                                    <h3 className="text-white font-medium mb-4">
                                        {accountType === 'trust' ? 'Trust Information' : 'School Information'}
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                                {accountType === 'trust' ? 'Trust Name' : 'School Name'}
                                            </label>
                                            <div className="relative">
                                                {accountType === 'trust' ? (
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                ) : (
                                                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                )}
                                                <input
                                                    type="text"
                                                    value={accountType === 'trust' ? formData.trustName : formData.organisationName}
                                                    onChange={(e) => updateFormData(accountType === 'trust' ? 'trustName' : 'organisationName', e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                    placeholder={accountType === 'trust' ? 'Inspire Academy Trust' : 'Oakwood Primary School'}
                                                />
                                            </div>
                                        </div>

                                        {accountType === 'school' && (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-300 mb-1">URN (School Number)</label>
                                                        <input
                                                            type="text"
                                                            value={formData.urn}
                                                            onChange={(e) => updateFormData('urn', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                            placeholder="123456"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-300 mb-1">School Phase</label>
                                                        <select
                                                            value={formData.phase}
                                                            onChange={(e) => updateFormData('phase', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                        >
                                                            <option value="nursery">Nursery</option>
                                                            <option value="primary">Primary</option>
                                                            <option value="secondary">Secondary</option>
                                                            <option value="all-through">All-Through</option>
                                                            <option value="special">Special</option>
                                                            <option value="pru">PRU</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                                    <input
                                                        type="checkbox"
                                                        id="churchSchool"
                                                        checked={formData.isChurchSchool}
                                                        onChange={(e) => updateFormData('isChurchSchool', e.target.checked)}
                                                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                                                    />
                                                    <label htmlFor="churchSchool" className="text-white">
                                                        This is a Church of England or Catholic school
                                                        <span className="block text-sm text-slate-400">Enables SIAMS framework tracking</span>
                                                    </label>
                                                </div>

                                                {formData.isChurchSchool && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-300 mb-1">Diocese</label>
                                                        <input
                                                            type="text"
                                                            value={formData.diocese}
                                                            onChange={(e) => updateFormData('diocese', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                            placeholder="Diocese of Manchester"
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {accountType === 'trust' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-1">Number of Schools</label>
                                                    <select
                                                        value={formData.numberOfSchools}
                                                        onChange={(e) => updateFormData('numberOfSchools', e.target.value)}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="2-5">2-5 schools</option>
                                                        <option value="6-10">6-10 schools</option>
                                                        <option value="11-20">11-20 schools</option>
                                                        <option value="21-50">21-50 schools</option>
                                                        <option value="50+">50+ schools</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-1">Trust Website</label>
                                                    <div className="relative">
                                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                        <input
                                                            type="url"
                                                            value={formData.trustWebsite}
                                                            onChange={(e) => updateFormData('trustWebsite', e.target.value)}
                                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                            placeholder="https://trust.org.uk"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button onClick={prevStep} className="text-slate-400 hover:text-white flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
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
                                <h2 className="text-3xl font-bold text-white">Add Your Schools</h2>
                                <p className="text-slate-300">Add the schools in your trust (you can add more later)</p>
                            </div>

                            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 space-y-4">
                                {formData.schools.map((school, index) => (
                                    <div key={school.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-white font-medium">{school.name}</p>
                                                <p className="text-sm text-slate-400">URN: {school.urn} • {school.phase}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newSchools = formData.schools.filter((_, i) => i !== index);
                                                    updateFormData('schools', newSchools);
                                                }}
                                                className="text-red-400 hover:text-red-300 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="border-2 border-dashed border-white/20 rounded-xl p-4">
                                    <h4 className="text-white font-medium mb-3">Add a School</h4>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <input
                                            type="text"
                                            placeholder="School name"
                                            id="newSchoolName"
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="URN"
                                            id="newSchoolUrn"
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <select
                                            id="newSchoolPhase"
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                        >
                                            <option value="primary">Primary</option>
                                            <option value="secondary">Secondary</option>
                                            <option value="special">Special</option>
                                        </select>
                                        <label className="flex items-center gap-2 text-sm text-slate-300">
                                            <input type="checkbox" id="newSchoolChurch" className="rounded" />
                                            Church School
                                        </label>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const name = (document.getElementById('newSchoolName') as HTMLInputElement).value;
                                            const urn = (document.getElementById('newSchoolUrn') as HTMLInputElement).value;
                                            const phase = (document.getElementById('newSchoolPhase') as HTMLSelectElement).value;
                                            const isChurch = (document.getElementById('newSchoolChurch') as HTMLInputElement).checked;
                                            if (name && urn) {
                                                updateFormData('schools', [...formData.schools, {
                                                    id: `school-${Date.now()}`,
                                                    name,
                                                    urn,
                                                    phase,
                                                    isChurchSchool: isChurch
                                                }]);
                                                (document.getElementById('newSchoolName') as HTMLInputElement).value = '';
                                                (document.getElementById('newSchoolUrn') as HTMLInputElement).value = '';
                                            }
                                        }}
                                        className="w-full py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium"
                                    >
                                        + Add School
                                    </button>
                                </div>

                                <p className="text-sm text-slate-400 text-center">
                                    Added {formData.schools.length} school(s) • You can add more schools after signup
                                </p>
                            </div>

                            <div className="flex justify-between">
                                <button onClick={prevStep} className="text-slate-400 hover:text-white flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
                                >
                                    Continue <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Plan Selection */}
                    {currentStep === 'plan' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-white">Choose Your Plan</h2>
                                <p className="text-slate-300">Start with a 14-day free trial, cancel anytime</p>
                            </div>

                            {/* Billing Toggle */}
                            <div className="flex items-center justify-center gap-3">
                                <span className={formData.billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}>Monthly</span>
                                <button
                                    onClick={() => updateFormData('billingCycle', formData.billingCycle === 'monthly' ? 'annual' : 'monthly')}
                                    className={`w-14 h-7 rounded-full transition-colors ${formData.billingCycle === 'annual' ? 'bg-purple-500' : 'bg-slate-600'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-1'}`} />
                                </button>
                                <span className={formData.billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}>
                                    Annual <span className="text-green-400 text-sm">(Save 20%)</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Core */}
                                <button
                                    onClick={() => updateFormData('selectedPlan', 'core')}
                                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                        formData.selectedPlan === 'core' 
                                            ? 'border-blue-500 bg-blue-500/10' 
                                            : 'border-white/20 bg-white/5 hover:border-white/40'
                                    }`}
                                >
                                    <h3 className="text-lg font-bold text-white mb-1">Core</h3>
                                    <div className="mb-3">
                                        <span className="text-3xl font-bold text-white">
                                            £{formData.billingCycle === 'annual' ? '1,499' : '149'}
                                        </span>
                                        <span className="text-slate-400">/{formData.billingCycle === 'annual' ? 'year' : 'month'}</span>
                                    </div>
                                    <ul className="space-y-2 text-sm text-slate-300">
                                        <li>✓ Full Ofsted Framework</li>
                                        <li>✓ Action Planning</li>
                                        <li>✓ Ed AI Coach</li>
                                        <li>✓ Basic Reports</li>
                                        <li>✓ 10 Users</li>
                                    </ul>
                                </button>

                                {/* Professional */}
                                <button
                                    onClick={() => updateFormData('selectedPlan', 'professional')}
                                    className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                                        formData.selectedPlan === 'professional' 
                                            ? 'border-purple-500 bg-purple-500/10' 
                                            : 'border-white/20 bg-white/5 hover:border-white/40'
                                    }`}
                                >
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-bold text-white">
                                        MOST POPULAR
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Professional</h3>
                                    <div className="mb-3">
                                        <span className="text-3xl font-bold text-white">
                                            £{formData.billingCycle === 'annual' ? '2,499' : '249'}
                                        </span>
                                        <span className="text-slate-400">/{formData.billingCycle === 'annual' ? 'year' : 'month'}</span>
                                    </div>
                                    <ul className="space-y-2 text-sm text-slate-300">
                                        <li>✓ Everything in Core</li>
                                        <li>✓ SIAMS Framework</li>
                                        <li>✓ One-Click Reports</li>
                                        <li>✓ Voice Observations</li>
                                        <li>✓ Mock Inspector AI</li>
                                        <li>✓ Unlimited Users</li>
                                    </ul>
                                </button>

                                {/* Enterprise */}
                                <button
                                    onClick={() => updateFormData('selectedPlan', 'enterprise')}
                                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                        formData.selectedPlan === 'enterprise' 
                                            ? 'border-pink-500 bg-pink-500/10' 
                                            : 'border-white/20 bg-white/5 hover:border-white/40'
                                    }`}
                                >
                                    <h3 className="text-lg font-bold text-white mb-1">Enterprise</h3>
                                    <div className="mb-3">
                                        <span className="text-3xl font-bold text-white">
                                            £{formData.billingCycle === 'annual' ? '3,999' : '399'}
                                        </span>
                                        <span className="text-slate-400">/{formData.billingCycle === 'annual' ? 'year' : 'month'}</span>
                                    </div>
                                    <ul className="space-y-2 text-sm text-slate-300">
                                        <li>✓ Everything in Pro</li>
                                        <li>✓ MAT Dashboard</li>
                                        <li>✓ Cross-school Analytics</li>
                                        <li>✓ Dedicated Support</li>
                                        <li>✓ On-site Training</li>
                                    </ul>
                                </button>
                            </div>

                            {accountType === 'trust' && formData.schools.length > 2 && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                                    <p className="text-green-300">
                                        🎉 Volume discount applied: <strong>{formData.schools.length >= 6 ? '20%' : '15%'} off</strong> for {formData.schools.length} schools
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <button onClick={prevStep} className="text-slate-400 hover:text-white flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
                                >
                                    Continue <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Payment */}
                    {currentStep === 'payment' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-white">Start Your Free Trial</h2>
                                <p className="text-slate-300">14 days free, then £{formData.selectedPlan === 'core' ? '1,499' : formData.selectedPlan === 'professional' ? '2,499' : '3,999'}/year</p>
                            </div>

                            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                    <Shield className="w-6 h-6 text-green-400" />
                                    <div>
                                        <p className="text-white font-medium">No payment required today</p>
                                        <p className="text-sm text-slate-400">You won't be charged until your trial ends</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Card Number</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="4242 4242 4242 4242"
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Expiry</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">CVC</label>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Plan</span>
                                        <span className="text-white">{formData.selectedPlan.charAt(0).toUpperCase() + formData.selectedPlan.slice(1)}</span>
                                    </div>
                                    {accountType === 'trust' && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Schools</span>
                                            <span className="text-white">{formData.schools.length || 1}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Due today</span>
                                        <span className="text-green-400 font-bold">£0.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">After trial</span>
                                        <span className="text-white font-bold">£{formData.selectedPlan === 'core' ? '1,499' : formData.selectedPlan === 'professional' ? '2,499' : '3,999'}/year</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button onClick={prevStep} className="text-slate-400 hover:text-white flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
                                >
                                    Start Free Trial <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Team Invites */}
                    {currentStep === 'team' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-white">Invite Your Team</h2>
                                <p className="text-slate-300">Get your colleagues on board (you can skip this for now)</p>
                            </div>

                            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 space-y-4">
                                {formData.teamInvites.map((invite, index) => (
                                    <div key={index} className="flex gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="email"
                                                value={invite.email}
                                                onChange={(e) => {
                                                    const newInvites = [...formData.teamInvites];
                                                    newInvites[index].email = e.target.value;
                                                    updateFormData('teamInvites', newInvites);
                                                }}
                                                placeholder="colleague@school.ac.uk"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                            />
                                        </div>
                                        <select
                                            value={invite.role}
                                            onChange={(e) => {
                                                const newInvites = [...formData.teamInvites];
                                                newInvites[index].role = e.target.value;
                                                updateFormData('teamInvites', newInvites);
                                            }}
                                            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="slt">SLT</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="governor">Governor</option>
                                        </select>
                                        {formData.teamInvites.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    const newInvites = formData.teamInvites.filter((_, i) => i !== index);
                                                    updateFormData('teamInvites', newInvites);
                                                }}
                                                className="px-3 text-red-400 hover:text-red-300"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={() => updateFormData('teamInvites', [...formData.teamInvites, { email: '', role: 'teacher' }])}
                                    className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white hover:border-white/40 transition-colors"
                                >
                                    + Add Another
                                </button>
                            </div>

                            <div className="flex justify-between">
                                <button onClick={prevStep} className="text-slate-400 hover:text-white flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSubmit}
                                        className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
                                    >
                                        Skip for now
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Creating account...' : 'Complete Setup'} 
                                        {!isLoading && <ArrowRight className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Complete */}
                    {currentStep === 'complete' && (
                        <div className="text-center space-y-8 animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            
                            <div className="space-y-2">
                                <h2 className="text-4xl font-bold text-white">You're all set! 🎉</h2>
                                <p className="text-xl text-slate-300">
                                    Welcome to Schoolgle, {formData.firstName}!
                                </p>
                            </div>

                            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 text-left max-w-md mx-auto">
                                <h3 className="text-white font-semibold mb-4">What's next?</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</span>
                                        <span className="text-slate-300">Complete your first self-assessment</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">2</span>
                                        <span className="text-slate-300">Upload some evidence documents</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">3</span>
                                        <span className="text-slate-300">Ask Ed a question about Ofsted</span>
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 mx-auto"
                            >
                                Go to Dashboard <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

