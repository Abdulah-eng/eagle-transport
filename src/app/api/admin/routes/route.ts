import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth/config";

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      include: {
        school: true,
        runs: {
          include: { stops: true }
        }
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(routes);
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
    const { action, name, schoolId, description, amRun, pmRun, csvContent } = body;

    // Action 1: Upload Traversa CSV Import
    if (action === "upload_traversa") {
      if (!csvContent) {
        return NextResponse.json({ error: "No CSV content provided" }, { status: 400 });
      }

      const lines = csvContent.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      if (lines.length < 2) {
        return NextResponse.json({ error: "CSV file must contain a header row and at least 1 data row" }, { status: 400 });
      }

      let importedCount = 0;
      // Parse header and process rows
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p: string) => p.replace(/^"|"$/g, "").trim());
        if (parts.length >= 2) {
          const routeName = parts[0] || `Traversa-Route-${Date.now()}`;
          const schoolCode = parts[1] || "GENERAL";
          
          let school = await prisma.school.findFirst({ where: { code: schoolCode.toUpperCase() } });
          if (!school) {
            school = await prisma.school.create({
              data: { name: `School ${schoolCode}`, code: schoolCode.toUpperCase() }
            });
          }

          await prisma.route.create({
            data: {
              name: routeName,
              schoolId: school.id,
              runs: {
                create: [
                  { type: "AM", name: `${routeName} AM` },
                  { type: "PM", name: `${routeName} PM` }
                ]
              }
            }
          });
          importedCount++;
        }
      }

      return NextResponse.json({ success: true, message: `Successfully imported ${importedCount} routes from Traversa CSV` });
    }

    // Action 2: Add New Route
    if (!name) {
      return NextResponse.json({ error: "Route name is required" }, { status: 400 });
    }

    const runsToCreate = [];
    if (amRun !== false) runsToCreate.push({ type: "AM" as const, name: `${name} AM` });
    if (pmRun !== false) runsToCreate.push({ type: "PM" as const, name: `${name} PM` });

    const route = await prisma.route.create({
      data: {
        name,
        description,
        schoolId: schoolId || null,
        runs: {
          create: runsToCreate.length > 0 ? runsToCreate : [{ type: "AM", name: `${name} AM` }]
        }
      },
      include: {
        school: true,
        runs: { include: { stops: true } }
      }
    });

    return NextResponse.json({ success: true, route, message: "Route created successfully" });
  } catch (error: any) {
    console.error("[ADMIN_ROUTES_POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
