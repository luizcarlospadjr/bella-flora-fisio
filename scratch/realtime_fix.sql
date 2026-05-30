DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='pain_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pain_logs;
  END IF;
END $$;
SELECT (SELECT json_agg(tablename ORDER BY tablename) FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public') AS realtime_tables;
