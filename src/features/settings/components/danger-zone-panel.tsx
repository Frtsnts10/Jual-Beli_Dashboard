"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { AlertOctagon } from "lucide-react";
import { deleteStoreAction } from "../actions/settings-actions";
import { useI18n } from "@/hooks/use-i18n";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function DangerZonePanel({ storeId }: { storeId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useI18n();

  async function handleDelete() {
    await deleteStoreAction(storeId);
  }

  return (
    <>
      <div className="p-4 sm:p-6 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/40 space-y-3 transition-colors">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-red-950 dark:text-red-400">
            {t.settings.dangerTitle}
          </h3>
        </div>
        <p className="text-xs text-red-800/80 dark:text-red-300/80 mt-0.5 mb-5 leading-relaxed max-w-2xl">
          {t.settings.dangerDesc}
        </p>
        <div>
          <Button
            type="button"
            onPress={() => setIsModalOpen(true)}
            color="danger"
            radius="lg"
            className="text-xs font-bold shadow-sm px-4 h-9"
          >
            {t.settings.btnPurge}
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Workspace Deletion"
        description="CRITICAL WARNING: This action drops the tenant partition and cascades deletion across all bounded inventory, customer vectors, and ticket rows. Confirm drop?"
        confirmText={t.settings.btnPurging}
        danger
      />
    </>
  );
}
