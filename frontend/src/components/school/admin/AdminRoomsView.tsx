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

interface PreviewItem {
  number: number;
  start: string;
  end: string;
}

function computePreview(
  startTime: string,
  periodDur: number,
  shortBreak: number,
  longBreak: number,
  longBreakAfter: number,
  count: number
): PreviewItem[] {
  const [sh, sm] = startTime.split(":").map(Number);
  const toMin = (h: number, m: number) => h * 60 + m;
  const toStr = (t: number) =>
    `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  const items: PreviewItem[] = [];
  let cursor = toMin(Number.isFinite(sh) ? sh : 0, Number.isFinite(sm) ? sm : 0);
  for (let i = 1; i <= count; i++) {
    const start = cursor;
    const end = cursor + periodDur;
    items.push({ number: i, start: toStr(start), end: toStr(end) });
    if (i === count) break;
    cursor = end + (i === longBreakAfter ? longBreak : shortBreak);
  }
  return items;
}

export default function AdminRoomsView({ rooms, periods, schoolId, refresh }: Props) {
  const t = useTranslations("school");
  const { banner, setBanner } = useBanner();

  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomCapacity, setRoomCapacity] = useState(30);
  const [roomType, setRoomType] = useState("classroom");

  const [genStart, setGenStart] = useState("08:00");
  const [genPeriodDur, setGenPeriodDur] = useState(45);
  const [genShortBreak, setGenShortBreak] = useState(10);
  const [genLongBreak, setGenLongBreak] = useState(30);
  const [genLongBreakAfter, setGenLongBreakAfter] = useState(3);
  const [genCount, setGenCount] = useState(7);

  const [busy, setBusy] = useState(false);

  const preview = computePreview(genStart, genPeriodDur, genShortBreak, genLongBreak, genLongBreakAfter, genCount);

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

  const generatePeriods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    if (!window.confirm(t("periodsGenerateConfirm"))) return;
    setBusy(true);
    try {
      await api.post("/schools/periods/generate/", {
        school_id: Number(schoolId),
        start_time: genStart,
        period_duration_min: Number(genPeriodDur) || 45,
        break_duration_min: Number(genShortBreak) || 10,
        long_break_duration_min: Number(genLongBreak) || 30,
        long_break_after_period: Number(genLongBreakAfter) || 3,
        total_periods: Number(genCount) || 7,
      });
      setBanner({ type: "success", text: t("bannerPeriodsGenerated") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerPeriodsGenerateError") });
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]";

  return (
    <div className="space-y-6">
      <Banner banner={banner} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={surfaceCls} style={surfaceStyle}>
          <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            {t("periodsGenerateHeading")}
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-secondary)" }}>
            {t("periodsGenerateSubtitle")}
          </p>
          <form onSubmit={generatePeriods} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">{t("dayStartTimeLabel")}</label>
                <input type="time" value={genStart} onChange={(e) => setGenStart(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t("dayPeriodsCountLabel")}</label>
                <input type="number" min={1} value={genCount} onChange={(e) => setGenCount(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t("periodDurationLabel")}</label>
                <input type="number" min={1} value={genPeriodDur} onChange={(e) => setGenPeriodDur(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t("shortBreakDurationLabel")}</label>
                <input type="number" min={0} value={genShortBreak} onChange={(e) => setGenShortBreak(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t("longBreakDurationLabel")}</label>
                <input type="number" min={0} value={genLongBreak} onChange={(e) => setGenLongBreak(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t("longBreakAfterPeriodLabel")}</label>
                <input type="number" min={1} value={genLongBreakAfter} onChange={(e) => setGenLongBreakAfter(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
            </div>

            <div className="p-3 rounded-2xl border bg-[var(--color-background)]">
              <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                {t("generatePreviewHeading")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {preview.map((p) => (
                  <div key={p.number} className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs border" style={{ borderColor: "var(--color-border)" }}>
                    <span className="font-bold">{t("previewPeriodLine", { number: p.number })}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{p.start} – {p.end}</span>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
              {t("generateBtn")}
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
                  <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl border" style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}>
                    {p.period_number}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}
