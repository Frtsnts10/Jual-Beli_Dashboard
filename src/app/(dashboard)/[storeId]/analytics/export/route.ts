import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/access/auth";
import { ordersSince, parseRange } from "@/lib/data/analytics";
import { toCsv } from "@/lib/csv";

// CSV export of a store's orders for the owner and its admins. Contains buyer contact
// details (needed for bookkeeping/CRM) but never vault credentials.

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const session = await getSessionUser();
  const store = session ? await adminDb.collection("stores").doc(storeId).get() : null;
  const allowed =
    !!session && !!store?.exists && (store.get("owner_uid") === session.uid || ((store.get("admin_uids") as string[] | undefined) ?? []).includes(session.uid));
  if (!allowed) return new NextResponse("Not found", { status: 404 });

  const days = parseRange(req.nextUrl.searchParams.get("days") ?? undefined);
  const orders = await ordersSince(storeId, days);
  const header = ["order_id", "dibuat", "dibayar", "produk", "total", "fee_platform", "bersih", "pembayaran", "settlement", "pengiriman", "garansi", "email", "whatsapp", "referral", "aktif_sampai"];
  const rows = orders.map((o) => [
    o.id,
    o.created_at,
    o.paid_at ?? "",
    o.product_title,
    o.amount,
    o.platform_fee,
    o.payment_status === "PAID" ? o.amount - o.platform_fee : 0,
    o.payment_status,
    o.settlement,
    o.delivery_status,
    o.warranty_status,
    o.customer_contact.email,
    o.customer_contact.phone,
    o.referral_code ?? "",
    o.access_expires_at ?? "",
  ]);
  const csv = toCsv([header, ...rows]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pesanan-${store!.get("slug")}-${days}hari.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
