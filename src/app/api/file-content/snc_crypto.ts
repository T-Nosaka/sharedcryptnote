// SNC1 encrypted file format (Phase1).
// Layout (big-endian): magic "SNC1"(4B) | ver 0x01(1B) | kdfId 0x01=scrypt(1B)
// | N u32BE(4B) | r u32BE(4B) | p u32BE(4B) | salt(16B) | nonce(12B)
// | ciphertext(variable) | GCM tag(16B)
// Plaintext: raw file bytes, same as the BF01 path.
// AAD: header bytes (magic..nonce, 46B).
// NOTE: server-only module, uses node:crypto. Never import from client components.

import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

export const SNC_MAGIC = 'SNC1';
export const SNC_VERSION = 0x01;
export const SNC_KDF_SCRYPT = 0x01;
export const SNC_N = 16384;
export const SNC_R = 8;
export const SNC_P = 1;
export const SNC_SALT_LEN = 16;
export const SNC_NONCE_LEN = 12;
export const SNC_TAG_LEN = 16;
export const SNC_HEADER_LEN = 46;
const SNC_MAXMEM = 64 * 1024 * 1024;

export function isSnc1Data(data: Uint8Array): boolean {
  return (
    data.length >= 4 &&
    data[0] === 0x53 &&
    data[1] === 0x4e &&
    data[2] === 0x43 &&
    data[3] === 0x31
  );
}

export class SncCrypt {
  static encrypt(password: Uint8Array, plaintext: Uint8Array): Uint8Array {
    const salt = randomBytes(SNC_SALT_LEN);
    const nonce = randomBytes(SNC_NONCE_LEN);
    const key = scryptSync(Buffer.from(password), salt, 32, {
      N: SNC_N, r: SNC_R, p: SNC_P, maxmem: SNC_MAXMEM,
    });
    try {
      const header = Buffer.alloc(SNC_HEADER_LEN);
      header.write(SNC_MAGIC, 0, 'ascii');
      header[4] = SNC_VERSION;
      header[5] = SNC_KDF_SCRYPT;
      header.writeUInt32BE(SNC_N, 6);
      header.writeUInt32BE(SNC_R, 10);
      header.writeUInt32BE(SNC_P, 14);
      salt.copy(header, 18);
      nonce.copy(header, 34);
      const cipher = createCipheriv('aes-256-gcm', key, nonce);
      cipher.setAAD(header);
      const ct = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
      const tag = cipher.getAuthTag();
      return Buffer.concat([header, ct, tag]);
    } finally {
      key.fill(0);
    }
  }

  static decrypt(password: Uint8Array, input: Uint8Array): Uint8Array | null {
    try {
      if (!isSnc1Data(input) || input.length < SNC_HEADER_LEN + SNC_TAG_LEN) return null;
      const buf = Buffer.from(input);
      const header = buf.subarray(0, SNC_HEADER_LEN);
      if (header[4] !== SNC_VERSION || header[5] !== SNC_KDF_SCRYPT) return null;
      if (
        header.readUInt32BE(6) !== SNC_N ||
        header.readUInt32BE(10) !== SNC_R ||
        header.readUInt32BE(14) !== SNC_P
      ) {
        return null;
      }
      const salt = header.subarray(18, 34);
      const nonce = header.subarray(34, 46);
      const tag = buf.subarray(buf.length - SNC_TAG_LEN);
      const ct = buf.subarray(SNC_HEADER_LEN, buf.length - SNC_TAG_LEN);
      const key = scryptSync(Buffer.from(password), Buffer.from(salt), 32, {
        N: SNC_N, r: SNC_R, p: SNC_P, maxmem: SNC_MAXMEM,
      });
      try {
        const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(nonce));
        decipher.setAAD(Buffer.from(header));
        decipher.setAuthTag(Buffer.from(tag));
        return Buffer.concat([decipher.update(Buffer.from(ct)), decipher.final()]);
      } finally {
        key.fill(0);
      }
    } catch {
      return null;
    }
  }
}
