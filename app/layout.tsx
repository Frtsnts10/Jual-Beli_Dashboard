import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/sidebar";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shop Dashboard — Admin Panel",
  description: "Dashboard manajemen toko digital dengan Supabase dan Next.js",
};

import { OnboardingModal } from "@/components/OnboardingModal";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("admin_session")?.value;

  return (
    <html suppressHydrationWarning lang="id">
      <body className={inter.className}>
        <Script 
          src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js" 
          strategy="afterInteractive"
        />
        <Providers>
          {isAuthenticated ? (
            <div className="app-shell">
              <Sidebar />
              <main className="app-main">
                {children}
                <OnboardingModal />
              </main>
            </div>
          ) : (
            <>{children}</>
          )}
        </Providers>
      </body>
    </html>
  );
}
