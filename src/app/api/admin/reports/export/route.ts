import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/config"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get("type") || "revenue"

    let csvContent = ""
    let filename = `eagle_bus_${reportType}_report.csv`

    if (reportType === "revenue") {
      const invoices = await db.invoice.findMany({
        include: { school: true, parent: true, charterTrip: true },
        orderBy: { createdAt: "desc" }
      })

      csvContent = "Invoice Number,Type,Billing Name,Billing Email,Amount,Total Amount,Status,Paid At,Due Date\n"
      invoices.forEach((inv) => {
        csvContent += `"${inv.invoiceNumber}","${inv.type}","${inv.billingName}","${inv.billingEmail}",${inv.amount},${inv.totalAmount},"${inv.status}","${inv.paidAt ? inv.paidAt.toISOString() : ''}","${inv.dueDate ? inv.dueDate.toISOString() : ''}"\n`
      })
    } else if (reportType === "routes") {
      const routes = await db.route.findMany({
        include: { school: true, runs: { include: { stops: true } } },
        orderBy: { name: "asc" }
      })

      csvContent = "Route Name,School,Description,Active,Total Runs,Total Stops\n"
      routes.forEach((r) => {
        const totalStops = r.runs.reduce((acc, run) => acc + run.stops.length, 0)
        csvContent += `"${r.name}","${r.school?.name || 'Unassigned'}","${r.description || ''}",${r.isActive},${r.runs.length},${totalStops}\n`
      })
    } else if (reportType === "ridership") {
      const students = await db.student.findMany({
        include: { school: true, parent: true, registrations: true },
        orderBy: { lastName: "asc" }
      })

      csvContent = "Student ID,First Name,Last Name,Grade,School,Parent Name,Parent Phone,Service Type,Payment Status\n"
      students.forEach((s) => {
        const reg = s.registrations[0]
        csvContent += `"${s.id}","${s.firstName}","${s.lastName}","${s.grade || ''}","${s.school?.name || ''}","${s.parent?.firstName} ${s.parent?.lastName}","${s.parent?.phone1 || ''}","${reg?.serviceType || 'AM_AND_PM'}","${reg?.paymentStatus || 'PENDING'}"\n`
      })
    } else if (reportType === "drivers") {
      const drivers = await db.driver.findMany({
        include: { assignments: { include: { bus: true, run: { include: { route: true } } } } },
        orderBy: { lastName: "asc" }
      })

      csvContent = "Driver ID,First Name,Last Name,Email,Phone,License No,License Exp,Active,Assigned Bus,Assigned Routes\n"
      drivers.forEach((d) => {
        const bus = d.assignments[0]?.bus?.busNumber || "None"
        const routesList = d.assignments.map(a => a.run?.route?.name).filter(Boolean).join("; ")
        csvContent += `"${d.id}","${d.firstName}","${d.lastName}","${d.email}","${d.phone || ''}","${d.licenseNo || ''}","${d.licenseExp ? d.licenseExp.toISOString() : ''}",${d.isActive},"${bus}","${routesList}"\n`
      })
    } else if (reportType === "incidents") {
      const incidents = await db.incident.findMany({
        include: { student: true, school: true, driver: true },
        orderBy: { date: "desc" }
      })

      csvContent = "Incident ID,Date,Incident Type,Driver Name,Student Name,School,Status,Description\n"
      incidents.forEach((inc) => {
        csvContent += `"${inc.id}","${inc.date.toISOString()}","${inc.incidentType}","${inc.driver?.firstName} ${inc.driver?.lastName}","${inc.student ? `${inc.student.firstName} ${inc.student.lastName}` : 'N/A'}","${inc.school?.name || ''}","${inc.status}","${inc.description.replace(/"/g, '""')}"\n`
      })
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[REPORT_EXPORT]", error)
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 })
  }
}
