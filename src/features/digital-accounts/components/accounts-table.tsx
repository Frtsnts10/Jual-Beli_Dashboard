"use client";

import React, { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableColumn, 
  TableRow, 
  TableCell,
  Chip,
  Tooltip,
  Input
} from "@heroui/react";
import { Search, MonitorPlay, Edit, Trash2 } from "lucide-react";

export function AccountsTable({ accounts }: { accounts: any[] }) {
  const [search, setSearch] = useState("");

  const filtered = accounts.filter(acc => 
    acc.email.toLowerCase().includes(search.toLowerCase()) || 
    acc.provider.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        isClearable
        className="w-full sm:max-w-[44%]"
        placeholder="Search by email or provider..."
        startContent={<Search className="w-4 h-4 text-slate-400" />}
        value={search}
        onClear={() => setSearch("")}
        onValueChange={setSearch}
        variant="faded"
      />

      <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <Table aria-label="Digital Accounts Table" removeWrapper>
          <TableHeader>
            <TableColumn>PROVIDER</TableColumn>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>SLOTS</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn align="center">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent={"No accounts found."} items={filtered}>
            {(item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MonitorPlay className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.provider}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.email}</span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color="default" className="font-medium text-[10px] tracking-wider uppercase">
                    {item.account_type}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">
                    <span className="text-slate-800 dark:text-slate-200">{item.profiles?.length || 0}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-slate-500">{item.total_profiles}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    color={item.status === "ACTIVE" ? "success" : item.status === "FULL" ? "warning" : "danger"} 
                    className="font-bold text-[10px] tracking-wider uppercase"
                  >
                    {item.status}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Tooltip content="Edit Account">
                      <button className="text-slate-400 hover:text-indigo-500 transition-colors p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Edit className="w-4 h-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete Account" color="danger">
                      <button className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
