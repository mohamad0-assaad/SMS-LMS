import type { Response } from "express";
import { generateText } from "ai";
import type { AuthRequest } from "../middleware/auth.ts";
import { getGeminiModel } from "../config/geminiModel.ts";
import Class from "../models/class.ts";
import Subject from "../models/subject.ts";

/** No retries: quota/rate errors should not be retried (avoids “Failed after 3 attempts”). */
const AI_CALL = { maxRetries: 0 as const };

function isGeminiQuotaError(message: string): boolean {
  return (
    /quota|rate limit|RESOURCE_EXHAUSTED|exceeded your current quota|free_tier/i.test(
      message,
    ) || message.includes("generativelanguage.googleapis.com")
  );
}

function respondGeminiFailure(res: Response, err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  if (isGeminiQuotaError(raw)) {
    return res.status(429).json({
      code: "GEMINI_QUOTA",
      message:
        "Google Gemini quota or free-tier limit reached for this API key. " +
        "Open Google AI Studio → your API key / billing, enable billing or wait for the daily reset. " +
        "Docs: https://ai.google.dev/gemini-api/docs/rate-limits",
    });
  }
  console.error("[ai]", err);
  return res.status(500).json({ message: raw });
}

function requireGeminiKey(res: Response): string | null {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    res.status(503).json({
      message:
        "GOOGLE_GENERATIVE_AI_API_KEY is not set. Add it to backend .env for AI features.",
    });
    return null;
  }
  return key;
}

/** Gemini often wraps JSON or adds prose; extract and parse a JSON array safely. */
function parseQuestionsArray(text: string): unknown {
  const stripped = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { questions?: unknown }).questions)) {
      return (parsed as { questions: unknown[] }).questions;
    }
  } catch {
    /* try bracket slice */
  }
  const start = stripped.indexOf("[");
  const end = stripped.lastIndexOf("]");
  if (start >= 0 && end > start) {
    return JSON.parse(stripped.slice(start, end + 1));
  }
  throw new Error(
    "The model did not return valid JSON. Try again, or shorten the number of questions.",
  );
}

/** POST /api/ai/ask */
export const aiAsk = async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = requireGeminiKey(res);
    if (!apiKey) return;

    const { prompt } = req.body as { prompt?: string };
    if (!prompt?.trim()) {
      return res.status(400).json({ message: "prompt is required" });
    }

    const { text } = await generateText({
      ...AI_CALL,
      model: getGeminiModel(apiKey),
      prompt: `You are a helpful teaching assistant for a school LMS. Be concise and practical.\n\nUser question:\n${prompt.trim()}`,
    });

    res.json({ answer: text });
  } catch (e: unknown) {
    respondGeminiFailure(res, e);
  }
};

/** POST /api/ai/recommend */
export const aiRecommend = async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = requireGeminiKey(res);
    if (!apiKey) return;

    const { topic, strategy, risk } = req.body as {
      topic?: string;
      strategy?: string;
      risk?: number;
    };
    if (!topic?.trim()) {
      return res.status(400).json({ message: "topic is required" });
    }

    const { text } = await generateText({
      ...AI_CALL,
      model: getGeminiModel(apiKey),
      prompt: `You are a learning strategist for students.

Topic: ${topic.trim()}
Preferred study approach: ${strategy ?? "mixed"}
Risk / difficulty focus (0 = foundational, 1 = stretch): ${risk ?? 0}

Give a short recommendation: 3–5 bullet points with concrete next steps. Plain text only.`,
    });

    res.json({ recommendation: text });
  } catch (e: unknown) {
    respondGeminiFailure(res, e);
  }
};

/** POST /api/ai/generate-class-quiz */
export const aiGenerateClassQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = requireGeminiKey(res);
    if (!apiKey) return;

    const { classId, subjectId, count } = req.body as {
      classId?: string;
      subjectId?: string;
      count?: number;
    };
    if (!classId || !subjectId) {
      return res.status(400).json({ message: "classId and subjectId are required" });
    }

    const n = Math.min(20, Math.max(3, Number(count) || 5));

    const cls = await Class.findById(classId);
    const subject = await Subject.findById(subjectId);

    if (!cls || !subject) {
      return res.status(404).json({ message: "Class or subject not found" });
    }

    const subjectInClass = (cls.subjects ?? []).some(
      (id) => id.toString() === subjectId
    );
    const subjectWarning =
      !subjectInClass && (cls.subjects?.length ?? 0) > 0
        ? "This subject is not linked to the class in the database; the quiz was still generated from the class and subject names you chose."
        : !subjectInClass && (cls.subjects?.length ?? 0) === 0
          ? "This class has no subjects listed in the database; the quiz was generated from the class and subject names only."
          : undefined;

    const prompt = `
You are an experienced teacher. Create exactly ${n} multiple-choice questions for a class quiz.

CONTEXT:
- Class: ${cls.name}
- Subject: ${subject.name} (${subject.code})
- Student count in class: ${(cls.students ?? []).length}

STRICT JSON SCHEMA (array only, no markdown):
[
  {
    "questionText": "string",
    "type": "MCQ",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "exact string matching one option",
    "points": 1
  }
]

RULES:
1. Output ONLY valid JSON array. No markdown fences.
2. Questions should match typical level for this class name.
3. correctAnswer must equal one of the options exactly.
`;

    const { text } = await generateText({
      ...AI_CALL,
      model: getGeminiModel(apiKey),
      prompt,
      maxOutputTokens: 8192,
    });

    const questions = parseQuestionsArray(text) as unknown;
    res.json({
      classId,
      subjectId,
      className: cls.name,
      subjectName: subject.name,
      questions,
      ...(subjectWarning ? { warning: subjectWarning } : {}),
    });
  } catch (e: unknown) {
    respondGeminiFailure(res, e);
  }
};
