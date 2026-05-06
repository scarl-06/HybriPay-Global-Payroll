"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Users, 
  Activity, 
  Zap,
  TrendingUp,
  Loader2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Dashboard() {
  const { data, error, isLoading } = useSWR("/dashboard/analytics", fetcher, {
    refreshInterval: 5000 // Polling for live dashboard feel
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
      </div>
    );
  }

  // Fallback data if API fails
  const stats = data || {
    totalVolume: 0,
    treasuryBalance: 0,
    activeEmployees: 0,
    successRate: 100,
    recentTransactions: [],
    volumeData: [
      { name: "Mon", volume: 0 }, { name: "Tue", volume: 0 }
    ]
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900">System Overview</h1>
          <p className="text-slate-500">Real-time performance metrics for your enterprise payroll bridge.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert("Date filtering coming soon!")} className="px-4 py-2 rounded-xl glass-card text-sm font-medium text-slate-600 hover:bg-white/80">
            Last 30 Days
          </button>
          <Link href="/payroll" className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-900 to-sky-500 text-white text-sm font-bold shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform flex items-center">
            New Payment
          </Link>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Stat 1 */}
        <motion.div variants={item} className="col-span-3 glass-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center text-emerald-600 text-sm font-bold">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              12%
            </div>
          </div>
          <div className="text-slate-500 text-sm font-medium mb-1">Total Volume (USD)</div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">${stats.totalVolume.toLocaleString()}</div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-100 rounded-full blur-2xl group-hover:bg-blue-200 transition-colors" />
        </motion.div>

        {/* Stat 2 */}
        <motion.div variants={item} className="col-span-3 glass-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-sky-100 rounded-lg text-sky-600">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex items-center text-emerald-600 text-sm font-bold">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              4%
            </div>
          </div>
          <div className="text-slate-500 text-sm font-medium mb-1">Treasury Balance</div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">{stats.treasuryBalance.toLocaleString()} USDC</div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-sky-100 rounded-full blur-2xl group-hover:bg-sky-200 transition-colors" />
        </motion.div>

        {/* Stat 3 */}
        <motion.div variants={item} className="col-span-3 glass-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="text-slate-500 text-sm font-medium mb-1">Active Employees</div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">{stats.activeEmployees}</div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-100 rounded-full blur-2xl group-hover:bg-indigo-200 transition-colors" />
        </motion.div>

        {/* Stat 4: DeFi Yield */}
        <motion.div variants={item} className="col-span-3 glass-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex items-center text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              5.0% APY
            </div>
          </div>
          <div className="text-slate-500 text-sm font-medium mb-1">DeFi Potential Yield</div>
          <div className="text-3xl font-bold tracking-tight text-emerald-600">+${stats.potentialDailyYield} <span className="text-xs text-slate-400">/ day</span></div>
          <p className="text-[10px] text-slate-400 mt-2 italic">Interest earned while funds are in escrow.</p>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-100 rounded-full blur-2xl group-hover:bg-emerald-200 transition-colors" />
        </motion.div>

        {/* Main Chart */}
        <motion.div variants={item} className="col-span-8 glass-card p-8 h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <TrendingUp className="text-sky-500 w-5 h-5" />
                Transaction Volume
              </h3>
              <p className="text-slate-500 text-sm">Settlement volume over the last 7 days.</p>
            </div>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.volumeData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#ffffff", 
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    color: "#0f172a",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVolume)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Side Panel */}
        <motion.div variants={item} className="col-span-4 glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-6 text-slate-900">Recent Activity</h3>
            <div className="space-y-6">
              {stats.recentTransactions.length > 0 ? stats.recentTransactions.map((tx: any, i: number) => (
                <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 group-hover:bg-slate-200 transition-colors">
                      {tx.employee?.name ? tx.employee.name.split(' ').map((n: string) => n[0]).join('').substring(0,2) : '??'}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">Payroll Disbursed</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 uppercase font-bold tracking-tighter">
                        {tx.status}
                        {tx.solanaSignature && (
                          <a 
                            href={`https://explorer.solana.com/tx/${tx.solanaSignature}?cluster=devnet`}
                            target="_blank"
                            className="text-sky-500 hover:text-sky-700 flex items-center gap-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            • Tx <ArrowUpRight className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-sky-600">+${tx.amountUSD}</div>
                </div>
              )) : (
                <div className="text-sm text-slate-500">No recent activity.</div>
              )}
            </div>
          </div>
          <Link href="/transactions" className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600 mt-6 text-center">
            View All Transactions
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
