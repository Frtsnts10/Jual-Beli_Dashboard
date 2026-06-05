"use client";

import React, { useTransition } from "react";
import { signOutAction } from "../actions/auth-actions";
import { useI18n } from "@/hooks/use-i18n";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Avatar } from "@heroui/react";

export function UserButton() {
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  return (
    <div className="relative group">
      <Dropdown placement="bottom-end" classNames={{ content: "bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800" }}>
        <DropdownTrigger>
          <Button
            variant="bordered"
            radius="sm"
            className="h-[34px] border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1322] text-slate-700 dark:text-slate-300 font-bold px-2"
          >
            <Avatar size="sm" name="Ω" className="w-5 h-5 text-[10px]" color="primary" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="User menu">
          <DropdownItem
            key="sign-out"
            color="danger"
            onPress={() => startTransition(() => signOutAction())}
            className="text-danger"
          >
            {isPending ? t.topbar.signingOut : t.topbar.signOut}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
