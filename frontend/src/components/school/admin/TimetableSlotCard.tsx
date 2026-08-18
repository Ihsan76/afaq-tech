"use client";

import { useDraggable } from "@dnd-kit/core";

interface Slot {
  id: number;
  section_name: string;
  subject_name: string;
  teacher_name: string;
  teacher_email: string;
  room_name: string;
}

interface Props {
  slot: Slot;
  isDragOverlay?: boolean;
}

export default function TimetableSlotCard({ slot, isDragOverlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: slot.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`
        rounded-xl px-2 py-1.5 text-[11px] leading-tight cursor-grab select-none
        border transition-all
        ${isDragging || isDragOverlay ? "opacity-80 shadow-lg scale-105 z-50" : "hover:shadow-md"}
      `}
      title={`${slot.section_name} — ${slot.subject_name}`}
    >
      <div className="font-bold text-[var(--color-primary)] truncate">{slot.subject_name}</div>
      <div className="opacity-70 truncate">{slot.section_name}</div>
      <div className="opacity-50 text-[9px] truncate">{slot.teacher_name || slot.teacher_email}</div>
      {slot.room_name && (
        <div className="opacity-40 text-[9px] truncate">{slot.room_name}</div>
      )}
    </div>
  );
}
