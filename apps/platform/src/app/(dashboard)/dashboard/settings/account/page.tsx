"use client";

import { useAuth } from "@/context/SupabaseAuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AccountSettingsPage() {
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
        const { data: memberships } = await supabase
          .from("organization_members")
          .select(
            "organization_id, role, organizations(id, name, organization_type)",
          )
          .eq("user_id", user.id);

        const orgs = (memberships || []).map((m: any) => ({
          id: m.organizations.id,
          name: m.organizations.name,
          type: m.organizations.organization_type,
          role: m.role,
        }));
        setOrganizations(orgs);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/settings")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Settings
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6" />
          My Account
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your profile and organization access
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-muted-foreground">
                Role at {organization?.name}
              </p>
              <Badge variant="outline" className="capitalize">
                {organization?.role || "none"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not a member of any organizations yet.
            </p>
          ) : (
            <div className="space-y-2">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    organization?.id === org.id
                      ? "border-blue-300 bg-blue-50 dark:bg-blue-950/20"
                      : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {org.type?.replace("_", " ")}
                      {org.role && ` · ${org.role}`}
                    </p>
                  </div>
                  {organization?.id === org.id && (
                    <Badge className="text-[10px] bg-blue-100 text-blue-700">
                      Current
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
