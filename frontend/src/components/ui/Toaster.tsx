"use client";

import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore, ToastType, ToastMessage } from "@/store/toast";

const typeStyles: Record<ToastType, { icon: React.ReactNode; borderVar: string; bgVar: string; textVar: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "var(--color-success)" }} />,
    borderVar: "var(--color-success)",
    bgVar: "var(--color-success-light)",
    textVar: "var(--color-success)",
  },
  error: {
    icon: <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "var(--color-error)" }} />,
    borderVar: "var(--color-error)",
    bgVar: "var(--color-error-light)",
    textVar: "var(--color-error)",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "var(--color-warning)" }} />,
    borderVar: "var(--color-warning)",
    bgVar: "var(--color-warning-light)",
    textVar: "var(--color-warning)",
  },
  info: {
    icon: <Info className="w-5 h-5 shrink-0" style={{ color: "var(--color-primary)" }} />,
    borderVar: "var(--color-primary)",
    bgVar: "var(--color-primary-light)",
    textVar: "var(--color-primary)",
  },
};

export default function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 ltr:right-4 rtl:left-4"
    >
      {toasts.map((t: ToastMessage) => {
        const styleInfo = typeStyles[t.type] || typeStyles.info;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: styleInfo.borderVar,
              color: "var(--color-text)",
              boxShadow: "var(--card-shadow)",
            }}
            role="alert"
          >
            <div className="p-1 rounded-xl" style={{ backgroundColor: styleInfo.bgVar }}>
              {styleInfo.icon}
            </div>

            <div className="flex-1 min-w-0">
              {t.title && (
                <h5 className="font-bold text-xs uppercase tracking-wider mb-0.5" style={{ color: styleInfo.textVar }}>
                  {t.title}
                </h5>
              )}
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text)" }}>
                {t.message}
              </p>
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    removeToast(t.id);
                  }}
                  className="mt-2 text-xs font-bold underline hover:opacity-80 transition-opacity"
                  style={{ color: "var(--color-primary)" }}
                >
                  {t.action.label}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-lg transition-colors hover:opacity-100 opacity-60"
              style={{ color: "var(--color-text-muted)" }}
              aria-label="Close toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
