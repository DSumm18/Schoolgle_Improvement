"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    School, Building2, CheckCircle, ArrowRight, AlertCircle,
    Loader2, Mail, Phone, User, Shield, Building, Users,
    ClipboardCheck, Brain, Zap, MessageSquare, Calendar
} from "lucide-react";

// Module options for signup
const MODULE_OPTIONS = [
    { id: 'ofsted-readiness', name: 'Ofsted Readiness', icon: Shield, description: 'Track framework compliance' },
    { id: 'estates-compliance', name: 'Estates Compliance', icon: Building, description: 'Premises & maintenance' },
    { id: 'hr-people', name: 'HR & People', icon: Users, description: 'Staff performance & wellbeing' },
    { id: 'governance', name: 'Governance', icon: ClipboardCheck, description: 'Governor portal & oversight' },
    { id: 'actions-hub', name: 'Actions Hub', icon: CheckCircle, description: 'School improvement tracking' },
    { id: 'school-intelligence', name: 'School Intelligence', icon: Brain, description: 'DfE data & cohort analysis' },
    { id: 'ed-ai', name: 'Ed AI Chat', icon: Zap, description: 'AI assistant for your school' },
    { id: 'communications', name: 'Communications', icon: MessageSquare, description: 'Notices & video meetings' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, description: 'Term dates & events' },
];

interface DFESchoolData {
    urn: number;
    name: string;
    la_name?: string;
    la_code?: string;
    phase_name?: string;
    type_name?: string;
    address_line1?: string;
    address_line2?: string;
    address_line3?: string;
    town?: string;
    postcode?: string;
    phone?: string;
    email?: string;
    website?: string;
}

type Step = 'details' | 'modules' | 'contact' | 'complete';

