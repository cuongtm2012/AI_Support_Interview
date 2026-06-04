import { NextRequest } from "next/server";
import { rateLimitResponse } from "@/lib/api-guard";
import { getClientApiKey } from "@/lib/server-api-key";
import { answerGuidanceForType, isQuestionType } from "@/lib/question-type";
import type { QuestionType } from "@/types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req);
  if (limited) return limited;

  const apiKey = getClientApiKey(req, process.env.DEEPSEEK_API_KEY);
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "DeepSeek API key required (Settings → API Keys)",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: {
    question?: string;
    questionType?: string;
    profileText?: string;
    jdText?: string;
    answerStyle?: string;
    answerLanguage?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const {
    question,
    questionType: rawType = "behavioral",
    profileText = "",
    jdText = "",
    answerStyle = "STAR",
    answerLanguage = "tiếng Anh",
  } = body;

  const questionType: QuestionType = isQuestionType(rawType)
    ? rawType
    : "behavioral";
  const typeGuidance = answerGuidanceForType(questionType);

  if (!question?.trim()) {
    return new Response(JSON.stringify({ error: "Question is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `Bạn là trợ lý phỏng vấn chuyên nghiệp. Viết câu trả lời dựa trên hồ sơ ứng viên và JD.
Loại câu hỏi: ${questionType}. ${typeGuidance}
Format ưu tiên: ${answerStyle}. Ngôn ngữ trả lời: ${answerLanguage}.
Trả lời súc tích, thực tế, bám sát profile. Không giải thích meta — chỉ đưa câu trả lời.`;

  const userPrompt = `Câu hỏi từ interviewer:
"${question}"

Loại câu hỏi: ${questionType}

Hồ sơ ứng viên:
${profileText || "(chưa có profile)"}

Job Description:
${jdText || "(chưa có JD)"}

Viết câu trả lời (${typeGuidance}):`;

  const llmRes = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!llmRes.ok) {
    const errText = await llmRes.text();
    return new Response(
      JSON.stringify({ error: `DeepSeek error: ${errText}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = llmRes.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const parsed = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            } catch {
              // skip
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
