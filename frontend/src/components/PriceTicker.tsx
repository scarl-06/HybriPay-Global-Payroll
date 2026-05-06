"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Globe } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

export default function PriceTicker() {
  const { data, isLoading } = useSWR("/dashboard/prices", fetcher, {
    refreshInterval: 10000 // Update every 10 seconds
  });

  if (isLoading || !data) return (
    <div className="h-8 flex items-center gap-4 px-4 bg-white/30 backdrop-blur-md rounded-full border border-white/40 animate-pulse w-64" />
  );

  return (
    <div className="flex items-center gap-6 px-6 py-2 bg-white/40 backdrop-blur-xl rounded-full border border-white/50 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1">
          <Globe className="w-3 h-3" /> Pyth Oracle Live
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* SOL Price */}
        <div className="flex items-center gap-2 group cursor-pointer">
          <span className="text-[11px] font-bold text-slate-400">SOL/USD</span>
          <AnimatePresence mode="wait">
            <motion.span 
              key={data.solPrice}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="text-sm font-extrabold text-slate-900"
            >
              ${data.solPrice.toLocaleString()}
            </motion.span>
          </AnimatePresence>
          <TrendingUp className="w-3 h-3 text-emerald-500" />
        </div>

        <div className="w-px h-4 bg-slate-200" />

        {/* USDC Price */}
        <div className="flex items-center gap-2 group cursor-pointer">
          <span className="text-[11px] font-bold text-slate-400">USDC Stability</span>
          <AnimatePresence mode="wait">
            <motion.span 
              key={data.usdcPrice}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="text-sm font-extrabold text-blue-600"
            >
              ${data.usdcPrice.toFixed(4)}
            </motion.span>
          </AnimatePresence>
          <Activity className="w-3 h-3 text-blue-400" />
        </div>
      </div>
    </div>
  );
}
