"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Phone, MapPin, Mail, Bell, ShieldCheck, CheckCircle2, RefreshCw } from "lucide-react"

interface ParentProfileClientProps {
  parent: any
}

export default function ParentProfileClient({ parent }: ParentProfileClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const [firstName, setFirstName] = useState(parent?.firstName || "")
  const [lastName, setLastName] = useState(parent?.lastName || "")
  const [phone1, setPhone1] = useState(parent?.phone1 || "")
  const [phone2, setPhone2] = useState(parent?.phone2 || "")
  const [address, setAddress] = useState(parent?.address || "")
  const [city, setCity] = useState(parent?.city || "")
  const [state, setState] = useState(parent?.state || "GA")
  const [zipCode, setZipCode] = useState(parent?.zipCode || "")

  // Notification Preferences
  const [smsDelayAlerts, setSmsDelayAlerts] = useState(true)
  const [emailReceipts, setEmailReceipts] = useState(true)
  const [emergencyPhoneAlerts, setEmergencyPhoneAlerts] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage("")

    try {
      const res = await fetch("/api/parent/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone1,
          phone2,
          address,
          city,
          state,
          zipCode,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update profile")

      setSuccessMessage("Your contact information and preferences have been updated.")
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Error updating profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
          <User className="w-7 h-7 text-primary" /> Account Profile & Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your primary contact info, address for bus stop routing, and notification preferences.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2 border-b border-border pb-3">
            <User className="w-5 h-5 text-primary" /> Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Primary Phone Number (SMS Alerts)
              </label>
              <input
                type="tel"
                value={phone1}
                onChange={(e) => setPhone1(e.target.value)}
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Secondary Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Account Email Address
            </label>
            <input
              type="email"
              value={parent?.email || ""}
              disabled
              className="w-full p-2.5 bg-muted border border-input rounded-lg text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Email is managed via your portal login identity.</p>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2 border-b border-border pb-3">
            <MapPin className="w-5 h-5 text-primary" /> Residential Address
          </h2>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Zip Code
              </label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Bell className="w-5 h-5 text-primary" /> Transportation Alerts & Notifications
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
              <div>
                <div className="font-bold text-foreground text-sm">SMS Bus Delay & Route Change Alerts</div>
                <div className="text-xs text-muted-foreground">Receive instant text alerts if a driver is delayed or route changes</div>
              </div>
              <button
                type="button"
                onClick={() => setSmsDelayAlerts(!smsDelayAlerts)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${
                  smsDelayAlerts ? "bg-primary justify-end" : "bg-muted justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
              <div>
                <div className="font-bold text-foreground text-sm">Email Billing Receipts & Monthly Invoices</div>
                <div className="text-xs text-muted-foreground">Receive automated PDF receipts whenever a payment is processed</div>
              </div>
              <button
                type="button"
                onClick={() => setEmailReceipts(!emailReceipts)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${
                  emailReceipts ? "bg-primary justify-end" : "bg-muted justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
              <div>
                <div className="font-bold text-foreground text-sm">Emergency Dispatch Phone Broadcasts</div>
                <div className="text-xs text-muted-foreground">Allow automated emergency phone calls for immediate weather/road closures</div>
              </div>
              <button
                type="button"
                onClick={() => setEmergencyPhoneAlerts(!emergencyPhoneAlerts)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${
                  emergencyPhoneAlerts ? "bg-primary justify-end" : "bg-muted justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Save Profile & Preferences
          </button>
        </div>
      </form>
    </div>
  )
}
