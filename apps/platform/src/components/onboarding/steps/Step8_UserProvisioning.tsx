/**
 * Step 8: User Provisioning
 *
 * Upload CSV files for bulk user creation.
 */

import { useState } from "react";

interface Step8Props {
  data: any;
  onUpdate: (newData: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step8_UserProvisioning({ data, onUpdate, onNext, onPrev }: Step8Props) {
  const [trustUsers, setTrustUsers] = useState<any[]>([]);
  const [schoolUsers, setSchoolUsers] = useState<any[]>([]);
  const [provisioning, setProvisioning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTrustCSVUpload = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n");
    const headers = lines[0].split(",");

    const users: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(",");
      users.push({
        firstName: values[0],
        lastName: values[1],
        email: values[2],
        role: values[3],
        accessAllSchools: true
      });
    }

    setTrustUsers(users);
  };

  const handleSchoolCSVUpload = async (file: File, urn: string) => {
    const text = await file.text();
    const lines = text.split("\n");

    const users: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(",");
      users.push({
        firstName: values[0],
        lastName: values[1],
        email: values[2],
        role: values[3]
      });
    }

    setSchoolUsers([...schoolUsers, { urn, users }]);
  };

  const provisionUsers = async () => {
    setProvisioning(true);

    try {
      const response = await fetch("/api/onboarding/provision-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: "placeholder", // Will be set in real flow
          trustUsers,
          schoolUsers
        })
      });

      const data = await response.json();
      setResult(data);
      onUpdate({ trustUsers, schoolUsers });
    } catch (error) {
      console.error("User provisioning failed:", error);
    } finally {
      setProvisioning(false);
    }
  };

  const handleNext = () => {
    if (result?.success) {
      onNext();
    } else {
      alert("Please provision users or skip this step");
      onNext(); // Allow skipping
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Users</h2>
        <p className="text-gray-600">Upload CSV files to create user accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trust Central Team */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust Central Team</h3>
          <p className="text-sm text-gray-600 mb-4">Users with access to all schools</p>

          <a
            href="/docs/csv-templates/trust-users-template.csv"
            download
            className="inline-block px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 mb-4"
          >
            Download Template
          </a>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleTrustCSVUpload(e.target.files[0])}
            className="hidden"
            id="trustCsv"
          />
          <label htmlFor="trustCsv" className="block w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-center cursor-pointer">
            Upload Trust Users CSV
          </label>

          {trustUsers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-green-600 font-semibold">{trustUsers.length} users loaded</p>
            </div>
          )}
        </div>

        {/* School Staff */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">School Staff</h3>
          <p className="text-sm text-gray-600 mb-4">Per-school user accounts</p>

          {data.selectedSchools?.map((school: any) => (
            <div key={school.urn} className="mb-4">
              <p className="text-sm font-medium text-gray-900 mb-2">{school.name}</p>
              <a
                href="/docs/csv-templates/school-users-template.csv"
                download
                className="inline-block px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Template
              </a>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleSchoolCSVUpload(e.target.files[0], school.urn)}
                className="hidden"
                id={`school-${school.urn}`}
              />
              <label htmlFor={`school-${school.urn}`} className="block w-full px-3 py-2 bg-gray-50 text-gray-700 rounded text-center text-sm cursor-pointer hover:bg-gray-100">
                Upload CSV
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Provision Button */}
      <div className="mt-8 text-center">
        <button
          onClick={provisionUsers}
          disabled={provisioning || (trustUsers.length === 0 && schoolUsers.length === 0)}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 font-medium"
        >
          {provisioning ? "Creating Users..." : "Create Users & Send Invites"}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 font-semibold">
              ✓ {result.summary?.trustUsersCreated + result.summary?.schoolUsersCreated} users created
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onPrev} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium">
          ← Back
        </button>
        <button onClick={handleNext} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Complete Onboarding →
        </button>
      </div>
    </div>
  );
}
