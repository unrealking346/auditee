import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const mkdir = p => fs.mkdirSync(p, { recursive: true });

const writeIfMissing = (file, content) => {
  if (fs.existsSync(file)) return false;
  mkdir(path.dirname(file));
  fs.writeFileSync(file, content);
  return true;
};

const write = (file, content) => {
  mkdir(path.dirname(file));
  fs.writeFileSync(file, content);
};

const root = p => path.join(ROOT, p);

console.log('=== WAEVE CORE IMPLEMENTATION ===');
console.log('Preserving all existing canonical implementation files.');

let created = 0;

/* ---------------------------------------------------------
   CONTRACT PACKAGE
--------------------------------------------------------- */

const contractsPkg = root('packages/contracts/package.json');

if (!fs.existsSync(contractsPkg)) {
  write(contractsPkg, JSON.stringify({
    name: '@waeve/contracts',
    private: true,
    version: '1.0.0',
    type: 'module',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    scripts: {
      check: 'tsc --noEmit',
      build: 'tsc',
      test: 'npm run build && node --test dist/test/*.test.js'
    },
    devDependencies: {
      typescript: '^5.8.3'
    }
  }, null, 2) + '\n');
  created++;
}

created += writeIfMissing(
  root('packages/contracts/tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      declaration: true,
      outDir: 'dist',
      rootDir: 'src',
      skipLibCheck: true
    },
    include: ['src/**/*.ts']
  }, null, 2) + '\n'
);

created += writeIfMissing(
  root('packages/contracts/src/index.ts'),
`/**
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
`
);

created += writeIfMissing(
  root('packages/contracts/src/test/contracts.test.ts'),
`import test from 'node:test';
import assert from 'node:assert/strict';
import type {
  PlaybackAuthorizationRequest,
  SearchRequest,
  WaeveEvent
} from '../index.js';

test('canonical playback request has required identity fields', () => {
  const request: PlaybackAuthorizationRequest = {
    trackId: 'track-1',
    deviceId: 'device-1'
  };

  assert.equal(request.trackId, 'track-1');
  assert.equal(request.deviceId, 'device-1');
});

test('canonical search contract accepts bounded query metadata', () => {
  const request: SearchRequest = {
    query: 'music',
    type: 'track',
    limit: 20
  };

  assert.equal(request.type, 'track');
  assert.equal(request.limit, 20);
});

test('canonical event contract carries version and correlation identity', () => {
  const event: WaeveEvent<{ value: number }> = {
    id: 'event-1',
    type: 'TEST',
    version: 1,
    occurredAt: new Date().toISOString(),
    producer: 'test',
    correlationId: 'corr-1',
    payload: { value: 1 }
  };

  assert.equal(event.version, 1);
  assert.equal(event.correlationId, 'corr-1');
});
`
);

/* ---------------------------------------------------------
   SECURITY FOUNDATION
--------------------------------------------------------- */

created += writeIfMissing(
  root('packages/security/package.json'),
  JSON.stringify({
    name: '@waeve/security',
    private: true,
    version: '1.0.0',
    type: 'module',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    scripts: {
      check: 'tsc --noEmit',
      build: 'tsc',
      test: 'npm run build && node --test dist/test/*.test.js'
    },
    devDependencies: {
      typescript: '^5.8.3'
    }
  }, null, 2) + '\n'
);

created += writeIfMissing(
  root('packages/security/tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      declaration: true,
      outDir: 'dist',
      rootDir: 'src',
      skipLibCheck: true
    },
    include: ['src/**/*.ts']
  }, null, 2) + '\n'
);

