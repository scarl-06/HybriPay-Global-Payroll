import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PriceTicker from "@/components/PriceTicker";
import { LayoutDashboard, Users, CreditCard, ShieldCheck, Menu } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HybriPay | B2B Solana Payroll",
  description: "Next-generation hybrid payroll middleware using Solana and USDC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <div className="flex h-screen w-screen overflow-hidden relative">
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_#e2e8f0,_transparent)]">
            <div className="max-w-7xl mx-auto h-full space-y-4 lg:space-y-6">
              <div className="flex justify-start overflow-x-auto">
                <PriceTicker />
              </div>
              {children}
            </div>
          </main>

          {/* Mobile Bottom Nav */}
          <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 glass-card flex items-center justify-around px-6 z-[100] border border-white/40 shadow-2xl">
            <Link href="/" className="p-2 text-slate-600 hover:text-sky-600 transition-colors">
              <LayoutDashboard className="w-6 h-6" />
            </Link>
            <Link href="/employees" className="p-2 text-slate-600 hover:text-sky-600 transition-colors">
              <Users className="w-6 h-6" />
            </Link>
            <Link href="/payroll" className="p-2 text-slate-600 hover:text-sky-600 transition-colors">
              <CreditCard className="w-6 h-6" />
            </Link>
            <Link href="/reports" className="p-2 text-slate-600 hover:text-sky-600 transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </Link>
          </nav>
        </div>
      </body>
    </html>
  );
}
