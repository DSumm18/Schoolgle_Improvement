"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/SupabaseAuthContext';
import { School, MapPin, CheckCircle } from 'lucide-react';

interface SchoolData {
  urn: number;
  name: string;
  localAuthority?: string;
  type?: string;
  phase?: string;
  town?: string;
  postcode?: string;
  address?: string;
}

function ConfirmSchoolContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skip = searchParams.get('skip') === 'true';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Get selected school from sessionStorage (only on client)
    if (!skip && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('onboarding_selected_school');
      if (stored) {
        try {
          setSchool(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored school:', e);
          router.push('/onboarding/select-school');
        }
      } else {
        router.push('/onboarding/select-school');
      }
    }
  }, [user, authLoading, router, skip]);

  const handleConfirm = async () => {
    if (!user || !user.id) {
      setError('User not found. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school: skip ? null : school,
          userId: user.id,
          authId: user.id, // Using user.id as auth_id for now
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to complete onboarding');
        setLoading(false);
        return;
      }

      // Clear stored school
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('onboarding_selected_school');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/onboarding/select-school');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2 leading-tight">
              Confirm your school
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {skip 
                ? 'You can link a school later from your settings.'
                : 'Please confirm this is the correct school before continuing.'
              }
            </p>
          </div>

          {!skip && school && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-3 sm:gap-4">
                <School className="text-gray-400 mt-0.5 flex-shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 sm:mb-3 leading-tight">
                    {school.name}
                  </h2>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                    {school.town && (
                      <div className="flex items-start gap-2 flex-wrap">
                        <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="break-words">
                          {school.address && `${school.address}, `}
                          {school.town}
                          {school.postcode && `, ${school.postcode}`}
                        </span>
                      </div>
                    )}
                    <div className="break-words">
                      <span className="font-medium">URN:</span> {school.urn}
                    </div>
                    {school.phase && (
                      <div className="break-words">
                        <span className="font-medium">Phase:</span> {school.phase}
                      </div>
                    )}
                    {school.localAuthority && (
                      <div className="break-words">
                        <span className="font-medium">Local Authority:</span> {school.localAuthority}
                      </div>
                    )}
                  </div>
                </div>
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              </div>
            </div>
          )}

          {skip && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                You're exploring Schoolgle without linking a school. You can link a school later from your account settings.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {!skip && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                Back
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full sm:flex-1 px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Setting up...' : skip ? 'Continue without school' : 'Confirm and continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmSchoolPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    }>
      <ConfirmSchoolContent />
    </Suspense>
  );
}

