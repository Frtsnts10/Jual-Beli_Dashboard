"use client";

import React, { useState, useEffect } from "react";
import { Bell, AlertTriangle, Clock, Send } from "lucide-react";
import { getNotificationsAction, NotificationItem } from "../actions/get-notifications";
import { useRouter } from "next/navigation";

export function NotificationBell({ storeId }: { storeId: string }) {
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
      const data = await getNotificationsAction(storeId);
      setItems(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [storeId]);

  return (
    <div className="relative font-sans">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title="View Expiry & Extension Reminders"
        className="relative flex items-center justify-center w-[34px] h-[34px] rounded-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1322] hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-all shadow-sm active:scale-95"
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
          <div className="absolute right-0 mt-2 w-[360px] md:w-[420px] max-w-[90vw] bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-slate-800 rounded-sm shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 bg-slate-50 dark:bg-[#0b0f19] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <Bell className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Countdown Reminders Hub
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                {items.length} Pending
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/40">
              {loading && items.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">Scanning database vectors...</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic space-y-1">
                  <p>All memory streams running cleanly.</p>
                  <p className="text-[10px] text-slate-500">Zero inventory or customer SLA bounds expiring within ≤ 3 days.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.type)}
                    className={`p-3 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer ${
                      item.isUrgent ? "border-l-2 border-rose-500" : "border-l-2 border-amber-500"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`font-bold text-[11px] ${item.isUrgent ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"} flex items-center gap-1`}>
                        {item.isUrgent ? <AlertTriangle className="w-3 h-3 shrink-0" /> : <Clock className="w-3 h-3 shrink-0" />}
                        {item.title}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded-xs">
                        {item.targetDate}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    {item.type === "customer" && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 italic">n8n Gateway Sync Ready</span>
                        <a
                          href={item.actionPayload?.phone ? `https://wa.me/${item.actionPayload.phone.replace(/\D/g, '')}` : "#"}
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <Send className="w-2.5 h-2.5" /> WhatsApp Manual Override
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-2 bg-slate-50 dark:bg-[#0b0f19] border-t border-slate-100 dark:border-slate-800 text-[9px] text-center text-slate-400">
              ⚡ Automated WhatsApp API bots map via integrated n8n Webhook workflows.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
