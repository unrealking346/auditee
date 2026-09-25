import test from 'node:test';
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
