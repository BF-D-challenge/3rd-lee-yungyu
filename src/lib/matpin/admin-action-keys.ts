const STORAGE_KEY = "matpin:admin:action-keys:v1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FINGERPRINT_PATTERN = /^(?:[a-f0-9]{64}|fallback-[a-f0-9]{8})$/;
const MAX_KEYS = 100;

type ActionKeyStorage = Pick<Storage, "getItem" | "setItem">;

function browserStorage(storage?: ActionKeyStorage): ActionKeyStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function fallbackFingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fallback-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export async function createMatpinAdminActionIntent(
  action: string,
  url: string,
  body: Record<string, unknown>,
): Promise<string> {
  const value = JSON.stringify([action, url, body]);
  try {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return fallbackFingerprint(value);
  }
}

export function readMatpinAdminActionKeys(storage?: ActionKeyStorage): Map<string, string> {
  const target = browserStorage(storage);
  if (!target) return new Map();
  try {
    const parsed = JSON.parse(target.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return new Map();
    const entries = parsed.flatMap((entry): Array<[string, string]> => {
      if (!Array.isArray(entry) || entry.length !== 2) return [];
      const [intent, key] = entry;
      return typeof intent === "string"
        && typeof key === "string"
        && FINGERPRINT_PATTERN.test(intent)
        && UUID_PATTERN.test(key)
        ? [[intent, key]]
        : [];
    }).slice(-MAX_KEYS);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

export function persistMatpinAdminActionKeys(
  keys: Map<string, string>,
  storage?: ActionKeyStorage,
): void {
  const target = browserStorage(storage);
  if (!target) return;
  const entries = [...keys.entries()]
    .filter(([intent, key]) => FINGERPRINT_PATTERN.test(intent) && UUID_PATTERN.test(key))
    .slice(-MAX_KEYS);
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // 브라우저 저장소가 차단돼도 현재 탭 메모리의 멱등성 키는 유지한다.
  }
}
