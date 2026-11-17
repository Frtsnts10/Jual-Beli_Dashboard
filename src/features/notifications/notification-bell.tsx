"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import type { NotificationItem } from "@/lib/data/notifications";
import { markNotificationsRead, registerPushToken } from "./actions";

const VAPID = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/** Asks this browser for permission and registers it for push (FCM). */
async function enablePush(): Promise<string> {
  const { isSupported, getMessaging, getToken } =
    await import("firebase/messaging");
  const { getApp } = await import("firebase/app");
  await import("@/lib/firebase/client"); // initialises the app
  if (!(await isSupported()))
    throw new Error("Browser ini tidak mendukung push notification.");
  if ((await Notification.requestPermission()) !== "granted")
    throw new Error("Izin notifikasi ditolak di browser.");
  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );
  const token = await getToken(getMessaging(getApp()), {
    vapidKey: VAPID,
    serviceWorkerRegistration: registration,
  });
  const res = await registerPushToken(token);
  if (!res.ok) throw new Error(res.error);
  return token;
}

/** Header bell: latest notifications, unread count, mark as read, and push opt-in. */
export function NotificationBell({
  items,
  unread,
}: {
  items: NotificationItem[];
  unread: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pushState, setPushState] = useState<"unsupported" | "off" | "on">(
    "unsupported",
  );

  useEffect(() => {
    if (
      !VAPID ||
      typeof Notification === "undefined" ||
      !("serviceWorker" in navigator)
    )
      return;
    // Read browser-only state once mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPushState(Notification.permission === "granted" ? "on" : "off");
    // Keep the token fresh on devices that already allowed push.
    if (Notification.permission === "granted") enablePush().catch(() => {});
  }, []);

  const open = (n: NotificationItem) =>
    start(async () => {
      if (!n.read) await markNotificationsRead([n.id]);
      router.push(n.href);
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={
            unread ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"
          }
          className="relative"
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-md bg-red-500 px-1 text-[10px] leading-5 font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)]"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifikasi
          {unread > 0 && (
            <button
              type="button"
              disabled={pending}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-normal"
              onClick={(e) => {
                e.preventDefault();
                start(async () => {
                  await markNotificationsRead();
                  router.refresh();
                });
              }}
            >
              <CheckCheck className="size-3.5" /> Tandai semua dibaca
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              Belum ada notifikasi.
            </p>
          )}
          {items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onSelect={() => open(n)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span className="flex w-full items-center gap-2">
                {!n.read && (
                  <span
                    className="size-2 shrink-0 rounded-md bg-red-500"
                    aria-label="Belum dibaca"
                  />
                )}
                <span
                  className={
                    n.read
                      ? "text-muted-foreground font-medium"
                      : "font-semibold"
                  }
                >
                  {n.title}
                </span>
              </span>
              {n.body && (
                <span className="text-muted-foreground line-clamp-2 text-xs">
                  {n.body}
                </span>
              )}
              <span className="text-muted-foreground text-[11px]">
                {formatDate(n.created_at, true)}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
        {pushState === "off" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                enablePush()
                  .then(() => {
                    setPushState("on");
                    toast.success("Push notification aktif di perangkat ini");
                  })
                  .catch((err: Error) =>
                    toast.error(
                      err.message || "Gagal mengaktifkan push notification.",
                    ),
                  );
              }}
            >
              <BellRing /> Aktifkan notifikasi di perangkat ini
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
