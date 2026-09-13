"use client";

import React, { useState, useEffect } from "react";
import { Bell, AlertTriangle, Clock, Send } from "lucide-react";
import { getNotificationsAction, NotificationItem } from "../actions/get-notifications";
import { useRouter } from "next/navigation";
import { useI18n } from "@/hooks/use-i18n";

export function NotificationBell({ storeId }: { storeId: string }) {
  const { lang, t } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getTargetHref = (type: string) => {
    if (type === "order") return `/${storeId}/orders`;
    if (type === "customer") return `/${storeId}/customers`;
    if (type === "inventory") return `/${storeId}/inventory`;
    return "#";
  };

  const handleItemClick = (type: string) => {
    setIsOpen(false);
    const href = getTargetHref(type);
    if (href !== "#") {
      router.push(href);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotificationsAction(storeId, lang);
      setItems(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [storeId, lang]);

  return (
    <div className="relative font-sans">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title={t.notifications.viewReminders}
        className="relative flex items-center justify-center w-[34px] h-[34px] rounded-lg border border-stone-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1322] hover:bg-stone-50 dark:hover:bg-slate-800/50 text-stone-600 dark:text-slate-300 transition-all shadow-sm active:scale-95"
      >
        <Bell className="w-4 h-4" />
        {items.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4 h-4 px-1 bg-rose-500 text-white font-bold text-[9px] rounded-full shadow-xs animate-pulse">
            {items.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-[360px] md:w-[420px] max-w-[90vw] bg-white dark:bg-[#0d1322] border border-stone-200/80 dark:border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 bg-stone-50 dark:bg-[#0b0f19] border-b border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-stone-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <Bell className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {t.notifications.hubTitle}
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400 shrink-0">
                {items.length} {t.notifications.pending}
              </span>
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-stone-50 dark:divide-slate-800/40 overscroll-contain">
              {loading && items.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400 italic">{t.notifications.scanning}</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 italic space-y-1">
                  <p>{t.notifications.allClean}</p>
                  <p className="text-[10px] text-stone-500">{t.notifications.zeroBounds}</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.type)}
                    className="relative p-3 transition-all hover:bg-stone-50/80 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${item.isUrgent ? "bg-rose-500" : "bg-amber-500"}`} />
                    <div className="flex items-start justify-between gap-2 pl-1">
                      <span className={`font-bold text-[11px] ${item.isUrgent ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"} flex items-center gap-1`}>
                        {item.isUrgent ? <AlertTriangle className="w-3 h-3 shrink-0" /> : <Clock className="w-3 h-3 shrink-0" />}
                        {item.title}
                      </span>
                      <span className="text-[9px] font-medium text-stone-400 bg-stone-100 dark:bg-slate-800 px-1 rounded-xs">
                        {item.targetDate}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-slate-300 mt-1 leading-relaxed pl-1">
                      {item.message}
                    </p>
                    {item.type === "customer" && (
                      <div className="mt-2 pt-1.5 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-[10px] pl-1">
                        <span className="text-stone-400 italic">{t.notifications.syncReady}</span>
                        <a
                          href={item.actionPayload?.phone ? `https://wa.me/${item.actionPayload.phone.replace(/\D/g, '')}` : "#"}
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <Send className="w-2.5 h-2.5" /> {t.notifications.manualOverride}
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-2 bg-stone-50 dark:bg-[#0b0f19] border-t border-stone-100 dark:border-slate-800 text-[9px] text-center text-stone-400">
              {t.notifications.botDisclaimer}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
