'use client';

import { useState } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface DfESchoolData {
  urn: string;
  name: string;
  dfe_number: string;
  la_code: string;
  establishment_number: string;
  address: string;
  town: string;
  postcode: string;
  phase: string;
  type: string;
  pupil_count?: number;
  is_academy?: boolean;
}

export default function SetupSchoolPage() {
  const { session } = useAuth();
  const [urn, setUrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm' | 'done'>('input');
  const [schoolData, setSchoolData] = useState<DfESchoolData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSchoolData = async () => {
    if (!urn || urn.length < 6) {
      setError('Please enter a valid URN (6+ digits)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = session?.access_token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/admin/setup-school/fetch-dfe?urn=${urn.trim()}`, {
        headers,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('Fetch error response:', data);
        throw new Error(data.error || `Failed to fetch school data (${response.status})`);
      }

      const data = await response.json();
      setSchoolData(data.school);
      setStep('confirm');
    } catch (err) {
      console.error('Fetch school data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch school data');
    } finally {
      setLoading(false);
    }
  };

  const confirmAndCreate = async () => {
    if (!schoolData) return;

    setLoading(true);
    setError(null);

    try {
      const token = session?.access_token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/admin/setup-school/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(schoolData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create school');
      }

      const data = await response.json();
      setSuccessMessage(`School "${data.school.name}" created successfully!`);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('input');
    setSchoolData(null);
    setError(null);
    setSuccessMessage(null);
    setUrn('');
  };

  if (step === 'input') {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Setup New School</CardTitle>
            <CardDescription>
              Enter a URN to fetch school data from the DfE database and create a school record
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="urn">School URN</Label>
              <Input
                id="urn"
                type="text"
                placeholder="e.g., 123456"
                value={urn}
                onChange={(e) => setUrn(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSchoolData()}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Enter the 6-7 digit Unique Reference Number from the DfE database
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button onClick={fetchSchoolData} disabled={loading || !urn} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching from DfE...
                </>
              ) : (
                'Fetch School Data'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'confirm' && schoolData) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Confirm School Details</CardTitle>
            <CardDescription>
              Review the data fetched from the DfE database before creating the school
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium text-muted-foreground">URN:</span>
                <span>{schoolData.urn}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium text-muted-foreground">School Name:</span>
                <span className="font-medium">{schoolData.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium text-muted-foreground">DfE Number:</span>
                <span>{schoolData.dfe_number}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium text-muted-foreground">Address:</span>
                <span>{schoolData.address}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium text-muted-foreground">Town:</span>
                <span>{schoolData.town}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium text-muted-foreground">Postcode:</span>
                <span>{schoolData.postcode}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium text-muted-foreground">Phase:</span>
                <span>{schoolData.phase}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium text-muted-foreground">Type:</span>
                <span>{schoolData.type}</span>
              </div>
              {schoolData.pupil_count && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-muted-foreground">Pupils:</span>
                  <span>{schoolData.pupil_count}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={reset}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={confirmAndCreate}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating School...
                  </>
                ) : (
                  'Confirm & Create School'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              School Created Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{successMessage}</p>

            <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
              <p className="font-medium">Next steps:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Go to the school dashboard to configure modules</li>
                <li>Connect Google Drive for document storage</li>
                <li>Set up staff access and permissions</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button onClick={reset} variant="outline">
                Setup Another School
              </Button>
              <Button onClick={() => window.location.href = '/admin/super'}>
                Back to Super Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
