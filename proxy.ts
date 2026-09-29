import { NextRequest, NextResponse } from "next/server"

const publicPaths = ["/login", "/api/auth/login", "/api/auth/session"]

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
  ].join("; ")

  const isPublic = publicPaths.some((path) => request.nextUrl.pathname === path)
    || request.nextUrl.pathname.startsWith("/api/backend/")
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy)
  const response = !isPublic && !request.cookies.has("admin_session")
    ? NextResponse.redirect(new URL("/login", request.url))
    : NextResponse.next({ request: { headers: requestHeaders } })

  response.headers.set("Content-Security-Policy", contentSecurityPolicy)
  response.headers.set("x-nonce", nonce)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
