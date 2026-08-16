"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import RoleGuard from "@/components/school/RoleGuard";

interface Book {
  id: number;
  school: number;
  school_name: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  total_copies: number;
  available_copies: number;
}

interface Lending {
  id: number;
  book: number;
  book_title: string;
  student: number;
  student_name: string;
  borrow_date: string;
  due_date: string;
  return_date: string;
  status: string;
  status_display: string;
}

export default function SchoolLibraryClient() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [books, setBooks] = useState<Book[]>([]);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showLendModal, setShowLendModal] = useState(false);

  // New Book form
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
  const [totalCopies, setTotalCopies] = useState("3");

  // Lending form
  const [selectedBookId, setSelectedBookId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookRes, lendRes] = await Promise.all([
        api.get("/schools/books/"),
        api.get("/schools/library-lendings/"),
      ]);
      setBooks(Array.isArray(bookRes.data) ? bookRes.data : bookRes.data.results || []);
      setLendings(Array.isArray(lendRes.data) ? lendRes.data : lendRes.data.results || []);
    } catch {
      setBooks([]);
      setLendings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/schools/books/", {
        school: 1,
        title,
        author,
        isbn,
        category,
        total_copies: parseInt(totalCopies) || 1,
        available_copies: parseInt(totalCopies) || 1,
      });
      setTitle("");
      setAuthor("");
      setIsbn("");
      setCategory("");
      setTotalCopies("3");
      setShowAddBook(false);
      fetchData();
    } catch {
      alert(locale === "ar" ? "فشل إضافة الكتاب" : "Failed to add book");
    }
  };

  const handleLendBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find or create student account demo or link
      await api.post("/schools/library-lendings/", {
        book: parseInt(selectedBookId),
        student: 1, // Default test student or resolved user
        due_date: dueDate || null,
      });
      setSelectedBookId("");
      setStudentEmail("");
      setDueDate("");
      setShowLendModal(false);
      fetchData();
    } catch {
      alert(locale === "ar" ? "فشل تسجيل الاستعارة" : "Failed to record lending");
    }
  };

  const handleReturnBook = async (id: number) => {
    try {
      await api.patch(`/schools/library-lendings/${id}/`, {
        status: "returned",
        return_date: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } catch {
      alert(locale === "ar" ? "فشل تحديث حالة الإرجاع" : "Failed to return book");
    }
  };

  return (
    <RoleGuard allowed={["school_admin", "school_librarian", "teacher", "student", "parent", "admin", "developer"]}>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {locale === "ar" ? "مكتبة المدرسة وإعارة الكتب" : "School Library & Lending"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {locale === "ar" ? "إدارة مخزون الكتب المدرسية ومتابعة عمليات الاستعارة والرجوع" : "Manage school library books, inventory, and student book lending"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLendModal(true)}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all hover:scale-105"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              📖 {locale === "ar" ? "تسجيل استعارة" : "Lend Book"}
            </button>
            <button
              onClick={() => setShowAddBook(true)}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
            >
              + {locale === "ar" ? "إضافة كتاب جديد" : "Add Book"}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-3xl border shadow-md" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <span className="text-3xl">📚</span>
            <h3 className="text-2xl font-bold mt-2">{books.length}</h3>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "إجمالي عناوين الكتب" : "Total Book Titles"}</p>
          </div>
          <div className="p-6 rounded-3xl border shadow-md" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <span className="text-3xl">🔄</span>
            <h3 className="text-2xl font-bold mt-2">{lendings.filter((l) => l.status === "borrowed").length}</h3>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "الكتب المستعارة حالياً" : "Currently Borrowed"}</p>
          </div>
          <div className="p-6 rounded-3xl border shadow-md" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <span className="text-3xl">✅</span>
            <h3 className="text-2xl font-bold mt-2">{lendings.filter((l) => l.status === "returned").length}</h3>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "الكتب المرتجعة" : "Returned Books"}</p>
          </div>
        </div>

        {/* Books Inventory Section */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {locale === "ar" ? "مخزون كتب المكتبة" : "Library Book Inventory"}
          </h2>
          {loading ? (
            <div className="text-center py-12" style={{ color: "var(--color-text-secondary)" }}>Loading library data...</div>
          ) : books.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-dashed" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              {locale === "ar" ? "لا توجد كتب مسجلة في المكتبة بعد. أضف كتاباً جديداً للبدء." : "No books registered in the library yet. Add a new book to begin."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {books.map((book) => (
                <div key={book.id} className="p-5 rounded-3xl border shadow-md flex flex-col justify-between" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2.5 py-1 text-xs rounded-full font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                        {book.category || (locale === "ar" ? "عام" : "General")}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: book.available_copies > 0 ? "var(--color-success)" : "var(--color-error)" }}>
                        {book.available_copies > 0 ? `${book.available_copies} ${locale === "ar" ? "متاح" : "Available"}` : (locale === "ar" ? "نفدت النسخ" : "Out of Stock")}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{book.title}</h3>
                    <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "المؤلف:" : "Author:"} {book.author || "—"}</p>
                    {book.isbn && <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>ISBN: {book.isbn}</p>}
                  </div>
                  <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs" style={{ borderColor: "var(--color-border)" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>{locale === "ar" ? "إجمالي النسخ:" : "Total Copies:"} {book.total_copies}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lending History Section */}
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {locale === "ar" ? "سجل استعارة الكتب" : "Book Lending Ledger"}
          </h2>
          {lendings.length === 0 ? (
            <div className="p-6 text-center rounded-3xl border border-dashed" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              {locale === "ar" ? "لا توجد عمليات استعارة مسجلة حالياً." : "No active lending records."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border shadow-md" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <table className="w-full text-start text-sm">
                <thead className="border-b text-xs uppercase" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                  <tr>
                    <th className="p-4 text-start">الكتاب</th>
                    <th className="p-4 text-start">الطالب المستعير</th>
                    <th className="p-4 text-start">تاريخ الاستعارة</th>
                    <th className="p-4 text-start">تاريخ الاستحقاق</th>
                    <th className="p-4 text-start">الحالة</th>
                    <th className="p-4 text-end">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {lendings.map((l) => (
                    <tr key={l.id} className="hover:bg-[var(--color-surface-alt)]/50 transition-colors">
                      <td className="p-4 font-bold">{l.book_title}</td>
                      <td className="p-4">{l.student_name}</td>
                      <td className="p-4 text-xs">{l.borrow_date}</td>
                      <td className="p-4 text-xs">{l.due_date || "—"}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${l.status === "returned" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {l.status_display || l.status}
                        </span>
                      </td>
                      <td className="p-4 text-end">
                        {l.status === "borrowed" && (
                          <button
                            onClick={() => handleReturnBook(l.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                          >
                            {locale === "ar" ? "تسجيل إرجاع" : "Mark Returned"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Book Modal */}
        {showAddBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 rounded-3xl shadow-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{locale === "ar" ? "إضافة كتاب جديد للمكتبة" : "Add New Library Book"}</h3>
                <button onClick={() => setShowAddBook(false)} className="text-xl font-bold">✕</button>
              </div>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">{locale === "ar" ? "عنوان الكتاب" : "Book Title"}</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 rounded-2xl border bg-transparent"
                    style={{ borderColor: "var(--color-border)" }}
                    placeholder={locale === "ar" ? "مثل: أساسيات الفيزياء الحديثة" : "e.g. Modern Physics"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{locale === "ar" ? "المؤلف" : "Author"}</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full p-3 rounded-2xl border bg-transparent"
                    style={{ borderColor: "var(--color-border)" }}
                    placeholder={locale === "ar" ? "اسم المؤلف" : "Author name"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">ISBN</label>
                    <input
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      className="w-full p-3 rounded-2xl border bg-transparent"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{locale === "ar" ? "التصنيف" : "Category"}</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 rounded-2xl border bg-transparent"
                      style={{ borderColor: "var(--color-border)" }}
                      placeholder={locale === "ar" ? "علوم / رياضيات" : "Science / Math"}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{locale === "ar" ? "عدد النسخ الإجمالي" : "Total Copies"}</label>
                  <input
                    type="number"
                    min="1"
                    value={totalCopies}
                    onChange={(e) => setTotalCopies(e.target.value)}
                    className="w-full p-3 rounded-2xl border bg-transparent"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddBook(false)}
                    className="px-5 py-2.5 rounded-2xl text-sm font-bold border"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {locale === "ar" ? "حفظ وإضافة" : "Save Book"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lend Book Modal */}
        {showLendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 rounded-3xl shadow-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{locale === "ar" ? "تسجيل استعارة كتاب لطالب" : "Lend Book to Student"}</h3>
                <button onClick={() => setShowLendModal(false)} className="text-xl font-bold">✕</button>
              </div>
              <form onSubmit={handleLendBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">{locale === "ar" ? "اختر الكتاب" : "Select Book"}</label>
                  <select
                    required
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full p-3 rounded-2xl border bg-transparent"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <option value="">{locale === "ar" ? "-- اختر كتاباً متاحاً --" : "-- Select available book --"}</option>
                    {books.filter((b) => b.available_copies > 0).map((b) => (
                      <option key={b.id} value={b.id} style={{ background: "var(--color-surface)" }}>
                        {b.title} (متاح: {b.available_copies})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{locale === "ar" ? "تاريخ استحقاق الإرجاع" : "Due Date"}</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-3 rounded-2xl border bg-transparent"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLendModal(false)}
                    className="px-5 py-2.5 rounded-2xl text-sm font-bold border"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {locale === "ar" ? "تأكيد الاستعارة" : "Confirm Lending"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
