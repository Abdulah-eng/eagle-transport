import Link from "next/link"
import Footer from "@/components/footer"
import { Bus, ShieldCheck, Scale, FileText, Mail, Phone, MapPin, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-foreground">Eagle Bus Service</span>
              <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest -mt-1">
                EBS Terms of Service & Passenger Agreement
              </span>
            </div>
          </Link>

          <Link href="/" className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Scale className="w-4 h-4" /> Legal Terms & Operating Conditions
          </div>
          <h1 className="text-4xl font-extrabold font-heading text-foreground">
            Terms of Service & Passenger Agreement
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: September 2026 • PO Box 425, Newell, NC 28126 US
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-sm text-muted-foreground leading-relaxed">
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing the Eagle Bus Service website, submitting field trip intake requests, or registering students for daily transport, you ("User", "Parent", or "Client") agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services or intake portals.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <Bus className="w-5 h-5 text-primary" /> 2. Charter & Field Trip Bookings
            </h2>
            <p>
              Charter trips for schools, sports clubs, private groups, and events are governed by the following operational requirements:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Capacity Limits:</strong> Standard yellow bus capacity is calculated up to 60 passengers (or 40 adults). Overcrowding is strictly prohibited by state transportation regulations.</li>
              <li><strong>Driver Itineraries:</strong> Drivers must strictly follow pre-scheduled route itineraries. Additional stops or modifications on the day of the trip require prior approval from Eagle Bus Service dispatch.</li>
              <li><strong>Chaperone Supervision:</strong> Groups must assign adult chaperones responsible for supervising student conduct throughout the duration of the trip.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> 3. Parent-Pay Student Transportation & Invoicing
            </h2>
            <p>
              Parents subscribing to daily school bus transport routes agree to the billing policies managed through our Parent Portal:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Monthly Rates:</strong> Transportation subscriptions are billed on a monthly cycle. Sibling discounts are applied automatically for 2nd and subsequent enrolled children.</li>
              <li><strong>Payment Timelines:</strong> Invoices are generated at the start of each service period. Payments past due beyond 10 days are subject to service suspension until balances are settled.</li>
              <li><strong>Stripe Card Security:</strong> Online card payments are securely processed through Stripe PCI-DSS Level 1 compliant infrastructure. Eagle Bus Service does not store full payment card details on its servers.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" /> 4. Passenger Conduct & Zero-Tolerance Safety
            </h2>
            <p>
              Safety is our highest priority. All passengers are required to adhere to standard school bus safety protocols:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Passengers must remain seated while the bus is in motion.</li>
              <li>Vandalism, littering, or damage to bus seats/fixtures will result in immediate billing of repair fees to the client or parent.</li>
              <li>Drivers possess sole authority over bus safety and may request removal of disruptive individuals if safety is compromised.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> 5. Cancellations & Weather Refunds
            </h2>
            <p>
              Field trip charter cancellations submitted 14 days prior to departure qualify for full deposit refunds. Trips cancelled due to official emergency severe weather advisories or school district closures will be rescheduled without penalty or refunded in full.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" /> 6. Contact Information & Legal Inquiries
            </h2>
            <p>
              For questions regarding our Terms of Service or transportation contracts, please contact our administrative office:
            </p>
            <div className="p-4 bg-muted/40 rounded-2xl text-xs space-y-1 font-medium text-foreground">
              <p><strong>Eagle Bus Service</strong></p>
              <p>PO Box 425, Newell, NC 28126 US</p>
              <p>Phone: (704) 606-5661</p>
              <p>Operating Hours: Mon – Fri 07:00 am – 05:00 pm</p>
            </div>
          </div>

          <div className="pt-4 text-xs text-muted-foreground border-t border-border text-center">
            Copyright © 2020 - 2026 The Eagle Bus Service - All Rights Reserved.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
