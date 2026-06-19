"use client";

import React, { useState, useMemo } from "react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableColumn, 
  TableRow, 
  TableCell,
  Chip,
  Tooltip,
  Input,
  Button,
  Pagination
} from "@heroui/react";
import { Search, MonitorPlay, Edit, Trash2, CheckCircle, Copy, Loader2, Shield } from "lucide-react";
import { deleteDigitalAccountAction } from "../actions/import-export-actions";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";

function CopyableCredential({
  value,
  label,
  isPassword,
}: {
  value: string;
  label: "Email" | "Password" | "PIN";
  isPassword?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`group inline-flex items-center gap-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-1.5 py-0.5 rounded transition-all active:scale-95 ${
        isPassword ? "text-slate-700 dark:text-slate-300 font-bold" : "text-slate-600 dark:text-slate-400 font-medium"
      }`}
      title={`Click to copy ${label}`}
    >
      <span className="truncate text-xs">{value}</span>
      {copied ? (
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in duration-150" />
      ) : (
        <Copy className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-opacity" />
      )}
    </button>
  );
}

export function AccountsTable({ accounts, storeId }: { accounts: any[]; storeId?: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return accounts.filter(acc => 
      acc.email.toLowerCase().includes(search.toLowerCase()) || 
      acc.provider.toLowerCase().includes(search.toLowerCase())
    );
  }, [accounts, search]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const confirmDelete = async () => {
    if (!deleteConfirmId || !storeId) return;
    setDeletingId(deleteConfirmId);
    const res = await deleteDigitalAccountAction(storeId, deleteConfirmId);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Account purged from digital vault");
    }
    setDeletingId(null);
    setDeleteConfirmId(null);
  };

  const bottomContent = useMemo(() => {
    return pages > 1 ? (
      <div className="flex w-full justify-between items-center px-2 py-2">
        <span className="text-xs text-slate-500">
          Showing {paginatedItems.length} of {filteredItems.length} accounts
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={(p) => setPage(p)}
        />
      </div>
    ) : null;
  }, [page, pages, filteredItems.length, paginatedItems.length]);

  return (
    <div className="space-y-4">
      <Input
        isClearable
        className="w-full sm:max-w-[44%]"
        placeholder="Search by email or provider..."
        startContent={<Search className="w-4 h-4 text-slate-400" />}
        value={search}
        onClear={() => setSearch("")}
        onValueChange={(v) => { setSearch(v); setPage(1); }}
        variant="faded"
      />

      <Table 
        aria-label="Digital Accounts Vault Table" 
        bottomContent={bottomContent}
        classNames={{
          wrapper: "border border-slate-200/60 dark:border-slate-800/80 rounded-xl shadow-sm p-0 overflow-hidden bg-white dark:bg-[#0d1322]",
          th: "bg-slate-50/80 dark:bg-[#0b0f19]/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4",
          td: "py-3.5 border-b border-slate-50 dark:border-slate-800/60",
          tr: "hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-default"
        }}
        removeWrapper
      >
        <TableHeader>
          <TableColumn>PROVIDER ASSET</TableColumn>
          <TableColumn>DELIVERY CREDENTIALS</TableColumn>
          <TableColumn>ACCOUNT TYPE</TableColumn>
          <TableColumn>SLOTS UTILIZATION</TableColumn>
          <TableColumn>STATUS MATRIX</TableColumn>
          <TableColumn align="center">CONTROLS</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No accounts found in vault."} items={paginatedItems}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <MonitorPlay className="w-4 h-4 text-indigo-500" />
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{item.provider}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Shield className="w-3 h-3" />
                    <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1.5">
                  <div className="block">
                    <CopyableCredential value={item.email} label="Email" />
                  </div>
                  {item.password && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">🔑</span>
                      <CopyableCredential value={item.password} label="Password" isPassword />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" className="font-bold text-[10px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {item.account_type || "Standard"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-black text-emerald-600">
                    {item.profiles?.length || 0}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    / {item.total_profiles} Slots
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Chip 
                  size="sm" 
                  variant="flat" 
                  color={item.status === "ACTIVE" ? "success" : item.status === "FULL" ? "warning" : "danger"} 
                  className="font-bold text-[10px] tracking-wider uppercase border-none"
                >
                  {item.status}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Tooltip content="Edit Account">
                    <Button 
                      isIconOnly 
                      variant="light" 
                      size="sm"
                      onPress={() => toast.info("Edit feature coming soon!")}
                      className="text-slate-400 hover:text-indigo-500"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Delete Account" color="danger">
                    <Button 
                      isIconOnly 
                      variant="light" 
                      size="sm"
                      isDisabled={deletingId === item.id}
                      onPress={() => setDeleteConfirmId(item.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Vault Account"
        description="Are you sure you want to permanently delete this master account? This action cannot be undone and may disrupt active profiles."
        confirmText="Purge Account"
        danger
      />
    </div>
  );
}
