import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
}

export function StatsCard({ title, value, icon: Icon, description, trend }: StatsCardProps) {
  return (
    <div className="p-5 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-indigo-100 dark:hover:border-slate-700 transition-all font-sans">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</span>
          <div className="p-2 bg-slate-50 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 rounded-sm">
            <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <p className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
      </div>
      {(description || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{description}</span>
          {trend && <span className="font-bold text-emerald-600 dark:text-emerald-400">{trend}</span>}
        </div>
      )}
    </div>
  );
}
