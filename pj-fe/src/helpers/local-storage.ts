export const getValueFromLocalStorage = (key: string, defaultValue: string = ''): string => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const value = window.localStorage.getItem(key);
    return value ?? defaultValue;
  } catch (err) {
    console.warn(`Failed to get localStorage key "${key}"`, err);
    return defaultValue;
  }
};

export const saveValueToLocalStorage = (key: string, value: any): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, stringValue);
    return true;
  } catch (err) {
    console.warn(`Failed to save localStorage key "${key}"`, err);
    return false;
  }
};

export const removeValuesFromLocalStorage = (...keys: string[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    keys.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (err) {
    console.warn(`Failed to remove localStorage keys`, err);
  }
};

const isSessionStorageAvailable = () => {
  try {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  } catch {
    return false;
  }
};

export const safeSessionStorage = {
  getItem(key: string) {
    if (!isSessionStorageAvailable()) {
      return null;
    }
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    if (!isSessionStorageAvailable()) {
      return;
    }
    try {
      sessionStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string) {
    if (!isSessionStorageAvailable()) {
      return;
    }
    try {
      sessionStorage.removeItem(key);
    } catch {}
  },
};
