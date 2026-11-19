"use client";

import { platformPulse, type PlatformPulse } from "@/features/dashboard/live-actions";
import { useLivePulse } from "@/features/dashboard/use-live-pulse";

function describe(a: PlatformPulse, b: PlatformPulse): string | null {
  if (b.proofs > a.proofs) return "Bukti bayar paket baru masuk";
  if (b.tickets > a.tickets) return "Ada laporan atau balasan baru di Bantuan";
  if (b.deletions > a.deletions) return "Pengajuan hapus akun baru";
  if (b.stores > a.stores) return "Toko baru dibuat";
  if (b.users > a.users) return "Pengguna baru mendaftar";
  if (b.paidPlans > a.paidPlans) return "Pembayaran paket dikonfirmasi";
  if (b.paidOrders > a.paidOrders) return b.paidOrders - a.paidOrders === 1 ? "1 pesanan lunas di platform" : `${b.paidOrders - a.paidOrders} pesanan lunas di platform`;
  // New unpaid orders, announcement changes, etc.: refresh quietly.
  return null;
}

/** Keeps every admin page live: Ringkasan numbers and charts, plan payments, help desk, deletions, sign-ups. */
export function PlatformLiveRefresh() {
  useLivePulse(platformPulse, describe);
  return null;
}
