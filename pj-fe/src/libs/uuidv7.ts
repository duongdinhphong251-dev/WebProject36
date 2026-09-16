import { uuidv7 } from 'uuidv7';
import keyLocalstorage from '@/constants/key-localstorage';
import { getValueFromLocalStorage, saveValueToLocalStorage } from '@/helpers/local-storage';

const UUIDV7_KEY = keyLocalstorage.Uuidv7;

let cachedUuid: string | null = null;

export const getOrCreateUuidv7 = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (cachedUuid) {
    return cachedUuid;
  }

  try {
    const stored = getValueFromLocalStorage(UUIDV7_KEY);
    if (stored) {
      cachedUuid = stored;
      return cachedUuid;
    }

    const newUuid = uuidv7();
    saveValueToLocalStorage(UUIDV7_KEY, newUuid);
    cachedUuid = newUuid;
    return cachedUuid;
  } catch {
    return null;
  }
};
