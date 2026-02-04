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
const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://civixai-48022-default-rtdb.firebaseio.com';

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
  });
  console.log('Firebase Admin SDK initialized successfully');
  console.log('Using Realtime Database:', databaseURL);
} catch (err) {
  console.warn('Firebase Admin initialization failed. Make sure serviceAccountKey.json exists or GOOGLE_APPLICATION_CREDENTIALS is set.', err.message);
}

const db = admin.database();

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
    const emailLower = String(email).toLowerCase();
    
    // Check if email already exists in 'users' node
    const usersRef = db.ref('users');
    const usersSnapshot = await usersRef.once('value');
    const usersData = usersSnapshot.val() || {};

    // Check for duplicate email or username
    for (const key in usersData) {
      const user = usersData[key];
      if (user.email === emailLower) {
        return res.status(409).json({ error: 'Email already registered. Please use a different email or login.' });
      }
      if (user.username === username) {
        return res.status(409).json({ error: 'Username already taken. Please choose a different username.' });
      }
    }

    // Create new user - use email as key (with special characters replaced)
    const sanitizedEmail = emailLower.replace(/[.#$[\]]/g, '_');
    const newUserRef = db.ref(`users/${sanitizedEmail}`);
    
    const timestamp = admin.database.ServerValue.TIMESTAMP;
    
    await newUserRef.set({
      firstName: firstName || '',
      surname,
      username,
      email: emailLower,
      phone: phone || '',
      createdAt: timestamp,
      updatedAt: timestamp
    });

    return res.status(201).json({ 
      success: true, 
      message: 'User registered successfully.',
      userId: sanitizedEmail
    });

  } catch (err) {
    console.error('Error in signup endpoint:', err);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Get user data endpoint (optional)
app.get('/api/user/:email', async (req, res) => {
  try {
    const emailLower = String(req.params.email).toLowerCase();
    const sanitizedEmail = emailLower.replace(/[.#$[\]]/g, '_');
    
    const userRef = db.ref(`users/${sanitizedEmail}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();

    if (!userData) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ success: true, data: userData });
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
