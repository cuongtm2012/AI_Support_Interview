import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { InterviewSession, SessionQuestion, SessionWithQuestions } from "@/types/database";
import type { AnswerLanguage, LanguageCode, QuestionType } from "@/types";

function resolveAnswerLangCode(
  answerLanguage: AnswerLanguage,
  targetLanguage: LanguageCode
): string {
  if (answerLanguage === "Vietnamese") return "vi";
  if (answerLanguage === "English") return "en";
  return targetLanguage;
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function createInterviewSession(params: {
  sourceLang: string;
  targetLang: string;
  answerStyle: string;
  profileText: string;
  jdText: string;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      source_lang: params.sourceLang,
      target_lang: params.targetLang,
      answer_style: params.answerStyle,
      profile_text: params.profileText || null,
      jd_text: params.jdText || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[supabase] create session:", error.message);
    return null;
  }
  return data.id;
}

export async function endInterviewSession(sessionId: string): Promise<void> {
  if (!isSupabaseConfigured() || !sessionId) return;

  const supabase = createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    console.error("[supabase] end session:", error.message);
  }
}

export async function saveQuestionToSession(params: {
  sessionId: string;
  transcriptRaw: string;
  transcriptTranslated: string;
  aiAnswer: string;
  questionType: QuestionType;
  answerLanguage: AnswerLanguage;
  targetLanguage: LanguageCode;
}): Promise<void> {
  if (!isSupabaseConfigured() || !params.sessionId) return;

  const supabase = createClient();
  const { error } = await supabase.from("questions").insert({
    session_id: params.sessionId,
    question_type: params.questionType,
    transcript_raw: params.transcriptRaw,
    transcript_vi: params.transcriptTranslated,
    ai_answer: params.aiAnswer,
    answer_lang: resolveAnswerLangCode(
      params.answerLanguage,
      params.targetLanguage
    ),
  });

  if (error) {
    console.error("[supabase] save question:", error.message);
  }
}

export async function fetchUserSessions(
  limit = 30
): Promise<InterviewSession[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[supabase] fetch sessions:", error.message);
    return [];
  }
  return (data ?? []) as InterviewSession[];
}

export async function fetchSessionWithQuestions(
  sessionId: string
): Promise<SessionWithQuestions | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) return null;

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (questionsError) {
    console.error("[supabase] fetch questions:", questionsError.message);
    return { ...(session as InterviewSession), questions: [] };
  }

  return {
    ...(session as InterviewSession),
    questions: (questions ?? []) as SessionQuestion[],
  };
}

export function formatSessionExport(session: SessionWithQuestions): string {
  const lines: string[] = [
    `# Interview Session`,
    `Started: ${new Date(session.started_at).toLocaleString()}`,
    `Languages: ${session.source_lang} → ${session.target_lang}`,
    `Style: ${session.answer_style}`,
    "",
  ];

  session.questions.forEach((q, i) => {
    lines.push(`## Question ${i + 1}${q.question_type ? ` [${q.question_type}]` : ""}`);
    lines.push(`**Original:** ${q.transcript_raw}`);
    if (q.transcript_vi) lines.push(`**Translation:** ${q.transcript_vi}`);
    if (q.ai_answer) lines.push(`**AI Answer:**\n${q.ai_answer}`);
    lines.push("");
  });

  return lines.join("\n");
}
