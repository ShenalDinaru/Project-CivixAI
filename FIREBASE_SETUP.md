# Firebase Database Setup Guide for CivixAI

## Overview
Your CivixAI project now has a complete Node.js + Firebase backend setup to store user signup data (first name, surname, username, email, phone number).

## What's Been Set Up

### Backend Structure
```
backend/
├── server.js              # Express server with Firebase integration
├── package.json           # Project dependencies
├── .env.example          # Environment variables template
├── .env                  # Your local environment (create this)
├── .gitignore            # Git ignore file
├── README.md             # Backend documentation
└── node_modules/         # Dependencies (already installed)
```

### Frontend Updates
- **SignupPG_Script.js** - Updated to send user data to backend via API

## Step-by-Step Setup

### Step 1: Get Firebase Service Account Key
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your CivixAI project (or create a new one)
3. Click **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key** button
5. A JSON file will download - this is your service account key
6. Save this file as `serviceAccountKey.json` in the `backend` folder

### Step 2: Create .env File
1. In the `backend` folder, create a file named `.env`
2. Copy content from `.env.example`:
```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
PORT=3000
NODE_ENV=development
```

### Step 3: Install Node Dependencies
Run this command in the backend folder:
```bash
cd backend
npm install
```

### Step 4: Start the Backend Server
```bash
npm start
```

You should see:
```
🚀 CivixAI backend listening on port 3000
📡 Health check: http://localhost:3000/health
📝 Signup endpoint: POST http://localhost:3000/api/signup
```

### Step 5: Test the Connection
Open your browser and visit: `http://localhost:3000/health`
You should see: `{ "status": "Backend is running" }`

## API Endpoints

### 1. Signup Endpoint
**URL:** `POST http://localhost:3000/api/signup`

**Request Body:**
```json
{
  "firstName": "John",
  "surname": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "+94712345678"
}
```

**Required Fields:**
- `surname` ✓
- `username` ✓
- `email` ✓

**Optional Fields:**
- `firstName`
- `phone`

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "userId": "john@example.com"
}
```

**Error Responses:**
- `400` - Missing required fields or invalid format
- `409` - Email already registered or username taken
- `500` - Server error

### 2. Get User Data (Optional)
**URL:** `GET http://localhost:3000/api/user/:email`
**Example:** `http://localhost:3000/api/user/john@example.com`

## Firebase Firestore Database Structure

### Collection: `users`
Each user is stored as a document with the email (lowercase) as the document ID.

**Example Document:**
```
Document ID: john@example.com

Fields:
├── firstName: "John"
├── surname: "Doe"
├── username: "johndoe"
├── email: "john@example.com"
├── phone: "+94712345678"
├── createdAt: 2024-02-04T10:30:00Z
└── updatedAt: 2024-02-04T10:30:00Z
```

## How the Signup Flow Works

1. **Frontend (SignupPG.html):**
   - User enters: First Name, Surname, Username, Email, Phone
   - Validation checks email format and phone number

2. **Frontend sends to Backend:**
   - Makes POST request to `/api/signup`
   - Shows "Saving Details..." message

3. **Backend (server.js):**
   - Validates all required fields
   - Checks if email or username already exists in Firebase
   - Creates new user document in Firestore
   - Returns success or error response

4. **Frontend receives response:**
   - If success: Stores data in sessionStorage and redirects to password_setup.html
   - If error: Shows error message and allows user to retry

## Testing the Signup

1. Make sure backend is running (`npm start` in backend folder)
2. Open SignupPG.html in your browser
3. Fill in all the fields:
   - First Name: John
   - Surname: Doe
   - Username: johndoe
   - Email: john@example.com
   - Phone: +94712345678
4. Click "Next"
5. Check Firebase Console to see the new user document

## Common Issues & Solutions

### Issue: "Error: Unable to connect to server"
- **Solution:** Make sure backend is running on port 3000
- Run: `npm start` in the backend folder

### Issue: "Firebase Admin initialization failed"
- **Solution:** Ensure `serviceAccountKey.json` exists in backend folder
- Check that GOOGLE_APPLICATION_CREDENTIALS path is correct in .env

### Issue: "Email already registered"
- **Solution:** This means the user already exists in Firebase
- Try with a different email address

### Issue: "Username already taken"
- **Solution:** The username is unique and already exists
- Choose a different username

### Issue: Port 3000 is already in use
- **Solution:** Change PORT in .env file or kill the process using port 3000
- Or use: `netstat -ano | findstr :3000` to find and kill the process

## Security Reminders

1. **Keep serviceAccountKey.json secret** - Never commit to Git or share publicly
2. **Use HTTPS in production** - Not needed for localhost development
3. **Validate all inputs** - Both frontend and backend should validate
4. **Implement rate limiting** - Prevent signup abuse (add later if needed)
5. **Never log sensitive data** - Don't log passwords or tokens

## Next Steps

After signup data is stored:
1. Create password_setup.html page to set password
2. Add login functionality to verify credentials
3. Create session/authentication system
4. Implement email verification (optional but recommended)
5. Add password reset functionality

## File Structure Summary

- **SignupPG.html** - Frontend signup form
- **SignupPG_Script.js** - Form handling and API calls
- **backend/server.js** - API server
- **backend/package.json** - Dependencies
- **Firebase Firestore** - Cloud database
- **backend/serviceAccountKey.json** - Firebase credentials (keep secret!)

## Need Help?

- Check browser console for errors (F12 → Console)
- Check terminal for backend logs
- Check Firebase Console → Database → Users collection
- Review backend/README.md for more details
