"use client";

import React, { useRef, useTransition } from "react";
import { Button } from "@heroui/react";
import { Download, Upload, FileText, Plus } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { importDigitalAccountsAction } from "../actions/import-export-actions";

export function ImportExportButtons({ storeId }: { storeId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleDownloadTemplate = () => {
    const headers = "Provider,Email,Password,Account_Type,Total_Slots,Profiles\nNetflix,netflix1@gmail.com,password123,2U,5,upin;ipin\nCanva,design@company.com,pass123,Pro,5,user1;user2";
    const blob = new Blob([headers], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "digital_accounts_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("Failed to parse CSV file");
          return;
        }

        startTransition(async () => {
          const res = await importDigitalAccountsAction(storeId, results.data);
          if (res?.error) {
            toast.error(res.error);
          } else {
            toast.success(res?.message || "Imported successfully");
          }
          if (fileInputRef.current) fileInputRef.current.value = "";
        });
      },
      error: () => {
        toast.error("Error reading the file");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      
      <Button 
        variant="flat" 
        className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 h-10 px-4"
        startContent={<FileText className="w-4 h-4" />}
        onPress={handleDownloadTemplate}
      >
        Template
      </Button>
      
      <Button 
        variant="flat" 
        className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 h-10 px-4"
        startContent={<Upload className="w-4 h-4" />}
        isLoading={isPending}
        onPress={() => fileInputRef.current?.click()}
      >
        Import CSV
      </Button>

      <Button 
        variant="flat" 
        className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 h-10 px-4"
        startContent={<Download className="w-4 h-4" />}
        onPress={() => toast.info("Export feature coming soon!")}
      >
        Export
      </Button>

      <Button 
        color="primary" 
        className="font-bold shadow-md h-10 px-4 ml-auto"
        startContent={<Plus className="w-4 h-4" />}
        onPress={() => toast.info("Add Account form coming soon!")}
      >
        Add Account
      </Button>
    </div>
  );
}
