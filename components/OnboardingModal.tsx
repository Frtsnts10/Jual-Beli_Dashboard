"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Store, Phone, Rocket } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { createShop } from "@/lib/supabase/shop_settings";
import { toast } from "sonner";

export function OnboardingModal() {
  const { shops, isLoading, refreshShops } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setIsOpen(shops.length === 0);
    }
  }, [shops, isLoading]);

  const handleStart = async () => {
    if (!name.trim() || !wa.trim()) {
      toast.error("Nama toko dan No WA wajib diisi!");
      return;
    }
    setIsSaving(true);
    try {
      await createShop({ shop_name: name, whatsapp_number: wa, currency: "IDR" });
      await refreshShops();
      setIsOpen(false);
      toast.success("Toko berhasil dibuat! Selamat datang. 🎉");
    } catch (err: any) {
      toast.error("Gagal membuat toko: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Full-screen backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* Modal container */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: "linear-gradient(135deg, #13131f 0%, #0f0f1a 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)",
            overflow: "hidden",
            animation: "modalIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "28px 28px 0",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(109,40,217,0.2))",
                border: "1px solid rgba(139,92,246,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Rocket size={20} style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" }}>
                Persiapan Toko Baru
              </h2>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, marginTop: 2 }}>
                Langkah 1 dari 1 · Konfigurasi awal
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0 0" }} />

          {/* Body */}
          <div style={{ padding: "24px 28px" }}>
            <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.6, marginBottom: 24 }}>
              Selamat datang di <strong style={{ color: "#e2e8f0" }}>Shop Dashboard!</strong> Masukkan nama toko dan
              nomor WhatsApp admin untuk memulai mengelola stok dan pelanggan Anda.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Nama Toko */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                  Nama Toko
                </label>
                <div style={{ position: "relative" }}>
                  <Store
                    size={16}
                    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="cth. My Digital Shop"
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
                    style={{
                      width: "100%",
                      height: 46,
                      paddingLeft: 42,
                      paddingRight: 16,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      color: "#f1f5f9",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                  Nomor WhatsApp Admin
                </label>
                <div style={{ position: "relative" }}>
                  <Phone
                    size={16}
                    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }}
                  />
                  <input
                    type="text"
                    value={wa}
                    onChange={(e) => setWa(e.target.value)}
                    placeholder="cth. 628123456789"
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
                    style={{
                      width: "100%",
                      height: 46,
                      paddingLeft: 42,
                      paddingRight: 16,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      color: "#f1f5f9",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "0 28px 28px" }}>
            <button
              onClick={handleStart}
              disabled={isSaving}
              style={{
                width: "100%",
                height: 50,
                background: isSaving
                  ? "rgba(139,92,246,0.4)"
                  : "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                cursor: isSaving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease",
                boxShadow: isSaving ? "none" : "0 8px 24px rgba(139,92,246,0.4)",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => {
                if (!isSaving) (e.currentTarget.style.transform = "translateY(-1px)");
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.style.transform = "translateY(0)");
              }}
            >
              {isSaving ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  Menyimpan...
                </>
              ) : (
                "🚀 Mulai Sekarang"
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>,
    document.body
  );
}
