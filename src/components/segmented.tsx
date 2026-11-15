import { cn } from "@/lib/utils";

/**
 * One look for every tab/filter switch (orders, vault, analytics, reviews, billing): a 36px
 * muted track — the same height as buttons and inputs — that scrolls sideways on phones.
 */
export const segmented = (className?: string) =>
  cn("bg-muted inline-flex h-9 max-w-full items-center overflow-x-auto rounded-lg p-[3px]", className);

export const segment = (active: boolean) =>
  cn("inline-flex h-full shrink-0 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap", active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground");
