import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Redirect www to non-www
    if (request.headers.get('host')?.startsWith('www.')) {
        const url = request.nextUrl.clone();
        url.host = url.host.replace('www.', '');
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
