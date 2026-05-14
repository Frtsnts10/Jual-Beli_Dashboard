"use client";

import React, { useState } from "react";
import { Store } from "../actions/manage-stores";
import { Store as StoreIcon, Check, Plus, ChevronsUpDown } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { AddStoreModal } from "./add-store-modal";

interface StoreSwitcherProps {
  stores: Store[];
  profileId: string;
}

export function StoreSwitcher({ stores, profileId }: StoreSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const currentStoreId = params?.storeId as string;

  const selectedStore = stores.find((s) => s.id === currentStoreId) || stores[0];

  const handleSelect = (store: Store) => {
    setIsOpen(false);
    router.push(`/${store.id}/dashboard`);
  };

  return (
    <>
      <div className="relative font-sans">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-56 h-[34px] px-2.5 py-1.5 text-xs font-medium text-left bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="p-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-sm shrink-0 flex items-center justify-center">
              <StoreIcon className="w-3.5 h-3.5" />
            </div>
            <span className="truncate font-bold text-slate-800 dark:text-slate-100">
              {selectedStore ? selectedStore.name : "Select Workspace"}
            </span>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </button>

        {isOpen && (
          <div className="absolute left-0 z-50 w-56 mt-2 bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-sm shadow-xl overflow-hidden py-1 animate-in fade-in-80 slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Workspaces
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleSelect(store)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-xs text-left transition-colors ${
                    selectedStore?.id === store.id
                      ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium"
                  }`}
                >
                  <span className="truncate">{store.name}</span>
                  {selectedStore?.id === store.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>
              ))}
              {stores.length === 0 && (
                <div className="px-3 py-2 text-xs text-slate-400 italic">No workspaces mapped</div>
              )}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Store Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      <AddStoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profileId={profileId}
      />
    </>
  );
}
