"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    School, Building2, CheckCircle, ArrowRight, ArrowLeft,
    Mail, Lock, User, FileText, CreditCard, Check, AlertCircle, Loader2, PenTool
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Step = 'welcome' | 'account-type' | 'details' | 'complete';
type AccountType = 'school' | 'trust' | null;

interface OrganizationData {
    id: string;
    name: string;
}

export default function SignupPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('welcome');
    const [accountType, setAccountType] = useState<AccountType>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdOrganization, setCreatedOrganization] = useState<OrganizationData | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [signatureName, setSignatureName] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        jobTitle: '',
        organisationName: '',
        urn: '',
        phase: 'primary',
        isChurchSchool: false,
        trustName: '',
        numberOfSchools: '',
    });

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        const steps: Step[] = ['welcome', 'account-type', 'details', 'complete'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1]);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        const steps: Step[] = ['welcome', 'account-type', 'details', 'complete'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1]);
        }
    };

    const handleSubmit = async () => {
        if (!agreedToTerms || !signatureName.trim()) {
            setError("Please sign the agreement to continue.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const orgName = accountType === 'trust' ? formData.trustName : formData.organisationName;

            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    organisationName: orgName,
                    urn: accountType === 'school' ? formData.urn : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Signup failed');
            }

            setCreatedOrganization(data.organization);

            // Sign in the user after account creation
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (signInError) {
                console.warn('[Signup] Auto sign-in failed:', signInError.message);
            }

            setIsLoading(false);
            nextStep();

        } catch (err: any) {
            console.error('[Signup] Error:', err);
            setError(err.message || 'Signup failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background transition-colors duration-700">
            {/* Progress Bar */}
            {currentStep !== 'welcome' && currentStep !== 'complete' && (
                <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-100 dark:bg-white/5">
                    <motion.div
                        className="h-full bg-slate-900 dark:bg-white"
                        initial={{ width: 0 }}
                        animate={{
                            width: currentStep === 'account-type' ? '33%' : currentStep === 'details' ? '66%' : '100%'
                        }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            )}

            {/* Header */}
            <header className="relative z-10 px-6 py-6 flex items-center justify-between">
                <a href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center">
                        <span className="text-white dark:text-slate-900 font-black text-sm">S</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">Schoolgle</span>
                </a>
                {currentStep !== 'welcome' && currentStep !== 'complete' && (
                    <button onClick={() => router.push('/login')} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        Sign in instead
                    </button>
                )}
            </header>

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
                <div className="w-full max-w-xl">

                    {/* Step: Welcome */}
                    {currentStep === 'welcome' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-8"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Get Started</span>
                            </motion.div>

                            <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9]">
                                Ready to<br />
                                <span className="text-slate-400 dark:text-slate-600">begin?</span>
                            </h1>

                            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
                                Join UK schools automating inspection readiness with AI-driven evidence mapping and intelligent SEF generation.
                            </p>

                            <button
                                onClick={nextStep}
                                className="group px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
                            >
                                Start Setup
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Already have an account? <a href="/login" className="text-slate-900 dark:text-white font-bold underline underline-offset-4">Sign in</a>
                            </p>
                        </motion.div>
                    )}

                    {/* Step: Account Type */}
                    {currentStep === 'account-type' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-4">
                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                    What type of<br /><span className="text-slate-400 dark:text-slate-600">organisation?</span>
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    Choose the option that best describes you
                                </p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => { setAccountType('school'); nextStep(); }}
                                    className="w-full p-6 bg-slate-50 dark:bg-white/5 rounded-[3rem] border-2 border-slate-100 dark:border-white/10 hover:border-slate-900 dark:hover:border-white hover:scale-[1.02] transition-all text-left group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <School className="w-8 h-8 text-slate-900 dark:text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Individual School</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Academy, maintained, or independent school
                                            </p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                                    </div>
                                </button>

                                <button
                                    onClick={() => { setAccountType('trust'); nextStep(); }}
                                    className="w-full p-6 bg-slate-50 dark:bg-white/5 rounded-[3rem] border-2 border-slate-100 dark:border-white/10 hover:border-slate-900 dark:hover:border-white hover:scale-[1.02] transition-all text-left group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <Building2 className="w-8 h-8 text-slate-900 dark:text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Multi-Academy Trust</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Managing multiple schools
                                            </p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                                    </div>
                                </button>
                            </div>

                            <button onClick={prevStep} className="w-full text-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold uppercase tracking-widest">
                                ← Back
                            </button>
                        </motion.div>
                    )}

                    {/* Step: Details */}
                    {currentStep === 'details' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-4 mb-8">
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                    Your details
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    Tell us about yourself and your {accountType === 'trust' ? 'trust' : 'school'}
                                </p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-full border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold text-center">
                                    <AlertCircle className="w-4 h-4 inline mr-2" />
                                    {error}
                                </div>
                            )}

                            <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-8 md:p-12 border border-slate-100 dark:border-white/10 space-y-6">
                                {/* Your Details */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Details</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => updateFormData('firstName', e.target.value)}
                                            placeholder="First name"
                                            className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                        />
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => updateFormData('lastName', e.target.value)}
                                            placeholder="Last name"
                                            className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                        />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateFormData('email', e.target.value)}
                                        placeholder="Work email"
                                        className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                    />
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => updateFormData('password', e.target.value)}
                                        placeholder="Create password (min 8 characters)"
                                        className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                    />
                                </div>

                                {/* Organisation Details */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {accountType === 'trust' ? 'Trust Details' : 'School Details'}
                                    </p>
                                    <input
                                        type="text"
                                        value={accountType === 'trust' ? formData.trustName : formData.organisationName}
                                        onChange={(e) => updateFormData(accountType === 'trust' ? 'trustName' : 'organisationName', e.target.value)}
                                        placeholder={accountType === 'trust' ? 'Trust name' : 'School name'}
                                        className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                    />
                                    {accountType === 'school' && (
                                        <>
                                            <input
                                                type="text"
                                                value={formData.urn}
                                                onChange={(e) => updateFormData('urn', e.target.value)}
                                                placeholder="URN (7 digits)"
                                                maxLength={7}
                                                className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Agreement */}
                                <div className="space-y-4 pt-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agreement</p>

                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/10">
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="mt-1 w-5 h-5 rounded-full border-slate-300 text-slate-900 focus:ring-slate-900"
                                            />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                I agree to the <a href="/terms" className="text-slate-900 dark:text-white underline">Terms of Service</a> and <a href="/privacy" className="text-slate-900 dark:text-white underline">Privacy Policy</a>
                                            </span>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Electronic Signature (type your full name)
                                            </label>
                                            <div className="relative">
                                                <PenTool className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={signatureName}
                                                    onChange={(e) => setSignatureName(e.target.value)}
                                                    className="w-full pl-14 pr-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 font-serif italic"
                                                    placeholder="Jane Smith"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2">
                                                By typing your name, you're signing this agreement electronically
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={prevStep} disabled={isLoading} className="px-6 py-4 text-slate-700 dark:text-slate-300 font-bold rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 text-sm uppercase tracking-widest">
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading || !agreedToTerms || !signatureName.trim()}
                                    className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            Create Account
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step: Complete */}
                    {currentStep === 'complete' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-8"
                        >
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                Welcome<br /><span className="text-slate-400 dark:text-slate-600">aboard!</span>
                            </h2>

                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                                Your organization <span className="text-slate-900 dark:text-white font-bold">{createdOrganization?.name || accountType === 'trust' ? formData.trustName : formData.organisationName}</span> is ready.
                            </p>

                            <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-8 border border-slate-100 dark:border-white/10 space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">What's next?</h3>
                                <ul className="space-y-3 text-left">
                                    {[
                                        "Connect your Google Drive for data import",
                                        "Set up your classes and rooms",
                                        "Invite your team members"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-black">{i + 1}</div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => router.push('/dashboard')}
                                className="group px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
                            >
                                Go to Dashboard
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    )}

                </div>
            </div>
        </main>
    );
}
