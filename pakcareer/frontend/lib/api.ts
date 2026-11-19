// ── Typed API fetch wrappers ──────────────────────────────────────────────────
import type {
  AnalyticsData,
  AssessmentPayload,
  OrgRecord,
  PredictResponse,
  SessionRecord,
  SessionsResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...init?.headers },
      ...init,
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const errJson = await res.json();
        detail = errJson.detail || errJson.error || JSON.stringify(errJson);
      } catch {
        detail = await res.text();
      }
      throw new Error(`API ${path} → ${res.status}: ${detail}`);
    }
    return res.json() as Promise<T>;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith("API ")) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to reach backend at ${url} (${msg}). Please verify FastAPI is running on port 8000.`);
  }
}

// ── Prediction ────────────────────────────────────────────────────────────────

export function fetchPredict(payload: AssessmentPayload): Promise<PredictResponse> {
  return apiFetch<PredictResponse>("/api/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function fetchSessions(params?: {
  org_code?: string;
  limit?: number;
  offset?: number;
}): Promise<SessionsResponse> {
  const qs = new URLSearchParams();
  if (params?.org_code) qs.set("org_code", params.org_code);
  if (params?.limit)    qs.set("limit", String(params.limit));
  if (params?.offset)   qs.set("offset", String(params.offset));
  return apiFetch<SessionsResponse>(`/api/sessions?${qs}`);
}

export function fetchSession(id: string): Promise<SessionRecord> {
  return apiFetch<SessionRecord>(`/api/sessions/${id}`);
}

export function fetchAnalytics(org_code?: string): Promise<AnalyticsData> {
  const qs = org_code ? `?org_code=${encodeURIComponent(org_code)}` : "";
  return apiFetch<AnalyticsData>(`/api/sessions/analytics${qs}`);
}

export function patchNotes(id: string, notes: string): Promise<{ session_id: string; notes: string }> {
  return apiFetch(`/api/sessions/${id}/notes`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}

export function fetchPdfUrl(id: string): string {
  return `${BASE}/api/sessions/${id}/pdf`;
}

// ── Orgs ──────────────────────────────────────────────────────────────────────

export function fetchOrg(invite_code: string): Promise<OrgRecord> {
  return apiFetch<OrgRecord>(`/api/orgs/${invite_code}`);
}

