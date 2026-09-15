import { ValidationError } from './errors.js';

export function requireString(value, fieldName, { min = 1, max = 4000 } = {}) {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new ValidationError(`${fieldName} must be at least ${min} characters`);
  }
  if (trimmed.length > max) {
    throw new ValidationError(`${fieldName} must be at most ${max} characters`);
  }
  return trimmed;
}

export function requireInt(value, fieldName, { min, max } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }
  if (min !== undefined && n < min) throw new ValidationError(`${fieldName} must be >= ${min}`);
  if (max !== undefined && n > max) throw new ValidationError(`${fieldName} must be <= ${max}`);
  return n;
}

export function requireOneOf(value, fieldName, allowed) {
  if (!allowed.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

// Strips control characters and collapses whitespace — used on any free-text
// field a user submits (bio, connection message) before it is stored or shown
// to another user.
export function sanitizeFreeText(value, maxLength = 300) {
  const cleaned = String(value)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
  return cleaned;
}
