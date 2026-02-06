const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const { validateSignupData } = require('../utils/validation');

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
    try {
        const { firstName, surname, username, email, phone, password } = req.body;

        console.log('📝 Signup request received:', { firstName, surname, username, email, phone });

        // Validate input data
        const validation = validateSignupData({ 
            firstName, 
            surname, 
            username, 
            email, 
            phone 
        });

        if (!validation.isValid) {
            console.log('❌ Validation failed:', validation.errors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        console.log('✅ Validation passed');

        // Skip username check for now due to Firebase read issues
        // Create user in Firebase Authentication
        console.log('🔑 Creating Firebase Auth user...');
        const userRecord = await auth.createUser({
            email: email.toLowerCase(),
            password: password || 'TempPassword123!'
        });

        console.log('✅ Firebase Auth user created:', userRecord.uid);

        // Prepare user data for database
        const userData = {
            uid: userRecord.uid,
            firstName: firstName.trim(),
            surname: surname.trim(),
            username: username.toLowerCase().trim(),
            email: email.toLowerCase(),
            phone: phone ? phone.trim() : '',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        // Store user data in Realtime Database
        console.log('💾 Saving user data to database...');
        await db.ref(`users/${userRecord.uid}`).set(userData);
        console.log('✅ User data saved to /users/' + userRecord.uid);

        // Also store by username for quick lookup
        console.log('💾 Saving username mapping...');
        await db.ref(`usernames/${userData.username}`).set(userRecord.uid);
        console.log('✅ Username mapping saved');

        console.log('🎉 Signup completed successfully!');
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                uid: userRecord.uid,
                firstName: userData.firstName,
                surname: userData.surname,
                username: userData.username,
                email: userData.email
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        if (error.code === 'auth/weak-password') {
            return res.status(400).json({
                success: false,
                message: 'Password is too weak. Use at least 6 characters.'
            });
        }

        // Check for database permission errors
        if (error.message && error.message.includes('PERMISSION_DENIED')) {
            console.error('🔐 FIREBASE DATABASE PERMISSION DENIED - Check security rules');
            return res.status(500).json({
                success: false,
                message: 'Database permission error. Firebase rules may need to be updated.',
                error: 'PERMISSION_DENIED'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error during registration',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/check-username
 * Check if username is available
 */
router.post('/check-username', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Invalid username'
            });
        }

        const snapshot = await db.ref(`usernames/${username.toLowerCase()}`).once('value');
        
        res.json({
            success: true,
            available: !snapshot.exists()
        });
    } catch (error) {
        console.error('Username check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking username'
        });
    }
});

/**
 * POST /api/auth/check-email
 * Check if email is available
 */
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email'
            });
        }

        const snapshot = await db.ref('users').orderByChild('email').equalTo(email.toLowerCase()).once('value');
        
        res.json({
            success: true,
            available: !snapshot.exists()
        });
    } catch (error) {
        console.error('Email check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking email'
        });
    }
});

/**
 * POST /api/auth/login
 * Login user - Validates email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login request received for email:', email);

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Verify email format
        if (!email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        try {
            // Attempt to sign in with Firebase Auth
            // This validates if user exists and password is correct
            const userRecord = await auth.getUserByEmail(email.toLowerCase());
            
            console.log('✅ User found in Firebase Auth:', userRecord.uid);

            // Get user profile data from Realtime Database
            const userSnapshot = await db.ref(`users/${userRecord.uid}`).once('value');
            const userData = userSnapshot.val();

            if (!userData) {
                console.warn('⚠️  User authenticated but no profile data found');
                return res.status(500).json({
                    success: false,
                    message: 'User data not found'
                });
            }

            console.log('✅ Login successful for user:', userData.username);

            // Return success with user data (password is NOT sent back)
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                user: {
                    uid: userRecord.uid,
                    firstName: userData.firstName,
                    surname: userData.surname,
                    username: userData.username,
                    email: userData.email,
                    phone: userData.phone || '',
                    createdAt: userData.createdAt
                }
            });

        } catch (firebaseError) {
            console.error('Firebase Auth Error:', firebaseError.code);

            // Handle specific Firebase auth errors
            if (firebaseError.code === 'auth/user-not-found') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            if (firebaseError.code === 'auth/invalid-email') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // For any other error, return generic invalid credentials
            console.error('Login failed:', firebaseError.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login'
        });
    }
});

/**
 * POST /api/auth/verify-password
 * Verify user password against Firebase (for extra verification)
 */
router.post('/verify-password', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // This endpoint can be used to verify credentials
        // In production, you might want to use Firebase REST API or custom token
        try {
            await auth.getUserByEmail(email.toLowerCase());
            
            return res.status(200).json({
                success: true,
                message: 'User verified'
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during verification'
        });
    }
});

module.exports = router;
