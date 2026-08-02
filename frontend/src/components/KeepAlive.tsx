"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/api";

const HEARTBEAT_INTERVAL = 10 * 60 * 1000;

export default function KeepAlive() {
  useEffect(() => {
    const ping = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetch(`${API_URL}/core/health/`, {
        method: "GET",
        cache: "no-store",
        keepalive: true,
      }).catch(() => {});
    };

    ping();
    const id = setInterval(ping, HEARTBEAT_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return null;
}
