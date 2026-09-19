"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, ExternalLink, CheckCircle, Printer, X, FileText, Bus, Building2 } from "lucide-react";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  type: string;
  billingName: string | null;
  billingEmail: string | null;
  billingAddress: string | null;
  amount: number | string;
  totalAmount: number | string;
  status: string;
  dueDate: string | Date | null;
  paidAt: string | Date | null;
  quickbooksInvoiceId: string | null;
  notes: string | null;
  createdAt: string | Date;
  charterTrip?: {
    organizationName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string | null;
    tripDate: string | Date;
    pickupAddress: string;
    destinationAddress: string;
    numberOfBuses: number;
    numberOfStudents: number;
  } | null;
}

export default function SchoolInvoicesClient({ 
  invoices, 
  schoolName 
}: { 
  invoices: InvoiceItem[]; 
  schoolName: string;
}) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get("invoiceId") || window.location.hash.replace("#invoice-", "");
      if (targetId) {
        const found = invoices.find(inv => inv.id === targetId || inv.invoiceNumber === targetId);
        if (found) {
          setSelectedInvoice(found);
        }
      }
    }
  }, [invoices]);

  // Returns QB direct invoice URL only if qbId is a real Intuit transaction ID (not placeholder "149")
  const getRealQbUrl = (invoice: InvoiceItem): string | null => {
    const qbId = (invoice.quickbooksInvoiceId || "").trim();
    // "149" is the mock/placeholder returned when QB is not connected or API fails
    // Any real Intuit transaction ID is a non-placeholder numeric string
    if (qbId && qbId !== "149" && /^\d+$/.test(qbId)) {
      return `https://sandbox.qbo.intuit.com/app/invoice?txnId=${qbId}`;
    }
    return null;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">Invoices & Billing Statements</h1>
          <p className="text-slate-600 mt-1">
            Real-time QuickBooks statements and contract billing for <span className="font-semibold text-slate-900">{schoolName}</span>.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {invoices.map((invoice) => {
          const title = invoice.charterTrip?.organizationName || invoice.notes || `Transportation Billing Statement (${invoice.invoiceNumber})`;
          const amountVal = Number(invoice.totalAmount || invoice.amount || 0);
          const realQbUrl = getRealQbUrl(invoice);
          const isQbSynced = !!realQbUrl;

          return (
            <Card key={invoice.id} id={`invoice-${invoice.id}`} className={`shadow-sm transition-all hover:shadow-md cursor-pointer ${
              invoice.status === 'OVERDUE' || invoice.status === 'SENT' ? 'border-l-4 border-l-rose-500' : 
              invoice.status === 'PAID' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-amber-500'
            }`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  
                  <div className="flex items-start gap-4" onClick={() => setSelectedInvoice(invoice)}>
                    <div className={`p-3 rounded-2xl ${
                      invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                      invoice.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 hover:text-blue-600 transition-colors">{title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1 font-medium">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border text-slate-800 font-bold">{invoice.invoiceNumber}</span>
                        <span>•</span>
                        <span>{invoice.dueDate ? `Due: ${formatDate(invoice.dueDate)}` : "Due upon receipt"}</span>
                        {isQbSynced && (
                          <>
                            <span>•</span>
                            <span className="text-purple-700 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-purple-600" /> QB #{invoice.quickbooksInvoiceId}
                            </span>
                          </>
                        )}
                        {!isQbSynced && invoice.quickbooksInvoiceId && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              QB Invoice (local only)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                    <div className="text-left md:text-right">
                      <div className="font-black text-2xl text-slate-900">${amountVal.toFixed(2)}</div>
                      <div className="text-xs font-semibold mt-1">
                        {invoice.status === 'PAID' ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">Paid in Full</span>
                        ) : invoice.status === 'DRAFT' ? (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">Draft Statement</span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">Payment Pending</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setSelectedInvoice(invoice)}
                        variant="outline"
                        className="text-xs font-bold gap-1.5 border-slate-300"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" /> View Statement
                      </Button>

                      {isQbSynced && realQbUrl && (
                        <a 
                          href={realQbUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                          title={`Open Invoice #${invoice.quickbooksInvoiceId} in QuickBooks`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> QuickBooks
                        </a>
                      )}
                      {!isQbSynced && invoice.quickbooksInvoiceId && (
                        <span
                          className="px-3.5 py-2 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-default"
                          title="This invoice was created locally. Connect QuickBooks in Admin Settings to sync."
                        >
                          QB Not Synced
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          );
        })}

        {invoices.length === 0 && (
          <div className="text-center p-12 border-2 border-dashed rounded-2xl bg-white">
            <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-bold text-slate-900">No Billing Invoices Generated Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Invoices will automatically appear here once field trip requests are quoted or contract billings are issued.
            </p>
          </div>
        )}
      </div>

      {/* Invoice Detail / Statement Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-4 sm:p-8 space-y-4 sm:space-y-6 relative text-slate-900">
            <button 
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors print:hidden"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 sm:pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm shrink-0">
                  <Bus className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900">Eagle Bus Transportation</h2>
                  <p className="text-xs text-slate-500">Official Charter Billing Statement</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Invoice #</span>
                <div className="text-base sm:text-lg font-mono font-black text-slate-900">{selectedInvoice.invoiceNumber}</div>
              </div>
            </div>

            {/* Bill To & Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Billed To</span>
                <p className="font-bold text-slate-900 mt-1">{selectedInvoice.billingName || schoolName}</p>
                <p className="text-xs text-slate-600">{selectedInvoice.billingEmail}</p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Payment Details</span>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  Status: <span className="font-bold uppercase text-amber-700">{selectedInvoice.status}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Due Date: {selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate) : "Due upon receipt"}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Statement Summary</h3>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Buses</th>
                    <th className="p-3 text-center">Passengers</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-medium">
                      {selectedInvoice.charterTrip?.organizationName || selectedInvoice.notes || "Charter Transportation Service"}
                      {selectedInvoice.charterTrip && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Date: {formatDate(selectedInvoice.charterTrip.tripDate)} | Pickup: {selectedInvoice.charterTrip.pickupAddress} → {selectedInvoice.charterTrip.destinationAddress}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold">{selectedInvoice.charterTrip?.numberOfBuses || 1}</td>
                    <td className="p-3 text-center font-bold">{selectedInvoice.charterTrip?.numberOfStudents || 30}</td>
                    <td className="p-3 text-right font-black text-slate-900">
                      ${Number(selectedInvoice.totalAmount || selectedInvoice.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                {selectedInvoice.quickbooksInvoiceId && (
                  <span className="font-semibold text-purple-700">QuickBooks Synced: #{selectedInvoice.quickbooksInvoiceId}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Amount Due</span>
                <div className="text-3xl font-black text-slate-900">${Number(selectedInvoice.totalAmount || selectedInvoice.amount || 0).toFixed(2)}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 print:hidden">
              <Button 
                onClick={handlePrint}
                variant="outline"
                className="text-xs font-bold gap-1.5"
              >
                <Printer className="h-4 w-4 text-slate-600" /> Print Statement
              </Button>

              <div className="flex items-center gap-2">
                {selectedInvoice.quickbooksInvoiceId && getRealQbUrl(selectedInvoice) && (
                  <a
                    href={getRealQbUrl(selectedInvoice)!}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="h-4 w-4" /> Open In QuickBooks
                  </a>
                )}
                {selectedInvoice.quickbooksInvoiceId && !getRealQbUrl(selectedInvoice) && (
                  <span
                    className="px-3.5 py-2 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-default"
                    title="This invoice was created locally. Connect QuickBooks in Admin Settings to sync."
                  >
                    QB Not Synced
                  </span>
                )}
                <Button
                  onClick={() => setSelectedInvoice(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  Close
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
