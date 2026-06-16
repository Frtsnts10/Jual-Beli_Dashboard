"use client";

import React, { useState } from "react";
import { Store } from "../actions/manage-stores";
import { Store as StoreIcon, Check, Plus, ChevronsUpDown } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, DropdownSection } from "@heroui/react";
import { AddStoreModal } from "./add-store-modal";

interface StoreSwitcherProps {
  stores: Store[];
  profileId: string;
  tier?: string;
}

export function StoreSwitcher({ stores, profileId, tier }: StoreSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const currentStoreId = params?.storeId as string;

  const selectedStore = stores.find((s) => s.id === currentStoreId) || stores[0];
  const maxStores = (tier === "pro" || tier === "plus") ? Infinity : 3;
  const isLimitReached = stores.length >= maxStores;

  const handleSelect = (store: Store) => {
    setIsOpen(false);
    router.push(`/${store.id}/dashboard`);
  };

  return (
    <>
      <div className="relative font-sans">
        <Dropdown classNames={{ content: "w-56 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800" }}>
          <DropdownTrigger>
            <Button
              variant="bordered"
              radius="lg"
              className="w-56 h-[34px] justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] text-slate-800 dark:text-slate-100 font-bold"
              endContent={<ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="p-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0 flex items-center justify-center">
                  <StoreIcon className="w-3.5 h-3.5" />
                </div>
                <span className="truncate font-bold">
                  {selectedStore ? selectedStore.name : "Select Store"}
                </span>
              </div>
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Stores" disabledKeys={stores.map((s, i) => i >= maxStores ? s.id : "").filter(Boolean)}>
            <DropdownSection title="Stores" showDivider>
              {stores.map((store, i) => {
                const isLocked = i >= maxStores;
                return (
                  <DropdownItem
                    key={store.id}
                    onPress={() => !isLocked && handleSelect(store)}
                    endContent={
                      isLocked ? <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Locked</div> :
                      selectedStore?.id === store.id ? <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" /> : null
                    }
                    className={
                      isLocked ? "opacity-50 cursor-not-allowed" :
                      selectedStore?.id === store.id ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400" : ""
                    }
                  >
                    <span className="truncate">{store.name}</span>
                  </DropdownItem>
                );
              })}
            </DropdownSection>
            <DropdownSection>
              <DropdownItem
                key="new-workspace"
                onPress={() => {
                  if (!isLimitReached) setIsModalOpen(true);
                }}
                startContent={<Plus className="w-3.5 h-3.5" />}
                className={isLimitReached ? "opacity-50 text-slate-400 cursor-not-allowed" : "text-indigo-600 dark:text-indigo-400 font-bold"}
              >
                {isLimitReached ? "Store Limit Reached" : "Add Store"}
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>

      <AddStoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profileId={profileId}
      />
    </>
  );
}
