/**
 * useOfflineSync.js
 *
 * Hook quản lý dữ liệu điểm danh offline:
 *  - Lưu vào IndexedDB khi không có mạng
 *  - Tự động sync lên server khi có mạng trở lại
 *
 * Tại sao dùng IndexedDB thay vì localStorage?
 *  - localStorage giới hạn ~5MB
 *  - IndexedDB có thể lưu hàng trăm MB, phù hợp lưu embeddings
 *  - IndexedDB hỗ trợ async, không block UI
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { syncOfflineAttendance } from '../service/faceAttendance.api';

const DB_NAME = 'FaceAttendanceDB';
const DB_VERSION = 1;
const STORE_PENDING = 'pendingAttendance'; // Điểm danh chờ sync

// ── Helpers IndexedDB ──────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        // keyPath: khoá chính = studentId + date (tránh trùng)
        const store = db.createObjectStore(STORE_PENDING, {
          keyPath: 'id', // id = `${studentId}_${date}`
        });
        store.createIndex('synced', 'synced'); // để lọc chưa sync
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveRecord(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    tx.objectStore(STORE_PENDING).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getPendingRecords() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readonly');
    const store = tx.objectStore(STORE_PENDING);
    const index = store.index('synced');
    const req = index.getAll(0); // synced = 0 → chưa sync
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function markSynced(ids) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    const store = tx.objectStore(STORE_PENDING);
    ids.forEach((id) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (record) {
          record.synced = 1;
          store.put(record);
        }
      };
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false); // tránh chạy sync 2 lần cùng lúc

  // Theo dõi trạng thái mạng
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Đếm số bản ghi đang chờ sync
  const refreshPendingCount = useCallback(async () => {
    try {
      const records = await getPendingRecords();
      setPendingCount(records.length);
    } catch {
      // IndexedDB không khả dụng → bỏ qua
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  /**
   * Lưu 1 bản ghi điểm danh vào IndexedDB (khi offline)
   */
  const saveOfflineRecord = useCallback(
    async ({ studentId, classId, date, checkInTime, checkInTimeString }) => {
      const id = `${studentId}_${date}`;
      await saveRecord({
        id,
        studentId,
        classId,
        date,
        checkInTime: checkInTime || new Date().toISOString(),
        checkInTimeString:
          checkInTimeString ||
          new Date().toTimeString().slice(0, 5),
        synced: 0,
        savedAt: new Date().toISOString(),
      });
      await refreshPendingCount();
    },
    [refreshPendingCount]
  );

  /**
   * Đẩy toàn bộ dữ liệu chưa sync lên server
   * Được gọi tự động khi có mạng, hoặc thủ công
   */
  const syncNow = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const pending = await getPendingRecords();
      if (pending.length === 0) return;

      const result = await syncOfflineAttendance(
        pending.map(({ studentId, classId, date, checkInTime, checkInTimeString }) => ({
          studentId,
          classId,
          date,
          checkInTime,
          checkInTimeString,
        }))
      );

      // Đánh dấu đã sync thành công (kể cả skipped = đã tồn tại online)
      const successIds = result.results
        ?.filter((r) => r.action === 'created' || r.action === 'skipped')
        .map((r) => `${r.studentId}_${r.date}`);

      if (successIds?.length) {
        await markSynced(successIds);
        await refreshPendingCount();
      }
    } catch (err) {
      console.error('Sync thất bại:', err);
      // Không throw → retry lần sau khi có mạng
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  // Tự động sync khi mạng trở lại
  useEffect(() => {
    if (isOnline) {
      syncNow();
    }
  }, [isOnline, syncNow]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    saveOfflineRecord,
    syncNow,
  };
}
