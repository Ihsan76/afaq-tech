import { api } from "@/lib/api";

export function getActiveSchoolId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("active_school_id");
}

export async function resolveActiveSchoolId(): Promise<string | null> {
  const existing = getActiveSchoolId();
  if (existing) return existing;
  try {
    const res = await api.get("/schools/schools/?page_size=1");
    const list = Array.isArray(res.data) ? res.data : res.data.results || [];
    const first = list[0];
    if (first) {
      const id = String(first.id);
      if (typeof window !== "undefined") localStorage.setItem("active_school_id", id);
      return id;
    }
  } catch {
    // ignore
  }
  return null;
}
