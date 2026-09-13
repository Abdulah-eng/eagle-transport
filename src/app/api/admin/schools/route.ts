import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth/config";

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: "asc" },
      include: {
        settings: true,
        contacts: true,
        students: true,
        routes: true,
      }
    });
    return NextResponse.json(schools);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (process.env.NODE_ENV !== "development" && (!session || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, code, address, phone, email, maxCapacityPerBus, amRate, pmRate, amPmRate, siblingDiscount } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Name and School Code are required" }, { status: 400 });
    }

    const schoolCode = code.toUpperCase().trim();
    const existing = await prisma.school.findUnique({ where: { code: schoolCode } });
    if (existing) {
      return NextResponse.json({ error: `School code "${schoolCode}" already exists` }, { status: 400 });
    }

    const school = await prisma.school.create({
      data: {
        name,
        code: schoolCode,
        address,
        phone,
        email,
        settings: {
          create: {
            maxCapacityPerBus: Number(maxCapacityPerBus) || 60,
            amRate: amRate ? Number(amRate) : 0,
            pmRate: pmRate ? Number(pmRate) : 0,
            amPmRate: amPmRate ? Number(amPmRate) : 0,
            siblingDiscount: siblingDiscount ? Number(siblingDiscount) : 0,
          }
        }
      },
      include: {
        settings: true,
        students: true,
        routes: true,
      }
    });

    return NextResponse.json({ success: true, school, message: "School created successfully" });
  } catch (error: any) {
    console.error("[ADMIN_SCHOOLS_POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (process.env.NODE_ENV !== "development" && (!session || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { schoolId, action, name, address, phone, email, maxCapacityPerBus, amRate, pmRate, amPmRate, siblingDiscount, isActive } = body;

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    if (action === "toggle_active") {
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      const updated = await prisma.school.update({
        where: { id: schoolId },
        data: { isActive: !school?.isActive }
      });
      return NextResponse.json({ success: true, school: updated, message: `School set to ${updated.isActive ? 'Active' : 'Inactive'}` });
    }

    // Update School rates & settings
    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name: name || undefined,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        settings: {
          upsert: {
            create: {
              maxCapacityPerBus: Number(maxCapacityPerBus) || 60,
              amRate: Number(amRate) || 0,
              pmRate: Number(pmRate) || 0,
              amPmRate: Number(amPmRate) || 0,
              siblingDiscount: Number(siblingDiscount) || 0,
            },
            update: {
              maxCapacityPerBus: maxCapacityPerBus !== undefined ? Number(maxCapacityPerBus) : undefined,
              amRate: amRate !== undefined ? Number(amRate) : undefined,
              pmRate: pmRate !== undefined ? Number(pmRate) : undefined,
              amPmRate: amPmRate !== undefined ? Number(amPmRate) : undefined,
              siblingDiscount: siblingDiscount !== undefined ? Number(siblingDiscount) : undefined,
            }
          }
        }
      },
      include: { settings: true }
    });

    return NextResponse.json({ success: true, school, message: "School settings updated successfully" });
  } catch (error: any) {
    console.error("[ADMIN_SCHOOLS_PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (process.env.NODE_ENV !== "development" && (!session || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    await prisma.school.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "School deleted successfully" });
  } catch (error: any) {
    console.error("[ADMIN_SCHOOLS_DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
