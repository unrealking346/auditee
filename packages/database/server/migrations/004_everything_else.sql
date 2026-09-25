-- Waeve 2.0.1: category-complete expansion.
-- This migration adds product domains that were missing from the original foundation.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS user_devices(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id text NOT NULL, platform text NOT NULL, model text, os_version text, app_version text,
  push_token text, last_ip inet, last_seen_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,device_id)
);
CREATE TABLE IF NOT EXISTS passkeys(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id text UNIQUE NOT NULL, public_key bytea NOT NULL, sign_count bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), last_used_at timestamptz
);
CREATE TABLE IF NOT EXISTS auth_identities(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL, subject text NOT NULL, email text, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider,subject)
);
CREATE TABLE IF NOT EXISTS email_verifications(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL, expires_at timestamptz NOT NULL, used_at timestamptz
);
CREATE TABLE IF NOT EXISTS password_reset_tokens(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL, expires_at timestamptz NOT NULL, used_at timestamptz
);

CREATE TABLE IF NOT EXISTS track_versions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  version_name text NOT NULL DEFAULT 'original', isrc text, language_code text, mix_name text,
  explicit boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS media_assets(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  release_id uuid REFERENCES releases(id) ON DELETE CASCADE, kind text NOT NULL,
  codec text, container text, bitrate_kbps int, sample_rate int, bit_depth int, channels int,
  object_key text NOT NULL, checksum_sha256 text, duration_ms int, loudness_lufs numeric(7,3), true_peak_db numeric(7,3),
  encrypted boolean NOT NULL DEFAULT false, drm_scheme text, status text NOT NULL DEFAULT 'ready', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_assets_track_idx ON media_assets(track_id);
CREATE TABLE IF NOT EXISTS audio_fingerprints(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  algorithm text NOT NULL, fingerprint text NOT NULL, duration_ms int, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(algorithm,fingerprint)
);
CREATE TABLE IF NOT EXISTS waveform_peaks(
  track_id uuid PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE, samples int[] NOT NULL DEFAULT '{}', generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS genres(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL, parent_id uuid REFERENCES genres(id), slug text UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS moods(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL, slug text UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS track_genres(track_id uuid REFERENCES tracks(id) ON DELETE CASCADE, genre_id uuid REFERENCES genres(id) ON DELETE CASCADE, weight numeric(6,5) DEFAULT 1, PRIMARY KEY(track_id,genre_id));
CREATE TABLE IF NOT EXISTS track_moods(track_id uuid REFERENCES tracks(id) ON DELETE CASCADE, mood_id uuid REFERENCES moods(id) ON DELETE CASCADE, weight numeric(6,5) DEFAULT 1, PRIMARY KEY(track_id,mood_id));
CREATE TABLE IF NOT EXISTS track_tags(track_id uuid REFERENCES tracks(id) ON DELETE CASCADE, tag text NOT NULL, PRIMARY KEY(track_id,tag));

CREATE TABLE IF NOT EXISTS artist_team_members(
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'manager', created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(artist_id,user_id)
);
CREATE TABLE IF NOT EXISTS artist_verifications(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', evidence jsonb NOT NULL DEFAULT '{}', reviewer_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz
);
CREATE TABLE IF NOT EXISTS artist_posts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  title text, body text NOT NULL, media jsonb NOT NULL DEFAULT '[]', published_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS artist_fan_support(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL, amount_minor bigint NOT NULL, currency char(3) NOT NULL,
  provider text, provider_ref text UNIQUE, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS artist_storefront_items(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  kind text NOT NULL, title text NOT NULL, url text NOT NULL, price_minor bigint, currency char(3), active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS listening_rooms(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), host_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL, privacy text NOT NULL DEFAULT 'invite', status text NOT NULL DEFAULT 'active', current_track_id uuid REFERENCES tracks(id), position_ms int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS listening_room_members(
  room_id uuid REFERENCES listening_rooms(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(room_id,user_id)
);
CREATE TABLE IF NOT EXISTS listening_room_events(
  id bigserial PRIMARY KEY, room_id uuid REFERENCES listening_rooms(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL, payload jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS playlist_comments(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS content_reactions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  entity_type text NOT NULL, entity_id uuid NOT NULL, reaction text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,entity_type,entity_id)
);

CREATE TABLE IF NOT EXISTS playback_preferences(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  audio_quality text NOT NULL DEFAULT 'auto', download_quality text NOT NULL DEFAULT 'high', normalize boolean NOT NULL DEFAULT true,
  crossfade_ms int NOT NULL DEFAULT 0, gapless boolean NOT NULL DEFAULT true, autoplay boolean NOT NULL DEFAULT true,
  explicit_content boolean NOT NULL DEFAULT true, video_autoplay boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS queue_snapshots(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, items jsonb NOT NULL DEFAULT '[]', current_index int NOT NULL DEFAULT 0,
  shuffle boolean NOT NULL DEFAULT false, repeat_mode text NOT NULL DEFAULT 'off', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS playback_transitions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), from_track_id uuid REFERENCES tracks(id), to_track_id uuid REFERENCES tracks(id),
  mode text NOT NULL, confidence numeric(6,5), created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendation_profiles(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, embedding jsonb, taste jsonb NOT NULL DEFAULT '{}',
  exploration numeric(5,4) NOT NULL DEFAULT .25, diversity numeric(5,4) NOT NULL DEFAULT .50, freshness numeric(5,4) NOT NULL DEFAULT .50,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS recommendation_impressions(
  id bigserial PRIMARY KEY, user_id uuid REFERENCES users(id) ON DELETE CASCADE, track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  surface text NOT NULL, position int, reason text, shown_at timestamptz NOT NULL DEFAULT now(), clicked_at timestamptz
);
CREATE TABLE IF NOT EXISTS experiments(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text UNIQUE NOT NULL, description text, status text NOT NULL DEFAULT 'draft', config jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS experiment_assignments(
  experiment_id uuid REFERENCES experiments(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  variant text NOT NULL, assigned_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(experiment_id,user_id)
);

CREATE TABLE IF NOT EXISTS search_queries(
  id bigserial PRIMARY KEY, user_id uuid REFERENCES users(id) ON DELETE SET NULL, query text NOT NULL, filters jsonb NOT NULL DEFAULT '{}',
  result_count int, clicked_entity jsonb, country_code char(2), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_queries_time_idx ON search_queries(created_at DESC);

CREATE TABLE IF NOT EXISTS notifications(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL, title text NOT NULL, body text, payload jsonb NOT NULL DEFAULT '{}', read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_time ON notifications(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS content_reports(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reporter_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  entity_type text NOT NULL, entity_id uuid NOT NULL, reason text NOT NULL, details text, status text NOT NULL DEFAULT 'open',
  moderator_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE TABLE IF NOT EXISTS moderation_actions(
  id bigserial PRIMARY KEY, moderator_id uuid REFERENCES users(id) ON DELETE SET NULL, entity_type text NOT NULL, entity_id uuid NOT NULL,
  action text NOT NULL, reason text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fraud_signals(
  id bigserial PRIMARY KEY, user_id uuid REFERENCES users(id) ON DELETE SET NULL, device_id text, signal_type text NOT NULL,
  score numeric(7,4), payload jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_plans(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text UNIQUE NOT NULL, name text NOT NULL, tier text NOT NULL,
  billing_period text NOT NULL, currency char(3) NOT NULL, price_minor bigint NOT NULL, region_code char(2) NOT NULL DEFAULT 'WW',
  features jsonb NOT NULL DEFAULT '{}', active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS subscription_offers(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), plan_id uuid REFERENCES subscription_plans(id) ON DELETE CASCADE,
  code text UNIQUE, trial_days int DEFAULT 0, discount_percent numeric(5,2), starts_at timestamptz, ends_at timestamptz, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS billing_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, event_id text UNIQUE NOT NULL, event_type text NOT NULL,
  payload jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz
);
CREATE TABLE IF NOT EXISTS payment_methods(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE, provider text NOT NULL,
  provider_ref text NOT NULL, brand text, last4 text, exp_month int, exp_year int, active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS royalty_rates(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), territory char(2) NOT NULL, plan_tier text NOT NULL, currency char(3) NOT NULL,
  rate_per_unit numeric(18,9) NOT NULL, effective_from date NOT NULL, effective_to date
);
CREATE TABLE IF NOT EXISTS royalty_statements(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  period_start date NOT NULL, period_end date NOT NULL, currency char(3) NOT NULL, gross numeric(18,6) NOT NULL DEFAULT 0,
  deductions numeric(18,6) NOT NULL DEFAULT 0, net numeric(18,6) NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS royalty_payouts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  statement_id uuid REFERENCES royalty_statements(id), provider text, provider_ref text UNIQUE, amount numeric(18,6), currency char(3),
  status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS podcasts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, artwork_url text, language_code text,
  explicit boolean NOT NULL DEFAULT false, publisher text, rss_url text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS podcast_episodes(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), podcast_id uuid REFERENCES podcasts(id) ON DELETE CASCADE, title text NOT NULL,
  description text, published_at timestamptz, duration_ms int, audio_key text, explicit boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS podcast_progress(
  user_id uuid REFERENCES users(id) ON DELETE CASCADE, episode_id uuid REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  position_ms int NOT NULL DEFAULT 0, completed boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,episode_id)
);

CREATE TABLE IF NOT EXISTS music_videos(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), track_id uuid REFERENCES tracks(id) ON DELETE CASCADE, title text NOT NULL,
  video_key text, thumbnail_key text, duration_ms int, explicit boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'ready'
);
CREATE TABLE IF NOT EXISTS live_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE, title text NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz, stream_url text, ticket_url text, status text NOT NULL DEFAULT 'scheduled'
);
CREATE TABLE IF NOT EXISTS artist_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE, city text, country_code char(2),
  venue text, starts_at timestamptz, ticket_url text, status text NOT NULL DEFAULT 'published'
);

CREATE TABLE IF NOT EXISTS merch_links(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid REFERENCES artists(id) ON DELETE CASCADE, title text NOT NULL,
  url text NOT NULL, currency char(3), price_minor bigint, image_url text, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS playlist_folders(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE, name text NOT NULL, parent_id uuid REFERENCES playlist_folders(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS playlist_folder_items(
  folder_id uuid REFERENCES playlist_folders(id) ON DELETE CASCADE, playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE, PRIMARY KEY(folder_id,playlist_id)
);
CREATE TABLE IF NOT EXISTS playlist_versions(
  id bigserial PRIMARY KEY, playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE, snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_export_jobs(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'queued',
  object_key text, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS deletion_requests(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'requested',
  requested_at timestamptz NOT NULL DEFAULT now(), scheduled_for timestamptz, completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS consent_records(
  id bigserial PRIMARY KEY, user_id uuid REFERENCES users(id) ON DELETE CASCADE, policy_version text NOT NULL,
  consent_type text NOT NULL, granted boolean NOT NULL, ip inet, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS localization_strings(
  key text NOT NULL, language_code text NOT NULL, value text NOT NULL, PRIMARY KEY(key,language_code)
);
CREATE TABLE IF NOT EXISTS regional_configs(
  country_code char(2) PRIMARY KEY, currency char(3) NOT NULL, language_code text NOT NULL, timezone text NOT NULL,
  age_floor int NOT NULL DEFAULT 13, features jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ad_slots(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), placement text NOT NULL, region_code char(2) NOT NULL DEFAULT 'WW',
  campaign_id uuid, active boolean NOT NULL DEFAULT false, config jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS campaigns(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, advertiser text, starts_at timestamptz, ends_at timestamptz,
  budget_minor bigint, currency char(3), status text NOT NULL DEFAULT 'draft', targeting jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS sponsored_playlists(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE, disclosure text NOT NULL, starts_at timestamptz, ends_at timestamptz
);

CREATE INDEX IF NOT EXISTS user_devices_user_idx ON user_devices(user_id,last_seen_at DESC);
CREATE INDEX IF NOT EXISTS rooms_updated_idx ON listening_rooms(updated_at DESC);
CREATE INDEX IF NOT EXISTS impressions_user_time_idx ON recommendation_impressions(user_id,shown_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_idx ON content_reports(status,created_at DESC);
CREATE INDEX IF NOT EXISTS artist_posts_time_idx ON artist_posts(artist_id,published_at DESC);

INSERT INTO subscription_plans(key,name,tier,billing_period,currency,price_minor,region_code,features) VALUES
('free','Waeve Free','free','month','USD',0,'WW','{"ads":true,"background":false,"offline":false,"lossless":false}'),
('premium','Waeve Premium','premium','month','USD',999,'WW','{"ads":false,"background":true,"offline":true,"lossless":true,"hires":true,"immersive":true}'),
('student','Waeve Student','student','month','USD',499,'WW','{"ads":false,"background":true,"offline":true,"lossless":true}'),
('family','Waeve Family','family','month','USD',1499,'WW','{"ads":false,"background":true,"offline":true,"lossless":true,"members":6}')
ON CONFLICT(key) DO NOTHING;

INSERT INTO feature_flags(key,enabled,rollout_percent) VALUES
('lyrics_translation',true,100),('lyrics_pronunciation',true,100),('automix',true,100),('crossfade',true,100),
('gapless',true,100),('voice_search',true,100),('semantic_search',true,100),('music_videos',true,100),
('podcasts',true,100),('live_events',true,100),('artist_fan_support',true,100),('artist_storefront',true,100),
('royalty_statements',true,100),('passkeys',true,100),('social_listening',true,100),('playlist_folders',true,100),
('data_export',true,100),('account_deletion',true,100),('regional_pricing',true,100),('ads_free_tier',true,100),
('sponsored_editorial',true,100),('experiments',true,100),('fraud_detection',true,100)
ON CONFLICT(key) DO NOTHING;
