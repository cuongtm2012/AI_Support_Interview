/** Generated from Supabase project — regenerate via MCP `generate_typescript_types` */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          ai_answer: string | null;
          answer_lang: string | null;
          created_at: string | null;
          id: string;
          question_type: string | null;
          session_id: string;
          transcript_raw: string;
          transcript_vi: string | null;
        };
        Insert: {
          ai_answer?: string | null;
          answer_lang?: string | null;
          created_at?: string | null;
          id?: string;
          question_type?: string | null;
          session_id: string;
          transcript_raw: string;
          transcript_vi?: string | null;
        };
        Update: {
          ai_answer?: string | null;
          answer_lang?: string | null;
          created_at?: string | null;
          id?: string;
          question_type?: string | null;
          session_id?: string;
          transcript_raw?: string;
          transcript_vi?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "questions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          answer_style: string;
          ended_at: string | null;
          id: string;
          jd_text: string | null;
          profile_text: string | null;
          source_lang: string;
          started_at: string | null;
          status: string;
          target_lang: string;
          user_id: string;
        };
        Insert: {
          answer_style?: string;
          ended_at?: string | null;
          id?: string;
          jd_text?: string | null;
          profile_text?: string | null;
          source_lang?: string;
          started_at?: string | null;
          status?: string;
          target_lang?: string;
          user_id: string;
        };
        Update: {
          answer_style?: string;
          ended_at?: string | null;
          id?: string;
          jd_text?: string | null;
          profile_text?: string | null;
          source_lang?: string;
          started_at?: string | null;
          status?: string;
          target_lang?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
