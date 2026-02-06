const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

let serviceAccount;

try {
    // Try to load from JSON file first (most reliable)
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
    try {
        serviceAccount = require(serviceAccountPath);
        console.log('✅ Loaded Firebase credentials from serviceAccountKey.json');
    } catch (fileError) {
        // Fall back to .env variables
        console.log('ℹ️  serviceAccountKey.json not found, using environment variables');
        
        const projectId = process.env.FIREBASE_PROJECT_ID?.trim().replace(/"/g, '');
        const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.replace(/"/g, '').replace(/\\n/g, '\n');
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/"/g, '');
        
        console.log('📋 Firebase config values:');
        console.log('  - Project ID:', projectId);
        console.log('  - Private Key starts with:', privateKeyRaw?.substring(0, 30) + '...');
        console.log('  - Private Key ends with:', '...' + privateKeyRaw?.substring(privateKeyRaw.length - 30));
        console.log('  - Client Email:', clientEmail);
        
        serviceAccount = {
            projectId: projectId,
            privateKey: privateKeyRaw,
            clientEmail: clientEmail,
        };
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL?.trim().replace(/"/g, '')
    });
    
    console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    console.error('Make sure either:');
    console.error('  1. serviceAccountKey.json exists in the backend folder, OR');
    console.error('  2. Environment variables are properly set in .env');
    throw error;
}

const db = admin.database();
const auth = admin.auth();

module.exports = {
    admin,
    db,
    auth
};
