const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, auth } = require('../config/firebase');
const { validateSignupData } = require('../utils/validation');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { validateEmail, isDisposableEmail } = require('../utils/disposableEmailChecker');
const { createVerificationToken, verifyToken, createPasswordResetToken, verifyPasswordResetToken, markPasswordResetTokenAsUsed } = require('../utils/tokenManager');

const isVercel = process.env.VERCEL === '1';

function getFrontendBaseUrl(req) {
    const forwardedProto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const forwardedHost = req.headers['x-forwarded-host'] || req.get('host');
    const requestBaseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
    const envBaseUrl = process.env.FRONTEND_URL?.trim();

    if (isVercel && requestBaseUrl) {
        return requestBaseUrl;
    }

    return envBaseUrl || requestBaseUrl || 'http://localhost:5000';
}


 
 // Register a new user and send verification email

router.post('/signup', async (req, res) => {
    try {
        const { firstName, surname, username, email, phone, password } = req.body;

        console.log(' Signup request received:', { firstName, surname, username, email, phone });

        // Validate input data
        const validation = validateSignupData({ 
            firstName, 
            surname, 
            username, 
            email, 
            phone,
            password 
        });

        if (!validation.isValid) {
            console.log(' Validation failed:', validation.errors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        console.log(' Validation passed');

        // Check for disposable email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            console.log(' Email validation failed:', emailValidation.error);
            return res.status(400).json({
                success: false,
                message: 'Email validation failed',
                error: emailValidation.error
            });
        }

        console.log(' Email validation passed (not disposable)');

        // Hash the password before storing
        console.log('🔐 Hashing password...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('✓ Password hashed successfully');

        // Create user in Firebase Authentication
        console.log('🔑 Creating Firebase Auth user...');
        const userRecord = await auth.createUser({
            email: email.toLowerCase(),
            password: password || 'TempPassword123!'
        });

        console.log(' Firebase Auth user created:', userRecord.uid);

        // Prepare user data for database
        const userData = {
            uid: userRecord.uid,
            firstName: firstName.trim(),
            surname: surname.trim(),
            username: username.toLowerCase().trim(),
            email: email.toLowerCase(),
            phone: phone ? phone.trim() : '',
            passwordHash: hashedPassword,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            emailVerified: false,
            emailVerificationSentAt: new Date().toISOString()
        };

        // Store user data in Realtime Database
        console.log(' Saving user data to database...');
        await db.ref(`users/${userRecord.uid}`).set(userData);
        console.log(' User data saved to /users/' + userRecord.uid);

        // Also store by username for quick lookup
        console.log(' Saving username mapping...');
        await db.ref(`usernames/${userData.username}`).set(userRecord.uid);
        console.log(' Username mapping saved');

        // Create verification token
        console.log(' Creating verification token...');
        const verificationToken = await createVerificationToken(email, firstName);
        
        // Build verification link
        const verificationLink = `${getFrontendBaseUrl(req)}/verify_email.html?token=${verificationToken}`;

        
        // Log the verification link for debugging
        console.log('📧 Verification Link:', verificationLink);
        
        let verificationEmailSent = false;

        // Vercel functions can stop background SMTP work after the response,
        // so we await delivery here and report any failure explicitly.
        console.log(' Sending verification email...');
        try {
            await sendVerificationEmail(email, verificationLink, firstName);
            verificationEmailSent = true;
        } catch (emailError) {
            console.error('  Email sending failed after signup:', emailError.message);
        }

        console.log(' Signup completed successfully!');
        return res.status(201).json({
            success: true,
            message: verificationEmailSent
                ? 'Registration successful! Please check your email to verify your account.'
                : 'Registration successful, but we could not send the verification email right now. Please use the resend option on the verification page.',
            emailSent: verificationEmailSent,
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
        if (error.code === 'auth/email already exists') {
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
            console.error(' FIREBASE DATABASE PERMISSION DENIED - Check security rules');
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


 //Check if username is available
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



 // Check if email is available
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


 
 //Verify email using token
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

        // Mark email as verified in database
        console.log('📧 Marking email as verified:', result.email);
        try {
            const userSnapshot = await db.ref('users').orderByChild('email').equalTo(result.email.toLowerCase()).once('value');
            if (userSnapshot.exists()) {
                const userData = Object.entries(userSnapshot.val())[0];
                const uid = userData[0];
                await db.ref(`users/${uid}/emailVerified`).set(true);
                await db.ref(`users/${uid}/emailVerifiedAt`).set(new Date().toISOString());
                console.log('✅ Email marked as verified in database');
            }
        } catch (dbError) {
            console.error('Database error updating emailVerified:', dbError);
            // Continue anyway as token was verified
        }

        console.log('✅ Email verification successful!');
        return res.status(200).json({
            success: true,
            message: result.message,
            email: result.email
        });

    } catch (error) {
        console.error('❌ Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email'
        });
    }
});

// Handle /verify_email with query parameter (for direct email links)
router.get('/verify_email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        console.log('🔍 Verifying email token from query parameter...');
        const result = await verifyToken(token);

        if (!result.success) {
            console.log('❌ Token verification failed:', result.message);
            return res.status(400).json({
                success: false,
                message: result.message,
                expired: result.message.includes('expired')
            });
        }

        // Mark email as verified in database
        console.log('📧 Marking email as verified:', result.email);
        try {
            const userSnapshot = await db.ref('users').orderByChild('email').equalTo(result.email.toLowerCase()).once('value');
            if (userSnapshot.exists()) {
                const userData = Object.entries(userSnapshot.val())[0];
                const uid = userData[0];
                await db.ref(`users/${uid}/emailVerified`).set(true);
                await db.ref(`users/${uid}/emailVerifiedAt`).set(new Date().toISOString());
                console.log('✅ Email marked as verified in database');
            }
        } catch (dbError) {
            console.error('Database error updating emailVerified:', dbError);
            // Continue anyway as token was verified
        }

        console.log('✅ Email verification successful!');
        return res.status(200).json({
            success: true,
            message: result.message,
            email: result.email
        });

    } catch (error) {
        console.error('❌ Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email'
        });
    }
});

 
 // Resend verification email

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
        const verificationLink = `${getFrontendBaseUrl(req)}/verify_email.html?token=${verificationToken}`;
        
        // Log the verification link for debugging
        console.log('📧 Resend - Verification Link:', verificationLink);

        // Await SMTP delivery so Vercel does not pause the work after the response.
        await sendVerificationEmail(email, verificationLink, userData.firstName);

        console.log(' Verification email request processed for:', email);
        return res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resending verification email. Please verify your email settings and try again.'
        });
    }
});


 
 // Login user - Validates email is verified and password is correct
 
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(' Login request received for email:', email);

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
                console.warn('  User not found in database');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const userData = Object.values(userSnapshot.val())[0];
            const userRecord = await auth.getUserByEmail(email.toLowerCase());

            // Verify password hash
            console.log('🔑 Verifying password...');
            const passwordMatch = await bcrypt.compare(password, userData.passwordHash);
            
            if (!passwordMatch) {
                console.warn('  Password mismatch for user:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                    emailVerified: userData.emailVerified,
                    error: 'INVALID_PASSWORD'
                });
            }
            
            console.log('✓ Password verified successfully');

            // Check if email is verified
            if (!userData.emailVerified) {
                console.log(' Email not verified for user:', email);
                return res.status(403).json({
                    success: false,
                    message: 'Email not verified',
                    emailVerified: false,
                    error: 'UNVERIFIED_EMAIL'
                });
            }

            console.log(' User found and email verified:', userRecord.uid);

            if (!userData) {
                console.warn('  User authenticated but no profile data found');
                return res.status(500).json({
                    success: false,
                    message: 'User data not found'
                });
            }

            console.log(' Login successful for user:', userData.username);

            // Return success with user data (password is not sent back)
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


 
 // Verify user password 
