"use client";

import { useState, useEffect, Fragment } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";
import { useLanguages } from "@/lib/useLanguages";

interface Grade { id: number; level: number; translations: Record<string, { name: string }>; }
interface Curriculum { id: number; translations: Record<string, { name: string }>; name?: string; country: string; year: number; grade: number; }
interface CurriculumDocument { id: number; curriculum: number; subject: number | null; title: string; file: string; external_url: string; download_url: string; extracted_text: string; created_at: string; }

const LABELS: Record<string, Record<string, string>> = {
  curriculaTab: { ar: "📋 المناهج", en: "📋 Curricula", fr: "📋 Programmes", tr: "📋 Müfredat", ur: "📋 نصاب", es: "📋 Planes de Estudio", de: "📋 Lehrpläne", id: "📋 Kurikulum", bn: "📋 পাঠ্যক্রম", fa: "📋 برنامههای درسی" },
  gradesTab: { ar: "🎓 الصفوف", en: "🎓 Grades", fr: "🎓 Niveaux", tr: "🎓 Sınıflar", ur: "🎓 جماعتیں", es: "🎓 Grados", de: "🎓 Klassenstufen", id: "🎓 Kelas", bn: "🎓 শ্রেণী", fa: "🎓 کلاسها" },
  documentsTab: { ar: "📄 المستندات", en: "📄 Documents", fr: "📄 Documents", tr: "📄 Belgeler", ur: "📄 دستاویزات", es: "📄 Documentos", de: "📄 Dokumente", id: "📄 Dokumen", bn: "📄 নথি", fa: "📄 اسناد" },
  curriculaDesc: { ar: "إدارة المناهج الدراسية وربطها بالصفوف", en: "Manage curricula and link them to grades", fr: "Gérer les programmes et les lier aux niveaux", tr: "Müfredatı yönetin ve sınıflara bağlayın", ur: "نصاب کا نظم کریں اور جماعتوں سے منسلک کریں", es: "Gestionar planes de estudio y vincularlos a grados", de: "Lehrpläne verwalten und mit Klassenstufen verknüpfen", id: "Kelola kurikulum dan hubungkan ke kelas", bn: "পাঠ্যক্রম পরিচালনা করুন এবং শ্রেণীর সাথে লিঙ্ক করুন", fa: "مدیریت برنامههای درسی و اتصال آنها به کلاسها" },
  gradesDesc: { ar: "إدارة الصفوف الدراسية", en: "Manage grades", fr: "Gérer les niveaux", tr: "Sınıfları yönetin", ur: "جماعتوں کا نظم کریں", es: "Gestionar grados", de: "Klassenstufen verwalten", id: "Kelola kelas", bn: "শ্রেণী পরিচালনা করুন", fa: "مدیریت کلاسهای درسی" },
  documentsDesc: { ar: "رفع وإدارة مستندات المناهج (PDF, TXT)", en: "Upload and manage curriculum documents (PDF, TXT)", fr: "Télécharger et gérer les documents du programme (PDF, TXT)", tr: "Müfredat belgelerini yükleyin ve yönetin (PDF, TXT)", ur: "نصاب کی دستاویزات اپ لوڈ اور منظم کریں (PDF, TXT)", es: "Subir y gestionar documentos del plan de estudios (PDF, TXT)", de: "Lehrplandokumente hochladen und verwalten (PDF, TXT)", id: "Unggah dan kelola dokumen kurikulum (PDF, TXT)", bn: "পাঠ্যক্রম নথি আপলোড এবং পরিচালনা করুন (PDF, TXT)", fa: "آپلود و مدیریت اسناد برنامه درسی (PDF، TXT)" },
  language: { ar: "اللغة", en: "Language", fr: "Langue", tr: "Dil", ur: "زبان", es: "Idioma", de: "Sprache", id: "Bahasa", bn: "ভাষা", fa: "زبان" },
  name: { ar: "الاسم", en: "Name", fr: "Nom", tr: "Ad", ur: "نام", es: "Nombre", de: "Name", id: "Nama", bn: "নাম", fa: "نام" },
  country: { ar: "الدولة", en: "Country", fr: "Pays", tr: "Ülke", ur: "ملک", es: "País", de: "Land", id: "Negara", bn: "দেশ", fa: "کشور" },
  year: { ar: "السنة", en: "Year", fr: "Année", tr: "Yıl", ur: "سال", es: "Año", de: "Jahr", id: "Tahun", bn: "বছর", fa: "سال" },
  grade: { ar: "الصف", en: "Grade", fr: "Niveau", tr: "Sınıf", ur: "جماعت", es: "Grado", de: "Klassenstufe", id: "Kelas", bn: "শ্রেণী", fa: "کلاس" },
  level: { ar: "المستوى", en: "Level", fr: "Niveau", tr: "Seviye", ur: "سطح", es: "Nivel", de: "Stufe", id: "Tingkat", bn: "স্তর", fa: "سطح" },
  nameAr: { ar: "الاسم (عربي)", en: "Name (Arabic)", fr: "Nom (Arabe)", tr: "Ad (Arapça)", ur: "نام (عربی)", es: "Nombre (Árabe)", de: "Name (Arabisch)", id: "Nama (Arab)", bn: "নাম (আরবি)", fa: "نام (عربی)" },
  nameEn: { ar: "English", en: "English", fr: "Anglais", tr: "İngilizce", ur: "انگریزی", es: "Inglés", de: "Englisch", id: "Inggris", bn: "ইংরেজি", fa: "انگلیسی" },
  addGrade: { ar: "إضافة صف", en: "Add Grade", fr: "Ajouter un niveau", tr: "Sınıf Ekle", ur: "جماعت شامل کریں", es: "Agregar grado", de: "Klassenstufe hinzufügen", id: "Tambah Kelas", bn: "শ্রেণী যোগ করুন", fa: "افزودن کلاس" },
  addCurriculum: { ar: "إضافة منهج", en: "Add Curriculum", fr: "Ajouter un programme", tr: "Müfredat Ekle", ur: "نصاب شامل کریں", es: "Agregar plan de estudios", de: "Lehrplan hinzufügen", id: "Tambah Kurikulum", bn: "পাঠ্যক্রম যোগ করুন", fa: "افزودن برنامه درسی" },
  editGrade: { ar: "تعديل الصف", en: "Edit Grade", fr: "Modifier le niveau", tr: "Sınıfı Düzenle", ur: "جماعت میں ترمیم", es: "Editar grado", de: "Klassenstufe bearbeiten", id: "Edit Kelas", bn: "শ্রেণী সম্পাদনা করুন", fa: "ویرایش کلاس" },
  editCurriculum: { ar: "تعديل المنهج", en: "Edit Curriculum", fr: "Modifier le programme", tr: "Müfredatı Düzenle", ur: "نصاب میں ترمیم", es: "Editar plan de estudios", de: "Lehrplan bearbeiten", id: "Edit Kurikulum", bn: "পাঠ্যক্রম সম্পাদনা করুন", fa: "ویرایش برنامه درسی" },
  levelOrder: { ar: "المستوى (ترتيب)", en: "Level (Order)", fr: "Niveau (Ordre)", tr: "Seviye (Sıra)", ur: "سطح (ترتیب)", es: "Nivel (Orden)", de: "Stufe (Reihenfolge)", id: "Tingkat (Urutan)", bn: "স্তর (ক্রম)", fa: "سطح (ترتیب)" },
  filledCount: { ar: "تم تعبئة {n} من {t} لغات", en: "{n} of {t} languages filled", fr: "{n} sur {t} langues remplies", tr: "{t} dilden {n} dolduruldu", ur: "{t} زبانوں میں سے {n} بھری گئیں", es: "{n} de {t} idiomas completados", de: "{n} von {t} Sprachen ausgefüllt", id: "{n} dari {t} bahasa diisi", bn: "{t}টি ভাষার মধ্যে {n}টি পূরণ করা হয়েছে", fa: "{n} از {t} زبان پر شده است" },
  saving: { ar: "جار الحفظ...", en: "Saving...", fr: "Enregistrement...", tr: "Kaydediliyor...", ur: "محفوظ ہو رہا ہے...", es: "Guardando...", de: "Speichern...", id: "Menyimpan...", bn: "সংরক্ষণ করা হচ্ছে...", fa: "در حال ذخیره..." },
  save: { ar: "حفظ", en: "Save", fr: "Enregistrer", tr: "Kaydet", ur: "محفوظ کریں", es: "Guardar", de: "Speichern", id: "Simpan", bn: "সংরক্ষণ করুন", fa: "ذخیره" },
  cancel: { ar: "إلغاء", en: "Cancel", fr: "Annuler", tr: "İptal", ur: "منسوخ کریں", es: "Cancelar", de: "Abbrechen", id: "Batal", bn: "বাতিল করুন", fa: "لغو" },
  uploadDocument: { ar: "رفع مستند", en: "Upload Document", fr: "Télécharger un document", tr: "Belge Yükle", ur: "دستاویز اپ لوڈ کریں", es: "Subir documento", de: "Dokument hochladen", id: "Unggah Dokumen", bn: "নথি আপলোড করুন", fa: "آپلود سند" },
  uploading: { ar: "جار الرفع...", en: "Uploading...", fr: "Téléchargement...", tr: "Yükleniyor...", ur: "اپ لوڈ ہو رہا ہے...", es: "Subiendo...", de: "Hochladen...", id: "Mengunggah...", bn: "আপলোড হচ্ছে...", fa: "در حال آپلود..." },
  uploadBtn: { ar: "رفع المستند", en: "Upload Document", fr: "Télécharger", tr: "Belge Yükle", ur: "دستاویز اپ لوڈ کریں", es: "Subir documento", de: "Dokument hochladen", id: "Unggah Dokumen", bn: "নথি আপলোড করুন", fa: "آپلود سند" },
  title: { ar: "العنوان", en: "Title", fr: "Titre", tr: "Başlık", ur: "عنوان", es: "Título", de: "Titel", id: "Judul", bn: "শিরোনাম", fa: "عنوان" },
  subject: { ar: "المادة", en: "Subject", fr: "Matière", tr: "Ders", ur: "مضمون", es: "Materia", de: "Fach", id: "Mata Pelajaran", bn: "বিষয়", fa: "درس" },
  subjectOptional: { ar: "المادة (اختياري)", en: "Subject (Optional)", fr: "Matière (Optionnelle)", tr: "Ders (İsteğe Bağlı)", ur: "مضمون (اختیاری)", es: "Materia (Opcional)", de: "Fach (Optional)", id: "Mata Pelajaran (Opsional)", bn: "বিষয় (ঐচ্ছিক)", fa: "درس (اختیاری)" },
  file: { ar: "الملف", en: "File", fr: "Fichier", tr: "Dosya", ur: "فائل", es: "Archivo", de: "Datei", id: "Berkas", bn: "ফাইল", fa: "فایل" },
  dateUploaded: { ar: "تاريخ الرفع", en: "Upload Date", fr: "Date de téléchargement", tr: "Yükleme Tarihi", ur: "اپ لوڈ کی تاریخ", es: "Fecha de subida", de: "Hochladedatum", id: "Tanggal Unggah", bn: "আপলোডের তারিখ", fa: "تاریخ آپلود" },
  view: { ar: "عرض", en: "View", fr: "Voir", tr: "Görüntüle", ur: "دیکھیں", es: "Ver", de: "Anzeigen", id: "Lihat", bn: "দেখুন", fa: "مشاهده" },
  delete: { ar: "حذف", en: "Delete", fr: "Supprimer", tr: "Sil", ur: "حذف کریں", es: "Eliminar", de: "Löschen", id: "Hapus", bn: "মুছুন", fa: "حذف" },
  extract: { ar: "استخراج النص", en: "Extract Text", fr: "Extraire le texte", tr: "Metni Çıkar", ur: "متن نکالیں", es: "Extraer texto", de: "Text extrahieren", id: "Ekstrak Teks", bn: "টেক্সট এক্সট্রাক্ট করুন", fa: "استخراج متن" },
  extracting: { ar: "جار الاستخراج...", en: "Extracting...", fr: "Extraction...", tr: "Çıkarılıyor...", ur: "نکالا جا رہا ہے...", es: "Extrayendo...", de: "Extrahiere...", id: "Mengekstrak...", bn: "নিষ্কাশন করা হচ্ছে...", fa: "در حال استخراج..." },
  extractedText: { ar: "النص المستخرج", en: "Extracted Text", fr: "Texte extrait", tr: "Çıkarılan Metin", ur: "نکالا گیا متن", es: "Texto extraído", de: "Extrahierter Text", id: "Teks yang Diekstrak", bn: "নিষ্কাশিত টেক্সট", fa: "متن استخراجشده" },
  extractSuccess: { ar: "تم استخراج النص بنجاح", en: "Text extracted successfully", fr: "Texte extrait avec succès", tr: "Metin başarıyla çıkarıldı", ur: "متن کامیابی سے نکال لیا گیا", es: "Texto extraído exitosamente", de: "Text erfolgreich extrahiert", id: "Teks berhasil diekstrak", bn: "টেক্সট সফলভাবে নিষ্কাশিত হয়েছে", fa: "متن با موفقیت استخراج شد" },
  noExtractedText: { ar: "لم يتم استخراج النص بعد. اضغط على زر الاستخراج.", en: "No text extracted yet. Click extract.", fr: "Aucun texte extrait. Cliquez sur extraire.", tr: "Henüz metin çıkarılmadı. Çıkarmak için tıklayın.", ur: "ابھی تک کوئی متن نہیں نکالا گیا۔ نکالنے کے لیے کلک کریں۔", es: "Aún no se extrajo texto. Haga clic en extraer.", de: "Noch kein Text extrahiert. Klicken Sie auf Extrahieren.", id: "Belum ada teks yang diekstrak. Klik ekstrak.", bn: "এখনও কোন টেক্সট নিষ্কাশিত হয়নি। নিষ্কাশন করতে ক্লিক করুন।", fa: "هنوز متنی استخراج نشده است. روی استخراج کلیک کنید." },
  selectCurriculum: { ar: "اختر المنهج", en: "Select Curriculum", fr: "Sélectionner le programme", tr: "Müfredat Seçin", ur: "نصاب منتخب کریں", es: "Seleccionar plan de estudios", de: "Lehrplan auswählen", id: "Pilih Kurikulum", bn: "পাঠ্যক্রম নির্বাচন করুন", fa: "انتخاب برنامه درسی" },
  selectCurriculumPlaceholder: { ar: "-- اختر منهجاً --", en: "-- Select Curriculum --", fr: "-- Choisir un programme --", tr: "-- Müfredat Seçin --", ur: "-- نصاب منتخب کریں --", es: "-- Seleccionar --", de: "-- Lehrplan auswählen --", id: "-- Pilih Kurikulum --", bn: "-- পাঠ্যক্রম নির্বাচন করুন --", fa: "-- انتخاب برنامه درسی --" },
  selectSubjectPlaceholder: { ar: "-- اختر المادة --", en: "-- Select Subject --", fr: "-- Choisir une matière --", tr: "-- Ders Seçin --", ur: "-- مضمون منتخب کریں --", es: "-- Seleccionar materia --", de: "-- Fach auswählen --", id: "-- Pilih Mata Pelajaran --", bn: "-- বিষয় নির্বাচন করুন --", fa: "-- انتخاب درس --" },
  docPlaceholder: { ar: "اسم المستند", en: "Document name", fr: "Nom du document", tr: "Belge adı", ur: "دستاویز کا نام", es: "Nombre del documento", de: "Dokumentname", id: "Nama dokumen", bn: "নথির নাম", fa: "نام سند" },
  noDocuments: { ar: "لا توجد مستندات لهذا المنهج بعد", en: "No documents for this curriculum yet", fr: "Aucun document pour ce programme", tr: "Bu müfredat için henüz belge yok", ur: "اس نصاب کے لیے ابھی کوئی دستاویز نہیں", es: "Sin documentos para este plan de estudios", de: "Keine Dokumente für diesen Lehrplan", id: "Belum ada dokumen untuk kurikulum ini", bn: "এই পাঠ্যক্রমের জন্য এখনও কোন নথি নেই", fa: "هنوز سندی برای این برنامه درسی وجود ندارد" },
  selectCurrHint: { ar: "اختر منهجاً من القائمة أعلاه لإدارة مستنداته", en: "Select a curriculum from the list above to manage its documents", fr: "Sélectionnez un programme dans la liste pour gérer ses documents", tr: "Belgelerini yönetmek için yukarıdaki listeden bir müfredat seçin", ur: "اس کی دستاویزات کا نظم کرنے کے لیے اوپر کی فہرست سے ایک نصاب منتخب کریں", es: "Seleccione un plan de estudios de la lista para gestionar sus documentos", de: "Wählen Sie einen Lehrplan aus der Liste aus, um seine Dokumente zu verwalten", id: "Pilih kurikulum dari daftar di atas untuk mengelola dokumennya", bn: "এর নথি পরিচালনা করতে উপরের তালিকা থেকে একটি পাঠ্যক্রম নির্বাচন করুন", fa: "برای مدیریت اسناد، از فهرست بالا یک برنامه درسی انتخاب کنید" },
  noGrades: { ar: "لا توجد صفوف دراسية بعد", en: "No grades yet", fr: "Aucun niveau pour le moment", tr: "Henüz sınıf yok", ur: "ابھی کوئی جماعت نہیں", es: "Sin grados todavía", de: "Noch keine Klassenstufen", id: "Belum ada kelas", bn: "এখনও কোন শ্রেণী নেই", fa: "هنوز کلاسی وجود ندارد" },
  addGradesHint: { ar: "أضف الصفوف من تأسيسي (تمهيدي، أول ... سنة 6 جامعة)", en: "Add grades from Foundation (KG, Grade 1 ... University Year 6)", fr: "Ajoutez les niveaux de la Fondation (Maternelle, CP ... Doctorat)", tr: "Temelden itibaren sınıfları ekleyin (Anaokulu, 1. Sınıf ... Üniversite 6)", ur: "بنیادی سے جماعتیں شامل کریں (کے جی، پہلی جماعت ... یونیورسٹی سال 6)", es: "Agregue grados desde Fundación (Preescolar, 1er Grado ... Año 6 Universidad)", de: "Fügen Sie Klassenstufen von der Grundstufe hinzu (Vorschule, 1. Klasse ... Universität 6. Jahr)", id: "Tambahkan kelas dari Fondasi (TK, Kelas 1 ... Universitas Tahun 6)", bn: "ভিত্তি থেকে শ্রেণী যোগ করুন (কেজি, প্রথম শ্রেণী ... বিশ্ববিদ্যালয় ৬ষ্ঠ বর্ষ)", fa: "کلاسها را از پایه اضافه کنید (پیشدبستانی، اول... سال ۶ دانشگاه)" },
  confirmDeleteGrade: { ar: "تأكيد حذف هذا الصف؟", en: "Confirm delete this grade?", fr: "Confirmer la suppression de ce niveau?", tr: "Bu sınıfı silmek istediğinize emin misiniz?", ur: "اس جماعت کو حذف کرنے کی تصدیق کریں؟", es: "¿Confirmar eliminación de este grado?", de: "Löschen dieser Klassenstufe bestätigen?", id: "Konfirmasi hapus kelas ini?", bn: "এই শ্রেণী মুছে ফেলার নিশ্চিতকরণ?", fa: "حذف این کلاس تأیید میشود؟" },
  confirmDeleteDoc: { ar: "تأكيد حذف هذا المستند؟", en: "Confirm delete this document?", fr: "Confirmer la suppression de ce document?", tr: "Bu belgeyi silmek istediğinize emin misiniz?", ur: "اس دستاویز کو حذف کرنے کی تصدیق کریں؟", es: "¿Confirmar eliminación de este documento?", de: "Löschen dieses Dokuments bestätigen?", id: "Konfirmasi hapus dokumen ini?", bn: "এই নথি মুছে ফেলার নিশ্চিতকরণ?", fa: "حذف این سند تأیید میشود؟" },
  reqNameAr: { ar: "الاسم بالعربية مطلوب", en: "Arabic name is required", fr: "Le nom en arabe est requis", tr: "Arapça ad gerekli", ur: "عربی نام ضروری ہے", es: "El nombre en árabe es obligatorio", de: "Arabischer Name erforderlich", id: "Nama Arab wajib diisi", bn: "আরবি নাম প্রয়োজন", fa: "نام عربی الزامی است" },
  reqTitleFile: { ar: "العنوان والملف مطلوبان", en: "Title and file are required", fr: "Titre et fichier requis", tr: "Başlık ve dosya gerekli", ur: "عنوان اور فائل ضروری ہیں", es: "Título y archivo obligatorios", de: "Titel und Datei erforderlich", id: "Judul dan berkas wajib diisi", bn: "শিরোনাম এবং ফাইল প্রয়োজন", fa: "عنوان و فایل الزامی هستند" },
  deleteFailed: { ar: "فشل الحذف", en: "Delete failed", fr: "Échec de la suppression", tr: "Silme başarısız", ur: "حذف ناکام ہوا", es: "Error al eliminar", de: "Löschen fehlgeschlagen", id: "Gagal menghapus", bn: "মুছে ফেলা ব্যর্থ হয়েছে", fa: "حذف ناموفق بود" },
  uploadFailed: { ar: "فشل الرفع", en: "Upload failed", fr: "Échec du téléchargement", tr: "Yükleme başarısız", ur: "اپ لوڈ ناکام ہوا", es: "Error al subir", de: "Hochladen fehlgeschlagen", id: "Unggah gagal", bn: "আপলোড ব্যর্থ হয়েছে", fa: "آپلود ناموفق بود" },
  loading: { ar: "جار التحميل...", en: "Loading...", fr: "Chargement...", tr: "Yükleniyor...", ur: "لوڈ ہو رہا ہے...", es: "Cargando...", de: "Laden...", id: "Memuat...", bn: "লোড হচ্ছে...", fa: "در حال بارگذاری..." },
};

