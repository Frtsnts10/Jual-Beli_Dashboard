import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { template: "%s · Jual", default: "Jual — Kelola Toko Digital" },
  description: "Jual: pusat kendali toko produk digital — produk, brankas stok, pesanan QRIS dan etalase di belidi.biz.id.",
  applicationName: "Jual",
  // New file names (not app/icon.png) so browsers that cached the old Vercel favicon fetch the JB logo.
  icons: {
    icon: [{ url: "/brand/jual-icon.png", type: "image/png" }],
    shortcut: "/brand/jual-favicon.ico",
    apple: "/brand/jual-apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={GeistSans.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
