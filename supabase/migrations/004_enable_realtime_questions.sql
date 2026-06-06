-- Realtime inserts for multi-tab / session sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
  END IF;
END $$;
