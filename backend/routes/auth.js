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

        // Validate input data
        const validation = validateSignupData({ 
            firstName, 
            surname, 
            username, 
            email, 
            phone 
        });

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Check if username already exists
        const usernameSnapshot = await db.ref('users').orderByChild('username').equalTo(username).once('value');
        if (usernameSnapshot.exists()) {
            return res.status(400).json({
                success: false,
                message: 'Username already taken'
            });
        }

        // Check if email already exists
        const emailSnapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
        if (emailSnapshot.exists()) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create user in Firebase Authentication
        const userRecord = await auth.createUser({
            email: email.toLowerCase(),
            password: password || 'TempPassword123!' // Temporary password if not provided
        });

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
        await db.ref(`users/${userRecord.uid}`).set(userData);

        // Also store by username for quick lookup
        await db.ref(`usernames/${userData.username}`).set(userRecord.uid);

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
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password required'
            });
        }

        // Note: In a real application, you'd use Firebase client SDK for auth
        // or use a library like firebase-rest-api for token generation
        
        return res.status(200).json({
            success: true,
            message: 'Use Firebase client SDK to handle login'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login'
        });
    }
});

module.exports = router;
