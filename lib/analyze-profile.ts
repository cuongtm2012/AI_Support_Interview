import { apiKeyHeaders, getDeepseekApiKey, withApiKey } from "@/lib/api-keys";

export async function analyzeProfileAndJd(
  profileText: string,
  jdText: string
): Promise<string> {
  const key = getDeepseekApiKey();
  if (!key) {
    throw new Error("Cần DeepSeek API key trong Settings → Keys");
  }

  const res = await fetch("/api/analyze-profile", {
    method: "POST",
    headers: apiKeyHeaders(key),
    body: JSON.stringify(withApiKey(key, { profileText, jdText })),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Phân tích thất bại"
    );
  }

  const data = (await res.json()) as { analysis?: string };
  if (!data.analysis?.trim()) throw new Error("Không nhận được kết quả phân tích");
  return data.analysis.trim();
}
