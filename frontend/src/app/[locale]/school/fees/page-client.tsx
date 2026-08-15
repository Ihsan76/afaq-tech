"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import RoleGuard from "@/components/school/RoleGuard";

interface SchoolFee {
  id: number;
  school: number;
  school_name: string;
  title: string;
  amount: string;
  grade_name: string;
  due_date: string;
  description: string;
}

interface FeeAssignment {
  id: number;
  student: number;
  student_name: string;
  fee: number;
  fee_title: string;
  fee_amount: string;
  amount_due: string;
  amount_paid: string;
  status: string;
}

export default function SchoolFeesClient() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [fees, setFees] = useState<SchoolFee[]>([]);
  const [assignments, setAssignments] = useState<FeeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [feesRes, assignRes] = await Promise.all([
        api.get("/schools/fees/"),
        api.get("/schools/fee-assignments/")
      ]);
      setFees(Array.isArray(feesRes.data) ? feesRes.data : feesRes.data.results || []);
      setAssignments(Array.isArray(assignRes.data) ? assignRes.data : assignRes.data.results || []);
    } catch {
      setFees([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/schools/fees/", {
        school: 1, // Default school context
        title,
        amount,
        due_date: dueDate || null,
        description
      });
      setTitle("");
      setAmount("");
      setDueDate("");
      setDescription("");
      setShowCreateModal(false);
      fetchData();
    } catch {
      alert(locale === "ar" ? "فشل إنشاء الرسوم" : "Failed to create fee");
    }
  };

  return (
    <RoleGuard allowed={["school_admin", "admin", "student", "parent"]}>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {locale === "ar" ? "إدارة الشؤون المالية والرسوم المدرسية" : "School Fees & Billing Ledger"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {locale === "ar" ? "تتبع الأقساط الرسومية والذمم المالية وسداد المدفوعات إلكترونياً" : "Track school fee installments, student ledgers, and secure payments"}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all"
            style={{ background: "var(--color-primary)" }}
          >
            {locale === "ar" ? "+ إضافة بند رسوم جديدة" : "+ Add New School Fee"}
          </button>
        </div>

        {showCreateModal && (
          <div className="mb-10 p-6 rounded-3xl border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              {locale === "ar" ? "إضافة رسوم مدرسية جديدة" : "Create New School Fee"}
            </h2>
            <form onSubmit={handleCreateFee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "عنوان الرسوم" : "Fee Title"}</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  placeholder="e.g. رسوم الفصل الدراسي الأول"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "المبلغ" : "Amount"}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "تاريخ الاستحقاق" : "Due Date"}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "الوصف" : "Description"}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  {locale === "ar" ? "حفظ" : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</div>
        ) : (
          <div className="space-y-8">
            {/* Fees Catalog */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {locale === "ar" ? "بنود الرسوم المقررة" : "Configured School Fees"}
              </h2>
              {fees.length === 0 ? (
                <p className="text-sm py-4" style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "لا توجد رسوم مسجلة بعد." : "No school fees configured."}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fees.map((fee) => (
                    <div key={fee.id} className="p-6 rounded-3xl border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                      <h3 className="text-lg font-bold mb-1">{fee.title}</h3>
                      <p className="text-2xl font-extrabold mb-3" style={{ color: "var(--color-primary)" }}>{fee.amount} JOD</p>
                      {fee.due_date && <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>{locale === "ar" ? "تاريخ الاستحقاق:" : "Due:"} {fee.due_date}</p>}
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{fee.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Assignments / Ledger */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {locale === "ar" ? "الذمم المالية للطلاب" : "Student Fee Assignments & Ledger"}
              </h2>
              {assignments.length === 0 ? (
                <p className="text-sm py-4" style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "لا توجد ذمم مالية مسجلة." : "No fee assignments found."}</p>
              ) : (
                <div className="overflow-x-auto rounded-3xl border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-xs uppercase" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                        <th className="p-4">{locale === "ar" ? "الطالب" : "Student"}</th>
                        <th className="p-4">{locale === "ar" ? "بند الرسوم" : "Fee Title"}</th>
                        <th className="p-4">{locale === "ar" ? "المستحق" : "Amount Due"}</th>
                        <th className="p-4">{locale === "ar" ? "المدفوع" : "Amount Paid"}</th>
                        <th className="p-4">{locale === "ar" ? "الحالة" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm" style={{ borderColor: "var(--color-border)" }}>
                      {assignments.map((item) => (
                        <tr key={item.id}>
                          <td className="p-4 font-medium">{item.student_name}</td>
                          <td className="p-4">{item.fee_title}</td>
                          <td className="p-4 font-bold">{item.amount_due} JOD</td>
                          <td className="p-4" style={{ color: "var(--color-success)" }}>{item.amount_paid} JOD</td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                              background: item.status === 'paid' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                              color: item.status === 'paid' ? 'var(--color-success)' : 'var(--color-warning)'
                            }}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
