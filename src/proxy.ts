import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  // Check if it's an admin route
  if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin')) {
    const authHeader = req.headers.get('authorization');
    const expectedPassword = process.env.ADMIN_PASSWORD || 'quantu-admin-2026';

    if (authHeader) {
      const authValue = authHeader.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      if (pwd === expectedPassword || user === expectedPassword) {
        return NextResponse.next();
      }
    }

    // Require Basic Auth
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin', '/api/admin/:path*'],
};
