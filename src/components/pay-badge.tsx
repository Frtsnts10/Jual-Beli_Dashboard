import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types/schema";

type PayFields = Pick<Order, "payment_status" | "proof_uploaded_at" | "rejected_reason">;

/** One payment-status badge (Indonesian labels) for Ringkasan, Pesanan and Pelanggan. */
export function PayBadge({ order: o }: { order: PayFields }) {
  if (o.payment_status === "PAID") return <Badge variant="success">Lunas</Badge>;
  if (o.payment_status === "PENDING")
    return <Badge variant={o.proof_uploaded_at ? "warning" : "secondary"}>{o.proof_uploaded_at ? "Menunggu konfirmasi" : "Belum bayar"}</Badge>;
  return (
    <Badge variant="destructive" title={o.rejected_reason ?? undefined}>
      {o.rejected_reason ? "Ditolak/batal" : "Gagal"}
    </Badge>
  );
}
