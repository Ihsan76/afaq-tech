"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function SchoolSelector() {
  const { user } = useAuthStore();
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    typeof window !== "undefined" ? localStorage.getItem("active_school_id") || "" : ""
  );

  useEffect(() => {
    if (!user) return;
    api.get("/schools/schools/")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        setSchools(list);
        if (list.length > 0 && !selectedSchoolId) {
          const firstId = String(list[0].id);
          setSelectedSchoolId(firstId);
          localStorage.setItem("active_school_id", firstId);
        }
      })
      .catch(() => {});
  }, [user, selectedSchoolId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSchoolId(val);
    localStorage.setItem("active_school_id", val);
    window.location.reload();
  };

  if (!user || schools.length === 0) return null;

  if (schools.length === 1) {
    return (
      <div className="px-3 py-1.5 rounded-2xl bg-[var(--color-surface)] border text-xs font-bold flex items-center gap-2 shadow-sm" style={{ borderColor: "var(--color-border)" }}>
        <span>🏫</span>
        <span className="truncate">{schools[0].name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-[var(--color-surface)] border px-3 py-1.5 rounded-2xl shadow-sm" style={{ borderColor: "var(--color-border)" }}>
      <span className="text-sm">🏫</span>
      <select
        value={selectedSchoolId}
        onChange={handleChange}
        className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
        style={{ color: "var(--color-text)" }}
      >
        {schools.map((sch: any) => (
          <option key={sch.id} value={sch.id} style={{ background: "var(--color-surface)", color: "var(--color-text)" }}>
            {sch.name} ({sch.code || sch.id})
          </option>
        ))}
      </select>
    </div>
  );
}
