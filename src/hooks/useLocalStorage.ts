import { useState, useEffect, useCallback } from 'react';

// Mapa de migración automática desde keys previas hacia el estándar versionado `findash:*:v1`
const LEGACY_KEY_MAP: Record<string, string> = {
  'findash:pinned:v1': 'findash_pinned_v2',
  'findash:fav_stocks:v1': 'findash_fav_stocks',
  'findash:countries:v1': 'findash_countries',
  'findash:cartera:v1': 'findash_cartera',
};

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      let item = window.localStorage.getItem(key);
      if (!item && LEGACY_KEY_MAP[key]) {
        const legacyItem = window.localStorage.getItem(LEGACY_KEY_MAP[key]);
        if (legacyItem) {
          item = legacyItem;
          window.localStorage.setItem(key, legacyItem);
        }
      }
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed != null) {
          setStoredValue(parsed);
        }
      }
    } catch {
      // Si el JSON está corrupto, limpiamos la key y mantenemos initialValue seguro
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  }, [key]);

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch {
        // ignore quota errors
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
