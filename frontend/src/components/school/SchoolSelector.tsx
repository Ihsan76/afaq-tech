"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { localeRtl } from "@/i18n/config";

interface School {
  id: number;
  name: string;
  school_code?: string;
  governorate?: string;
  directorate?: string;
  region?: string;
}

export default function SchoolSelector() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const isRtl = !!localeRtl[locale];
  const [schools, setSchools] = useState<School[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    typeof window !== "undefined" ? localStorage.getItem("active_school_id") || "" : ""
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const loadSchools = (q = "") => {
    setLoading(true);
    api
      .get(`/schools/schools/${q ? `?search=${encodeURIComponent(q)}&page_size=50` : "?page_size=50"}`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        setSchools(list);
        if (list.length === 0 && !selectedSchoolId) return;
        if (list.length > 0 && !selectedSchoolId) {
          const firstId = String(list[0].id);
          setSelectedSchoolId(firstId);
          localStorage.setItem("active_school_id", firstId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    loadSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const handleSelect = (sch: School) => {
    const val = String(sch.id);
    setSelectedSchoolId(val);
    localStorage.setItem("active_school_id", val);
    setOpen(false);
    window.location.reload();
  };

  const selectedSchool =
    schools.find((s) => String(s.id) === selectedSchoolId) || null;

  if (!user) return null;

  if (schools.length === 1 && !query && !open) {
    return (
      <div className="px-3 py-1.5 rounded-2xl bg-[var(--color-surface)] border text-xs font-bold flex items-center gap-2 shadow-sm w-full" style={{ borderColor: "var(--color-border)" }}>
        <span className="shrink-0">🏫</span>
        <span className="break-words leading-snug min-w-0">
          <span className="block">{schools[0].name}</span>
          {schools[0].governorate && (
            <span className="block text-[10px] font-normal mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {schools[0].governorate}
              {schools[0].directorate ? ` — ${schools[0].directorate}` : ""}
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 bg-[var(--color-surface)] border px-3 py-1.5 rounded-2xl shadow-sm text-xs font-bold min-w-0"
        style={{ borderColor: "var(--color-border)" }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="shrink-0">🏫</span>
        <span className="break-words leading-snug min-w-0 flex-1 text-start" style={{ color: "var(--color-text)" }}>
          {selectedSchool?.name || "…"}
          {selectedSchool?.governorate && (
            <span className="block text-[10px] font-normal mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {selectedSchool.governorate}
              {selectedSchool.directorate ? ` — ${selectedSchool.directorate}` : ""}
            </span>
          )}
        </span>
        <span className="shrink-0 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1 bg-[var(--color-surface)] border rounded-xl shadow-xl overflow-hidden w-64 ${isRtl ? "start-0" : "end-0"}`}
          style={{ borderColor: "var(--color-border)", direction: isRtl ? "rtl" : "ltr" }}
        >
          <div className="p-2 border-b" style={{ borderColor: "var(--color-border)" }}>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                loadSchools(e.target.value);
              }}
              placeholder="🔍 بحث عن مدرسة..."
              className="w-full bg-transparent text-xs px-2 py-1.5 rounded-lg border focus:outline-none"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-3 text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                جاري التحميل...
              </p>
            ) : schools.length === 0 ? (
              <p className="px-3 py-3 text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                لا توجد نتائج
              </p>
            ) : (
              schools.map((sch) => {
                const active = String(sch.id) === selectedSchoolId;
                return (
                  <button
                    key={sch.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelect(sch)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-start hover:opacity-80 transition-opacity"
                    style={{
                      background: active ? "var(--color-primary-light)" : "transparent",
                      color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                    }}
                  >
                    <span className="shrink-0">🏫</span>
                    <span className="flex-1 min-w-0 text-start">
                      <span className="block truncate font-medium">{sch.name}</span>
                      <span className="block truncate text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {[sch.governorate, sch.directorate, sch.region].filter(Boolean).join(" — ") || "—"}
                      </span>
                    </span>
                    <span className="shrink-0 text-[9px] opacity-70">{sch.school_code || ""}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
