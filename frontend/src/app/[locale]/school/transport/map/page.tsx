"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import RoleGuard from "@/components/school/RoleGuard";
import { resolveActiveSchoolId } from "@/components/school/activeSchool";

interface BusLocation {
  bus_id: number;
  bus_number: string;
  driver_name: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export default function BusTrackingMapPage() {
  const t = useTranslations("school");
  const [buses, setBuses] = useState<BusLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      const sid = await resolveActiveSchoolId();
      const params = sid ? `?school=${sid}` : "";
      const res = await api.get(`/schools/buses/live/${params}`);
      setBuses(res.data || []);
      setLastRefresh(new Date().toLocaleTimeString("ar"));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLocations, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLocations]);

  const centerLat = buses.length > 0 ? buses.reduce((s, b) => s + b.latitude, 0) / buses.length : 31.95;
  const centerLng = buses.length > 0 ? buses.reduce((s, b) => s + b.longitude, 0) / buses.length : 35.93;

  const timeSince = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    return `منذ ${Math.floor(mins / 60)} ساعة`;
  };

  return (
    <RoleGuard allowed={["school_admin", "school_transport_officer"]}>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              🗺️ تتبع الحافلات الحي
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              مواقع الحافلات لحظياً — آخر تحديث: {lastRefresh || "—"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              تحديث تلقائي (10 ثوانٍ)
            </label>
            <button
              onClick={fetchLocations}
              className="px-4 py-2 rounded-2xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              🔄 تحديث
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 animate-pulse text-lg font-bold">جاري تحميل الخريطة...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Area */}
            <div className="lg:col-span-2">
              <div
                className="rounded-2xl border overflow-hidden relative"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", minHeight: "500px" }}
              >
                {/* Simulated Map Background */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, #e8f4f8 0%, #d1e8f0 30%, #c8e6c9 70%, #e8f5e9 100%)`,
                  }}
                />

                {/* Map Grid Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-10">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <g key={i}>
                      <line x1={`${(i + 1) * 5}%`} y1="0" x2={`${(i + 1) * 5}%`} y2="100%" stroke="#666" strokeWidth="0.5" />
                      <line x1="0" y1={`${(i + 1) * 5}%`} x2="100%" y2={`${(i + 1) * 5}%`} stroke="#666" strokeWidth="0.5" />
                    </g>
                  ))}
                </svg>

                {/* Bus Markers */}
                {buses.map((bus) => {
                  const x = 10 + ((bus.longitude - 35.5) / 1.0) * 80;
                  const y = 10 + ((32.5 - bus.latitude) / 1.0) * 80;
                  const isSelected = selectedBus?.bus_id === bus.bus_id;
                  return (
                    <div
                      key={bus.bus_id}
                      className="absolute cursor-pointer transition-all hover:scale-125 z-10"
                      style={{
                        left: `${Math.max(5, Math.min(90, x))}%`,
                        top: `${Math.max(5, Math.min(90, y))}%`,
                        transform: `translate(-50%, -50%) rotate(${bus.heading}deg)`,
                      }}
                      onClick={() => setSelectedBus(isSelected ? null : bus)}
                    >
                      <div
                        className={`text-2xl ${isSelected ? "drop-shadow-lg scale-125" : "drop-shadow"}`}
                        style={{ filter: bus.speed > 0 ? "none" : "grayscale(0.5)" }}
                      >
                        🚌
                      </div>
                      <div
                        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: "var(--color-primary)", color: "white" }}
                      >
                        #{bus.bus_number}
                      </div>
                    </div>
                  );
                })}

                {buses.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center" style={{ color: "var(--color-text-secondary)" }}>
                      <div className="text-5xl mb-4">🗺️</div>
                      <p className="font-bold">لا توجد حافلات نشطة حالياً</p>
                      <p className="text-sm mt-1">تأكد من تشغيل التتبع من واجهة السائق</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bus List Sidebar */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold mb-3">🚌 الحافلات ({buses.length})</h2>
              {buses.length === 0 && !isLoading && (
                <div className="text-center py-8 rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
                  <p style={{ color: "var(--color-text-secondary)" }}>لا توجد بيانات مواقع</p>
                </div>
              )}
              {buses.map((bus) => (
                <div
                  key={bus.bus_id}
                  className={`rounded-2xl p-4 border cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedBus?.bus_id === bus.bus_id ? "ring-2" : ""
                  }`}
                  style={{
                    background: "var(--color-surface)",
                    borderColor: selectedBus?.bus_id === bus.bus_id ? "var(--color-primary)" : "var(--color-border)",
                  }}
                  onClick={() => setSelectedBus(selectedBus?.bus_id === bus.bus_id ? null : bus)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">🚌 #{bus.bus_number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">نشط</span>
                  </div>
                  <div className="text-xs space-y-1" style={{ color: "var(--color-text-secondary)" }}>
                    <div>السائق: {bus.driver_name}</div>
                    <div>السرعة: {Math.round(bus.speed)} كم/ساعة</div>
                    <div>آخر تحديث: {timeSince(bus.timestamp)}</div>
                    <div className="font-mono text-[10px]">
                      📍 {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
