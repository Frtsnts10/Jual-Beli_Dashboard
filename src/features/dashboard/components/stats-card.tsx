"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardBody } from "@heroui/react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
}

export function StatsCard({ title, value, icon, description, trend }: StatsCardProps) {
  return (
    <Card className="bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-100 dark:hover:border-slate-700 transition-all font-sans" shadow="sm" radius="lg">
      <CardBody className="p-5 flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{title}</span>
            <div className="p-2 bg-slate-50 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 rounded-lg shrink-0">
              {icon}
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">{value}</p>
        </div>
        {(description || trend) && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
            <span className="truncate">{description}</span>
            {trend && <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{trend}</span>}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
