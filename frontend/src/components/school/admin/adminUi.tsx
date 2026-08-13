"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export const surfaceCls = "rounded-3xl p-6 shadow-xl border";
export const surfaceStyle = {
  background: "var(--color-surface)",
  borderColor: "var(--color-border)",
  boxShadow: "var(--card-shadow)",
} as const;

export function useBanner() {
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  return { banner, setBanner };
}

export function Banner({ banner }: { banner: { type: "success" | "error"; text: string } | null }) {
  if (!banner) return null;
  return (
    <div
      className={`p-4 rounded-2xl mb-6 text-sm font-bold ${banner.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}
    >
      {banner.text}
    </div>
  );
}

export async function downloadBlob(
  url: string,
  params: Record<string, string | number>,
  fallbackName: string,
): Promise<void> {
  const res = await api.get(url, { params, responseType: "blob" });
  let name = fallbackName;
  const disposition = (res.headers?.["content-disposition"] as string | undefined) || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  if (match) name = match[1];
  const blobUrl = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}
