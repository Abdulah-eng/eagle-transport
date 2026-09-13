import Link from "next/link"
import Image from "next/image"
import Footer from "@/components/footer"
import { 
  Bus, GraduationCap, CreditCard, Building2, ShieldCheck, 
  MapPin, Clock, Calendar, ArrowRight, PhoneCall, CheckCircle2,
  UserCheck, Sparkles, FileText, Zap, Shield, ChevronRight, Star
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-primary selection:text-white">
      {/* FLOATING STITCH GLASS NAV BAR */}
      <div className="fixed top-4 inset-x-0 z-50 px-4 max-w-7xl mx-auto">
        <header className="stitch-glass rounded-full px-6 h-16 flex items-center justify-between shadow-lg border border-white/30 dark:border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Bus className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl tracking-tight text-foreground flex items-center gap-1">
                Eagle Bus <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground -mt-1">
                Transport Operations System
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Link href="/intake" className="hover:text-primary transition-colors">Book Field Trip</Link>
            <Link href="/parent/dashboard" className="hover:text-primary transition-colors">Parent Portal</Link>
            <Link href="/school-portal" className="hover:text-primary transition-colors">School Partners</Link>
            <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Eagle Ops</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/intake"
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md hover:shadow-primary/25 hover:shadow-lg"
            >
              Book Charter Bus <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>
      </div>

      {/* HERO SECTION WITH STITCH GLOW & GENERATED PHOTO */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-secondary" /> Next-Generation Fleet & Route Management
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading text-foreground tracking-tight leading-[1.1]">
                Smart, Connected & Safe <span className="stitch-gradient-text">Bus Transportation</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Streamlined charter trip booking, automated parent subscription billing, live driver mobile manifests, and school district contract operations.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/intake"
                  className="px-7 py-4 bg-primary text-primary-foreground font-bold text-sm rounded-full hover:bg-primary/90 transition-all shadow-xl hover:shadow-primary/30 flex items-center gap-2"
                >
                  <Bus className="w-5 h-5" /> Request Charter Quote
                </Link>
                <Link
                  href="/parent/dashboard"
                  className="px-7 py-4 bg-card border border-border hover:bg-muted text-foreground font-bold text-sm rounded-full transition-all shadow-sm flex items-center gap-2"
                >
                  <CreditCard className="w-5 h-5 text-secondary" /> Parent Pay Portal
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-border/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% On-Time Dispatch
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Stripe Secure Pay
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> GPS Live Monitored
                </div>
              </div>
            </div>

            {/* Hero Image Showcase with Floating Overlays */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 group">
                <Image
                  src="/hero-bus.jpg"
                  alt="Eagle Bus Luxury Charter Fleet"
                  width={800}
                  height={500}
                  priority
                  className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-secondary" /> Premium Charter & School Transport
                  </div>
                  <h3 className="font-heading font-bold text-lg">Eagle Bus Fleet #42 — Ready for Dispatch</h3>
                  <p className="text-xs text-slate-300">Clean, air-conditioned, CDL-certified driver operations.</p>
                </div>
              </div>

              {/* Floating Live Dispatch Card */}
              <div className="absolute -bottom-6 -left-6 stitch-glass p-4 rounded-2xl shadow-xl border border-white/40 dark:border-white/10 hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Live GPS Tracking Active</div>
                  <div className="text-[11px] text-muted-foreground">Driver John S. • Route #R-101</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PORTAL GATEWAYS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold font-heading text-foreground">
            Explore Eagle Bus Portals & Services
          </h2>
          <p className="text-sm text-muted-foreground">
            Dedicated portals tailored for parents, school partners, drivers, and charter customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Gateway 1: Intake */}
          <Link
            href="/intake"
            className="stitch-card-hover bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden group"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Bus className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground group-hover:text-primary transition-colors">
                  Charter & Field Trips
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  Submit field trip requests, receive automated quotes, and track QuickBooks billing invoices.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
              <span>Book Field Trip</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Gateway 2: Parent Pay */}
          <Link
            href="/parent/dashboard"
            className="stitch-card-hover bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden group"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground group-hover:text-primary transition-colors">
                  Parent Pay Portal
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  Manage monthly transportation subscriptions, sibling discounts, bus stops, and Stripe receipts.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
              <span>Parent Portal Access</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Gateway 3: School Portal */}
          <Link
            href="/school-portal"
            className="stitch-card-hover bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden group"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground group-hover:text-primary transition-colors">
                  School Partner Portal
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  Portal for school administrators to view active student rosters, district contract invoices, and CRM logs.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
              <span>School Admin Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Gateway 4: Admin Ops */}
          <Link
            href="/admin/dashboard"
            className="stitch-card-hover bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden group"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground group-hover:text-primary transition-colors">
                  Eagle Ops Center
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  Dispatch control room, dispatch calendar, Traversa routing, audit logs, and compliance analytics.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
              <span>Operations Control</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* DRIVER MANIFEST BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 w-full">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Driver Mobile Portal
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading">
              Real-Time Boarding Attendance & Driver Rosters
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Drivers log student boarding and drop-off attendance live from any phone or tablet, keeping parents notified automatically.
            </p>
          </div>
          <Link
            href="/driver/manifest"
            className="px-7 py-4 bg-primary text-primary-foreground font-bold text-sm rounded-full hover:bg-primary/90 transition-all shrink-0 flex items-center gap-2 shadow-xl hover:shadow-primary/30 relative z-10"
          >
            <UserCheck className="w-5 h-5" /> Open Driver Manifest
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  )
}
