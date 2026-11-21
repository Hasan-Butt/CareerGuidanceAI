// ── Typed API fetch wrappers ──────────────────────────────────────────────────
import type {
  AnalyticsData,
  AssessmentPayload,
  FollowupQuestion,
  GeminiEnrichment,
  OrgRecord,
  PredictResponse,
  SessionRecord,
  SessionsResponse,
} from "./types";
import { getOrgKey } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BASE}${path}`;
  const orgKey = getOrgKey();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(url, {
      ...init,
      signal: init?.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(orgKey ? { "X-Org-Key": orgKey } : {}),
        ...init?.headers,
      },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const errJson = await res.json();
        detail = errJson.detail || errJson.error || JSON.stringify(errJson);
      } catch {
        detail = await res.text();
      }
      const e = new Error(`API ${path} → ${res.status}: ${detail}`) as Error & { status?: number };
      e.status = res.status;
      throw e;
    }
    return res.json() as Promise<T>;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`API ${path} timed out after 7s.`);
    }
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

// Dashboard calls send the counsellor's X-Org-Key; the server returns only
// that organisation's students.
export function fetchSessions(params?: {
  limit?: number;
  offset?: number;
}): Promise<SessionsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit)    qs.set("limit", String(params.limit));
  if (params?.offset)   qs.set("offset", String(params.offset));
  return apiFetch<SessionsResponse>(`/api/sessions?${qs}`);
}

export function fetchSession(id: string): Promise<SessionRecord> {
  return apiFetch<SessionRecord>(`/api/sessions/${id}`);
}

export function fetchAnalytics(): Promise<AnalyticsData> {
  return apiFetch<AnalyticsData>("/api/sessions/analytics");
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

/** Public invite-code check used by the assessment. */
export function fetchOrg(invite_code: string): Promise<Pick<OrgRecord, "invite_code" | "name">> {
  return apiFetch(`/api/orgs/${encodeURIComponent(invite_code)}`);
}

/** Dashboard login: which organisation does the stored key belong to? */
export function fetchMyOrg(key?: string): Promise<OrgRecord> {
  return apiFetch<OrgRecord>("/api/orgs/me", key ? { headers: { "X-Org-Key": key } } : undefined);
}

// ── Gemini Layer ──────────────────────────────────────────────────────────────

export function fetchFollowupQuestions(payload: {
  xgb_probabilities: Array<{ house: string; probability: number; emoji: string }>;
  holland_code: string;
  weak_domains: string[];
}): Promise<{ questions: FollowupQuestion[] }> {
  return apiFetch<{ questions: FollowupQuestion[] }>("/api/gemini/followup-questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchGeminiEnrichment(payload: {
  xgb_ranking: Array<{ house: string; emoji: string; probability: number }>;
  followup_answers: Record<string, string>;
  holland_code: string;
}): Promise<GeminiEnrichment> {
  return apiFetch<GeminiEnrichment>("/api/gemini/validate-enrich", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

