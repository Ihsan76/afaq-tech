"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getPendingCount, clearSyncedRecords } from "@/lib/offlineDb";
import { api } from "@/lib/api";

export default function OfflineIndicator() {
  const t = useTranslations();
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncPending();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {}
  };

  const syncPending = async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const { getPendingAttendance, getPendingSubmissions, markAttendanceSynced, markSubmissionSynced } = await import('@/lib/offlineDb');

      const pendingAttendance = await getPendingAttendance();
      for (const record of pendingAttendance) {
        if (!record.synced) {
          try {
            await api.post('/schools/attendance/', {
              student: record.studentId,
              section: record.sectionId,
              date: record.date,
              status: record.status,
            });
            await markAttendanceSynced(record.id);
          } catch {}
        }
      }

      const pendingSubmissions = await getPendingSubmissions();
      for (const record of pendingSubmissions) {
        if (!record.synced) {
          try {
            await api.post(`/schools/assignments/${record.assignmentId}/submit/`, {
              content: record.content,
            });
            await markSubmissionSynced(record.id);
          } catch {}
        }
      }

      await clearSyncedRecords();
      await updatePendingCount();
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 rounded-xl px-4 py-3 shadow-lg transition-all ${
        isOnline ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isOnline ? '🟢' : '🔴'}</span>
          <span className="font-medium">
            {isOnline
              ? t('offlineSync.syncing', { count: pendingCount })
              : t('offlineSync.offline', { count: pendingCount })
            }
          </span>
        </div>
        {isOnline && pendingCount > 0 && (
          <button
            onClick={syncPending}
            disabled={isSyncing}
            className="rounded-lg bg-white/20 px-3 py-1 text-sm font-medium hover:bg-white/30 disabled:opacity-50"
          >
            {isSyncing ? t('offlineSync.syncingNow') : t('offlineSync.syncNow')}
          </button>
        )}
      </div>
    </div>
  );
}