router.post('/verify-password', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        
        
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


 
 //Send password reset email
 
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        console.log(' Forgot password request for:', email);

        // Validate input
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user by email
        const userSnapshot = await db.ref('users').orderByChild('email').equalTo(email.toLowerCase()).once('value');
        
        if (!userSnapshot.exists()) {
            console.log('  Email not found:', email);
            return res.status(200).json({
                success: true,
                message: 'If email exists, a password reset link has been sent.'
            });
        }

        const userData = Object.values(userSnapshot.val())[0];

        // Create password reset token
        console.log(' Creating password reset token...');
        const resetToken = await createPasswordResetToken(email, userData.firstName);
        
        // Build reset link
        const resetLink = `${getFrontendBaseUrl(req)}/reset_password.html?token=${resetToken}`;
        
        // Log the reset link for debugging
        console.log('📧 Reset Link:', resetLink);
        
        let resetEmailSent = false;

        // Vercel functions can stop background SMTP work after the response,
        // so we await delivery here and report any failure explicitly.
        console.log(' Sending password reset email...');
        try {
            await sendPasswordResetEmail(email, resetLink, userData.firstName);
            resetEmailSent = true;
            console.log(' Email sent successfully');
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError.message);
            console.error('❌ Full error:', emailError);
        }

        console.log(' Password reset request processed');
        return res.status(200).json({
            success: true,
            message: resetEmailSent
                ? 'If email exists, a password reset link has been sent.'
                : 'We could not send the password reset email right now. Please try again shortly.',
            emailSent: resetEmailSent
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing forgot password request'
        });
    }
});


 
 // Verify password reset token
