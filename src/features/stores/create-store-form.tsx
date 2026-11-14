"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStore } from "./actions";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function CreateStoreForm({ rootDomain }: { rootDomain?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await createStore({ store_name: name, slug });
          if (!res.ok) return setError(res.error);
          router.push(`/${res.data!.storeId}/settings`);
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="store_name">Nama toko</Label>
        <Input
          id="store_name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slug">Alamat toko</Label>
        <div className="flex items-center gap-2">
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            required
          />
          {rootDomain && <span className="text-muted-foreground shrink-0 text-sm">.{rootDomain}</span>}
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Membuat…" : "Buat toko"}
      </Button>
    </form>
  );
}
