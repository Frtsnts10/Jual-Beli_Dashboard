import type { Metadata } from "next";
import { DemoSignIn } from "@/features/auth/demo-sign-in";

export const metadata: Metadata = { title: "Coba demo", robots: { index: false } };

/** jual.<root>/demo — opens the read-only showcase store without a password. Linkable from anywhere. */
export default function DemoPage() {
  return <DemoSignIn />;
}
