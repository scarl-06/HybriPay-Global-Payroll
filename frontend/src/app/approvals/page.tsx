"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Landmark,
  FileSignature,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

import useSWR from "swr";
import { fetcher, api } from "@/lib/api";

export default function ApprovalsPage() {
  const { data: approvals, mutate } = useSWR("/approvals/pending", fetcher, {
    refreshInterval: 3000
  });
  const [executing, setExecuting] = useState<string | null>(null);

  const displayApprovals = approvals || [];
  const totalYield = displayApprovals.reduce((acc: number, tx: any) => acc + (tx.yieldEarned || 12.50), 0);

  const handleApprove = async (id: string) => {
    setExecuting(id);
    try {
      await api.post("/approvals/execute", { transactionId: id });
      mutate(); // Refresh the list
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || "Execution failed. Check your treasury balance or Solana connectivity.";
      alert(msg);
    } finally {
      setExecuting(null);
    }
  };

  const handleReject = async (id: string) => {
    setExecuting(id);
    try {
      await api.post("/approvals/reject", { transactionId: id });
      mutate();
    } catch (err) {
      console.error(err);
      alert("Rejection failed. Check console.");
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900 flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-blue-900" />
            Executive Approvals
          </h1>
          <p className="text-slate-500">
            Secure Multi-Party Computation (MPC) Authorization Gateway.
          </p>
        </div>
        <div className="px-6 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3 shadow-sm">
          <Landmark className="w-5 h-5 text-blue-600" />
          <div className="text-sm font-bold">
            Total Yield Earned: <span className="text-emerald-600">+${totalYield.toFixed(2)}</span>
          </div>
        </div>
      </header>

      {displayApprovals.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">All Clear!</h2>
          <p className="text-slate-500">There are no pending payroll batches requiring your authorization.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayApprovals.map((tx: any) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-blue-200 transition-colors"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {[...Array(tx.approvalsRequired)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={i === tx.approvalsReceived ? { 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5] 
                        } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={cn(
                          "w-4 h-4 rounded-full border-2 transition-all duration-500 relative",
                          i < tx.approvalsReceived 
                            ? "bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)]" 
                            : "bg-slate-100 border-slate-200"
                        )}
                      >
                        {i < tx.approvalsReceived && (
                          <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <span className="px-3 py-1 bg-blue-50/50 backdrop-blur-md text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-200/50 flex items-center gap-1.5 shadow-sm">
                    <UserCheck className="w-3 h-3" />
                    {tx.approvalsReceived} / {tx.approvalsRequired} signatures
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">
                    Payroll Batch for <span className="text-blue-600">{tx.employee?.name}</span>
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Staged by HR. Awaiting final executive cryptographic signature.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Total Payout</div>
                    <div className="text-xl font-bold text-slate-900">${Number(tx.amountUSD).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Float Yield Generated</div>
                    <div className="text-xl font-bold text-emerald-600">+${(tx.yieldEarned || 12.50).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-64 shrink-0">
                <button
                  onClick={() => handleApprove(tx.id)}
                  disabled={executing === tx.id}
                  className="w-full py-4 rounded-xl font-bold text-white bg-blue-900 hover:bg-blue-800 shadow-lg shadow-blue-900/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  {executing === tx.id ? (
                    "Processing..."
                  ) : (
                    <>
                      <FileSignature className="w-5 h-5" />
                      {tx.approvalsReceived === 0 ? "Initial Approval" : "Finalize & Execute"}
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReject(tx.id)}
                  disabled={executing === tx.id}
                  className="w-full py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Batch
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
