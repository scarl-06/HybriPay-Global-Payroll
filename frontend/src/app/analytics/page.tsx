"use client";

import { motion } from "framer-motion";
import { 
  BarChart3, 
  Globe2, 
  TrendingUp, 
  Users2,
  DollarSign,
  PieChart,
  ShieldCheck
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useSWR("/dashboard/analytics", fetcher);

  const metrics = [
    { name: "Total Volume", value: `$${stats?.totalVolume?.toLocaleString() || "0"}`, icon: DollarSign, trend: "+12.5%", color: "blue" },
    { name: "Active Employees", value: stats?.activeEmployees || "0", icon: Users2, trend: "+2", color: "sky" },
    { name: "Success Rate", value: `${stats?.successRate || "0"}%`, icon: TrendingUp, trend: "Stable", color: "emerald" },
    { name: "Treasury Health", value: `$${stats?.treasuryBalance?.toLocaleString() || "0"}`, icon: ShieldCheck, trend: "Devnet", color: "amber" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900">Platform Analytics</h1>
        <p className="text-slate-500">Global payroll performance and treasury distribution metrics.</p>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <motion.div 
            key={m.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-${m.color}-50 text-${m.color}-600`}>
                <m.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.trend}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{m.value}</div>
            <div className="text-sm text-slate-500">{m.name}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Country Distribution */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-2 mb-8">
            <Globe2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Jurisdiction Distribution</h2>
          </div>
          <div className="space-y-6">
            {stats?.countryDistribution?.length > 0 ? (
              stats.countryDistribution.map((c: any) => (
                <div key={c.country} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{c.country}</span>
                    <span className="text-slate-500">{c.count} Employees</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${(c.count / stats.activeEmployees) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <PieChart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                No distribution data yet
              </div>
            )}
          </div>
        </div>

        {/* Volume Over Time (Placeholder for real chart) */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Volume (Last 7 Days)</h2>
          </div>
          <div className="h-64 flex items-end gap-2">
            {[40, 70, 45, 90, 65, 30, 50].map((h, i) => (
              <div key={i} className="flex-1 space-y-2 group cursor-pointer">
                <div 
                  className="w-full bg-blue-500/10 group-hover:bg-blue-500/30 rounded-t-lg transition-all relative"
                  style={{ height: `${h}%` }}
                >
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      $2,450
                   </div>
                </div>
                <div className="text-[10px] text-center text-slate-400 uppercase font-bold">
                  {["M", "T", "W", "T", "F", "S", "S"][i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
