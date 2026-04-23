"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DFESchoolData {
  urn: number;
  name: string;
  la_name?: string;
  address?: { town?: string; postcode?: string };
}

const MOCK_SCHOOLS: Record<string, DFESchoolData> = {
  "123456": { urn: 123456, name: "Grove House Primary School", la_name: "East Sussex", address: { town: "Eastbourne", postcode: "BN21 1AA" } },
};

export default function CreateSchoolFormPage() {
  const router = useRouter();
  const urnRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const form = document.getElementById('school-form');
    if (!form) return;

    const handleSubmit = (e: Event) => {
      e.preventDefault();
      const urn = urnRef.current?.value || "";
      setResult(`Searching for URN: ${urn}`);

      setTimeout(() => {
        const school = MOCK_SCHOOLS[urn];
        if (school) {
          setResult(`Found: ${school.name} in ${school.la_name}`);
        } else {
          setResult("School not found");
        }
      }, 500);
    };

    form.addEventListener('submit', handleSubmit);
    return () => form.removeEventListener('submit', handleSubmit);
  }, []);

  return (
    <div style={{ padding: "50px", maxWidth: "600px" }}>
      <h1>Create School (Native Events)</h1>
      <p>Mounted: {isMounted ? "YES" : "NO"}</p>

      <form id="school-form" style={{ marginTop: "20px" }}>
        <div>
          <label>School URN:</label>
          <input
            ref={urnRef}
            type="text"
            placeholder="123456"
            style={{ padding: "10px", marginLeft: "10px", width: "200px" }}
          />
        </div>
        <button type="submit" style={{ padding: "10px 20px", marginTop: "10px" }}>
          Look Up School
        </button>
      </form>

      {result && (
        <div style={{ marginTop: "20px", padding: "10px", background: "#f0f0f0" }}>
          {result}
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{ padding: "10px 20px" }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
