"use client";

import { motion } from "framer-motion";
import { 
  History, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Search,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  X
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const { data: response, isLoading } = useSWR("/transactions", fetcher);

  const transactions = response?.transactions || [];

  const displayTransactions = transactions.filter((tx: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      tx.employee?.name.toLowerCase().includes(term) ||
      tx.id.toLowerCase().includes(term) ||
      tx.solanaSignature?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900">Transaction Ledger</h1>
          <p className="text-slate-500">A real-time record of all payroll settlements across the Solana network.</p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ID, employee name, or signature..." 
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all text-slate-900 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Network ID</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-6 h-16 bg-slate-50/50"></td>
                </tr>
              ))
            ) : displayTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No transactions found. Start your first payroll to see them here!
                </td>
              </tr>
            ) : (
              displayTransactions.map((tx: any) => (
                <motion.tr 
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {tx.status === "COMPLETED" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> SETTLED
                        </span>
                      ) : tx.status === "FAILED" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200">
                          <AlertCircle className="w-3 h-3" /> FAILED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
                          <Clock className="w-3 h-3" /> {tx.status.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <div className="font-semibold text-slate-900">{tx.employee?.name}</div>
                      <div className="text-xs text-slate-400">{tx.employee?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900">${Number(tx.amountUSD).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-tighter">USDC (Solana)</div>
                  </td>
                  <td className="px-6 py-5">
                    {tx.solanaSignature ? (
                      <a 
                        href={`https://explorer.solana.com/tx/${tx.solanaSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-mono text-xs transition-colors"
                      >
                        {tx.solanaSignature.substring(0, 12)}...
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-300 font-mono text-xs">Awaiting Network ID</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-slate-500 text-sm font-medium">{new Date(tx.createdAt).toLocaleDateString()}</div>
                      {tx.status === "COMPLETED" && (
                        <button 
                          onClick={() => setSelectedTx(tx)}
                          className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                        >
                          <ShieldCheck className="w-3 h-3" /> PROOF OF TAX
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* PoT Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
          >
            {/* Header / Ribbon */}
            <div className="h-24 bg-gradient-to-r from-blue-900 to-indigo-900 flex items-center px-8 relative">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <ShieldCheck className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl leading-tight">Proof of Tax Receipt</h2>
                    <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Immutable On-Chain Record</p>
                  </div>
               </div>
               <button 
                 onClick={() => setSelectedTx(null)}
                 className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
               >
                 <X className="w-5 h-5 text-white" />
               </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Main Content */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Certified Tax Settlement</div>
                <div className="text-4xl font-extrabold text-slate-900">
                  ${(Number(selectedTx.amountUSD) * 0.25).toLocaleString()} <span className="text-lg text-slate-400 font-normal">USDC</span>
                </div>
                <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Beneficiary: {selectedTx.employee?.country || 'Global'} Tax Authority
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Employee Name</label>
                  <div className="text-sm font-semibold text-slate-900">{selectedTx.employee?.name}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                  <div className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> SETTLED
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Solana Signature</label>
                  <div className="text-[11px] font-mono text-slate-500 break-all bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                    {selectedTx.solanaSignature}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Mint Address</label>
                  <div className="text-[11px] font-mono text-slate-400 truncate mt-1">
                    EPjFW...vv71i
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                   <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://explorer.solana.com/tx/${selectedTx.solanaSignature}?cluster=devnet`} 
                        alt="QR Code" 
                        className="w-12 h-12 grayscale"
                      />
                   </div>
                   <div className="text-[8px] text-slate-300 font-bold uppercase mt-1">Scan for verification</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-center">
                 <p className="text-[10px] text-slate-400 text-center max-w-[80%] italic">
                   This receipt is cryptographically secured by the HybriPay protocol and recorded on the Solana blockchain.
                 </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
