"use client";

import { useDroppable } from "@dnd-kit/core";
import TimetableSlotCard from "./TimetableSlotCard";

interface Slot {
  id: number;
  section_name: string;
  subject_name: string;
  teacher_name: string;
  teacher_email: string;
  room_name: string;
  day_of_week: number;
  period: number;
}

interface Period {
  id: number;
  name: string;
  is_break: boolean;
}

interface Props {
  id: string;
  day: number;
  period: Period;
  slot?: Slot;
  isMoving: boolean;
}

export default function TimetableCell({ id, day, period, slot, isMoving }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const bg = period.is_break
    ? "var(--color-surface-alt, #f3f4f6)"
    : isOver
    ? "var(--color-primary)/10"
    : "transparent";

  return (
    <td
      ref={setNodeRef}
      className={`p-1.5 border-b border-l text-center align-top min-h-[60px] transition-colors ${isMoving ? "opacity-40" : ""}`}
      style={{
        borderColor: "var(--color-border)",
        background: bg,
        minHeight: 60,
      }}
    >
      {period.is_break ? (
        <span className="text-[10px] opacity-40 block py-2">استراحة</span>
      ) : slot ? (
        <TimetableSlotCard slot={slot} />
      ) : (
        <span className="text-[10px] opacity-30 block py-4">فارغ</span>
      )}
    </td>
  );
}
