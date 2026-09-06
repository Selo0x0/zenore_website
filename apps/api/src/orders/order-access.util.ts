import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const GUEST_TOKEN_BYTES = 32;
const GUEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createGuestOrderAccess() {
  const token = randomBytes(GUEST_TOKEN_BYTES).toString('base64url');
  return { token, hash: hashGuestOrderToken(token) };
}

export function verifyGuestOrderAccess(
  expectedHash: string | null,
  token: string | undefined,
) {
  if (!expectedHash || !token || !GUEST_TOKEN_PATTERN.test(token)) {
    return false;
  }

  const actualHash = hashGuestOrderToken(token);
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(actualHash, 'hex');

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashGuestOrderToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
