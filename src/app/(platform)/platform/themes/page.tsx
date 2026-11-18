import { adminDb } from "@/lib/firebase/admin";
import { getCatalog, PLAN_KEYS } from "@/lib/catalog";
import { PageHeader } from "@/components/page-header";
import { TemplateForm } from "@/features/platform/template-form";

export const metadata = { title: "Tema" };

export default async function ThemesPage() {
  const [catalog, stores] = await Promise.all([getCatalog(), adminDb.collection("stores").select("storefront_config.layout_template").get()]);
  const used = new Map<string, number>();
  for (const s of stores.docs) {
    const t = s.get("storefront_config.layout_template") as string;
    used.set(t, (used.get(t) ?? 0) + 1);
  }
  return (
    <>
      <PageHeader title="Tema" description="Template etalase yang disediakan untuk seller: aktif/nonaktif, nama, dan gayanya. Template mana yang masuk tiap paket diatur di menu Paket." />
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        {catalog.templates.map((t) => (
          <TemplateForm
            key={t.id}
            template={t}
            plansUsing={PLAN_KEYS.filter((k) => catalog.plans[k].templates.includes(t.id)).map((k) => catalog.plans[k].name)}
            storesUsing={used.get(t.id) ?? 0}
          />
        ))}
      </div>
    </>
  );
}
