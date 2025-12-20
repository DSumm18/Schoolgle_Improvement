"use client";

import { useEffect, useState } from "react";

export default function DebugEnv() {
  const [envStatus, setEnvStatus] = useState<{
    url: boolean;
    anonKey: boolean;
    serviceKey: boolean;
  } | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const status = {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    setEnvStatus(status);

    // Log to console for debugging
    console.log('[DebugEnv] Environment Variables Status:', {
      NEXT_PUBLIC_SUPABASE_URL: status.url 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...` 
        : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: status.anonKey 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...` 
        : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: status.serviceKey 
        ? 'SET (hidden)' 
        : 'MISSING',
    });

    // Show warning if keys are missing
    if (!status.url || !status.anonKey) {
      console.error('[DebugEnv] ⚠️ Missing required environment variables!');
      console.error('[DebugEnv] Make sure .env.local contains:');
      if (!status.url) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
      if (!status.anonKey) console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
      console.error('[DebugEnv] Restart the dev server after adding these variables.');
    }
  }, []);

  // Hidden component - only logs to console
  // Uncomment the return statement below to show a visible debug panel
  return null;

  // Uncomment to show visible debug panel:
  /*
  if (!envStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="font-bold mb-2">Environment Variables Debug</div>
      <div className="space-y-1">
        <div className={envStatus.url ? 'text-green-400' : 'text-red-400'}>
          URL: {envStatus.url ? '✓' : '✗'}
        </div>
        <div className={envStatus.anonKey ? 'text-green-400' : 'text-red-400'}>
          Anon Key: {envStatus.anonKey ? '✓' : '✗'}
        </div>
        <div className={envStatus.serviceKey ? 'text-green-400' : 'text-yellow-400'}>
          Service Key: {envStatus.serviceKey ? '✓' : '✗ (optional)'}
        </div>
      </div>
    </div>
  );
  */
}

