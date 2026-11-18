import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Brand className="text-xl" logoClassName="h-10" />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
