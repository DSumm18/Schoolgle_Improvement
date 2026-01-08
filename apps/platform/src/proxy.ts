import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Redirect non-www to www (canonical)
    const host = request.headers.get('host');
    if (host === 'schoolgle.co.uk') {
        const url = request.nextUrl.clone();
        url.host = 'www.schoolgle.co.uk';
        return NextResponse.redirect(url, 301);
    }

    return NextResponse.next();
}

// Ensure middleware runs for all paths
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
