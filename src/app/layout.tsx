import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: { template: "%s · Jual", default: "Jual — Dashboard seller" },
  description: "Jual: pusat kendali toko produk digital — produk, brankas stok, pesanan QRIS dan etalase di belidi.biz.id.",
  applicationName: "Jual",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={GeistSans.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
