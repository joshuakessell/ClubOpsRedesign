import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashTokenDeterministic(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashSecretWithSalt(secret: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(secret, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifySecretWithSalt(secret: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(secret, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}
