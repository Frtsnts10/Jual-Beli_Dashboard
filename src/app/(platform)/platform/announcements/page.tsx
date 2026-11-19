import { listAnnouncements } from "@/lib/data/support";
import { getCatalog } from "@/lib/catalog";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AnnouncementForm,
  EndAnnouncementButton,
} from "@/features/support/announcement-form";

export const metadata = { title: "Pengumuman" };

const LEVEL: Record<string, string> = {
  info: "Info",
  warning: "Penting",
  maintenance: "Maintenance",
};

export default async function AnnouncementsPage() {
  const [list, catalog] = await Promise.all([listAnnouncements(), getCatalog()]);
  return (
    <>
      <PageHeader
        title="Pengumuman"
        description="Tampil sebagai banner di dashboard seller dan dikirim ke lonceng + push notif mereka."
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pengumuman baru</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm plans={catalog.planKeys.map((key) => ({ key, name: catalog.plans[key].name }))} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat</CardTitle>
          <CardDescription>50 terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Belum ada pengumuman.
            </p>
          ) : (
            <div className="divide-y">
              {list.map((a) => {
                const live = a.live;
                return (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 font-medium">
                        {a.title}
                        <Badge variant="outline">
                          {LEVEL[a.level] ?? a.level}
                        </Badge>
                        <Badge variant={live ? "success" : "secondary"}>
                          {live ? "Tayang" : "Selesai"}
                        </Badge>
                      </div>
                      {a.body && (
                        <p className="text-muted-foreground mt-1 whitespace-pre-line">
                          {a.body}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-1 text-xs">
                        {a.tiers
                          ? `Paket: ${a.tiers.map((t) => catalog.plans[t]?.name ?? t).join(", ")}`
                          : "Semua pengguna"}{" "}
                        · {formatDate(a.created_at, true)}
                        {a.ends_at &&
                          ` · sampai ${formatDate(a.ends_at, true)}`}
                      </p>
                    </div>
                    {live && <EndAnnouncementButton id={a.id} />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
