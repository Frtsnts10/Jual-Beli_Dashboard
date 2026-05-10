"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SettingsProvider } from "@/context/SettingsContext";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark">
      <HeroUIProvider>
        <SettingsProvider>
          {children}
          <Toaster richColors position="top-right" />
        </SettingsProvider>
      </HeroUIProvider>
    </NextThemesProvider>
  );
}
