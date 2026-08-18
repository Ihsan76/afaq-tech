"use client";

interface Slot {
  id: number;
  section_name: string;
  subject_name: string;
  teacher_name: string;
  teacher_email: string;
}

interface Props {
  slots: Slot[];
}

export default function UnscheduledPanel({ slots }: Props) {
  if (slots.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt, #fafafa)" }}>
      <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>
        حصص غير موزعة ({slots.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="px-3 py-1.5 rounded-xl text-[11px] border bg-white/80 opacity-60 cursor-not-allowed"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span className="font-bold">{slot.subject_name}</span>
            <span className="opacity-50 mx-1">—</span>
            <span>{slot.section_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
