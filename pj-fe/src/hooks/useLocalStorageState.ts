import { useCallback, useDebugValue, useRef, useSyncExternalStore } from 'react';

type Updater<T> = (prev: T) => T;
type SetStateAction<T> = T | Updater<T>;

interface Options<T> {
  defaultValue: T | (() => T);
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  syncTabs?: boolean;
};

// ---------- internal store (module-level) ----------
const listeners = new Map<string, Set<() => void>>();

// Cache snapshot by key + raw string to keep referential stability
const cache = new Map<string, { raw: string; value: unknown }>();

function ensureSet(key: string) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  return set;
}

function emit(key: string) {
  const set = listeners.get(key);
  if (!set) {
    return;
  }
  for (const cb of set) {
    cb();
  }
}

function subscribeKey(key: string, cb: () => void) {
  const set = ensureSet(key);
  set.add(cb);

  return () => {
    set.delete(cb);
    if (set.size === 0) {
      listeners.delete(key);
    }
  };
}

function resolveDefault<T>(dv: T | (() => T)): T {
  return typeof dv === 'function' ? (dv as () => T)() : dv;
}

function safeReadRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteRaw(key: string, raw: string) {
  try {
    window.localStorage.setItem(key, raw);
  } catch { }
}

function safeRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch { }
}

/**
 * For tests only (Vitest/Jest) to avoid state leak across test cases.
 */
export function __resetLocalStorageListenersForTests() {
  listeners.clear();
  cache.clear();
}

/**
 * useLocalStorageState
 *
 * Notes:
 * - localStorage is not reactive by itself. This hook makes it reactive (same-tab + cross-tab).
 * - Avoid storing Function values as T, because SetStateAction uses functions as updaters.
 *   If you must, wrap it: { fn: () => void }.
 */
export function useLocalStorageState<T>(key: string, options: Options<T>) {
  const {
    defaultValue,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncTabs = true,
  } = options;

  // Keep options stable without forcing callers to memoize
  const defaultRef = useRef(defaultValue);
  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);

  // eslint-disable-next-line react-hooks/refs
  defaultRef.current = defaultValue;
  // eslint-disable-next-line react-hooks/refs
  serializeRef.current = serialize;
  // eslint-disable-next-line react-hooks/refs
  deserializeRef.current = deserialize;

  const getServerSnapshot = useCallback(() => resolveDefault(defaultRef.current), []);

  const readCurrent = useCallback((): T => {
    // SSR / non-browser
    if (typeof window === 'undefined') {
      return resolveDefault(defaultRef.current);
    }

    const raw = safeReadRaw(key);
    if (raw == null) {
      const prev = cache.get(key);
      if (prev && prev.raw === '__NULL__') {
        return prev.value as T;
      }
      const val = resolveDefault(defaultRef.current);
      cache.set(key, { raw: '__NULL__', value: val });
      return val;
    }

    const prev = cache.get(key);
    if (prev && prev.raw === raw) {
      return prev.value as T;
    }

    try {
      const val = (deserializeRef.current as (s: string) => T)(raw);
      cache.set(key, { raw, value: val });
      return val;
    } catch {
      return resolveDefault(defaultRef.current);
    }
  }, [key]);

  const value = useSyncExternalStore(
    (cb) => {
      const unsub = subscribeKey(key, cb);

      if (!syncTabs || typeof window === 'undefined') {
        return unsub;
      }

      const onStorage = (e: StorageEvent) => {
        if (e.storageArea === window.localStorage && e.key === key) {
          cb();
        }
      };

      window.addEventListener('storage', onStorage);
      return () => {
        window.removeEventListener('storage', onStorage);
        unsub();
      };
    },
    readCurrent,
    getServerSnapshot,
  );

  const setValue = useCallback(
    (next: SetStateAction<T>) => {
      if (typeof window === 'undefined') {
        return;
      }

      const prev = readCurrent();

      const resolved
        = typeof next === 'function' ? (next as Updater<T>)(prev) : next;

      const raw = (serializeRef.current as (v: T) => string)(resolved);
      safeWriteRaw(key, raw);

      cache.set(key, { raw, value: resolved });
      emit(key);
    },
    [key, readCurrent],
  );

  const remove = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    safeRemove(key);
    cache.delete(key);
    emit(key);
  }, [key]);

  useDebugValue({ key, value });

  return [value, setValue, remove] as const;
}
