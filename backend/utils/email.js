const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify transporter connection
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter error:', error);
    } else {
        console.log('✅ Email service is ready to send emails');
    }
});

/**
 * Send verification email
 */
const sendVerificationEmail = async (email, verificationLink, firstName) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your CivixAI Email',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f5f5f5;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: white;
                            padding: 40px;
                            border-radius: 10px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .header h1 {
                            color: #333;
                            margin: 0;
                        }
                        .content {
                            color: #555;
                            line-height: 1.6;
                            margin-bottom: 30px;
                        }
                        .button-container {
                            text-align: center;
                            margin: 30px 0;
                        }
                        .verify-button {
                            display: inline-block;
                            padding: 12px 30px;
                            background-color: #87CEEB;
                            color: #000000;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                        }
                        .verify-button:hover {
                            background-color: #5eb3d6;
                        }
                        .link-text {
                            color: #666;
                            word-break: break-all;
                            background-color: #f9f9f9;
                            padding: 10px;
                            border-radius: 5px;
                            margin: 15px 0;
                        }
                        .footer {
                            text-align: center;
                            color: #999;
                            font-size: 12px;
                            margin-top: 30px;
                            border-top: 1px solid #eee;
                            padding-top: 20px;
                        }
                        .warning {
                            color: #d9534f;
                            font-size: 12px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to CivixAI! 🎉</h1>
                        </div>
                        <div class="content">
                            <p>Hi ${firstName},</p>
                            <p>Thank you for signing up for CivixAI! To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
                            
                            <div class="button-container">
                                <a href="${verificationLink}" class="verify-button">Verify Email</a>
                            </div>
                            
                            <p>Or copy and paste this link in your browser:</p>
                            <div class="link-text">${verificationLink}</div>
                            
                            <p>This link will expire in 24 hours.</p>
                            
                            <div class="warning">
                                <p>⚠️ <strong>Security Note:</strong> If you did not create this account, please ignore this email.</p>
                            </div>
                        </div>
                        <div class="footer">
                            <p>© 2026 CivixAI. All rights reserved.</p>
                            <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent:', info.response);
        return true;
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        throw error;
    }
};

/**
 * Send password reset email (for later use)
 */
const sendPasswordResetEmail = async (email, resetLink, firstName) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Your CivixAI Password',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 10px; }
                        .button-container { text-align: center; margin: 30px 0; }
                        .reset-button { display: inline-block; padding: 12px 30px; background-color: #87CEEB; color: #000000; text-decoration: none; border-radius: 5px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Reset Your Password</h1>
                        <p>Hi ${firstName},</p>
                        <p>We received a request to reset your CivixAI password. Click the button below to proceed:</p>
                        <div class="button-container">
                            <a href="${resetLink}" class="reset-button">Reset Password</a>
                        </div>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent');
        return true;
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw error;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};
