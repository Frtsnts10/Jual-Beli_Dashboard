import { getCatalog } from "@/lib/catalog";
import { PageHeader } from "@/components/page-header";
import { PlanForm } from "@/features/platform/plan-form";
import { AddPlanButton } from "@/features/platform/add-plan-button";

export const metadata = { title: "Paket" };

export default async function PlansPage() {
  const catalog = await getCatalog();
  const templates = catalog.templates.map((t) => ({ id: t.id, name: t.name, enabled: t.enabled }));
  return (
    <>
      <PageHeader
        title="Paket"
        description="Isi tiap paket untuk seller: harga, batas, template dan fitur. Berlaku langsung untuk semua seller di paket itu; pengecualian per seller ada di Pengguna → Fitur khusus."
      >
        <AddPlanButton />
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        {catalog.planKeys.map((k) => (
          <PlanForm key={k} tier={k} plan={catalog.plans[k]} custom={catalog.customPlans.includes(k)} templates={templates} />
        ))}
      </div>
    </>
  );
}
