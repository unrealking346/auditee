/**
 * Canonical Waeve API/event contracts.
 *
 * These contracts are transport-neutral. HTTP, WebSocket, queues,
 * internal services and native clients must map to these definitions.
 */

export type WaeveId = string;

export type WaeveRole =
  | 'LISTENER'
  | 'ARTIST'
  | 'LABEL'
  | 'DISTRIBUTOR'
  | 'PUBLISHER'
  | 'RIGHTS_ADMIN'
  | 'ROYALTY_OPERATOR'
  | 'ADVERTISER'
  | 'DEVELOPER'
  | 'MODERATOR'
  | 'ADMIN';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

export interface ApiResponse<T> {
  data: T;
  requestId: string;
}

export interface Pagination {
  limit: number;
  cursor?: string;
  nextCursor?: string;
}

export interface UserContract {
  id: WaeveId;
  email: string;
  displayName: string;
  username?: string;
  role: WaeveRole;
  countryCode?: string;
  createdAt: string;
}

export interface DeviceContract {
  id: WaeveId;
  platform: string;
  appVersion: string;
  capabilities: string[];
}

export interface TrackContract {
  id: WaeveId;
  title: string;
  artistId: WaeveId;
  artistName: string;
  albumId?: WaeveId;
  albumName?: string;
  durationMs: number;
  artworkUrl?: string;
  audioUrl?: string;
  explicit: boolean;
}

export interface PlaylistContract {
  id: WaeveId;
  ownerId: WaeveId;
  title: string;
  description?: string;
  isPublic: boolean;
  collaborative: boolean;
  trackIds: WaeveId[];
}

export interface SearchRequest {
  query: string;
  type?:
    | 'all'
    | 'track'
    | 'artist'
    | 'album'
    | 'playlist'
    | 'podcast'
    | 'lyrics';
  limit?: number;
  cursor?: string;
  countryCode?: string;
}

export interface SearchResultSet {
  tracks: TrackContract[];
  artists: Array<{
    id: WaeveId;
    name: string;
    artworkUrl?: string;
  }>;
  albums: Array<{
    id: WaeveId;
    title: string;
    artistId: WaeveId;
    artworkUrl?: string;
  }>;
  playlists: PlaylistContract[];
  pagination: Pagination;
}

export interface PlaybackAuthorizationRequest {
  trackId: WaeveId;
  deviceId: WaeveId;
  quality?: 'standard' | 'high' | 'lossless' | 'hires' | 'immersive';
  positionMs?: number;
}

export interface PlaybackAuthorization {
  authorizationId: WaeveId;
  trackId: WaeveId;
  mediaUrl: string;
  expiresAt: string;
  quality: string;
  expiresInSeconds: number;
}

export type PlaybackEventType =
  | 'START'
  | 'PROGRESS'
  | 'PAUSE'
  | 'RESUME'
  | 'SKIP'
  | 'COMPLETE'
  | 'REPLAY';

export interface PlaybackEvent {
  id: WaeveId;
  userId?: WaeveId;
  deviceId: WaeveId;
  trackId: WaeveId;
  type: PlaybackEventType;
  positionMs: number;
  sessionId: WaeveId;
  occurredAt: string;
}

export interface LikeContract {
  userId: WaeveId;
  trackId: WaeveId;
  createdAt: string;
}

export interface FollowContract {
  userId: WaeveId;
  artistId: WaeveId;
  createdAt: string;
}

export interface RightsDecision {
  trackId: WaeveId;
  territory: string;
  allowed: boolean;
  masterAllowed: boolean;
  publishingAllowed: boolean;
  reason?: string;
  evaluatedAt: string;
}

export interface EntitlementContract {
  userId: WaeveId;
  plan: string;
  active: boolean;
  expiresAt?: string;
  provider?: string;
}

export interface NotificationContract {
  id: WaeveId;
  userId: WaeveId;
  kind: string;
  channels: Array<'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS'>;
  title: string;
  body: string;
  createdAt: string;
}

export interface WaeveEvent<T = unknown> {
  id: WaeveId;
  type: string;
  version: number;
  occurredAt: string;
  producer: string;
  correlationId: string;
  payload: T;
}
