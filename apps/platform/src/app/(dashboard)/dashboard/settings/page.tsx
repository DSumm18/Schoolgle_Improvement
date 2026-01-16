"use client";

import { useAuth } from "@/context/SupabaseAuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { user, organization, loading: authLoading } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch user's organizations
        const { data: memberships, error } = await supabase
          .from('organization_members')
          .select('organization_id, role, organizations(id, name, organization_type)')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching memberships:', error);
        } else {
          const orgs = (memberships || []).map((m: any) => ({
            id: m.organizations.id,
            name: m.organizations.name,
            type: m.organizations.organization_type,
            role: m.role,
          }));
          setOrganizations(orgs);
        }

        // Also fetch all available organizations (for joining)
        const { data: allOrgs } = await supabase
          .from('organizations')
          .select('id, name, organization_type')
          .limit(20);

        setOrganizations((prev) => {
          const existingIds = new Set(prev.map(o => o.id));
          const newOrgs = (allOrgs || [])
            .filter(org => !existingIds.has(org.id))
            .map(org => ({ ...org, type: org.organization_type, role: null }));
          return [...prev, ...newOrgs];
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and organization access</p>
      </div>

      {/* Current User Info */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Account</h2>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Email:</span>
            <span className="ml-2 font-medium text-gray-900">{user?.email}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">User ID:</span>
            <span className="ml-2 font-mono text-xs text-gray-600">{user?.id}</span>
          </div>
        </div>
      </div>

      {/* Current Organizations */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Organizations</h2>
        {organizations.length === 0 ? (
          <p className="text-gray-500">You're not a member of any organizations yet.</p>
        ) : (
          <div className="space-y-3">
            {organizations.map((org) => (
              <div
                key={org.id}
                className={`p-4 border rounded-lg ${
                  organization?.id === org.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{org.name}</div>
                    <div className="text-sm text-gray-500 capitalize">
                      {org.type?.replace('_', ' ')} {org.role && `• ${org.role}`}
                    </div>
                  </div>
                  {organization?.id === org.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      Current
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Need to join an organization?</h3>
        <p className="text-sm text-blue-800 mb-4">
          If you need to join Aurora Primary or another organization, you can:
        </p>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
          <li>Run the SQL script <code className="bg-blue-100 px-1 rounded">ADD_USER_TO_AURORA.sql</code> in Supabase SQL Editor</li>
          <li>Or contact your administrator to add you to an organization</li>
        </ol>
      </div>
    </div>
  );
}

