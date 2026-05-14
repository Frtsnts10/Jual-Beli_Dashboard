"use client";

import React, { useTransition } from "react";
import { signOutAction } from "../actions/auth-actions";

export function UserButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative group">
      <button
        onClick={() => startTransition(() => signOutAction())}
        disabled={isPending}
        title="Sign out of console"
        className="flex items-center gap-2.5 h-[34px] px-3 rounded-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1322] hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-900/40 hover:text-rose-600 dark:hover:text-rose-400 transition-all text-xs font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 shadow-sm"
      >
        <span className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px]">
          Ω
        </span>
        <span>{isPending ? "Signing out..." : "Sign Out"}</span>
      </button>
    </div>
  );
}
