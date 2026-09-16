"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorageState } from "./useLocalStorageState";

const SAVED_SPAS_KEY = "tuoi_saved_spas";

export function useSavedSpas() {
  const [savedSpaIds, setSavedSpaIds] = useLocalStorageState<string[]>(
    SAVED_SPAS_KEY,
    {
      defaultValue: [],
      syncTabs: true,
    },
  );

  const ids = useMemo(
    () => (Array.isArray(savedSpaIds) ? savedSpaIds.map(String) : []),
    [savedSpaIds],
  );

  const isSaved = useCallback(
    (spaId: string | number | undefined | null): boolean => {
      if (spaId == null) return false;
      return ids.includes(String(spaId));
    },
    [ids],
  );

  const toggleSaveSpa = useCallback(
    (spaId: string | number | undefined | null) => {
      if (spaId == null) return;
      const idStr = String(spaId);
      setSavedSpaIds((prev) => {
        const current = Array.isArray(prev) ? prev.map(String) : [];
        if (current.includes(idStr)) {
          return current.filter((i) => i !== idStr);
        }
        return [...current, idStr];
      });
    },
    [setSavedSpaIds],
  );

  const saveSpa = useCallback(
    (spaId: string | number | undefined | null) => {
      if (spaId == null) return;
      const idStr = String(spaId);
      setSavedSpaIds((prev) => {
        const current = Array.isArray(prev) ? prev.map(String) : [];
        if (current.includes(idStr)) return current;
        return [...current, idStr];
      });
    },
    [setSavedSpaIds],
  );

  const removeSpa = useCallback(
    (spaId: string | number | undefined | null) => {
      if (spaId == null) return;
      const idStr = String(spaId);
      setSavedSpaIds((prev) => {
        const current = Array.isArray(prev) ? prev.map(String) : [];
        return current.filter((i) => i !== idStr);
      });
    },
    [setSavedSpaIds],
  );

  return {
    savedSpaIds: ids,
    count: ids.length,
    isSaved,
    toggleSaveSpa,
    saveSpa,
    removeSpa,
  };
}
