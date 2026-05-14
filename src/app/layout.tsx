import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Shop Dashboard | Multi-Store Central Console",
  description: "Next-generation multi-tenant premium dashboard for managing multi-store inventory, real-time complaints, and VIP customers smoothly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme') || 'system';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-50 min-h-screen selection:bg-indigo-500 selection:text-white transition-colors">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
