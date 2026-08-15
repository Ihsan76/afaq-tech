"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import RoleGuard from "@/components/school/RoleGuard";

interface SchoolBus {
  id: number;
  school_name: string;
  bus_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
}

interface BusRoute {
  id: number;
  bus: number;
  bus_number: string;
  driver_name: string;
  route_name: string;
  morning_time: string;
  evening_time: string;
}

interface BusAssignment {
  id: number;
  student: number;
  student_name: string;
  route: number;
  route_name: string;
  bus_number: string;
  pickup_point: string;
}

export default function SchoolTransportClient() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [buses, setBuses] = useState<SchoolBus[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [assignments, setAssignments] = useState<BusAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBusModal, setShowBusModal] = useState(false);

  // Form state for bus
  const [busNumber, setBusNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [capacity, setCapacity] = useState(30);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [busesRes, routesRes, assignRes] = await Promise.all([
        api.get("/schools/buses/"),
        api.get("/schools/bus-routes/"),
        api.get("/schools/bus-assignments/")
      ]);
      setBuses(Array.isArray(busesRes.data) ? busesRes.data : busesRes.data.results || []);
      setRoutes(Array.isArray(routesRes.data) ? routesRes.data : routesRes.data.results || []);
      setAssignments(Array.isArray(assignRes.data) ? assignRes.data : assignRes.data.results || []);
    } catch {
      setBuses([]);
      setRoutes([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/schools/buses/", {
        school: 1,
        bus_number: busNumber,
        driver_name: driverName,
        driver_phone: driverPhone,
        capacity: Number(capacity)
      });
      setBusNumber("");
      setDriverName("");
      setDriverPhone("");
      setCapacity(30);
      setShowBusModal(false);
      fetchData();
    } catch {
      alert(locale === "ar" ? "فشل إضافة الحافلة" : "Failed to add bus");
    }
  };

  return (
    <RoleGuard allowed={["school_admin", "admin", "student", "parent"]}>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {locale === "ar" ? "إدارة النقل المدرسي والحافلات" : "School Transport & Bus Management"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {locale === "ar" ? "متابعة الأسطول المدرسي، خطوط السير، وتخصيص الحافلات للطلاب" : "Manage school bus fleet, routes, and student bus assignments"}
            </p>
          </div>
          <button
            onClick={() => setShowBusModal(true)}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all"
            style={{ background: "var(--color-primary)" }}
          >
            {locale === "ar" ? "+ إضافة حافلة جديدة" : "+ Add New Bus"}
          </button>
        </div>

        {showBusModal && (
          <div className="mb-10 p-6 rounded-3xl border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              {locale === "ar" ? "إضافة حافلة مدرسية" : "Add School Bus"}
            </h2>
            <form onSubmit={handleCreateBus} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "رقم الحافلة" : "Bus Number"}</label>
                <input
                  type="text"
                  required
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  placeholder="e.g. 102"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "اسم السائق" : "Driver Name"}</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  placeholder="أحمد محمد"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "هاتف السائق" : "Driver Phone"}</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  placeholder="0790000000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "السعة الاستيعابية" : "Capacity"}</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBusModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold border"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-background)" }}
                >
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: "var(--color-primary)" }}
                >
                  {locale === "ar" ? "حفظ الحافلة" : "Save Bus"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</div>
        ) : (
          <div className="space-y-8">
            {/* Buses List */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {locale === "ar" ? "أساطيل الحافلات المدرسية" : "School Bus Fleet"}
              </h2>
              {buses.length === 0 ? (
                <p className="text-sm py-4" style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "لا توجد حافلات مسجلة بعد." : "No buses registered yet."}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {buses.map((bus) => (
                    <div key={bus.id} className="p-6 rounded-3xl border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                          {locale === "ar" ? "حافلة رقم" : "Bus"} {bus.bus_number}
                        </span>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{bus.capacity} {locale === "ar" ? "مقعد" : "seats"}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-1">{bus.driver_name}</h3>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "الهاتف:" : "Phone:"} {bus.driver_phone || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bus Routes */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {locale === "ar" ? "خطوط السير والمواعيد" : "Bus Routes & Schedules"}
              </h2>
              {routes.length === 0 ? (
                <p className="text-sm py-4" style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "لا توجد خطوط سير مسجلة." : "No bus routes found."}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {routes.map((route) => (
                    <div key={route.id} className="p-6 rounded-3xl border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                      <h3 className="text-lg font-bold mb-2">{route.route_name}</h3>
                      <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "الحافلة:" : "Bus:"} #{route.bus_number} ({route.driver_name})</p>
                      <div className="flex gap-4 mt-3 text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>
                        <span>🌅 {route.morning_time || "07:00"}</span>
                        <span>🌆 {route.evening_time || "14:00"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