router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is required'
            });
        }

        console.log(' Verifying password reset token...');
        const result = await verifyPasswordResetToken(token);

        if (!result.success) {
            console.log(' Token verification failed:', result.message);
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        console.log(' Reset token verified!');
        return res.status(200).json({
            success: true,
            message: 'Reset token is valid',
            email: result.email
        });

    } catch (error) {
        console.error('Reset token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying reset token'
        });
    }
});


  
 // Reset password with token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        console.log(' Password reset request received');

        // Validate input
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        // Verify token
        const tokenResult = await verifyPasswordResetToken(token);
        if (!tokenResult.success) {
            return res.status(400).json({
                success: false,
                message: tokenResult.message
            });
        }

        // Validate password
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordPattern.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters with uppercase, lowercase, and a number'
            });
        }

        try {
            // Update password in Firebase Authentication
            console.log(' Updating Firebase Auth password...');
            const user = await auth.getUserByEmail(tokenResult.email);
            await auth.updateUser(user.uid, {
                password: newPassword
            });
            console.log(' Password updated in Firebase Auth');

            // Hash the new password and update in database
            console.log(' Hashing new password for database...');
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            // Update password hash in database
            const userSnapshot = await db.ref('users').orderByChild('email').equalTo(tokenResult.email.toLowerCase()).once('value');
            if (userSnapshot.exists()) {
                const userData = Object.entries(userSnapshot.val())[0];
                const uid = userData[0];
                await db.ref(`users/${uid}/passwordHash`).set(hashedPassword);
                console.log(' Password hash updated in database');
            }

            // Mark token as used
            await markPasswordResetTokenAsUsed(token);

            console.log('🎉 Password reset successful!');
            return res.status(200).json({
                success: true,
                message: 'Password reset successful. You can now login with your new password.'
            });

        } catch (firebaseError) {
            console.error('Firebase error:', firebaseError);
            return res.status(500).json({
                success: false,
                message: 'Error updating password'
            });
        }

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
});


  
 //Get the latest password reset token for an email (for testing only)
router.get('/debug/latest-reset-token/:email', async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        const snapshot = await db.ref('passwordResetTokens').once('value');
        const allTokens = snapshot.val() || {};

        // Find tokens for this email
        const tokensForEmail = Object.entries(allTokens)
            .filter(([token, data]) => data.email === email && !data.used)
            .sort((a, b) => new Date(b[1].createdAt) - new Date(a[1].createdAt));

        if (tokensForEmail.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid reset token found for this email'
            });
        }

        const latestToken = tokensForEmail[0];
        const resetLink = `${getFrontendBaseUrl(req)}/reset_password.html?token=${latestToken[0]}`;


        console.log(' DEBUG: Latest reset token for', email);
        res.status(200).json({
            success: true,
            message: 'Latest reset token retrieved (DEBUG ONLY)',
            email: email,
            token: latestToken[0],
            resetLink: resetLink,
            createdAt: latestToken[1].createdAt,
            expiresAt: latestToken[1].expiresAt
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving token'
        });
    }
});



 // View ALL reset tokens for an email (for debugging issues)
router.get('/debug/all-reset-tokens/:email', async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        const snapshot = await db.ref('passwordResetTokens').once('value');
        const allTokens = snapshot.val() || {};

        // Find all tokens for this email
        const tokensForEmail = Object.entries(allTokens)
            .filter(([token, data]) => data.email === email)
            .map(([token, data]) => ({
                token: token,  
                email: data.email,
                created: data.createdAt,
                expires: data.expiresAt,
                used: data.used,
                firstName: data.firstName
            }));

        if (tokensForEmail.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No reset tokens found for this email'
            });
        }

        console.log(' DEBUG: Found', tokensForEmail.length, 'token(s) for', email);
        res.status(200).json({
            success: true,
            message: 'All reset tokens for this email',
            email: email,
            tokenCount: tokensForEmail.length,
            tokens: tokensForEmail
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving tokens'
        });
    }
});

module.exports = router;
