import { adminDb } from "@/lib/firebase/admin";
import { getCatalog, PLAN_KEYS } from "@/lib/catalog";
import { aiConfigured } from "@/lib/ai/theme";
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateForm } from "@/features/platform/template-form";
import { AiSettingsCard } from "@/features/platform/ai-settings-card";

export const metadata = { title: "Tema" };

export default async function ThemesPage() {
  const [catalog, stores] = await Promise.all([
    getCatalog(),
    adminDb.collection("stores").select("storefront_config.layout_template", "ai_theme_usage").get(),
  ]);
  const used = new Map<string, number>();
  const month = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }).slice(0, 7);
  let aiUsed = 0;
  for (const s of stores.docs) {
    const t = s.get("storefront_config.layout_template") as string;
    used.set(t, (used.get(t) ?? 0) + 1);
    const u = s.get("ai_theme_usage") as { month?: string; count?: number } | undefined;
    if (u?.month === month) aiUsed += u.count ?? 0;
  }
  return (
    <>
      <PageHeader title="Tema" description="Template etalase untuk seller dan Tema AI. Template mana yang masuk tiap paket diatur di menu Paket." />
      <div className="grid gap-6">
        <AiSettingsCard
          initial={catalog.ai}
          configured={aiConfigured()}
          plansWithAi={PLAN_KEYS.filter((k) => catalog.plans[k].aiTheme).map((k) => catalog.plans[k].name)}
          usedThisMonth={aiUsed}
        />
        <Card className="gap-0 pb-0">
          <CardHeader className="pb-4">
            <CardTitle>Template etalase</CardTitle>
            <CardDescription>Nyalakan/matikan langsung dari daftar; klik Ubah untuk nama, deskripsi dan gaya.</CardDescription>
          </CardHeader>
          <div className="divide-y border-t">
            {catalog.templates.map((t) => (
              <TemplateForm
                key={t.id}
                template={t}
                plansUsing={PLAN_KEYS.filter((k) => catalog.plans[k].templates.includes(t.id)).map((k) => catalog.plans[k].name)}
                storesUsing={used.get(t.id) ?? 0}
              />
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
