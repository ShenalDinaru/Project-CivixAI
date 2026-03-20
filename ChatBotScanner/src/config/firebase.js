import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

let db = null;
let fbAdmin = null;
let firebaseInitialized = false;

try {
  // Try to load from JSON file first (most reliable)
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  let serviceAccount = null;
  
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(rawData);
      console.log('✅ Loaded Firebase credentials from serviceAccountKey.json');
    } catch (parseError) {
      console.warn('⚠️  Error parsing serviceAccountKey.json:', parseError.message);
    }
  }

  // Fall back to .env variables if no file
  if (!serviceAccount) {
    console.log('ℹ️  serviceAccountKey.json not found, trying environment variables');
    
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim().replace(/"/g, '');
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.replace(/"/g, '').replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/"/g, '');
    
    if (projectId && privateKeyRaw && clientEmail) {
      serviceAccount = {
        projectId: projectId,
        privateKey: privateKeyRaw,
        clientEmail: clientEmail,
      };
    } else {
      console.log('⚠️  Firebase credentials not configured');
      console.log('   Chat history will work with localStorage only');
      console.log('   To enable cloud backup:');
      console.log('     1. Add serviceAccountKey.json to project root, OR');
      console.log('     2. Set environment variables: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
    }
  }

  // Initialize Firebase if credentials available
  if (serviceAccount && serviceAccount.projectId) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL?.trim().replace(/"/g, '')
      });
      
      db = admin.firestore();
      fbAdmin = admin;
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized successfully');
    } catch (initError) {
      console.warn('⚠️  Firebase initialization failed:', initError.message);
    }
  }
} catch (error) {
  console.warn('⚠️  Firebase setup error:', error.message);
}

// Create mock objects if Firebase not available
if (!db) {
  console.log('   Using localStorage-only mode for chat history');
  
  db = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: () => ({
            set: async () => ({ id: 'local-' + Date.now() }),
            get: async () => ({ exists: false, data: () => ({}) }),
            delete: async () => {},
            update: async () => {},
          }),
          orderBy: () => ({
            limit: () => ({
              get: async () => ({ forEach: () => {}, size: 0 })
            })
          }),
          get: async () => ({ forEach: () => {}, size: 0 })
        })
      })
    })
  };
  
  fbAdmin = admin;
  firebaseInitialized = false;
}

export { db, fbAdmin, firebaseInitialized };
export default admin;
