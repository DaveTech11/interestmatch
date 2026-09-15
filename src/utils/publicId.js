import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; // no 0/O/1/l/I ambiguity

/**
 * Generates a short, URL-safe, non-sequential public identifier suitable for
 * exposing in a `t.me/Bot?start=profile_<id>` deep link. This is intentionally
 * NOT the database primary key, so internal row ids/user counts are never
 * leaked to end users.
 */
export function generatePublicId(length = 10) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function buildProfileDeepLink(botUsername, publicId) {
  if (!botUsername) return null;
  return `https://t.me/${botUsername}?start=profile_${publicId}`;
}

export function parseStartPayload(payload) {
  if (!payload || typeof payload !== 'string') return null;
  const match = /^profile_([A-Za-z0-9]{6,20})$/.exec(payload.trim());
  if (!match) return null;
  return { type: 'profile', publicId: match[1] };
}
