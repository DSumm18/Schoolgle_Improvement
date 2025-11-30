"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Building, Users, ArrowRight, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
    const { user, organization, refreshProfile } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState<'choice' | 'create' | 'join'>('choice');
    const [schoolName, setSchoolName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (organization) {
            router.push('/dashboard');
        }
    }, [organization, router]);

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolName.trim() || !user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/organization/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: schoolName,
                    userId: user.uid
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create organization');
            }

            // Refresh profile to get the new org in context
            await refreshProfile();
            // Redirect will happen via useEffect
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome to Schoolgle</h1>
                    <p className="text-gray-600 mt-2">Let's get your school set up.</p>
                </div>

                {step === 'choice' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setStep('create')}
                            className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 group text-left"
                        >
                            <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-200">
                                <Building size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Create New School</h3>
                                <p className="text-sm text-gray-500">Set up a new workspace for your school</p>
                            </div>
                            <ArrowRight className="ml-auto text-gray-400 group-hover:text-blue-500" size={20} />
                        </button>

                        <button
                            onClick={() => setStep('join')}
                            className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center gap-4 group text-left"
                        >
                            <div className="bg-purple-100 p-3 rounded-lg text-purple-600 group-hover:bg-purple-200">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Join Existing School</h3>
                                <p className="text-sm text-gray-500">Use an invite code or link</p>
                            </div>
                            <ArrowRight className="ml-auto text-gray-400 group-hover:text-purple-500" size={20} />
                        </button>
                    </div>
                )}

                {step === 'create' && (
                    <form onSubmit={handleCreateOrg} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                School Name
                            </label>
                            <input
                                type="text"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                placeholder="e.g. St. Mary's Primary School"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep('choice')}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Creating...
                                    </>
                                ) : (
                                    'Create School'
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'join' && (
                    <div className="text-center space-y-6">
                        <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 text-sm">
                            To join an existing school, please ask your administrator to send you an invite email.
                        </div>
                        <button
                            onClick={() => setStep('choice')}
                            className="text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Back to options
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
