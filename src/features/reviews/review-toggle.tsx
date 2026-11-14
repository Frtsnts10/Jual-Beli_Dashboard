"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setReviewHidden } from "./actions";

export function ReviewToggle({ storeId, reviewId, hidden }: { storeId: string; reviewId: string; hidden: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setReviewHidden(storeId, reviewId, !hidden);
          if (res.ok) toast.success(hidden ? "Ulasan ditampilkan lagi" : "Ulasan disembunyikan");
          else toast.error(res.error);
        })
      }
    >
      {hidden ? <Eye /> : <EyeOff />} {hidden ? "Tampilkan" : "Sembunyikan"}
    </Button>
  );
}
