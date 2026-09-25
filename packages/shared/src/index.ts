/**
 * WAEVE SHARED DOMAIN CONTRACTS
 *
 * Canonical cross-platform contracts for the Waeve ecosystem.
 *
 * These contracts intentionally preserve the capabilities already present
 * in the legacy Waeve application while providing a foundation suitable
 * for the production API, database, web client, Android client and future
 * applications.
 */

/* -------------------------------------------------------------------------- */
/* Identity                                                                    */
/* -------------------------------------------------------------------------- */

export interface WaeveUser {
  id: string;
  username?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Music catalogue                                                             */
/* -------------------------------------------------------------------------- */

export interface WaeveArtist {
  id: string;
  name: string;
  imageUrl?: string;
  verified?: boolean;
}

export interface WaeveAlbum {
  id: string;
  title: string;
  artistId?: string;
  artistName?: string;
  artworkUrl?: string;
  releaseDate?: string;
}

export interface WaeveTrack {
  id: string;
  title: string;

  artist: string;
  artistId?: string;

  album: string;
  albumId?: string;

  genre?: string;
  year?: number;

  duration: number;

  /**
   * Playback URL or API-resolved media reference.
   * Permanent/private storage credentials must never be exposed here.
   */
  audio?: string;
  audioUrl?: string;

  artwork?: string;
  artworkUrl?: string;

  explicit: boolean;

  isrc?: string;
  releaseId?: string;

  available?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Playlists                                                                   */
/* -------------------------------------------------------------------------- */

export interface WaevePlaylist {
  id: string;
  name: string;

  /**
   * Track IDs preserve the behavior of the original Waeve playlist engine.
   */
  trackIds: string[];

  coverNumber?: number;
  coverUrl?: string;

  ownerId?: string;

  collaborative?: boolean;
  public?: boolean;

  createdAt: string;
  updatedAt?: string;
}

export interface WaevePlaylistTrack {
  playlistId: string;
  trackId: string;
  position: number;
  addedAt: string;
  addedBy?: string;
}

/* -------------------------------------------------------------------------- */
/* Library                                                                     */
/* -------------------------------------------------------------------------- */

export interface WaeveLibrary {
  userId: string;
  likedTrackIds: string[];
  savedAlbumIds: string[];
  followedArtistIds: string[];
  playlistIds: string[];
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Playback                                                                    */
/* -------------------------------------------------------------------------- */

export type WaeveRepeatMode = "off" | "track" | "queue";

export interface WaevePlaybackState {
  currentTrackId?: string;
  queueTrackIds: string[];
  queueIndex: number;

  positionSeconds: number;
  durationSeconds: number;

  volume: number;
  muted: boolean;

  playing: boolean;
  shuffle: boolean;
  repeat: WaeveRepeatMode;

  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Search                                                                      */
/* -------------------------------------------------------------------------- */

export type WaeveSearchType =
  | "all"
  | "track"
  | "artist"
  | "album"
  | "playlist";

export interface WaeveSearchRequest {
  query: string;
  type?: WaeveSearchType;
  limit?: number;
  offset?: number;
}

export interface WaeveSearchResults {
  tracks: WaeveTrack[];
  artists: WaeveArtist[];
  albums: WaeveAlbum[];
  playlists: WaevePlaylist[];

  query: string;
  total?: number;
}

/* -------------------------------------------------------------------------- */
/* Discovery                                                                   */
/* -------------------------------------------------------------------------- */

export interface WaeveRecommendationSet {
  id: string;
  title: string;
  description?: string;
  trackIds: string[];
  generatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Social                                                                      */
/* -------------------------------------------------------------------------- */

export interface WaeveLike {
  userId: string;
  trackId: string;
  createdAt: string;
}

export interface WaeveFollow {
  userId: string;
  artistId: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Listening / analytics                                                       */
/* -------------------------------------------------------------------------- */

export interface WaevePlaybackEvent {
  id: string;
  userId?: string;
  trackId: string;

  event:
    | "play"
    | "pause"
    | "seek"
    | "complete"
    | "skip"
    | "start";

  positionSeconds?: number;
  durationSeconds?: number;

  sessionId?: string;
  deviceId?: string;

  occurredAt: string;
}

/* -------------------------------------------------------------------------- */
/* API envelope                                                                */
/* -------------------------------------------------------------------------- */

export interface WaeveApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface WaeveApiResponse<T> {
  data: T;
  error?: WaeveApiError;
  requestId?: string;
}

/* -------------------------------------------------------------------------- */
/* Legacy compatibility                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The legacy application stores playlists locally.
 * This type describes the persisted legacy representation so migration
 * tooling can recognize and safely import existing user data.
 */
export interface WaeveLegacyPlaylist {
  id: string;
  name: string;
  trackIds: string[];
  coverNumber?: number;
  createdAt: string;
}

/**
 * Converts the legacy track shape conceptually into the canonical model.
 * Actual persistence/migration belongs to the client/data layer.
 */
export type WaeveCatalogTrack = WaeveTrack;


/** Legacy web compatibility alias. */
export type Song = WaeveTrack;
