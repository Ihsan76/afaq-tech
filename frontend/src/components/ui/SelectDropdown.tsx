"use client";

import React, { useState, useRef, useEffect, useCallback, ReactNode, isValidElement, CSSProperties, KeyboardEvent } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string | number;
  label: ReactNode;
  disabled?: boolean;
}

interface SelectDropdownProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options?: SelectOption[];
  children?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  style?: CSSProperties;
  size?: "md" | "sm";
  triggerStyle?: CSSProperties;
  required?: boolean;
  title?: string;
  id?: string;
  name?: string;
  ariaLabel?: string;
}

export default function SelectDropdown({
  value,
  onChange,
  options: propOptions,
  children,
  placeholder,
  disabled = false,
  searchable = false,
  searchPlaceholder = "بحث...",
  className = "",
  style,
  size = "md",
  triggerStyle,
  required = false,
  title,
  id,
  name,
  ariaLabel,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number; width: number; maxHeight: number } | null>(null);
  const [isSheet, setIsSheet] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Extract options from children if propOptions is not provided
  const options: SelectOption[] = propOptions || React.Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const el = child as React.ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>;
      return {
        value: el.props.value ?? "",
        label: el.props.children,
        disabled: el.props.disabled,
      };
    });

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder || "";

  const optionsRef = useRef<SelectOption[]>(options);
  const valueRef = useRef<string | number>(value);
  useEffect(() => {
    optionsRef.current = options;
    valueRef.current = value;
  });

  // Compute position for portal
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    setIsSheet(isMobile);

    if (isMobile) {
      setCoords(null);
      return;
    }

    const isRtl = document.documentElement.dir === "rtl" || getComputedStyle(document.documentElement).direction === "rtl";
    const spaceBelow = window.innerHeight - rect.bottom;
    const maxH = Math.min(280, spaceBelow - 20);
    const width = Math.max(rect.width, 180);

    let left: number | undefined;
    let right: number | undefined;

    if (isRtl) {
      right = window.innerWidth - rect.right;
      if (right + width > window.innerWidth - 8) {
        right = 8;
      }
    } else {
      left = rect.left;
      if (left + width > window.innerWidth - 8) {
        left = window.innerWidth - width - 8;
      }
      if (left < 8) left = 8;
    }

    const top = spaceBelow < 250 && rect.top > spaceBelow ? rect.top - Math.min(280, rect.top - 20) - 4 : rect.bottom + 6;

    setCoords({
      top,
      left,
      right,
      width,
      maxHeight: Math.max(150, maxH),
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = containerRef.current?.contains(target);
      const insidePanel = listRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) {
        setOpen(false);
      }
    };
    const handleScrollOrResize = (e: Event) => {
      if (e.type === "scroll" && e.target && listRef.current?.contains(e.target as Node)) {
        return;
      }
      setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", handleScrollOrResize);
      window.addEventListener("scroll", handleScrollOrResize, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      updatePosition();
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      const idx = optionsRef.current.findIndex((opt) => String(opt.value) === String(valueRef.current));
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setSearchQuery("");
    }
  }, [open, searchable, updatePosition]);

  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) => {
        const text = typeof opt.label === "string" ? opt.label : String(opt.value);
        return text.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : options;

  const handleSelect = (optVal: string | number, optDisabled?: boolean) => {
    if (optDisabled) return;
    onChange(optVal);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
      e.preventDefault();
      const opt = filteredOptions[highlightedIndex];
      if (!opt.disabled) {
        handleSelect(opt.value, opt.disabled);
      }
    }
  };

  const hasWidth = /\bw-\S+/.test(className);
  const sizeClasses = size === "sm" ? "px-2 py-1 text-xs rounded-lg" : "px-4 py-2.5 text-sm rounded-2xl";

  return (
    <div ref={containerRef} className={`relative inline-block ${hasWidth ? "" : "w-full"} ${className}`} style={style}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={title}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full border flex items-center justify-between gap-2 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${
          required && !value ? "border-rose-400" : ""
        }`}
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
          borderColor: required && !value ? "var(--color-error)" : "var(--color-border)",
          ...triggerStyle,
        }}
      >
        <span className={`truncate ${!selectedOption && placeholder ? "opacity-60" : ""}`} style={{ color: !selectedOption && placeholder ? "var(--color-text-muted)" : "inherit" }}>
          {displayLabel}
        </span>
        {required && !value && <span className="text-rose-500 font-bold shrink-0">*</span>}
        <span
          className={`shrink-0 transition-transform duration-200 text-xs font-bold ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--color-primary)" }}
        >
          ▼
        </span>
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            ref={listRef}
            className={`fixed z-50 rounded-2xl border shadow-xl overflow-hidden flex flex-col ${
              isSheet
                ? "inset-x-0 bottom-0 max-h-[70dvh] rounded-b-none"
                : "animate-in fade-in-50 zoom-in-95 duration-150"
            }`}
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--card-shadow)",
              ...(isSheet
                ? {}
                : coords
                ? {
                    top: `${coords.top}px`,
                    ...(coords.left !== undefined ? { left: `${coords.left}px` } : {}),
                    ...(coords.right !== undefined ? { right: `${coords.right}px` } : {}),
                    width: `${coords.width}px`,
                    maxHeight: `${coords.maxHeight}px`,
                  }
                : { display: "none" }),
            }}
            role="listbox"
          >
            {searchable && (
              <div className="p-2 border-b shrink-0" style={{ borderColor: "var(--color-border)" }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    color: "var(--color-text)",
                    borderColor: "var(--color-border)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="overflow-y-auto p-1.5 space-y-0.5 flex-1">
              {placeholder && !searchQuery && (
                <div
                  role="option"
                  aria-selected={!value}
                  onClick={() => handleSelect("", false)}
                  className="px-3 py-2 rounded-xl text-xs cursor-pointer transition-all opacity-60 hover:opacity-100"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {placeholder}
                </div>
              )}
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                  لا توجد نتائج
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <div
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => !opt.disabled && handleSelect(opt.value, opt.disabled)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-between ${
                        opt.disabled ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? "var(--color-primary-light)"
                          : isHighlighted
                          ? "var(--color-surface-alt)"
                          : "transparent",
                        color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                        fontWeight: isSelected ? "bold" : "normal",
                      }}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <span className="text-[11px]">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
