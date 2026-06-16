"use client";

import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@heroui/react";

export function MobileNavTrigger() {
  const triggerToggle = () => {
    window.dispatchEvent(new Event("toggle-mobile-nav"));
  };

  return (
    <Button
      isIconOnly
      onPress={triggerToggle}
      variant="light"
      aria-label="Open navigation menu"
      className="md:hidden text-slate-500 dark:text-slate-400"
      radius="lg"
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}
