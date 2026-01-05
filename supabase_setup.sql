-- SUPABASE SETUP SCRIPT
-- This script sets up the tables and security policies required for the translator app.

-- 1. TABLES
-- Users table to track participants (using TEXT to allow for both random strings and UUIDs)
CREATE TABLE IF NOT EXISTS public.users (
    user_id TEXT PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User configurations (languages, etc)
CREATE TABLE IF NOT EXISTS public.user_configs (
    user_identity TEXT PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    target_language TEXT,
    translation_engine TEXT DEFAULT 'google',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcription segments (one row per meeting for this specific implementation)
CREATE TABLE IF NOT EXISTS public.transcript_segments (
  meeting_id text not null,
  speaker_id text null,
  source_lang text null,
  source_text text null,
  full_transcription text null,
  last_segment_id text null,
  updated_at timestamp with time zone null default now(),
  constraint transcript_segments_pkey primary key (meeting_id),
  constraint transcript_segments_speaker_id_fkey foreign KEY (speaker_id) references public.users (user_id)
) TABLESPACE pg_default;

-- Rooms table for managing speaker state and queue
CREATE TABLE IF NOT EXISTS public.rooms (
    meeting_id TEXT PRIMARY KEY,
    active_speaker JSONB, -- Stores { userId, userName, sessionId, since }
    raise_hand_queue JSONB DEFAULT '[]'::JSONB, -- Stores array of { userId, userName, requestedAt }
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE REALTIME
-- This allows the client to listen for changes on transcript_segments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'transcript_segments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transcript_segments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;
END $$;

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES FOR ANONYMOUS ACCESS
-- IMPORTANT: You must enable "Allow Anonymous Sign-ins" in the Supabase Dashboard
-- Go to: Authentication -> Providers -> Anonymous -> Enable

-- Transcript Segments: Public access for demo purposes
DROP POLICY IF EXISTS "Public Read Transcript" ON public.transcript_segments;
CREATE POLICY "Public Read Transcript" ON public.transcript_segments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Transcript" ON public.transcript_segments;
CREATE POLICY "Public Insert Transcript" ON public.transcript_segments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Transcript" ON public.transcript_segments;
CREATE POLICY "Public Update Transcript" ON public.transcript_segments FOR UPDATE USING (true);

-- Users: Syncing user info
DROP POLICY IF EXISTS "Public Sync Users" ON public.users;
CREATE POLICY "Public Sync Users" ON public.users FOR ALL USING (true);

-- User Configs: Syncing user settings
DROP POLICY IF EXISTS "Public Sync Configs" ON public.user_configs;
CREATE POLICY "Public Sync Configs" ON public.user_configs FOR ALL USING (true);

-- Rooms: Public access for demo purposes
DROP POLICY IF EXISTS "Public Sync Rooms" ON public.rooms;
CREATE POLICY "Public Sync Rooms" ON public.rooms FOR ALL USING (true);

-- 5. AUTO-UPDATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_configs_updated_at ON public.user_configs;
CREATE TRIGGER update_user_configs_updated_at BEFORE UPDATE ON public.user_configs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_transcript_segments_updated_at ON public.transcript_segments;
CREATE TRIGGER update_transcript_segments_updated_at BEFORE update on transcript_segments for EACH row execute FUNCTION update_updated_at_column ();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
