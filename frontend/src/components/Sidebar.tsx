"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  History, 
  Settings, 
  Activity,
  LogOut,
  ShieldCheck,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: Wallet, label: "Payroll", href: "/payroll" },
  { icon: ShieldCheck, label: "Approvals", href: "/approvals" },
  { icon: Users, label: "Employees", href: "/employees" },
  { icon: History, label: "Transactions", href: "/transactions" },
  { icon: Activity, label: "Analytics", href: "/analytics" },
  { icon: Scale, label: "Compliance", href: "/reports" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = () => {
    alert("Signed out successfully. (Demo)");
  };

  return (
    <div className="w-64 h-full glass-card rounded-none rounded-r-3xl flex flex-col p-6 fixed left-0 top-0 border-y-0 border-l-0">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-sky-500 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-sky-500/20">
          H
        </div>
        <span className="text-xl font-bold tracking-tight text-gradient">HybriPay</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              pathname === item.href 
                ? "bg-sky-50 text-blue-900 shadow-sm border border-sky-100" 
                : "text-slate-500 hover:text-blue-900 hover:bg-slate-50 border border-transparent"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              pathname === item.href ? "text-sky-500" : "group-hover:text-blue-900"
            )} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-200">
        <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 transition-colors w-full group rounded-xl hover:bg-red-50">
          <LogOut className="w-5 h-5 group-hover:text-red-500 transition-colors" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