export default function InterestPage() {
    const [currentStep, setStep] = useState<Step>('details');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // School lookup state
    const [urn, setUrn] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [schoolData, setSchoolData] = useState<DFESchoolData | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        // School (from lookup or manual)
        schoolName: '',
        laName: '',
        phase: '',
        schoolType: '',
        address: '',
        postcode: '',
        website: '',

        // Contact
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        contactRole: '',

        // Modules
        interestedModules: [] as string[],

        // Additional
        planInterest: 'not_sure',
        timeline: 'this_term',
        message: '',
    });

    // Lookup school by URN
    const lookupSchool = async (urnValue: string) => {
        if (urnValue.length !== 7) {
            setError('Please enter a valid 7-digit URN');
            return;
        }

        setIsLookingUp(true);
        setError(null);

        try {
            const response = await fetch(`/api/school/lookup?urn=${urnValue}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.error || 'School not found. Please check the URN.');
                return;
            }

            const school = data.school as DFESchoolData;
            setSchoolData(school);

            // Pre-fill form
            const address = [
                school.address_line1,
                school.address_line2,
                school.address_line3,
                school.town,
                school.postcode
            ].filter(Boolean).join(', ');

            setFormData(prev => ({
                ...prev,
                schoolName: school.name,
                laName: school.la_name || '',
                phase: school.phase_name || '',
                schoolType: school.type_name || '',
                address,
                postcode: school.postcode || '',
                website: school.website || '',
            }));

        } catch (err) {
            console.error('Lookup error:', err);
            setError('Failed to lookup school. Please try again.');
        } finally {
            setIsLookingUp(false);
        }
    };

    // Toggle module selection
    const toggleModule = (moduleId: string) => {
        setFormData(prev => ({
            ...prev,
            interestedModules: prev.interestedModules.includes(moduleId)
                ? prev.interestedModules.filter(m => m !== moduleId)
                : [...prev.interestedModules, moduleId]
        }));
    };

    // Submit form
    const submitForm = async () => {
        if (formData.interestedModules.length === 0) {
            setError('Please select at least one module you\'re interested in.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/interest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    urn: schoolData?.urn.toString() || null,
                    name: formData.schoolName,
                    la_name: formData.laName,
                    phase: formData.phase,
                    school_type: formData.schoolType,
                    address: formData.address,
                    postcode: formData.postcode,
                    website: formData.website,
                    contact_name: formData.contactName,
                    contact_email: formData.contactEmail,
                    contact_phone: formData.contactPhone,
                    contact_role: formData.contactRole,
                    interested_modules: formData.interestedModules,
                    plan_interest: formData.planInterest,
                    timeline: formData.timeline,
                    message: formData.message,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Submission failed');
            }

            setSuccess(true);

        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.message || 'Failed to submit. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Navigation
    const nextStep = () => {
        if (currentStep === 'details') {
            if (!formData.schoolName) {
                setError('Please lookup or enter your school details first.');
                return;
            }
            setStep('modules');
        } else if (currentStep === 'modules') {
            setStep('contact');
        } else if (currentStep === 'contact') {
            submitForm();
        }
    };

    const prevStep = () => {
        if (currentStep === 'modules') setStep('details');
        else if (currentStep === 'contact') setStep('modules');
    };

    return (
        <main className="min-h-screen bg-background">
            {/* Header */}
            <header className="relative z-10 px-6 py-6 flex items-center justify-between border-b border-slate-100 dark:border-white/10">
                <a href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center">
                        <span className="text-white dark:text-slate-900 font-black text-sm">S</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">Schoolgle</span>
                </a>
                <a href="/login" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    Sign in
                </a>
            </header>

            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
                <div className="w-full max-w-2xl">

                    {/* Success State */}
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-8"
                        >
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                Thanks<br /><span className="text-slate-400 dark:text-slate-600">for your interest!</span>
                            </h1>

                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                                We've received your details and will be in touch soon to discuss how Schoolgle can help {formData.schoolName}.
                            </p>

                            <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-8 border border-slate-100 dark:border-white/10 space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">What happens next?</h3>
                                <ul className="space-y-3 text-left">
                                    <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-black">1</div>
                                        We'll review your interests and prepare a tailored demo
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-black">2</div>
                                        A member of our team will reach out within 1-2 working days
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-black">3</div>
                                        We'll set up a free trial so you can explore the platform
                                    </li>
                                </ul>
                            </div>

                            <a
                                href="/"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
                            >
                                Back to Home
                            </a>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Progress indicator */}
                            <div className="flex items-center justify-center gap-2">
                                {['details', 'modules', 'contact'].map((step, i) => (
                                    <React.Fragment key={step}>
                                        <div className={`w-3 h-3 rounded-full ${currentStep === step ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-white/20'}`} />
                                        {i < 2 && <div className={`w-8 h-0.5 ${['details', 'modules', 'contact'].indexOf(currentStep) > i ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-white/20'}`} />}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Step: School Details */}
                            {currentStep === 'details' && (
                                <div className="space-y-6">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                            Your<span className="text-slate-400 dark:text-slate-600"> School</span>
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                                            Enter your URN to auto-fill your school details
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-full border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold text-center">
                                            <AlertCircle className="w-4 h-4 inline mr-2" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-8 md:p-12 border border-slate-100 dark:border-white/10 space-y-6">
                                        {/* URN Lookup */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                School URN Lookup
                                            </label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={urn}
                                                    onChange={(e) => setUrn(e.target.value.replace(/\D/g, '').slice(0, 7))}
                                                    placeholder="Enter 7-digit URN"
                                                    maxLength={7}
                                                    className="flex-1 px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                                />
                                                <button
                                                    onClick={() => lookupSchool(urn)}
                                                    disabled={isLookingUp || urn.length !== 7}
                                                    className="px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {isLookingUp ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Search className="w-5 h-5" />
                                                            Lookup
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Auto-filled school details */}
                                        {schoolData && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-emerald-200 dark:border-emerald-500/30 space-y-4"
                                            >
                                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                                                    <CheckCircle className="w-4 h-4" />
                                                    School found!
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{schoolData.name}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {schoolData.phase_name} • {schoolData.type_name}
                                                    {schoolData.la_name && ` • ${schoolData.la_name}`}
                                                </p>
                                                {schoolData.address_line1 && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        {[schoolData.address_line1, schoolData.town, schoolData.postcode]
                                                            .filter(Boolean).join(', ')}
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* Manual entry fallback */}
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Or enter details manually
                                            </p>
                                            <input
                                                type="text"
                                                value={formData.schoolName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                                                placeholder="School name"
                                                className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={nextStep}
                                        disabled={!formData.schoolName}
                                        className="w-full group px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        Continue
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            )}

                            {/* Step: Module Selection */}
                            {currentStep === 'modules' && (
                                <div className="space-y-6">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                            What are you<span className="text-slate-400 dark:text-slate-600"> interested in?</span>
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                                            Select the modules you'd like to explore
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-full border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold text-center">
                                            <AlertCircle className="w-4 h-4 inline mr-2" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {MODULE_OPTIONS.map((module) => {
                                            const Icon = module.icon;
                                            const isSelected = formData.interestedModules.includes(module.id);
                                            return (
                                                <button
                                                    key={module.id}
                                                    onClick={() => toggleModule(module.id)}
                                                    className={`p-4 rounded-3xl border-2 text-left transition-all ${
                                                        isSelected
                                                            ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-white/5'
                                                            : 'border-slate-100 dark:border-white/10 hover:border-slate-200 dark:hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-slate-900 dark:bg-white' : 'bg-slate-100 dark:bg-white/10'}`}>
                                                            <Icon className={`w-5 h-5 ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-400'}`} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{module.name}</h3>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{module.description}</p>
                                                        </div>
                                                        {isSelected && (
                                                            <CheckCircle className="w-5 h-5 text-slate-900 dark:text-white" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={prevStep} className="px-6 py-4 text-slate-700 dark:text-slate-300 font-bold rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-sm uppercase tracking-widest">
                                            Back
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            disabled={formData.interestedModules.length === 0}
                                            className="flex-1 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            Continue
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step: Contact Details */}
                            {currentStep === 'contact' && (
                                <div className="space-y-6">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                            Your<span className="text-slate-400 dark:text-slate-600"> Details</span>
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                                            How should we contact you?
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-full border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold text-center">
                                            <AlertCircle className="w-4 h-4 inline mr-2" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-8 md:p-12 border border-slate-100 dark:border-white/10 space-y-6">
                                        {/* Name */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Your Name
                                            </label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    value={formData.contactName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                                                    placeholder="First name"
                                                    className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Last name"
                                                    className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Email & Phone */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Contact Information
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="email"
                                                    value={formData.contactEmail}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                                                    placeholder="Work email"
                                                    className="w-full pl-14 pr-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="tel"
                                                    value={formData.contactPhone}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                                                    placeholder="Phone number (optional)"
                                                    className="w-full pl-14 pr-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Your Role
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <select
                                                    value={formData.contactRole}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, contactRole: e.target.value }))}
                                                    className="w-full pl-14 pr-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all appearance-none"
                                                >
                                                    <option value="">Select your role</option>
                                                    <option value="headteacher">Headteacher</option>
                                                    <option value="deputy">Deputy Headteacher</option>
                                                    <option value="business-manager">Business Manager</option>
                                                    <option value="slt">SLT Member</option>
                                                    <option value="governor">Governor</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                When are you looking to start?
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { value: 'immediate', label: 'ASAP' },
                                                    { value: 'this_term', label: 'This term' },
                                                    { value: 'next_term', label: 'Next term' },
                                                    { value: 'next_year', label: 'Next year' },
                                                ].map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, timeline: option.value }))}
                                                        className={`px-4 py-3 rounded-full text-sm font-medium transition-all ${
                                                            formData.timeline === option.value
                                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Message (optional) */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Anything else we should know? (optional)
                                            </label>
                                            <textarea
                                                value={formData.message}
                                                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                                placeholder="Tell us about your school's challenges or what you're hoping to achieve..."
                                                rows={3}
                                                className="w-full px-6 py-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 text-sm font-medium transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Summary of selected modules */}
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                            You're interested in:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.interestedModules.map((moduleId) => {
                                                const module = MODULE_OPTIONS.find(m => m.id === moduleId);
                                                return module ? (
                                                    <span key={moduleId} className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
                                                        {module.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={prevStep}
                                            disabled={isLoading}
                                            className="px-6 py-4 text-slate-700 dark:text-slate-300 font-bold rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 text-sm uppercase tracking-widest"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            disabled={isLoading || !formData.contactName || !formData.contactEmail}
                                            className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    Submit Interest
                                                    <ArrowRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </main>
    );
}

// Import Search icon
import { Search } from "lucide-react";
