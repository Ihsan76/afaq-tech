"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import RoleGuard from "@/components/school/RoleGuard";

interface Bus {
  id: number;
  bus_number: string;
  driver_name: string;
  capacity: number;
}

interface Student {
  id: number;
  name: string;
  name_ar?: string;
  email: string;
}

const btnPrimary =
  "w-full py-4 rounded-2xl text-lg font-bold transition-all active:scale-95 disabled:opacity-50";

export default function DriverPage() {
  const t = useTranslations("school");
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [lastSent, setLastSent] = useState<string>("");
  const [scanResult, setScanResult] = useState("");
  const [studentsOnBoard, setStudentsOnBoard] = useState<number[]>([]);
  const [deviceIdentifier, setDeviceIdentifier] = useState("");
  const geoWatchRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api
      .get("/schools/buses/")
      .then((res) => setBuses(res.data.results || res.data || []))
      .catch(() => {});
  }, []);

  const sendLocation = useCallback(
    (lat: number, lng: number, spd: number) => {
      if (!deviceIdentifier) return;
      api
        .post("/schools/telemetry/", {
          device_identifier: deviceIdentifier,
          bus_number: selectedBus?.bus_number,
          latitude: lat,
          longitude: lng,
          speed: spd,
          heading: 0,
          timestamp: new Date().toISOString(),
        })
        .then(() => {
          setLastSent(new Date().toLocaleTimeString("ar"));
        })
        .catch(() => {});
    },
    [deviceIdentifier, selectedBus]
  );

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setIsTracking(true);

    // Send immediately
    navigator.geolocation.getCurrentPosition((pos) => {
      sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.speed || 0);
      setSpeed(Math.round((pos.coords.speed || 0) * 3.6));
    });

    // Watch position
    geoWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setSpeed(Math.round((pos.coords.speed || 0) * 3.6));
      },
      () => {},
      { enableHighAccuracy: true }
    );

    // Send every 10 seconds
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.speed || 0);
      });
    }, 10000);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (geoWatchRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchRef.current);
      geoWatchRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (geoWatchRef.current !== null) navigator.geolocation.clearWatch(geoWatchRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleScanTap = (direction: "board" | "exit") => {
    if (!deviceIdentifier) {
      alert("أدخل معرف الجهاز أولاً");
      return;
    }
    // In real usage this would be triggered by RFID reader
    const studentId = prompt(direction === "board" ? "رقم الطالب (صعود):" : "رقم الطالب (نزول):");
    if (!studentId) return;

    api
      .post("/schools/scan/", {
        device_identifier: deviceIdentifier,
        student_id: Number(studentId),
        event_type: "rfid_tap",
        direction,
        timestamp: new Date().toISOString(),
      })
      .then(() => {
        setScanResult(direction === "board" ? `✅ تم تسجيل صعود الطالب #${studentId}` : `🔽 تم تسجيل نزول الطالب #${studentId}`);
        setTimeout(() => setScanResult(""), 3000);
      })
      .catch(() => {
        setScanResult("❌ فشل التسجيل");
        setTimeout(() => setScanResult(""), 3000);
      });
  };

  // Step 1: Choose bus
  if (!selectedBus) {
    return (
      <RoleGuard allowed={["school_transport_officer", "school_admin"]}>
        <div className="min-h-screen py-10 px-4 max-w-lg mx-auto" style={{ color: "var(--color-text)" }}>
          <h1 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: "var(--font-heading)" }}>
            🚌 واجهة السائق / مشرف النقل
          </h1>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">معرف الجهاز (IMEI / MAC)</label>
            <input
              className="w-full px-4 py-3 rounded-2xl border text-sm"
              style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
              value={deviceIdentifier}
              onChange={(e) => setDeviceIdentifier(e.target.value)}
              placeholder="مثال: DRIVER-PHONE-1"
            />
          </div>

          <h2 className="text-lg font-bold mb-4">اختر الحافلة:</h2>
          <div className="space-y-3">
            {buses.map((bus) => (
              <button
                key={bus.id}
                onClick={() => setSelectedBus(bus)}
                className="w-full text-right p-4 rounded-2xl border transition-all hover:scale-[1.02]"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <div className="font-bold text-lg">🚌 حافلة رقم {bus.bus_number}</div>
                <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  السائق: {bus.driver_name} — السعة: {bus.capacity} طالب
                </div>
              </button>
            ))}
            {buses.length === 0 && (
              <p className="text-center py-10" style={{ color: "var(--color-text-secondary)" }}>لا توجد حافلات مسجلة</p>
            )}
          </div>
        </div>
      </RoleGuard>
    );
  }

  // Step 2: Driver dashboard
  return (
    <RoleGuard allowed={["school_transport_officer", "school_admin"]}>
      <div className="min-h-screen py-6 px-4 max-w-lg mx-auto" style={{ color: "var(--color-text)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { setSelectedBus(null); stopTracking(); }} className="text-sm">
            ← تغيير الحافلة
          </button>
          <h1 className="text-xl font-bold">🚌 حافلة #{selectedBus.bus_number}</h1>
        </div>

        {/* Status Card */}
        <div
          className="rounded-2xl p-6 mb-6 border"
          style={{ background: isTracking ? "#dcfce7" : "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold">تتبع الموقع</span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${isTracking ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"}`}>
              {isTracking ? "🟢 نشط" : "⚪ متوقف"}
            </span>
          </div>

          {isTracking && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{speed}</div>
                <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>كم/ساعة</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">{lastSent || "—"}</div>
                <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>آخر إرسال</div>
              </div>
            </div>
          )}

          <button
            onClick={isTracking ? stopTracking : startTracking}
            disabled={!deviceIdentifier}
            className={`${btnPrimary} text-white`}
            style={{ background: isTracking ? "#dc2626" : "var(--color-primary)" }}
          >
            {isTracking ? "⏹️ إيقاف التتبع" : "▶️ بدء التتبع"}
          </button>
        </div>

        {/* RFID Scanner */}
        <div
          className="rounded-2xl p-6 mb-6 border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <h2 className="text-lg font-bold mb-4">💳 مسح بطاقات الطلاب</h2>
          {scanResult && (
            <div className="mb-4 p-3 rounded-xl text-center text-sm font-bold bg-blue-50 text-blue-800">
              {scanResult}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleScanTap("board")}
              disabled={!deviceIdentifier}
              className="py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
              style={{ background: "#16a34a" }}
            >
              ⬆️ صعود
            </button>
            <button
              onClick={() => handleScanTap("exit")}
              disabled={!deviceIdentifier}
              className="py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
              style={{ background: "#dc2626" }}
            >
              ⬇️ نزول
            </button>
          </div>
        </div>

        {/* Device Info */}
        <div
          className="rounded-2xl p-4 border text-xs"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          <div className="font-bold mb-1">معلومات الجهاز:</div>
          <div className="font-mono">{deviceIdentifier || "غير محدد"}</div>
          <div>السائق: {selectedBus.driver_name}</div>
        </div>
      </div>
    </RoleGuard>
  );
}
