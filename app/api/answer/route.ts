import { NextRequest } from "next/server";
import { rateLimitResponse } from "@/lib/api-guard";
import { getClientApiKey } from "@/lib/server-api-key";
import { answerGuidanceForType, isQuestionType } from "@/lib/question-type";
import type { QuestionType } from "@/types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

export async function POST(req: NextRequest) {
  const limited = await rateLimitResponse(req);
  if (limited) return limited;

  let body: {
    question?: string;
    questionType?: string;
    candidateContext?: string;
    profileText?: string;
    jdText?: string;
    answerStyle?: string;
    answerLanguage?: string;
    apiKey?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = getClientApiKey(req, process.env.DEEPSEEK_API_KEY, body);
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "DeepSeek API key required (Settings → API Keys)",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const {
    question,
    questionType: rawType = "behavioral",
    candidateContext = "",
    profileText = "",
    jdText = "",
    answerStyle = "STAR",
    answerLanguage = "English",
  } = body;

  const questionType: QuestionType = isQuestionType(rawType)
    ? rawType
    : "behavioral";
  const typeGuidance = answerGuidanceForType(questionType);
  const answerInEnglish =
    answerLanguage.toLowerCase().includes("english") ||
    answerLanguage.toLowerCase().includes("anh");

  if (!question?.trim()) {
    return new Response(JSON.stringify({ error: "Question is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = answerInEnglish
    ? `You are an expert interview coach. Write ONLY the job candidate's spoken answer in English.
Question type: ${questionType}. ${typeGuidance}
Preferred format: ${answerStyle}. Answer language: English.

Rules (strict):
- First person, speaking TO the interviewer (never thank the interviewer for explaining)
- Use candidate context (gender, age, role) to personalize tone and examples when provided
- No meta text, no apologies about missing profile/JD, no "based on your question"
- Concise, practical; use profile/JD when provided, else brief professional examples
- Output ONLY the answer — no preamble or notes`
    : `Bạn là chuyên gia coaching phỏng vấn. Chỉ viết câu trả lời của ỨNG VIÊN bằng tiếng Việt.
Loại câu hỏi: ${questionType}. ${typeGuidance}
Format: ${answerStyle}. Ngôn ngữ: tiếng Việt.

Quy tắc (bắt buộc):
- Ngôi thứ nhất, ứng viên trả lời interviewer (không cảm ơn interviewer vì đã giải thích)
- Dùng thông tin ứng viên (giới tính, tuổi, vị trí) để cá nhân hóa giọng điệu và ví dụ
- Không meta, không xin lỗi thiếu profile/JD, không "dựa trên câu hỏi"
- Súc tích, thực tế; dùng profile/JD nếu có, không thì ví dụ chung
- Chỉ output câu trả lời — không mở đầu hay ghi chú`;

  const userPrompt = answerInEnglish
    ? `Interviewer question:
"${question}"

Question type: ${questionType}

Candidate context (gender, age, role):
${candidateContext || "(not provided)"}

Candidate profile / CV:
${profileText || "(not provided — use concise generic professional examples, do not mention missing profile)"}

Job description:
${jdText || "(not provided)"}

Write the candidate's answer (${typeGuidance}):`
    : `Câu hỏi interviewer:
"${question}"

Loại: ${questionType}

Thông tin ứng viên (giới tính, tuổi, vị trí):
${candidateContext || "(chưa có)"}

Hồ sơ / CV:
${profileText || "(chưa có — dùng ví dụ chung, không nhắc thiếu profile)"}

JD:
${jdText || "(chưa có)"}

Viết câu trả lời ứng viên (${typeGuidance}):`;

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
