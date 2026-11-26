import crypto from 'node:crypto';

// No 0/O or 1/I so codes are easy to read out loud
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeJoinCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
  return code;
}
