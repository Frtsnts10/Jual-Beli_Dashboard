import { getCatalog, PLAN_KEYS } from "@/lib/catalog";
import { PageHeader } from "@/components/page-header";
import { PlanForm } from "@/features/platform/plan-form";

export const metadata = { title: "Paket" };

export default async function PlansPage() {
  const catalog = await getCatalog();
  return (
    <>
      <PageHeader
        title="Paket"
        description="Isi tiap paket untuk seller: harga, batas, template dan fitur. Berlaku langsung untuk semua seller di paket itu; pengecualian per seller ada di Pengguna → Fitur khusus."
      />
      <div className="grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        {PLAN_KEYS.map((k) => (
          <PlanForm key={k} tier={k} plan={catalog.plans[k]} templates={catalog.templates.map((t) => ({ id: t.id, name: t.name, enabled: t.enabled }))} />
        ))}
      </div>
    </>
  );
}
