const crypto = require('crypto');
const { db } = require('../config/firebase');


 // Get a secure verification token
 
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

 // Get and store verification token for email
 
const createVerificationToken = async (email, firstName) => {
    try {
        const token = generateToken();
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

        const tokenData = {
            email: email.toLowerCase(),
            firstName: firstName,
            token: token,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(expiryTime).toISOString(),
            verified: false
        };

        // Store token in database
        await db.ref(`verificationTokens/${token}`).set(tokenData);
        console.log('✅ Verification token created for:', email);

        return token;
    } catch (error) {
        console.error(' Error creating verification token:', error);
        throw error;
    }
};


 // Verify a token and mark email as verified
 
const verifyToken = async (token) => {
    try {
        // Get token data
        const snapshot = await db.ref(`verificationTokens/${token}`).once('value');
        const tokenData = snapshot.val();

        if (!tokenData) {
            return {
                success: false,
                message: 'Invalid verification token'
            };
        }

        // Check if token has expired
        const expiryTime = new Date(tokenData.expiresAt).getTime();
        if (Date.now() > expiryTime) {
            return {
                success: false,
                message: 'Verification token has expired. Please sign up again.'
            };
        }

        // Check if already verified
        if (tokenData.verified) {
            return {
                success: false,
                message: 'Email is already verified'
            };
        }

        // Mark as verified
        await db.ref(`verificationTokens/${token}`).update({
            verified: true,
            verifiedAt: new Date().toISOString()
        });

        // Mark user as email verified in users table
        const userSnapshot = await db.ref(`users`).orderByChild('email').equalTo(tokenData.email).once('value');
        
        if (userSnapshot.exists()) {
            const userId = Object.keys(userSnapshot.val())[0];
            await db.ref(`users/${userId}`).update({
                emailVerified: true,
                emailVerifiedAt: new Date().toISOString()
            });
        }

        console.log(' Token verified successfully for:', tokenData.email);

        return {
            success: true,
            message: 'Email verified successfully',
            email: tokenData.email,
            firstName: tokenData.firstName
        };
    } catch (error) {
        console.error(' Error verifying token:', error);
        throw error;
    }
};


 // Clean up expired tokens 
 
const cleanupExpiredTokens = async () => {
    try {
        const snapshot = await db.ref('verificationTokens').once('value');
        const tokens = snapshot.val();

        if (!tokens) return;

        const now = Date.now();
        let deletedCount = 0;

        for (const token in tokens) {
            const expiryTime = new Date(tokens[token].expiresAt).getTime();
            if (now > expiryTime) {
                await db.ref(`verificationTokens/${token}`).remove();
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            console.log(` Cleaned up ${deletedCount} expired verification tokens`);
        }
    } catch (error) {
        console.error(' Error cleaning up tokens:', error);
    }
};


 // Create password reset token
 
const createPasswordResetToken = async (email, firstName) => {
    try {
        const token = generateToken();
        const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour

        const tokenData = {
            email: email.toLowerCase(),
            firstName: firstName,
            token: token,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(expiryTime).toISOString(),
            used: false
        };

        // Store token in database
        await db.ref(`passwordResetTokens/${token}`).set(tokenData);
        console.log(' Password reset token created for:', email);
        console.log('   Token stored at: passwordResetTokens/' + token.substring(0, 20) + '...');
        console.log('   Full token:', token);

        return token;
    } catch (error) {
        console.error(' Error creating password reset token:', error);
        throw error;
    }
};


 // Verify password reset token
 
const verifyPasswordResetToken = async (token) => {
    try {
        console.log(' [VERIFY] Looking for token:', token.substring(0, 20) + '...');
        console.log(' [VERIFY] Full token length:', token.length);
        
        // Attempt direct lookup
        const snapshot = await db.ref(`passwordResetTokens/${token}`).once('value');
        const tokenData = snapshot.val();

        console.log('🔍 [VERIFY] Database lookup result:', tokenData ? ' FOUND' : ' NOT FOUND');

        if (!tokenData) {
            console.log(' Token not found in database at path: passwordResetTokens/' + token.substring(0, 20) + '...');
            return {
                success: false,
                message: 'Invalid reset token'
            };
        }

        console.log(' [VERIFY] Token found! Email:', tokenData.email);

        // Check if token has expired
        const expiryTime = new Date(tokenData.expiresAt).getTime();
        const nowTime = Date.now();
        const isExpired = nowTime > expiryTime;
        
        console.log(' [VERIFY] Expiry check - Expires:', tokenData.expiresAt);
        
        if (isExpired) {
            return {
                success: false,
                message: 'Password reset link has expired. Please request a new one.'
            };
        }

        // Check if token has been used
        if (tokenData.used) {
            return {
                success: false,
                message: 'This reset link has already been used.'
            };
        }

        console.log(' Password reset token verified for:', tokenData.email);

        return {
            success: true,
            email: tokenData.email,
            firstName: tokenData.firstName
        };
    } catch (error) {
        console.error(' Error verifying reset token:', error);
        throw error;
    }
};


 // Mark password reset token as used
 
const markPasswordResetTokenAsUsed = async (token) => {
    try {
        await db.ref(`passwordResetTokens/${token}`).update({
            used: true,
            usedAt: new Date().toISOString()
        });

        console.log(' Password reset token marked as used');
    } catch (error) {
        console.error(' Error marking token as used:', error);
        throw error;
    }
};

module.exports = {
    generateToken,
    createVerificationToken,
    verifyToken,
    cleanupExpiredTokens,
    createPasswordResetToken,
    verifyPasswordResetToken,
    markPasswordResetTokenAsUsed
};
