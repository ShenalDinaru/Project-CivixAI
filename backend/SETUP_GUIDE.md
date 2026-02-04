# CivixAI Backend - Sign Up Integration Guide

## Overview
This guide walks you through setting up the Node.js + Firebase backend for the CivixAI sign-up process.

## Project Structure
```
backend/
├── config/
│   └── firebase.js          # Firebase admin initialization
├── routes/
│   └── auth.js              # Authentication endpoints
├── utils/
│   └── validation.js        # Input validation utilities
├── server.js                # Express server setup
├── package.json             # Dependencies
└── .env.example             # Environment variables template
```

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase project (create at https://firebase.google.com)

## Setup Instructions

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the setup wizard
3. Enable Realtime Database
4. Create a service account:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file safely

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
1. Create a `.env` file in the backend folder (copy from `.env.example`)
2. Fill in your Firebase credentials:

```
PORT=5000

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

**Note:** The FIREBASE_PRIVATE_KEY needs to have actual newlines escaped as `\n`

### 4. Set Up Firebase Database Rules
Go to Firebase Console → Realtime Database → Rules and paste:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        ".validate": "newData.hasChildren(['uid', 'firstName', 'surname', 'username', 'email'])"
      }
    },
    "usernames": {
      "$username": {
        ".read": true,
        ".write": false,
        ".validate": "newData.isString()"
      }
    }
  }
}
```

### 5. Start the Backend Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### POST /api/auth/signup
Register a new user

**Request:**
```json
{
  "firstName": "John",
  "surname": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "0712345678",
  "password": "SecurePass123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "uid": "user-id",
    "firstName": "John",
    "surname": "Doe",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Username already taken"
}
```

### POST /api/auth/check-username
Check if username is available

**Request:**
```json
{
  "username": "johndoe"
}
```

**Response:**
```json
{
  "success": true,
  "available": true
}
```

### POST /api/auth/check-email
Check if email is available

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "available": true
}
```

## Frontend Integration

The frontend pages (`SignupPG.html` and `password_setup.html`) automatically:
1. Validate user input on the client side
2. Check username/email availability via the backend
3. Send complete registration data to the backend
4. Handle errors and display appropriate messages

### API Configuration
The frontend uses `API_BASE_URL = 'http://localhost:5000/api'`

If you deploy the backend to a different URL, update this in:
- `SignupPG_Script.js`
- `PasswordSetup_Script.js`

## Data Storage in Firebase

User data is stored in two locations:

### 1. User Profile (/users/{uid})
```
{
  "uid": "user-unique-id",
  "firstName": "John",
  "surname": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "0712345678",
  "createdAt": "2024-02-04T10:30:00Z",
  "lastUpdated": "2024-02-04T10:30:00Z"
}
```

### 2. Username Index (/usernames/{username})
Stores the UID for quick username lookups

## Validation Rules

### Username
- Length: 3-20 characters
- Characters: Alphanumeric, underscore, hyphen only
- Format: Converted to lowercase

### Email
- Valid email format required
- Unique across all users

### Phone (Optional)
- Sri Lanka format: +94 or 0 followed by 7 and 8 digits
- Example: 0712345678, +94712345678

### Password
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Troubleshooting

### "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### "FIREBASE_PROJECT_ID is undefined"
- Check `.env` file exists and has correct values
- Restart the server after creating `.env`

### CORS errors
The backend already has CORS enabled. Make sure:
- Frontend is accessing the correct API URL
- Backend is running on port 5000

### "Email already exists" error
Firebase Authentication and Realtime Database are being checked. The error comes from either:
1. Duplicate check in Realtime Database
2. Existing user in Firebase Authentication

## Production Deployment

Before deploying to production:

1. **Change API_BASE_URL** in frontend scripts to your production backend URL
2. **Enable HTTPS** - Update CORS origins
3. **Use environment variables** for all sensitive data
4. **Set up proper Firebase Security Rules** - Restrict access appropriately
5. **Enable Firebase Auth** - Consider additional sign-up methods
6. **Add rate limiting** - Prevent brute force attacks
7. **Enable logging and monitoring** - Use Firebase Cloud Logging

## Next Steps

1. Test the sign-up flow locally
2. Create a login page integration (using Firebase Client SDK)
3. Add email verification
4. Implement password reset functionality
5. Add user profile management endpoints

## Support

For Firebase documentation: https://firebase.google.com/docs
For Express.js documentation: https://expressjs.com
