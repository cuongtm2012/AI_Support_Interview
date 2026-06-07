import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/api-guard";
import { getClientApiKey } from "@/lib/server-api-key";
import {
  formatHintForType,
  heuristicClassify,
  isQuestionType,
} from "@/lib/question-type";
import type { QuestionType } from "@/types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  const limited = await rateLimitResponse(req);
  if (limited) return limited;

  let body: { question?: string; apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiKey = getClientApiKey(req, process.env.DEEPSEEK_API_KEY, body);
  if (!apiKey) {
    return NextResponse.json(
      { error: "DeepSeek API key required" },
      { status: 401 }
    );
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const fallbackType = heuristicClassify(question);

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0,
        max_tokens: 80,
        messages: [
          {
            role: "system",
            content: `Classify interview questions into exactly one type: behavioral, technical, situational, competency.
Reply ONLY valid JSON: {"type":"behavioral|technical|situational|competency","format_hint":"short hint"}`,
          },
          {
            role: "user",
            content: question,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error("DeepSeek classify failed");

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        type?: string;
        format_hint?: string;
      };
      const rawType = parsed.type ?? "";
      const type: QuestionType = isQuestionType(rawType)
        ? rawType
        : fallbackType;
      return NextResponse.json({
        type,
        formatHint: parsed.format_hint || formatHintForType(type),
      });
    }
  } catch {
    // fall through
  }

  return NextResponse.json({
    type: fallbackType,
    formatHint: formatHintForType(fallbackType),
  });
}
