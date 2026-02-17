"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "@/components/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark">
      <HeroUIProvider>
        <AuthProvider>{children}</AuthProvider>
      </HeroUIProvider>
    </NextThemesProvider>
  );
}
