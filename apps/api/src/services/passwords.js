import crypto from 'node:crypto';

let argon2 = null;

try {
  const module = await import('argon2');
  argon2 = module.default ?? module;
} catch {
  argon2 = null;
}

const FALLBACK_PREFIX = 'scrypt$';
const ARGON2_PREFIX = '$argon2id$';

function base64url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64url(value) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  return Buffer.from(normalized, 'base64');
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must contain at least 8 characters');
  }

  if (argon2?.hash) {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });
  }

  const salt = crypto.randomBytes(16);
  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      64,
      {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 128 * 1024 * 1024
      },
      (error, key) => error ? reject(error) : resolve(key)
    );
  });

  return `${FALLBACK_PREFIX}${base64url(salt)}$${base64url(derived)}`;
}

export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || typeof encoded !== 'string') {
    return false;
  }

  if (encoded.startsWith(ARGON2_PREFIX) && argon2?.verify) {
    try {
      return await argon2.verify(encoded, password);
    } catch {
      return false;
    }
  }

  if (!encoded.startsWith(FALLBACK_PREFIX)) {
    return false;
  }

  const parts = encoded.split('$');
  if (parts.length !== 3) {
    return false;
  }

  const salt = fromBase64url(parts[1]);
  const expected = fromBase64url(parts[2]);

  const actual = await new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      expected.length,
      {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 128 * 1024 * 1024
      },
      (error, key) => error ? reject(error) : resolve(key)
    );
  });

  return actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected);
}

export function passwordAlgorithm(encoded) {
  if (encoded.startsWith(ARGON2_PREFIX)) return 'argon2id';
  if (encoded.startsWith(FALLBACK_PREFIX)) return 'scrypt';
  return 'unknown';
}
