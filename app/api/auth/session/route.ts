import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE = "admin_session"

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 })

  const payload = token.split(".")[1]
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>
    const expiresAt = Number(claims.exp ?? 0)
    if (!expiresAt || expiresAt <= Math.floor(Date.now() / 1000)) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 })
      response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "strict" })
      return response
    }
    return NextResponse.json({ authenticated: true, user: { name: claims.sub ?? "" } })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "strict" })
  return response
}
