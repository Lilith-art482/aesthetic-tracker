import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

function readLocal<T>(key: string, fallback: T, migrate?: (stored: unknown) => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return migrate ? migrate(parsed) : (parsed as T);
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { }
}

function dataDocRef(uid: string, key: string) {
  return doc(db, 'users', uid, 'data', key);
}

/**
 * Drop-in replacement for useLocalStorage that also syncs the value
 * to Firestore (users/{uid}/data/{key}) for the signed-in user.
 * Local writes are applied instantly, then pushed to the cloud.
 * Cloud changes (from other devices) overwrite local values.
 */
export function useSynced<T>(
  key: string,
  fallback: T,
  migrate?: (stored: unknown) => T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [value, setValueState] = useState<T>(() => readLocal(key, fallback, migrate));

  const lastPushedRef = useRef<string | null>(null);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;
  const migrateRef = useRef(migrate);
  migrateRef.current = migrate;

  // Subscribe to the cloud document
  useEffect(() => {
    if (!uid) return;
    const docRef = dataDocRef(uid, key);

    const unsub = onSnapshot(
      docRef,
      snap => {
        const cloud: string | null = snap.exists() && snap.data().value != null
          ? String(snap.data().value)
          : null;

        if (cloud === null) {
          // Nothing in the cloud yet — migrate local data up if present
          const localJson = JSON.stringify(readLocal(key, fallbackRef.current, migrateRef.current));
          const fallbackJson = JSON.stringify(fallbackRef.current);
          if (localJson !== fallbackJson) {
            setDoc(docRef, { value: localJson }).catch(() => { });
          }
          return;
        }

        // Ignore our own echoes
        if (cloud === lastPushedRef.current) return;

        const localJson = JSON.stringify(readLocal(key, fallbackRef.current, migrateRef.current));
        if (cloud === localJson) return;

        try {
          const parsed = migrateRef.current
            ? migrateRef.current(JSON.parse(cloud))
            : (JSON.parse(cloud) as T);
          writeLocal(key, parsed);
          setValueState(parsed);
        } catch { }
      },
      () => { },
    );

    return () => unsub();
  }, [uid, key]);

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setValueState(prev => {
      const resolved = next instanceof Function ? next(prev) : next;
      writeLocal(key, resolved);

      if (uid) {
        const json = JSON.stringify(resolved);
        lastPushedRef.current = json;
        setDoc(dataDocRef(uid, key), { value: json }).catch(() => { });
      }

      return resolved;
    });
  }, [key, uid]);

  return [value, setValue];
}