function al(locale: string, key: string, vars?: Record<string, string | number>): string {
  let s = LABELS[key]?.[locale] || LABELS[key]?.en || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(`{${k}}`, String(v));
    }
  }
  return s;
}

const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

type Tab = "curricula" | "grades" | "documents";

export default function AdminCurriculaPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { languages } = useLanguages();
  const LANGUAGES = languages.map((l) => ({ code: l.code, label: l.native_name || l.name }));
  const [tab, setTab] = useState<Tab>("curricula");

  // ---- Curricula ----
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
  const [currTranslations, setCurrTranslations] = useState<Record<string, string>>({});
  const [currSelectedLang, setCurrSelectedLang] = useState("ar");
  const [currNameInput, setCurrNameInput] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [gradeId, setGradeId] = useState<number>(0);

  useEffect(() => {
    setCurrNameInput(currTranslations[currSelectedLang] || "");
  }, [currSelectedLang, currTranslations]);

  // ---- Grades ----
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [gradeLevel, setGradeLevel] = useState(0);
  const [gradeTranslations, setGradeTranslations] = useState<Record<string, string>>({});
  const [gradeSelectedLang, setGradeSelectedLang] = useState("ar");
  const [gradeNameInput, setGradeNameInput] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    setGradeNameInput(gradeTranslations[gradeSelectedLang] || "");
  }, [gradeSelectedLang, gradeTranslations]);

  // ---- Documents ----
  const [subjects, setSubjects] = useState<{ id: number; label: string }[]>([]);
  const [documents, setDocuments] = useState<CurriculumDocument[]>([]);
  const [selectedCurrId, setSelectedCurrId] = useState<number>(0);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubject, setUploadSubject] = useState<number>(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [extractingDoc, setExtractingDoc] = useState<number | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);

  const [error, setError] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cRes, gRes, sRes] = await Promise.all([api.get("/academics/curricula/"), api.get("/academics/grades/"), api.get("/academics/subjects/")]);
      setCurricula(cRes.data.results || cRes.data); setGrades(gRes.data.results || gRes.data);
      const subjList = sRes.data.results || sRes.data;
      setSubjects(subjList.map((s: any) => ({ id: s.id, label: s.translations?.[locale]?.name || s.translations?.ar?.name || s.translations?.en?.name || s.icon || `Subject ${s.id}` })));
    } catch {} finally { setIsLoading(false); }
  };

  const loadDocuments = async (curriculumId: number) => {
    if (!curriculumId) { setDocuments([]); return; }
    setLoadingDocs(true);
    try {
      const { data } = await api.get(`/academics/curricula/${curriculumId}/documents/`);
      setDocuments(data?.results ?? data ?? []);
    } catch {} finally { setLoadingDocs(false); }
  };

  const getGradeName = (id: number) => {
    const g = grades.find((g) => g.id === id);
    if (!g) return "-";
    return g.translations?.[locale]?.name || g.translations?.ar?.name || g.translations?.en?.name || `Level ${g.level}`;
  };

  const getGradeDisplay = (g: Grade) => {
    return g.translations?.[locale]?.name || g.translations?.ar?.name || g.translations?.en?.name || `Level ${g.level}`;
  };

  // ---- Curriculum CRUD ----

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currTranslations["ar"]?.trim()) { setError(al(locale, "reqNameAr")); return; }
    try {
      const translations: Record<string, { name: string }> = {};
      for (const lang of LANGUAGES) {
        if (currTranslations[lang.code]?.trim()) translations[lang.code] = { name: currTranslations[lang.code].trim() };
      }
      const payload = { translations, country, year, grade: gradeId };
      if (editingCurriculum) await api.put(`/academics/curricula/${editingCurriculum.id}/`, payload);
      else await api.post("/academics/curricula/create/", payload);
      resetForm(); fetchData();
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : al(locale, "uploadFailed")); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/academics/curricula/${id}/`); fetchData(); } catch {}
  };

  const resetForm = (open = false) => {
    setCurrTranslations({}); setCurrSelectedLang("ar"); setCurrNameInput("");
    setCountry(""); setYear(new Date().getFullYear()); setGradeId(0);
    setEditingCurriculum(null); setShowForm(open);
  };
  const startEdit = (c: Curriculum) => {
    const tr: Record<string, string> = {};
    for (const lang of LANGUAGES) if (c.translations?.[lang.code]?.name) tr[lang.code] = c.translations[lang.code].name;
    setCurrTranslations(tr); setCurrSelectedLang("ar"); setCurrNameInput(tr["ar"] || "");
    setCountry(c.country); setYear(c.year); setGradeId(c.grade);
    setEditingCurriculum(c); setShowForm(true);
  };

  // ---- Grade CRUD ----

  const openGradeForm = (g?: Grade) => {
    if (g) {
      setEditingGrade(g); setGradeLevel(g.level);
      const tr: Record<string, string> = {};
      for (const lang of LANGUAGES) if (g.translations?.[lang.code]?.name) tr[lang.code] = g.translations[lang.code].name;
      setGradeTranslations(tr); setGradeSelectedLang("ar"); setGradeNameInput(tr["ar"] || "");
    } else {
      setEditingGrade(null); setGradeLevel(grades.length);
      setGradeTranslations({}); setGradeSelectedLang("ar"); setGradeNameInput("");
    }
    setError(""); setShowGradeForm(true);
  };

  const handleSaveGrade = async () => {
    if (!gradeTranslations["ar"]?.trim()) { setError(al(locale, "reqNameAr")); return; }
    setSavingGrade(true); setError("");
    try {
      const translations: Record<string, { name: string }> = {};
      for (const lang of LANGUAGES) {
        if (gradeTranslations[lang.code]?.trim()) translations[lang.code] = { name: gradeTranslations[lang.code].trim() };
      }
      const payload = { level: gradeLevel, translations };
      if (editingGrade) {
        await api.put(`/academics/grades/${editingGrade.id}/`, payload);
      } else {
        await api.post("/academics/grades/create/", payload);
      }
      setShowGradeForm(false); await fetchData();
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : al(locale, "uploadFailed")); }
    finally { setSavingGrade(false); }
  };

  const handleDeleteGrade = async (id: number) => {
    if (!confirm(al(locale, "confirmDeleteGrade"))) return;
    try { await api.delete(`/academics/grades/${id}/`); await fetchData(); }
    catch { setError(al(locale, "deleteFailed")); }
  };

  // ---- Document CRUD ----

  const handleUploadDocument = async () => {
    if (!selectedCurrId || !uploadTitle.trim() || !uploadFile) { setError(al(locale, "reqTitleFile")); return; }
    setUploading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("curriculum", String(selectedCurrId));
      formData.append("title", uploadTitle.trim());
      formData.append("file", uploadFile);
      if (uploadSubject) formData.append("subject", String(uploadSubject));
      await api.post(`/academics/curricula/${selectedCurrId}/documents/upload/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadTitle(""); setUploadSubject(0); setUploadFile(null);
      await loadDocuments(selectedCurrId);
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : al(locale, "uploadFailed")); }
    finally { setUploading(false); }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm(al(locale, "confirmDeleteDoc"))) return;
    try { await api.delete(`/academics/documents/${id}/`); await loadDocuments(selectedCurrId); }
    catch { setError(al(locale, "deleteFailed")); }
  };

  const handleExtract = async (docId: number) => {
    setExtractingDoc(docId); setError("");
    try {
      const { data } = await api.post(`/academics/documents/${docId}/extract/`);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, extracted_text: data.extracted_text } : d));
      setExpandedDoc(docId);
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : al(locale, "extractSuccess")); }
    finally { setExtractingDoc(null); }
  };

  // ---- Render helpers ----

  const tabBtn = (key: Tab, labelKey: string) => (
    <button key={key} onClick={() => setTab(key)}
      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={{
        background: tab === key ? "var(--color-primary)" : "transparent",
        color: tab === key ? "#FFFFFF" : "var(--color-text-secondary)",
      }}
    >{al(locale, labelKey)}</button>
  );

  const surface = { background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("academy.curricula")}</h1>

        {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}>
          {tabBtn("curricula", "curriculaTab")}
          {tabBtn("grades", "gradesTab")}
          {tabBtn("documents", "documentsTab")}
        </div>

        {/* ===== CURRICULA TAB ===== */}
        {tab === "curricula" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{al(locale, "curriculaDesc")}</p>
              <button onClick={() => resetForm(true)} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>+ {t("common.add")}</button>
            </div>

            {showForm && (
              <div className="rounded-3xl shadow-xl p-6 mb-8" style={surface}>
                <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{editingCurriculum ? al(locale, "editCurriculum") : al(locale, "addCurriculum")}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "language")}</label>
                      <select value={currSelectedLang} onChange={(e) => setCurrSelectedLang(e.target.value)}
                        className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                        {LANGUAGES.map(l => (
                          <option key={l.code} value={l.code}>{l.label} {currTranslations[l.code]?.trim() ? "✅" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "name")} ({LANGUAGES.find(l => l.code === currSelectedLang)?.label})</label>
                      <input type="text" value={currNameInput} onChange={(e) => { setCurrNameInput(e.target.value); setCurrTranslations(prev => ({ ...prev, [currSelectedLang]: e.target.value })); }}
                        className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                        dir={currSelectedLang === "ar" || currSelectedLang === "ur" ? "rtl" : "ltr"} />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {LANGUAGES.map(l => (
                      <span key={l.code} className={`px-2 py-1 rounded-lg text-xs font-medium ${currTranslations[l.code]?.trim() ? "" : "opacity-40"}`}
                        style={{ background: currSelectedLang === l.code ? "var(--color-primary)" : "var(--color-background)", color: currSelectedLang === l.code ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                        onClick={() => setCurrSelectedLang(l.code)}>{l.code} {currTranslations[l.code]?.trim() ? "✓" : ""}</span>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "country")}</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required /></div>
                    <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "year")}</label><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required /></div>
                    <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "grade")}</label>
                      <select value={gradeId} onChange={(e) => setGradeId(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required>
                        <option value={0}>{t("academy.selectGrade")}</option>
                        {grades.sort((a, b) => a.level - b.level).map((g) => (<option key={g.id} value={g.id}>{getGradeDisplay(g)}</option>))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{al(locale, "filledCount", { n: LANGUAGES.filter(l => currTranslations[l.code]?.trim()).length, t: LANGUAGES.length })}</p>
                  <div className="flex gap-3">
                    <button type="submit" className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{al(locale, "save")}</button>
                    <button type="button" onClick={() => resetForm()} className="px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{al(locale, "cancel")}</button>
                  </div>
                </form>
              </div>
            )}

            {isLoading ? <p style={{ color: "var(--color-text-muted)" }}>{al(locale, "loading")}</p> : curricula.length === 0 ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p> : (
              <div className="rounded-3xl shadow-xl overflow-hidden" style={surface}>
                <table className="w-full">
                  <thead style={{ backgroundColor: "var(--color-background-secondary)" }}>
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "name")}</th>
                      <th className="col-hide-md px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "country")}</th>
                      <th className="col-hide-sm px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "year")}</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "grade")}</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                    {curricula.map((c) => (
                      <tr key={c.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                        <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{c.translations?.[locale]?.name || c.translations?.ar?.name || c.name || "-"}</td>
                        <td className="col-hide-md px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{c.country}</td>
                        <td className="col-hide-sm px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{c.year}</td>
                        <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{getGradeName(c.grade)}</span></td>
                        <td className="px-6 py-4 flex gap-3">
                          <button onClick={() => startEdit(c)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                          <button onClick={() => handleDelete(c.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ===== DOCUMENTS TAB ===== */}
        {tab === "documents" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{al(locale, "documentsDesc")}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "selectCurriculum")}</label>
                <select value={selectedCurrId} onChange={(e) => { const id = Number(e.target.value); setSelectedCurrId(id); if (id) loadDocuments(id); }}
                  className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                  <option value={0}>{al(locale, "selectCurriculumPlaceholder")}</option>
                  {curricula.map(c => (
                    <option key={c.id} value={c.id}>{c.translations?.[locale]?.name || c.translations?.ar?.name || c.name || `Curriculum ${c.id}`} - {c.country} ({c.year})</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCurrId ? (
              <>
                <div className="rounded-3xl shadow-xl p-6 mb-8" style={surface}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{al(locale, "uploadDocument")}</h2>
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "title")}</label>
                      <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} placeholder={al(locale, "docPlaceholder")} /></div>
                    <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "subjectOptional")}</label>
                      <select value={uploadSubject} onChange={(e) => setUploadSubject(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                        <option value={0}>{al(locale, "selectSubjectPlaceholder")}</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "file")}</label>
                      <input type="file" accept=".pdf,.txt" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} /></div>
                  </div>
                  <button onClick={handleUploadDocument} disabled={uploading}
                    className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
                    style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{uploading ? al(locale, "uploading") : al(locale, "uploadBtn")}</button>
                </div>

                {loadingDocs ? <p style={{ color: "var(--color-text-muted)" }}>{al(locale, "loading")}</p> : documents.length === 0 ? (
                  <p style={{ color: "var(--color-text-muted)" }}>{al(locale, "noDocuments")}</p>
                ) : (
                  <div className="rounded-3xl shadow-xl overflow-hidden" style={surface}>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full">
                        <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                          <tr>
                            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "title")}</th>
                            <th className="col-hide-md px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "subject")}</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "file")}</th>
                            <th className="col-hide-sm px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "dateUploaded")}</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}></th>
                          </tr>
                        </thead>
                        <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                          {documents.map(d => {
                            const subj = subjects.find(s => s.id === d.subject);
                            return (
                              <Fragment key={d.id}>
                                <tr style={{ borderTop: "1px solid var(--color-border)" }}>
                                  <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{d.title}</td>
                                  <td className="col-hide-md px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{subj?.label || "-"}</td>
                                  <td className="px-6 py-4"><a href={d.download_url || d.file || d.external_url || "#"} target="_blank" rel="noopener noreferrer" className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>📄 {al(locale, "view")}</a></td>
                                  <td className="col-hide-sm px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{new Date(d.created_at).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 flex gap-2 items-center">
                                    <button onClick={() => handleExtract(d.id)} disabled={extractingDoc === d.id}
                                      className="font-medium text-sm transition-colors disabled:opacity-50"
                                      style={{ color: "var(--color-primary)" }}>
                                      {extractingDoc === d.id ? al(locale, "extracting") : al(locale, "extract")}
                                    </button>
                                    {d.extracted_text && (
                                      <button onClick={() => setExpandedDoc(expandedDoc === d.id ? null : d.id)}
                                        className="font-medium text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                        {expandedDoc === d.id ? "▲" : "▼"}
                                      </button>
                                    )}
                                    <button onClick={() => handleDeleteDocument(d.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{al(locale, "delete")}</button>
                                  </td>
                                </tr>
                                {expandedDoc === d.id && d.extracted_text && (
                                  <tr style={{ background: "var(--color-background)" }}>
                                    <td colSpan={5} className="px-6 py-4">
                                      <div className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "extractedText")}</div>
                                      <pre className="text-xs whitespace-pre-wrap max-h-48 overflow-y-auto rounded-xl p-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>{d.extracted_text}</pre>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>
                <p>{al(locale, "selectCurrHint")}</p>
              </div>
            )}
          </>
        )}

        {/* ===== GRADES TAB ===== */}
        {tab === "grades" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{al(locale, "gradesDesc")}</p>
              <button onClick={() => openGradeForm()} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>+ {al(locale, "addGrade")}</button>
            </div>

            {showGradeForm && (
              <div className="rounded-3xl shadow-xl p-6 mb-8" style={surface}>
                <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{editingGrade ? al(locale, "editGrade") : al(locale, "addGrade")}</h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "levelOrder")}</label>
                      <input type="number" value={gradeLevel} onChange={(e) => setGradeLevel(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} /></div>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "language")}</label>
                      <select value={gradeSelectedLang} onChange={(e) => setGradeSelectedLang(e.target.value)}
                        className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                        {LANGUAGES.map(l => (
                          <option key={l.code} value={l.code}>{l.label} {gradeTranslations[l.code]?.trim() ? "✅" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{al(locale, "name")} ({LANGUAGES.find(l => l.code === gradeSelectedLang)?.label})</label>
                      <input type="text" value={gradeNameInput} onChange={(e) => { setGradeNameInput(e.target.value); setGradeTranslations(prev => ({ ...prev, [gradeSelectedLang]: e.target.value })); }}
                        className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                        dir={gradeSelectedLang === "ar" || gradeSelectedLang === "ur" ? "rtl" : "ltr"} />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {LANGUAGES.map(l => (
                      <span key={l.code} className={`px-2 py-1 rounded-lg text-xs font-medium ${gradeTranslations[l.code]?.trim() ? "" : "opacity-40"}`}
                        style={{ background: gradeSelectedLang === l.code ? "var(--color-primary)" : "var(--color-background)", color: gradeSelectedLang === l.code ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                        onClick={() => setGradeSelectedLang(l.code)}>{l.code} {gradeTranslations[l.code]?.trim() ? "✓" : ""}</span>
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{al(locale, "filledCount", { n: LANGUAGES.filter(l => gradeTranslations[l.code]?.trim()).length, t: LANGUAGES.length })}</p>
                  <div className="flex gap-3">
                    <button onClick={handleSaveGrade} disabled={savingGrade}
                      className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
                      style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{savingGrade ? al(locale, "saving") : al(locale, "save")}</button>
                    <button onClick={() => setShowGradeForm(false)} className="px-6 py-2.5 rounded-xl font-semibold transition-all"
                      style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{al(locale, "cancel")}</button>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? <p style={{ color: "var(--color-text-muted)" }}>{al(locale, "loading")}</p> : grades.length === 0 ? (
              <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>
                <p className="text-lg mb-4">{al(locale, "noGrades")}</p>
                <p className="text-sm">{al(locale, "addGradesHint")}</p>
              </div>
            ) : (
              <div className="rounded-3xl shadow-xl overflow-hidden" style={surface}>
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full">
                    <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "level")}</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "nameAr")}</th>
                        <th className="col-hide-md px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{al(locale, "nameEn")}</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                      {grades.sort((a, b) => a.level - b.level).map((g) => (
                        <tr key={g.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                          <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{g.level}</td>
                          <td className="px-6 py-4" style={{ color: "var(--color-text)" }}>{g.translations?.ar?.name || "-"}</td>
                          <td className="col-hide-md px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{g.translations?.en?.name || "-"}</td>
                          <td className="px-6 py-4 flex gap-3">
                            <button onClick={() => openGradeForm(g)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                            <button onClick={() => handleDeleteGrade(g.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
