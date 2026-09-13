import Link from "next/link"
import Footer from "@/components/footer"
import { 
  ShieldAlert, Bus, Phone, FileText, CheckCircle2, AlertTriangle, 
  Clock, MapPin, Smartphone, ShieldCheck, XCircle, ArrowLeft, Calendar
} from "lucide-react"

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-foreground">Eagle Bus Service</span>
              <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest -mt-1">
                Official Rules & Policy Handbook
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-bold">
            <Link 
              href="/intake" 
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5"
            >
              Field Trip Form
            </Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Banner Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Eagle Bus Guidelines & Rules
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-heading text-foreground tracking-tight">
            School & Group Transportation Policy
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Please read these official guidelines carefully before requesting field trips or enrolling in regular daily bus routes. Eagle Bus Service strictly enforces safety, behavior, and release policies.
          </p>
        </div>

        {/* SECTION 1: FIELD TRIP & GROUP GUIDELINES */}
        <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-foreground">School Group Guidelines</h2>
              <p className="text-xs text-muted-foreground">General operating policies for field trips, sports clubs, and charter events</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2">
              <div className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Capacity Restriction
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each bus accommodates a maximum of <strong>50–60 riders</strong> depending on the size of the students.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2">
              <div className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Chaperone Requirement
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A proportional number of adults (staff members/volunteers) must accompany students to ensure proper supervision on all buses.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2">
              <div className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Trip Coordination
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                At least one adult per bus must be familiar with the destination & directions, and carry a cell phone with contact numbers for other group leaders.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2">
              <div className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Bus Inspection & Cleanliness
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Trip leaders must inspect the bus upon arrival & return to confirm all passengers have exited, check for damage or lost items, and ensure the bus is left clean.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2">
              <div className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Itinerary Compliance
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All trips must follow the pre-approved route. Special stops require prior approval with a written itinerary submitted before departure.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2">
              <div className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Student Accountability
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chaperones must account for all assigned students before departing from any location. Students must abide by all school rules.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: PROHIBITED ITEMS */}
        <section className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-amber-950 dark:text-amber-200">Prohibited Items on School Buses</h2>
              <p className="text-xs text-amber-800 dark:text-amber-300">Items not permitted inside the passenger compartment of the bus</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-foreground">
            <p className="text-muted-foreground">
              If storage under the bus is unavailable for these items, an additional bus may be required:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                "Large items (instruments, sports gear, coolers, class projects) blocking aisles or exits",
                "Strapped or secured items inside the bus (prohibited by state policy; must use storage)",
                "Firearms, weapons (operative or ceremonial), or any dangerous objects",
                "Food or beverages (trip leaders must ensure buses remain clean)",
                "Glass items (bottles, containers, vases) and metal cans (soda cans)",
                "Oversized objects like pole vault poles or drill team flags",
                "Alcoholic beverages (open or closed) are strictly prohibited on all Eagle Bus vehicles"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2.5 bg-card p-3 rounded-xl border border-border/80">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-xs font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SECTION 3: CELL PHONE POLICY */}
        <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-foreground">Cell Phone Policy</h2>
              <p className="text-xs text-muted-foreground">Strict zero-distraction policy on all Eagle Bus routes</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground">
              Reasons why cell phones are strictly NOT ALLOWED while riding on the school bus:
            </p>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-foreground">Major Driver Distraction:</strong> Ringtones and loud conversations take the driver’s focus off the road.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-foreground">Interference:</strong> Cell phone signals can interfere with bus radios and on-board computers.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-foreground">Student Privacy & Safety:</strong> Unapproved photo/video recording on buses puts child safety and privacy at risk on social media.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-foreground">Audible Music Prohibited:</strong> Music played aloud prevents the driver from hearing emergency sirens (headphones required).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">5</span>
                <div>
                  <strong className="text-foreground">Classroom Extension:</strong> The school bus is an extension of the classroom—cell phones must remain in bookbags at all times.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">6</span>
                <div>
                  <strong className="text-foreground">Emergency Scene Protection:</strong> Premature phone calls during minor incidents cause traffic congestion and block emergency vehicles.
                </div>
              </li>
            </ul>

            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-950 dark:text-rose-200 text-xs space-y-1">
              <strong className="font-bold uppercase tracking-wider block">Policy Enforcement & Confiscation Warning:</strong>
              <p>
                Cell phones must remain inside student bookbags. If a driver or monitor sees or hears a student’s phone, it will be confiscated and turned over to school administration for parent pickup. In addition, student may be suspended from bus service. Refusal to hand over the phone results in immediate bus suspension.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: RELEASE & CLUSTER STOP POLICY */}
        <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-foreground">Student Release & Cluster Stop Policy</h2>
              <p className="text-xs text-muted-foreground">K–3rd grade release rules and Lake Norman Charter (LNC) bus service terms</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-3 p-5 bg-muted/30 rounded-2xl border border-border/50">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> K–3rd Grade Release Policy
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                No child Kindergarten through third grade is allowed to leave a bus without an adult guardian or older sibling to meet them.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Parents or guardians must wait on the <strong>right side of the bus</strong> so the student does not cross the street alone.
              </p>
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] leading-snug">
                <strong>Return Fee Disclaimer:</strong> If no guardian is at the stop, the child will be returned to school. Parents are charged <strong>$10 per half-hour</strong> of school supervision. If unreachable by 6:00 p.m., police will be notified.
              </div>
            </div>

            <div className="space-y-3 p-5 bg-muted/30 rounded-2xl border border-border/50">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Cluster Stop & LNC Guidelines
              </h3>
              <ul className="space-y-2 text-muted-foreground leading-relaxed">
                <li>• <strong>No AM Service:</strong> LNC Middle School (12435 Old Statesville Rd) has no morning bus pickup; afternoon PM routes only.</li>
                <li>• <strong>48-Hour Processing:</strong> Allow 48 hours to process new requests. Same-day bus riding is strictly prohibited.</li>
                <li>• <strong>Single Stop Requirement:</strong> Students must use only one designated stop. Alternating buses on different days is not permitted.</li>
                <li>• <strong>Estimated Bus Fees:</strong> Bus 1 is $125/month; Bus 2 (mini bus) is $185/month (half price for AM or PM only). Fees subject to ridership fluctuations.</li>
              </ul>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
