import { signOut } from "@/lib/auth/config"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: Request) {
  // 1. First attempt NextAuth's native server-side signOut
  try {
    await signOut({ redirectTo: "/auth/login" })
  } catch (err: any) {
    // NextAuth throws NEXT_REDIRECT on successful signOut redirect
    if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
      throw err
    }
    console.warn("[LOGOUT] NextAuth signOut fallback triggered:", err)
  }

  // 2. Comprehensive fallback cookie deletion logic for all subdomains & secure attributes
  const url = new URL(req.url)
  const host = url.hostname
  const isHttps = req.url.startsWith("https:") || req.headers.get("x-forwarded-proto") === "https"

  // Collect all possible domain variations (host-only, root domain, www, dot-prefixed)
  const domains: (string | undefined)[] = [undefined, host, `.${host}`]
  if (host.startsWith("www.")) {
    const root = host.substring(4)
    domains.push(root, `.${root}`)
  } else if (host.includes(".")) {
    domains.push(`.${host}`)
  }

  const knownCookieNames = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "__Host-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token",
    "authjs.session-token.0",
    "authjs.session-token.1",
    "authjs.session-token.2",
    "__Secure-authjs.session-token.0",
    "__Secure-authjs.session-token.1",
    "__Secure-authjs.session-token.2",
    "next-auth.session-token.0",
    "next-auth.session-token.1",
    "next-auth.session-token.2",
    "__Secure-next-auth.session-token.0",
    "__Secure-next-auth.session-token.1",
    "__Secure-next-auth.session-token.2",
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
    console.error("[LOGOUT] Failed to read request cookies:", err)
  }

  const allCookieNames = Array.from(new Set([...knownCookieNames, ...requestCookies]))

  const loginUrl = new URL("/auth/login", req.url)
  const response = NextResponse.redirect(loginUrl)

  allCookieNames.forEach((name) => {
    // Delete using Next.js helper
    response.cookies.delete(name)

    // Delete using raw Set-Cookie headers for every domain variant
    domains.forEach((dom) => {
      const domAttr = dom ? `; Domain=${dom}` : ""
      const expiredStr = `Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Path=/${domAttr}; HttpOnly; SameSite=Lax`

      if (name.startsWith("__Secure-") || name.startsWith("__Host-") || isHttps) {
        response.headers.append("Set-Cookie", `${name}=; ${expiredStr}; Secure`)
      }
      response.headers.append("Set-Cookie", `${name}=; ${expiredStr}`)
    })
  })

  // Prevent caching of the logout redirect
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")

  return response
}

export async function POST(req: Request) {
  return GET(req)
}
