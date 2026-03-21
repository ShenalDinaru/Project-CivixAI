const crypto = require('crypto');

function getVaultKeyBytes() {
  const material = process.env.VAULT_ENCRYPTION_KEY;
  if (!material || typeof material !== 'string' || !material.trim()) {
    throw new Error('VAULT_ENCRYPTION_KEY env var is required to use vault encryption');
  }

  // Derive a stable 32-byte AES key from any key material.
  // This avoids requiring the env var to be exactly 32 bytes.
  return crypto.createHash('sha256').update(material).digest();
}

function encryptString(plainText) {
  const key = getVaultKeyBytes();
  const iv = crypto.randomBytes(12); // Recommended size for GCM

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

function decryptString({ iv, tag, ciphertext }) {
  const key = getVaultKeyBytes();

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

function encryptJson(obj) {
  return encryptString(JSON.stringify(obj));
}

function decryptJson(blob) {
  const plain = decryptString(blob);
  return JSON.parse(plain);
}

module.exports = {
  encryptString,
  decryptString,
  encryptJson,
  decryptJson,
};

