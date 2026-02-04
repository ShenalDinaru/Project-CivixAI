const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json');
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (err) {
  console.warn('Firebase Admin initialization failed. Make sure serviceAccountKey.json exists or GOOGLE_APPLICATION_CREDENTIALS is set.', err.message);
}

const db = admin.firestore();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { firstName, surname, username, email, phone } = req.body || {};

  // Validate required fields
  if (!surname || !username || !email) {
    return res.status(400).json({ error: 'Missing required fields (surname, username, email).' });
  }

  // Validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    // Use email as document ID (lowercased for consistency)
    const docId = String(email).toLowerCase();
    const userRef = db.collection('users').doc(docId);
    const snapshot = await userRef.get();

    // Check if user already exists
    if (snapshot.exists) {
      return res.status(409).json({ error: 'Email already registered. Please use a different email or login.' });
    }

    // Check if username is already taken
    const usernameQuery = await db.collection('users').where('username', '==', username).get();
    if (!usernameQuery.empty) {
      return res.status(409).json({ error: 'Username already taken. Please choose a different username.' });
    }

    // Create new user document
    await userRef.set({
      firstName: firstName || '',
      surname,
      username,
      email: String(email).toLowerCase(),
      phone: phone || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(201).json({ 
      success: true, 
      message: 'User registered successfully.',
      userId: docId
    });

  } catch (err) {
    console.error('Error in signup endpoint:', err);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Get user data endpoint (optional)
app.get('/api/user/:email', async (req, res) => {
  try {
    const email = String(req.params.email).toLowerCase();
    const userRef = db.collection('users').doc(email);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ success: true, data: snapshot.data() });
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CivixAI backend listening on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Signup endpoint: POST http://localhost:${PORT}/api/signup`);
});
