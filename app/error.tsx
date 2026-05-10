"use client";

import { useEffect } from "react";
import { Button } from "@heroui/react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      height: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0f",
      color: "white",
      padding: "24px"
    }}>
      <div className="glass-card" style={{ maxWidth: "500px", width: "100%", textAlign: "center", padding: "40px 32px" }}>
        <div style={{ 
          width: "64px", 
          height: "64px", 
          background: "rgba(239, 68, 68, 0.1)", 
          borderRadius: "16px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          margin: "0 auto 24px",
          border: "1px solid rgba(239, 68, 68, 0.2)"
        }}>
          <AlertTriangle size={32} color="#ef4444" />
        </div>
        
        <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>
          Ups! Terjadi Kesalahan
        </h2>
        
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
          Sesuatu yang tidak terduga menghalangi pemuatan halaman ini. Kami telah mencatat masalah ini.
        </p>

        <div style={{ 
          background: "rgba(255, 255, 255, 0.03)", 
          borderRadius: "12px", 
          padding: "16px", 
          marginBottom: "32px",
          textAlign: "left",
          border: "1px solid rgba(255, 255, 255, 0.05)"
        }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
            Detail Kesalahan:
          </p>
          <p style={{ fontSize: "13px", color: "#fca5a5", fontFamily: "monospace", wordBreak: "break-all" }}>
            {error.message || "Kesalahan sistem tidak diketahui"}
          </p>
          {error.digest && (
            <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "8px" }}>
              ID: {error.digest}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Button
            variant="flat"
            onPress={() => window.location.href = "/"}
            startContent={<Home size={18} />}
            style={{ flex: 1, height: "48px", borderRadius: "12px", fontWeight: 600 }}
          >
            Dashboard
          </Button>
          <Button
            onPress={() => reset()}
            startContent={<RefreshCcw size={18} />}
            style={{ 
              flex: 1, 
              height: "48px", 
              borderRadius: "12px", 
              fontWeight: 600,
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "white"
            }}
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    </div>
  );
}
