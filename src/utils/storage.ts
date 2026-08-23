export const isChromeExtension = (): boolean => {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
};

export async function storageGet<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
  if (isChromeExtension()) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (err) {
      console.warn(`chrome.storage.local.get('${key}') failed, falling back to localStorage`, err);
    }
  }

  // Fallback to localStorage
  try {
    const item = localStorage.getItem(`zenith_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function storageSet(key: string, value: any): Promise<void> {
  if (isChromeExtension()) {
    try {
      await chrome.storage.local.set({ [key]: value });
      return;
    } catch (err) {
      console.warn(`chrome.storage.local.set('${key}') failed, falling back to localStorage`, err);
    }
  }

  // Fallback to localStorage
  try {
    localStorage.setItem(`zenith_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error(`localStorage.setItem('${key}') failed`, err);
  }
}

export async function storageRemove(key: string): Promise<void> {
  if (isChromeExtension()) {
    try {
      await chrome.storage.local.remove(key);
      return;
    } catch (err) {
      console.warn(`chrome.storage.local.remove('${key}') failed`, err);
    }
  }

  try {
    localStorage.removeItem(`zenith_${key}`);
  } catch (err) {
    console.error(`localStorage.removeItem('${key}') failed`, err);
  }
}
