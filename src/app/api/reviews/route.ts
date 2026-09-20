import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { tripId, token, rating, feedback, redirectedToGoogle } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    let updated = false;

    // Try to update by token first (secure link from email)
    if (token) {
      try {
        const review = await prisma.reviewRequest.findUnique({ where: { token } });
        if (review) {
          await prisma.reviewRequest.update({
            where: { token },
            data: {
              rating,
              feedback: feedback || null,
              redirectedToGoogle: !!redirectedToGoogle,
              completedAt: new Date(),
            },
          });
          updated = true;
        }
      } catch (err) {
        console.warn("[Reviews API] Prisma update by token failed:", err);
      }
    }

    // Fallback: find/create by tripId
    if (!updated && tripId) {
      try {
        const existing = await prisma.reviewRequest.findUnique({
          where: { charterTripId: tripId },
        });
        if (existing) {
          await prisma.reviewRequest.update({
            where: { charterTripId: tripId },
            data: {
              rating,
              feedback: feedback || null,
              redirectedToGoogle: !!redirectedToGoogle,
              completedAt: new Date(),
            },
          });
        } else {
          await prisma.reviewRequest.create({
            data: {
              charterTripId: tripId,
              token: `review_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              rating,
              feedback: feedback || null,
              redirectedToGoogle: !!redirectedToGoogle,
              completedAt: new Date(),
            },
          });
        }
        updated = true;
      } catch (err) {
        console.warn("[Reviews API] Prisma create/update by tripId failed:", err);
      }
    }

    // Supabase REST fallback
    if (!updated && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const reviewToken = token || `review_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/review_requests`, {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            id: `rev_${Date.now()}`,
            charterTripId: tripId || null,
            token: reviewToken,
            rating,
            feedback: feedback || null,
            redirectedToGoogle: !!redirectedToGoogle,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }),
        });
        updated = true;
      } catch (supaErr) {
        console.error("[Reviews API] Supabase fallback failed:", supaErr);
      }
    }

    return NextResponse.json({ success: true, saved: updated });
  } catch (error: any) {
    console.error("[REVIEWS_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tripId = searchParams.get("tripId");
  const token = searchParams.get("token");

  try {
    let review: any = null;

    if (token) {
      try {
        review = await prisma.reviewRequest.findUnique({ where: { token } });
      } catch {}
    } else if (tripId) {
      try {
        review = await prisma.reviewRequest.findUnique({ where: { charterTripId: tripId } });
      } catch {}
    }

    if (!review && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const filter = token
        ? `token=eq.${encodeURIComponent(token)}`
        : `charterTripId=eq.${encodeURIComponent(tripId || "")}`;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/review_requests?${filter}&select=*`,
          {
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
          }
        );
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) review = rows[0];
        }
      } catch {}
    }

    return NextResponse.json({ review });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
  }
}
