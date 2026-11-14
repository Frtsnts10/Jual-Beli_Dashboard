import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/access/auth";
import { listCustomers } from "@/lib/data/queries";
import { toCsv } from "@/lib/csv";

// CSV of a store's customers (one row per buyer) for the owner and its admins.
export async function GET(_req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const session = await getSessionUser();
  const store = session ? await adminDb.collection("stores").doc(storeId).get() : null;
  const allowed =
    !!session && !!store?.exists && (store.get("owner_uid") === session.uid || ((store.get("admin_uids") as string[] | undefined) ?? []).includes(session.uid));
  if (!allowed) return new NextResponse("Not found", { status: 404 });

  const { customers } = await listCustomers(storeId);
  const header = ["nama", "email", "whatsapp", "akun", "pesanan", "pesanan_lunas", "total_belanja", "pertama_beli", "terakhir_beli", "klaim_terbuka"];
  const rows = customers.map((r) => [
    r.name,
    r.email,
    r.phone,
    r.registered ? "terdaftar" : "tamu",
    r.orders,
    r.paid_orders,
    r.total,
    r.first_order_at,
    r.last_order_at,
    r.open_claims,
  ]);
  return new NextResponse(toCsv([header, ...rows]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pelanggan-${store!.get("slug")}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
