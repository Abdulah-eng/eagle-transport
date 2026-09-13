import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const embedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=America%2FNew_York`;
  return NextResponse.redirect(embedUrl);
}
