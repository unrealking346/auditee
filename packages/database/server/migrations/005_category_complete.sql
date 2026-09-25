-- Waeve 2.0.2: additional category-complete domains.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS radio_stations(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, station_type text NOT NULL,
  seed_track_id uuid REFERENCES tracks(id), seed_artist_id uuid REFERENCES artists(id), genre_id uuid REFERENCES genres(id),
  region_code char(2) DEFAULT 'WW', config jsonb NOT NULL DEFAULT '{}', active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS mixes(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL, title text NOT NULL, description text, generated_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz
);
CREATE TABLE IF NOT EXISTS mix_tracks(
  mix_id uuid REFERENCES mixes(id) ON DELETE CASCADE, track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  position int NOT NULL, reason text, PRIMARY KEY(mix_id,track_id)
);

CREATE TABLE IF NOT EXISTS local_files(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  device_id text NOT NULL, local_uri text NOT NULL, title text, artist text, album text, duration_ms int,
  fingerprint text, added_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,device_id,local_uri)
);
CREATE TABLE IF NOT EXISTS playlist_import_jobs(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  source text NOT NULL, source_ref text, status text NOT NULL DEFAULT 'queued', total int DEFAULT 0, matched int DEFAULT 0, unmatched int DEFAULT 0,
  report jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS family_groups(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Waeve Family', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS family_members(
  family_id uuid REFERENCES family_groups(id) ON DELETE CASCADE, user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(family_id,user_id)
);
CREATE TABLE IF NOT EXISTS parental_controls(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, pin_hash text, restricted_mode boolean NOT NULL DEFAULT false,
  max_rating text, allow_social boolean NOT NULL DEFAULT true, allow_explicit boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accessibility_preferences(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, reduce_motion boolean NOT NULL DEFAULT false,
  high_contrast boolean NOT NULL DEFAULT false, larger_text boolean NOT NULL DEFAULT false, screen_reader_labels boolean NOT NULL DEFAULT true,
  captions boolean NOT NULL DEFAULT true, haptic_feedback boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS connected_devices(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL, name text NOT NULL, platform text, capabilities jsonb NOT NULL DEFAULT '{}', last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,kind,name)
);
CREATE TABLE IF NOT EXISTS device_handoffs(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  from_device text, to_device text, track_id uuid REFERENCES tracks(id), position_ms int DEFAULT 0,
  status text NOT NULL DEFAULT 'requested', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS music_recognition_queries(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  device_id text, fingerprint text, matched_track_id uuid REFERENCES tracks(id), confidence numeric(7,5), provider text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lyric_corrections(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL, locale text NOT NULL, proposed_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending', reviewer_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lyrics_contributors(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  name text NOT NULL, role text NOT NULL, publisher text, attribution text
);
CREATE TABLE IF NOT EXISTS digital_booklets(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), album_id uuid REFERENCES albums(id) ON DELETE CASCADE,
  title text, object_key text NOT NULL, language_code text, version text NOT NULL DEFAULT '1'
);
CREATE TABLE IF NOT EXISTS album_notes(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), album_id uuid REFERENCES albums(id) ON DELETE CASCADE,
  kind text NOT NULL, title text, body text NOT NULL, author_name text, published_at timestamptz
);

CREATE TABLE IF NOT EXISTS editorial_collections(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, slug text UNIQUE NOT NULL, description text,
  hero_image_url text, region_code char(2), published_at timestamptz, status text NOT NULL DEFAULT 'draft'
);
CREATE TABLE IF NOT EXISTS editorial_collection_items(
  collection_id uuid REFERENCES editorial_collections(id) ON DELETE CASCADE, editorial_id uuid REFERENCES editorial_items(id) ON DELETE CASCADE,
  position int NOT NULL, PRIMARY KEY(collection_id,editorial_id)
);
CREATE TABLE IF NOT EXISTS fan_communities(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  name text NOT NULL, description text, privacy text NOT NULL DEFAULT 'public', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fan_community_members(
  community_id uuid REFERENCES fan_communities(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(community_id,user_id)
);
CREATE TABLE IF NOT EXISTS community_posts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), community_id uuid REFERENCES fan_communities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL, body text NOT NULL, media jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS share_links(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  entity_type text NOT NULL, entity_id uuid NOT NULL, token_hash text UNIQUE NOT NULL, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS short_clips(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  start_ms int NOT NULL DEFAULT 0, end_ms int NOT NULL, caption text, status text NOT NULL DEFAULT 'ready'
);
CREATE TABLE IF NOT EXISTS ugc_claims(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), claimant text NOT NULL, track_id uuid REFERENCES tracks(id),
  external_ref text, claim_type text NOT NULL, status text NOT NULL DEFAULT 'open', evidence jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_quality_issues(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entity_type text NOT NULL, entity_id uuid NOT NULL,
  issue_type text NOT NULL, severity text NOT NULL DEFAULT 'medium', details text, status text NOT NULL DEFAULT 'open', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS support_tickets(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category text NOT NULL, subject text NOT NULL, body text NOT NULL, status text NOT NULL DEFAULT 'open', priority text NOT NULL DEFAULT 'normal',
  assigned_to uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE TABLE IF NOT EXISTS support_messages(
  id bigserial PRIMARY KEY, ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE, sender_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS incident_announcements(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body text NOT NULL, severity text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS service_metrics_daily(
  metric_date date NOT NULL, metric_key text NOT NULL, region_code char(2) NOT NULL DEFAULT 'WW', value numeric(20,6) NOT NULL DEFAULT 0,
  PRIMARY KEY(metric_date,metric_key,region_code)
);

INSERT INTO feature_flags(key,enabled,rollout_percent) VALUES
('radio_stations',true,100),('personalized_mixes',true,100),('local_files',true,100),('playlist_import',true,100),
('family_profiles',true,100),('parental_controls',true,100),('accessibility_controls',true,100),('device_handoff',true,100),
('music_recognition',true,100),('digital_booklets',true,100),('album_notes',true,100),('fan_communities',true,100),
('share_links',true,100),('short_clips',true,100),('ugc_claims',true,100),('support_center',true,100),
('incident_status',true,100),('service_metrics',true,100)
ON CONFLICT(key) DO NOTHING;
