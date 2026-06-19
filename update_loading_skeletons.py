import os

skeleton_code = """import React from "react";

export default function TableLoadingSkeleton() {
  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2 w-full max-w-sm">
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse w-full" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-lg shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-[#0b0f19]/80 border-b border-slate-200/60 dark:border-slate-800">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <th key={idx} className="px-5 py-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  {Array.from({ length: 5 }).map((_, colIdx) => (
                    <td key={colIdx} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse w-full max-w-[120px]" />
                      {colIdx === 0 && <div className="h-2.5 bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse w-2/3 mt-2" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
"""

targets = [
    "src/app/(dashboard)/[storeId]/orders/loading.tsx",
    "src/app/(dashboard)/[storeId]/inventory/loading.tsx",
    "src/app/(dashboard)/[storeId]/customers/loading.tsx",
    "src/app/(dashboard)/[storeId]/complaints/loading.tsx",
    "src/app/(dashboard)/[storeId]/approvals/loading.tsx"
]

for t in targets:
    with open(t, 'w') as f:
        f.write(skeleton_code)

print("Skeletons updated!")
