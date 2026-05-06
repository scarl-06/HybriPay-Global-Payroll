import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PriceTicker from "@/components/PriceTicker";

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
        <div className="flex h-screen w-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_#e2e8f0,_transparent)]">
            <div className="max-w-7xl mx-auto h-full space-y-6">
              <div className="flex justify-start">
                <PriceTicker />
              </div>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
