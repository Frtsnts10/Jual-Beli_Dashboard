"use client";

import React, { useState } from "react";
import { Order, OrderItem, updateOrderStatusAction, fulfillOrderWithSlotAction } from "../actions/order-actions";
import { 
  ShoppingCart, 
  Loader2, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Eye, 
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Select, SelectItem, Button, Pagination } from "@heroui/react";
import { useI18n } from "@/hooks/use-i18n";

interface OrdersTableProps {
  storeId: string;
  orders: Order[];
  inventoryItems?: any[];
  currency?: string;
}

export function OrdersTable({ storeId, orders, inventoryItems = [], currency = "IDR" }: OrdersTableProps) {
  const formatPrice = (amount: number) => {
    if (currency.toUpperCase() === "IDR") {
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 2 }).format(amount);
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };
  const { t } = useI18n();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({}); // orderId_itemIndex -> inventoryId
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const handleSync = () => {
    setIsSyncing(true);
    router.refresh();
    setTimeout(() => setIsSyncing(false), 600);
  };

  // Filters state
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesPayment = paymentFilter === "all" || o.payment_status === paymentFilter;
    const matchesFulfillment = fulfillmentFilter === "all" || o.fulfillment_status === fulfillmentFilter;
    
    const searchString = `${o.customer_name} ${o.customer_email} ${o.id}`.toLowerCase();
    const matchesSearch = searchTerm === "" || searchString.includes(searchTerm.toLowerCase());

    return matchesPayment && matchesFulfillment && matchesSearch;
  });

  const pages = Math.ceil(filteredOrders.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredOrders.slice(start, end);
  }, [page, filteredOrders, rowsPerPage]);

  const handleUpdateStatus = async (orderId: string, pStatus: string, fStatus: string) => {
    setUpdatingId(orderId);
    const res = await updateOrderStatusAction(storeId, orderId, pStatus, fStatus);
    setUpdatingId(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Order status updated successfully!");
    }
  };

  const handleFulfillSlot = async (
    orderId: string, 
    customerId: string | null,
    customerName: string, 
    customerEmail: string,
    item: OrderItem, 
    itemIndex: number
  ) => {
    const slotKey = `${orderId}_${itemIndex}`;
    const inventoryId = selectedSlots[slotKey];

    if (!inventoryId) {
      toast.error("Please select a digital credential slot to allocate");
      return;
    }

    setFulfillingId(slotKey);
    const res = await fulfillOrderWithSlotAction({
      storeId,
      orderId,
      customerId,
      customerName,
      customerEmail,
      productName: item.name,
      profileTier: item.variant,
      durationDays: item.duration_days,
      inventoryId
    });
    setFulfillingId(null);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(t.ordersTable.toastAllocated.replace("{item}", item.name).replace("{customer}", customerName).replace("{group}", res.allocatedGroupName || ""));
      // Clear selection
      setSelectedSlots(prev => {
        const copy = { ...prev };
        delete copy[slotKey];
        return copy;
      });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{t.ordersTable.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Proses transaksi checkout dan alokasikan akun digital secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100/40 dark:border-indigo-900/40">
            {orders.length} {t.ordersTable.totalOrders}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100/40 dark:border-amber-900/40">
            {orders.filter(o => o.fulfillment_status === "pending" || (o.fulfillment_status as string) === "unfulfilled").length} {t.ordersTable.pendingFulfillment}
          </span>
          <Button 
            size="sm" 
            className="bg-[#e2e2f6] hover:bg-[#d0d0ed] text-[#065bce] font-bold tracking-wide text-xs px-3"
            onPress={handleSync}
            isDisabled={isSyncing}
            startContent={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />}
          >
            SYNC
          </Button>
        </div>
      </div>

      {/* Interactive Sliders Filter Panel */}
      <div className="p-4 bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-extrabold uppercase">{t.ordersTable.filterTitle}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1 max-w-4xl">
          <Input
            type="text"
            placeholder={t.ordersTable.searchPlaceholder}
            value={searchTerm}
            onValueChange={(val) => { setSearchTerm(val); setPage(1); }}
            variant="faded"
            radius="lg"
            size="sm"
            className="sm:col-span-2"
            classNames={{
              inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500",
              input: "text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            }}
          />

          <Select
            aria-label="Payment Status Filter"
            selectedKeys={[paymentFilter]}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            variant="faded"
            radius="lg"
            size="sm"
            classNames={{
              trigger: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500",
              value: "text-xs font-bold text-slate-700 dark:text-slate-300"
            }}
          >
            <SelectItem key="all">{t.ordersTable.paymentAll}</SelectItem>
            <SelectItem key="pending">{t.ordersTable.paymentPending}</SelectItem>
            <SelectItem key="paid">{t.ordersTable.paymentPaid}</SelectItem>
            <SelectItem key="failed">{t.ordersTable.paymentFailed}</SelectItem>
            <SelectItem key="refunded">{t.ordersTable.paymentRefunded}</SelectItem>
          </Select>

          <Select
            aria-label="Fulfillment Status Filter"
            selectedKeys={[fulfillmentFilter]}
            onChange={(e) => { setFulfillmentFilter(e.target.value); setPage(1); }}
            variant="faded"
            radius="lg"
            size="sm"
            classNames={{
              trigger: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500",
              value: "text-xs font-bold text-slate-700 dark:text-slate-300"
            }}
          >
            <SelectItem key="all">{t.ordersTable.fulfillmentAll}</SelectItem>
            <SelectItem key="pending">{t.ordersTable.paymentPending}</SelectItem>
            <SelectItem key="fulfilled">{t.ordersTable.fulfillmentFulfilled}</SelectItem>
            <SelectItem key="cancelled">{t.ordersTable.fulfillmentCancelled}</SelectItem>
          </Select>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-lg shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-[#0b0f19]/80 border-b border-slate-200/60 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3 min-w-[160px]">{t.ordersTable.colDetails}</th>
                <th className="px-5 py-3 min-w-[160px]">{t.ordersTable.colCustomer}</th>
                <th className="px-5 py-3 min-w-[140px]">{t.ordersTable.colRevenue}</th>
                <th className="px-5 py-3 min-w-[150px]">{t.ordersTable.colStatus}</th>
                <th className="px-5 py-3 text-right min-w-[160px]">{t.ordersTable.colControl}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {items.map((o) => {
                const isUpdating = updatingId === o.id;
                const isExpanded = expandedOrderId === o.id;
                const itemsCount = o.items.length;
                const orderDate = new Date(o.created_at).toLocaleString();

                return (
                  <React.Fragment key={o.id}>
                    <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 align-middle transition-colors">
                      {/* Order Details Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            <ShoppingCart className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs tracking-tight uppercase">
                              {t.ordersTable.orderPrefix} #{o.id.startsWith("ORD-") ? o.id.slice(4, 12) : o.id.slice(0, 8)}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{orderDate}</p>
                          </div>
                        </div>
                      </td>

                      {/* Customer Toko Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{o.customer_name}</p>
                            <p className="text-[10px] text-slate-400">{o.customer_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Revenue Value Column */}
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm font-mono">
                          {formatPrice(o.total_amount)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {itemsCount} {t.ordersTable.itemsBought}
                        </p>
                      </td>

                      {/* Logistics Statuses Column */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Payment badge */}
                          <span className={`inline-flex items-center justify-center px-2 h-[22px] font-bold text-[9px] leading-none uppercase tracking-wider rounded-lg ${
                            o.payment_status === "paid"
                              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200/30"
                              : o.payment_status === "pending"
                              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200/30"
                              : "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 border border-red-200/30"
                          }`}>
                            {o.payment_status}
                          </span>

                          {/* Fulfillment badge */}
                          <span className={`inline-flex items-center justify-center px-2 h-[22px] font-bold text-[9px] leading-none uppercase tracking-wider rounded-lg ${
                            o.fulfillment_status === "fulfilled"
                              ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border border-indigo-200/30"
                              : o.fulfillment_status === "pending"
                              ? "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-200/30 animate-pulse"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/30"
                          }`}>
                            {o.fulfillment_status}
                          </span>
                        </div>
                      </td>

                      {/* Fulfillment Control Column */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onPress={() => setExpandedOrderId(isExpanded ? null : o.id)}
                            variant={isExpanded ? "flat" : "bordered"}
                            color={isExpanded ? "primary" : "default"}
                            radius="lg"
                            className="h-[32px] px-3.5 text-xs font-bold shadow-sm"
                            startContent={<Eye className="w-3.5 h-3.5" />}
                          >
                            {isExpanded ? t.ordersTable.closeDetails : t.ordersTable.checkFulfillment}
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Order Details Panel */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-slate-50/50 dark:bg-[#0b0f19]/40 border-t border-b border-slate-100 dark:border-slate-800/80">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 pb-2">
                              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                Mesin Pemenuhan Aset Pesanan
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500">{t.ordersTable.quickActionStatus}</span>
                                <Select
                                  aria-label="Change Order Status Quick Actions"
                                  placeholder={t.ordersTable.actionPlaceholder}
                                  onChange={(e) => {
                                    if (e.target.value === "") return;
                                    const [p, f] = e.target.value.split("_");
                                    handleUpdateStatus(o.id, p, f);
                                  }}
                                  isDisabled={isUpdating}
                                  variant="faded"
                                  radius="lg"
                                  className="w-[180px]"
                                  classNames={{
                                    trigger: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-[28px] min-h-0",
                                    value: "text-[10px] font-bold text-slate-700 dark:text-slate-300"
                                  }}
                                >
                                  <SelectItem key="paid_fulfilled">{t.ordersTable.markPaidFulfilled}</SelectItem>
                                  <SelectItem key="paid_pending">{t.ordersTable.markPaidPending}</SelectItem>
                                  <SelectItem key="refunded_cancelled">{t.ordersTable.cancelRefund}</SelectItem>
                                </Select>
                                {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {o.items.map((item, idx) => {
                                const slotKey = `${o.id}_${idx}`;
                                
                                // Auto-scan inventory for unassigned slots matching the item criteria
                                const matchingUnassignedSlots = inventoryItems.filter(
                                  (inv) =>
                                    !inv.profile_name &&
                                    inv.name.toLowerCase() === item.name.toLowerCase() &&
                                    inv.profile_tier === item.variant
                                );

                                const isItemFulfilled = !!item.inventory_id;
                                const linkedSlot = isItemFulfilled 
                                  ? inventoryItems.find((inv) => inv.id === item.inventory_id)
                                  : null;

                                return (
                                  <div 
                                    key={idx} 
                                    className={`p-3.5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                      isItemFulfilled 
                                        ? "bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100/60 dark:border-indigo-900/20" 
                                        : "bg-white dark:bg-[#0d1322] border-slate-200/80 dark:border-slate-800/80"
                                    }`}
                                  >
                                    {/* Item info */}
                                    <div className="flex items-start gap-2.5">
                                      <div className={`p-1.5 rounded-xs shrink-0 mt-0.5 ${isItemFulfilled ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-850 text-slate-400"}`}>
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                                            {item.name}
                                          </span>
                                          <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[8px] uppercase font-black">
                                            {item.variant}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                          <Clock className="w-2.5 h-2.5" /> Durasi Akses {item.duration_days} Hari
                                        </p>
                                      </div>
                                    </div>

                                    {/* Fulfillment Action Container */}
                                    <div className="flex-1 max-w-xl md:text-right flex flex-col md:items-end gap-1.5 md:border-l md:pl-4 border-slate-200/50 dark:border-slate-800/30">
                                      {isItemFulfilled ? (
                                        <div className="text-left w-full">
                                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>{t.ordersTable.assignedSlot}</span>
                                          </div>
                                          {linkedSlot ? (
                                            <div className="mt-1 p-2 bg-slate-100/50 dark:bg-[#0b0f19]/60 rounded-xs text-[10px] space-y-0.5 border border-slate-200/30 dark:border-slate-800/30">
                                              <p className="font-mono">
                                                <span className="text-slate-400">ID Kredensial:</span> <strong className="text-slate-700 dark:text-slate-300">{linkedSlot.email || "Tidak Ada Email"}</strong>
                                              </p>
                                              <p className="font-mono">
                                                <span className="text-slate-400">Kata Sandi:</span> <strong className="text-slate-700 dark:text-slate-300">{linkedSlot.password || "••••"}</strong>
                                              </p>
                                              {linkedSlot.pin && (
                                                <p className="font-mono">
                                                  <span className="text-slate-400">Alokasi Pin:</span> <strong className="text-slate-700 dark:text-slate-300">{linkedSlot.pin}</strong>
                                                </p>
                                              )}
                                              {linkedSlot.group_name && (
                                                <p className="text-[9px] font-bold text-indigo-500 uppercase mt-1">
                                                  Grup Gabungan: {linkedSlot.group_name}
                                                </p>
                                              )}
                                            </div>
                                          ) : (
                                            <p className="text-[10px] text-slate-400 italic mt-0.5">Data inventaris tidak tertaut atau dihapus.</p>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5 text-left">
                                          {matchingUnassignedSlots.length > 0 ? (
                                            <>
                                              <div className="flex-1 flex flex-col min-w-[200px]">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Pilih Slot Akun Digital</label>
                                                <Select
                                                  aria-label="Select Digital Warehouse Toko Slot for Fulfillment"
                                                  selectedKeys={selectedSlots[slotKey] ? [selectedSlots[slotKey]] : []}
                                                  onChange={(e) => setSelectedSlots(prev => ({ ...prev, [slotKey]: e.target.value }))}
                                                  variant="faded"
                                                  radius="lg"
                                                  classNames={{
                                                    trigger: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[32px] min-h-0",
                                                    value: "text-[11px] font-medium text-slate-800 dark:text-slate-200"
                                                  }}
                                                >
                                                  {matchingUnassignedSlots.map((slot) => (
                                                    <SelectItem key={slot.id} textValue={`${slot.email || slot.id.slice(0, 8)} ${slot.password ? `(${slot.password.slice(0, 3)}...)` : ""}`}>
                                                      {slot.email || slot.id.slice(0, 8)} {slot.password ? `(${slot.password.slice(0, 3)}...)` : ""}
                                                    </SelectItem>
                                                  ))}
                                                </Select>
                                              </div>
                                              
                                              <Button
                                                onPress={() => handleFulfillSlot(o.id, o.customer_id, o.customer_name, o.customer_email, item, idx)}
                                                isDisabled={!selectedSlots[slotKey]}
                                                isLoading={fulfillingId === slotKey}
                                                color="primary"
                                                radius="lg"
                                                className="h-[32px] px-4 text-xs font-bold shadow-sm shrink-0 self-end"
                                              >
                                                Alokasikan & Penuhi
                                              </Button>
                                            </>
                                          ) : (
                                            <div className="w-full p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-start gap-2">
                                              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                              <div className="flex-1">
                                                <p className="font-bold text-[11px] text-red-700 dark:text-red-400">Tidak Ada Slot Inventaris yang Tersedia!</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                  Harap tambahkan data kredensial untuk **{item.name} ({item.variant})** untuk melanjutkan pengiriman.
                                                </p>
                                                <Link 
                                                  href={`/${storeId}/inventory`}
                                                  className="inline-flex items-center gap-1.5 text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:underline mt-1.5"
                                                >
                                                  <Plus className="w-3 h-3" /> Isi Ulang Stok Sekarang
                                                </Link>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-400 italic">
                    Antrean pesanan kosong. Pembelian e-commerce yang selesai akan muncul di sini secara real-time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {pages > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.ordersTable.rowsPerPage}</span>
              <Select
                size="sm"
                variant="faded"
                selectedKeys={[rowsPerPage.toString()]}
                onChange={(e) => {
                  if (e.target.value) {
                    setRowsPerPage(Number(e.target.value));
                    setPage(1);
                  }
                }}
                className="w-20"
                classNames={{ 
                  trigger: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800",
                  value: "text-xs font-bold"
                }}
              >
                <SelectItem key="5">5</SelectItem>
                <SelectItem key="10">10</SelectItem>
              </Select>
            </div>
            <Pagination
              isCompact
              showControls
              showShadow
              color="primary"
              page={page}
              total={pages}
              onChange={(p) => setPage(p)}
              classNames={{
                wrapper: "gap-1",
                item: "w-8 h-8 text-xs font-bold rounded-lg",
                cursor: "bg-indigo-500 text-white rounded-lg font-bold",
                prev: "w-8 h-8 rounded-lg",
                next: "w-8 h-8 rounded-lg"
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
