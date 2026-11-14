import { Lock, Megaphone, Timer, Users } from "lucide-react";
import { requireStore } from "@/lib/auth";
import { TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Marketing" };

const FEATURES = [
  { icon: Megaphone, title: "WhatsApp Broadcast CRM", text: "Kirim promo upsell/cross-sell ke pelanggan lama." },
  { icon: Timer, title: "Flash Sale & Bundling", text: "Timer flash sale dan paket bundling produk." },
  { icon: Users, title: "Affiliate / Referral", text: "Link ?ref= untuk reseller, tercatat di tiap pesanan." },
];

export default async function MarketingPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { user } = await requireStore(storeId);
  const unlocked = TIERS[user.subscription_tier].marketing;

  return (
    <>
      <PageHeader title="Marketing" description="Growth engine untuk paket Ultimate." />
      {!unlocked && (
        <p className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
          <Lock className="size-4" /> Fitur ini terbuka di paket Ultimate.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <Card key={title} className={unlocked ? "" : "opacity-60"}>
            <CardHeader>
              <Icon className="text-muted-foreground size-5" />
              <CardTitle className="flex items-center gap-2">
                {title} <Badge variant="secondary">Segera</Badge>
              </CardTitle>
              <CardDescription>{text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </>
  );
}
