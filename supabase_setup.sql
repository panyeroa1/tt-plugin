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
CREATE TABLE public.transcript_segments (
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

-- 2. ENABLE REALTIME
-- This allows the client to listen for changes on transcript_segments
ALTER PUBLICATION supabase_realtime ADD TABLE transcript_segments;

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_segments ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES FOR ANONYMOUS ACCESS
-- IMPORTANT: You must enable "Allow Anonymous Sign-ins" in the Supabase Dashboard
-- Go to: Authentication -> Providers -> Anonymous -> Enable

-- Transcript Segments: Public access for demo purposes
CREATE POLICY "Public Read Transcript" ON public.transcript_segments FOR SELECT USING (true);
CREATE POLICY "Public Insert Transcript" ON public.transcript_segments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Transcript" ON public.transcript_segments FOR UPDATE USING (true);

-- Users: Syncing user info
CREATE POLICY "Public Sync Users" ON public.users FOR ALL USING (true);

-- User Configs: Syncing user settings
CREATE POLICY "Public Sync Configs" ON public.user_configs FOR ALL USING (true);

-- 5. AUTO-UPDATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_configs_updated_at BEFORE UPDATE ON public.user_configs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_transcript_segments_updated_at BEFORE update on transcript_segments for EACH row execute FUNCTION update_updated_at_column ();