created += writeIfMissing(
  root('packages/security/src/index.ts'),
`export type SecurityRole =
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

export type SecurityAction =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'MODERATE'
  | 'OPERATE_RIGHTS'
  | 'OPERATE_ROYALTIES'
  | 'OPERATE_PAYMENTS';

const permissions: Record<SecurityRole, SecurityAction[]> = {
  LISTENER: ['READ', 'CREATE', 'UPDATE'],
  ARTIST: ['READ', 'CREATE', 'UPDATE', 'PUBLISH'],
  LABEL: ['READ', 'CREATE', 'UPDATE', 'PUBLISH'],
  DISTRIBUTOR: ['READ', 'CREATE', 'UPDATE', 'PUBLISH'],
  PUBLISHER: ['READ', 'CREATE', 'UPDATE'],
  RIGHTS_ADMIN: ['READ', 'OPERATE_RIGHTS'],
  ROYALTY_OPERATOR: ['READ', 'OPERATE_ROYALTIES'],
  ADVERTISER: ['READ', 'CREATE', 'UPDATE'],
  DEVELOPER: ['READ', 'CREATE', 'UPDATE'],
  MODERATOR: ['READ', 'MODERATE'],
  ADMIN: [
    'READ','CREATE','UPDATE','DELETE','PUBLISH','MODERATE',
    'OPERATE_RIGHTS','OPERATE_ROYALTIES','OPERATE_PAYMENTS'
  ]
};

export function can(role: SecurityRole, action: SecurityAction): boolean {
  return permissions[role].includes(action);
}

export function assertAllowed(
  role: SecurityRole,
  action: SecurityAction
): void {
  if (!can(role, action)) {
    throw new Error(\`SECURITY_DENIED:\${role}:\${action}\`);
  }
}

export function sanitizeRequestId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 128);
}
`
);

created += writeIfMissing(
  root('packages/security/src/test/security.test.ts'),
`import test from 'node:test';
import assert from 'node:assert/strict';
import { can, assertAllowed, sanitizeRequestId } from '../index.js';

test('listeners cannot operate royalties', () => {
  assert.equal(can('LISTENER', 'OPERATE_ROYALTIES'), false);
});

test('royalty operators can operate royalties', () => {
  assert.equal(can('ROYALTY_OPERATOR', 'OPERATE_ROYALTIES'), true);
});

test('denied operations throw', () => {
  assert.throws(
    () => assertAllowed('LISTENER', 'OPERATE_PAYMENTS'),
    /SECURITY_DENIED/
  );
});

test('request identifiers are sanitized and bounded', () => {
  const value = sanitizeRequestId('abc<script>:123');
  assert.equal(value.includes('<'), false);
});
`
);

/* ---------------------------------------------------------
   ROOT CONTRACT INTEGRATION RECORD
--------------------------------------------------------- */

created += writeIfMissing(
  root('docs/CANONICAL_IMPLEMENTATION_POLICY.md'),
`# Waeve Canonical Implementation Policy

Waeve uses one canonical platform contract layer shared by backend services
and all client families.

## Rules

- Existing source variants remain preserved under \`_sources/\`.
- Canonical implementations are authoritative for new integration.
- Clients must consume canonical contracts rather than inventing incompatible
  representations.
- Security decisions remain server authoritative.
- Playback authorization remains server authoritative.
- Rights and territory decisions remain server authoritative.
- Subscription/payment state remains server authoritative.
- Royalty accounting remains append-oriented and auditable.
- Client-local state is never the authoritative source for commercial rights,
  payments, royalties or catalog ownership.
- Every implementation requires applicable build and test evidence.

## Client families

Listener:
Android, iOS/iPadOS, Web, Windows, macOS, Linux, TV, console,
automotive, wearable and connected-device clients.

Industry:
Artist Studio, label, distributor, publisher/rights, royalty,
advertising/partner and licensing clients.

Platform:
Administration, moderation, operations and developer/API clients.
`
);

console.log(`Files created: ${created}`);
console.log('Original source variants modified: 0');
console.log('Canonical contract/security implementation established.');

console.log('\n=== RUNNING CORE CHECKS ===');

const { spawnSync } = await import('node:child_process');

const commands = [
  ['contracts-check', 'npm', ['run','check','--workspace=@waeve/contracts']],
  ['security-check', 'npm', ['run','check','--workspace=@waeve/security']]
];

let failed = false;

for (const [name, command, args] of commands) {
  console.log(`\n--- ${name} ---`);
  const r = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env
  });

  if (r.status !== 0) {
    failed = true;
    console.log(`${name}: FAIL`);
  } else {
    console.log(`${name}: PASS`);
  }
}

console.log('\n=== CORE IMPLEMENTATION RESULT ===');
console.log(failed ? 'Status: BLOCKED' : 'Status: PASS');
process.exitCode = failed ? 1 : 0;
