"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import RoleGuard from "@/components/school/RoleGuard";

interface SchoolBus {
  id: number;
  school: number;
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
  stops_count?: number;
}

interface BusStop {
  id: number;
  route: number;
  route_name: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  order: number;
  is_active: boolean;
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

type Tab = "buses" | "routes" | "stops" | "assignments";

export default function SchoolTransportClient() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations("school");
  const isAr = locale === "ar";

  const [activeTab, setActiveTab] = useState<Tab>("buses");
  const [buses, setBuses] = useState<SchoolBus[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [assignments, setAssignments] = useState<BusAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"bus" | "route" | "stop" | "assignment" | "delete">("bus");
  const [editItem, setEditItem] = useState<SchoolBus | BusRoute | BusStop | BusAssignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const [busForm, setBusForm] = useState({ bus_number: "", driver_name: "", driver_phone: "", capacity: 30 });
  const [routeForm, setRouteForm] = useState({ bus: 0, route_name: "", morning_time: "", evening_time: "" });
  const [stopForm, setStopForm] = useState({ route: 0, name: "", latitude: "", longitude: "", order: 0 });

  const fetchData = useCallback(async () => {
    try {
      const [busesRes, routesRes, stopsRes, assignRes] = await Promise.all([
        api.get("/schools/buses/"),
        api.get("/schools/bus-routes/"),
        api.get("/schools/bus-stops/"),
        api.get("/schools/bus-assignments/"),
      ]);
      setBuses(Array.isArray(busesRes.data) ? busesRes.data : busesRes.data.results || []);
      setRoutes(Array.isArray(routesRes.data) ? routesRes.data : routesRes.data.results || []);
      setStops(Array.isArray(stopsRes.data) ? stopsRes.data : stopsRes.data.results || []);
      setAssignments(Array.isArray(assignRes.data) ? assignRes.data : assignRes.data.results || []);
    } catch {
      setBuses([]);
      setRoutes([]);
      setStops([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = (type: typeof modalType) => {
    setEditItem(null);
    setBusForm({ bus_number: "", driver_name: "", driver_phone: "", capacity: 30 });
    setRouteForm({ bus: buses[0]?.id || 0, route_name: "", morning_time: "", evening_time: "" });
    setStopForm({ route: routes[0]?.id || 0, name: "", latitude: "", longitude: "", order: 0 });
    setModalType(type);
    setShowModal(true);
  };

  const openEdit = (type: typeof modalType, item: SchoolBus | BusRoute | BusStop | BusAssignment) => {
    setEditItem(item);
    if (type === "bus") {
      const b = item as SchoolBus;
      setBusForm({ bus_number: b.bus_number, driver_name: b.driver_name, driver_phone: b.driver_phone || "", capacity: b.capacity });
    } else if (type === "route") {
      const r = item as BusRoute;
      setRouteForm({ bus: r.bus, route_name: r.route_name, morning_time: r.morning_time || "", evening_time: r.evening_time || "" });
    } else if (type === "stop") {
      const s = item as BusStop;
      setStopForm({ route: s.route, name: s.name, latitude: s.latitude || "", longitude: s.longitude || "", order: s.order });
    }
    setModalType(type);
    setShowModal(true);
  };

  const openDelete = (type: string, id: number) => {
    setDeleteTarget({ type, id });
    setModalType("delete");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalType === "bus") {
        const payload = { ...busForm, school: buses[0]?.school || 1 };
        if (editItem) {
          await api.put(`/schools/buses/${editItem.id}/`, payload);
        } else {
          await api.post("/schools/buses/", payload);
        }
      } else if (modalType === "route") {
        if (editItem) {
          await api.put(`/schools/bus-routes/${editItem.id}/`, routeForm);
        } else {
          await api.post("/schools/bus-routes/", routeForm);
        }
      } else if (modalType === "stop") {
        const payload = { ...stopForm, latitude: stopForm.latitude || null, longitude: stopForm.longitude || null };
        if (editItem) {
          await api.put(`/schools/bus-stops/${editItem.id}/`, payload);
        } else {
          await api.post("/schools/bus-stops/", payload);
        }
      }
      setShowModal(false);
      fetchData();
    } catch {
      alert(isAr ? "حدث خطأ" : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const endpoints: Record<string, string> = {
        bus: `/schools/buses/${deleteTarget.id}/`,
        route: `/schools/bus-routes/${deleteTarget.id}/`,
        stop: `/schools/bus-stops/${deleteTarget.id}/`,
        assignment: `/schools/bus-assignments/${deleteTarget.id}/`,
      };
      await api.delete(endpoints[deleteTarget.type]);
      setShowModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch {
      alert(isAr ? "حدث خطأ" : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "buses", label: isAr ? "الحافلات" : "Buses", icon: "🚌" },
    { key: "routes", label: isAr ? "خطوط السير" : "Routes", icon: "🗺️" },
    { key: "stops", label: isAr ? "المحطات" : "Stops", icon: "📍" },
    { key: "assignments", label: isAr ? "التخصيصات" : "Assignments", icon: "👤" },
  ];

  return (
    <RoleGuard allowed={["school_admin", "school_transport_officer", "admin"]}>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {isAr ? "إدارة النقل المدرسي" : "Transport Management"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {isAr ? "إدارة الحافلات، خطوط السير، المحطات، وتخصيص الطلاب" : "Manage buses, routes, stops, and student assignments"}
            </p>
          </div>
          <button onClick={() => openCreate(activeTab === "buses" ? "bus" : activeTab === "routes" ? "route" : activeTab === "stops" ? "stop" : "bus")} className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all" style={{ background: "var(--color-primary)" }}>
            {isAr ? "+ إضافة" : "+ Add"}
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.key ? "text-white" : ""}`} style={activeTab === tab.key ? { background: "var(--color-primary)" } : { background: "var(--color-surface)", color: "var(--color-text-muted)" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
        ) : (
          <div className="space-y-4">
            {activeTab === "buses" && (
              <>
                {buses.length === 0 ? (
                  <EmptyState message={isAr ? "لا توجد حافلات مسجلة." : "No buses registered."} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buses.map((bus) => (
                      <div key={bus.id} className="p-6 rounded-3xl border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                            {isAr ? "حافلة" : "Bus"} #{bus.bus_number}
                          </span>
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{bus.capacity} {isAr ? "مقعد" : "seats"}</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1">{bus.driver_name}</h3>
                        <p className="text-xs mb-4" style={{ color: "var(--color-text-secondary)" }}>{isAr ? "الهاتف:" : "Phone:"} {bus.driver_phone || "—"}</p>
                        <div className="flex gap-2">
                          <button onClick={() => openEdit("bus", bus)} className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105" style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}>
                            {isAr ? "تعديل" : "Edit"}
                          </button>
                          <button onClick={() => openDelete("bus", bus.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105" style={{ background: "#ef4444" }}>
                            {isAr ? "حذف" : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "routes" && (
              <>
                {routes.length === 0 ? (
                  <EmptyState message={isAr ? "لا توجد خطوط سير." : "No routes found."} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route) => (
                      <div key={route.id} className="p-6 rounded-3xl border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <h3 className="text-lg font-bold mb-2">{route.route_name}</h3>
                        <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>{isAr ? "الحافلة:" : "Bus:"} #{route.bus_number} ({route.driver_name})</p>
                        <div className="flex gap-4 mt-3 text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>
                          <span>🌅 {route.morning_time || "07:00"}</span>
                          <span>🌆 {route.evening_time || "14:00"}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => openEdit("route", route)} className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105" style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}>
                            {isAr ? "تعديل" : "Edit"}
                          </button>
                          <button onClick={() => openDelete("route", route.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105" style={{ background: "#ef4444" }}>
                            {isAr ? "حذف" : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "stops" && (
              <>
                {stops.length === 0 ? (
                  <EmptyState message={isAr ? "لا توجد محطات مسجلة." : "No stops registered."} />
                ) : (
                  <div className="rounded-3xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "var(--color-background)" }}>
                          <th className="px-4 py-3 text-start font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>{isAr ? "الترتيب" : "#"}</th>
                          <th className="px-4 py-3 text-start font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>{isAr ? "اسم المحطة" : "Stop Name"}</th>
                          <th className="px-4 py-3 text-start font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>{isAr ? "خط السير" : "Route"}</th>
                          <th className="px-4 py-3 text-start font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>{isAr ? "الحالة" : "Status"}</th>
                          <th className="px-4 py-3 text-end font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>{isAr ? "إجراءات" : "Actions"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stops.map((stop) => (
                          <tr key={stop.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                            <td className="px-4 py-3 font-bold">{stop.order}</td>
                            <td className="px-4 py-3 font-bold">{stop.name}</td>
                            <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>{stop.route_name}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stop.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {stop.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطّل" : "Inactive")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-end">
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => openEdit("stop", stop)} className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105" style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}>
                                  {isAr ? "تعديل" : "Edit"}
                                </button>
                                <button onClick={() => openDelete("stop", stop.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105" style={{ background: "#ef4444" }}>
                                  {isAr ? "حذف" : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === "assignments" && (
              <>
                {assignments.length === 0 ? (
                  <EmptyState message={isAr ? "لا توجد تخصيصات." : "No assignments found."} />
                ) : (
                  <div className="rounded-3xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "var(--color-background)" }}>
                          <th className="px-4 py-3 text-start font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>{isAr ? "الطالب" : "Student"}</th>
                          <th className="px-4 py-3 text-start font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>{isAr ? "خط السير" : "Route"}</th>
                          <th className="px-4 py-3 text-start font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>{isAr ? "الحافلة" : "Bus"}</th>
                          <th className="px-4 py-3 text-start font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>{isAr ? "نقطة التجمع" : "Pickup Point"}</th>
                          <th className="px-4 py-3 text-end font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>{isAr ? "إجراءات" : "Actions"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((a) => (
                          <tr key={a.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                            <td className="px-4 py-3 font-bold">{a.student_name}</td>
                            <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>{a.route_name}</td>
                            <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>#{a.bus_number}</td>
                            <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>{a.pickup_point}</td>
                            <td className="px-4 py-3 text-end">
                              <button onClick={() => openDelete("assignment", a.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105" style={{ background: "#ef4444" }}>
                                {isAr ? "إزالة" : "Remove"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {showModal && modalType === "delete" && deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md p-6 rounded-3xl border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>{isAr ? "تأكيد الحذف" : "Confirm Delete"}</h2>
              <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>{isAr ? "هل أنت متأكد من الحذف؟ لا يمكن التراجع." : "Are you sure? This cannot be undone."}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-xs font-bold border" style={{ borderColor: "var(--color-border)", background: "var(--color-background)" }}>{isAr ? "إلغاء" : "Cancel"}</button>
                <button onClick={handleDelete} disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#ef4444" }}>{saving ? "..." : (isAr ? "حذف" : "Delete")}</button>
              </div>
            </div>
          </div>
        )}

        {showModal && modalType !== "delete" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg p-6 rounded-3xl border shadow-xl max-h-[85vh] overflow-y-auto" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {editItem ? (isAr ? "تعديل" : "Edit") : (isAr ? "إضافة جديدة" : "Add New")} {modalType === "bus" ? (isAr ? "حافلة" : "Bus") : modalType === "route" ? (isAr ? "خط سير" : "Route") : (isAr ? "محطة" : "Stop")}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                {modalType === "bus" && (
                  <>
                    <FormField label={isAr ? "رقم الحافلة" : "Bus Number"} value={busForm.bus_number} onChange={(v) => setBusForm({ ...busForm, bus_number: v })} required />
                    <FormField label={isAr ? "اسم السائق" : "Driver Name"} value={busForm.driver_name} onChange={(v) => setBusForm({ ...busForm, driver_name: v })} required />
                    <FormField label={isAr ? "هاتف السائق" : "Driver Phone"} value={busForm.driver_phone} onChange={(v) => setBusForm({ ...busForm, driver_phone: v })} />
                    <FormField label={isAr ? "السعة" : "Capacity"} value={String(busForm.capacity)} onChange={(v) => setBusForm({ ...busForm, capacity: Number(v) })} type="number" />
                  </>
                )}
                {modalType === "route" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{isAr ? "الحافلة" : "Bus"}</label>
                      <select value={routeForm.bus} onChange={(e) => setRouteForm({ ...routeForm, bus: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }} required>
                        <option value={0}>{isAr ? "اختر الحافلة" : "Select bus"}</option>
                        {buses.map((b) => <option key={b.id} value={b.id}>#{b.bus_number} — {b.driver_name}</option>)}
                      </select>
                    </div>
                    <FormField label={isAr ? "اسم الخط" : "Route Name"} value={routeForm.route_name} onChange={(v) => setRouteForm({ ...routeForm, route_name: v })} required />
                    <FormField label={isAr ? "وقت الصباح" : "Morning Time"} value={routeForm.morning_time} onChange={(v) => setRouteForm({ ...routeForm, morning_time: v })} type="time" />
                    <FormField label={isAr ? "وقت المساء" : "Evening Time"} value={routeForm.evening_time} onChange={(v) => setRouteForm({ ...routeForm, evening_time: v })} type="time" />
                  </>
                )}
                {modalType === "stop" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{isAr ? "خط السير" : "Route"}</label>
                      <select value={stopForm.route} onChange={(e) => setStopForm({ ...stopForm, route: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }} required>
                        <option value={0}>{isAr ? "اختر خط السير" : "Select route"}</option>
                        {routes.map((r) => <option key={r.id} value={r.id}>{r.route_name} (#{r.bus_number})</option>)}
                      </select>
                    </div>
                    <FormField label={isAr ? "اسم المحطة" : "Stop Name"} value={stopForm.name} onChange={(v) => setStopForm({ ...stopForm, name: v })} required />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label={isAr ? "خط العرض" : "Latitude"} value={stopForm.latitude} onChange={(v) => setStopForm({ ...stopForm, latitude: v })} placeholder="31.9539" />
                      <FormField label={isAr ? "خط الطول" : "Longitude"} value={stopForm.longitude} onChange={(v) => setStopForm({ ...stopForm, longitude: v })} placeholder="35.9106" />
                    </div>
                    <FormField label={isAr ? "الترتيب" : "Order"} value={String(stopForm.order)} onChange={(v) => setStopForm({ ...stopForm, order: Number(v) })} type="number" />
                  </>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-xs font-bold border" style={{ borderColor: "var(--color-border)", background: "var(--color-background)" }}>{isAr ? "إلغاء" : "Cancel"}</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "var(--color-primary)" }}>{saving ? "..." : (isAr ? "حفظ" : "Save")}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

function FormField({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-12 rounded-3xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>{message}</div>;
}
