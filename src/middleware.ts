import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

// ─── Config ───────────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'super-secret-jwt-key-change-this-in-production-please'
);

/** Role → default landing page when no specific path is given. */
const ROLE_HOME: Record<string, string> = {
  ADMIN: '/dashboard',
  OWNER: '/dashboard',
  CASHIER: '/dashboard/sales',
};

/**
 * Auth pages — authenticated users are redirected away from these.
 * Anyone else can access them.
 */
const AUTH_ONLY_PATHS = new Set(['/login', '/register']);

/**
 * Fully public pages — accessible regardless of auth status.
 * Authenticated users are NOT redirected away from these.
 */
const PUBLIC_PREFIXES = ['/', '/about', '/contact', '/blog', '/faq', '/explore', '/privacy', '/terms'];

/** Routes that require ADMIN. */
const ADMIN_ONLY_PREFIXES = ['/dashboard/stores', '/dashboard/users'];

/** Routes that require ADMIN or OWNER. */
const OWNER_PLUS_PREFIXES = ['/dashboard/products', '/dashboard/analytics', '/dashboard/ai'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function redirectTo(url: string, request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL(url, request.url));
}

function matchesAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isPublicPage(pathname: string): boolean {
  // Exact match for '/' or starts with a public prefix followed by '/' or end
  for (const prefix of PUBLIC_PREFIXES) {
    if (prefix === '/') {
      if (pathname === '/') return true;
      continue;
    }
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return true;
  }
  return false;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Always allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const rawToken = request.cookies.get('access_token')?.value;

  // ── Unauthenticated user ──────────────────────────────────────────────────
  if (!rawToken) {
    // Public pages and auth pages: allow through
    if (isPublicPage(pathname) || AUTH_ONLY_PATHS.has(pathname)) return NextResponse.next();
    // Dashboard and everything else: require auth
    return redirectTo('/login', request);
  }

  // ── Verify token ─────────────────────────────────────────────────────────
  let payload: JWTPayload & { role?: string };

  try {
    const { payload: p } = await jwtVerify(rawToken, JWT_SECRET);
    payload = p;
  } catch {
    const response =
      isPublicPage(pathname) || AUTH_ONLY_PATHS.has(pathname)
        ? NextResponse.next()
        : redirectTo('/login?reason=session_expired', request);
    response.cookies.delete('access_token');
    return response;
  }

  const role = payload.role as string | undefined;

  // ── Authenticated user on auth pages → redirect to dashboard ─────────────
  if (AUTH_ONLY_PATHS.has(pathname)) {
    const home = role ? (ROLE_HOME[role] ?? '/dashboard') : '/dashboard';
    return redirectTo(home, request);
  }

  // ── Public pages: authenticated users can still visit them ───────────────
  if (isPublicPage(pathname)) {
    return NextResponse.next();
  }

  // ── Role-based route guards ───────────────────────────────────────────────
  if (matchesAny(pathname, ADMIN_ONLY_PREFIXES) && role !== 'ADMIN') {
    return redirectTo('/dashboard', request);
  }

  if (matchesAny(pathname, OWNER_PLUS_PREFIXES) && !['ADMIN', 'OWNER'].includes(role ?? '')) {
    return redirectTo('/dashboard/sales', request);
  }

  // ── Forward user info to layouts via headers ──────────────────────────────
  const response = NextResponse.next();
  if (role) response.headers.set('x-user-role', role);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
