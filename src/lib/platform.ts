import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireUser, getSessionUser } from "@/lib/auth";

// Platform administration (the SaaS operator, not store owners). Access is granted by
// email in PLATFORM_ADMIN_EMAILS (comma-separated) and requires a verified email, so the
// allow-list can't be satisfied by signing up with someone else's address.

function adminEmails() {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const isPlatformAdmin = cache(async () => {
  const session = await getSessionUser();
  return !!session?.email && session.email_verified === true && adminEmails().includes(session.email.toLowerCase());
});

/** 404s for everyone else, so the panel's existence isn't revealed. */
export async function requirePlatformAdmin() {
  const user = await requireUser();
  if (!(await isPlatformAdmin())) notFound();
  return user;
}
