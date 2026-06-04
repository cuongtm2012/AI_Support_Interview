import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SessionQuestion } from "@/types/database";

export function subscribeToSessionQuestions(
  sessionId: string,
  onInsert: (question: SessionQuestion) => void
): (() => void) | null {
  if (!isSupabaseConfigured() || !sessionId) return null;

  const supabase = createClient();
  const channel = supabase
    .channel(`session-questions:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "questions",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onInsert(payload.new as SessionQuestion);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
