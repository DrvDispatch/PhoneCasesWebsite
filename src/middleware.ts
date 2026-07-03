import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const isProd = process.env.NODE_ENV === "production";

function buildCsp(nonce: string): string {
  const directives = [
    `default-src 'self'`,
    // strict-dynamic: modern browsers trust nonce-loaded scripts and ignore host lists;
    // 'self' https: are fallbacks for older engines.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://api.stripe.com`,
    `frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com`,
    `form-action 'self' https://checkout.stripe.com`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join("; ");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Admin auth guard ---
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // --- CSP + security headers ---
  // A strict nonce-based CSP is only enforced in production; in dev it would
  // break React Fast Refresh (which needs eval + inline).
  if (!isProd) {
    return NextResponse.next();
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.svg|brand/|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt)$).*)",
  ],
};
