import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const GET = async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  const cookieStore = cookies();

  const diagnostic = {
    hasAuthHeader: !!authHeader,
    authHeaderPrefix: authHeader?.substring(0, 20) + '...',
    hasCookies: cookieStore.getAll().length > 0,
    cookieNames: cookieStore.getAll().map(c => c.name),
    timestamp: new Date().toISOString()
  };

  // Test both auth methods
  const results: any = { diagnostic };

  // Try Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    results.bearerToken = { user: user?.id, email: user?.email, error: error?.message };
  }

  // Try cookies
  const supabaseCookie = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user: cookieUser }, error: cookieError } = await supabaseCookie.auth.getUser();
  results.cookies = { user: cookieUser?.id, email: cookieUser?.email, error: cookieError?.message };

  return NextResponse.json(results);
};
