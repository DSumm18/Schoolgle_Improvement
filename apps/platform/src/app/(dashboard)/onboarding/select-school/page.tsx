"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Search, School, MapPin } from 'lucide-react';

interface SchoolResult {
  urn: number;
  name: string;
  localAuthority?: string;
  type?: string;
  phase?: string;
  town?: string;
  postcode?: string;
  address?: string;
}

export default function SelectSchoolPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState<SchoolResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/school/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to search schools');
        setSchools([]);
        return;
      }

      setSchools(data.schools || []);
    } catch (err: any) {
      setError('Failed to search schools. Please try again.');
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSchool = (school: SchoolResult) => {
    // Store selected school in sessionStorage and navigate to confirm
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('onboarding_selected_school', JSON.stringify(school));
    }
    router.push('/onboarding/confirm-school');
  };

  const handleExploreWithoutSchool = () => {
    // Allow user to proceed without linking a school
    router.push('/onboarding/confirm-school?skip=true');
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
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2 leading-tight">
              Link your school
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Search for your school by name, town, or URN. This helps us set up your account correctly.
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="Search by school name, town, or URN..."
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Results */}
          {schools.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm sm:text-base font-medium text-gray-700 mb-3">
                {schools.length} school{schools.length !== 1 ? 's' : ''} found
              </h2>
              <div className="space-y-2 max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto">
                {schools.map((school) => (
                  <button
                    key={school.urn}
                    onClick={() => handleSelectSchool(school)}
                    className="w-full text-left p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-900 transition-colors"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <School className="text-gray-400 mt-0.5 flex-shrink-0" size={18} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base leading-snug">
                          {school.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 space-y-0.5">
                          {school.town && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="break-words">{school.town}{school.postcode && `, ${school.postcode}`}</span>
                            </div>
                          )}
                          <div className="break-words">URN: {school.urn}</div>
                          {school.phase && (
                            <div className="break-words">{school.phase} • {school.localAuthority || 'Unknown LA'}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Skip option */}
          <div className="pt-4 sm:pt-6 border-t border-gray-200">
            <button
              onClick={handleExploreWithoutSchool}
              className="text-sm sm:text-base text-gray-600 hover:text-gray-900 underline text-center sm:text-left w-full sm:w-auto"
            >
              Explore without linking a school
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

