"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  Store,
  Package,
  ChevronDown,
  PlusCircle
} from "lucide-react";
import { Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { useSettings } from "@/context/SettingsContext";

const navItems = [
  { href: "/",          label: "Dashboard",   icon: LayoutDashboard },
  { href: "/inventory", label: "Inventori",   icon: Package },
  { href: "/customers", label: "Pelanggan",   icon: Users },
  { href: "/orders",    label: "Pesanan",     icon: ShoppingCart },
  { href: "/settings",  label: "Pengaturan",  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { shops, activeShop, setActiveShopId } = useSettings();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="sidebar">
      {/* Brand / Shop Switcher */}
      <div className="sidebar-brand" style={{ paddingBottom: 0 }}>
        <Dropdown placement="bottom-start" classNames={{ content: "bg-[#14141e] border border-white/[0.08]" }}>
          <DropdownTrigger>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 12, 
              padding: "10px 8px", 
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }} className="hover:bg-white/[0.03]">
              <div className="sidebar-logo" style={{ flexShrink: 0 }}>
                <Store size={18} style={{ color: "#a78bfa" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="sidebar-brand-name" style={{ 
                  fontSize: 13, 
                  fontWeight: 700, 
                  whiteSpace: "nowrap", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis" 
                }}>
                  {activeShop?.shop_name || "Pilih Toko"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <p className="sidebar-brand-sub" style={{ fontSize: 10 }}>Management Panel</p>
                  <ChevronDown size={10} className="text-gray-500" />
                </div>
              </div>
            </div>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Shop Selection"
            onAction={(key) => {
              if (key === "add") {
                router.push("/settings");
              } else {
                setActiveShopId(key as string);
              }
            }}
          >
            {shops.length > 0 ? (
              shops.map((shop) => (
                <DropdownItem key={shop.id} startContent={<Store size={14} className="text-purple-400" />}>
                  {shop.shop_name}
                </DropdownItem>
              ))
            ) : (
              <DropdownItem key="none" isReadOnly className="text-gray-500 italic">Belum ada toko</DropdownItem>
            )}
            <DropdownItem key="add" showDivider startContent={<PlusCircle size={14} className="text-green-400" />}>
              Tambah Toko Baru
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Menu Utama</p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? "sidebar-item-active" : ""}`}
            >
              <item.icon
                size={16}
                style={{ color: isActive ? "#a78bfa" : "var(--text-muted)", flexShrink: 0 }}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <div className="sidebar-divider" />
        <div className="sidebar-user">
          <div className="sidebar-avatar">A</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">Admin</p>
            <p className="sidebar-user-role">Super Admin</p>
          </div>
          <Tooltip content="Keluar" placement="right">
            <button onClick={handleLogout} className="sidebar-logout-btn">
              <LogOut size={14} />
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
