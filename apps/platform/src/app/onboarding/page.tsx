"use client";

import { useAuth } from "@/context/SupabaseAuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchOrganizations() {
      if (!user) return;

      try {
        // Fetch all organizations (for now - in production, you'd want to filter)
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, organization_type')
          .limit(20);

        if (error) {
          console.error('Error fetching organizations:', error);
        } else {
          setOrganizations(data || []);
        }
      } catch (error) {
        console.error('Error in fetchOrganizations:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const handleJoinOrganization = async (orgId: string) => {
    if (!user) return;

    setJoining(true);
    try {
      // Add user to organization as 'viewer' (default role)
      const { error } = await supabase
        .from('organization_members')
        .insert({
          user_id: user.id,
          organization_id: orgId,
          role: 'viewer',
        });

      if (error) {
        console.error('Error joining organization:', error);
        alert('Failed to join organization. Please try again.');
        setJoining(false);
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error in handleJoinOrganization:', error);
      alert('An error occurred. Please try again.');
      setJoining(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Schoolgle!</h1>
            <p className="text-gray-600 mt-2">
              You need to join an organization to get started.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select an organization to join:
            </h2>

            {organizations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No organizations found.</p>
                <p className="text-sm text-gray-400">
                  Contact your administrator to be added to an organization.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleJoinOrganization(org.id)}
                    disabled={joining}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {org.organization_type?.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="text-blue-600">
                        {joining ? 'Joining...' : 'Join →'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Don't see your organization? Contact your administrator or create a new one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
