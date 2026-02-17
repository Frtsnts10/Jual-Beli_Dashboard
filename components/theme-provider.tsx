"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { HeroUIProvider } from "@heroui/system";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <HeroUIProvider>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </HeroUIProvider>
  );
}
