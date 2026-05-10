"use client";

import { Button } from "@heroui/react";
import { Search, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
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
          background: "rgba(139, 92, 246, 0.1)", 
          borderRadius: "16px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          margin: "0 auto 24px",
          border: "1px solid rgba(139, 92, 246, 0.2)"
        }}>
          <Search size={32} color="#8b5cf6" />
        </div>
        
        <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>
          Halaman Tidak Ditemukan
        </h2>
        
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", marginBottom: "32px" }}>
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan. Silakan kembali ke Dashboard utama.
        </p>

        <Link href="/">
          <Button
            startContent={<Home size={18} />}
            style={{ 
              width: "100%", 
              height: "48px", 
              borderRadius: "12px", 
              fontWeight: 600,
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "white"
            }}
          >
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
