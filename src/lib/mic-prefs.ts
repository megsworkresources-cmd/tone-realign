/**
 * Mic device preference persistence — shared by MicPicker (UI) and the
 * capture pages (Practice, Translate), which need the saved device id when
 * starting a take. Kept out of the MicPicker component file so that file
 * only exports components (react-refresh rule).
 */

const STORAGE_KEY = "shiftedtone:micDeviceId";

/** The user's saved mic choice, or null for the browser default. */
export function getSavedMicDeviceId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persist the mic choice; pass null to forget (browser default). */
export function saveMicDeviceId(deviceId: string | null): void {
  try {
    if (deviceId) {
      localStorage.setItem(STORAGE_KEY, deviceId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // persistence is best-effort
  }
}
