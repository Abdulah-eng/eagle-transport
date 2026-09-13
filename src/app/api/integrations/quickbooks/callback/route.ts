import { NextRequest, NextResponse } from "next/server";
import { quickbooksService } from "@/lib/integrations/quickbooks";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId"); // QuickBooks sends realmId (Company ID)

  if (!code || !realmId) {
    return NextResponse.json({ error: "Missing code or realmId" }, { status: 400 });
  }

  try {
    await quickbooksService.handleCallback(code, realmId);
  } catch (error: any) {
    console.error("[QuickBooks Auth]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/admin/settings?toast=QuickBooks+Connected", request.url));
}
