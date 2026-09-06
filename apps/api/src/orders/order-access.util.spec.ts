import {
  createGuestOrderAccess,
  verifyGuestOrderAccess,
} from './order-access.util';

describe('guest order access', () => {
  it('creates a high-entropy token and stores a one-way hash', () => {
    const first = createGuestOrderAccess();
    const second = createGuestOrderAccess();

    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.hash).not.toContain(first.token);
    expect(second.token).not.toBe(first.token);
  });

  it('accepts only the exact token for the stored hash', () => {
    const access = createGuestOrderAccess();

    expect(verifyGuestOrderAccess(access.hash, access.token)).toBe(true);
    expect(verifyGuestOrderAccess(access.hash, `${access.token}x`)).toBe(false);
    expect(verifyGuestOrderAccess(access.hash, undefined)).toBe(false);
    expect(verifyGuestOrderAccess(null, access.token)).toBe(false);
  });
});
