const STORAGE_KEY = "pulso-seen-alerts";
export const SEEN_EVENT = "pulso:alerts-seen";
const MAX_REMEMBERED = 500;

/** Remembered per browser: seeing an alert is a personal, low-stakes state. */
export function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function markSeen(ids: string[]): void {
  const seen = [...new Set([...readSeen(), ...ids])].slice(-MAX_REMEMBERED);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // Without storage every alert simply stays new.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}
