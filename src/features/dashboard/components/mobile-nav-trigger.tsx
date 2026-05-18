"use client";

import React from "react";
import { Menu } from "lucide-react";

export function MobileNavTrigger() {
  const triggerToggle = () => {
    window.dispatchEvent(new Event("toggle-mobile-nav"));
  };

  return (
    <button
      onClick={triggerToggle}
      type="button"
      aria-label="Open navigation menu"
      className="md:hidden p-2 rounded-sm text-slate-500 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800/80 transition-all active:scale-95 flex items-center justify-center cursor-pointer -ml-1 mr-1"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
