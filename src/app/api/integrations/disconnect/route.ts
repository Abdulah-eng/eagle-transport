import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let { provider } = body;

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    if (provider === "google") provider = "google_calendar";

    const providersToDelete = [provider];
    if (provider === "google_calendar") providersToDelete.push("google");

    // 1. Delete from Prisma Database
    try {
      await prisma.integration.deleteMany({
        where: { provider: { in: providersToDelete } }
      });
    } catch (dbErr) {
      console.warn("[DISCONNECT_API] Prisma deletion failed, trying Supabase REST fallback:", dbErr);
    }

    // 2. Delete from Supabase REST API
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        for (const p of providersToDelete) {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/integrations?provider=eq.${p}`, {
            method: 'DELETE',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            }
          });
        }
      } catch (supaErr) {
        console.error("[DISCONNECT_API] Supabase REST deletion fallback failed:", supaErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${provider === 'quickbooks' ? 'QuickBooks' : 'Google Calendar'} integration disconnected successfully` 
    });
  } catch (error: any) {
    console.error("[DISCONNECT_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to disconnect integration" }, { status: 500 });
  }
}
