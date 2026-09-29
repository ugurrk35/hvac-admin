import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE = "admin_session"

function apiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL
  if (!value) throw new Error("NEXT_PUBLIC_API_URL tanımlı değil.")
  return value.replace(/\/+$/, "")
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return false

  const configuredOrigin = process.env.ADMIN_APP_ORIGIN?.replace(/\/+$/, "")
  return origin === request.nextUrl.origin || origin === configuredOrigin
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !isAllowedOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 })
  }

  const { path } = await context.params
  const target = new URL(`${apiBaseUrl()}/${path.map(encodeURIComponent).join("/")}`)
  target.search = request.nextUrl.search
  const requestBody = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer()

  const headers = new Headers()
  const contentType = request.headers.get("content-type")
  const accept = request.headers.get("accept")
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (contentType) headers.set("content-type", contentType)
  if (accept) headers.set("accept", accept)
  if (token) headers.set("authorization", `Bearer ${token}`)

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: requestBody && requestBody.byteLength > 0 ? requestBody : undefined,
    cache: "no-store",
  })
  const responseHeaders = new Headers()
  const upstreamContentType = upstream.headers.get("content-type")
  if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType)
  responseHeaders.set("cache-control", "no-store")
  responseHeaders.set("vary", "Cookie")
  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
