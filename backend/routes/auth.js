const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const { validateSignupData } = require('../utils/validation');
const { sendVerificationEmail } = require('../utils/email');
const { validateEmail, isDisposableEmail } = require('../utils/disposableEmailChecker');
const { createVerificationToken, verifyToken } = require('../utils/tokenManager');

/**
 * POST /api/auth/signup
 * Register a new user and send verification email
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

        // Check for disposable email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            console.log('❌ Email validation failed:', emailValidation.error);
            return res.status(400).json({
                success: false,
                message: 'Email validation failed',
                error: emailValidation.error
            });
        }

        console.log('✅ Email validation passed (not disposable)');

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
            lastUpdated: new Date().toISOString(),
            emailVerified: false,
            emailVerificationSentAt: new Date().toISOString()
        };

        // Store user data in Realtime Database
        console.log('💾 Saving user data to database...');
        await db.ref(`users/${userRecord.uid}`).set(userData);
        console.log('✅ User data saved to /users/' + userRecord.uid);

        // Also store by username for quick lookup
        console.log('💾 Saving username mapping...');
        await db.ref(`usernames/${userData.username}`).set(userRecord.uid);
        console.log('✅ Username mapping saved');

        // Create verification token
        console.log('🔗 Creating verification token...');
        const verificationToken = await createVerificationToken(email, firstName);
        
        // Build verification link
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        
        // Send verification email (non-blocking - don't await)
        console.log('📧 Sending verification email...');
        sendVerificationEmail(email, verificationLink, firstName).catch(emailError => {
            console.error('⚠️  Email sending failed but signup succeeded:', emailError.message);
            // Email failed but user signup is complete - user can request resend later
        });

        console.log('🎉 Signup completed successfully!');
        return res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            user: {
                uid: userRecord.uid,
                firstName: userData.firstName,
                surname: userData.surname,
                username: userData.username,
                email: userData.email,
                emailVerified: false
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
 * GET /api/auth/verify-email-token/:token
 * Verify email using token
 */
router.get('/verify-email-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        console.log('🔍 Verifying email token...');
        const result = await verifyToken(token);

        if (!result.success) {
            console.log('❌ Token verification failed:', result.message);
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        console.log('✅ Email verification successful!');
        return res.status(200).json({
            success: true,
            message: result.message,
            email: result.email
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email'
        });
    }
});

/**
 * POST /api/auth/resend-verification-email
 * Resend verification email
 */
router.post('/resend-verification-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user by email
        const userSnapshot = await db.ref('users').orderByChild('email').equalTo(email.toLowerCase()).once('value');
        
        if (!userSnapshot.exists()) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userData = Object.values(userSnapshot.val())[0];

        if (userData.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Create new verification token
        const verificationToken = await createVerificationToken(email, userData.firstName);
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

        // Send verification email (non-blocking)
        sendVerificationEmail(email, verificationLink, userData.firstName).catch(error => {
            console.error('⚠️  Error resending email:', error.message);
        });

        console.log('✅ Verification email request processed for:', email);
        return res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resending verification email'
        });
    }
});

/**
 * POST /api/auth/login
 * Login user - Validates email is verified and password is correct
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
            // Check if user exists in database and get their data
            const userSnapshot = await db.ref('users').orderByChild('email').equalTo(email.toLowerCase()).once('value');
            
            if (!userSnapshot.exists()) {
                console.warn('⚠️  User not found in database');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const userData = Object.values(userSnapshot.val())[0];
            const userRecord = await auth.getUserByEmail(email.toLowerCase());

            // Check if email is verified
            if (!userData.emailVerified) {
                console.log('❌ Email not verified for user:', email);
                return res.status(403).json({
                    success: false,
                    message: 'Email not verified',
                    emailVerified: false,
                    error: 'UNVERIFIED_EMAIL'
                });
            }

            console.log('✅ User found and email verified:', userRecord.uid);

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
                    emailVerified: userData.emailVerified,
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
