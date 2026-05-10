"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { Store, Phone, Rocket } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { createShop } from "@/lib/supabase/shop_settings";
import { toast } from "sonner";

export function OnboardingModal() {
  const { shops, isLoading, refreshShops } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Check if no shops exist (initial setup)
  useEffect(() => {
    if (!isLoading && shops.length === 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [shops, isLoading]);

  const handleStart = async () => {
    if (!name.trim() || !wa.trim()) {
      toast.error("Nama toko dan No WA wajib diisi!");
      return;
    }

    setIsSaving(true);
    try {
      await createShop({
        shop_name: name,
        whatsapp_number: wa,
        currency: "IDR"
      });
      await refreshShops();
      setIsOpen(false);
      toast.success("Toko berhasil dibuat! Selamat datang.");
    } catch (err: any) {
      toast.error("Gagal membuat toko: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      hideCloseButton
      isDismissable={false}
      backdrop="blur"
      placement="center"
      classNames={{
        base: "bg-[#0f0f17] border border-white/[0.08]",
        header: "border-b border-white/[0.06]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Rocket className="text-purple-500" size={20} />
            <span>Persiapan Toko Baru</span>
          </div>
        </ModalHeader>
        <ModalBody className="py-6">
          <p className="text-sm text-gray-400 mb-4">
            Selamat datang di Shop Dashboard! Silakan masukkan nama toko dan nomor WhatsApp admin untuk memulai.
          </p>
          <div className="flex flex-col gap-4">
            <Input
              label="Nama Toko"
              placeholder="cth. My Digital Shop"
              value={name}
              onValueChange={setName}
              startContent={<Store size={16} className="text-gray-500" />}
              variant="bordered"
              classNames={{ inputWrapper: "login-input-wrapper" }}
            />
            <Input
              label="Nomor WhatsApp Admin"
              placeholder="cth. 628123456789"
              value={wa}
              onValueChange={setWa}
              startContent={<Phone size={16} className="text-gray-500" />}
              variant="bordered"
              classNames={{ inputWrapper: "login-input-wrapper" }}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            isLoading={isSaving}
            onPress={handleStart}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "white",
              fontWeight: 600,
              height: 44,
              borderRadius: 10
            }}
          >
            Mulai Sekarang
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
