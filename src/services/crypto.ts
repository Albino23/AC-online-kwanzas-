// Cryptographic utility for secure password hashing using Web Crypto API (SHA-256)
// Prevents storing or exposing plain text passwords anywhere in source code or storage.

const SALT_PREFIX = 'ackz_salt_2025_';

export async function hashPassword(plainText: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(SALT_PREFIX + plainText.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPasswordHash(plainText: string, storedHash: string): Promise<boolean> {
  const computed = await hashPassword(plainText);
  return computed === storedHash;
}
