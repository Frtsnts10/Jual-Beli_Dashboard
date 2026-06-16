"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { Package, MonitorPlay, Layers } from "lucide-react";
import { ImportExportButtons } from "@/features/digital-accounts/components/import-export-buttons";
import { AccountsTable } from "@/features/digital-accounts/components/accounts-table";

export function InventoryTabs({ 
  inventoryTableComponent, 
  digitalAccounts, 
  storeId 
}: { 
  inventoryTableComponent: React.ReactNode;
  digitalAccounts: any[];
  storeId: string;
}) {
  return (
    <div className="flex w-full flex-col">
      <Tabs 
        aria-label="Inventory Manager Tabs" 
        color="primary" 
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-indigo-500",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-indigo-500 font-semibold tracking-tight"
        }}
      >
        <Tab 
          key="products" 
          title={
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Product SKUs & Pricing</span>
            </div>
          }
        >
          <div className="pt-6 animate-in fade-in duration-300">
            {inventoryTableComponent}
          </div>
        </Tab>
        
        <Tab 
          key="vault" 
          title={
            <div className="flex items-center gap-2">
              <MonitorPlay className="w-4 h-4" />
              <span>Master Accounts Vault</span>
            </div>
          }
        >
          <div className="pt-6 animate-in fade-in duration-300 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-end">
              <ImportExportButtons storeId={storeId} />
            </div>

            {digitalAccounts && digitalAccounts.length > 0 ? (
              <div className="bg-white dark:bg-[#0b0f19] rounded-xl p-1 shadow-sm border border-slate-200/60 dark:border-slate-800/80">
                <AccountsTable accounts={digitalAccounts} />
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0b0f19] border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-8 text-center shadow-sm">
                <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Vault is Empty</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  Import your master account spreadsheets or add your first batch manually.
                </p>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
