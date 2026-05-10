"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Shop {
  id: string;
  shop_name: string;
  whatsapp_number: string;
  currency: string;
}

interface SettingsContextType {
  shops: Shop[];
  activeShop: Shop | null;
  isLoading: boolean;
  setActiveShopId: (id: string) => void;
  refreshShops: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeShopId, setActiveShopIdInternal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShops = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setShops(data);
      
      // Try to restore previous shop from localStorage or pick the first one
      const savedId = localStorage.getItem("activeShopId");
      if (savedId && data.find(s => s.id === savedId)) {
        setActiveShopIdInternal(savedId);
      } else if (data.length > 0) {
        setActiveShopIdInternal(data[0].id);
        localStorage.setItem("activeShopId", data[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const setActiveShopId = (id: string) => {
    setActiveShopIdInternal(id);
    localStorage.setItem("activeShopId", id);
  };

  const activeShop = shops.find(s => s.id === activeShopId) || null;

  return (
    <SettingsContext.Provider value={{ 
      shops, 
      activeShop, 
      isLoading, 
      setActiveShopId, 
      refreshShops: fetchShops 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
