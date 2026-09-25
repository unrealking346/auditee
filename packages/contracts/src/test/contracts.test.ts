import test from 'node:test';
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
