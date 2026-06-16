"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    router.refresh();
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  return (
    <Button 
      size="sm" 
      color="primary" 
      variant="flat" 
      onPress={handleSync} 
      isLoading={isSyncing}
      startContent={!isSyncing ? <RefreshCw size={14} /> : null}
      className="font-bold tracking-wider uppercase text-xs"
    >
      {isSyncing ? "Syncing..." : "Sync Live Data"}
    </Button>
  );
}
