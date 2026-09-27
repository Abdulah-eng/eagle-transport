"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ShieldCheck, CreditCard, Bus, Calendar, MapPin, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  amount: number;
  totalAmount: number;
  status: string;
  billingName: string;
  billingEmail: string;
  dueDate: string;
  charterTrip?: {
    organizationName: string;
    contactName: string;
    tripDate: string;
    pickupAddress: string;
    destinationAddress: string;
    numberOfStudents: number;
    numberOfBuses: number;
  } | null;
}

export default function CharterInvoicePayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawInvoiceId = params?.invoiceId as string;
  const justApproved = searchParams?.get("approved") === "true";

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Card payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    if (!rawInvoiceId) return;

    async function fetchInvoice() {
      setLoading(true);
      try {
        const res = await fetch(`/api/pay/charter/${encodeURIComponent(rawInvoiceId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load invoice details");
        setInvoice(data.invoice);
        if (data.invoice.status === "PAID") {
          setIsPaid(true);
        }
      } catch (err: any) {
        setError(err.message || "Unable to retrieve invoice.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [rawInvoiceId]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch(`/api/pay/charter/${encodeURIComponent(invoice.invoiceNumber)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber,
          cardExp,
          cardCvc,
          cardName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment processing failed");

      setIsPaid(true);
      setInvoice(prev => prev ? { ...prev, status: "PAID" } : null);
    } catch (err: any) {
      setError(err.message || "Payment processing failed. Please check card details.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
            <CardTitle className="text-xl">Invoice Not Found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/">
              <Button variant="outline">Return to Home Page</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const amountVal = Number(invoice?.totalAmount || invoice?.amount || 0);
  const trip = invoice?.charterTrip;
  const orgName = trip?.organizationName || invoice?.billingName || "Charter Customer";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">Eagle Bus Transportation</span>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest -mt-1">Secure Online Checkout</span>
            </div>
          </Link>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> 256-Bit Encrypted
          </div>
        </div>
      </header>

      {/* Main Payment Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        
        {justApproved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <strong>Quote Approved!</strong> Your charter trip reservation is confirmed. Please complete invoice payment below to finalize driver scheduling.
            </div>
          </div>
        )}

        {isPaid ? (
          <Card className="shadow-xl border-t-8 border-t-emerald-600 bg-white">
            <CardHeader className="text-center pt-8">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <CardTitle className="text-3xl font-extrabold text-slate-900">Payment Received!</CardTitle>
              <CardDescription className="text-base text-slate-600 mt-2">
                Thank you for your payment. Invoice <span className="font-mono font-bold text-slate-900">{invoice?.invoiceNumber}</span> is paid in full.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Organization</span>
                  <span className="font-bold text-slate-900">{orgName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Amount Paid</span>
                  <span className="font-extrabold text-emerald-600 text-lg">${amountVal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Invoice Number</span>
                  <span className="font-mono font-bold">{invoice?.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs">PAID IN FULL</span>
                </div>
              </div>

              <p className="text-xs text-center text-slate-500">
                A copy of this payment receipt has been sent to <strong className="text-slate-700">{invoice?.billingEmail}</strong>.
              </p>
            </CardContent>
            <CardFooter className="justify-center pb-8">
              <Link href="/">
                <Button variant="outline" className="font-bold">Back to Home Page</Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Invoice & Trip Summary */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-widest font-bold opacity-90">Invoice Summary</span>
                    <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded">{invoice?.invoiceNumber}</span>
                  </div>
                  <CardTitle className="text-2xl font-extrabold mt-1">{orgName}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                    <span className="text-slate-500 font-medium text-sm">Total Amount Due</span>
                    <span className="text-3xl font-black text-emerald-600">${amountVal.toFixed(2)}</span>
                  </div>

                  {trip && (
                    <div className="space-y-3 text-xs text-slate-600">
                      <div className="flex items-start gap-2.5">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900 block">Trip Date</span>
                          <span>{new Date(trip.tripDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900 block">Pickup & Destination</span>
                          <span>{trip.pickupAddress} ➔ {trip.destinationAddress}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Bus className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900 block">Passengers / Vehicles</span>
                          <span>{trip.numberOfStudents} Passengers ({trip.numberOfBuses} Bus/es)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Billing Contact:</span> {invoice?.billingName} ({invoice?.billingEmail})
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Stripe Card Payment Form */}
            <div className="lg:col-span-6">
              <Card className="shadow-xl border-2 border-emerald-600">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" /> Credit / Debit Card Payment
                  </CardTitle>
                  <CardDescription>
                    Pay securely using any major credit or debit card. No login required.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="cardName" className="text-xs font-semibold">Name on Card *</Label>
                      <Input 
                        id="cardName" 
                        required 
                        value={cardName} 
                        onChange={(e) => setCardName(e.target.value)} 
                        placeholder={invoice?.billingName || "John Doe"} 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cardNumber" className="text-xs font-semibold">Card Number *</Label>
                      <div className="relative">
                        <Input 
                          id="cardNumber" 
                          required 
                          maxLength={19}
                          value={cardNumber} 
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
                            setCardNumber(v);
                          }} 
                          placeholder="4242 4242 4242 4242" 
                          className="font-mono"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="cardExp" className="text-xs font-semibold">Expires (MM/YY) *</Label>
                        <Input 
                          id="cardExp" 
                          required 
                          maxLength={5}
                          value={cardExp} 
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, "");
                            if (v.length > 2) v = `${v.slice(0,2)}/${v.slice(2,4)}`;
                            setCardExp(v);
                          }} 
                          placeholder="MM/YY" 
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cardCvc" className="text-xs font-semibold">CVC / CVV *</Label>
                        <Input 
                          id="cardCvc" 
                          required 
                          maxLength={4}
                          value={cardCvc} 
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))} 
                          placeholder="123" 
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isProcessing} 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-base rounded-xl shadow-md transition-all mt-4"
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
                        </span>
                      ) : (
                        `Pay $${amountVal.toFixed(2)} Now`
                      )}
                    </Button>
                  </form>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Protected by Stripe 256-bit Secure Encryption</span>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>Eagle Bus Transportation Services • <a href="https://eaglebusconnect.com" className="text-emerald-700 font-bold hover:underline">theeaglebus.com</a> • Dispatch: (704) 606-5661</p>
      </footer>
    </div>
  );
}
