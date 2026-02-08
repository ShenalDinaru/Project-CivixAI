const admin = require('firebase-admin');
require('dotenv').config();
const path = require('path');

// Initialize Firebase
try {
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
    let serviceAccount;
    
    try {
        serviceAccount = require(serviceAccountPath);
    } catch {
        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
} catch (error) {
    console.error(' Firebase initialization failed:', error.message);
    process.exit(1);
}

const auth = admin.auth();
const db = admin.database();

/**
 * Delete a user completely from both Authentication and Database
 */
async function deleteUserCompletely(email) {
    try {
        console.log(` Searching for user: ${email}`);
        
        // Find user in Firebase Authentication
        const user = await auth.getUserByEmail(email);
        console.log(` Found in Authentication: ${user.uid}`);

        // Delete from Authentication
        await auth.deleteUser(user.uid);
        console.log(` Deleted from Authentication`);

        // Delete from Realtime Database
        await db.ref(`users/${user.uid}`).remove();
        console.log(` Deleted from Realtime Database`);

        // Delete username mapping
        const usernameRef = await db.ref('usernames').once('value');
        if (usernameRef.exists()) {
            const usernames = usernameRef.val();
            for (const username in usernames) {
                if (usernames[username] === user.uid) {
                    await db.ref(`usernames/${username}`).remove();
                    console.log(` Deleted username mapping: ${username}`);
                }
            }
        }

        // Delete verification tokens associated with this email
        const tokensRef = await db.ref('verificationTokens').once('value');
        if (tokensRef.exists()) {
            const tokens = tokensRef.val();
            for (const token in tokens) {
                if (tokens[token].email === email.toLowerCase()) {
                    await db.ref(`verificationTokens/${token}`).remove();
                    console.log(` Deleted verification token`);
                }
            }
        }

        console.log(`\n User completely deleted from all systems!\n`);
        return true;

    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.log(`  Email not found in Authentication, but checking Database...`);
            
            // Try to find and delete from Database even if not in Auth
            try {
                const userSnapshot = await db.ref('users').orderByChild('email').equalTo(email.toLowerCase()).once('value');
                
                if (userSnapshot.exists()) {
                    const userId = Object.keys(userSnapshot.val())[0];
                    await db.ref(`users/${userId}`).remove();
                    console.log(` Deleted from Realtime Database`);
                    
                    // Clean up usernames
                    const usernameRef = await db.ref('usernames').once('value');
                    if (usernameRef.exists()) {
                        const usernames = usernameRef.val();
                        for (const username in usernames) {
                            if (usernames[username] === userId) {
                                await db.ref(`usernames/${username}`).remove();
                            }
                        }
                    }
                    
                    console.log(` User deleted from Database!\n`);
                } else {
                    console.log(` Email not found anywhere\n`);
                }
            } catch (dbError) {
                console.error(` Database error: ${dbError.message}\n`);
            }
        } else {
            console.error(` Error: ${error.message}\n`);
        }
        return false;
    }
}

/**
 * Show all registered users
 */
async function listAllUsers() {
    try {
        console.log(`\n All Registered Users:\n`);
        const usersRef = await db.ref('users').once('value');
        
        if (!usersRef.exists()) {
            console.log('No users registered');
            return;
        }

        const users = usersRef.val();
        let count = 0;
        
        for (const uid in users) {
            count++;
            const user = users[uid];
            console.log(`${count}. ${user.email} (Username: ${user.username})`);
        }
        
        console.log(`\nTotal: ${count} users\n`);
    } catch (error) {
        console.error(` Error listing users: ${error.message}`);
    }
}

// Main script
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`Usage:`);
        console.log(`  node cleanup-user.js --list              (Show all users)`);
        console.log(`  node cleanup-user.js --delete email@example.com   (Delete specific user)`);
        console.log(`\nExample:`);
        console.log(`  node cleanup-user.js --list`);
        console.log(`  node cleanup-user.js --delete as2023410@sci.sip.ac.lk\n`);
        process.exit(0);
    }

    if (args[0] === '--list') {
        await listAllUsers();
        process.exit(0);
    }

    if (args[0] === '--delete' && args[1]) {
        const email = args[1];
        await deleteUserCompletely(email);
        process.exit(0);
    }

    console.log(' Invalid arguments');
    process.exit(1);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
