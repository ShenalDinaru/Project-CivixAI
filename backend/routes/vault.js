const express = require('express');
const crypto = require('crypto');
const { db } = require('../config/firebase');
const { encryptJson, decryptJson } = require('../utils/vaultCrypto');

const router = express.Router();

function requireString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

function requireUserUID(req, res) {
  const userUID = req.body?.userUID;
  if (typeof userUID !== 'string' || !userUID.trim()) {
    res.status(400).json({ success: false, message: 'userUID is required' });
    return null;
  }
  return userUID.trim();
}

router.post('/entries', async (req, res) => {
  try {
    const userUID = requireUserUID(req, res);
    if (!userUID) return;

    const entriesSnap = await db.ref(`users/${userUID}/vault/entries`).once('value');
    const entriesObj = entriesSnap.val() || {};

    const entries = Object.entries(entriesObj).map(([id, record]) => {
      const encryptedData = record?.encryptedData;
      if (!encryptedData) return null;

      let payload;
      try {
        payload = decryptJson(encryptedData);
      } catch (e) {
        if (e?.message && e.message.includes('VAULT_ENCRYPTION_KEY')) {
          // Encryption key misconfiguration should fail loudly (otherwise vault looks empty).
          throw e;
        }
        // Skip entries that can't be decrypted (e.g. encryption key changed).
        console.warn('Vault: failed to decrypt one entry:', id);
        return null;
      }
      return {
        id,
        name: payload?.name || '',
        nic: payload?.nic || '',
        password: payload?.password || '',
        notes: payload?.notes || '',
        createdAt: record?.createdAt || null,
        updatedAt: record?.updatedAt || null,
      };
    }).filter(Boolean);

    res.status(200).json({ success: true, entries });
  } catch (error) {
    console.error('Vault: failed to load entries:', error.message);
    res.status(500).json({ success: false, message: error?.message || 'Failed to load vault entries' });
  }
});

router.post('/entry', async (req, res) => {
  try {
    const userUID = requireUserUID(req, res);
    if (!userUID) return;

    const idFromClient = req.body?.id;
    const name = requireString(req.body?.name);
    const nic = typeof req.body?.nic === 'string' ? req.body.nic.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';

    if (!name) return res.status(400).json({ success: false, message: 'Entry name is required' });
    if (!nic && !password && !notes) {
      return res.status(400).json({ success: false, message: 'At least NIC, password, or notes is required' });
    }

    const entryId = typeof idFromClient === 'string' && idFromClient.trim() ? idFromClient.trim() : crypto.randomBytes(16).toString('hex');

    const entryRef = db.ref(`users/${userUID}/vault/entries/${entryId}`);
    const existingSnap = await entryRef.once('value');
    const existing = existingSnap.val();

    const encryptedData = encryptJson({
      name,
      nic: nic || '',
      password: password || '',
      notes: notes || '',
    });

    const now = new Date().toISOString();

    await entryRef.set({
      encryptedData,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });

    res.status(200).json({ success: true, id: entryId });
  } catch (error) {
    console.error('Vault: failed to save entry:', error.message);
    res.status(500).json({ success: false, message: error?.message || 'Failed to save vault entry' });
  }
});

router.post('/entry/delete', async (req, res) => {
  try {
    const userUID = requireUserUID(req, res);
    if (!userUID) return;

    const id = req.body?.id;
    if (typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({ success: false, message: 'entry id is required' });
    }

    const entryId = id.trim();
    await db.ref(`users/${userUID}/vault/entries/${entryId}`).remove();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Vault: failed to delete entry:', error.message);
    res.status(500).json({ success: false, message: error?.message || 'Failed to delete vault entry' });
  }
});

module.exports = router;

