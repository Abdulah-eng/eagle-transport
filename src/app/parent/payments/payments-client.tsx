"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  CreditCard, DollarSign, CheckCircle2, AlertCircle, 
  ShieldCheck, ArrowRight, Download, RefreshCw, 
  Sparkles, Lock, FileText, Check
} from "lucide-react"

interface ParentPaymentsClientProps {
  parent: any
  childrenBreakdown: Array<{
    studentId: string
    name: string
    schoolName: string
    serviceType: string
    status: string
    basePrice: number
    discountPct: number
    discountAmount: number
    finalPrice: number
  }>
  pricingSummary: {
    totalBaseRate: number
    totalDiscountAmount: number
    netMonthlyTotal: number
  }
}

export default function ParentPaymentsClient({
  parent,
  childrenBreakdown,
  pricingSummary,
}: ParentPaymentsClientProps) {
  const router = useRouter()
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [autoPayEnabled, setAutoPayEnabled] = useState(true)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Card form state
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242")
  const [expDate, setExpDate] = useState("12/28")
  const [cvc, setCvc] = useState("123")
  const [cardName, setCardName] = useState(parent ? `${parent.firstName} ${parent.lastName}` : "Valued Parent")

  const invoices = parent?.invoices || []
  const payments = parent?.payments || []

  const handlePayBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const amountToPay = selectedInvoice ? Number(selectedInvoice.totalAmount) : pricingSummary.netMonthlyTotal

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountToPay,
          invoiceId: selectedInvoice?.id,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Payment failed")

      // Trigger Webhook simulation or immediate status update
      await fetch("/api/stripe/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: data.paymentIntentId || "pi_mock_success",
              amount: amountToPay * 100,
              metadata: {
                parentId: parent?.id,
                invoiceId: selectedInvoice?.id,
              }
            }
          }
        })
      })

      setPaymentSuccess(true)
      setTimeout(() => {
        setCheckoutModalOpen(false)
        setPaymentSuccess(false)
        setSelectedInvoice(null)
        router.refresh()
      }, 2000)
    } catch (err: any) {
      alert(err.message || "Payment process encountered an error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary" /> Family Payment & Subscription Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your monthly recurring bus transportation plan, sibling discounts, payment method, and billing invoices.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setSelectedInvoice(null)
              setCheckoutModalOpen(true)
            }}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md"
          >
            <Lock className="w-4 h-4" /> Pay Balance Now (${pricingSummary.netMonthlyTotal.toFixed(2)})
          </button>
        </div>
      </div>

      {/* Main Grid: Plan Breakdown & Auto-Pay Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Children Pricing Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Active Transportation Plan
                </h2>
                <p className="text-xs text-muted-foreground">Calculated per child with automated sibling discounts</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Recurring Active
              </span>
            </div>

            {/* Children Rate Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                  <tr>
                    <th className="p-3">Child & School</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Base Price</th>
                    <th className="p-3">Sibling Discount</th>
                    <th className="p-3 text-right">Net Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {childrenBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        No enrolled children currently linked.
                      </td>
                    </tr>
                  ) : (
                    childrenBreakdown.map((item, idx) => (
                      <tr key={item.studentId} className="hover:bg-muted/20">
                        <td className="p-3">
                          <div className="font-bold text-foreground">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.schoolName}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                            {item.serviceType === "AM_AND_PM" ? "AM + PM Both" : item.serviceType}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          ${item.basePrice.toFixed(2)} / mo
                        </td>
                        <td className="p-3">
                          {item.discountPct > 0 ? (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                              -{item.discountPct}% OFF (-${item.discountAmount.toFixed(2)})
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">1st Child Rate</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          ${item.finalPrice.toFixed(2)} / mo
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Totals Bar */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal Base Rate:</span>
                <span>${pricingSummary.totalBaseRate.toFixed(2)}</span>
              </div>
              {pricingSummary.totalDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Sibling Discount Deduction:</span>
                  <span>-${pricingSummary.totalDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between items-center text-base font-extrabold text-foreground">
                <span>Total Monthly Recurring Balance:</span>
                <span className="text-xl text-primary">${pricingSummary.netMonthlyTotal.toFixed(2)} / mo</span>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Billing Invoices History
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        No billing invoices generated yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-muted/20">
                        <td className="p-3 font-mono text-xs font-bold text-foreground">
                          {inv.invoiceNumber}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-bold text-foreground">
                          ${Number(inv.totalAmount).toFixed(2)}
                        </td>
                        <td className="p-3">
                          {inv.status === "PAID" && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                              Paid
                            </span>
                          )}
                          {inv.status === "OVERDUE" && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600">
                              Overdue
                            </span>
                          )}
                          {inv.status === "SENT" && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {inv.status !== "PAID" ? (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv)
                                setCheckoutModalOpen(true)
                              }}
                              className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90 transition-colors"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Payment Method & Payment Receipts */}
        <div className="space-y-6">
          {/* Card on File Widget */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-heading text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Payment Method</span>
              <span className="text-xs text-muted-foreground font-normal">Stripe Encrypted</span>
            </h3>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Eagle Parent Card</span>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="font-mono text-lg tracking-widest pt-2">
                •••• •••• •••• 4242
              </div>
              <div className="flex justify-between items-end text-xs text-slate-300">
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Cardholder</div>
                  <div className="font-semibold">{parent ? `${parent.firstName} ${parent.lastName}` : "Valued Parent"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Expires</div>
                  <div className="font-semibold">12 / 28</div>
                </div>
              </div>
            </div>

            {/* Auto-pay Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <div className="text-xs font-bold text-foreground">Auto-Debit Monthly Invoice</div>
                <div className="text-[11px] text-muted-foreground">Charge card on the 1st of each month</div>
              </div>
              <button
                type="button"
                onClick={() => setAutoPayEnabled(!autoPayEnabled)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${
                  autoPayEnabled ? "bg-primary justify-end" : "bg-muted justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>

          {/* Payment Receipts History */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Recent Receipts
            </h3>

            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent payment transactions recorded.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <div key={p.id} className="p-3 bg-muted/20 border border-border/60 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground">${Number(p.amount).toFixed(2)}</div>
                      <div className="text-muted-foreground">{new Date(p.paidAt).toLocaleDateString()} via {p.method}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      SUCCESS
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STRIPE CHECKOUT MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6 relative overflow-hidden">
            {paymentSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Payment Successful!</h3>
                <p className="text-xs text-muted-foreground">
                  Your payment has been processed and your transportation subscription status is updated to ACTIVE.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary" /> Secure Stripe Payment
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedInvoice ? `Paying Invoice #${selectedInvoice.invoiceNumber}` : "Paying Monthly Transportation Balance"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Total Due</div>
                    <div className="text-xl font-extrabold text-primary">
                      ${(selectedInvoice ? Number(selectedInvoice.totalAmount) : pricingSummary.netMonthlyTotal).toFixed(2)}
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePayBalance} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full p-2.5 pr-10 bg-background border border-input rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                      <CreditCard className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        className="w-full p-2.5 bg-background border border-input rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        CVC Code
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        className="w-full p-2.5 bg-background border border-input rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-muted/40 p-3 rounded-lg text-[11px] text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    Payments are encrypted via 256-bit SSL and processed securely by Stripe.
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutModalOpen(false)
                        setSelectedInvoice(null)
                      }}
                      className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Confirm Payment
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
