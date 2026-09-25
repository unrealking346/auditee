import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  passwordAlgorithm
} from './passwords.js';

test('password hashing produces a non-plaintext credential', async () => {
  const password = 'Waeve-Test-Password-123!';
  const encoded = await hashPassword(password);

  assert.notEqual(encoded, password);
  assert.ok(encoded.length > 40);
  assert.ok(['argon2id', 'scrypt'].includes(passwordAlgorithm(encoded)));
});

test('correct password verifies', async () => {
  const encoded = await hashPassword('Waeve-Test-Password-123!');
  assert.equal(
    await verifyPassword('Waeve-Test-Password-123!', encoded),
    true
  );
});

test('incorrect password is rejected', async () => {
  const encoded = await hashPassword('Waeve-Test-Password-123!');
  assert.equal(
    await verifyPassword('incorrect-password', encoded),
    false
  );
});

test('malformed credentials are rejected', async () => {
  assert.equal(await verifyPassword('anything', 'invalid'), false);
});
