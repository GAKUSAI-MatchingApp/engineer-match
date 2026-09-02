-- Enable Supabase Realtime for public.messages.
--
-- The chat UI (ChatMessageThread.tsx, shared by both the engineer- and
-- company-side threads) subscribes to postgres_changes INSERT events on
-- public.messages via supabase.channel(...).on("postgres_changes", ...) so
-- that a message sent by one participant appears immediately in the other
-- participant's already-open chat window, without a manual refresh.
--
-- That subscription only ever fires for tables that have been added to the
-- `supabase_realtime` publication -- no prior migration did that for
-- `messages`, so Postgres never emitted change events for it over the
-- replication stream. The client's channel().subscribe() call succeeded
-- (so no error was visible), it just never received anything: the open
-- thread only ever picked up a new message when something else re-fetched
-- it from the database -- a hard refresh, or the manual "再試行"/refresh
-- button (both call listConversationMessages directly instead of relying on
-- the realtime channel).
--
-- Guarded with an existence check so this is safe to run even if the table
-- was already added to the publication manually (e.g. via the Supabase
-- dashboard's Database > Replication UI).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
