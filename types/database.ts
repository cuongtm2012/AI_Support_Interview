export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export interface UserApiKeysRow {
  user_id: string;
  deepgram_api_key: string | null;
  deepseek_api_key: string | null;
  updated_at: string;
}

export interface InterviewSession {
  id: string;
  user_id: string;
  source_lang: string;
  target_lang: string;
  answer_style: string;
  profile_text: string | null;
  jd_text: string | null;
  status: "active" | "ended";
  started_at: string;
  ended_at: string | null;
}

export interface SessionQuestion {
  id: string;
  session_id: string;
  question_type: string | null;
  transcript_raw: string;
  transcript_vi: string | null;
  ai_answer: string | null;
  answer_lang: string | null;
  created_at: string;
}

export interface SessionWithQuestions extends InterviewSession {
  questions: SessionQuestion[];
}
