import Link from "next/link"
import Footer from "@/components/footer"
import { Bus, Shield, Lock, FileText, Mail, Phone, MapPin, ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
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
                EBS Privacy Policy & Data Protection
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" /> Legal & Data Protection
          </div>
          <h1 className="text-4xl font-extrabold font-heading text-foreground">
            Eagle Bus Service Privacy Policy (EBSPrivacyPolicy)
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: September 2026 • PO Box 425, Newell, NC 28126 US
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-sm text-muted-foreground leading-relaxed">
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> 1. Overview & Scope
            </h2>
            <p>
              Eagle Bus Service ("we", "our", or "us") is committed to protecting the privacy and security of our parents, students, school administrators, and field trip coordinators. This Privacy Policy outlines how we collect, store, and utilize information provided across our website, intake portals, and parent billing system.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> 2. Information Collection & Usage
            </h2>
            <p>
              We collect information necessary to coordinate safe student transportation and charter bookings:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Contact Information:</strong> Names, phone numbers, billing addresses, and email addresses. Your email address will be used strictly for booking confirmations, billing invoices, and critical route safety notifications.</li>
              <li><strong>Student Details:</strong> Student names, grade levels, assigned cluster stops, allergies or special medical needs strictly relevant to bus emergency preparedness.</li>
              <li><strong>Field Trip Specifications:</strong> Destination addresses, group sizes, chaperone counts, and scheduling itineraries.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> 3. Data Protection & Security
            </h2>
            <p>
              We enforce industry-standard administrative, physical, and technical safeguards to ensure child data and family financial information remain secure. Payment transactions processed through our Parent Pay portal are encrypted using Stripe PCI-DSS Level 1 compliant protocols. We never sell, trade, or rent personal data to third parties.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> 4. reCAPTCHA & Third-Party Protection
            </h2>
            <p>
              This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="text-primary underline">Terms of Service</a> apply.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" /> 5. Contact Us Regarding Your Privacy
            </h2>
            <p>
              If you have any questions or concerns regarding our privacy practices, please contact us at:
            </p>
            <div className="p-4 bg-muted/40 rounded-2xl text-xs space-y-1 font-medium text-foreground">
              <p><strong>Eagle Bus Service</strong></p>
              <p>PO Box 425, Newell, NC 28126 US</p>
              <p>Phone: (704) 606-5661</p>
              <p>Operating Hours: Mon – Fri 07:00 am – 05:00 pm</p>
            </div>
          </div>

          <div className="pt-4 text-xs text-muted-foreground border-t border-border text-center">
            Copyright © 2020 - 2026 The Eagle Bus - All Rights Reserved.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
