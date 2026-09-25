ALTER TABLE tracks ADD COLUMN IF NOT EXISTS premium_only boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS user_profiles(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_url text, bio text, language_code text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'UTC', explicit_allowed boolean NOT NULL DEFAULT true,
  discovery_mode text NOT NULL DEFAULT 'balanced', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS device_tokens(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL, device_id text NOT NULL, push_token text, app_version text,
  last_seen_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,device_id)
);
CREATE TABLE IF NOT EXISTS playlist_collaborators(
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor', created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(playlist_id,user_id)
);
CREATE TABLE IF NOT EXISTS playlist_shares(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL, token_hash text UNIQUE NOT NULL,
  expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS listening_history(
  id bigserial PRIMARY KEY, user_id uuid REFERENCES users(id) ON DELETE CASCADE, track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  session_id uuid, played_at timestamptz NOT NULL DEFAULT now(), duration_ms int NOT NULL DEFAULT 0, completion_ratio numeric(5,4) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS listening_history_user_time ON listening_history(user_id,played_at DESC);
CREATE TABLE IF NOT EXISTS smart_downloads(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, enabled boolean NOT NULL DEFAULT false,
  max_tracks int NOT NULL DEFAULT 50, quality text NOT NULL DEFAULT 'high', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS download_entitlements(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  track_id uuid REFERENCES tracks(id) ON DELETE CASCADE, quality text NOT NULL DEFAULT 'high',
  expires_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'active', created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,track_id,quality)
);
CREATE TABLE IF NOT EXISTS track_lyrics(
  track_id uuid PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE, plain_text text,
  synced_json jsonb NOT NULL DEFAULT '[]'::jsonb, translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS editorial_items(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL, title text NOT NULL,
  slug text UNIQUE NOT NULL, excerpt text, body text, hero_image_url text, published_at timestamptz,
  author_name text, region_code char(2), status text NOT NULL DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS editorial_track_links(
  editorial_id uuid REFERENCES editorial_items(id) ON DELETE CASCADE, track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  PRIMARY KEY(editorial_id,track_id)
);
CREATE TABLE IF NOT EXISTS charts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), chart_type text NOT NULL, region_code char(2), period_start date NOT NULL,
  title text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(chart_type,region_code,period_start)
);
CREATE TABLE IF NOT EXISTS chart_entries(
  chart_id uuid REFERENCES charts(id) ON DELETE CASCADE, track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  rank int NOT NULL, score numeric(18,6) NOT NULL DEFAULT 0, previous_rank int,
  PRIMARY KEY(chart_id,track_id)
);
CREATE TABLE IF NOT EXISTS release_submissions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  release_id uuid REFERENCES releases(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'submitted',
  reviewer_notes text, submitted_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz
);
CREATE TABLE IF NOT EXISTS royalty_splits(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), release_id uuid REFERENCES releases(id) ON DELETE CASCADE,
  payee_name text NOT NULL, payee_email text, percentage numeric(7,4) NOT NULL CHECK(percentage >= 0 AND percentage <= 100),
  role text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log(
  id bigserial PRIMARY KEY, actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL, entity_type text, entity_id text, ip inet, user_agent text, payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_time ON audit_log(created_at DESC);
CREATE TABLE IF NOT EXISTS feature_flags(
  key text PRIMARY KEY, enabled boolean NOT NULL DEFAULT false, rollout_percent int NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO feature_flags(key,enabled,rollout_percent) VALUES
('ai_music_guide',true,100),('samples',true,100),('smart_downloads',true,100),('listening_rooms',true,100),('regional_discovery',true,100),('editorial',true,100),('hires_catalog',true,100),('immersive_catalog',true,100)
ON CONFLICT(key) DO NOTHING;
