"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export default function AuthInitializer() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return null;
}
