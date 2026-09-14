import { NextRequest, NextResponse } from "next/server";
import { googleCalendarService } from "@/lib/integrations/google-calendar";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    await googleCalendarService.handleCallback(code);
    return NextResponse.redirect(new URL("/admin/settings?toast=Google+Calendar+Connected", request.url));
  } catch (error: any) {
    console.error("[Google Calendar Auth]", error);
    return NextResponse.redirect(new URL(`/admin/settings?error=${encodeURIComponent(error?.message || "Google Calendar connection failed")}`, request.url));
  }
}
