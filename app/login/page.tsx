"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button } from "@heroui/react";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Username atau password salah.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">
            <ShieldCheck size={26} style={{ color: "#a78bfa" }} />
          </div>
          <h1 className="login-title">Shop Dashboard</h1>
          <p className="login-subtitle">Admin Panel — Masuk untuk melanjutkan</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="login-label">Username</label>
            <Input
              id="username"
              placeholder="Masukkan username"
              value={username}
              onValueChange={setUsername}
              variant="bordered"
              classNames={{ inputWrapper: "login-input-wrapper" }}
              autoComplete="username"
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="login-label">Password</label>
            <Input
              id="password"
              placeholder="Masukkan password"
              value={password}
              onValueChange={setPassword}
              type={showPassword ? "text" : "password"}
              variant="bordered"
              classNames={{ inputWrapper: "login-input-wrapper" }}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="login-btn h-11"
          >
            {!isLoading && <LogIn size={16} />}
            <span>{isLoading ? "Memverifikasi..." : "Masuk"}</span>
          </Button>
        </form>

        <p className="login-footer">
          © 2025 Shop Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
}
