"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function NavbarWrapper() {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const pathWithoutLocale = "/" + segments.slice(2).join("/");

  if (AUTH_ROUTES.some((route) => pathWithoutLocale.startsWith(route))) {
    return null;
  }

  return <Navbar />;
}
