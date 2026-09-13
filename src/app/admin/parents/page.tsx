import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { 
  Users, Search, Mail, Phone, MapPin, 
  GraduationCap, CreditCard, ShieldCheck
} from "lucide-react"

export default async function AdminParentsPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
    redirect("/auth/login")
  }

  const parents = await db.parent.findMany({
    include: {
      students: {
        include: {
          school: true,
          registrations: true,
        }
      },
      invoices: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> Parents & Accounts Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage parent contact details, enrolled family members, billing addresses, and payment statuses.
          </p>
        </div>
      </div>

      {/* Parents Directory Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between">
          <span>Registered Parents ({parents.length} total)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Parent Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Address</th>
                <th className="p-4">Enrolled Children</th>
                <th className="p-4 text-right">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No parent accounts registered in the database yet.
                  </td>
                </tr>
              ) : (
                parents.map((parent) => {
                  const childrenCount = parent.students.length
                  const hasOverdue = parent.invoices.some(i => i.status === "OVERDUE")

                  return (
                    <tr key={parent.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-foreground">{parent.firstName} {parent.lastName}</div>
                        <div className="text-xs text-muted-foreground font-mono">ID: #{parent.id.slice(-6)}</div>
                      </td>

                      <td className="p-4 text-xs space-y-0.5">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <Mail className="w-3.5 h-3.5 text-primary shrink-0" /> {parent.email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {parent.phone1 || "N/A"}
                        </div>
                      </td>

                      <td className="p-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /> {parent.address || "Main Street"}
                        </div>
                        <div>{parent.city || "Springfield"}, {parent.state || "GA"} {parent.zipCode || ""}</div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-primary" />
                          <span className="font-bold text-foreground">{childrenCount} Child(ren)</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {parent.students.map(s => `${s.firstName} (${s.school?.name || 'School'})`).join(", ")}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        {hasOverdue ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600">
                            Past Due Balance
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                            Active Account
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
