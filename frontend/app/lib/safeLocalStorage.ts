// Safe localStorage helpers to avoid runtime errors in SSR or when storage is disabled
export function lsGet(key: string): string | null {
  try {
    if (typeof window === "undefined" || !window?.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function lsSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined" || !window?.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota/permission errors
  }
}

export function lsRemove(key: string): void {
  try {
    if (typeof window === "undefined" || !window?.localStorage) return;
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
