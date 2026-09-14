import Link from "next/link"
import { Bus, MapPin, Phone, Mail, Clock, Shield, FileText } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
                <Bus className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-xl text-foreground">Eagle Bus Service</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground -mt-1">
                  Student & Charter Transportation
                </span>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Safe, reliable, and affordable school bus transportation serving charter schools, private schools, field trips, sports clubs, weddings, and group events.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs text-muted-foreground font-medium">
              <li><Link href="/intake" className="hover:text-primary transition-colors">Field Trip Request Form</Link></li>
              <li><Link href="/parent/dashboard" className="hover:text-primary transition-colors">Parent Pay Portal</Link></li>
              <li><Link href="/school-portal" className="hover:text-primary transition-colors">School Partner Portals</Link></li>
              <li><Link href="/rules" className="hover:text-primary transition-colors">School & Group Rules</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Col 3: Contact & Address */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Eagle Bus Service<br />PO Box 425, Newell, NC 28126 US</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <a href="tel:7046065661" className="font-bold text-foreground hover:text-primary transition-colors">
                  (704) 606-5661
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Business Hours */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Operating Hours</h4>
            <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mon – Fri:</span>
                <span className="font-semibold text-foreground">07:00 am – 05:00 pm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sat – Sun:</span>
                <span className="font-semibold text-amber-600">Closed</span>
              </div>
              <div className="pt-1 text-[11px] text-muted-foreground border-t border-border">
                Call for after-hours activity availability.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            Copyright © 2026 Eagle Bus Service - All Rights Reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
            <span>•</span>
            <Link href="/rules" className="hover:underline">School Rules</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
