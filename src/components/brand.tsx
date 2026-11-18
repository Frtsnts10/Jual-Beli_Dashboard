/* eslint-disable @next/next/no-img-element -- static logo, already sized */
import { cn } from "@/lib/utils";

/** The platform's name everywhere it is shown (tab titles use it too, see app/layout.tsx). */
export const BRAND = "Jual";

/** Logo + name. `suffix` adds a muted label, e.g. "Admin". */
export function Brand({ suffix, className, logoClassName }: { suffix?: string; className?: string; logoClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold whitespace-nowrap", className)}>
      <img src="/logo.png" alt="" width={44} height={32} className={cn("h-7 w-auto", logoClassName)} />
      <span>
        {BRAND}
        {suffix && <span className="text-muted-foreground font-normal"> {suffix}</span>}
      </span>
    </span>
  );
}
