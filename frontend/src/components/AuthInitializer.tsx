"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export default function AuthInitializer() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
    loadUser();
  }, [hydrate, loadUser]);

  return null;
}
