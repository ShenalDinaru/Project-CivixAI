const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

console.log('\n Firebase Connection Diagnostic Test\n');
console.log('=' .repeat(50));

//  Check if credentials exist
console.log('\n Test 1: Checking credentials in .env file...');
const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!projectId) {
    console.log(' FIREBASE_PROJECT_ID is missing');
    process.exit(1);
}
if (!privateKey) {
    console.log(' FIREBASE_PRIVATE_KEY is missing');
    process.exit(1);
}
if (!clientEmail) {
    console.log(' FIREBASE_CLIENT_EMAIL is missing');
    process.exit(1);
}
if (!databaseURL) {
    console.log(' FIREBASE_DATABASE_URL is missing');
    process.exit(1);
}

console.log(' All credentials found in .env\n');
console.log('   - Project ID:', projectId);
console.log('   - Client Email:', clientEmail);
console.log('   - Database URL:', databaseURL);
console.log('   - Private Key: ' + (privateKey.length) + ' characters');

//  Parse credentials
console.log('\n✓ Test 2: Parsing credentials...');
try {
    const formattedKey = privateKey.replace(/"/g, '').replace(/\\n/g, '\n');
    
    if (!formattedKey.includes('BEGIN PRIVATE KEY')) {
        throw new Error('Invalid private key format - missing BEGIN marker');
    }
    if (!formattedKey.includes('END PRIVATE KEY')) {
        throw new Error('Invalid private key format - missing END marker');
    }
    
    console.log(' Private key successfully parsed');
    console.log('   - Key starts with: ' + formattedKey.substring(0, 30) + '...');
    console.log('   - Key ends with: ...' + formattedKey.substring(formattedKey.length - 30));
} catch (e) {
    console.log(' Error parsing private key:', e.message);
    process.exit(1);
}

//  Initialize Firebase
console.log('\n✓ Test 3: Initializing Firebase Admin...');
try {
    const serviceAccount = {
        projectId: projectId.replace(/"/g, '').trim(),
        privateKey: privateKey.replace(/"/g, '').replace(/\\n/g, '\n'),
        clientEmail: clientEmail.replace(/"/g, '').trim(),
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL.replace(/"/g, '').trim()
    });

    console.log(' Firebase Admin initialized successfully');
} catch (error) {
    console.log(' Firebase initialization failed');
    console.log('   Error:', error.message);
    
    if (error.message.includes('Invalid service account')) {
        console.log('\n    Solution: Your credentials are invalid.');
        console.log('      1. Go to Firebase Console → Your Project');
        console.log('      2. Settings  → Service Accounts');
        console.log('      3. Generate new private key');
        console.log('      4. Copy the JSON credentials to .env');
    }
    
    process.exit(1);
}

//  Test database connection
console.log('\n✓ Test 4: Testing database connection...');
console.log('   (Waiting for response, this may take a few seconds...)');

const db = admin.database();
let connected = false;

const connectionTest = db.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
        if (!connected) {
            connected = true;
            console.log(' Successfully connected to Firebase Database!');
            
            // Also try a quick read
            console.log('\n✓ Test 5: Attempting database read...');
            db.ref('test').once('value')
                .then(() => {
                    console.log(' Database read successful!');
                    console.log('\n' + '='.repeat(50));
                    console.log(' All tests passed! Firebase is working correctly.');
                    console.log('=' .repeat(50) + '\n');
                    process.exit(0);
                })
                .catch((err) => {
                    console.log('  Database read failed (this is usually due to permissions)');
                    console.log('   Error:', err.message);
                    console.log('\n     This might be a permissions issue.');
                    console.log('      1. Go to Firebase Console → Database Rules');
                    console.log('      2. Ensure rules allow reading/writing');
                    console.log('      3. For testing, you can use:');
                    console.log('         { "rules": { ".read": true, ".write": true } }');
                    console.log('\n' + '='.repeat(50));
                    console.log('  Connection successful but database rules may be restrictive');
                    console.log('='.repeat(50) + '\n');
                    process.exit(0);
                });
        }
    }
});

// Timeout after 15 seconds
setTimeout(() => {
    if (!connected) {
        console.log('\n Timeout: Could not connect to Firebase Database\n');
        console.log('Possible causes:');
        console.log('1.  No internet connection');
        console.log('2.  Firewall blocking accounts.google.com');
        console.log('3.  Invalid credentials');
        console.log('4.  Cannot resolve DNS for accounts.google.com\n');
        console.log('Solutions:');
        console.log('1. Check: ping google.com');
        console.log('2. Check: nslookup accounts.google.com');
        console.log('3. Verify .env credentials are correct');
        console.log('4. Try using a different network/internet');
        console.log('\n' + '='.repeat(50) + '\n');
        process.exit(1);
    }
}, 15000);

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    console.log('\n Unexpected Error:', err.message);
    console.log('Stack:', err.stack);
    process.exit(1);
});
