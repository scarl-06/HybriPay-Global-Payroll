"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Building, 
  ArrowRight, 
  CheckCircle2, 
  Loader2,
  Lock,
  Globe,
  Wallet
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { fetcher, api } from "@/lib/api";

// The 4 stages of the HybriPay Pipeline
const PIPELINE_STEPS = [
  { id: 1, title: "Fiat Capture", desc: "Locking funds from corporate treasury", icon: Building },
  { id: 2, title: "Minting USDC", desc: "Converting fiat to programmable stablecoins", icon: Lock },
  { id: 3, title: "Solana Settlement", desc: "Executing 400ms cross-border transfer", icon: Globe },
  { id: 4, title: "Local Off-Ramp", desc: "Delivering local fiat to employee bank", icon: Wallet },
];

export default function PayrollPage() {
  const [amount, setAmount] = useState("5000");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSignature, setLastSignature] = useState("");

  const { data: employees, isLoading } = useSWR("/employees", fetcher, {
    onSuccess: (data) => {
      if (data?.employees?.length > 0 && !employeeId) {
        setEmployeeId(data.employees[0].id);
      }
    }
  });

  const handleDisburse = async () => {
    setStatus("processing");
    setCurrentStep(1);
    
    try {
      // 1. Stage the transaction on the backend
      const res = await api.post("/payroll/initiate", {
        employeeId: employeeId,
        amount: Number(amount)
      });

      if (res.data?.transaction?.solanaSignature) {
        setLastSignature(res.data.transaction.solanaSignature);
      }

      // Visually step through for UX (simulating the backend staging process)
      for (let i = 1; i <= 2; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 800)); 
      }

      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("idle");
      alert("Failed to stage payroll. Check console.");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-slate-900">Disburse Payroll</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Execute an atomic fiat-to-fiat cross-border transaction using the Solana network as a hidden transport layer.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Col: The Form */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
            <Wallet className="w-5 h-5 text-sky-500" />
            Transaction Details
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">Select Employee</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none text-slate-900 shadow-sm"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={status !== 'idle'}
              >
                {!employeeId && <option value="">Select an employee...</option>}
                {employees?.employees ? employees.employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.bankAccount})</option>
                )) : <option value="">{isLoading ? "Loading..." : "No employees found"}</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input 
                  type="number" 
                  className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-8 pr-4 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-slate-900 shadow-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={status !== 'idle'}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Estimated Settlement Time</span>
                <span className="font-bold text-sky-600">~ 4.8 seconds</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Network Fee (Solana)</span>
                <span className="font-bold text-emerald-600">$0.00025</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Oracle Quote (USDC/USD)</span>
                <span className="font-bold text-slate-900">1.000</span>
              </div>
            </div>

            <button 
              onClick={handleDisburse}
              disabled={status !== 'idle'}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                status === 'idle' 
                  ? 'bg-gradient-to-r from-blue-900 to-sky-500 hover:scale-[1.02] shadow-sky-500/20' 
                  : status === 'processing' 
                    ? 'bg-blue-900 opacity-80 cursor-not-allowed'
                    : 'bg-emerald-500 shadow-emerald-500/20'
              }`}
            >
              {status === 'idle' && (
                <>Stage Payroll <ArrowRight className="w-5 h-5" /></>
              )}
              {status === 'processing' && (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              )}
              {status === 'success' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Staged Successfully
                  </div>
                  {lastSignature && (
                    <a 
                      href={`https://explorer.solana.com/tx/${lastSignature}?cluster=devnet`}
                      target="_blank"
                      className="text-[10px] text-white/80 hover:text-white flex items-center gap-1 underline underline-offset-4"
                    >
                      View on Solana Explorer <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Right Col: The Pipeline Visualization */}
        <div className="glass-card p-8 flex flex-col">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-slate-900">
            <Globe className="w-5 h-5 text-sky-500" />
            Execution Pipeline
          </h2>

          <div className="flex-1 flex flex-col justify-center relative">
            {/* Connecting Line */}
            <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-slate-200" />

            <div className="space-y-8 relative z-10">
              {PIPELINE_STEPS.map((step) => {
                const isActive = currentStep === step.id;
                const isPast = currentStep > step.id || status === 'success';

                return (
                  <div key={step.id} className="flex gap-6 items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white ${
                      isActive 
                        ? "border-sky-500 text-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.3)] scale-110" 
                        : isPast 
                          ? "border-emerald-500 text-emerald-500" 
                          : "border-slate-200 text-slate-300"
                    }`}>
                      {isPast ? <CheckCircle2 className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    
                    <div className={`pt-1 transition-all duration-500 ${
                      isActive ? "opacity-100 translate-x-2" : isPast ? "opacity-80" : "opacity-40"
                    }`}>
                      <h4 className={`font-bold text-lg ${isActive ? 'text-sky-600' : 'text-slate-900'}`}>
                        {step.title}
                      </h4>
                      <p className="text-slate-500 text-sm mt-1">{step.desc}</p>
                      
                      {/* Active State Pulse Animation */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 text-xs font-mono text-sky-500 bg-sky-50 py-1.5 px-3 rounded-lg border border-sky-100 inline-block"
                          >
                            awaiting signature...
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
