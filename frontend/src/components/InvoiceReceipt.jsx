import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { 
  Printer, ArrowLeft, Scissors, ShieldCheck, CheckCircle2, 
  MapPin, Phone, Mail, FileText 
} from "lucide-react";
import { Button } from "./ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function InvoiceReceipt() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await axios.get(`${API}/bookings/${id}/receipt`);
        setReceipt(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400 font-mono text-sm">Generating Official Studio Receipt...</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 flex flex-col items-center justify-center p-4">
        <p className="text-zinc-400 text-sm">Receipt not found for this booking ref.</p>
        <Link to="/" className="mt-4"><Button variant="outline" className="text-xs">Go Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Actions Bar */}
        <div className="flex justify-between items-center print:hidden">
          <Link to="/">
            <Button variant="outline" size="sm" className="border-zinc-800 bg-zinc-900 text-zinc-300 text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Studio
            </Button>
          </Link>

          <Button
            size="sm"
            data-testid="print-receipt-btn"
            onClick={() => window.print()}
            className="bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] text-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF Receipt
          </Button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-8 sm:p-12 space-y-8 shadow-2xl text-left print:border-none print:bg-white print:text-black">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-zinc-800 print:border-black/20">
            <div>
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[#D4AF37] transform -rotate-45" />
                <h1 className="font-serif font-black text-2xl text-white print:text-black uppercase tracking-wider">
                  Ink & Blade Studio
                </h1>
              </div>
              <p className="text-xs text-zinc-400 print:text-zinc-600 mt-1">
                Luxury Tattoo Artistry & Executive Barbering
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs uppercase font-mono font-bold text-[#D4AF37]">
                {receipt.invoice_number}
              </div>
              <div className="text-xs text-zinc-400 print:text-zinc-600">
                Issued: {new Date(receipt.date_issued).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Client & Service Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5 p-4 rounded-xl bg-zinc-900/60 print:bg-zinc-100 border border-zinc-800 print:border-zinc-300">
              <span className="uppercase text-[10px] tracking-wider text-zinc-500 font-mono font-bold">Client Particulars</span>
              <div className="text-sm font-bold text-white print:text-black">{receipt.client.name}</div>
              <div className="text-zinc-300 print:text-zinc-700">{receipt.client.email}</div>
              <div className="text-zinc-300 print:text-zinc-700">{receipt.client.phone}</div>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-zinc-900/60 print:bg-zinc-100 border border-zinc-800 print:border-zinc-300">
              <span className="uppercase text-[10px] tracking-wider text-zinc-500 font-mono font-bold">Appointment Schedule</span>
              <div className="text-sm font-bold text-white print:text-black">{receipt.service.name}</div>
              <div className="text-zinc-300 print:text-zinc-700">Master: {receipt.service.artist}</div>
              <div className="text-[#D4AF37] print:text-zinc-900 font-bold">{receipt.service.date} @ {receipt.service.time} ({receipt.service.duration})</div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-400 print:text-zinc-600">
              Deposit & Financial Ledger
            </h3>

            <div className="rounded-xl border border-zinc-800 print:border-zinc-300 overflow-hidden text-xs">
              <div className="p-3 bg-zinc-900/80 print:bg-zinc-200 flex justify-between font-bold">
                <span>Description</span>
                <span>Amount (USD)</span>
              </div>
              <div className="p-3.5 flex justify-between border-b border-zinc-800 print:border-zinc-200">
                <span>{receipt.service.name} - Total Agreed Fee</span>
                <span className="font-mono">${receipt.financials.total_service_fee.toFixed(2)}</span>
              </div>
              <div className="p-3.5 flex justify-between border-b border-zinc-800 print:border-zinc-200 bg-[#D4AF37]/10 print:bg-amber-100 font-bold text-[#D4AF37] print:text-amber-900">
                <span>Stripe Upfront Deposit (Status: PAID)</span>
                <span className="font-mono">-${receipt.financials.deposit_paid.toFixed(2)}</span>
              </div>
              <div className="p-3.5 flex justify-between font-bold text-sm text-white print:text-black bg-zinc-900/50 print:bg-zinc-100">
                <span>Remaining Balance Due at Chair:</span>
                <span className="font-mono text-emerald-400 print:text-emerald-700">
                  ${receipt.financials.remaining_due_at_chair.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Studio Policy & Preparation Guidelines */}
          <div className="p-5 rounded-xl bg-zinc-900/40 print:bg-zinc-50 border border-zinc-800/80 print:border-zinc-200 space-y-3 text-xs text-zinc-400 print:text-zinc-700">
            <h4 className="font-bold text-zinc-200 print:text-black uppercase text-[11px] font-mono tracking-wider">
              Studio Guidelines & Cancellation Policy
            </h4>
            <p>• {receipt.studio_policy.cancellation_policy}</p>
            <p>• {receipt.studio_policy.arrival_guidelines}</p>
            <p>• {receipt.studio_policy.sanitation}</p>
          </div>

          {/* Studio Footer */}
          <div className="pt-6 border-t border-zinc-800 print:border-black/20 flex flex-col sm:flex-row justify-between text-xs text-zinc-500 print:text-zinc-600 gap-2">
            <div>{receipt.studio.name} • {receipt.studio.address}</div>
            <div>{receipt.studio.phone} • {receipt.studio.email}</div>
          </div>

        </div>

      </div>
    </div>
  );
}
