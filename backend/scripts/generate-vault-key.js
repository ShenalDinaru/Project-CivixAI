const crypto = require('crypto');

// Generate a stable-friendly, URL-safe secret for VAULT_ENCRYPTION_KEY.
const key = crypto.randomBytes(48).toString('base64url');

console.log('Generated VAULT_ENCRYPTION_KEY:\n');
console.log(key);
console.log('\nAdd this exact value to:');
console.log('- backend/.env');
console.log('- deployment env (e.g. Vercel project env vars)');
console.log('\nImportant: keep it unchanged after data is encrypted.');

