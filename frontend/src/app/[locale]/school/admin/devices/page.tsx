"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import RoleGuard from "@/components/school/RoleGuard";
import { resolveActiveSchoolId } from "@/components/school/activeSchool";

interface SchoolDevice {
  id: number;
  name: string;
  device_type: string;
  device_type_display: string;
  device_identifier: string;
  api_token: string;
  assigned_bus: number | null;
  assigned_bus_display: string;
  assigned_gate: string;
  status: string;
  status_display: string;
  is_active: boolean;
  last_seen_at: string | null;
  notes: string;
  school_name: string;
}

interface SchoolBus {
  id: number;
  bus_number: string;
  driver_name: string;
}

const DEVICE_TYPES = [
  { value: "gps_tracker", label: "جهاز تتبع GPS", icon: "📡" },
  { value: "rfid_reader", label: "قارئ بطاقات RFID", icon: "💳" },
  { value: "facial_camera", label: "كاميرا التعرف على الوجه", icon: "📷" },
  { value: "mobile_app", label: "تطبيق هاتف السائق", icon: "📱" },
  { value: "bluetooth_rfid", label: "قارئ RFID بلوتوث", icon: "📶" },
];

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-100 text-green-800",
  offline: "bg-gray-100 text-gray-600",
  maintenance: "bg-yellow-100 text-yellow-800",
};

const inputCls =
  "w-full px-4 py-3 rounded-2xl border focus:ring-2 transition-all text-sm";
const btnPrimary =
  "px-5 py-2.5 rounded-2xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50";

