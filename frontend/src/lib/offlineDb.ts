import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'afaq-tech-offline';
const DB_VERSION = 1;

export interface PendingAttendance {
  id: string;
  studentId: number;
  sectionId: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  synced: boolean;
  createdAt: string;
}

export interface PendingSubmission {
  id: string;
  assignmentId: number;
  studentId: number;
  content: string;
  synced: boolean;
  createdAt: string;
}

export interface CachedTimetable {
  id: number;
  sectionId: number;
  subjectName: string;
  dayOfWeek: number;
  periodName: string;
  teacherName: string;
  cachedAt: string;
}

export interface CachedGrade {
  id: number;
  studentId: number;
  categoryName: string;
  score: number;
  maxScore: number;
  percentage: number;
  cachedAt: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pendingAttendance')) {
          db.createObjectStore('pendingAttendance', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pendingSubmissions')) {
          db.createObjectStore('pendingSubmissions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cachedTimetable')) {
          db.createObjectStore('cachedTimetable', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cachedGrades')) {
          db.createObjectStore('cachedGrades', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function addPendingAttendance(record: Omit<PendingAttendance, 'id' | 'synced' | 'createdAt'>) {
  const db = await getDB();
  const entry: PendingAttendance = {
    ...record,
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    synced: false,
    createdAt: new Date().toISOString(),
  };
  await db.put('pendingAttendance', entry);
  return entry;
}

export async function addPendingSubmission(record: Omit<PendingSubmission, 'id' | 'synced' | 'createdAt'>) {
  const db = await getDB();
  const entry: PendingSubmission = {
    ...record,
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    synced: false,
    createdAt: new Date().toISOString(),
  };
  await db.put('pendingSubmissions', entry);
  return entry;
}

export async function getPendingAttendance(): Promise<PendingAttendance[]> {
  const db = await getDB();
  return db.getAll('pendingAttendance');
}

export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  const db = await getDB();
  return db.getAll('pendingSubmissions');
}

export async function markAttendanceSynced(id: string) {
  const db = await getDB();
  const record = await db.get('pendingAttendance', id);
  if (record) {
    record.synced = true;
    await db.put('pendingAttendance', record);
  }
}

export async function markSubmissionSynced(id: string) {
  const db = await getDB();
  const record = await db.get('pendingSubmissions', id);
  if (record) {
    record.synced = true;
    await db.put('pendingSubmissions', record);
  }
}

export async function cacheTimetable(slots: CachedTimetable[]) {
  const db = await getDB();
  const tx = db.transaction('cachedTimetable', 'readwrite');
  await tx.store.clear();
  for (const slot of slots) {
    await tx.store.put({ ...slot, cachedAt: new Date().toISOString() });
  }
  await tx.done;
}

export async function getCachedTimetable(): Promise<CachedTimetable[]> {
  const db = await getDB();
  return db.getAll('cachedTimetable');
}

export async function cacheGrades(grades: CachedGrade[]) {
  const db = await getDB();
  const tx = db.transaction('cachedGrades', 'readwrite');
  await tx.store.clear();
  for (const grade of grades) {
    await tx.store.put({ ...grade, cachedAt: new Date().toISOString() });
  }
  await tx.done;
}

export async function getCachedGrades(): Promise<CachedGrade[]> {
  const db = await getDB();
  return db.getAll('cachedGrades');
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  const attendance = await db.getAll('pendingAttendance');
  const submissions = await db.getAll('pendingSubmissions');
  return attendance.filter(a => !a.synced).length + submissions.filter(s => !s.synced).length;
}

export async function clearSyncedRecords() {
  const db = await getDB();

  const attendance = await db.getAll('pendingAttendance');
  for (const record of attendance) {
    if (record.synced) {
      await db.delete('pendingAttendance', record.id);
    }
  }

  const submissions = await db.getAll('pendingSubmissions');
  for (const record of submissions) {
    if (record.synced) {
      await db.delete('pendingSubmissions', record.id);
    }
  }
}
