"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface Props {
  rooms: any[];
  periods: any[];
  schoolId: string | null;
  refresh: () => void;
}

const ROOM_TYPES = ["classroom", "lab", "computer_lab", "hall"];

export default function AdminRoomsView({ rooms, periods, schoolId, refresh }: Props) {
  const t = useTranslations("school");
  const { banner, setBanner } = useBanner();

  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomCapacity, setRoomCapacity] = useState(30);
  const [roomType, setRoomType] = useState("classroom");

  const [periodName, setPeriodName] = useState("");
  const [periodNumber, setPeriodNumber] = useState(1);
  const [periodStart, setPeriodStart] = useState("08:00");
  const [periodEnd, setPeriodEnd] = useState("08:45");
  const [periodBreak, setPeriodBreak] = useState(false);

  const [busy, setBusy] = useState(false);

  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !schoolId) return;
    setBusy(true);
    try {
      await api.post("/schools/rooms/", {
        school: Number(schoolId),
        name: roomName.trim(),
        code: roomCode.trim(),
        capacity: Number(roomCapacity) || 30,
        room_type: roomType,
      });
      setRoomName("");
      setRoomCode("");
      setBanner({ type: "success", text: t("bannerRoomAdded") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerRoomError") });
    } finally {
      setBusy(false);
    }
  };

  const removeRoom = async (id: number) => {
    try {
      await api.delete(`/schools/rooms/${id}/`);
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerRoomError") });
    }
  };

  const addPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodName.trim() || !schoolId) return;
    setBusy(true);
    try {
      await api.post("/schools/periods/", {
        school: Number(schoolId),
        name: periodName.trim(),
        period_number: Number(periodNumber) || 1,
        start_time: periodStart,
        end_time: periodEnd,
        is_break: periodBreak,
      });
      setPeriodName("");
      setPeriodBreak(false);
      setBanner({ type: "success", text: t("bannerPeriodAdded") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerPeriodError") });
    } finally {
      setBusy(false);
    }
  };

  const removePeriod = async (id: number) => {
    try {
      await api.delete(`/schools/periods/${id}/`);
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerPeriodError") });
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]";

  return (
    <div className="space-y-6">
      <Banner banner={banner} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={surfaceCls} style={surfaceStyle}>
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {t("roomsAddHeading")}
          </h3>
          <form onSubmit={addRoom} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">{t("roomNameLabel")}</label>
                <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} required className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t("roomCodeLabel")}</label>
                <input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">{t("capacityLabel")}</label>
                <input type="number" min={1} value={roomCapacity} onChange={(e) => setRoomCapacity(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t("roomTypeLabel")}</label>
                <SelectDropdown value={roomType} onChange={(v) => setRoomType(String(v))} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
                  {ROOM_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {t(`roomType${rt}`)}
                    </option>
                  ))}
                </SelectDropdown>
              </div>
            </div>
            <button type="submit" disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
              {t("roomsAddBtn")}
            </button>
          </form>
        </div>

        <div className={surfaceCls} style={surfaceStyle}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {t("roomsHeading")}
            </h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
              {t("roomsCount", { count: rooms.length })}
            </span>
          </div>
          {rooms.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
              {t("roomsEmpty")}
            </p>
          ) : (
            <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
              {rooms.map((r: any) => (
                <div key={r.id} className="p-4 rounded-2xl bg-[var(--color-background)] border flex justify-between items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate">{r.name}</h4>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                      {r.code ? `${r.code} • ` : ""}
                      {t("capacityLabel")} {r.capacity} • {r.room_type_display || r.room_type}
                    </p>
                  </div>
                  <button onClick={() => removeRoom(r.id)} className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 transition-all hover:opacity-90">
                    {t("reject")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={surfaceCls} style={surfaceStyle}>
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {t("periodsAddHeading")}
          </h3>
          <form onSubmit={addPeriod} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">{t("periodNameLabel")}</label>
              <input type="text" value={periodName} onChange={(e) => setPeriodName(e.target.value)} required className={inputCls} style={{ borderColor: "var(--color-border)" }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">{t("periodNumberLabel")}</label>
                <input type="number" min={1} value={periodNumber} onChange={(e) => setPeriodNumber(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t("periodStartLabel")}</label>
                <input type="time" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t("periodEndLabel")}</label>
                <input type="time" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isBreak" checked={periodBreak} onChange={(e) => setPeriodBreak(e.target.checked)} className="w-4 h-4 rounded" />
              <label htmlFor="isBreak" className="text-xs font-bold">{t("periodBreakLabel")}</label>
            </div>
            <button type="submit" disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
              {t("periodsAddBtn")}
            </button>
          </form>
        </div>

        <div className={surfaceCls} style={surfaceStyle}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {t("periodsHeading")}
            </h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
              {t("periodsCount", { count: periods.length })}
            </span>
          </div>
          {periods.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
              {t("periodsEmpty")}
            </p>
          ) : (
            <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
              {periods.map((p: any) => (
                <div key={p.id} className="p-4 rounded-2xl bg-[var(--color-background)] border flex justify-between items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate">{p.name}</h4>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                      {p.start_time} – {p.end_time}
                      {p.is_break ? ` • ${t("periodBreakBadge")}` : ""}
                    </p>
                  </div>
                  <button onClick={() => removePeriod(p.id)} className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 transition-all hover:opacity-90">
                    {t("reject")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
