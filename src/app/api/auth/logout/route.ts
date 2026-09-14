import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: Request) {
  const loginUrl = new URL("/auth/login", req.url)
  const response = NextResponse.redirect(loginUrl)

  const isHttps = req.url.startsWith("https:") || req.headers.get("x-forwarded-proto") === "https"

  const knownCookieNames = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "__Host-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token",
    "authjs.session-token.0",
    "authjs.session-token.1",
    "__Secure-authjs.session-token.0",
    "__Secure-authjs.session-token.1",
    "next-auth.session-token.0",
    "next-auth.session-token.1",
    "__Secure-next-auth.session-token.0",
    "__Secure-next-auth.session-token.1",
    "authjs.csrf-token",
    "__Secure-authjs.csrf-token",
    "next-auth.csrf-token",
    "__Secure-next-auth.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url"
  ]

  let requestCookies: string[] = []
  try {
    const cookieStore = await cookies()
    requestCookies = cookieStore.getAll().map((c) => c.name)
  } catch (err) {
    console.error("[LOGOUT_COOKIE_READ_ERROR]", err)
  }

  const allCookieNames = new Set([...knownCookieNames, ...requestCookies])

  allCookieNames.forEach((name) => {
    // Delete via Next.js response cookies helper
    response.cookies.delete(name)

    // Also set explicit expired Set-Cookie headers for browser compatibility
    const expiredPast = "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax"
    
    // Crucial: __Secure- prefixed cookies MUST include '; Secure' or browsers ignore the deletion header on HTTPS
    if (name.startsWith("__Secure-") || isHttps) {
      response.headers.append("Set-Cookie", `${name}=; ${expiredPast}; Secure`)
    }
    response.headers.append("Set-Cookie", `${name}=; ${expiredPast}`)
  })

  // Prevent browser caching of the logout response
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")

  return response
}

export async function POST(req: Request) {
  return GET(req)
}
