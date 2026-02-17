"use client";

import { usePathname } from "next/navigation";
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Link,
} from "@heroui/react";
import {
  LayoutDashboard,
  Package,
  Settings,
  BarChart3,
  Search,
  LogIn,
} from "lucide-react";

import { useAuth } from "./auth-provider";

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const routes = [
    {
      href: "/",
      label: "Inventory",
      icon: Package,
      active: pathname === "/",
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: BarChart3,
      active: pathname === "/analytics",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ];

  return (
    <HeroNavbar isBordered classNames={{ wrapper: "max-w-full px-6" }}>
      <NavbarBrand className="gap-2">
        <Link className="flex items-center gap-2" color="foreground" href="/">
          <LayoutDashboard className="text-primary" />
          <p className="font-bold text-inherit">HERO CRUD</p>
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {routes.map((route) => (
          <NavbarItem key={route.href} isActive={route.active}>
            <Button
              as={Link}
              color={route.active ? "primary" : "default"}
              href={route.href}
              startContent={<route.icon size={18} />}
              variant={route.active ? "flat" : "light"}
            >
              {route.label}
            </Button>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <Input
          classNames={{
            base: "max-w-full sm:max-w-[20rem] h-10",
            mainWrapper: "h-full",
            input: "text-small",
            inputWrapper:
              "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20",
          }}
          placeholder="Search..."
          size="sm"
          startContent={<Search size={18} />}
          type="search"
        />
        {user ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="primary"
                name={user.email?.[0]?.toUpperCase()}
                size="sm"
                src={user.user_metadata?.avatar_url}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold">{user.email}</p>
              </DropdownItem>
              <DropdownItem key="settings" href="/settings">
                My Settings
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                onPress={() => signOut()}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Button
            as={Link}
            color="primary"
            href="/login"
            startContent={<LogIn size={18} />}
            variant="flat"
          >
            Login
          </Button>
        )}
      </NavbarContent>
    </HeroNavbar>
  );
}
