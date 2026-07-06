"use client";

import React, { useState } from "react";
import { DollarSign, Building2, Send, CheckCircle2, CreditCard, History, Clock, ArrowUpRight } from "lucide-react";
import { Button, Input, Select, SelectItem, Card, CardBody, Divider } from "@heroui/react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";

export default function PayoutsPage({ params }: { params: { storeId: string } }) {
  const { t } = useI18n();
  const d = t.payouts;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bank || !accountNumber || !accountName || !amount) {
      toast.error("Mohon lengkapi semua data penarikan.");
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Permintaan penarikan saldo berhasil dikirim!");
      setBank("");
      setAccountNumber("");
      setAccountName("");
      setAmount("");
    }, 1500);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {d.title}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {d.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200/60 dark:border-slate-800/60 shadow-lg bg-white/70 dark:bg-[#0d1322]/80 backdrop-blur-xl overflow-hidden group">
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-fuchsia-500/5 opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700" />
            
            <CardBody className="p-0 relative z-10">
              <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-indigo-50 dark:from-indigo-950/30 to-transparent">
                <div className="flex items-center gap-4 text-indigo-600 dark:text-indigo-400">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl shadow-inner">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                      {d.availableBalance}
                    </p>
                    <p className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                      Rp 0
                    </p>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-[#0b0f19]/50 px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-800/50">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Updated Just Now</span>
                </div>
              </div>

              <Divider className="opacity-50" />

              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Select
                    label={d.destBank}
                    labelPlacement="outside"
                    placeholder={d.placeholderBank}
                    selectedKeys={bank ? [bank] : []}
                    onChange={(e) => setBank(e.target.value)}
                    variant="faded"
                    radius="lg"
                    startContent={<Building2 className="w-4 h-4 text-slate-400" />}
                    classNames={{
                      trigger: "bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-12 shadow-sm",
                      label: "text-xs font-bold text-slate-600 dark:text-slate-400",
                    }}
                  >
                    <SelectItem key="BCA">BCA (Bank Central Asia)</SelectItem>
                    <SelectItem key="Mandiri">Bank Mandiri</SelectItem>
                    <SelectItem key="BNI">Bank Negara Indonesia (BNI)</SelectItem>
                    <SelectItem key="BRI">Bank Rakyat Indonesia (BRI)</SelectItem>
                    <SelectItem key="BSI">Bank Syariah Indonesia (BSI)</SelectItem>
                    <SelectItem key="Jago">Bank Jago</SelectItem>
                    <SelectItem key="SeaBank">SeaBank</SelectItem>
                  </Select>

                  <Input
                    label={d.accountNum}
                    labelPlacement="outside"
                    placeholder={d.placeholderNum}
                    value={accountNumber}
                    onValueChange={setAccountNumber}
                    variant="faded"
                    radius="lg"
                    type="number"
                    classNames={{
                      inputWrapper: "bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-12 shadow-sm",
                      label: "text-xs font-bold text-slate-600 dark:text-slate-400",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label={d.accountName}
                    labelPlacement="outside"
                    placeholder={d.placeholderName}
                    value={accountName}
                    onValueChange={setAccountName}
                    variant="faded"
                    radius="lg"
                    classNames={{
                      inputWrapper: "bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-12 shadow-sm",
                      label: "text-xs font-bold text-slate-600 dark:text-slate-400",
                    }}
                  />

                  <Input
                    label={d.amount}
                    labelPlacement="outside"
                    placeholder={d.placeholderAmount}
                    value={amount}
                    onValueChange={setAmount}
                    variant="faded"
                    radius="lg"
                    type="number"
                    startContent={<span className="text-slate-400 font-bold text-sm">Rp</span>}
                    classNames={{
                      inputWrapper: "bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-12 shadow-sm",
                      label: "text-xs font-bold text-slate-600 dark:text-slate-400",
                    }}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    color="primary"
                    radius="lg"
                    className="w-full font-bold shadow-xl shadow-indigo-500/20 h-12 text-sm bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                    isLoading={isSubmitting}
                    endContent={!isSubmitting && <ArrowUpRight className="w-4 h-4 ml-1" />}
                  >
                    {d.withdrawNow}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
          
          {/* History Section - Added to make it premium */}
          <div>
             <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-indigo-500" />
              Recent Withdrawals
            </h3>
            <div className="bg-white dark:bg-[#0d1322] rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden p-6 text-center">
                <p className="text-slate-400 text-sm font-medium">No withdrawal history available yet.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800/60 shadow-sm bg-slate-50/80 dark:bg-[#0b0f19]/80 backdrop-blur-md">
            <CardBody className="p-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {d.withdrawInfo}
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {d.info1}
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {d.info2}
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {d.info3}
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {d.info4}
                  </span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
