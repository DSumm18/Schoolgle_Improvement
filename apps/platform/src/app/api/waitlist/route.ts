import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
    try {
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase configuration');
            return NextResponse.json({
                success: false,
                error: 'Server configuration error'
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await req.json();
        const { email, school_name, role } = body;

        // Validate email
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid email address'
            }, { status: 400 });
        }

        // Capture UTM params from headers, search params, or cookies
        // Next.js Route Handlers can access headers and cookies
        const utm_source = req.nextUrl.searchParams.get('utm_source') || req.headers.get('x-utm-source') || req.cookies.get('utm_source')?.value || body.utm_source;
        const utm_medium = req.nextUrl.searchParams.get('utm_medium') || req.headers.get('x-utm-medium') || req.cookies.get('utm_medium')?.value || body.utm_medium;
        const utm_campaign = req.nextUrl.searchParams.get('utm_campaign') || req.headers.get('x-utm-campaign') || req.cookies.get('utm_campaign')?.value || body.utm_campaign;

        // Insert into waitlist table
        const { error } = await supabase
            .from('waitlist')
            .insert({
                email,
                school_name: school_name || null,
                role: role || null,
                utm_source: utm_source || null,
                utm_medium: utm_medium || null,
                utm_campaign: utm_campaign || null,
                source: 'website'
            });

        if (error) {
            // Handle duplicates gracefully (23505 is unique violation in Postgres)
            if (error.code === '23505') {
                console.log(`Duplicate waitlist entry for ${email}`);
                return NextResponse.json({ success: true });
            }
            console.error('Waitlist insertion error:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to join waitlist'
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Waitlist API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
