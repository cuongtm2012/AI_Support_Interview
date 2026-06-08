import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/api-guard";
import { getUserDeepseekKey } from "@/lib/server-user-api-keys";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  const limited = await rateLimitResponse(req);
  if (limited) return limited;

  let body: { profileText?: string; jdText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiKey = await getUserDeepseekKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "DeepSeek API key required" },
      { status: 401 }
    );
  }

  const profileText = body.profileText?.trim() ?? "";
  const jdText = body.jdText?.trim() ?? "";

  if (!profileText) {
    return NextResponse.json({ error: "Profile is required" }, { status: 400 });
  }
  if (!jdText) {
    return NextResponse.json(
      { error: "Job description is required" },
      { status: 400 }
    );
  }

  const systemPrompt = `You are an expert interview coach. Analyze how well a candidate profile matches a job description.
Output in Vietnamese, concise markdown with these sections:
## Điểm khớp (Match)
## Điểm mạnh nên nhấn
## Khoảng trống cần chuẩn bị
## 3 chủ đề câu hỏi dự đoán
## Gợi ý STAR từ profile
Be specific to the provided texts. No meta commentary.`;

  const userPrompt = `PROFILE:
${profileText}

JOB DESCRIPTION:
${jdText}

Phân tích mức độ phù hợp và gợi ý chuẩn bị phỏng vấn:`;

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.4,
        max_tokens: 1200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `DeepSeek error: ${errText}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const analysis = data.choices?.[0]?.message?.content?.trim();
    if (!analysis) {
      return NextResponse.json({ error: "Empty analysis" }, { status: 502 });
    }

    return NextResponse.json({ analysis });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