export default function SchoolDevicesPage() {
  const t = useTranslations("school");
  const { user } = useAuthStore();
  const [devices, setDevices] = useState<SchoolDevice[]>([]);
  const [buses, setBuses] = useState<SchoolBus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<SchoolDevice | null>(null);
  const [form, setForm] = useState({
    name: "",
    device_type: "gps_tracker",
    device_identifier: "",
    assigned_bus: "",
    assigned_gate: "",
    notes: "",
  });
  const [tokenCopied, setTokenCopied] = useState<number | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sid = await resolveActiveSchoolId();
      setSchoolId(sid);
      const params = sid ? `?school=${sid}` : "";
      const [devRes, busRes] = await Promise.all([
        api.get(`/schools/devices/${params}`),
        api.get(`/schools/buses/${params}`),
      ]);
      setDevices(devRes.data.results || devRes.data || []);
      setBuses(busRes.data.results || busRes.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm({ name: "", device_type: "gps_tracker", device_identifier: "", assigned_bus: "", assigned_gate: "", notes: "" });
    setEditingDevice(null);
    setShowForm(false);
  };

  const openEdit = (d: SchoolDevice) => {
    setForm({
      name: d.name,
      device_type: d.device_type,
      device_identifier: d.device_identifier,
      assigned_bus: d.assigned_bus ? String(d.assigned_bus) : "",
      assigned_gate: d.assigned_gate,
      notes: d.notes,
    });
    setEditingDevice(d);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const payload: any = {
      name: form.name,
      device_type: form.device_type,
      device_identifier: form.device_identifier,
      assigned_gate: form.assigned_gate,
      notes: form.notes,
      is_active: true,
    };
    if (schoolId) payload.school = Number(schoolId);
    if (form.assigned_bus) payload.assigned_bus = Number(form.assigned_bus);

    try {
      if (editingDevice) {
        await api.patch(`/schools/devices/${editingDevice.id}/`, payload);
      } else {
        await api.post("/schools/devices/", payload);
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "حدث خطأ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الجهاز؟")) return;
    try {
      await api.delete(`/schools/devices/${id}/`);
      fetchData();
    } catch {}
  };

  const handleToggleActive = async (d: SchoolDevice) => {
    try {
      await api.patch(`/schools/devices/${d.id}/`, { is_active: !d.is_active });
      fetchData();
    } catch {}
  };

  const regenerateToken = async (id: number) => {
    try {
      const res = await api.post(`/schools/devices/${id}/regenerate-token/`);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, api_token: res.data.api_token } : d
        )
      );
      setTokenCopied(id);
      setTimeout(() => setTokenCopied(null), 2000);
    } catch {}
  };

  const copyToken = (token: string, id: number) => {
    navigator.clipboard.writeText(token);
    setTokenCopied(id);
    setTimeout(() => setTokenCopied(null), 2000);
  };

  const online = devices.filter((d) => d.status === "online").length;
  const offline = devices.filter((d) => d.status === "offline").length;

  return (
    <RoleGuard allowed={["school_admin"]}>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {"🖥️ إدارة الأجهزة الذكية"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {"إدارة أجهزة التتبع، RFID، الكاميرات، وهواتف السائقين"}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className={`${btnPrimary} text-white`}
            style={{ background: "var(--color-primary)" }}
          >
            + إضافة جهاز جديد
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "إجمالي الأجهزة", value: devices.length, icon: "🖥️" },
            { label: "متصلة حالياً", value: online, icon: "🟢" },
            { label: "غير متصلة", value: offline, icon: "🔴" },
            { label: "الحافلات المجهزة", value: new Set(devices.filter((d) => d.assigned_bus).map((d) => d.assigned_bus)).size, icon: "🚌" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
            <div
              className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              style={{ background: "var(--color-surface)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">{editingDevice ? "تعديل الجهاز" : "إضافة جهاز جديد"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم الجهاز</label>
                  <input
                    className={inputCls}
                    style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="مثال: كاميرا البوابة الرئيسية"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نوع الجهاز</label>
                  <select
                    className={inputCls}
                    style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
                    value={form.device_type}
                    onChange={(e) => setForm({ ...form, device_type: e.target.value })}
                  >
                    {DEVICE_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>
                        {dt.icon} {dt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">معرف الجهاز (IMEI / MAC / Serial)</label>
                  <input
                    className={inputCls}
                    style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
                    value={form.device_identifier}
                    onChange={(e) => setForm({ ...form, device_identifier: e.target.value })}
                    placeholder="مثال: RFID-GATE-001"
                  />
                </div>
                {form.device_type === "gps_tracker" || form.device_type === "mobile_app" ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">الحافلة المخصصة</label>
                    <select
                      className={inputCls}
                      style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
                      value={form.assigned_bus}
                      onChange={(e) => setForm({ ...form, assigned_bus: e.target.value })}
                    >
                      <option value="">— بدون حافلة —</option>
                      {buses.map((b) => (
                        <option key={b.id} value={b.id}>
                          حافلة رقم {b.bus_number} - {b.driver_name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {form.device_type === "rfid_reader" || form.device_type === "facial_camera" ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">البوابة / المدخل المخصص</label>
                    <input
                      className={inputCls}
                      style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
                      value={form.assigned_gate}
                      onChange={(e) => setForm({ ...form, assigned_gate: e.target.value })}
                      placeholder="مثال: البوابة الرئيسية"
                    />
                  </div>
                ) : null}
                <div>
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea
                    className={inputCls}
                    style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 rounded-2xl text-sm font-bold"
                    style={{ border: "1px solid var(--color-border)" }}
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!form.name || !form.device_identifier}
                    className={`${btnPrimary} text-white`}
                    style={{ background: "var(--color-primary)" }}
                  >
                    {editingDevice ? "تحديث" : "إضافة"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Devices Table */}
        {isLoading ? (
          <div className="text-center py-20 animate-pulse text-lg font-bold">جاري التحميل...</div>
        ) : devices.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-4xl mb-4">🖥️</div>
            <p className="text-lg font-bold">لا توجد أجهزة مسجلة</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>اضغط &quot;إضافة جهاز جديد&quot; للبدء</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--color-surface)" }}>
                  <th className="px-4 py-3 text-right">الجهاز</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">النوع</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">المعرف</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">الحافلة / البوابة</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">التوكن</th>
                  <th className="px-4 py-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                    <td className="px-4 py-3 font-bold">
                      {d.name}
                      <div className="text-xs md:hidden" style={{ color: "var(--color-text-secondary)" }}>{d.device_type_display}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{d.device_type_display}</td>
                    <td className="px-4 py-3 font-mono text-xs hidden lg:table-cell">{d.device_identifier}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[d.status] || "bg-gray-100"}`}>
                        {d.status === "online" ? "🟢" : d.status === "maintenance" ? "🟡" : "🔴"} {d.status_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs hidden md:table-cell">
                      {d.assigned_bus_display || d.assigned_gate || "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs truncate max-w-[120px]">
                          {d.api_token ? `${d.api_token.slice(0, 8)}...` : "—"}
                        </span>
                        {d.api_token && (
                          <button
                            onClick={() => copyToken(d.api_token, d.id)}
                            className="text-xs px-1.5 py-0.5 rounded-lg"
                            style={{ background: "var(--color-surface)" }}
                            title="نسخ التوكن"
                          >
                            {tokenCopied === d.id ? "✅" : "📋"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(d)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: "var(--color-surface)" }}
                          title="تعديل"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => regenerateToken(d.id)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: "var(--color-surface)" }}
                          title="إعادة توليد التوكن"
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => handleToggleActive(d)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: "var(--color-surface)" }}
                          title={d.is_active ? "تعطيل" : "تفعيل"}
                        >
                          {d.is_active ? "⏸️" : "▶️"}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-50"
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
