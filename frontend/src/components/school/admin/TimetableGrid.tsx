"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { api } from "@/lib/api";
import TimetableCell from "./TimetableCell";
import TimetableSlotCard from "./TimetableSlotCard";
import UnscheduledPanel from "./UnscheduledPanel";

interface Slot {
  id: number;
  section: number;
  section_name: string;
  day_of_week: number;
  period: number;
  period_name: string;
  subject: number;
  subject_name: string;
  teacher: number;
  teacher_name: string;
  teacher_email: string;
  room: number | null;
  room_name: string;
}

interface Period {
  id: number;
  name: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
}

interface Props {
  sections: any[];
  periods: Period[];
  rooms: any[];
  slots: Slot[];
  academicYears?: any[];
  refresh: () => void;
}

const DAY_LABELS = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function TimetableGrid({ sections, periods, rooms, slots, academicYears = [], refresh }: Props) {
  const t = useTranslations("school");
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const workingDays = [1, 2, 3, 4, 5, 6, 7];

  const getSlotAt = useCallback(
    (day: number, periodId: number) =>
      slots.find((s) => s.day_of_week === day && s.period === periodId),
    [slots]
  );

  const unscheduled = slots.filter(
    (s) => !workingDays.includes(s.day_of_week) || !periods.find((p) => p.id === s.period)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const slot = slots.find((s) => s.id === active.id);
    if (slot) setActiveSlot(slot);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSlot(null);

    if (!over || active.id === over.id) return;

    const overId = String(over.id);
    if (!overId.startsWith("cell-")) return;

    const [, targetDayStr, targetPeriodStr] = overId.split("-");
    const targetDay = parseInt(targetDayStr, 10);
    const targetPeriodId = parseInt(targetPeriodStr, 10);

    const slotId = Number(active.id);
    setMovingId(slotId);

    try {
      await api.patch(`/schools/timetable-slots/${slotId}/move/`, {
        day_of_week: targetDay,
        period_id: targetPeriodId,
      });
      refresh();
    } catch (err: any) {
      const msg = err?.response?.data?.error || t("bannerScheduleError");
      alert(msg);
    } finally {
      setMovingId(null);
    }
  };

  const activeDays = workingDays.filter((day) =>
    periods.some((p) => !p.is_break && getSlotAt(day, p.id))
  );
  const displayDays = activeDays.length > 0 ? workingDays : workingDays;
  const displayPeriods = periods.filter((p) => !p.is_break);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {unscheduled.length > 0 && (
          <UnscheduledPanel slots={unscheduled} />
        )}

        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
          <table className="w-full border-collapse text-sm min-w-[800px]">
            <thead>
              <tr className="bg-[var(--color-background)]">
                <th className="p-3 text-start font-bold border-b" style={{ borderColor: "var(--color-border)", minWidth: 100 }}>
                  {t("colPeriod")}
                </th>
                {displayDays.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-center font-bold border-b border-l"
                    style={{ borderColor: "var(--color-border)", minWidth: 140 }}
                  >
                    {DAY_LABELS[day - 1]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayPeriods.map((period) => (
                <tr key={period.id}>
                  <td className="p-2 border-b font-bold text-xs" style={{ borderColor: "var(--color-border)" }}>
                    <div>{period.name}</div>
                    <div className="text-[10px] opacity-60">{period.start_time?.slice(0, 5)} - {period.end_time?.slice(0, 5)}</div>
                  </td>
                  {displayDays.map((day) => {
                    const slot = getSlotAt(day, period.id);
                    const cellId = `cell-${day}-${period.id}`;
                    return (
                      <TimetableCell
                        key={cellId}
                        id={cellId}
                        day={day}
                        period={period}
                        slot={slot}
                        isMoving={slot ? movingId === slot.id : false}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DragOverlay>
        {activeSlot ? <TimetableSlotCard slot={activeSlot} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
