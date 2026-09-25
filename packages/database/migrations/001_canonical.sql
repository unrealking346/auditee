-- WAEVE CANONICAL DATABASE
-- Unified foundation reconciled from preserved Waeve source variants.
-- Original source schemas remain untouched under /_sources.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  password_hash text,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'listener',
  country_code char(2),
  region text,
  language text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'UTC',
  avatar_url text,
  cover_url text,
  explicit_allowed boolean NOT NULL DEFAULT false,
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  stage_name text,
  bio text,
  country_code char(2),
  genres text[] NOT NULL DEFAULT '{}',
  verified boolean NOT NULL DEFAULT false,
  followers_count bigint NOT NULL DEFAULT 0,
  monthly_listeners bigint NOT NULL DEFAULT 0,
  score double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  title text NOT NULL,
  artwork_url text,
  release_date date,
  kind text NOT NULL DEFAULT 'album',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title text NOT NULL,
  upc text UNIQUE,
  kind text NOT NULL,
  release_date date,
  original_release_date date,
  status text NOT NULL DEFAULT 'draft',
  artwork_key text,
  artwork_url text,
  genre text,
  subgenre text,
  mood text,
  language text,
  explicit boolean NOT NULL DEFAULT false,
  notes text,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES releases(id) ON DELETE CASCADE,
  album_id uuid REFERENCES albums(id) ON DELETE SET NULL,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  title text NOT NULL,
  artist_name text,
  duration_ms integer NOT NULL DEFAULT 0,
  isrc text UNIQUE,
  audio_key text,
  audio_url text,
  preview_url text,
  artwork_url text,
  explicit boolean NOT NULL DEFAULT false,
  lossless boolean NOT NULL DEFAULT false,
  hires boolean NOT NULL DEFAULT false,
  atmos boolean NOT NULL DEFAULT false,
  territories text[] NOT NULL DEFAULT '{}',
  lyrics_text text,
  lyrics_timed_json jsonb,
  producer text,
  composer text,
  songwriter text,
  label text,
  streams bigint NOT NULL DEFAULT 0,
  likes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL,
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position integer NOT NULL,
  added_by uuid REFERENCES users(id) ON DELETE SET NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, track_id),
  UNIQUE (playlist_id, position)
);

CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_url text,
  visibility text NOT NULL DEFAULT 'private',
  collaborative boolean NOT NULL DEFAULT false,
  likes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE playlist_tracks
  ADD CONSTRAINT playlist_tracks_playlist_fk
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS playlist_collaborators (
  playlist_id uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission text NOT NULL DEFAULT 'edit',
  PRIMARY KEY (playlist_id, user_id)
);

CREATE TABLE IF NOT EXISTS listening_events (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  track_id uuid REFERENCES tracks(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  position_ms integer NOT NULL DEFAULT 0,
  duration_ms integer,
  session_id uuid,
  device_id text,
  country_code char(2),
  region text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  territory char(2) NOT NULL,
  start_at timestamptz,
  end_at timestamptz,
  master_ok boolean NOT NULL DEFAULT false,
  publishing_ok boolean NOT NULL DEFAULT false,
  license_status text NOT NULL DEFAULT 'active',
  UNIQUE (track_id, territory)
);

CREATE TABLE IF NOT EXISTS royalty_ledger (
  id bigserial PRIMARY KEY,
  track_id uuid REFERENCES tracks(id) ON DELETE SET NULL,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  period date NOT NULL,
  units numeric(18,6) NOT NULL DEFAULT 0,
  revenue numeric(18,6) NOT NULL DEFAULT 0,
  currency char(3) NOT NULL DEFAULT 'USD',
  usage_type text,
  territory_code char(2),
  owner_party_id text,
  status text NOT NULL DEFAULT 'pending',
  calculation_version text NOT NULL DEFAULT '1',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL,
  plan text NOT NULL,
  provider_ref text UNIQUE,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_key text NOT NULL,
  platform text,
  app_version text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_key)
);

CREATE INDEX IF NOT EXISTS listening_events_user_time_idx
  ON listening_events(user_id, occurred_at);

CREATE INDEX IF NOT EXISTS listening_events_track_time_idx
  ON listening_events(track_id, occurred_at);

CREATE INDEX IF NOT EXISTS tracks_title_idx
  ON tracks USING gin (to_tsvector('simple', title));

CREATE INDEX IF NOT EXISTS tracks_artist_idx
  ON tracks(artist_id);

CREATE INDEX IF NOT EXISTS playlist_tracks_position_idx
  ON playlist_tracks(playlist_id, position);

CREATE INDEX IF NOT EXISTS rights_track_territory_idx
  ON rights(track_id, territory);

CREATE INDEX IF NOT EXISTS royalty_ledger_period_idx
  ON royalty_ledger(period, territory_code);

CREATE INDEX IF NOT EXISTS devices_user_idx
  ON devices(user_id);
