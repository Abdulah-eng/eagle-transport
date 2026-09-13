import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: Request) {
  const cookieStore = await cookies()

  // Clear all NextAuth session cookies
  cookieStore.delete("authjs.session-token")
  cookieStore.delete("__Secure-authjs.session-token")
  cookieStore.delete("next-auth.session-token")
  cookieStore.delete("__Secure-next-auth.session-token")
  cookieStore.delete("authjs.csrf-token")
  cookieStore.delete("next-auth.csrf-token")
  cookieStore.delete("authjs.callback-url")

  const response = NextResponse.redirect(new URL("/auth/login", req.url))
  
  // Set expired cookies on response headers as fallback
  const expiredOptions = "Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly"
  response.headers.append("Set-Cookie", `authjs.session-token=; ${expiredOptions}`)
  response.headers.append("Set-Cookie", `next-auth.session-token=; ${expiredOptions}`)
  response.headers.append("Set-Cookie", `__Secure-authjs.session-token=; ${expiredOptions}`)
  
  return response
}

export async function POST(req: Request) {
  return GET(req)
}
