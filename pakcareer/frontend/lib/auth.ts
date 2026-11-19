// ── Counsellor dashboard key (kept for this browser tab only) ─────────────────
const KEY = "pakcareer-org-key";

export function getOrgKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setOrgKey(key: string): void {
  try {
    sessionStorage.setItem(KEY, key);
  } catch {
    /* storage blocked: key lives only until reload */
  }
}

export function clearOrgKey(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
