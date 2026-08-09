"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  hint?: string;
  allLabel: string;
  selectAllLabel: string;
  deselectAllLabel: string;
  placeholder: string;
}

export default function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  hint,
  allLabel,
  selectAllLabel,
  deselectAllLabel,
  placeholder,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const allSelected = options.length > 0 && options.every((o) => selected.includes(o.value));
  const noneSelected = selected.length === 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : options.map((o) => o.value));
  };

  const selectedOptions = options.filter((o) => selected.includes(o.value));

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all flex items-center justify-between gap-2 text-left"
        style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
      >
        <span className="text-xs truncate" style={{ color: allSelected ? "var(--color-text-secondary)" : "var(--color-text)" }}>
          {allSelected ? allLabel : noneSelected ? placeholder : `${selectedOptions[0].label}${selected.length > 1 ? ` +${selected.length - 1}` : ""}`}
        </span>
        <span className="text-[10px] font-bold shrink-0" style={{ color: "var(--color-primary)" }}>
          {selected.length > 0 ? `${selected.length}` : ""}
          <span className="ms-1">{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1 w-full rounded-2xl border shadow-lg p-3 max-h-64 overflow-y-auto"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}
        >
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b" style={{ borderColor: "var(--color-border)" }}>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[11px] font-bold px-2 py-1 rounded-lg transition-all"
              style={{ background: allSelected ? "var(--color-primary-light)" : "var(--color-surface-alt)", color: "var(--color-primary)" }}
            >
              {allSelected ? deselectAllLabel : selectAllLabel}
            </button>
            {noneSelected && !allSelected && (
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{placeholder}</span>
            )}
          </div>
          <div className="space-y-1">
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all"
                  style={{ background: checked ? "var(--color-primary-light)" : "transparent" }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt.value)}
                    className="accent-[var(--color-primary)] w-4 h-4 shrink-0"
                  />
                  <span className="text-xs font-medium flex-1" style={{ color: checked ? "var(--color-primary)" : "var(--color-text)" }}>
                    {opt.label}
                  </span>
                  {checked && <span className="text-[10px] text-[var(--color-primary)]">✓</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {selectedOptions.length > 0 && !allSelected && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
            >
              {opt.label}
              <button type="button" onClick={() => toggle(opt.value)} className="hover:opacity-70" aria-label={opt.label}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {hint && <p className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>{hint}</p>}
    </div>
  );
}
