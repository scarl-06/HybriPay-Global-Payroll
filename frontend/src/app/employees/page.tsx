"use client";

import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  ExternalLink,
  ShieldCheck,
  Building2
} from "lucide-react";
import { useState } from "react";

import useSWR from "swr";
import { fetcher, api } from "@/lib/api";

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", bankAccount: "", solanaWallet: "", country: "USA", webhookUrl: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: response, mutate, error, isLoading } = useSWR("/employees", fetcher);

  const displayEmployees = (response?.employees || []).filter((emp: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.solanaWallet.toLowerCase().includes(term)
    );
  });

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/employees", newEmployee);
      await mutate();
      setIsModalOpen(false);
      setNewEmployee({ name: "", email: "", bankAccount: "", solanaWallet: "", country: "USA", webhookUrl: "" });
    } catch (err: any) {
      console.error(err);
      const url = api.defaults.baseURL + "/employees";
      let msg = err.response?.data?.error || `Failed to add employee at ${url}.`;
      
      if (err.response?.data?.details) {
        const details = err.response.data.details.map((d: any) => `${d.field}: ${d.message}`).join("\n");
        msg += `\n\nDetails:\n${details}`;
      }
      
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900">Employee Directory</h1>
          <p className="text-slate-500">Manage your workforce and their settlement endpoints.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 rounded-xl bg-blue-900 text-white text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </header>

      {/* Search and Filters */}
      <div className="glass-card p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, email or wallet..." 
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => alert("Advanced filtering coming soon!")} className="px-6 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 bg-white shadow-sm">
          Filter
        </button>
      </div>

      {/* Employee List */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Solana Wallet</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Bank Account</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">Loading...</td>
              </tr>
            ) : displayEmployees.map((emp: any, i: number) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={emp.id} 
                className="hover:bg-slate-50 transition-colors group"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-sky-100 flex items-center justify-center font-bold text-xs border border-blue-200 text-blue-900">
                      {emp.name ? emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '?'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{emp.name}</div>
                      <div className="text-xs text-slate-500">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-sm font-mono text-blue-600">
                    <ShieldCheck className="w-4 h-4" />
                    {emp.solanaWallet?.substring(0, 8)}...
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 className="w-4 h-4" />
                    {emp.bankAccount}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-emerald-100 text-emerald-700 border border-emerald-200`}>
                    Active
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => alert("External explorer coming soon!")} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-900">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button onClick={() => alert("More actions coming soon!")} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-900">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Employee</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Full Name</label>
                <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                <input required type="email" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Bank Account</label>
                <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" placeholder="e.g. Chase ****1234" value={newEmployee.bankAccount} onChange={e => setNewEmployee({...newEmployee, bankAccount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Webhook Notification URL (Optional)</label>
                <input type="url" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" placeholder="https://hooks.slack.com/..." value={(newEmployee as any).webhookUrl || ""} onChange={e => setNewEmployee({...newEmployee, [ "webhookUrl" ]: e.target.value} as any)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Solana Wallet (Public Key)</label>
                <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" value={newEmployee.solanaWallet} onChange={e => setNewEmployee({...newEmployee, solanaWallet: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Country (Jurisdiction)</label>
                <select 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newEmployee.country}
                  onChange={e => setNewEmployee({...newEmployee, country: e.target.value})}
                >
                  <option value="USA">USA (25% Tax)</option>
                  <option value="Europe">Europe (30% Tax)</option>
                  <option value="Japan">Japan (20% Tax)</option>
                  <option value="India">India (10% Tax)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-xl shadow-lg hover:bg-blue-800 disabled:opacity-50">
                  {isSubmitting ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
