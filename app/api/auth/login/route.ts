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

function getRoles(token: string): string[] {
  const payload = token.split(".")[1]
  if (!payload) return []

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>
    const roleClaim = claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
    return Array.isArray(roleClaim) ? roleClaim.map(String) : roleClaim ? [String(roleClaim)] : []
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 })
    }

    const requestBody = await request.json().catch(() => null) as Record<string, unknown> | null
    const identifier = String(requestBody?.identifier ?? requestBody?.username ?? "").trim()
    const password = String(requestBody?.password ?? "")

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Kullanıcı adı, e-posta/telefon ve şifre gereklidir." },
        { status: 400 },
      )
    }

    const upstream = await fetch(`${apiBaseUrl()}/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ identifier, password }),
      cache: "no-store",
    })
    const payload = await upstream.json().catch(() => null) as Record<string, unknown> | null

    if (!upstream.ok) {
      return NextResponse.json(payload ?? { message: "Giriş başarısız." }, { status: upstream.status })
    }

    const data = payload?.data as Record<string, unknown> | undefined
    const token = (data?.token ?? data?.Token ?? payload?.token ?? payload?.Token) as string | undefined
    if (!token || !getRoles(token).includes("Admin")) {
      return NextResponse.json({ message: "Bu alan için yönetici yetkisi gerekli." }, { status: 403 })
    }

    const response = NextResponse.json({ user: data?.user ?? data?.User ?? null })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 3,
    })
    return response
  } catch {
    return NextResponse.json({ message: "Oturum servisine ulaşılamadı." }, { status: 502 })
  }
}
