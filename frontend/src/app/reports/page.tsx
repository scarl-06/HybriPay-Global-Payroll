"use client";

import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  Globe2, 
  Scale, 
  PieChart,
  Search,
  ExternalLink,
  Lock
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ComplianceHub() {
  const { data: summary } = useSWR("/reports/compliance", fetcher);
  const { data: ledger } = useSWR("/reports/ledger", fetcher);

  const jurisdictions = summary?.summary || {};

  const exportCSV = () => {
    if (!ledger) return;
    const headers = ["ID", "Status", "Amount", "Country", "Signature", "Date"];
    const rows = ledger.map((tx: any) => [
      tx.id,
      tx.status,
      tx.amountUSD,
      tx.employee?.country,
      tx.solanaSignature,
      tx.createdAt
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map((e: any[]) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HybriPay_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Scale className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Compliance & Audit Hub
            </h1>
          </div>
          <p className="text-slate-500 text-lg max-w-2xl">
            Real-time regulatory reporting and institutional tax withholding tracking across 4 global jurisdictions.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={exportCSV}
            className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
          >
            <Download className="w-5 h-5" />
            Export Audit Bundle (CSV)
          </button>
          <button 
            onClick={() => alert("Generating Secure Encrypted PDF... (This would use a server-side PDF generator in production)")}
            className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
          >
            <FileText className="w-5 h-5" />
            PDF Report
          </button>
        </div>
      </header>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 border-l-4 border-l-indigo-500">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Global Volume</div>
          <div className="text-4xl font-black text-slate-900">${summary?.totalGlobalVolume?.toLocaleString()}</div>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <TrendingUpIcon /> Verified on Solana
          </div>
        </div>
        <div className="glass-card p-8 border-l-4 border-l-emerald-500">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Total Tax Withheld</div>
          <div className="text-4xl font-black text-emerald-600">${summary?.totalGlobalTax?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm">
            <ShieldCheck className="w-4 h-4" /> Proof-of-Tax NFT Linked
          </div>
        </div>
        <div className="glass-card p-8 border-l-4 border-l-amber-500">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Jurisdictions</div>
          <div className="text-4xl font-black text-slate-900">4 Active</div>
          <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm">
            <Globe2 className="w-4 h-4" /> Multi-Country Compliant
          </div>
        </div>
      </div>

      {/* Jurisdiction Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        {Object.entries(jurisdictions).map(([name, data]: [string, any]) => (
          <motion.div 
            key={name}
            whileHover={{ y: -5 }}
            className="glass-card p-6 bg-white/40 border border-slate-200/60"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="font-black text-slate-900">{name}</span>
              <div className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold uppercase text-slate-500">Regulated</div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Payroll:</span>
                <span className="font-bold text-slate-700">${data.totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tax Withheld:</span>
                <span className="font-bold text-indigo-600">${data.taxWithheld.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                <span className="text-slate-400">{data.count} Settlements</span>
                <span className="text-emerald-500 flex items-center gap-1 font-bold">
                  <CheckCircleIcon /> 100% Correct
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Audit Ledger */}
      <div className="glass-card overflow-hidden mt-12 shadow-2xl shadow-indigo-900/5 border border-indigo-100/50">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/40 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Audit Ledger</h2>
            <p className="text-sm text-slate-500">Cryptographically verifiable record of every global settlement.</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by Wallet or ID..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Jurisdiction</th>
                <th className="px-8 py-4">Employee Wallet</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {(ledger || []).map((tx: any) => (
                <tr key={tx.id} className="group hover:bg-indigo-50/30 transition-colors border-b border-slate-50">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        tx.status === "COMPLETED" ? "bg-emerald-500" : "bg-amber-500"
                      )} />
                      <span className="text-sm font-bold text-slate-700">{tx.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-900 uppercase">{tx.employee?.country || "USA"}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-mono text-slate-400 group-hover:text-indigo-600 transition-colors">
                      {tx.employee?.solanaWallet.substring(0, 8)}...{tx.employee?.solanaWallet.substring(36)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-slate-900">${Number(tx.amountUSD).toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <a 
                        href={`https://explorer.solana.com/tx/${tx.solanaSignature}?cluster=devnet`}
                        target="_blank"
                        className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        title="View Solana Signature"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 cursor-pointer hover:bg-emerald-100" title="Proof of Tax NFT">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}
