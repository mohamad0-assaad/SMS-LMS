import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";

/** Order must match `skillup-ai/models/feature_info.json` */
const BASIC_FEATURES = [
  "exam_score",
  "quiz_score",
  "assignment_score",
  "attendance_rate",
  "quiz_attempts",
  "study_time_hours",
  "login_frequency",
  "course_progress",
] as const;

const ALL_FEATURES = [
  ...BASIC_FEATURES,
  "topic_variables",
  "topic_loops",
  "topic_functions",
  "topic_oop",
  "topic_recursion",
  "topic_datastructures",
] as const;

/** camelCase aliases → snake_case keys */
const ALIASES: Record<string, string> = {
  examScore: "exam_score",
  quizScore: "quiz_score",
  assignmentScore: "assignment_score",
  attendanceRate: "attendance_rate",
  quizAttempts: "quiz_attempts",
  studyTimeHours: "study_time_hours",
  loginFrequency: "login_frequency",
  courseProgress: "course_progress",
  topicVariables: "topic_variables",
  topicLoops: "topic_loops",
  topicFunctions: "topic_functions",
  topicOop: "topic_oop",
  topicRecursion: "topic_recursion",
  topicDatastructures: "topic_datastructures",
};

function normalizeKey(k: string): string {
  return ALIASES[k] ?? k;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const x = Number(v);
    return Number.isNaN(x) ? fallback : x;
  }
  return fallback;
}

function buildPayload(body: Record<string, unknown>): {
  basic: number[];
  full: number[];
} {
  const flat: Record<string, number> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === "basic" || k === "full") continue;
    flat[normalizeKey(k)] = num(v);
  }

  const basic = BASIC_FEATURES.map((k) => flat[k] ?? 0);
  const full = ALL_FEATURES.map((k) => flat[k] ?? 0);
  return { basic, full };
}

function skillupBaseUrl(): string {
  return (process.env.SKILLUP_AI_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
}

/**
 * POST /api/skillup/predict
 * Proxies to skillup-ai FastAPI `POST /predict`.
 *
 * Body options:
 * - `{ "basic": number[8], "full": number[14] }` — raw vectors
 * - `{ "exam_score": 75, "quiz_score": 80, ... }` — named features (see feature_info.json)
 */
export const skillupPredict = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    let payload: { basic: number[]; full: number[] };

    if (
      Array.isArray(body.basic) &&
      Array.isArray(body.full) &&
      body.basic.length === BASIC_FEATURES.length &&
      body.full.length === ALL_FEATURES.length
    ) {
      payload = {
        basic: body.basic.map((x) => num(x)),
        full: body.full.map((x) => num(x)),
      };
    } else {
      payload = buildPayload(body);
    }

    const url = `${skillupBaseUrl()}/predict`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { raw: text };
    }

    if (!r.ok) {
      return res.status(r.status).json({
        message:
          typeof data === "object" && data !== null && "detail" in data
            ? String((data as { detail?: unknown }).detail)
            : `SkillUp AI returned ${r.status}`,
        data,
      });
    }

    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "SkillUp AI request failed";
    console.error("[skillup]", e);
    return res.status(503).json({
      message: `${msg}. Is the Python service running on ${skillupBaseUrl()}?`,
      hint:
        "PowerShell: cd skillup-ai; python -m pip install -r requirements.txt; python -m uvicorn main:app --host 127.0.0.1 --port 8000",
      skillupUrl: skillupBaseUrl(),
    });
  }
};
