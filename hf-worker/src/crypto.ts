import crypto from 'crypto';

const MAGIC_HEADER = Buffer.from('SEN1'); // 4 bytes to identify encrypted blobs

function getSecretKey(): Buffer {
  const secret = process.env.STORAGE_ENCRYPTION_SECRET || 'default_senpaiden_secret_key_32bytes!!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt buffer with AES-256-GCM
 * Output format: [SEN1 (4B)][IV (12B)][AuthTag (16B)][Ciphertext]
 */
export function encryptBuffer(buffer: Buffer): Buffer {
  const key = getSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([MAGIC_HEADER, iv, tag, encrypted]);
}

/**
 * Decrypt buffer if encrypted with AES-256-GCM, otherwise return raw buffer
 */
export function decryptBuffer(buffer: Buffer): Buffer {
  if (buffer.length < 32 || !buffer.subarray(0, 4).equals(MAGIC_HEADER)) {
    return buffer; // Not encrypted, return original
  }

  const key = getSecretKey();
  const iv = buffer.subarray(4, 16);
  const tag = buffer.subarray(16, 32);
  const ciphertext = buffer.subarray(32);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function isEncrypted(buffer: Buffer): boolean {
  return buffer.length >= 32 && buffer.subarray(0, 4).equals(MAGIC_HEADER);
}
